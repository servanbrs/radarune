"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiStatus } from "@/features/finance/components/api-status";

type FinancialAdjustmentFormProps = {
  statements: Array<{
    currencyCode: "TRY" | "USD" | "EUR";
    id: string;
    subjectLabel: string;
  }>;
};

export function FinancialAdjustmentForm({
  statements,
}: FinancialAdjustmentFormProps) {
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

        const formElement = event.currentTarget;
        const formData = new FormData(formElement);

        startTransition(async () => {
          const response = await fetch("/api/finance/adjustments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              statementId: formData.get("statementId"),
              amountMinor: formData.get("amountMinor"),
              currencyCode: formData.get("currencyCode"),
              direction: formData.get("direction"),
              reason: formData.get("reason"),
            }),
          });
          const result = (await response.json()) as {
            message?: string;
            success: boolean;
          };

          if (!result.success) {
            setError(result.message ?? "Adjustment kaydı oluşturulamadı.");
            return;
          }

          setSuccess("Adjustment kaydı oluşturuldu.");
          router.refresh();
          formElement.reset();
        });
      }}
    >
      <Field htmlFor="adjustment-statement" label="Statement">
        <Select defaultValue="" id="adjustment-statement" name="statementId" required>
          <option value="">Statement seçin</option>
          {statements.map((statement) => (
            <option key={statement.id} value={statement.id}>
              {statement.subjectLabel} · {statement.currencyCode}
            </option>
          ))}
        </Select>
      </Field>
      <Field htmlFor="adjustment-currency" label="Para birimi">
        <Select defaultValue="USD" id="adjustment-currency" name="currencyCode">
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="TRY">TRY</option>
        </Select>
      </Field>
      <Field htmlFor="adjustment-direction" label="Yön">
        <Select defaultValue="CREDIT" id="adjustment-direction" name="direction">
          <option value="CREDIT">CREDIT</option>
          <option value="DEBIT">DEBIT</option>
        </Select>
      </Field>
      <Field hint="Minor unit girin." htmlFor="adjustment-amount" label="Tutar">
        <Input id="adjustment-amount" min="1" name="amountMinor" required step="1" type="number" />
      </Field>
      <Field htmlFor="adjustment-reason" label="Açıklama">
        <Textarea id="adjustment-reason" name="reason" required />
      </Field>

      <ApiStatus error={error} success={success} />

      <Button disabled={isPending} type="submit">
        {isPending ? "Kaydediliyor..." : "Adjustment ekle"}
      </Button>
    </form>
  );
}
