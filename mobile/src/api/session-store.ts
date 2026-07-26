import * as SecureStore from "expo-secure-store";

const accessTokenKey = "radarune.accessToken";
const refreshTokenKey = "radarune.refreshToken";

export type MobileStoredSession = {
  accessToken: string;
  refreshToken: string;
};

export async function getStoredSession(): Promise<MobileStoredSession | null> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(accessTokenKey),
    SecureStore.getItemAsync(refreshTokenKey),
  ]);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

export async function setStoredSession(session: MobileStoredSession) {
  await Promise.all([
    SecureStore.setItemAsync(accessTokenKey, session.accessToken),
    SecureStore.setItemAsync(refreshTokenKey, session.refreshToken),
  ]);
}

export async function clearStoredSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(accessTokenKey),
    SecureStore.deleteItemAsync(refreshTokenKey),
  ]);
}
