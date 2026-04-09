/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PARDONNED_DB: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
