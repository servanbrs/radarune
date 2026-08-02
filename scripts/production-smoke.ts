import "dotenv/config";

const baseUrl = process.env.SMOKE_BASE_URL ?? process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 10_000);

if (!baseUrl) {
  console.error("SMOKE_BASE_URL veya APP_URL tanımlanmalıdır.");
  process.exit(1);
}

let origin: URL;
try {
  origin = new URL(baseUrl);
} catch {
  console.error("Smoke URL geçersiz.");
  process.exit(1);
}

if (origin.protocol !== "http:" && origin.protocol !== "https:") {
  console.error("Smoke URL http veya https olmalıdır.");
  process.exit(1);
}

async function check(pathname: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(new URL(pathname, origin), {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`${pathname} HTTP ${response.status}: ${body.slice(0, 160)}`);
    }
    console.log(`${pathname} OK (${response.status})`);
  } finally {
    clearTimeout(timer);
  }
}

try {
  await check("/api/health/live");
  await check("/api/health/ready");
  console.log("Production smoke başarılı.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Production smoke başarısız.");
  process.exitCode = 1;
}
