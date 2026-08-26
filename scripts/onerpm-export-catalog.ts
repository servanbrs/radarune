import { chmod, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";

const storageStatePath = resolve(process.env.ONERPM_STORAGE_STATE_PATH?.trim() || ".radarune-private/onerpm/storage-state.json");
const outputPath = resolve(process.env.ONERPM_CATALOG_EXPORT_PATH?.trim() || `.radarune-private/onerpm/catalog-export-${Date.now()}.json`);
const catalogUrl = "https://dashboard.onerpm.com/distribution-tools/my-catalog/manage-music";

function clean(value: string | null | undefined) { return value?.replace(/\s+/g, " ").trim() || null; }

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: storageStatePath });
  const page = await context.newPage();
  try {
    await page.goto(catalogUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(1_500);
    if (/login|sign-in|accounts\.onerpm/i.test(page.url())) throw new Error("ONErpm oturumu geçersiz. Önce npm run onerpm:session:capture çalıştırın.");
    const items = await page.locator("tr").evaluateAll((rows) => rows.map((row) => {
      const cells = Array.from(row.querySelectorAll("th,td")).map((cell) => cell.textContent?.replace(/\s+/g, " ").trim()).filter(Boolean);
      const links = Array.from(row.querySelectorAll("a")).map((link) => (link as HTMLAnchorElement).href).filter(Boolean);
      const image = row.querySelector("img") as HTMLImageElement | null;
      return { cells, links, thumbnailUrl: image?.src || null };
    }).filter((row) => row.cells.length >= 2));
    const normalized = items.map((row) => {
      const title = clean(row.cells[0]);
      const artistName = clean(row.cells[1]);
      const status = clean(row.cells[row.cells.length - 1]);
      const externalUrl = row.links.find((link) => /onerpm\.com/i.test(link)) || catalogUrl;
      return { externalId: `${title || ""}|${artistName || ""}`.toLowerCase(), title, artistName, status, externalUrl, thumbnailUrl: row.thumbnailUrl };
    }).filter((item) => item.title && item.artistName);
    const unique = [...new Map(normalized.map((item) => [item.externalId, item])).values()];
    if (!unique.length) throw new Error("ONErpm kataloğunda aktarılabilir satır bulunamadı; sayfa görünür bir katalog tablosu döndürmedi.");
    await mkdir(dirname(outputPath), { recursive: true, mode: 0o700 });
    await writeFile(outputPath, JSON.stringify({ provider: "ONE_RPM", exportedAt: new Date().toISOString(), sourceUrl: catalogUrl, items: unique }, null, 2), { encoding: "utf8", mode: 0o600 });
    await chmod(outputPath, 0o600);
    console.log(`ONErpm kataloğu dışa aktarıldı: ${outputPath}`);
    console.log(`${unique.length} kayıt hazırlandı. Bu dosya yalnızca Radarune admin import ekranına yüklenmelidir.`);
  } finally { await browser.close(); }
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "ONErpm katalog dışa aktarma başarısız."); process.exitCode = 1; });
