#!/usr/bin/env node
// One-click launcher for Noesis: installs dependencies when missing, starts the Vite
// dev server and opens the app in the default browser. Node standard library only.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VITE_BIN = join(ROOT, "node_modules", "vite", "bin", "vite.js");
const MIN_NODE = "20.19";

export function parseStartArgs(argv) {
  const options = { open: true, check: false, help: false, port: null, host: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--check") {
      options.check = true;
    } else if (arg === "--no-open") {
      options.open = false;
    } else if (arg === "--open") {
      options.open = true;
    } else if (arg === "--port" || arg.startsWith("--port=")) {
      const raw = arg === "--port" ? argv[index + 1] : arg.slice("--port=".length);
      if (arg === "--port") index += 1;
      const port = Number(raw);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(
          `--port must be an integer between 1 and 65535 (received '${raw ?? ""}')`,
        );
      }
      options.port = port;
    } else if (arg === "--host" || arg.startsWith("--host=")) {
      const host = arg === "--host" ? argv[index + 1] : arg.slice("--host=".length);
      if (arg === "--host") index += 1;
      if (!host) throw new Error("--host needs a value");
      options.host = host;
    } else if (arg === "--") {
      // npm may pass the separator; ignore it.
    } else {
      throw new Error(`Unknown argument '${arg}'`);
    }
  }
  return options;
}

export function nodeVersionOk(version) {
  const match = /^v?(\d+)\.(\d+)(?:\.|$)/.exec(String(version));
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > 20 || (major === 20 && minor >= 19);
}

export function hasDependencies(root = ROOT) {
  return existsSync(join(root, "node_modules", "vite", "bin", "vite.js"));
}

function helpText() {
  return `Noesis one-click start

Usage:
  start.cmd                     double-click on Windows
  npm start                     any platform, opens the browser
  npm start -- --no-open        start without opening a browser
  ./start.sh                    macOS / Linux

Options:
  --no-open        do not open the default browser
  --port <n>       preferred port (Vite picks the next free one)
  --host <host>    bind host (Vite default: localhost)
  --check          print prerequisites and exit
  --help, -h       show this help

Node ${MIN_NODE}+ is required. Dependencies are installed on first start.`;
}

function installDependencies() {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  console.log("[noesis] Installing dependencies (first start, this can take a minute)...");
  const result = spawnSync(npm, ["install"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) {
    console.error(`Why: npm install could not start: ${result.error.message}`);
    console.error("Fix: install Node.js from https://nodejs.org/ and try again.");
    return false;
  }
  if (result.status !== 0) {
    console.error(`Why: npm install failed with exit code ${result.status}.`);
    console.error("Fix: run `npm install` in this folder and read the first error above.");
    return false;
  }
  if (!hasDependencies()) {
    console.error("Why: dependencies were installed but the Vite binary is still missing.");
    console.error("Fix: delete node_modules and run `npm install` again.");
    return false;
  }
  return true;
}

function startServer(options) {
  const args = [VITE_BIN];
  if (options.open) args.push("--open");
  if (options.host) args.push("--host", options.host);
  if (options.port) args.push("--port", String(options.port));
  console.log("[noesis] Starting the app... press Ctrl+C to stop.");
  const child = spawn(process.execPath, args, { cwd: ROOT, stdio: "inherit" });
  child.on("error", (error) => {
    console.error(`Why: the dev server could not start: ${error.message}`);
    console.error("Fix: run `npm run dev` directly to see the full error.");
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 0;
  });
}

function main(argv) {
  let options;
  try {
    options = parseStartArgs(argv);
  } catch (error) {
    console.error(`Why: ${error instanceof Error ? error.message : String(error)}`);
    console.error("Fix: run `npm start -- --help` to see the accepted options.");
    return 2;
  }
  if (options.help) {
    console.log(helpText());
    return 0;
  }
  if (!nodeVersionOk(process.versions.node)) {
    console.error(`Why: Node ${process.versions.node} is too old; Noesis needs ${MIN_NODE}+.`);
    console.error("Fix: install the current LTS from https://nodejs.org/ and try again.");
    return 1;
  }
  if (options.check) {
    console.log(`[noesis] Node ${process.versions.node}: ok (needs ${MIN_NODE}+)`);
    console.log(
      hasDependencies()
        ? "[noesis] Dependencies: installed"
        : "[noesis] Dependencies: missing (npm install runs on start)",
    );
    console.log("[noesis] Run `npm start` to launch the app.");
    return 0;
  }
  if (!hasDependencies() && !installDependencies()) return 1;
  startServer(options);
  return 0;
}

const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  const code = main(process.argv.slice(2));
  if (code !== 0) process.exitCode = code;
}
