"use client";

import {
  useFieldArray,
  type Control,
  type UseFormRegister,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ReleaseWizardFormValues } from "@/features/releases/components/release-wizard";
import { contributorRoleValues } from "@/features/releases/constants/release.constants";

const contributorRoleLabels: Record<
  (typeof contributorRoleValues)[number],
  string
> = {
  COMPOSER: "Besteci",
  LYRICIST: "Söz yazarı",
  PRODUCER: "Prodüktör",
  MIXING_ENGINEER: "Mix mühendisi",
  MASTERING_ENGINEER: "Mastering mühendisi",
  ARRANGER: "Aranjör",
  VOCALIST: "Vokalist",
  BACKGROUND_VOCALIST: "Geri vokal",
  GUITARIST: "Gitarist",
  BASSIST: "Bas gitarist",
  PIANIST: "Piyanist",
  DRUMMER: "Davulcu",
};

export function TrackRightsEditor({
  control,
  index,
  register,
}: {
  control: Control<ReleaseWizardFormValues>;
  index: number;
  register: UseFormRegister<ReleaseWizardFormValues>;
}) {
  const contributors = useFieldArray({
    control,
    name: `tracks.${index}.contributors` as const,
  });

  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {index + 1}. parça
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            Hak sahipleri ve katkıda bulunanlar
          </h3>
        </div>

        <Button
          onClick={() =>
            contributors.append({
              name: "",
              role: "COMPOSER",
            })
          }
          size="sm"
          type="button"
          variant="secondary"
        >
          Kişi ekle
        </Button>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted">
        Her parçada en az bir besteci; sözlü parçalarda ayrıca en az bir söz
        yazarı bulunmalıdır.
      </p>

      <div className="mt-5 grid gap-3">
        {contributors.fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line px-4 py-5 text-sm text-muted">
            Henüz hak sahibi eklenmedi.
          </div>
        ) : null}

        {contributors.fields.map((field, contributorIndex) => (
          <div
            className="grid gap-3 rounded-xl border border-line bg-surface p-4 md:grid-cols-[minmax(0,1fr)_minmax(180px,0.7fr)_auto] md:items-end"
            key={field.id}
          >
            <Field
              htmlFor={`tracks.${index}.contributors.${contributorIndex}.name`}
              label="Ad soyad"
            >
              <Input
                id={`tracks.${index}.contributors.${contributorIndex}.name`}
                placeholder="Eser sahibinin yasal adı"
                {...register(
                  `tracks.${index}.contributors.${contributorIndex}.name`,
                )}
              />
            </Field>

            <Field
              htmlFor={`tracks.${index}.contributors.${contributorIndex}.role`}
              label="Rol"
            >
              <Select
                id={`tracks.${index}.contributors.${contributorIndex}.role`}
                {...register(
                  `tracks.${index}.contributors.${contributorIndex}.role`,
                )}
              >
                {contributorRoleValues.map((role) => (
                  <option key={role} value={role}>
                    {contributorRoleLabels[role]}
                  </option>
                ))}
              </Select>
            </Field>

            <Button
              onClick={() => contributors.remove(contributorIndex)}
              type="button"
              variant="ghost"
            >
              Sil
            </Button>
          </div>
        ))}
      </div>
    </article>
  );
}
