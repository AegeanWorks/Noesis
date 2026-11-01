import { spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";

function run(label, command, args, shell = false) {
  console.log(`\n[test] ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell,
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  if (result.error) {
    throw new Error(`${label} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

try {
  const python = process.env.PYTHON ?? (isWindows ? "python" : "python3");
  run("review (Python)", python, [
    "-m",
    "unittest",
    "discover",
    "-s",
    "tests",
    "-t",
    ".",
  ]);
  run("app (Vitest)", isWindows ? "npm.cmd" : "npm", ["test"], true);
  console.log("\n[test] all suites passed");
} catch (error) {
  console.error(`\n[test] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
