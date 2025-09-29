declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_APP_URL?: string;
    DATABASE_URL?: string;
    COINGECKO_API_KEY?: string;
  }
}
