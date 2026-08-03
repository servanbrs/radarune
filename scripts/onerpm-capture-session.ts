import { chmod, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { chromium } from "playwright";

const loginUrl =
  process.env.ONERPM_LOGIN_URL?.trim() || "https://accounts.onerpm.com/login";

const storageStatePath = resolve(
  process.env.ONERPM_STORAGE_STATE_PATH?.trim() ||
    ".radarune-private/onerpm/storage-state.json",
);

const metadataPath = resolve(
  process.env.ONERPM_SESSION_METADATA_PATH?.trim() ||
    ".radarune-private/onerpm/session-metadata.json",
);

async function main() {
  await mkdir(dirname(storageStatePath), {
    recursive: true,
    mode: 0o700,
  });

  await mkdir(dirname(metadataPath), {
    recursive: true,
    mode: 0o700,
  });

  console.log("");
  console.log("ONErpm güvenli oturum bağlantısı");
  console.log("--------------------------------");
  console.log("1. Açılan tarayıcıda ONErpm hesabına giriş yapın.");
  console.log("2. ONErpm 2FA kodunu isterse kodu tarayıcıya girin.");
  console.log("3. Hesap paneli tamamen açıldıktan sonra terminale dönün.");
  console.log("");
  console.log("Radarune şifreyi veya 2FA kodunu okumaz ve saklamaz.");
  console.log("");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  });

  const context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 960,
    },
  });

  const page = await context.newPage();

  await page.goto(loginUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  const readline = createInterface({
    input,
    output,
  });

  try {
    await readline.question("Giriş ve 2FA tamamlandıysa ENTER tuşuna basın...");

    const currentUrl = page.url();

    if (currentUrl.includes("/login")) {
      const answer = await readline.question(
        "Tarayıcı hâlâ giriş sayfasında görünüyor. Yine de oturum kaydedilsin mi? (e/h): ",
      );

      if (answer.trim().toLowerCase() !== "e") {
        throw new Error("Oturum kaydı kullanıcı tarafından iptal edildi.");
      }
    }

    await context.storageState({
      path: storageStatePath,
    });

    const connectedAt = new Date();

    const metadata = {
      provider: "ONE_RPM",
      status: "CONNECTED",
      storageStatePath,
      connectedAt: connectedAt.toISOString(),
      lastCheckedAt: connectedAt.toISOString(),
      expiresAt: null,
      lastError: null,
      capturedFromUrl: currentUrl,
    };

    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), {
      encoding: "utf8",
      mode: 0o600,
    });

    await chmod(storageStatePath, 0o600);
    await chmod(metadataPath, 0o600);

    console.log("");
    console.log("✅ ONErpm oturumu kaydedildi.");
    console.log(`Oturum: ${storageStatePath}`);
    console.log(`Metadata: ${metadataPath}`);
    console.log("");
    console.log("Bu dosyalar hassastır ve GitHub'a gönderilmemelidir.");
  } finally {
    readline.close();
    await browser.close();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Bilinmeyen ONErpm oturum hatası.";

  console.error("");
  console.error(`❌ ${message}`);
  process.exitCode = 1;
});
