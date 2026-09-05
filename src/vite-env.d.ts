/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADSENSE_TOOL_SLOT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
