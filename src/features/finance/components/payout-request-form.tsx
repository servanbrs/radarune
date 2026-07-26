"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiStatus } from "@/features/finance/components/api-status";

type PayoutRequestFormProps = {
  methods: Array<{
    id: string;
    accountHolderName: string;
    type: string;
  }>;
  statements: Array<{
    closingBalance: string;
    currencyCode: "TRY" | "USD" | "EUR";
    id: string;
    subjectLabel: string;
  }>;
};

export function PayoutRequestForm({
  methods,
  statements,
}: PayoutRequestFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const response = await fetch("/api/finance/payouts/request", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              statementId: formData.get("statementId"),
              payoutMethodId: formData.get("payoutMethodId"),
              amountMinor: formData.get("amountMinor"),
              currencyCode: formData.get("currencyCode"),
            }),
          });
          const result = (await response.json()) as {
            message?: string;
            success: boolean;
          };

          if (!result.success) {
            setError(result.message ?? "Payout talebi oluşturulamadı.");
            return;
          }

          setSuccess("Payout talebi oluşturuldu.");
          router.refresh();
        });
      }}
    >
      <Field htmlFor="statement-id" label="Statement">
        <Select defaultValue="" id="statement-id" name="statementId" required>
          <option value="">Statement seçin</option>
          {statements.map((statement) => (
            <option key={statement.id} value={statement.id}>
              {statement.subjectLabel} · {statement.currencyCode} · {statement.closingBalance}
            </option>
          ))}
        </Select>
      </Field>
      <Field htmlFor="payout-method-id" label="Payout yöntemi">
        <Select defaultValue="" id="payout-method-id" name="payoutMethodId" required>
          <option value="">Yöntem seçin</option>
          {methods.map((method) => (
            <option key={method.id} value={method.id}>
              {method.type} · {method.accountHolderName}
            </option>
          ))}
        </Select>
      </Field>
      <Field hint="Minor unit girin. Örn. 125050" htmlFor="amount-minor" label="Tutar">
        <Input id="amount-minor" min="1" name="amountMinor" required step="1" type="number" />
      </Field>
      <Field htmlFor="payout-currency" label="Para birimi">
        <Select defaultValue="USD" id="payout-currency" name="currencyCode">
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="TRY">TRY</option>
        </Select>
      </Field>

      <ApiStatus error={error} success={success} />

      <Button disabled={isPending} type="submit">
        {isPending ? "İşleniyor..." : "Payout talep et"}
      </Button>
    </form>
  );
}
