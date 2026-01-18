import { build as esbuild } from "esbuild";
import { rm, readFile } from "fs/promises";
import { execSync } from "child_process";
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
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  
  // 1. Apibrėžiame kelius
  const rootDir = path.resolve(__dirname, "..");
  const clientDir = path.resolve(rootDir, "client");
  const configFile = path.resolve(rootDir, "vite.config.ts");

  // 2. Paleidžiame Vite build BŪDAMI client aplanke.
  // Tai priverčia Vite elgtis taip, lyg tai būtų paprastas React projektas.
  // -c nurodo, kur yra konfigūracija (šakniniame kataloge).
  try {
    execSync(`npx vite build -c ${configFile}`, { 
      stdio: "inherit", 
      cwd: clientDir // ŠTAI RAKTAS: mes "įeiname" į client aplanką
    });
  } catch (error) {
    console.error("Vite build failed");
    process.exit(1);
  }

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
