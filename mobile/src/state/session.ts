import { create } from "zustand";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiRequest } from "@/api/client";
import { clearStoredSession, setStoredSession } from "@/api/session-store";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  systemRole: string;
};

type SessionState = {
  user: SessionUser | null;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  loadMe: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  async signIn(input) {
    const session = await apiRequest<{ accessToken: string; refreshToken: string }>("/api/v1/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        deviceId: await getDeviceId(),
        platform: Platform.OS === "android" ? "ANDROID" : "IOS",
        appVersion: Constants.expoConfig?.version ?? "1.0.0",
      }),
    });
    await setStoredSession(session);
    await useSessionStore.getState().loadMe();
  },
  async signOut() {
    await apiRequest("/api/v1/mobile/auth/logout", { method: "POST", body: JSON.stringify({}) }).catch(() => undefined);
    await clearStoredSession();
    set({ user: null });
  },
  async loadMe() {
    const me = await apiRequest<{ user: SessionUser }>("/api/v1/mobile/auth/me");
    set({ user: me.user });
  },
}));

async function getDeviceId() {
  const SecureStore = await import("expo-secure-store");
  const key = "radarune.deviceId";
  const existing = await SecureStore.getItemAsync(key);
  if (existing) return existing;
  const Crypto = await import("expo-crypto");
  const created = Crypto.randomUUID();
  await SecureStore.setItemAsync(key, created);
  return created;
}
