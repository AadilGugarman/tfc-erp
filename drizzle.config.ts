import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/drizzle-schema.ts',
  out: './src-tauri/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './src-tauri/fruit-market-erp.sqlite',
  },
});