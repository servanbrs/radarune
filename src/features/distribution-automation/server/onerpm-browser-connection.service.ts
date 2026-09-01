import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Browser, BrowserContext, Page } from "playwright";

import type { AutomationSessionStatus } from "@/features/distribution-automation/domain/automation-session";

const loginUrl = process.env.ONERPM_LOGIN_URL?.trim() || "https://accounts.onerpm.com/login";
const storageStatePath = path.resolve(/*turbopackIgnore: true*/ process.env.ONERPM_STORAGE_STATE_PATH?.trim() || ".radarune-private/onerpm/storage-state.json");
const metadataPath = path.resolve(/*turbopackIgnore: true*/ process.env.ONERPM_SESSION_METADATA_PATH?.trim() || ".radarune-private/onerpm/session-metadata.json");
const sessionTtlMs = 10 * 60 * 1000;

type ConnectionState = {
  id: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  status: Extract<AutomationSessionStatus, "WAITING_LOGIN" | "WAITING_2FA">;
  createdAt: number;
  lastError: string | null;
};

type ConnectionResult = {
  success: boolean;
  status: AutomationSessionStatus;
  connectionId?: string;
  message: string;
};

const globalState = globalThis as typeof globalThis & {
  __radaruneOneRpmConnections?: Map<string, ConnectionState>;
};
const connections = globalState.__radaruneOneRpmConnections ?? new Map<string, ConnectionState>();
globalState.__radaruneOneRpmConnections = connections;

function isLoginPage(page: Page) {
  return /\/login|\/sign-in|\/signin/i.test(page.url());
}

async function fillFirst(page: Page, selectors: string[], value: string) {
  for (const selector of selectors) {
    const input = page.locator(selector).first();
    if (await input.count()) {
      await input.fill(value);
      return true;
    }
  }
  return false;
}

async function clickSubmit(page: Page) {
  const submit = page.locator('button[type="submit"], input[type="submit"]').first();
  if (await submit.count()) {
    await submit.click();
    return;
  }
  await page.keyboard.press("Enter");
}

async function hasTwoFactorInput(page: Page) {
  return (await page.locator([
    'input[autocomplete="one-time-code"]',
    'input[name*="otp" i]',
    'input[name*="code" i]',
    'input[placeholder*="code" i]',
    'input[placeholder*="kod" i]',
  ].join(", ")).count()) > 0;
}

function publicResult(state: ConnectionState, message: string): ConnectionResult {
  return { success: false, status: state.status, connectionId: state.id, message };
}

async function saveConnectedSession(page: Page) {
  await mkdir(path.dirname(storageStatePath), { recursive: true, mode: 0o700 });
  await mkdir(path.dirname(metadataPath), { recursive: true, mode: 0o700 });
  await page.context().storageState({ path: storageStatePath });
  const now = new Date().toISOString();
  await writeFile(metadataPath, JSON.stringify({
    provider: "ONE_RPM",
    status: "CONNECTED",
    storageStatePath,
    connectedAt: now,
    lastCheckedAt: now,
    expiresAt: null,
    lastError: null,
    capturedFromUrl: page.url(),
  }, null, 2), { encoding: "utf8", mode: 0o600 });
}

async function closeConnection(state: ConnectionState) {
  connections.delete(state.id);
  await state.browser.close().catch(() => undefined);
}

async function getConnection(id: string) {
  const state = connections.get(id);
  if (!state) return null;
  if (Date.now() - state.createdAt > sessionTtlMs) {
    await closeConnection(state);
    return null;
  }
  return state;
}

export async function startOneRpmBrowserConnection(email: string, password: string): Promise<ConnectionResult> {
  for (const state of connections.values()) await closeConnection(state);

  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return {
      success: false,
      status: "FAILED",
      message: "Sunucu tarayıcısı hazır değil. Hostinger dağıtımında üretim bağımlılıklarını yeniden kurup uygulamayı yeniden başlatın.",
    };
  }

  let browser: Browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    return {
      success: false,
      status: "FAILED",
      message: "Hostinger sunucusunda Chromium başlatılamadı. ONErpm bağlantısı için sunucu tarayıcısı desteği etkin olmalı.",
    };
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  const state: ConnectionState = {
    id: randomUUID(), browser, context, page, status: "WAITING_LOGIN", createdAt: Date.now(), lastError: null,
  };
  connections.set(state.id, state);

  try {
    await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const emailFilled = await fillFirst(page, ['input[type="email"]', 'input[name*="email" i]', 'input[autocomplete="username"]'], email);
    const passwordFilled = await fillFirst(page, ['input[type="password"]', 'input[name*="password" i]', 'input[autocomplete="current-password"]'], password);
    if (!emailFilled || !passwordFilled) return publicResult(state, "ONErpm giriş alanları bulunamadı. Giriş sayfası değişmiş olabilir.");

    await clickSubmit(page);
    await page.waitForTimeout(1_500);
    if (await hasTwoFactorInput(page)) {
      state.status = "WAITING_2FA";
      return publicResult(state, "2FA kodunu girin.");
    }
    if (isLoginPage(page)) return publicResult(state, "ONErpm giriş bilgileri kabul edilmedi veya ek doğrulama gerekiyor.");

    await saveConnectedSession(page);
    await closeConnection(state);
    return { success: true, status: "CONNECTED", message: "ONErpm sunucu oturumu bağlandı." };
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : "ONErpm bağlantısı başarısız.";
    return publicResult(state, state.lastError);
  }
}

export async function completeOneRpmBrowserConnection(id: string, code: string): Promise<ConnectionResult> {
  const state = await getConnection(id);
  if (!state) return { success: false, status: "EXPIRED", message: "Bağlantı oturumunun süresi doldu. Yeniden başlatın." };
  try {
    const input = state.page.locator([
      'input[autocomplete="one-time-code"]', 'input[name*="otp" i]', 'input[name*="code" i]',
      'input[placeholder*="code" i]', 'input[placeholder*="kod" i]',
    ].join(", ")).first();
    if (!(await input.count())) return publicResult(state, "2FA kod alanı bulunamadı.");
    await input.fill(code);
    await clickSubmit(state.page);
    await state.page.waitForTimeout(1_500);
    if (isLoginPage(state.page) || await hasTwoFactorInput(state.page)) {
      state.status = "WAITING_2FA";
      return publicResult(state, "Kod doğrulanamadı veya ek bir doğrulama gerekiyor.");
    }
    await saveConnectedSession(state.page);
    await closeConnection(state);
    return { success: true, status: "CONNECTED", message: "ONErpm sunucu oturumu bağlandı." };
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : "2FA doğrulaması başarısız.";
    return publicResult(state, state.lastError);
  }
}

export async function cancelOneRpmBrowserConnection(id: string) {
  const state = await getConnection(id);
  if (state) await closeConnection(state);
  return { success: true, status: "NOT_CONNECTED" as const, message: "Bağlantı iptal edildi." };
}
