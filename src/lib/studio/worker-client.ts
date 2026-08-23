import type { WorkerRequest, WorkerResponse, WorkerTask } from "./worker-types";
import { executeWorkerTask } from "./worker-executor";

let worker: Worker | null = null;
const pending = new Map<string, { resolve: (value: string) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./heavy.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      const item = pending.get(data.id); if (!item) return;
      clearTimeout(item.timer); pending.delete(data.id);
      data.error ? item.reject(new Error(data.error)) : item.resolve(data.result ?? "");
    };
    worker.onerror = () => {
      pending.forEach(({ reject, timer }) => { clearTimeout(timer); reject(new Error("Local worker failed")); });
      pending.clear(); worker?.terminate(); worker = null;
    };
  }
  return worker;
}

export function runWorker(task: WorkerTask, input: string, algorithm?: AlgorithmIdentifier): Promise<string> {
  // Browsers keep heavy work off the main thread. Node-based CI does not expose
  // the browser Worker API, so execute the exact same pure task implementation
  // directly instead of using a mock or skipping recipe execution.
  if (typeof Worker === "undefined") return executeWorkerTask(task, input, algorithm);

  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => { pending.delete(id); reject(new Error("Local processing timed out")); }, 30_000);
    pending.set(id, { resolve, reject, timer });
    const request: WorkerRequest = { id, task, payload: { input, algorithm } };
    getWorker().postMessage(request);
  });
}
