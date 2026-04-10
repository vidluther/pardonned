/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PARDONNED_DB: string;
  readonly PUBLIC_POSTHOG_PROJECT_TOKEN: string;
  readonly PUBLIC_POSTHOG_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
