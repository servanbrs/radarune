"use client";

import { Eye, MailCheck, Palette, Send, Server } from "lucide-react";
import { useMemo, useState } from "react";

import {
  saveEmailSettingsAction,
  testEmailSettingsAction,
} from "@/features/email/server/actions/email-settings.actions";
import { formatCustomerEmailCopy } from "@/features/email/lib/email-copy";

type InitialSettings = {
  provider: string;
  host: string;
  port: number;
  username: string;
  passwordConfigured: boolean;
  fromEmail: string;
  fromName: string;
  logoUrl: string;
  primaryColor: string;
  footerText: string;
  verificationSubject: string;
  verificationBody: string;
  signInSubject: string;
  signInBody: string;
  welcomeSubject: string;
  welcomeBody: string;
  passwordResetSubject: string;
  passwordResetBody: string;
};

type TemplateKey = "verification" | "signIn" | "welcome" | "passwordReset";

const templateLabels: Record<TemplateKey, string> = {
  verification: "Kayıt doğrulama",
  signIn: "Giriş 2FA",
  welcome: "Hoş geldin",
  passwordReset: "Şifre sıfırlama",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function AdminEmailSettingsForm({
  initialSettings,
}: {
  initialSettings: InitialSettings;
}) {
  const [template, setTemplate] = useState<TemplateKey>("signIn");

  const [primaryColor, setPrimaryColor] = useState(
    initialSettings.primaryColor,
  );

  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl);

  const [fromName, setFromName] = useState(initialSettings.fromName);

  const [footerText, setFooterText] = useState(initialSettings.footerText);

  const [subjects, setSubjects] = useState({
    verification: initialSettings.verificationSubject,
    signIn: initialSettings.signInSubject,
    welcome: initialSettings.welcomeSubject,
    passwordReset: initialSettings.passwordResetSubject,
  });

  const [bodies, setBodies] = useState({
    verification: initialSettings.verificationBody,
    signIn: initialSettings.signInBody,
    welcome: initialSettings.welcomeBody,
    passwordReset: initialSettings.passwordResetBody,
  });

  const previewHtml = useMemo(() => {
    const title =
      template === "verification"
        ? "Hesabınızı doğrulayın"
        : template === "signIn"
          ? "Giriş güvenlik kodunuz"
          : template === "welcome"
            ? "Aramıza hoş geldiniz"
            : "Şifrenizi yenileyin";

    const showCode = template === "verification" || template === "signIn";

    return `<!doctype html>
<html>
<body style="margin:0;background:#eef4f2;font-family:Arial,sans-serif;">
  <div style="padding:30px 18px;">
    <div style="max-width:580px;margin:auto;">
      <div style="margin-bottom:20px;font-weight:900;letter-spacing:3px;">
        ${
          logoUrl
            ? `<img src="${escapeHtml(
                logoUrl,
              )}" style="max-width:130px;max-height:48px;" />`
            : escapeHtml(fromName || "RADARUNE")
        }
      </div>

      <div style="overflow:hidden;border-radius:24px;background:white;box-shadow:0 20px 60px rgba(0,0,0,.08);">
        <div style="height:7px;background:linear-gradient(90deg,${primaryColor},#8de8c8,#f1b55d);"></div>

        <div style="padding:38px;">
          <div style="color:${primaryColor};font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">
            ${escapeHtml(templateLabels[template])}
          </div>

          <h1 style="margin:15px 0 0;font-size:29px;color:#07100f;">
            ${escapeHtml(title)}
          </h1>

          <p style="margin:20px 0;color:#53625f;font-size:15px;line-height:1.8;">
            ${escapeHtml(formatCustomerEmailCopy(bodies[template])).replaceAll("\n", "<br />")}
          </p>

          ${
            showCode
              ? `<div style="margin:30px 0;text-align:center;">
                  <div style="display:inline-block;padding:18px 26px;border-radius:16px;background:#f2f8f6;font-size:28px;font-weight:800;letter-spacing:9px;">123456</div>
                 </div>`
              : `<div style="margin:30px 0;text-align:center;">
                  <span style="display:inline-block;padding:14px 24px;border-radius:14px;background:${primaryColor};color:white;font-size:14px;font-weight:700;">
                    İşleme devam et
                  </span>
                 </div>`
          }

          <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e7eeec;color:#89938f;font-size:12px;">
            Bu işlemi siz başlatmadıysanız bu e-postayı dikkate almayın.
          </div>
        </div>
      </div>

      <div style="padding:20px;text-align:center;color:#84908c;font-size:11px;line-height:1.6;">
        ${escapeHtml(footerText)}
      </div>
    </div>
  </div>
</body>
</html>`;
  }, [bodies, footerText, fromName, logoUrl, primaryColor, template]);

  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3 outline-none focus:border-accent";

  const textareaClass =
    "mt-2 min-h-28 w-full rounded-xl border border-line bg-surface px-3 py-3 outline-none focus:border-accent";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
      <div className="space-y-6">
        <form action={saveEmailSettingsAction} className="space-y-6">
          <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Server className="size-5" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">SMTP bağlantısı</h2>

                <p className="text-sm text-muted">
                  E-posta sağlayıcısı ve gönderen bilgileri.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Sağlayıcı
                <select
                  className={inputClass}
                  defaultValue={initialSettings.provider || "SMTP"}
                  name="smtpProvider"
                >
                  <option value="SMTP">SMTP</option>
                </select>
              </label>

              <label className="text-sm font-medium">
                SMTP sunucusu
                <input
                  className={inputClass}
                  defaultValue={initialSettings.host}
                  name="smtpHost"
                  placeholder="smtp.hostinger.com"
                  required
                />
              </label>

              <label className="text-sm font-medium">
                Port
                <input
                  className={inputClass}
                  defaultValue={initialSettings.port}
                  max={65535}
                  min={1}
                  name="smtpPort"
                  required
                  type="number"
                />
              </label>

              <label className="text-sm font-medium">
                Kullanıcı adı
                <input
                  className={inputClass}
                  defaultValue={initialSettings.username}
                  name="smtpUsername"
                  required
                />
              </label>

              <label className="text-sm font-medium">
                SMTP parolası
                <input
                  className={inputClass}
                  name="smtpPassword"
                  placeholder={
                    initialSettings.passwordConfigured
                      ? "Kayıtlı parola korunacak"
                      : "SMTP parolasını girin"
                  }
                  type="password"
                />
              </label>

              <label className="text-sm font-medium">
                Gönderen e-posta
                <input
                  className={inputClass}
                  defaultValue={initialSettings.fromEmail}
                  name="smtpFromEmail"
                  required
                  type="email"
                />
              </label>

              <label className="text-sm font-medium sm:col-span-2">
                Gönderen adı
                <input
                  className={inputClass}
                  defaultValue={initialSettings.fromName}
                  name="smtpFromName"
                  onChange={(event) => setFromName(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Palette className="size-5" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">E-posta tasarımı</h2>

                <p className="text-sm text-muted">
                  Tüm e-postalarda kullanılacak marka görünümü.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium sm:col-span-2">
                Logo URL
                <input
                  className={inputClass}
                  defaultValue={initialSettings.logoUrl}
                  name="logoUrl"
                  onChange={(event) => setLogoUrl(event.target.value)}
                  placeholder="https://radarune.com/logo.png"
                  type="url"
                />
              </label>

              <label className="text-sm font-medium">
                Ana renk
                <div className="mt-2 flex gap-2">
                  <input
                    className="h-11 w-14 rounded-xl border border-line bg-surface p-1"
                    name="primaryColorPicker"
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    type="color"
                    value={primaryColor}
                  />

                  <input
                    className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3"
                    name="primaryColor"
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    value={primaryColor}
                  />
                </div>
              </label>

              <label className="text-sm font-medium">
                Footer metni
                <textarea
                  className={textareaClass}
                  defaultValue={initialSettings.footerText}
                  name="footerText"
                  onChange={(event) => setFooterText(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <MailCheck className="size-5" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">Mesaj şablonları</h2>

                <p className="text-sm text-muted">
                  Değişkenler: {"{{name}}"}, {"{{email}}"},{" {{code}}"},{" "}
                  {" {{url}}"}, {" {{platform}}"}.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {(Object.keys(templateLabels) as TemplateKey[]).map((key) => (
                <button
                  aria-pressed={template === key}
                  className={[
                    "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                    template === key
                      ? "border-accent bg-accent text-accent-foreground shadow-sm"
                      : "border-line bg-surface-strong text-muted hover:border-accent/40 hover:text-foreground",
                  ].join(" ")}
                  key={key}
                  onClick={() => setTemplate(key)}
                  type="button"
                >
                  {templateLabels[key]}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4">
              <label className="text-sm font-medium">
                Konu
                <input
                  className={inputClass}
                  name={`${template}Subject`}
                  onChange={(event) =>
                    setSubjects((current) => ({
                      ...current,
                      [template]: event.target.value,
                    }))
                  }
                  value={subjects[template]}
                />
              </label>

              <label className="text-sm font-medium">
                Mesaj
                <textarea
                  className={textareaClass}
                  name={`${template}Body`}
                  onChange={(event) =>
                    setBodies((current) => ({
                      ...current,
                      [template]: event.target.value,
                    }))
                  }
                  value={bodies[template]}
                />
              </label>
            </div>

            <div className="hidden">
              {(Object.keys(templateLabels) as TemplateKey[]).map((key) =>
                key === template ? null : (
                  <div key={key}>
                    <input
                      name={`${key}Subject`}
                      readOnly
                      value={subjects[key]}
                    />

                    <textarea
                      name={`${key}Body`}
                      readOnly
                      value={bodies[key]}
                    />
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-sm">
            <label className="text-sm font-medium">
              Değişiklik sebebi
              <input
                className={inputClass}
                minLength={10}
                name="reason"
                placeholder="SMTP ve e-posta şablonlarını güncelledim"
                required
              />
            </label>

            <button
              className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-sm font-semibold text-white"
              type="submit"
            >
              <MailCheck className="size-4" />
              Ayarları kaydet
            </button>
          </section>
        </form>

        <form
          action={testEmailSettingsAction}
          className="rounded-[2rem] border border-accent/20 bg-accent/5 p-6"
        >
          <div className="flex items-center gap-3">
            <Send className="size-5 text-accent" />

            <div>
              <h2 className="font-semibold">SMTP bağlantısını test et</h2>

              <p className="text-sm text-muted">
                Bağlantı doğrulanır ve UI tasarımlı test e-postası gönderilir.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3"
              name="testRecipient"
              placeholder="test@example.com"
              required
              type="email"
            />

            <button
              className="h-11 rounded-xl border border-line bg-surface px-5 text-sm font-semibold"
              type="submit"
            >
              Test e-postası gönder
            </button>
          </div>
        </form>
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <section className="overflow-hidden rounded-[2rem] border border-line bg-surface shadow-xl">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <Eye className="size-4 text-accent" />
            <span className="text-sm font-semibold">
              Canlı e-posta önizleme
            </span>
          </div>

          <iframe
            className="h-[720px] w-full bg-[#eef4f2]"
            sandbox=""
            srcDoc={previewHtml}
            title="E-posta önizlemesi"
          />
        </section>
      </aside>
    </div>
  );
}
