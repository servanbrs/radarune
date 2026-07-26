import type { ExpoConfig } from "expo/config";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const webBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? "https://radarune.com";
const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? "development";

if (!apiBaseUrl) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL tanımlanmalıdır.");
}

const config: ExpoConfig = {
  name: "Radarune",
  slug: "radarune",
  scheme: "radarune",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: "com.radarune.mobile",
    supportsTablet: true,
    associatedDomains: ["applinks:radarune.com"],
    infoPlist: {
      UIBackgroundModes: ["audio"],
    },
  },
  android: {
    package: "com.radarune.mobile",
    adaptiveIcon: {
      backgroundColor: "#101820"
    },
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: "radarune.com" }],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  extra: {
    apiBaseUrl,
    webBaseUrl,
    appEnv,
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    }
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-notifications"
  ]
};

export default config;
