import "server-only";
import { prisma } from "@/server/prisma/prisma";
import { createPayoutMethodSchema, type CreatePayoutMethodInput } from "@/features/finance/schemas/finance.schema";
import { maskSensitiveValue } from "@/features/finance/lib/formatters";
import {
  financeAccessService,
  type FinanceActorContext,
} from "@/features/finance/server/services/finance-access.service";
import { payoutRepository } from "@/features/finance/server/repositories/payout.repository";

function validateMethodByType(input: CreatePayoutMethodInput) {
  if (input.type === "IBAN" && (!input.iban || !input.bankName)) {
    throw new Error("IBAN payout yöntemi için banka adı ve IBAN zorunludur.");
  }

  if (input.type === "PAYONEER" && !input.payoneerEmail) {
    throw new Error("Payoneer payout yöntemi için e-posta zorunludur.");
  }

  if (input.type === "WISE" && !input.wiseRecipientId) {
    throw new Error("Wise payout yöntemi için recipient ID zorunludur.");
  }

  if (input.type === "STRIPE_CONNECT" && !input.stripeConnectAccountId) {
    throw new Error("Stripe Connect için account ID zorunludur.");
  }
}

function maskMethod<T extends {
  bankName?: string | null;
  iban?: string | null;
  payoneerEmail?: string | null;
  wiseRecipientId?: string | null;
  stripeConnectAccountId?: string | null;
}>(method: T) {
  return {
    ...method,
    iban: maskSensitiveValue(method.iban),
    payoneerEmail: maskSensitiveValue(method.payoneerEmail),
    wiseRecipientId: maskSensitiveValue(method.wiseRecipientId),
    stripeConnectAccountId: maskSensitiveValue(method.stripeConnectAccountId),
  };
}

export class PayoutMethodService {
  async listMethods(actor: FinanceActorContext) {
    const methods = await payoutRepository.listMethodsByOrganization(actor.organizationId);
    const accessibleArtistIds = await financeAccessService.listAccessibleArtistIds(actor);

    return methods
      .filter((method) => {
        if (financeAccessService.canViewLabelFinance(actor) || accessibleArtistIds === null) {
          return true;
        }

        return method.artistId ? accessibleArtistIds.includes(method.artistId) : false;
      })
      .map((method) => maskMethod(method));
  }

  async createMethod(
    actor: FinanceActorContext,
    rawInput: CreatePayoutMethodInput & {
      artistId?: string;
      labelId?: string;
    },
  ) {
    const input = createPayoutMethodSchema.parse(rawInput);
    validateMethodByType(input);

    const accessibleArtistIds = await financeAccessService.listAccessibleArtistIds(actor);

    if (rawInput.labelId && !financeAccessService.canViewLabelFinance(actor)) {
      throw new Error("Label payout yöntemi tanımlama yetkiniz yok.");
    }

    if (
      rawInput.artistId &&
      accessibleArtistIds !== null &&
      !accessibleArtistIds.includes(rawInput.artistId)
    ) {
      throw new Error("Bu artist için payout yöntemi tanımlama yetkiniz yok.");
    }

    const method = await prisma.$transaction(async (tx) => {
      if (rawInput.artistId || rawInput.labelId) {
        await tx.payoutMethod.updateMany({
          where: {
            organizationId: actor.organizationId,
            artistId: rawInput.artistId ?? null,
            labelId: rawInput.labelId ?? null,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return payoutRepository.createMethod(
        {
          organizationId: actor.organizationId,
          userId: actor.userId,
          type: input.type,
          accountHolderName: input.accountHolderName,
          ...(rawInput.artistId ? { artistId: rawInput.artistId } : {}),
          ...(rawInput.labelId ? { labelId: rawInput.labelId } : {}),
          ...(input.bankName ? { bankName: input.bankName } : {}),
          ...(input.iban ? { iban: input.iban } : {}),
          ...(input.payoneerEmail ? { payoneerEmail: input.payoneerEmail } : {}),
          ...(input.wiseRecipientId ? { wiseRecipientId: input.wiseRecipientId } : {}),
          ...(input.stripeConnectAccountId
            ? { stripeConnectAccountId: input.stripeConnectAccountId }
            : {}),
        },
        tx,
      );
    });

    return {
      success: true as const,
      data: method,
    };
  }
}

export const payoutMethodService = new PayoutMethodService();
