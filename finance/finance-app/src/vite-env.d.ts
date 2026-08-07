/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FINANCE_URL: string;
  readonly VITE_FINANCE_ANON_KEY: string;
  readonly VITE_HR_URL: string;
  readonly VITE_HR_ANON_KEY: string;
  readonly VITE_STORE_URL: string;
  readonly VITE_STORE_ANON_KEY: string;
  readonly VITE_FRONTDESK_URL: string;
  readonly VITE_FRONTDESK_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
