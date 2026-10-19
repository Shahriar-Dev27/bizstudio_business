import { cp, mkdir, lstat, realpath, symlink } from "node:fs/promises";
import { resolve, join, sep } from "node:path";
import { spawn } from "node:child_process";
const root = resolve(import.meta.dirname, ".."),
  target = join(root, ".agency", "chat-improvements", "build");
if (!target.startsWith(root + sep))
  throw new Error("Build target must stay in this workspace.");
await mkdir(target, { recursive: true });
for (const name of [
  "app",
  "components",
  "hooks",
  "lib",
  "types",
  "public",
  "tests",
  "netlify",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "next-env.d.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
]) {
  await cp(join(root, name), join(target, name), {
    recursive: true,
    force: true,
  });
}
const modules = join(target, "node_modules");
try {
  await lstat(modules);
} catch {
  await symlink(
    join(root, "node_modules"),
    modules,
    process.platform === "win32" ? "junction" : "dir",
  );
}
if ((await realpath(modules)) !== (await realpath(join(root, "node_modules"))))
  throw new Error("Unexpected build dependency target.");
// An isolated source copy protects the running development server and user-edited Next generated files.
const child = spawn(
  process.execPath,
  [join(root, "node_modules/next/dist/bin/next"), "build"],
  {
    cwd: target,
    stdio: "inherit",
    windowsHide: true,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
