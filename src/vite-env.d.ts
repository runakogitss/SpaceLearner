/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_OPENROUTER_API_KEY: string;
  readonly VITE_OPENROUTER_SITE_NAME: string;
  readonly VITE_OPENROUTER_SITE_URL: string;
  readonly VITE_ENABLE_SANDBOX_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
