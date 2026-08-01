import { toAdminActor } from "@/features/admin/server/admin-context";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { AdminEmailSettingsForm } from "@/features/email/components/admin-email-settings-form";
import { getEmailSettings } from "@/features/email/server/email-settings.service";

export default async function AdminEmailPage() {
  const { organization, user } = await authSessionService.getDashboardContext();

  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  const settings = await getEmailSettings(actor.organizationId);

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-7 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <header className="rounded-[2rem] border border-line bg-surface p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Radarune Communications
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          E-posta Merkezi
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          SMTP bağlantısını, marka görünümünü, doğrulama kodlarını ve sistem
          e-posta mesajlarını tek ekrandan yönetin.
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-line bg-background px-3 py-2">
            SMTP: {settings.host ? "Yapılandırıldı" : "Eksik"}
          </span>

          <span className="rounded-full border border-line bg-background px-3 py-2">
            Gönderen: {settings.fromEmail || "Tanımlanmadı"}
          </span>

          <span className="rounded-full border border-line bg-background px-3 py-2">
            Şifre: {settings.password ? "Kayıtlı" : "Eksik"}
          </span>
        </div>
      </header>

      <AdminEmailSettingsForm
        initialSettings={{
          provider: settings.provider,
          host: settings.host,
          port: settings.port,
          username: settings.username,
          passwordConfigured: Boolean(settings.password),
          fromEmail: settings.fromEmail,
          fromName: settings.fromName,
          logoUrl: settings.logoUrl,
          primaryColor: settings.primaryColor,
          footerText: settings.footerText,
          verificationSubject: settings.verificationSubject,
          verificationBody: settings.verificationBody,
          signInSubject: settings.signInSubject,
          signInBody: settings.signInBody,
          welcomeSubject: settings.welcomeSubject,
          welcomeBody: settings.welcomeBody,
          passwordResetSubject: settings.passwordResetSubject,
          passwordResetBody: settings.passwordResetBody,
        }}
      />
    </main>
  );
}
