import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { chromium } from "playwright";

const storageStatePath = resolve(
  process.env.ONERPM_STORAGE_STATE_PATH?.trim() ||
    ".radarune-private/onerpm/storage-state.json",
);

const checkUrl =
  process.env.ONERPM_SESSION_CHECK_URL?.trim() || "https://accounts.onerpm.com";

async function main() {
  await access(storageStatePath);

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    storageState: storageStatePath,
    viewport: {
      width: 1440,
      height: 960,
    },
  });

  const page = await context.newPage();

  await page.goto(checkUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  console.log("");
  console.log(`Açılan adres: ${page.url()}`);
  console.log("");
  console.log("ONErpm paneli giriş istemeden açıldıysa oturum geçerlidir.");

  const readline = createInterface({
    input,
    output,
  });

  try {
    await readline.question("Kontrol tamamlandıysa ENTER tuşuna basın...");
  } finally {
    readline.close();
    await browser.close();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : "Bilinmeyen oturum kontrol hatası.";

  console.error("");
  console.error(`❌ ${message}`);
  console.error("Önce npm run onerpm:session:capture komutunu çalıştırın.");

  process.exitCode = 1;
});
