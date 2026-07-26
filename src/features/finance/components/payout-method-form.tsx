"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiStatus } from "@/features/finance/components/api-status";

type PayoutMethodFormProps = {
  artists: Array<{
    id: string;
    name: string;
  }>;
  labels: Array<{
    id: string;
    name: string;
  }>;
};

export function PayoutMethodForm({ artists, labels }: PayoutMethodFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [type, setType] = useState<"PAYONEER" | "WISE" | "IBAN" | "STRIPE_CONNECT">(
    "IBAN",
  );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        const formElement = event.currentTarget;
        const formData = new FormData(formElement);

        startTransition(async () => {
          const response = await fetch("/api/finance/payout-methods", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: formData.get("type"),
              accountHolderName: formData.get("accountHolderName"),
              artistId: formData.get("artistId") || undefined,
              labelId: formData.get("labelId") || undefined,
              bankName: formData.get("bankName") || undefined,
              iban: formData.get("iban") || undefined,
              payoneerEmail: formData.get("payoneerEmail") || undefined,
              wiseRecipientId: formData.get("wiseRecipientId") || undefined,
              stripeConnectAccountId:
                formData.get("stripeConnectAccountId") || undefined,
            }),
          });
          const result = (await response.json()) as {
            message?: string;
            success: boolean;
          };

          if (!result.success) {
            setError(result.message ?? "Payout yöntemi oluşturulamadı.");
            return;
          }

          setSuccess("Payout yöntemi kaydedildi.");
          router.refresh();
          formElement.reset();
        });
      }}
    >
      <Field htmlFor="payout-type" label="Yöntem türü">
        <Select
          defaultValue="IBAN"
          id="payout-type"
          name="type"
          onChange={(event) =>
            setType(
              event.target.value as "PAYONEER" | "WISE" | "IBAN" | "STRIPE_CONNECT",
            )
          }
        >
          <option value="IBAN">IBAN</option>
          <option value="PAYONEER">Payoneer</option>
          <option value="WISE">Wise</option>
          <option value="STRIPE_CONNECT">Stripe Connect</option>
        </Select>
      </Field>
      <Field htmlFor="payout-account-holder" label="Hesap sahibi">
        <Input id="payout-account-holder" name="accountHolderName" required />
      </Field>
      <Field hint="Opsiyonel" htmlFor="payout-artist" label="Artist">
        <Select defaultValue="" id="payout-artist" name="artistId">
          <option value="">Seçim yok</option>
          {artists.map((artist) => (
            <option key={artist.id} value={artist.id}>
              {artist.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field hint="Opsiyonel" htmlFor="payout-label" label="Label">
        <Select defaultValue="" id="payout-label" name="labelId">
          <option value="">Seçim yok</option>
          {labels.map((label) => (
            <option key={label.id} value={label.id}>
              {label.name}
            </option>
          ))}
        </Select>
      </Field>

      {type === "IBAN" ? (
        <>
          <Field htmlFor="payout-bank-name" label="Banka adı">
            <Input id="payout-bank-name" name="bankName" required />
          </Field>
          <Field htmlFor="payout-iban" label="IBAN">
            <Input id="payout-iban" name="iban" required />
          </Field>
        </>
      ) : null}

      {type === "PAYONEER" ? (
        <Field htmlFor="payout-payoneer-email" label="Payoneer e-postası">
          <Input id="payout-payoneer-email" name="payoneerEmail" required type="email" />
        </Field>
      ) : null}

      {type === "WISE" ? (
        <Field htmlFor="payout-wise-id" label="Wise recipient ID">
          <Input id="payout-wise-id" name="wiseRecipientId" required />
        </Field>
      ) : null}

      {type === "STRIPE_CONNECT" ? (
        <Field htmlFor="payout-stripe-connect" label="Stripe Connect account ID">
          <Input id="payout-stripe-connect" name="stripeConnectAccountId" required />
        </Field>
      ) : null}

      <ApiStatus error={error} success={success} />

      <Button disabled={isPending} type="submit">
        {isPending ? "Kaydediliyor..." : "Payout yöntemi ekle"}
      </Button>
    </form>
  );
}
