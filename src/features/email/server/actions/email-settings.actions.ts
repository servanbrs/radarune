"use server";

import { revalidatePath } from "next/cache";

import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminSystemService } from "@/features/admin/server/services/admin-system.service";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import {
  clearEmailSettingsCache,
  encryptEmailPassword,
  sendTemplatedEmail,
  verifyEmailTransport,
} from "@/features/email/server/email-settings.service";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function number(formData: FormData, key: string) {
  const value = Number(formData.get(key));

  if (!Number.isFinite(value)) {
    throw new Error(`${key} geçerli bir sayı olmalıdır.`);
  }

  return value;
}

async function getActor() {
  const { organization, user } = await authSessionService.getDashboardContext();

  return toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });
}

export async function saveEmailSettingsAction(formData: FormData) {
  const actor = await getActor();

  const reason = text(formData, "reason");

  if (reason.length < 10) {
    throw new Error("Değişiklik sebebi en az 10 karakter olmalıdır.");
  }

  const settings = [
    {
      key: "SMTP_MAIL_PROVIDER",
      value: text(formData, "smtpProvider") || "SMTP",
    },
    {
      key: "SMTP_HOST",
      value: text(formData, "smtpHost"),
    },
    {
      key: "SMTP_PORT",
      value: number(formData, "smtpPort"),
    },
    {
      key: "SMTP_USERNAME",
      value: text(formData, "smtpUsername"),
    },
    {
      key: "SMTP_FROM_EMAIL",
      value: text(formData, "smtpFromEmail"),
    },
    {
      key: "SMTP_FROM_NAME",
      value: text(formData, "smtpFromName") || "Radarune",
    },
    {
      key: "EMAIL_BRAND_LOGO_URL",
      value: text(formData, "logoUrl"),
    },
    {
      key: "EMAIL_BRAND_PRIMARY_COLOR",
      value: text(formData, "primaryColor") || "#12b981",
    },
    {
      key: "EMAIL_BRAND_FOOTER_TEXT",
      value: text(formData, "footerText"),
    },
    {
      key: "EMAIL_TEMPLATE_VERIFICATION_SUBJECT",
      value: text(formData, "verificationSubject"),
    },
    {
      key: "EMAIL_TEMPLATE_VERIFICATION_BODY",
      value: text(formData, "verificationBody"),
    },
    {
      key: "EMAIL_TEMPLATE_SIGN_IN_SUBJECT",
      value: text(formData, "signInSubject"),
    },
    {
      key: "EMAIL_TEMPLATE_SIGN_IN_BODY",
      value: text(formData, "signInBody"),
    },
    {
      key: "EMAIL_TEMPLATE_WELCOME_SUBJECT",
      value: text(formData, "welcomeSubject"),
    },
    {
      key: "EMAIL_TEMPLATE_WELCOME_BODY",
      value: text(formData, "welcomeBody"),
    },
    {
      key: "EMAIL_TEMPLATE_PASSWORD_RESET_SUBJECT",
      value: text(formData, "passwordResetSubject"),
    },
    {
      key: "EMAIL_TEMPLATE_PASSWORD_RESET_BODY",
      value: text(formData, "passwordResetBody"),
    },
  ] as const;

  for (const setting of settings) {
    await adminSystemService.updateSetting(actor, {
      key: setting.key,
      value: setting.value,
      reason,
    });
  }

  const password = text(formData, "smtpPassword");

  /*
   * Parola alanı boş veya maskeli bırakılırsa
   * veritabanındaki mevcut şifre korunur.
   */
  if (password && password !== "••••••••" && password !== "********") {
    await adminSystemService.updateSetting(actor, {
      key: "SMTP_PASSWORD",
      value: encryptEmailPassword(password),
      reason,
    });
  }

  clearEmailSettingsCache(actor.organizationId);

  revalidatePath("/admin/email");
  revalidatePath("/admin/settings");
}

export async function testEmailSettingsAction(formData: FormData) {
  const actor = await getActor();

  const recipient = text(formData, "testRecipient");

  if (!recipient || !recipient.includes("@")) {
    throw new Error("Geçerli bir test e-posta adresi girin.");
  }

  await verifyEmailTransport(actor.organizationId);

  await sendTemplatedEmail({
    organizationId: actor.organizationId,
    to: recipient,
    template: "welcome",
    name: "Radarune Test",
    url: "https://radarune.com",
  });

  revalidatePath("/admin/email");
}
