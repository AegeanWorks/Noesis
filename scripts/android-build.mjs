import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const android = join(root, "android");
const isWindows = process.platform === "win32";

function sdkCandidates() {
  const candidates = [];
  if (process.env.ANDROID_HOME) candidates.push(process.env.ANDROID_HOME);
  if (process.env.ANDROID_SDK_ROOT) candidates.push(process.env.ANDROID_SDK_ROOT);
  if (isWindows) {
    if (process.env.LOCALAPPDATA) {
      candidates.push(join(process.env.LOCALAPPDATA, "Android", "Sdk"));
    }
    if (process.env.USERPROFILE) {
      candidates.push(join(process.env.USERPROFILE, "AppData", "Local", "Android", "Sdk"));
    }
  } else {
    if (process.env.HOME) candidates.push(join(process.env.HOME, "Android", "Sdk"));
    if (process.platform === "darwin" && process.env.HOME) {
      candidates.push(join(process.env.HOME, "Library", "Android", "sdk"));
    }
  }
  return candidates;
}

function findSdk() {
  return sdkCandidates().find((candidate) => candidate && existsSync(candidate)) ?? null;
}

function javaMajor(javaHome) {
  if (!javaHome) return null;
  const java = join(javaHome, "bin", isWindows ? "java.exe" : "java");
  if (!existsSync(java)) return null;
  const result = spawnSync(java, ["-version"], { encoding: "utf8" });
  const text = `${result.stderr ?? ""}${result.stdout ?? ""}`;
  const match = text.match(/version "(?:1\.)?(\d+)/);
  return match ? Number(match[1]) : null;
}

function javaCandidates() {
  const candidates = [];
  if (process.env.JAVA_HOME) candidates.push(process.env.JAVA_HOME);
  const studioJbr = isWindows
    ? "C:\\Program Files\\Android\\Android Studio\\jbr"
    : "/Applications/Android Studio.app/Contents/jbr/Contents/Home";
  if (existsSync(join(studioJbr, "bin"))) candidates.push(studioJbr);
  const roots = isWindows
    ? [
        "C:\\Program Files\\Eclipse Adoptium",
        "C:\\Program Files\\Microsoft",
        "C:\\Program Files\\Java",
        process.env.USERPROFILE ? join(process.env.USERPROFILE, ".jdks") : null,
      ]
    : [
        "/Library/Java/JavaVirtualMachines",
        "/usr/lib/jvm",
        process.env.HOME ? join(process.env.HOME, ".jdks") : null,
      ];
  for (const root of roots) {
    if (!root || !existsSync(root)) continue;
    for (const entry of readdirSync(root)) {
      const candidate = join(root, entry);
      if (existsSync(join(candidate, "bin"))) candidates.push(candidate);
      if (existsSync(join(candidate, "Contents", "Home", "bin"))) {
        candidates.push(join(candidate, "Contents", "Home"));
      }
    }
  }
  return candidates;
}

function findJava21() {
  return javaCandidates().find((candidate) => javaMajor(candidate) === 21) ?? null;
}

function step(label, command, args, options = {}) {
  console.log(`\n[android] ${label}`);
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    stdio: "inherit",
    env: { ...process.env, ...options.env },
    shell: options.shell ?? false,
  });
  if (result.error) {
    throw new Error(`${label} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

function main() {
  if (!existsSync(android)) {
    console.error("Error: android/ does not exist.");
    console.error("Why: the native shell has not been generated.");
    console.error("Fix: run `npx cap add android` once, then retry `npm run android:build`.");
    process.exit(2);
  }

  const sdk = findSdk();
  if (!sdk) {
    console.error("Error: Android SDK not found.");
    console.error("Why: Gradle needs the SDK to compile the app.");
    console.error("Fix: install Android Studio or set ANDROID_HOME, then retry.");
    process.exit(2);
  }

  const javaHome = findJava21();
  if (!javaHome) {
    console.error("Error: JDK 21 not found.");
    console.error("Why: Capacitor 7 compiles its Android library with Java 21; Java 17 fails with invalid source release: 21.");
    console.error("Fix: install Temurin JDK 21 or set JAVA_HOME to a JDK 21 installation, then retry.");
    process.exit(2);
  }

  writeFileSync(join(android, "local.properties"), `sdk.dir=${sdk.replaceAll("\\", "/")}\n`);
  const env = { ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk, JAVA_HOME: javaHome };

  const assets = join(android, "app", "src", "main", "assets");
  try {
    step("web build", isWindows ? "npm.cmd" : "npm", ["run", "build"], { shell: true });
    step("cap sync", isWindows ? "npx.cmd" : "npx", ["cap", "sync", "android"], {
      shell: true,
      env,
    });
    step(
      "gradle assembleDebug",
      isWindows ? ".\\gradlew.bat" : "./gradlew",
      ["assembleDebug", "--no-daemon"],
      { cwd: android, shell: isWindows, env },
    );

    const apk = join(android, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
    if (!existsSync(apk)) {
      throw new Error(`Gradle finished but ${apk} is missing`);
    }
    console.log(`\n[android] APK ready: ${apk}`);
  } finally {
    rmSync(join(assets, "public"), { recursive: true, force: true });
    rmSync(join(assets, "capacitor.config.json"), { force: true });
    rmSync(join(assets, "capacitor.plugins.json"), { force: true });
    console.log("[android] cleaned generated web assets; `npm run android:open` re-syncs them.");
  }
}

try {
  main();
} catch (error) {
  console.error(`\n[android] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
