import { toAdminActor } from "@/features/admin/server/admin-context";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { AdminEmailSettingsForm } from "@/features/email/components/admin-email-settings-form";
import { getEmailSettings } from "@/features/email/server/email-settings.service";
import { AdminShell } from "@/features/admin/components/admin-shell";

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
    <AdminShell title="E-posta merkezi" description="SMTP bağlantısını, marka görünümünü, doğrulama kodlarını ve sistem e-posta mesajlarını tek ekrandan yönetin.">
      <div className="space-y-7">
        <section className="panel p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Radarune Communications</p>
          <p className="mt-2 text-sm text-muted">Gönderim altyapısının canlı yapılandırma özeti.</p>
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
        </section>

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
      </div>
    </AdminShell>
  );
}
