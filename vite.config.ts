import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
      // SVARBU: Šis alias leidžia index.html failui rasti main.tsx, 
      // nes dabar root yra pagrindinis katalogas
      "/src": path.resolve(__dirname, "client", "src"),
    },
  },
  // Root nustatymo nebėra - naudojame numatytąjį (projektas)
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      // SVARBU: Nurodome tikslų absoliutų kelią iki failo
      input: path.resolve(__dirname, "client", "index.html"),
    },
  },
});
