/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_OPENROUTER_API_KEY: string;
  readonly VITE_OPENROUTER_SITE_NAME: string;
  readonly VITE_OPENROUTER_SITE_URL: string;
  readonly VITE_ENABLE_SANDBOX_MODE: string;
  readonly VITE_AI_ACTIVE_PROVIDER: string;
  readonly VITE_AI_PROVIDER_OPENROUTER_BASE_URL: string;
  readonly VITE_AI_PROVIDER_OPENROUTER_MODEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
