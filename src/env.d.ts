/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PARDONNED_API_HOST: string;
  readonly PARDONNED_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
