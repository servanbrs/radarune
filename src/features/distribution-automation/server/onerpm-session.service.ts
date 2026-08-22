import "server-only";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { AutomationSessionMetadata } from "@/features/distribution-automation/domain/automation-session";

const defaultMetadataPath = resolve(
  process.env.ONERPM_SESSION_METADATA_PATH?.trim() ||
    ".radarune-private/onerpm/session-metadata.json",
);

export type PublicOneRpmSessionStatus = {
  status: AutomationSessionMetadata["status"];
  connectedAt: string | null;
  lastCheckedAt: string | null;
  expiresAt: string | null;
  lastError: string | null;
};

function emptyStatus(): PublicOneRpmSessionStatus {
  return {
    status: "NOT_CONNECTED",
    connectedAt: null,
    lastCheckedAt: null,
    expiresAt: null,
    lastError: null,
  };
}

export async function getOneRpmSessionStatus(): Promise<PublicOneRpmSessionStatus> {
  try {
    const raw = await readFile(
      process.env.ONERPM_SESSION_METADATA_PATH?.trim() || defaultMetadataPath,
      "utf8",
    );
    const metadata = JSON.parse(raw) as Partial<AutomationSessionMetadata>;

    return {
      status: metadata.status ?? "FAILED",
      connectedAt: metadata.connectedAt ?? null,
      lastCheckedAt: metadata.lastCheckedAt ?? null,
      expiresAt: metadata.expiresAt ?? null,
      lastError: metadata.lastError ?? null,
    };
  } catch {
    // The session file contains browser cookies and is intentionally never
    // exposed to the browser. Missing file simply means the user has not
    // completed the manual ONErpm login on this server yet.
    return emptyStatus();
  }
}
