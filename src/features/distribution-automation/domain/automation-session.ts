export const automationSessionStatuses = [
  "NOT_CONNECTED",
  "WAITING_LOGIN",
  "WAITING_2FA",
  "CONNECTED",
  "EXPIRED",
  "FAILED",
] as const;

export type AutomationSessionStatus =
  (typeof automationSessionStatuses)[number];

export const automationJobSteps = [
  "PENDING",
  "VALIDATING",
  "WAITING_LOGIN",
  "WAITING_2FA",
  "WAITING_CAPTCHA",
  "SESSION_READY",
  "OPENING_RELEASE_FORM",
  "FILLING_RELEASE_METADATA",
  "UPLOADING_ARTWORK",
  "UPLOADING_AUDIO",
  "FILLING_TRACK_METADATA",
  "SELECTING_STORES",
  "WAITING_FINAL_APPROVAL",
  "SUBMITTING",
  "COMPLETED",
  "FAILED",
] as const;

export type AutomationJobStep = (typeof automationJobSteps)[number];

export type AutomationSessionMetadata = {
  provider: "ONE_RPM";
  status: AutomationSessionStatus;
  storageStatePath: string | null;
  connectedAt: string | null;
  lastCheckedAt: string | null;
  expiresAt: string | null;
  lastError: string | null;
};

export function createEmptyAutomationSession(): AutomationSessionMetadata {
  return {
    provider: "ONE_RPM",
    status: "NOT_CONNECTED",
    storageStatePath: null,
    connectedAt: null,
    lastCheckedAt: null,
    expiresAt: null,
    lastError: null,
  };
}

export function isHumanActionRequired(step: AutomationJobStep) {
  return (
    step === "WAITING_LOGIN" ||
    step === "WAITING_2FA" ||
    step === "WAITING_CAPTCHA" ||
    step === "WAITING_FINAL_APPROVAL"
  );
}
