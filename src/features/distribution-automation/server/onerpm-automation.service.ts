import "server-only";

import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { chromium, type Page } from "playwright";

import { mapCanonicalPayloadToOneRpmForm } from "@/features/distribution-automation/domain/onerpm-payload-mapper";
import { distributionJobRepository } from "@/features/distribution-hub/server/repositories/distribution-job.repository";
import { storageService } from "@/features/storage/server/services/storage.service";
import { prisma } from "@/server/prisma/prisma";

const defaultStorageStatePath = resolve(
  process.env.ONERPM_STORAGE_STATE_PATH?.trim() || ".radarune-private/onerpm/storage-state.json",
);
const screenshotDirectory = resolve(".radarune-private/onerpm/automation");
const uploadDirectory = resolve(".radarune-private/onerpm/uploads");

type AutomationJob = NonNullable<Awaited<ReturnType<typeof distributionJobRepository.findById>>>;

async function fillFirst(page: Page, labels: string[], value: string | undefined) {
  if (!value) return false;
  for (const label of labels) {
    try {
      const locator = page.getByLabel(label, { exact: false }).first();
      if (await locator.count()) {
        await locator.fill(value);
        return true;
      }
    } catch {
      // ONErpm may change its field labels between release-form versions.
    }
  }
  return false;
}

async function fillNth(page: Page, labels: string[], index: number, value: string | undefined) {
  if (!value) return false;
  for (const label of labels) {
    try {
      const locator = page.getByLabel(label, { exact: false });
      if (await locator.count() > index) {
        await locator.nth(index).fill(value);
        return true;
      }
    } catch {
      // Best effort: a changed optional field must not discard the whole job.
    }
  }
  return false;
}

async function selectFirst(page: Page, labels: string[], value: string | undefined) {
  if (!value) return false;
  for (const label of labels) {
    try {
      const locator = page.getByLabel(label, { exact: false }).first();
      if (await locator.count()) {
        try {
          await locator.selectOption({ label: value });
        } catch {
          await locator.selectOption(value);
        }
        return true;
      }
    } catch {
      // Optional select; continue with the next known label.
    }
  }
  return false;
}

function resolveAssetUrl(value: string) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const appUrl = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (trimmed.startsWith("/") && appUrl) return new URL(trimmed, appUrl).toString();
  throw new Error("ONErpm dosya referansı güvenli bir HTTP(S) adresi değil.");
}

function extensionForContentType(contentType: string | undefined) {
  switch (contentType?.toLowerCase()) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "audio/mpeg":
      return ".mp3";
    case "audio/wav":
    case "audio/x-wav":
      return ".wav";
    case "audio/flac":
      return ".flac";
    default:
      return ".bin";
  }
}

async function downloadAsset(value: string, prefix: string, maxBytes: number) {
  const trimmed = value.trim();
  let bytes: Buffer;
  let contentType: string | undefined;
  let extension: string;

  if (trimmed.startsWith("storage:")) {
    const storageKey = trimmed.slice("storage:".length).trim();
    if (!storageKey) throw new Error(`${prefix} dosya referansı boş.`);
    const adapter = storageService.getAdapter();
    const metadata = await adapter.getMetadata(storageKey);
    if (metadata.byteSize > maxBytes) throw new Error(`${prefix} dosyası izin verilen boyuttan büyük.`);
    bytes = Buffer.from(await adapter.getObject(storageKey));
    if (bytes.byteLength > maxBytes) throw new Error(`${prefix} dosyası izin verilen boyuttan büyük.`);
    contentType = metadata.contentType;
    extension = extname(storageKey) || extensionForContentType(contentType);
  } else {
    const url = resolveAssetUrl(trimmed);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`${prefix} dosyası indirilemedi (HTTP ${response.status}).`);
      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > maxBytes) throw new Error(`${prefix} dosyası izin verilen boyuttan büyük.`);
      bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.byteLength > maxBytes) throw new Error(`${prefix} dosyası izin verilen boyuttan büyük.`);
      contentType = response.headers.get("content-type")?.split(";")[0]?.trim();
      extension = extname(new URL(url).pathname) || extensionForContentType(contentType);
    } finally {
      clearTimeout(timeout);
    }
  }

  await mkdir(uploadDirectory, { recursive: true, mode: 0o700 });
  const path = resolve(uploadDirectory, `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
  await writeFile(path, bytes, { mode: 0o600 });
  return path;
}

async function uploadReleaseAssets(page: Page, payload: ReturnType<typeof mapCanonicalPayloadToOneRpmForm>) {
  const fileInputs = page.locator('input[type="file"]');
  const inputCount = await fileInputs.count();
  if (!inputCount) return { artwork: false, audio: 0 };

  const artworkPath = await downloadAsset(payload.artwork, "artwork", 50 * 1024 * 1024);
  const temporaryPaths = [artworkPath];
  let artworkUploaded = false;
  let audioUploaded = 0;
  try {
    const descriptors = await fileInputs.evaluateAll((elements) => elements.map((element) => ({
      accept: element.getAttribute("accept") ?? "",
      name: element.getAttribute("name") ?? "",
      id: element.getAttribute("id") ?? "",
    })));
    const artworkIndex = descriptors.findIndex((item) => /image|artwork|cover|kapak/i.test(`${item.accept} ${item.name} ${item.id}`));
    const selectedArtworkIndex = artworkIndex >= 0 ? artworkIndex : 0;
    await fileInputs.nth(selectedArtworkIndex).setInputFiles(artworkPath);
    artworkUploaded = true;

    const audioIndexes = descriptors
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => index !== selectedArtworkIndex && /audio|mp3|wav|flac|music|track|ses/i.test(`${item.accept} ${item.name} ${item.id}`))
      .map(({ index }) => index);
    const fallbackIndexes = audioIndexes.length
      ? audioIndexes
      : descriptors.map((_, index) => index).filter((index) => index !== selectedArtworkIndex);

    for (const [trackIndex, inputIndex] of fallbackIndexes.entries()) {
      const track = payload.tracks[trackIndex];
      if (!track) break;
      const audioPath = await downloadAsset(track.audio, `audio-${trackIndex + 1}`, 750 * 1024 * 1024);
      temporaryPaths.push(audioPath);
      await fileInputs.nth(inputIndex).setInputFiles(audioPath);
      audioUploaded += 1;
    }
  } finally {
    await Promise.all(temporaryPaths.map((path) => rm(path, { force: true }).catch(() => undefined)));
  }
  return { artwork: artworkUploaded, audio: audioUploaded };
}

async function openReleaseForm(page: Page) {
  const candidates = [
    page.getByRole("link", { name: /new release|create release|yeni yayın/i }).first(),
    page.getByRole("button", { name: /new release|create release|yeni yayın/i }).first(),
    page.getByText(/new release|create release|yeni yayın/i).first(),
  ];
  for (const candidate of candidates) {
    if (await candidate.count()) {
      await candidate.click();
      await page.waitForLoadState("domcontentloaded").catch(() => undefined);
      return;
    }
  }
  throw new Error("ONErpm yayın oluşturma ekranı bulunamadı; kullanıcı müdahalesi gerekli.");
}

async function prepareRelease(page: Page, job: AutomationJob) {
  const payload = mapCanonicalPayloadToOneRpmForm(
    job.canonicalPayload as never,
  );

  await page.goto(process.env.ONERPM_DASHBOARD_URL?.trim() || "https://dashboard.onerpm.com/", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  if (/login|sign-in|signin/i.test(page.url())) {
    throw new Error("ONErpm session geçersiz; kullanıcı girişi ve 2FA gerekli.");
  }

  await openReleaseForm(page);
  await fillFirst(page, ["Release title", "Release name", "Yayın adı", "Title"], payload.releaseTitle);
  await fillFirst(page, ["Primary artist", "Main artist", "Ana sanatçı", "Artist"], payload.primaryArtist);
  await fillFirst(page, ["Label", "Label name", "Plak şirketi"], payload.label);
  await fillFirst(page, ["UPC", "UPC code"], payload.UPC);
  await fillFirst(page, ["Language", "Release language", "Dil"], payload.language);
  await fillFirst(page, ["Release date", "Date of release", "Yayın tarihi"], payload.releaseDate);
  await fillFirst(page, ["Subtitle", "Release subtitle", "Alt başlık"], job.canonicalPayload && typeof job.canonicalPayload === "object" ? String((job.canonicalPayload as { subtitle?: string }).subtitle ?? "") : undefined);
  await fillFirst(page, ["Original release date", "Original date", "İlk yayın tarihi"], payload.originalReleaseDate);
  await fillFirst(page, ["Copyright", "Copyright line", "Telif"], job.canonicalPayload && typeof job.canonicalPayload === "object" ? String((job.canonicalPayload as { copyrightLine?: string }).copyrightLine ?? "") : undefined);
  await fillFirst(page, ["Production", "Production line", "Yapım"], job.canonicalPayload && typeof job.canonicalPayload === "object" ? String((job.canonicalPayload as { productionLine?: string }).productionLine ?? "") : undefined);
  await fillFirst(page, ["Featured artist", "Featured artists", "Konuk sanatçı"], payload.featuredArtists.join(", "));
  await fillFirst(page, ["Genre", "Genres", "Tür"], payload.genres.join(", "));
  await selectFirst(page, ["Release type", "Type", "Yayın türü"], payload.releaseType);
  await selectFirst(page, ["Stores", "Platforms", "Mağazalar"], payload.stores.join(", "));
  await fillFirst(page, ["Territories", "Countries", "Bölgeler"], payload.territories.join(", "));

  for (const [index, track] of payload.tracks.entries()) {
    await fillNth(page, ["Track title", "Song title", "Parça adı", "Title"], index, track.title);
    await fillNth(page, ["ISRC", "ISRC code"], index, track.ISRC);
    await fillNth(page, ["Track language", "Language", "Parça dili"], index, track.language);
    await fillNth(page, ["Composer", "Composers", "Besteci"], index, track.composers.join(", "));
    await fillNth(page, ["Lyricist", "Lyricists", "Söz yazarı"], index, track.lyricists.join(", "));
    await fillNth(page, ["Producer", "Producers", "Prodüktör"], index, track.producers.join(", "));
  }

  const uploads = await uploadReleaseAssets(page, payload);

  await mkdir(screenshotDirectory, { recursive: true, mode: 0o700 });
  const screenshotPath = resolve(screenshotDirectory, `${job.id}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return { screenshotPath, uploads };
}

export class OneRpmAutomationService {
  async reserveNext(workerId: string) {
    const configurations = await prisma.distributionProviderConfiguration.findMany({
      where: { provider: "ONE_RPM", isEnabled: true },
      select: { id: true, publicMetadata: true },
    });
    const automationConfigurationIds = configurations
      .filter((configuration) => {
        const metadata = configuration.publicMetadata;
        return metadata && typeof metadata === "object" && (metadata as { mode?: unknown }).mode === "AUTOMATION";
      })
      .map((configuration) => configuration.id);

    if (automationConfigurationIds.length === 0) return null;

    const staleBefore = new Date(Date.now() - 5 * 60 * 1000);
    const candidate = await prisma.distributionJob.findFirst({
      where: {
        provider: "ONE_RPM",
        status: "MANUAL_REVIEW",
        providerConfigurationId: { in: automationConfigurationIds },
        OR: [{ lockedAt: null }, { lockedAt: { lt: staleBefore } }],
      },
      orderBy: { updatedAt: "asc" },
      select: { id: true },
    });
    if (!candidate) return null;

    const locked = await prisma.distributionJob.updateMany({
      where: { id: candidate.id, status: "MANUAL_REVIEW", OR: [{ lockedAt: null }, { lockedAt: { lt: staleBefore } }] },
      data: { status: "PROCESSING", lockedAt: new Date(), lockedBy: workerId, lastAttemptAt: new Date() },
    });
    return locked.count === 1 ? distributionJobRepository.findById(candidate.id) : null;
  }

  async prepareNext(workerId: string) {
    const job = await this.reserveNext(workerId);
    if (!job) return { processed: false as const };

    const storageStatePath = process.env.ONERPM_STORAGE_STATE_PATH?.trim() || defaultStorageStatePath;
    try {
      await access(storageStatePath);
      const browser = await chromium.launch({ headless: true });
      try {
        const context = await browser.newContext({ storageState: storageStatePath, viewport: { width: 1440, height: 1000 } });
        const page = await context.newPage();
        const preparation = await prepareRelease(page, job);
        await distributionJobRepository.updateStatus(job.id, {
          status: "MANUAL_REVIEW",
          lockedAt: null,
          lockedBy: null,
          lastErrorCode: "WAITING_FINAL_APPROVAL",
          lastErrorMessage: `ONErpm formu hazırlandı. Kapak: ${preparation.uploads.artwork ? "yüklendi" : "atlanamadı"}; ses dosyası: ${preparation.uploads.audio}/${(job.canonicalPayload as { tracks?: unknown[] }).tracks?.length ?? 0}. Son kontrol ve gönderim kullanıcı tarafından yapılmalı.`,
        });
        return { processed: true as const, jobId: job.id, screenshotPath: preparation.screenshotPath };
      } finally {
        await browser.close();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "ONErpm otomasyon hazırlığı başarısız.";
      await distributionJobRepository.updateStatus(job.id, {
        status: "MANUAL_REVIEW",
        lockedAt: null,
        lockedBy: null,
        lastErrorCode: message.includes("session") || message.includes("girişi") ? "SESSION_REQUIRED" : "AUTOMATION_PREPARATION_FAILED",
        lastErrorMessage: message.slice(0, 500),
      });
      return { processed: false as const, jobId: job.id, message };
    }
  }
}

export const oneRpmAutomationService = new OneRpmAutomationService();
