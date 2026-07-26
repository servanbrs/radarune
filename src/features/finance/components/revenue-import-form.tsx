"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiStatus } from "@/features/finance/components/api-status";

export function RevenueImportForm() {
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
          const response = await fetch("/api/finance/revenue-imports", {
            method: "POST",
            body: formData,
          });
          const result = (await response.json()) as {
            data?: {
              importedRowCount: number;
            };
            message?: string;
            success: boolean;
          };

          if (!result.success) {
            setError(result.message ?? "Revenue import başarısız oldu.");
            return;
          }

          setSuccess(
            `${result.data?.importedRowCount ?? 0} satır başarıyla içe aktarıldı.`,
          );
          router.refresh();
          formElement.reset();
        });
      }}
    >
      <Field htmlFor="revenue-file" label="CSV dosyası">
        <Input accept=".csv,text/csv" id="revenue-file" name="file" required type="file" />
      </Field>
      <Field htmlFor="period-start" label="Dönem başlangıcı">
        <Input id="period-start" name="periodStart" required type="date" />
      </Field>
      <Field htmlFor="period-end" label="Dönem bitişi">
        <Input id="period-end" name="periodEnd" required type="date" />
      </Field>
      <Field htmlFor="reporting-currency" label="Rapor para birimi">
        <Select defaultValue="USD" id="reporting-currency" name="reportingCurrency">
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="TRY">TRY</option>
        </Select>
      </Field>

      <ApiStatus error={error} success={success} />

      <Button disabled={isPending} type="submit">
        {isPending ? "İçe aktarılıyor..." : "Revenue import başlat"}
      </Button>
    </form>
  );
}
