import "server-only";

import { access, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, type Page } from "playwright";
import { randomUUID } from "node:crypto";

import { mapCanonicalPayloadToOneRpmForm } from "@/features/distribution-automation/domain/onerpm-payload-mapper";
import { distributionJobRepository } from "@/features/distribution-hub/server/repositories/distribution-job.repository";
import { prisma } from "@/server/prisma/prisma";

const defaultStorageStatePath = resolve(
  process.env.ONERPM_STORAGE_STATE_PATH?.trim() || ".radarune-private/onerpm/storage-state.json",
);
const screenshotDirectory = resolve(".radarune-private/onerpm/automation");

type AutomationJob = NonNullable<Awaited<ReturnType<typeof distributionJobRepository.findById>>>;

async function fillFirst(page: Page, labels: string[], value: string | undefined) {
  if (!value) return false;
  for (const label of labels) {
    const locator = page.getByLabel(label, { exact: false }).first();
    if (await locator.count()) {
      await locator.fill(value);
      return true;
    }
  }
  return false;
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

  const firstTrack = payload.tracks[0];
  if (firstTrack) {
    await fillFirst(page, ["Track title", "Song title", "Parça adı", "Title"], firstTrack.title);
    await fillFirst(page, ["ISRC", "ISRC code"], firstTrack.ISRC);
  }

  await mkdir(screenshotDirectory, { recursive: true, mode: 0o700 });
  const screenshotPath = resolve(screenshotDirectory, `${job.id}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
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
        const screenshotPath = await prepareRelease(page, job);
        await distributionJobRepository.updateStatus(job.id, {
          status: "MANUAL_REVIEW",
          lockedAt: null,
          lockedBy: null,
          lastErrorCode: "WAITING_FINAL_APPROVAL",
          lastErrorMessage: "ONErpm formu otomatik dolduruldu; son kontrol ve gönderim kullanıcı tarafından yapılmalı.",
        });
        return { processed: true as const, jobId: job.id, screenshotPath };
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

