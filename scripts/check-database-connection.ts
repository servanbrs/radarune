import "dotenv/config";
import { prisma } from "@/server/prisma/prisma";

async function main() {
  const result = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`;
  console.log(`Veritabanı bağlantısı başarılı (SELECT 1: ${result[0]?.ok ?? "?"}).`);
}

main()
  .catch((error) => {
    console.error("Veritabanı bağlantısı başarısız.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
