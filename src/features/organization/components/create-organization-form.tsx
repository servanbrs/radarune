"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "@/features/organization/schemas/organization.schema";
import { createOrganizationAction } from "@/features/organization/server/actions/create-organization.action";

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateOrganizationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setRootError(null);

    startTransition(async () => {
      const result = await createOrganizationAction(values);

      if (!result.success) {
        setRootError(result.message);
        return;
      }

        router.replace("/dashboard");
        router.refresh();
    });
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <Field
        error={form.formState.errors.name?.message}
        htmlFor="organization-name"
        label="Çalışma alanı adı"
      >
        <Input
          autoComplete="organization"
          id="organization-name"
          placeholder="Radarune Records"
          {...form.register("name", {
            onChange: (event) => {
              const nextName = event.target.value as string;
              const normalizedSlug = normalizeSlug(nextName);
              const currentSlug = form.getValues("slug");
              const previousNameSlug = normalizeSlug(form.getValues("name"));

              if (!currentSlug || currentSlug === previousNameSlug) {
                form.setValue("slug", normalizedSlug, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            },
          })}
        />
      </Field>

      <Field
        error={form.formState.errors.slug?.message}
        hint="Çalışma alanı adreslerinde kullanılacak kısa ad."
        htmlFor="organization-slug"
        label="Çalışma alanı kısa adı"
      >
        <Input
          autoCapitalize="none"
          autoCorrect="off"
          id="organization-slug"
          placeholder="radarune-records"
          {...form.register("slug", {
            onChange: (event) => {
              form.setValue("slug", normalizeSlug(event.target.value as string), {
                shouldDirty: true,
                shouldValidate: true,
              });
            },
          })}
        />
      </Field>

      {rootError ? (
        <p className="rounded-2xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger">
          {rootError}
        </p>
      ) : null}

      <Button className="mt-2 w-full" disabled={isPending} type="submit">
        {isPending ? "Çalışma alanı oluşturuluyor..." : "Çalışma alanı oluştur"}
      </Button>
    </form>
  );
}
