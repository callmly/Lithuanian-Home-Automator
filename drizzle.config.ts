import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Naudojame ! (non-null assertion), nes tikimės, kad Coolify jį paduos
    url: process.env.DATABASE_URL!, 
  },
});
