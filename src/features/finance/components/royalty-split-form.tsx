"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiStatus } from "@/features/finance/components/api-status";

type RoyaltySplitFormProps = {
  artists: Array<{
    id: string;
    name: string;
  }>;
  labels: Array<{
    id: string;
    name: string;
  }>;
};

type SplitDraft = {
  artistId?: string;
  beneficiaryUserId?: string;
  labelId?: string;
  participantName: string;
  percentageBps: number;
  role: "LABEL" | "ARTIST" | "PRODUCER" | "COMPOSER" | "LYRICIST" | "MANAGER";
};

export function RoyaltySplitForm({ artists, labels }: RoyaltySplitFormProps) {
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
        const payload = (formData.get("splits") as string)
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [role, participantName, percentageBps, referenceType, referenceId] =
              line.split("|").map((value) => value.trim());

            if (!role || !participantName || !percentageBps) {
              setError("Her split satırı ROLE|Participant|Percentage formatında olmalıdır.");
              return null;
            }

            const draft: SplitDraft = {
              role: role as SplitDraft["role"],
              participantName,
              percentageBps: Number(percentageBps),
            };

            if (referenceType === "artist" && referenceId) {
              draft.artistId = referenceId;
            }

            if (referenceType === "label" && referenceId) {
              draft.labelId = referenceId;
            }

            if (referenceType === "user" && referenceId) {
              draft.beneficiaryUserId = referenceId;
            }

            return draft;
          })
          .filter((draft): draft is SplitDraft => draft !== null);

        if (payload.length === 0) {
          setError("En az bir geçerli split satırı girilmelidir.");
          return;
        }

        startTransition(async () => {
          const response = await fetch("/api/finance/royalty-splits", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              trackKey: formData.get("trackKey"),
              trackTitle: formData.get("trackTitle"),
              releaseTitle: formData.get("releaseTitle") || undefined,
              splits: payload,
            }),
          });
          const result = (await response.json()) as {
            message?: string;
            success: boolean;
          };

          if (!result.success) {
            setError(result.message ?? "Royalty split kaydedilemedi.");
            return;
          }

          setSuccess("Royalty split kaydedildi.");
          router.refresh();
          formElement.reset();
        });
      }}
    >
      <Field htmlFor="split-track-key" label="Track key">
        <Input id="split-track-key" name="trackKey" required />
      </Field>
      <Field htmlFor="split-track-title" label="Track title">
        <Input id="split-track-title" name="trackTitle" required />
      </Field>
      <Field hint="Opsiyonel" htmlFor="split-release-title" label="Release title">
        <Input id="split-release-title" name="releaseTitle" />
      </Field>
      <Field
        hint={`Satır formatı: ROLE|Participant Name|5000|artist|ARTIST_ID. Artist sayısı: ${artists.length}, label sayısı: ${labels.length}.`}
        htmlFor="split-lines"
        label="Split satırları"
      >
        <Textarea id="split-lines" name="splits" required />
      </Field>

      <ApiStatus error={error} success={success} />

      <Button disabled={isPending} type="submit">
        {isPending ? "Kaydediliyor..." : "Royalty split kaydet"}
      </Button>
    </form>
  );
}
