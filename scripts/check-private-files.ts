import { execFileSync } from "node:child_process";

const trackedFiles = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const forbidden = trackedFiles.filter((file) => {
  if (file === ".env.example" || file === ".env.production.example") return false;
  return (
    file === ".env" ||
    file.startsWith(".env.") ||
    file.startsWith(".radarune-private/") ||
    file.startsWith(".radarune-backups/") ||
    file.startsWith("storage/") ||
    file.endsWith(".pem") ||
    file.endsWith(".key") ||
    file.endsWith(".p12") ||
    file.endsWith(".pfx")
  );
});

if (forbidden.length > 0) {
  console.error("Private veya secret dosyalar Git tarafından takip ediliyor:");
  for (const file of forbidden) console.error(`- ${file}`);
  process.exit(1);
}

console.log(`Private file guard başarılı (${trackedFiles.length} tracked dosya).`);
