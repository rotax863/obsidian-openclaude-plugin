const fs = require("fs");
const path = require("path");

const production = process.argv[2] === "production";

function build() {
  const esbuild = require("esbuild");

  esbuild.build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    outfile: "main.js",
    external: ["obsidian"],
    format: "cjs",
    platform: "node",
    sourcemap: production ? false : "inline",
    watch: {
      onRebuild(error, result) {
        if (error) console.error("watch build failed:", error);
        else console.log("watch build succeeded:", result);
      },
    },
  }).catch(() => process.exit(1));
}

build();