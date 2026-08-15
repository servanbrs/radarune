import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, twoFactor } from "better-auth/plugins";

import { env } from "@/lib/env";
import { prisma } from "@/server/prisma/prisma";
import { passwordPolicy } from "@/features/authentication/schemas/password-policy.schema";
import {
  sendSecurityCodeEmail,
  sendTemplatedEmail,
} from "@/features/email/server/email-settings.service";
import { getSocialProviderCredentials } from "@/features/authentication/server/social-provider-configuration.service";
import { notificationService } from "@/features/admin/server/services/notification.service";

async function socialAuthConfig(provider: "GOOGLE_OAUTH" | "FACEBOOK_OAUTH") {
  const credentials = await getSocialProviderCredentials(provider);
  return credentials?.clientId && credentials.clientSecret
    ? { clientId: credentials.clientId, clientSecret: credentials.clientSecret }
    : { enabled: false, clientId: "disabled", clientSecret: "disabled" };
}

const trustedOrigins = [
  env.BETTER_AUTH_URL,
  env.NEXT_PUBLIC_APP_URL,
  ...(env.NODE_ENV === "production"
    ? []
    : ["http://localhost:3000", "http://127.0.0.1:3000"]),
];

async function organizationIdForUser(userId: string) {
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      organizationId: true,
    },
  });

  return membership?.organizationId;
}

async function sendAuthEmail(input: {
  user: {
    id: string;
    email: string;
    name: string;
  };
  url: string;
  template: "verification" | "passwordReset";
}) {
  const organizationId = await organizationIdForUser(input.user.id);

  await sendTemplatedEmail({
    ...(organizationId
      ? {
          organizationId,
        }
      : {}),
    to: input.user.email,
    name: input.user.name,
    url: input.url,
    template: input.template,
  });
}

export function createAuth() {
  return betterAuth({
  appName: "Radarune",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: passwordPolicy.minLength,
    maxPasswordLength: passwordPolicy.maxLength,

    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        user,
        url,
        template: "passwordReset",
      });
    },
  },

  socialProviders: {
    google: () => socialAuthConfig("GOOGLE_OAUTH"),
    facebook: () => socialAuthConfig("FACEBOOK_OAUTH"),
  },

  user: {
    modelName: "User",
  },

  databaseHooks: {
    user: {
      create: {
        async after(user) {
          // Registration must not fail because an optional notification or
          // welcome email is temporarily unavailable.
          let organization: { id: string } | null = null;
          try {
            organization = await prisma.organization.findFirst({
              where: { tenantStatus: { in: ["ACTIVE", "MAINTENANCE"] } },
              orderBy: { createdAt: "asc" },
              select: { id: true },
            });
          } catch (error) {
            console.error("[RADARUNE_SIGNUP] Organizasyon bulunamadı:", error);
          }

          if (organization) {
            try {
              await prisma.organizationMembership.upsert({
                where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
                update: { status: "ACTIVE", joinedAt: new Date() },
                create: {
                  organizationId: organization.id,
                  userId: user.id,
                  role: "MEMBER",
                  status: "ACTIVE",
                  joinedAt: new Date(),
                },
              });
            } catch (error) {
              console.error("[RADARUNE_SIGNUP] Organizasyon üyeliği oluşturulamadı:", error);
            }
          }

          try {
            await sendTemplatedEmail({
              ...(organization ? { organizationId: organization.id } : {}),
              to: user.email,
              name: user.name,
              template: "welcome",
            });
          } catch (error) {
            console.error("[RADARUNE_SIGNUP] Hoş geldin e-postası gönderilemedi:", error);
          }

          try {
            await notificationService.notifyStaff({
              ...(organization ? { organizationId: organization.id } : {}),
              type: "NEW_USER_REGISTERED",
              title: "Yeni kullanıcı kaydı",
              message: `${user.name} (${user.email}) Radarune'e katıldı.`,
              entityType: "User",
              entityId: user.id,
            });
          } catch (error) {
            console.error("[RADARUNE_SIGNUP] Ekip bildirimi gönderilemedi:", error);
          }
        },
      },
    },
  },

  session: {
    modelName: "Session",
  },

  account: {
    modelName: "Account",
  },

  verification: {
    modelName: "Verification",
  },

  emailVerification: {
    sendOnSignUp: false,

    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail({
        user,
        url,
        template: "verification",
      });
    },
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      allowedAttempts: 5,
      disableSignUp: true,
      sendVerificationOnSignUp: false,
      overrideDefaultEmailVerification: true,

      async sendVerificationOTP({ email, otp, type }) {
        await sendSecurityCodeEmail({
          email,
          code: otp,
          type:
            type === "forget-password"
              ? "password-reset"
              : type === "change-email"
                ? "email-verification"
                : type,
        });
      },
    }),

    twoFactor({
      issuer: "Radarune",
      twoFactorCookieMaxAge: 600,
      trustDeviceMaxAge: 30 * 24 * 60 * 60,

      /*
       * İlk başarılı şifreli girişte 2FA otomatik
       * etkinleştirilecek. E-posta OTP kullanıldığı
       * için ayrıca TOTP kurulum ekranı istemiyoruz.
       */
      skipVerificationOnEnable: true,

      otpOptions: {
        period: 600,
        storeOTP: "encrypted",

        async sendOTP({ user, otp }) {
          const organizationId = await organizationIdForUser(user.id);

          console.info("[RADARUNE_2FA] OTP hazırlanıyor:", {
            userId: user.id,
            email: user.email.replace(/(^.).*(@.*$)/, "$1***$2"),
            organizationId: organizationId ?? null,
          });

          try {
            await sendSecurityCodeEmail({
              ...(organizationId
                ? {
                    organizationId,
                  }
                : {}),
              email: user.email,
              code: otp,
              type: "sign-in",
            });

            console.info(
              "[RADARUNE_2FA] OTP e-postası SMTP sunucusuna teslim edildi.",
            );
          } catch (error) {
            console.error("[RADARUNE_2FA] SMTP gönderim hatası:", error);

            throw error;
          }
        },
      },

      accountLockout: {
        enabled: true,
        maxFailedAttempts: 5,
        durationSeconds: 900,
      },
    }),
  ],

  trustedOrigins,

  advanced: {
    useSecureCookies: env.NODE_ENV === "production",

    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    },
  },

  experimental: {
    joins: true,
  },
  });
}

export const auth = createAuth();
