import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { chromium } from "playwright";

const storageStatePath = resolve(
  process.env.ONERPM_STORAGE_STATE_PATH?.trim() ||
    ".radarune-private/onerpm/storage-state.json",
);

function timestamp() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

async function main() {
  const outputDirectory = resolve(
    ".radarune-private/onerpm/inspection",
    timestamp(),
  );

  await mkdir(outputDirectory, {
    recursive: true,
    mode: 0o700,
  });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 30,
  });

  const context = await browser.newContext({
    storageState: storageStatePath,
    viewport: {
      width: 1440,
      height: 1000,
    },
  });

  const page = await context.newPage();

  await page.goto("https://dashboard.onerpm.com/", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  const readline = createInterface({
    input,
    output,
  });

  try {
    console.log("");
    console.log("ONErpm yayın formu inceleme modu");
    console.log("--------------------------------");
    console.log(
      "Açılan tarayıcıda manuel olarak Yeni Yayın / Create Release ekranına gidin.",
    );
    console.log("Yayın göndermeyin ve gerçek dosya yüklemeyin.");
    console.log("");

    await readline.question(
      "Yeni yayın formu tamamen açılınca ENTER tuşuna basın...",
    );

    await page.waitForTimeout(1_500);

    const formInventory = await page.evaluate(() => {
      const cleanText = (value: string | null | undefined): string | null => {
        const normalized = value ? value.replace(/\\s+/g, " ").trim() : "";

        return normalized.length > 0 ? normalized : null;
      };

      const inputElements = Array.from(
        document.querySelectorAll<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >("input, textarea, select"),
      );

      const inputs = inputElements.map((element, index) => {
        let labelText: string | null = null;

        if (element.id) {
          const labelElement = document.querySelector(
            `label[for="${CSS.escape(element.id)}"]`,
          );

          labelText = cleanText(labelElement?.textContent);
        }

        if (!labelText) {
          labelText = cleanText(element.closest("label")?.textContent);
        }

        return {
          index,
          tag: element.tagName.toLowerCase(),
          type: element instanceof HTMLInputElement ? element.type : null,
          id: element.id || null,
          name: element.getAttribute("name"),
          placeholder: element.getAttribute("placeholder"),
          ariaLabel: element.getAttribute("aria-label"),
          label: labelText,
          required: element.hasAttribute("required"),
          disabled:
            element.hasAttribute("disabled") ||
            element.getAttribute("aria-disabled") === "true",
          value:
            element instanceof HTMLInputElement && element.type === "password"
              ? null
              : element.value || null,
        };
      });

      const buttonElements = Array.from(
        document.querySelectorAll<HTMLElement>('button, [role="button"], a'),
      );

      const buttons = buttonElements
        .map((element, index) => ({
          index,
          tag: element.tagName.toLowerCase(),
          text: cleanText(element.textContent),
          ariaLabel: element.getAttribute("aria-label"),
          title: element.getAttribute("title"),
          href: element instanceof HTMLAnchorElement ? element.href : null,
          disabled:
            element.hasAttribute("disabled") ||
            element.getAttribute("aria-disabled") === "true",
        }))
        .filter(
          (item) =>
            Boolean(item.text) ||
            Boolean(item.ariaLabel) ||
            Boolean(item.title),
        );

      const headings = Array.from(
        document.querySelectorAll<HTMLElement>("h1, h2, h3, h4, legend"),
      )
        .map((element) => cleanText(element.textContent))
        .filter((value): value is string => value !== null);

      return {
        capturedAt: new Date().toISOString(),
        url: window.location.href,
        title: document.title,
        headings,
        inputs,
        buttons,
      };
    });

    await page.screenshot({
      path: resolve(outputDirectory, "release-form.png"),
      fullPage: true,
    });

    await writeFile(
      resolve(outputDirectory, "form-inventory.json"),
      JSON.stringify(formInventory, null, 2),
      {
        encoding: "utf8",
        mode: 0o600,
      },
    );

    await writeFile(
      resolve(outputDirectory, "page-url.txt"),
      `${page.url()}\n`,
      {
        encoding: "utf8",
        mode: 0o600,
      },
    );

    console.log("");
    console.log("✅ ONErpm yayın formu analiz edildi.");
    console.log(`Klasör: ${outputDirectory}`);
    console.log("");
    console.log("Buraya yalnızca şu dosyayı yükleyin:");
    console.log(`${outputDirectory}/form-inventory.json`);
    console.log("");
    console.log(
      "storage-state.json veya session-metadata.json dosyalarını paylaşmayın.",
    );
  } finally {
    readline.close();
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? `❌ ${error.message}`
      : "❌ ONErpm form inceleme hatası.",
  );

  process.exitCode = 1;
});
