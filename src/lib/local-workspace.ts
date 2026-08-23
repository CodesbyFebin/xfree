import type { StudioFile } from "./studio/types";

interface BrowserFileSystemFileHandle {
  kind: "file";
  name: string;
  getFile(): Promise<File>;
}

interface BrowserFileSystemDirectoryHandle {
  kind: "directory";
  name: string;
  values(): AsyncIterableIterator<BrowserFileSystemFileHandle | BrowserFileSystemDirectoryHandle>;
}

interface DirectoryPickerWindow extends Window {
  showDirectoryPicker?: (options?: { id?: string; mode?: "read" | "readwrite" }) => Promise<BrowserFileSystemDirectoryHandle>;
}

export interface LocalWorkspaceSnapshot {
  directoryName: string;
  files: StudioFile[];
  skippedFiles: number;
  totalBytes: number;
}

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "json", "jsonl", "csv", "tsv", "xml", "html", "htm", "css", "scss", "js", "jsx", "mjs", "cjs", "ts", "tsx", "py", "go", "rs", "java", "kt", "kts", "rb", "php", "sh", "bash", "zsh", "fish", "yaml", "yml", "toml", "ini", "conf", "log", "sql", "graphql", "gql", "proto", "dockerfile", "env",
]);

function looksTextLike(file: File): boolean {
  if (file.type.startsWith("text/")) return true;
  if (["application/json", "application/xml", "application/javascript"].includes(file.type)) return true;
  const name = file.name.toLowerCase();
  if (name === "dockerfile" || name === "makefile") return true;
  const extension = name.includes(".") ? name.split(".").pop() || "" : "";
  return TEXT_EXTENSIONS.has(extension);
}

export function canPickLocalDirectory(): boolean {
  return typeof window !== "undefined" && typeof (window as DirectoryPickerWindow).showDirectoryPicker === "function";
}

export async function pickLocalWorkspace(options: { maxFiles?: number; maxFileBytes?: number; maxTotalBytes?: number } = {}): Promise<LocalWorkspaceSnapshot> {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
  if (!picker) throw new Error("Folder access is not supported by this browser.");

  const maxFiles = Math.max(1, Math.min(200, options.maxFiles ?? 60));
  const maxFileBytes = Math.max(1024, options.maxFileBytes ?? 1_000_000);
  const maxTotalBytes = Math.max(maxFileBytes, options.maxTotalBytes ?? 8_000_000);
  const root = await picker({ id: "xfree-agent-workspace", mode: "read" });
  const files: StudioFile[] = [];
  let skippedFiles = 0;
  let totalBytes = 0;

  const walk = async (directory: BrowserFileSystemDirectoryHandle, prefix = "") => {
    for await (const handle of directory.values()) {
      if (files.length >= maxFiles || totalBytes >= maxTotalBytes) { skippedFiles += 1; continue; }
      const relativeName = prefix ? `${prefix}/${handle.name}` : handle.name;
      if (handle.kind === "directory") {
        await walk(handle, relativeName);
        continue;
      }

      const file = await handle.getFile();
      if (!looksTextLike(file) || file.size > maxFileBytes || totalBytes + file.size > maxTotalBytes) {
        skippedFiles += 1;
        continue;
      }

      files.push({
        id: crypto.randomUUID(),
        name: relativeName,
        size: file.size,
        type: file.type || "text/plain",
        content: await file.text(),
      });
      totalBytes += file.size;
    }
  };

  await walk(root);
  return { directoryName: root.name, files, skippedFiles, totalBytes };
}
