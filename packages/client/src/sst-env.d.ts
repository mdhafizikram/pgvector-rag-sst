/// <reference types="vite/client" />
  interface ImportMetaEnv {
    readonly VITE_DPL_API_DOMAIN: string
  readonly VITE_LAMBDA_API_DOMAIN: string
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }