"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiStatus } from "@/features/finance/components/api-status";

export function RoyaltyGenerateForm() {
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
          const response = await fetch("/api/finance/royalty-reports/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              periodStart: formData.get("periodStart"),
              periodEnd: formData.get("periodEnd"),
              reportingCurrency: formData.get("reportingCurrency"),
              radaruneCommissionBps: Number(formData.get("radaruneCommissionBps")),
            }),
          });
          const result = (await response.json()) as {
            data?: {
              royaltyReportId: string;
            };
            message?: string;
            success: boolean;
          };

          if (!result.success) {
            setError(result.message ?? "Royalty raporu oluşturulamadı.");
            return;
          }

          setSuccess(`Royalty raporu oluşturuldu: ${result.data?.royaltyReportId ?? ""}`);
          router.refresh();
        });
      }}
    >
      <Field htmlFor="royalty-period-start" label="Dönem başlangıcı">
        <Input id="royalty-period-start" name="periodStart" required type="date" />
      </Field>
      <Field htmlFor="royalty-period-end" label="Dönem bitişi">
        <Input id="royalty-period-end" name="periodEnd" required type="date" />
      </Field>
      <Field htmlFor="royalty-currency" label="Rapor para birimi">
        <Select defaultValue="USD" id="royalty-currency" name="reportingCurrency">
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="TRY">TRY</option>
        </Select>
      </Field>
      <Field
        hint="Örn. %15 komisyon için 1500 girin."
        htmlFor="radarune-commission-bps"
        label="Radarune komisyonu (bps)"
      >
        <Input
          defaultValue="1500"
          id="radarune-commission-bps"
          min="0"
          name="radaruneCommissionBps"
          required
          step="1"
          type="number"
        />
      </Field>

      <ApiStatus error={error} success={success} />

      <Button disabled={isPending} type="submit">
        {isPending ? "Hesaplanıyor..." : "Royalty raporu oluştur"}
      </Button>
    </form>
  );
}
