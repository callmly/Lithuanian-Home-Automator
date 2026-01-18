import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  // Svarbiausia dalis: nurodome, kad Vite "namai" yra client aplankas.
  // Vite automatiškai ieškos index.html failo ten.
  root: 'client',
  resolve: {
    alias: {
      // Aliasai turi rodyti pilną kelią nuo projekto šaknies
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  build: {
    // Kadangi esame 'client' aplanke, turime išeiti vienu lygiu atgal (..)
    outDir: '../dist/public',
    emptyOutDir: true,
    // SVARBU: Ištryniau 'rollupOptions' su 'input'.
    // Tai išspręs EISDIR klaidą, nes Vite naudos standartinį elgesį.
  },
});
