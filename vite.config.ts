import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  // Nustatome šaknį į client. Vite viską skaičiuos nuo ten.
  root: "client",
  resolve: {
    alias: {
      // Keliai vis tiek skaičiuojami nuo šio failo buvimo vietos (__dirname = /app)
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  build: {
    // Išeiname iš "client" atgal į root (..) ir į dist
    outDir: "../dist/public",
    emptyOutDir: true,
    // Svarbu: JOKIŲ rollupOptions.input. Vite pati ras index.html client aplanke.
  },
});
