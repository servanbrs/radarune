import "node:process";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import mariadb from "mariadb";
import { z } from "zod";

const rootDirectory = resolve(process.cwd());
const envPath = resolve(rootDirectory, ".env");

const installerInputSchema = z.object({
  appUrl: z
    .url("Geçerli bir uygulama adresi girin.")
    .refine((value) => value.startsWith("https://"), "Production adresi HTTPS olmalıdır."),
  databaseHost: z.string().trim().min(1, "MySQL sunucusu zorunludur."),
  databasePort: z.coerce.number().int().min(1).max(65_535),
  databaseName: z
    .string()
    .trim()
    .min(1, "Veritabanı adı zorunludur.")
    .regex(/^[A-Za-z0-9_$-]+$/, "Veritabanı adı yalnızca harf, sayı, _, - ve $ içerebilir."),
  databaseUser: z.string().trim().min(1, "MySQL kullanıcı adı zorunludur."),
  databasePassword: z.string().min(1, "MySQL parolası zorunludur."),
  storageRoot: z
    .string()
    .trim()
    .refine((value) => isAbsolute(value), "Storage yolu mutlak bir yol olmalıdır."),
  adminName: z.string().trim().min(2, "Yönetici adı en az 2 karakter olmalıdır.").max(80),
  adminEmail: z.email("Geçerli bir yönetici e-postası girin."),
  adminPassword: z.string().min(6, "Yönetici parolası en az 6 karakter olmalıdır."),
  workspaceName: z.string().trim().min(2, "Workspace adı en az 2 karakter olmalıdır.").max(120),
  workspaceSlug: z
    .string()
    .trim()
    .min(2, "Workspace kısa adı en az 2 karakter olmalıdır.")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Workspace kısa adı küçük harf, sayı ve tire içermelidir."),
});

type InstallerInput = z.infer<typeof installerInputSchema>;

async function ask(readline: ReturnType<typeof createInterface>, label: string, defaultValue?: string) {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = (await readline.question(`${label}${suffix}: `)).trim();
  return answer || defaultValue || "";
}

async function askSecret(label: string) {
  if (!input.isTTY || !input.setRawMode) {
    const readline = createInterface({ input, output });
    try {
      return (await readline.question(`${label}: `)).trim();
    } finally {
      readline.close();
    }
  }

  return new Promise<string>((resolveAnswer, reject) => {
    let value = "";
    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          input.setRawMode?.(false);
          input.pause();
          reject(new Error("Kurulum iptal edildi."));
          return;
        }
        if (character === "\r" || character === "\n") {
          input.setRawMode?.(false);
          input.pause();
          input.removeListener("data", onData);
          output.write("\n");
          resolveAnswer(value);
          return;
        }
        if (character === "\u007f") {
          value = value.slice(0, -1);
          continue;
        }
        value += character;
      }
    };

    output.write(`${label}: `);
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

function envValue(value: string) {
  return JSON.stringify(value);
}

function createDatabaseUrl(values: InstallerInput) {
  const url = new URL("mysql://localhost");
  url.hostname = values.databaseHost;
  url.port = String(values.databasePort);
  url.username = values.databaseUser;
  url.password = values.databasePassword;
  url.pathname = `/${values.databaseName}`;
  return url.toString();
}

function createEnvironmentFile(values: InstallerInput) {
  const secret = () => randomBytes(32).toString("hex");
  const databaseUrl = createDatabaseUrl(values);
  const variables = {
    NODE_ENV: "production",
    APP_URL: values.appUrl,
    NEXT_PUBLIC_APP_URL: values.appUrl,
    BETTER_AUTH_URL: values.appUrl,
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: secret(),
    ENCRYPTION_KEY: secret(),
    CRON_SECRET: secret(),
    WEBHOOK_SIGNING_SECRET: secret(),
    API_KEY_PEPPER: secret(),
    IP_HASH_SALT: secret(),
    STORAGE_PROVIDER: "LOCAL",
    STORAGE_ALLOW_LOCAL_IN_PRODUCTION: "true",
    STORAGE_LOCAL_ROOT: values.storageRoot,
    MAIL_PROVIDER: "NONE",
  };
  const lines = [
    ...Object.entries(variables).map(([key, value]) => `${key}=${envValue(value)}`),
    "",
  ];

  return { contents: lines.join("\n"), variables };
}

async function testDatabase(values: InstallerInput) {
  const connection = await mariadb.createConnection({
    host: values.databaseHost,
    port: values.databasePort,
    user: values.databaseUser,
    password: values.databasePassword,
    database: values.databaseName,
    connectTimeout: 10_000,
  });

  try {
    await connection.query("SELECT 1");
  } finally {
    await connection.end();
  }
}

function runCommand(command: string, args: string[]) {
  const executable = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(executable, ["run", command, ...args], {
    cwd: rootDirectory,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: "inherit",
  });
}

async function bootstrapApplication(values: InstallerInput) {
  const { auth } = await import("../src/features/authentication/server/auth");
  const { prisma } = await import("../src/server/prisma/prisma");
  let createdUserId: string | null = null;

  try {
    const existingOrganizationCount = await prisma.organization.count();
    if (existingOrganizationCount > 0) {
      throw new Error("Bu veritabanında zaten bir workspace bulunduğu için kurulum durduruldu.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: values.adminEmail },
      select: { id: true },
    });
    if (existingUser) {
      throw new Error("Bu yönetici e-posta adresi zaten kayıtlı. Yeni kurulum için farklı bir veritabanı kullanın.");
    }

    const signup = await auth.api.signUpEmail({
      body: {
        name: values.adminName,
        email: values.adminEmail,
        password: values.adminPassword,
      },
      headers: new Headers({
        origin: values.appUrl,
        host: new URL(values.appUrl).host,
      }),
    });

    if (!signup.user) {
      throw new Error("Better Auth ilk yönetici hesabını oluşturamadı.");
    }
    createdUserId = signup.user.id;

    const now = new Date();
    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: signup.user.id },
        data: { systemRole: "SUPER_ADMIN", accountStatus: "ACTIVE" },
      });

      const organization = await transaction.organization.create({
        data: {
          name: values.workspaceName,
          slug: values.workspaceSlug,
          ownerUserId: signup.user.id,
          tenantStatus: "ACTIVE",
          onboardingCompletedAt: now,
        },
      });

      await transaction.organizationMembership.create({
        data: {
          organizationId: organization.id,
          userId: signup.user.id,
          role: "OWNER",
          tenantRole: "OWNER",
          status: "ACTIVE",
          joinedAt: now,
        },
      });

      await transaction.installationState.create({
        data: {
          organizationId: organization.id,
          status: "COMPLETED",
          currentStep: "COMPLETED",
          completedAt: now,
          lockedAt: now,
        },
      });
    });
  } catch (error) {
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => undefined);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (existsSync(envPath)) {
    throw new Error(`${envPath} zaten mevcut. Mevcut production environment üzerine yazılmadı.`);
  }

  const readline = createInterface({ input, output });
  try {
    output.write("\nRadarune CodeCanyon ilk kurulum sihirbazı\n\n");
    const rawValues = {
      appUrl: await ask(readline, "Uygulama adresi", "https://radarune.com"),
      databaseHost: await ask(readline, "MySQL sunucusu"),
      databasePort: await ask(readline, "MySQL portu", "3306"),
      databaseName: await ask(readline, "MySQL veritabanı adı"),
      databaseUser: await ask(readline, "MySQL kullanıcı adı"),
      databasePassword: await askSecret("MySQL parolası"),
      storageRoot: await ask(readline, "Kalıcı storage mutlak yolu", resolve(rootDirectory, "storage")),
      adminName: await ask(readline, "İlk yönetici adı"),
      adminEmail: await ask(readline, "İlk yönetici e-postası"),
      adminPassword: await askSecret("İlk yönetici parolası (en az 6 karakter)"),
      workspaceName: await ask(readline, "İlk workspace adı", "Radarune Records"),
      workspaceSlug: await ask(readline, "İlk workspace kısa adı", "radarune-records"),
    };
    const adminPasswordConfirmation = await askSecret("İlk yönetici parolası tekrarı");
    if (rawValues.adminPassword !== adminPasswordConfirmation) {
      throw new Error("Yönetici parolaları eşleşmiyor.");
    }

    const values = installerInputSchema.parse(rawValues);
    output.write("\nMySQL bağlantısı test ediliyor...\n");
    await testDatabase(values);
    output.write("MySQL bağlantısı başarılı.\n");

    mkdirSync(dirname(envPath), { recursive: true });
    const environment = createEnvironmentFile(values);
    writeFileSync(envPath, environment.contents, { encoding: "utf8", mode: 0o600 });
    Object.assign(process.env, environment.variables);
    mkdirSync(values.storageRoot, { recursive: true, mode: 0o750 });

    runCommand("prisma:generate", []);
    runCommand("validate:production", []);
    runCommand("prisma:migrate:deploy", []);
    await bootstrapApplication(values);

    output.write("\nKurulum tamamlandı. /install route'u workspace oluşturulduğu için kilitlendi.\n");
    output.write(`Giriş adresi: ${values.appUrl}/sign-in\n`);
  } finally {
    readline.close();
  }
}

main().catch((error: unknown) => {
  output.write(`\nKurulum başarısız: ${error instanceof Error ? error.message : "Bilinmeyen hata."}\n`);
  process.exitCode = 1;
});
