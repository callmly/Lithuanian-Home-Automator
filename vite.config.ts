import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // ... plugins ir alias ...
  root: path.resolve(__dirname, "client"), // Šaknis nustatyta čia
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: "index.html", // Čia TIK failo pavadinimas (santykinis nuo root)
    },
  },
});
