"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createLabelSchema,
  type CreateLabelInput,
} from "@/features/label/schemas/label.schema";
import { createLabelAction } from "@/features/label/server/actions/create-label.action";

type CreateLabelFormValues = z.input<typeof createLabelSchema>;

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateLabelForm({ labels = [] }: { labels?: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootMessage, setRootMessage] = useState<string | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);
  const form = useForm<CreateLabelFormValues, undefined, CreateLabelInput>({
    resolver: zodResolver(createLabelSchema),
    defaultValues: {
      name: "",
      slug: "",
      legalName: "",
      parentLabelId: null,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setRootError(null);
    setRootMessage(null);

    startTransition(async () => {
      const result = await createLabelAction(values);

      if (!result.success) {
        setRootError(result.message);
        return;
      }

      setRootMessage(`Label created: ${result.data.name}`);
      form.reset();
      router.refresh();
    });
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <Field
        error={form.formState.errors.name?.message}
        htmlFor="label-name"
        label="Label name"
      >
        <Input
          id="label-name"
          placeholder="Northwind Records"
          {...form.register("name", {
            onChange: (event) => {
              const nextName = event.target.value as string;
              const currentSlug = form.getValues("slug");
              const previousNameSlug = normalizeSlug(form.getValues("name"));

              if (!currentSlug || currentSlug === previousNameSlug) {
                form.setValue("slug", normalizeSlug(nextName), {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            },
          })}
        />
      </Field>

      <Field htmlFor="label-parent" label="Tür">
        <select className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm" id="label-parent" {...form.register("parentLabelId")}>
          <option value="">Ana label</option>
          {labels.map((label) => <option key={label.id} value={label.id}>Sublabel · {label.name}</option>)}
        </select>
      </Field>

      <Field
        error={form.formState.errors.slug?.message}
        htmlFor="label-slug"
        label="Label slug"
      >
        <Input
          autoCapitalize="none"
          id="label-slug"
          placeholder="northwind-records"
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

      <Field
        error={form.formState.errors.legalName?.message}
        hint="Optional legal entity name."
        htmlFor="label-legal-name"
        label="Legal name"
      >
        <Input
          id="label-legal-name"
          placeholder="Northwind Records LLC"
          {...form.register("legalName")}
        />
      </Field>

      {rootError ? (
        <p className="rounded-2xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger">
          {rootError}
        </p>
      ) : null}

      {rootMessage ? (
        <p className="rounded-2xl border border-accent/20 bg-accent/8 px-4 py-3 text-sm text-accent">
          {rootMessage}
        </p>
      ) : null}

      <Button disabled={isPending} type="submit">
        {isPending ? "Creating label..." : "Create label"}
      </Button>
    </form>
  );
}
