import "server-only";

import { canAccessAdmin } from "@/features/admin/server/admin-context";
import { createSupportMessageSchema, createSupportTicketSchema, updateSupportTicketSchema, type CreateSupportTicketInput } from "@/features/support/schemas/support.schema";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { prisma } from "@/server/prisma/prisma";
import { notificationService } from "@/features/admin/server/services/notification.service";
import { sendTemplatedEmail } from "@/features/email/server/email-settings.service";

export class SupportService {
  async createTicket(actor: FinanceActorContext, input: CreateSupportTicketInput) {
    const parsed = createSupportTicketSchema.parse(input);
    if (parsed.releaseId) {
      const release = await prisma.release.findFirst({ where: { id: parsed.releaseId, organizationId: actor.organizationId }, select: { id: true, upc: true } });
      if (!release) throw new Error("Yayın bulunamadı.");
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          organizationId: actor.organizationId,
          requesterUserId: actor.userId,
          ...(parsed.releaseId ? { releaseId: parsed.releaseId } : {}),
          subject: parsed.subject,
          priority: parsed.priority,
          ...(parsed.isrc ? { referenceIsrc: parsed.isrc } : {}),
          ...(parsed.upc ? { referenceUpc: parsed.upc } : {}),
          messages: { create: { organizationId: actor.organizationId, senderUserId: actor.userId, content: parsed.message } },
        },
        include: { messages: true },
      });
      return ticket;
    });

    await notificationService.notifyOrganizationAdmins({
      organizationId: actor.organizationId,
      type: "SUPPORT_TICKET_CREATED",
      title: "Yeni destek veya başvuru geldi",
      message: `${parsed.subject} · Başvuru sahibi: ${actor.userId}`,
      entityType: "SupportTicket",
      entityId: ticket.id,
    });

    const recipients = await prisma.user.findMany({
      where: {
        systemRole: { in: ["ADMIN", "SUPER_ADMIN"] },
        accountStatus: "ACTIVE",
        memberships: { some: { organizationId: actor.organizationId } },
      },
      select: { email: true },
    });
    void Promise.allSettled(
      recipients.map((recipient) => sendTemplatedEmail({
        organizationId: actor.organizationId,
        to: recipient.email,
        template: "support",
        title: parsed.subject,
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://radarune.com"}/admin/support`,
      })),
    ).then((results) => {
      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length) console.error("[RADARUNE_EMAIL] Destek başvurusu bildirimi gönderilemedi:", failed.length);
    });

    return ticket;
  }

  async listTickets(actor: FinanceActorContext) {
    return prisma.supportTicket.findMany({
      where: canAccessAdmin(actor) ? { organizationId: actor.organizationId } : { organizationId: actor.organizationId, requesterUserId: actor.userId },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      select: { id: true, subject: true, status: true, priority: true, referenceIsrc: true, referenceUpc: true, releaseId: true, lastMessageAt: true, updatedAt: true, requester: { select: { id: true, name: true, email: true } }, assignedUser: { select: { id: true, name: true } }, _count: { select: { messages: true } } },
    });
  }

  async getThread(actor: FinanceActorContext, ticketId: string) {
    const ticket = await prisma.supportTicket.findFirst({ where: { id: ticketId, organizationId: actor.organizationId, ...(canAccessAdmin(actor) ? {} : { requesterUserId: actor.userId }) }, include: { messages: { where: canAccessAdmin(actor) ? {} : { internal: false }, orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, name: true, systemRole: true } } } }, requester: { select: { id: true, name: true, email: true } }, assignedUser: { select: { id: true, name: true } }, release: { select: { id: true, title: true, upc: true, tracks: { select: { isrc: true, title: true } } } } } });
    if (!ticket) throw new Error("Destek talebi bulunamadı.");
    return ticket;
  }

  async addMessage(actor: FinanceActorContext, ticketId: string, input: unknown) {
    const parsed = createSupportMessageSchema.parse(input);
    if (parsed.internal && !canAccessAdmin(actor)) throw new Error("İç not ekleme yetkiniz yok.");
    const ticket = await prisma.supportTicket.findFirst({ where: { id: ticketId, organizationId: actor.organizationId, ...(canAccessAdmin(actor) ? {} : { requesterUserId: actor.userId }) }, select: { id: true } });
    if (!ticket) throw new Error("Destek talebi bulunamadı.");
    await prisma.$transaction([
      prisma.supportMessage.create({ data: { organizationId: actor.organizationId, ticketId, senderUserId: actor.userId, content: parsed.content, internal: parsed.internal } }),
      prisma.supportTicket.update({ where: { id: ticketId }, data: { lastMessageAt: new Date(), status: canAccessAdmin(actor) && !parsed.internal ? "WAITING_USER" : "IN_PROGRESS" } }),
    ]);
    return this.getThread(actor, ticketId);
  }

  async updateTicket(actor: FinanceActorContext, ticketId: string, input: unknown) {
    if (!canAccessAdmin(actor)) throw new Error("Destek talebi yönetme yetkiniz yok.");
    const parsed = updateSupportTicketSchema.parse(input);

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, organizationId: actor.organizationId },
      select: { id: true },
    });

    if (!ticket) {
      throw new Error("Destek talebi bulunamadı.");
    }

    if (parsed.assignedUserId) {
      const assignee = await prisma.organizationMembership.findFirst({
        where: {
          organizationId: actor.organizationId,
          userId: parsed.assignedUserId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (!assignee) {
        throw new Error("Atanacak kullanıcı bu organizasyonda aktif değil.");
      }
    }

    return prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        ...(parsed.status
          ? {
              status: parsed.status,
              ...(parsed.status === "RESOLVED" || parsed.status === "CLOSED"
                ? { resolvedAt: new Date() }
                : {}),
            }
          : {}),
        ...(parsed.priority ? { priority: parsed.priority } : {}),
        ...(parsed.assignedUserId !== undefined
          ? { assignedUserId: parsed.assignedUserId }
          : {}),
      },
    });
  }
}

export const supportService = new SupportService();
