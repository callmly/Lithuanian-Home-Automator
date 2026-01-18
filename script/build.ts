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
  
  // SPRENDIMAS:
  // Mes nurodome failą tiesiai CLI argumentuose.
  // Tai apeina bet kokius "root" spėliojimus.
  // --config nurodo kur yra konfigūracija.
  // client/index.html yra įvestis.
  // --outDir nurodo kur dėti rezultatą.
  try {
    const rootDir = path.resolve(__dirname, "..");
    const configFile = path.resolve(rootDir, "vite.config.ts");
    
    // Vykdome iš pagrindinio katalogo (/app)
    execSync(`npx vite build client/index.html --config ${configFile} --outDir dist/public --emptyOutDir`, { 
      stdio: "inherit", 
      cwd: rootDir 
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
