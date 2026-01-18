import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite"; // Pašalinau InlineConfig, nes naudosime failą
import { rm, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  // 1. Išvalome dist katalogą
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  
  // 2. Paleidžiame Vite Build
  // Svarbu: Nurodome naudoti egzistuojantį vite.config.ts failą, 
  // bet "perrašome" input kelią į absoliutų, kad tikrai rastų failą.
  await viteBuild({
    configFile: path.resolve(__dirname, "..", "vite.config.ts"),
    build: {
      rollupOptions: {
        // Čia naudojame absoliutų kelią, kad išvengtume "UNRESOLVED_ENTRY" klaidos
        input: path.resolve(__dirname, "..", "client", "index.html"),
      },
    },
  });

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
