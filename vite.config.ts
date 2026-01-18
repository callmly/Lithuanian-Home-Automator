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
      // Nurodome kelius nuo pagrindinio katalogo
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  // Svarbu: Pašalinome "root: 'client'". 
  // Dabar Vite veiks iš projekto šaknies (/app).
  build: {
    // Buildas eis tiesiai į dist/public (nebereikia išeiti atgal su "..")
    outDir: "dist/public",
    emptyOutDir: true,
    rollupOptions: {
      // SVARBU: Nurodome santykinį kelią iki failo.
      // Vite ieškos failo "client/index.html" pradedant nuo "/app"
      input: "client/index.html",
    },
  },
});
