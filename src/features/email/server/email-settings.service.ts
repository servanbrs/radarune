import "server-only";

import nodemailer from "nodemailer";

import { env } from "@/lib/env";
import { prisma } from "@/server/prisma/prisma";
import { configurationResolver } from "@/features/configuration/server/configuration-resolver.service";
import {
  decryptPlatformSecret,
  encryptPlatformSecret,
} from "@/features/platform/server/lib/platform-crypto";

export type EmailSettings = {
  organizationId: string | null;
  provider: string;
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  logoUrl: string;
  primaryColor: string;
  footerText: string;
  verificationSubject: string;
  verificationBody: string;
  welcomeSubject: string;
  welcomeBody: string;
  passwordResetSubject: string;
  passwordResetBody: string;
  signInSubject: string;
  signInBody: string;
};

export type EmailTemplateName =
  "verification" | "welcome" | "passwordReset" | "signIn";

type TemplateVariables = {
  name?: string;
  email?: string;
  url?: string;
  code?: string;
  platform?: string;
  year?: string;
};

const DEFAULT_PRIMARY_COLOR = "#12b981";

const fallback: EmailSettings = {
  organizationId: null,
  provider: env.MAIL_PROVIDER,
  host: env.SMTP_HOST ?? "",
  port: env.SMTP_PORT ?? 587,
  username: env.SMTP_USERNAME ?? "",
  password: env.SMTP_PASSWORD ?? "",
  fromEmail: env.SMTP_FROM_EMAIL ?? "",
  fromName: "Radarune",
  logoUrl: "",
  primaryColor: DEFAULT_PRIMARY_COLOR,
  footerText:
    "Bu e-posta Radarune hesap güvenliği ve bildirim sistemi tarafından gönderildi.",
  verificationSubject: "Radarune e-posta doğrulama kodunuz",
  verificationBody:
    "Merhaba {{name}}, Radarune hesabınızı doğrulamak için aşağıdaki güvenlik kodunu kullanın.",
  welcomeSubject: "Radarune'e hoş geldiniz",
  welcomeBody:
    "Merhaba {{name}}, Radarune hesabınız başarıyla oluşturuldu. Yeni müzikleri keşfetmeye ve yayınlarınızı yönetmeye başlayabilirsiniz.",
  passwordResetSubject: "Radarune şifre yenileme talebi",
  passwordResetBody:
    "Merhaba {{name}}, Radarune şifrenizi yenilemek için aşağıdaki bağlantıyı kullanın.",
  signInSubject: "Radarune giriş güvenlik kodunuz",
  signInBody:
    "Merhaba {{name}}, Radarune hesabınıza giriş yapmak için aşağıdaki güvenlik kodunu kullanın.",
};

function normalizeProvider(value: string) {
  return value.trim().toUpperCase();
}

function normalizeColor(value: string) {
  const trimmed = value.trim();

  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : DEFAULT_PRIMARY_COLOR;
}

function textValue(
  values: Map<string, unknown>,
  key: string,
  defaultValue: string,
) {
  const value = values.get(key);

  return typeof value === "string" ? value : defaultValue;
}

function decryptPassword(encryptedValue: string, defaultValue: string) {
  if (!encryptedValue) {
    return defaultValue;
  }

  if (encryptedValue === "••••••••" || encryptedValue === "********") {
    return defaultValue;
  }

  try {
    return decryptPlatformSecret(encryptedValue);
  } catch {
    /*
     * Eski kurulumlarda şifre düz metin kaydedilmiş
     * olabilir. V1 geçişinde bağlantıyı bozmamak için
     * değer kullanılmaya devam edilir.
     */
    return encryptedValue;
  }
}

async function loadOrganizationSettings(
  organizationId?: string,
): Promise<EmailSettings> {
  const rows = await prisma.adminSetting.findMany({
    where: {
      ...(organizationId ? { organizationId } : { organizationId: null }),
    },
    select: {
      key: true,
      value: true,
    },
  });

  const values = new Map<string, unknown>(
    rows.map((row) => [String(row.key), row.value]),
  );

  const password = decryptPassword(textValue(values, "SMTP_PASSWORD", ""), "");

  const resolve = async <T>(
    key: Parameters<typeof configurationResolver.resolve<T>>[0]["key"],
    defaultValue: T,
    parse: (value: unknown) => T | undefined,
  ) => {
    const result = await configurationResolver.resolve({
      key,
      ...(organizationId ? { organizationId } : {}),
      defaultValue,
      parse,
    });
    return result.value;
  };

  const [provider, host, port, username, resolvedPassword, fromEmail] =
    await Promise.all([
      resolve("SMTP_MAIL_PROVIDER", fallback.provider, (value) =>
        typeof value === "string" ? normalizeProvider(value) : undefined,
      ),
      resolve("SMTP_HOST", fallback.host, (value) =>
        typeof value === "string" ? value.trim() : undefined,
      ),
      resolve("SMTP_PORT", fallback.port, (value) => {
        const parsed = typeof value === "number" ? value : Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      }),
      resolve("SMTP_USERNAME", fallback.username, (value) =>
        typeof value === "string" ? value.trim() : undefined,
      ),
      resolve("SMTP_PASSWORD", fallback.password, (value) =>
        typeof value === "string" ? decryptPassword(value, fallback.password) : undefined,
      ),
      resolve("SMTP_FROM_EMAIL", fallback.fromEmail, (value) =>
        typeof value === "string" ? value.trim() : undefined,
      ),
    ]);

  return {
    organizationId: organizationId ?? null,
    provider,
    host,
    port,
    username,
    password: resolvedPassword || password,
    fromEmail,
    fromName: textValue(values, "SMTP_FROM_NAME", fallback.fromName).trim(),
    logoUrl: textValue(values, "EMAIL_BRAND_LOGO_URL", fallback.logoUrl).trim(),
    primaryColor: normalizeColor(
      textValue(values, "EMAIL_BRAND_PRIMARY_COLOR", fallback.primaryColor),
    ),
    footerText: textValue(
      values,
      "EMAIL_BRAND_FOOTER_TEXT",
      fallback.footerText,
    ),
    verificationSubject: textValue(
      values,
      "EMAIL_TEMPLATE_VERIFICATION_SUBJECT",
      fallback.verificationSubject,
    ),
    verificationBody: textValue(
      values,
      "EMAIL_TEMPLATE_VERIFICATION_BODY",
      fallback.verificationBody,
    ),
    welcomeSubject: textValue(
      values,
      "EMAIL_TEMPLATE_WELCOME_SUBJECT",
      fallback.welcomeSubject,
    ),
    welcomeBody: textValue(
      values,
      "EMAIL_TEMPLATE_WELCOME_BODY",
      fallback.welcomeBody,
    ),
    passwordResetSubject: textValue(
      values,
      "EMAIL_TEMPLATE_PASSWORD_RESET_SUBJECT",
      fallback.passwordResetSubject,
    ),
    passwordResetBody: textValue(
      values,
      "EMAIL_TEMPLATE_PASSWORD_RESET_BODY",
      fallback.passwordResetBody,
    ),
    signInSubject: textValue(
      values,
      "EMAIL_TEMPLATE_SIGN_IN_SUBJECT",
      fallback.signInSubject,
    ),
    signInBody: textValue(
      values,
      "EMAIL_TEMPLATE_SIGN_IN_BODY",
      fallback.signInBody,
    ),
  };
}

function isCompleteSmtpConfiguration(settings: EmailSettings) {
  return Boolean(
    normalizeProvider(settings.provider) === "SMTP" &&
    settings.host &&
    settings.port &&
    settings.username &&
    settings.password &&
    settings.fromEmail,
  );
}

export async function getEmailSettings(
  organizationId?: string,
): Promise<EmailSettings> {
  const settings = await loadOrganizationSettings(organizationId);

  if (isCompleteSmtpConfiguration(settings)) {
    return settings;
  }

  return {
    ...fallback,
    provider: normalizeProvider(fallback.provider),
  };
}

export function createEmailTransport(settings: EmailSettings) {
  if (!isCompleteSmtpConfiguration(settings)) {
    throw new Error(
      [
        "SMTP ayarları eksik.",
        "Admin → E-posta Merkezi bölümünden",
        "sağlayıcı, sunucu, port, kullanıcı adı,",
        "parola ve gönderen e-posta adresini kaydedin.",
      ].join(" "),
    );
  }

  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    requireTLS: settings.port === 587,
    auth: {
      user: settings.username,
      pass: settings.password,
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function replaceVariables(value: string, variables: TemplateVariables) {
  const replacements: Record<string, string> = {
    "{{name}}": variables.name ?? "",
    "{{email}}": variables.email ?? "",
    "{{url}}": variables.url ?? "",
    "{{code}}": variables.code ?? "",
    "{{platform}}": variables.platform ?? "Radarune",
    "{{year}}": variables.year ?? String(new Date().getFullYear()),
  };

  let result = value;

  for (const [key, replacement] of Object.entries(replacements)) {
    result = result.replaceAll(key, replacement);
  }

  return result;
}

function templateData(settings: EmailSettings, template: EmailTemplateName) {
  switch (template) {
    case "verification":
      return {
        subject: settings.verificationSubject,
        body: settings.verificationBody,
        eyebrow: "E-posta doğrulama",
        title: "Hesabınızı doğrulayın",
        buttonLabel: "E-posta adresimi doğrula",
      };

    case "welcome":
      return {
        subject: settings.welcomeSubject,
        body: settings.welcomeBody,
        eyebrow: "Radarune",
        title: "Aramıza hoş geldiniz",
        buttonLabel: "Radarune'u keşfet",
      };

    case "passwordReset":
      return {
        subject: settings.passwordResetSubject,
        body: settings.passwordResetBody,
        eyebrow: "Hesap güvenliği",
        title: "Şifrenizi yenileyin",
        buttonLabel: "Şifremi yenile",
      };

    case "signIn":
      return {
        subject: settings.signInSubject,
        body: settings.signInBody,
        eyebrow: "İki adımlı doğrulama",
        title: "Giriş güvenlik kodunuz",
        buttonLabel: "",
      };
  }
}

export function renderEmailTemplate(input: {
  settings: EmailSettings;
  template: EmailTemplateName;
  variables?: TemplateVariables;
}) {
  const variables: TemplateVariables = {
    platform: "Radarune",
    year: String(new Date().getFullYear()),
    ...input.variables,
  };

  const data = templateData(input.settings, input.template);

  const subject = replaceVariables(data.subject, variables);

  const body = replaceVariables(data.body, variables);

  const safeBody = escapeHtml(body).replaceAll("\n", "<br />");

  const code = variables.code?.trim();
  const url = variables.url?.trim();

  const actionHtml = code
    ? `
      <div style="margin:32px 0;text-align:center;">
        <div style="
          display:inline-block;
          padding:18px 28px;
          border:1px solid #dce7e4;
          border-radius:16px;
          background:#f4faf8;
          color:#07100f;
          font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
          font-size:30px;
          font-weight:800;
          letter-spacing:10px;
        ">${escapeHtml(code)}</div>
        <p style="margin:14px 0 0;color:#71807d;font-size:12px;">
          Bu kod 10 dakika boyunca geçerlidir.
        </p>
      </div>
    `
    : url
      ? `
        <div style="margin:32px 0;text-align:center;">
          <a
            href="${escapeHtml(url)}"
            style="
              display:inline-block;
              padding:14px 24px;
              border-radius:14px;
              background:${input.settings.primaryColor};
              color:#ffffff;
              font-size:14px;
              font-weight:700;
              text-decoration:none;
            "
          >${escapeHtml(data.buttonLabel)}</a>
        </div>
      `
      : "";

  const logoHtml = input.settings.logoUrl
    ? `
        <img
          alt="Radarune"
          src="${escapeHtml(input.settings.logoUrl)}"
          width="132"
          style="display:block;max-width:132px;height:auto;border:0;"
        />
      `
    : `
        <div style="
          color:#07100f;
          font-size:20px;
          font-weight:900;
          letter-spacing:3px;
        ">RADARUNE</div>
      `;

  const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#eef4f2;font-family:Arial,Helvetica,sans-serif;color:#13201d;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4f2;">
    <tr>
      <td align="center" style="padding:34px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;">
          <tr>
            <td style="padding:0 8px 22px;">
              ${logoHtml}
            </td>
          </tr>

          <tr>
            <td style="
              overflow:hidden;
              border:1px solid #dce7e4;
              border-radius:24px;
              background:#ffffff;
              box-shadow:0 20px 60px rgba(7,16,15,.08);
            ">
              <div style="
                height:7px;
                background:linear-gradient(90deg,${input.settings.primaryColor},#8de8c8,#f1b55d);
              "></div>

              <div style="padding:42px 42px 38px;">
                <div style="
                  margin-bottom:16px;
                  color:${input.settings.primaryColor};
                  font-size:11px;
                  font-weight:800;
                  letter-spacing:2px;
                  text-transform:uppercase;
                ">${escapeHtml(data.eyebrow)}</div>

                <h1 style="
                  margin:0;
                  color:#07100f;
                  font-size:30px;
                  line-height:1.2;
                  letter-spacing:-1px;
                ">${escapeHtml(data.title)}</h1>

                <div style="
                  margin-top:20px;
                  color:#53625f;
                  font-size:15px;
                  line-height:1.8;
                ">${safeBody}</div>

                ${actionHtml}

                <div style="
                  margin-top:34px;
                  padding-top:22px;
                  border-top:1px solid #e8efed;
                  color:#87918f;
                  font-size:12px;
                  line-height:1.6;
                ">
                  Bu işlemi siz başlatmadıysanız bu e-postayı dikkate almayın
                  ve güvenlik kodunu kimseyle paylaşmayın.
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="
              padding:22px 18px 0;
              text-align:center;
              color:#83908d;
              font-size:11px;
              line-height:1.6;
            ">
              ${escapeHtml(
                replaceVariables(input.settings.footerText, variables),
              )}
              <br />
              © ${escapeHtml(variables.year ?? "")} Radarune
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    data.title,
    "",
    body,
    code ? `\nKod: ${code}` : "",
    url ? `\nBağlantı: ${url}` : "",
    "",
    input.settings.footerText,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    html,
    text,
  };
}

export async function verifyEmailTransport(organizationId?: string) {
  const settings = await getEmailSettings(organizationId);

  const transporter = createEmailTransport(settings);

  await transporter.verify();

  return {
    organizationId: settings.organizationId,
    host: settings.host,
    port: settings.port,
    username: settings.username,
    fromEmail: settings.fromEmail,
  };
}

export async function sendTemplatedEmail(input: {
  organizationId?: string;
  to: string;
  template: "verification" | "welcome" | "passwordReset";
  name?: string;
  url?: string;
}) {
  const settings = await getEmailSettings(input.organizationId);

  const message = renderEmailTemplate({
    settings,
    template: input.template,
    variables: {
      ...(input.name ? { name: input.name } : {}),
      email: input.to,
      ...(input.url ? { url: input.url } : {}),
    },
  });

  if (process.env.NODE_ENV !== "production" && !isCompleteSmtpConfiguration(settings)) {
    console.info("[RADARUNE_DEV_EMAIL] SMTP ayarı yok; e-posta local konsola yönlendirildi.", {
      to: input.to,
      subject: message.subject,
      text: message.text,
    });
    return;
  }

  const transporter = createEmailTransport(settings);

  await transporter.sendMail({
    from: {
      name: settings.fromName || "Radarune",
      address: settings.fromEmail || settings.username,
    },
    to: input.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

export async function sendSecurityCodeEmail(input: {
  email: string;
  code: string;
  type: "email-verification" | "sign-in" | "password-reset";
  organizationId?: string;
  name?: string;
}) {
  const settings = await getEmailSettings(input.organizationId);

  const template: EmailTemplateName =
    input.type === "email-verification"
      ? "verification"
      : input.type === "sign-in"
        ? "signIn"
        : "passwordReset";

  const message = renderEmailTemplate({
    settings,
    template,
    variables: {
      email: input.email,
      ...(input.name ? { name: input.name } : {}),
      code: input.code,
    },
  });

  if (process.env.NODE_ENV !== "production" && !isCompleteSmtpConfiguration(settings)) {
    console.info("[RADARUNE_DEV_EMAIL] SMTP ayarı yok; güvenlik kodu local konsola yönlendirildi.", {
      email: input.email.replace(/(^.).*(@.*$)/, "$1***$2"),
      code: input.code,
      type: input.type,
      subject: message.subject,
    });
    return {
      messageId: `dev-${Date.now()}`,
      accepted: [input.email],
      rejected: [],
      pending: [],
      response: "Local development email fallback",
    };
  }

  const transporter = createEmailTransport(settings);

  const delivery = await transporter.sendMail({
    from: {
      name: settings.fromName || "Radarune",
      address: settings.username,
    },
    replyTo: settings.fromEmail || settings.username,
    to: input.email,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  console.info("[RADARUNE_EMAIL] Güvenlik e-postası teslimat sonucu:", {
    messageId: delivery.messageId,
    accepted: delivery.accepted,
    rejected: delivery.rejected,
    pending: delivery.pending,
    response: delivery.response,
    recipient: input.email.replace(/(^.).*(@.*$)/, "$1***$2"),
  });

  return delivery;
}

export function encryptEmailPassword(value: string) {
  return encryptPlatformSecret(value);
}
