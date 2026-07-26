import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import { clearStoredSession, getStoredSession, setStoredSession } from "@/api/session-store";

type ApiErrorBody = {
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
  requestId?: string;
};

type ApiSuccessBody<T> = {
  data: T;
  meta: Record<string, unknown>;
  requestId: string;
};

const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;

if (!apiBaseUrl) {
  throw new Error("API base URL yapılandırılmamış.");
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const session = await getStoredSession();
      if (!session) return null;
      const response = await fetch(`${apiBaseUrl}/api/v1/mobile/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken, deviceId: await getDeviceId() }),
      });
      if (!response.ok) {
        await clearStoredSession();
        return null;
      }
      const body = (await response.json()) as ApiSuccessBody<{ accessToken: string; refreshToken: string }>;
      await setStoredSession({ accessToken: body.data.accessToken, refreshToken: body.data.refreshToken });
      return body.data.accessToken;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await getStoredSession();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...init.headers,
    },
  });

  if (response.status === 401 && session) {
    const token = await refreshAccessToken();
    if (token) {
      return apiRequest<T>(path, init);
    }
  }

  const body = (await response.json().catch(() => ({}))) as ApiSuccessBody<T> & ApiErrorBody;
  if (!response.ok) {
    throw new Error(body.error?.message ?? "İşlem başarısız oldu.");
  }

  return body.data;
}

async function getDeviceId() {
  const existing = await getStoredDeviceId();
  if (existing) {
    return existing;
  }
  const created = Crypto.randomUUID();
  await setStoredDeviceId(created);
  return created;
}

const deviceIdKey = "radarune.deviceId";

async function getStoredDeviceId() {
  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItemAsync(deviceIdKey);
}

async function setStoredDeviceId(deviceId: string) {
  const SecureStore = await import("expo-secure-store");
  await SecureStore.setItemAsync(deviceIdKey, deviceId);
}
