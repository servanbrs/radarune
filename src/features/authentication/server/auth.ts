import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "@/lib/env";
import { prisma } from "@/server/prisma/prisma";
import { passwordPolicy } from "@/features/authentication/schemas/password-policy.schema";
import { sendTemplatedEmail } from "@/features/email/server/email-settings.service";

const trustedOrigins = [
  env.BETTER_AUTH_URL,
  env.NEXT_PUBLIC_APP_URL,
  ...(env.NODE_ENV === "production" ? [] : ["http://localhost:3000", "http://127.0.0.1:3000"]),
];

async function organizationIdForUser(userId: string) {
  const membership = await prisma.organizationMembership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });
  return membership?.organizationId;
}

async function sendAuthEmail(input: {
  user: { id: string; email: string; name: string };
  url: string;
  template: "verification" | "passwordReset";
}) {
  const organizationId = await organizationIdForUser(input.user.id);
  await sendTemplatedEmail({
    ...(organizationId ? { organizationId } : {}),
    to: input.user.email,
    name: input.user.name,
    url: input.url,
    template: input.template,
  });
}

export const auth = betterAuth({
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
      await sendAuthEmail({ user, url, template: "passwordReset" });
    },
  },
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { socialProviders: { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } } }
    : {}),
  user: {
    modelName: "User",
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
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail({ user, url, template: "verification" });
    },
  },
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
