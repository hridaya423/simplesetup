const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

async function main() {
  const outDir = path.join(__dirname, "..", "dist");
  fs.mkdirSync(outDir, { recursive: true });

  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, "..", "cli", "index.ts")],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    outfile: path.join(outDir, "cli.cjs"),
    external: ["neo-blessed"],
    define: {
      "import.meta.url": "__filename",
    },
    resolveExtensions: [".ts", ".js", ".json"],
    loader: {
      ".ts": "ts",
    },
    minify: false,
    sourcemap: false,
    metafile: true,
  });

  // Make executable
  fs.chmodSync(path.join(outDir, "cli.cjs"), 0o755);

  // Write a package.json for the dist folder so pkg can read it
  const distPkg = {
    name: "simplesetup",
    version: require("../package.json").version,
    bin: { simplesetup: "cli.cjs" },
    pkg: {
      assets: ["../node_modules/neo-blessed/**/*"],
      targets: ["node20-macos-arm64", "node20-macos-x64", "node20-linux-x64", "node20-linux-arm64", "node20-win-x64"],
      outputPath: "bin",
    },
  };
  fs.writeFileSync(path.join(outDir, "package.json"), JSON.stringify(distPkg, null, 2));

  console.log("CLI bundle written to dist/cli.cjs");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
