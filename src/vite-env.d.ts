/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_MODE: 'fixture' | 'bff';
  readonly VITE_BFF_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
