import "server-only";

import nodemailer from "nodemailer";
import { prisma } from "@/server/prisma/prisma";
import { env } from "@/lib/env";
import { decryptPlatformSecret, encryptPlatformSecret } from "@/features/platform/server/lib/platform-crypto";

type EmailSettings = {
  provider: string;
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  verificationSubject: string;
  verificationBody: string;
  welcomeSubject: string;
  welcomeBody: string;
  passwordResetSubject: string;
  passwordResetBody: string;
};

const fallback: EmailSettings = {
  provider: env.MAIL_PROVIDER,
  host: env.SMTP_HOST ?? "",
  port: env.SMTP_PORT ?? 587,
  username: env.SMTP_USERNAME ?? "",
  password: env.SMTP_PASSWORD ?? "",
  fromEmail: env.SMTP_FROM_EMAIL ?? "",
  verificationSubject: "E-postanızı doğrulayın · Radarune",
  verificationBody: "Merhaba {{name}}, hesabınızı doğrulamak için bu bağlantıyı açın: {{url}}",
  welcomeSubject: "Radarune'e hoş geldiniz",
  welcomeBody: "Merhaba {{name}}, Radarune hesabınız hazır.",
  passwordResetSubject: "Şifrenizi yenileyin · Radarune",
  passwordResetBody: "Şifrenizi yenilemek için bu bağlantıyı açın: {{url}}",
};

export async function getEmailSettings(organizationId?: string): Promise<EmailSettings> {
  if (!organizationId) return fallback;
  const rows = await prisma.adminSetting.findMany({ where: { organizationId } });
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const text = (key: string, defaultValue: string) => {
    const value = values.get(key as never);
    return typeof value === "string" ? value : defaultValue;
  };
  const portValue = values.get("SMTP_PORT" as never);
  const encryptedPassword = text("SMTP_PASSWORD", "");
  let password = fallback.password;
  if (encryptedPassword) {
    try { password = decryptPlatformSecret(encryptedPassword); } catch { password = encryptedPassword === "••••••••" ? fallback.password : encryptedPassword; }
  }
  return {
    provider: text("SMTP_MAIL_PROVIDER", fallback.provider),
    host: text("SMTP_HOST", fallback.host),
    port: typeof portValue === "number" ? portValue : Number(portValue) || fallback.port,
    username: text("SMTP_USERNAME", fallback.username),
    password,
    fromEmail: text("SMTP_FROM_EMAIL", fallback.fromEmail),
    verificationSubject: text("EMAIL_TEMPLATE_VERIFICATION_SUBJECT", fallback.verificationSubject),
    verificationBody: text("EMAIL_TEMPLATE_VERIFICATION_BODY", fallback.verificationBody),
    welcomeSubject: text("EMAIL_TEMPLATE_WELCOME_SUBJECT", fallback.welcomeSubject),
    welcomeBody: text("EMAIL_TEMPLATE_WELCOME_BODY", fallback.welcomeBody),
    passwordResetSubject: text("EMAIL_TEMPLATE_PASSWORD_RESET_SUBJECT", fallback.passwordResetSubject),
    passwordResetBody: text("EMAIL_TEMPLATE_PASSWORD_RESET_BODY", fallback.passwordResetBody),
  };
}

export function createEmailTransport(settings: EmailSettings) {
  if (settings.provider !== "SMTP" || !settings.host || !settings.port || !settings.username || !settings.password) {
    throw new Error("SMTP ayarları eksik. Sağlayıcı, sunucu, port, kullanıcı adı ve parola gereklidir.");
  }
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    auth: { user: settings.username, pass: settings.password },
  });
}

export async function verifyEmailTransport(organizationId?: string) {
  const settings = await getEmailSettings(organizationId);
  const transporter = createEmailTransport(settings);
  await transporter.verify();
}

export async function sendTemplatedEmail(input: {
  organizationId?: string;
  to: string;
  template: "verification" | "welcome" | "passwordReset";
  name?: string;
  url?: string;
}) {
  const settings = await getEmailSettings(input.organizationId);
  const transporter = createEmailTransport(settings);
  const subjectTemplate = input.template === "verification" ? settings.verificationSubject : input.template === "welcome" ? settings.welcomeSubject : settings.passwordResetSubject;
  const bodyTemplate = input.template === "verification" ? settings.verificationBody : input.template === "welcome" ? settings.welcomeBody : settings.passwordResetBody;
  const replace = (value: string) => value.replaceAll("{{name}}", input.name ?? "").replaceAll("{{url}}", input.url ?? "").replaceAll("{{platform}}", "Radarune");
  await transporter.sendMail({ from: settings.fromEmail || settings.username, to: input.to, subject: replace(subjectTemplate), text: replace(bodyTemplate) });
}

export function encryptEmailPassword(value: string) {
  return encryptPlatformSecret(value);
}
