import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  // 1. ŠAKNIS: Nurodome veikti pagrindiniame /app kataloge
  root: process.cwd(),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
      // 2. SVARBU: Kadangi root dabar yra /app, turime pasakyti, kur yra /src
      "/src": path.resolve(__dirname, "client/src"),
    },
  },
  build: {
    // Buildas eina į dist/public
    outDir: "dist/public",
    emptyOutDir: true,
    rollupOptions: {
      // 3. ĮVESTIS: Nurodome griežtą, absoliutų kelią iki failo.
      // Jokių spėliojimų.
      input: path.resolve(__dirname, "client/index.html"),
    },
  },
});
