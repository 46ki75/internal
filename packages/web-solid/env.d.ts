/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STAGE_NAME?: "dev" | "stg" | "prod";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
