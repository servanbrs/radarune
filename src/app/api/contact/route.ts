import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma/prisma";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
const schema=z.object({name:z.string().trim().min(2).max(100),email:z.email(),subject:z.string().trim().min(3).max(160),message:z.string().trim().min(10).max(5000)});
export async function POST(request:Request){
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Form bilgilerini kontrol edin."},{status:400});
  const session = await authSessionService.getOptionalSession();
  const organization = await prisma.organization.findFirst({ where: { tenantStatus: "ACTIVE" }, select: { id: true } });
  if (!organization) return NextResponse.json({ error: "İletişim servisi şu anda kullanılamıyor." }, { status: 503 });
  const recipients = await prisma.user.findMany({ where: { accountStatus: "ACTIVE", systemRole: { in: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] } }, select: { id: true } });
  await prisma.notification.createMany({ data: recipients.map((recipient) => ({ organizationId: organization.id, userId: recipient.id, type: "CONTACT_REQUEST", title: "Yeni iletişim başvurusu", message: `${parsed.data.name} · ${parsed.data.subject}: ${parsed.data.message.slice(0, 180)}`, entityType: "CONTACT_REQUEST" })) });
  if (process.env.CONTACT_WEBHOOK_URL) { await fetch(process.env.CONTACT_WEBHOOK_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...parsed.data,source:"radarune",userId:session?.user.id??null})}).catch(() => undefined); }
  return NextResponse.json({ok:true});
}
