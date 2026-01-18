import { build as esbuild } from "esbuild";
import { build as viteBuild, InlineConfig } from "vite";
import { rm, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... (allowlist lieka tas pats)

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  
  const viteConfig: InlineConfig = {
    root: path.resolve(__dirname, "..", "client"), // Šaknis nukreipta į 'client'
    build: {
      outDir: path.resolve(__dirname, "..", "dist", "public"),
      emptyOutDir: true,
      rollupOptions: {
        // PAKEITIMAS: nurodykite tik failo pavadinimą
        input: path.resolve(__dirname, "..", "client", "index.html"),
        // ARBA tiesiog: input: "index.html",
      },
    },
  };
  
  await viteBuild(viteConfig);

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
