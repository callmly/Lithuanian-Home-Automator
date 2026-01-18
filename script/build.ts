import { build as esbuild } from "esbuild";
import { build as viteBuild, InlineConfig } from "vite";
import { rm, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// BŪTINA: Čia įkopijuokite savo allowlist masyvą iš senojo failo, jei tokį turėjote.
// Jei nežinote, palikite tuščią arba įrašykite paketus, kurių nereikia įtraukti į externals.
const allowlist: string[] = []; 

async function buildAll() {
  // Išvalome dist katalogą
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  
  const viteConfig: InlineConfig = {
    // Nurodome, kad šaknis yra client aplankas (vienu lygiu aukščiau nuo script aplanko)
    root: path.resolve(__dirname, "..", "client"),
    build: {
      outDir: path.resolve(__dirname, "..", "dist", "public"),
      emptyOutDir: true,
      rollupOptions: {
        // PATAISYMAS: Čia irgi nurodome tik "index.html", nes root jau yra client
        input: "index.html",
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
  
  // Filtruojame priklausomybes
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
