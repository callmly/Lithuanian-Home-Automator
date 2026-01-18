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
    },
  },
  // Nustatome, kad Vite "namai" yra client aplankas
  root: 'client', 
  build: {
    // Išeiname vienu lygiu atgal (..) ir tada į dist/public
    outDir: '../dist/public',
    emptyOutDir: true,
    rollupOptions: {
      // SVARBU: Čia rašome tik failo pavadinimą. 
      // Jokių path.resolve, jokių /app/client...
      input: 'index.html',
    },
  },
});
