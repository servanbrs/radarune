"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Send, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  distributionProviderValues,
  releaseStoreValues,
  releaseTypeLabels,
  releaseTypeValues,
  storeLabels,
} from "@/features/releases/constants/release.constants";
import { updateReleaseSchema } from "@/features/releases/schemas/release.schema";
import { TrackEditor } from "@/features/releases/components/track-editor";
import { ValidationSummary } from "@/features/releases/components/validation-summary";
import { WizardStepNavigation, type WizardStep } from "@/features/releases/components/wizard-step-navigation";

type SelectOption = {
  id: string;
  name: string;
};

type InitialRelease = {
  id: string;
  title: string;
  versionTitle: string | null;
  primaryLanguage: string;
  primaryGenre: string;
  secondaryGenre: string | null;
  type: "SINGLE" | "EP" | "ALBUM";
  explicit: boolean;
  labelId: string | null;
  copyrightP: string;
  copyrightC: string;
  plannedReleaseDate: Date | string | null;
  originalReleaseDate: Date | string | null;
  previouslyReleased: boolean;
  upc: string | null;
  distributionProvider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL" | null;
  worldwideDistribution: boolean;
  presaveEnabled: boolean;
  dolbyAtmosEnabled: boolean;
  contentIdEnabled: boolean;
  artists: Array<{
    artistId: string;
    role: "PRIMARY_ARTIST" | "FEATURED_ARTIST" | "REMIXER" | "PRODUCER";
    sortOrder: number;
  }>;
  stores: Array<{
    storeCode: string;
  }>;
  territories: Array<{
    territoryCode: string;
  }>;
  tracks: Array<{
    id: string;
    title: string;
    versionTitle: string | null;
    trackNumber: number;
    discNumber: number;
    language: string;
    explicit: boolean;
    instrumental: boolean;
    previouslyReleased: boolean;
    isrc: string | null;
    lyrics: string | null;
    previewStartSeconds: number | null;
    artists: Array<{
      artistId: string;
      role: "PRIMARY_ARTIST" | "FEATURED_ARTIST" | "REMIXER" | "PRODUCER";
      sortOrder: number;
    }>;
  }>;
  validationIssues: Array<{
    id: string;
    fieldPath: string;
    message: string;
    severity: "ERROR" | "WARNING" | "INFO" | "CRITICAL";
  }>;
};

export type ReleaseWizardFormValues = z.input<typeof updateReleaseSchema>;

const steps: WizardStep[] = [
  { id: "type", title: "Yayın türü" },
  { id: "basic", title: "Temel bilgiler" },
  { id: "artists", title: "Sanatçılar" },
  { id: "tracks", title: "Parçalar" },
  { id: "contributors", title: "Katkıda bulunanlar" },
  { id: "distribution", title: "Dağıtım" },
  { id: "artwork", title: "Kapak" },
  { id: "review", title: "Önizleme" },
];

export function ReleaseWizard({
  artists,
  initialRelease,
  labels,
}: {
  artists: SelectOption[];
  labels: SelectOption[];
  initialRelease?: InitialRelease | null;
}) {
  const router = useRouter();
  const [releaseId, setReleaseId] = useState(initialRelease?.id ?? "");
  const [currentStep, setCurrentStep] = useState(steps[0]?.id ?? "type");
  const [issues, setIssues] = useState(initialRelease?.validationIssues ?? []);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ReleaseWizardFormValues>({
    resolver: zodResolver(updateReleaseSchema),
    defaultValues: toFormDefaults(initialRelease, artists[0]?.id),
  });

  const tracks = useFieldArray({
    control: form.control,
    name: "tracks",
  });
  const watchedValues = useWatch({
    control: form.control,
  });

  const saveDraft = form.handleSubmit((values) => {
    startTransition(async () => {
      const targetReleaseId = await ensureRelease(values);
      if (!targetReleaseId) {
        return;
      }

      const response = await fetch(`/api/releases/${targetReleaseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message ?? "Taslak kaydedilemedi.");
        return;
      }

      toast.success("Taslak kaydedildi.");
      router.refresh();
    });
  });

  const uploadFile = (kind: "AUDIO" | "ARTWORK", file: File | null, trackId?: string) => {
    if (!file) {
      toast.error("Dosya seçilmedi.");
      return;
    }

    startTransition(async () => {
      const targetReleaseId = await ensureRelease(form.getValues());
      if (!targetReleaseId) {
        return;
      }

      const formData = new FormData();
      formData.set("kind", kind);
      formData.set("file", file);
      if (trackId) {
        formData.set("trackId", trackId);
      }

      const response = await fetch(`/api/releases/${targetReleaseId}/uploads`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message ?? "Dosya yüklenemedi.");
        return;
      }

      toast.success(kind === "ARTWORK" ? "Kapak yüklendi." : "Ses dosyası yüklendi.");
      router.refresh();
    });
  };

  const validateAndSubmit = () => {
    startTransition(async () => {
      const targetReleaseId = await ensureRelease(form.getValues());
      if (!targetReleaseId) {
        return;
      }

      await saveValues(targetReleaseId, form.getValues());
      const validateResponse = await fetch(`/api/releases/${targetReleaseId}/validate`, {
        method: "POST",
      });
      const validateResult = await validateResponse.json();
      setIssues(validateResult.data?.issues ?? []);

      if (!validateResponse.ok || !validateResult.success) {
        toast.error(validateResult.message ?? "Doğrulama hataları var.");
        return;
      }

      const submitResponse = await fetch(`/api/releases/${targetReleaseId}/submit`, {
        method: "POST",
      });
      const submitResult = await submitResponse.json();

      if (!submitResponse.ok || !submitResult.success) {
        toast.error(submitResult.message ?? "Yayın incelemeye gönderilemedi.");
        return;
      }

      toast.success("Yayın admin incelemesine gönderildi.");
      router.push(`/releases/${targetReleaseId}`);
    });
  };

  async function ensureRelease(values: ReleaseWizardFormValues) {
    if (releaseId) {
      return releaseId;
    }

    const response = await fetch("/api/releases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: values.title,
        versionTitle: values.versionTitle,
        primaryLanguage: values.primaryLanguage,
        primaryGenre: values.primaryGenre,
        type: values.type,
        explicit: values.explicit ?? false,
        labelId: values.labelId,
        copyrightP: values.copyrightP,
        copyrightC: values.copyrightC,
      }),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      toast.error(result.message ?? "Taslak oluşturulamadı.");
      return "";
    }

    setReleaseId(result.data.id);
    window.history.replaceState(null, "", `/releases/${result.data.id}/edit`);
    return result.data.id as string;
  }

  async function saveValues(targetReleaseId: string, values: ReleaseWizardFormValues) {
    await fetch(`/api/releases/${targetReleaseId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
  }

  return (
    <form className="space-y-8" onSubmit={saveDraft}>
      <WizardStepNavigation currentStep={currentStep} onSelect={setCurrentStep} steps={steps} />

      <section className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
        {currentStep === "type" ? (
          <div className="grid gap-4 md:grid-cols-3">
            {releaseTypeValues.map((type) => (
              <label className="rounded-2xl border border-line bg-white p-5 text-sm font-semibold" key={type}>
                <input className="mr-2" type="radio" value={type} {...form.register("type")} />
                {releaseTypeLabels[type]}
              </label>
            ))}
          </div>
        ) : null}

        {currentStep === "basic" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field htmlFor="title" label="Yayın adı" error={form.formState.errors.title?.message}>
              <Input id="title" {...form.register("title")} />
            </Field>
            <Field htmlFor="versionTitle" label="Sürüm adı">
              <Input id="versionTitle" {...form.register("versionTitle")} />
            </Field>
            <Field htmlFor="primaryLanguage" label="Birincil dil">
              <Input id="primaryLanguage" {...form.register("primaryLanguage")} />
            </Field>
            <Field htmlFor="primaryGenre" label="Ana tür">
              <Input id="primaryGenre" {...form.register("primaryGenre")} />
            </Field>
            <Field htmlFor="secondaryGenre" label="Alt tür">
              <Input id="secondaryGenre" {...form.register("secondaryGenre")} />
            </Field>
            <Field htmlFor="labelId" label="Plak şirketi">
              <Select id="labelId" {...form.register("labelId")}>
                <option value="">Label seçilmedi</option>
                {labels.map((label) => (
                  <option key={label.id} value={label.id}>
                    {label.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="copyrightP" label="P telif bilgisi">
              <Input id="copyrightP" {...form.register("copyrightP")} />
            </Field>
            <Field htmlFor="copyrightC" label="C telif bilgisi">
              <Input id="copyrightC" {...form.register("copyrightC")} />
            </Field>
            <Field htmlFor="plannedReleaseDate" label="Planlanan yayın tarihi">
              <Input id="plannedReleaseDate" type="date" {...form.register("plannedReleaseDate")} />
            </Field>
            <Field htmlFor="originalReleaseDate" label="Orijinal yayın tarihi">
              <Input id="originalReleaseDate" type="date" {...form.register("originalReleaseDate")} />
            </Field>
            <Field htmlFor="upc" label="UPC">
              <Input id="upc" {...form.register("upc")} />
            </Field>
            <div className="flex flex-col justify-end gap-3 pb-5">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" {...form.register("explicit")} />
                Explicit içerik
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" {...form.register("previouslyReleased")} />
                Daha önce dağıtıldı
              </label>
            </div>
          </div>
        ) : null}

        {currentStep === "artists" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field htmlFor="releasePrimaryArtist" label="Primary artist">
              <Select id="releasePrimaryArtist" {...form.register("artists.0.artistId")}>
                <option value="">Sanatçı seç</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </Select>
            </Field>
            <input type="hidden" value="PRIMARY_ARTIST" {...form.register("artists.0.role")} />
            <input type="hidden" value={0} {...form.register("artists.0.sortOrder", { valueAsNumber: true })} />
          </div>
        ) : null}

        {currentStep === "tracks" ? (
          <div className="space-y-5">
            {tracks.fields.map((field, index) => (
              <div className="space-y-3" key={field.id}>
                <TrackEditor artists={artists} index={index} onRemove={() => tracks.remove(index)} register={form.register} />
                {initialRelease?.tracks[index]?.id ? (
                  <Field htmlFor={`audio-${index}`} label="Ses dosyası">
                    <Input
                      accept=".wav,.flac,audio/wav,audio/flac"
                      id={`audio-${index}`}
                      onChange={(event) => uploadFile("AUDIO", event.target.files?.[0] ?? null, initialRelease.tracks[index]?.id)}
                      type="file"
                    />
                  </Field>
                ) : null}
              </div>
            ))}
            <Button
              onClick={() =>
                tracks.append({
                  title: "",
                  versionTitle: "",
                  trackNumber: tracks.fields.length + 1,
                  discNumber: 1,
                  language: "tr",
                  explicit: false,
                  instrumental: false,
                  previouslyReleased: false,
                  isrc: "",
                  lyrics: "",
                  previewStartSeconds: 0,
                  artists: [{ artistId: artists[0]?.id ?? "", role: "PRIMARY_ARTIST", sortOrder: 0 }],
                  contributors: [],
                })
              }
              type="button"
              variant="secondary"
            >
              Parça ekle
            </Button>
          </div>
        ) : null}

        {currentStep === "contributors" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Katkıda bulunanlar parça bazında kaydedilir. Parça düzenleyicisindeki contributor alanları API tarafından doğrulanır.
            </p>
            <Field htmlFor="contributorNote" label="İç not">
              <Textarea id="contributorNote" disabled value="Contributor rolleri: composer, lyricist, producer ve teknik ekip rolleri desteklenir." />
            </Field>
          </div>
        ) : null}

        {currentStep === "distribution" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field htmlFor="provider" label="Dağıtım sağlayıcısı">
              <Select id="provider" {...form.register("provider")}>
                {distributionProviderValues.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="releaseDate" label="Dağıtım yayın tarihi">
              <Input id="releaseDate" type="date" {...form.register("releaseDate")} />
            </Field>
            <div className="md:col-span-2">
              <p className="mb-3 text-sm font-semibold">Mağazalar</p>
              <div className="grid gap-3 md:grid-cols-3">
                {releaseStoreValues.map((store) => (
                  <label className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm" key={store}>
                    <input type="checkbox" value={store} {...form.register("stores")} />
                    {storeLabels[store]}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" {...form.register("worldwideDistribution")} />
              Dünya geneli dağıtım
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" {...form.register("presaveEnabled")} />
              Pre-save açık
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" {...form.register("dolbyAtmosEnabled")} />
              Dolby Atmos
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" {...form.register("contentIdEnabled")} />
              YouTube Content ID
            </label>
          </div>
        ) : null}

        {currentStep === "artwork" ? (
          <div className="space-y-4">
            <Field htmlFor="artwork" label="Kapak görseli" hint="JPG veya PNG, kare, en az 3000 x 3000 piksel, en fazla 20 MB.">
              <Input accept=".jpg,.jpeg,.png,image/jpeg,image/png" id="artwork" onChange={(event) => uploadFile("ARTWORK", event.target.files?.[0] ?? null)} type="file" />
            </Field>
          </div>
        ) : null}

        {currentStep === "review" ? (
          <div className="space-y-5">
            <ValidationSummary issues={issues} />
            <div className="grid gap-4 text-sm md:grid-cols-3">
              <SummaryItem label="Yayın" value={asDisplayString(watchedValues.title)} />
              <SummaryItem label="Tür" value={releaseTypeLabels[watchedValues.type ?? "SINGLE"]} />
              <SummaryItem label="Parça sayısı" value={String(watchedValues.tracks?.length ?? 0)} />
              <SummaryItem label="Provider" value={asDisplayString(watchedValues.provider ?? "INTERNAL")} />
              <SummaryItem label="UPC" value={asDisplayString(watchedValues.upc) || "Sağlayıcı atayabilir"} />
              <SummaryItem label="Durum" value="Taslak" />
            </div>
            <Button disabled={isPending} onClick={validateAndSubmit} type="button">
              <Send className="mr-2 size-4" />
              İncelemeye gönder
            </Button>
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button disabled={isPending} type="submit" variant="secondary">
          <Save className="mr-2 size-4" />
          Taslağı kaydet
        </Button>
        <Button disabled={isPending} onClick={() => setCurrentStep(nextStep(currentStep))} type="button">
          <Upload className="mr-2 size-4" />
          Sonraki adım
        </Button>
      </div>
    </form>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-semibold uppercase text-muted">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function asDisplayString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nextStep(currentStep: string) {
  const index = steps.findIndex((step) => step.id === currentStep);
  return steps[Math.min(index + 1, steps.length - 1)]?.id ?? currentStep;
}

function toDateInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function toFormDefaults(initialRelease: InitialRelease | null | undefined, fallbackArtistId: string | undefined): ReleaseWizardFormValues {
  return {
    title: initialRelease?.title ?? "",
    versionTitle: initialRelease?.versionTitle ?? "",
    primaryLanguage: initialRelease?.primaryLanguage ?? "tr",
    primaryGenre: initialRelease?.primaryGenre ?? "",
    secondaryGenre: initialRelease?.secondaryGenre ?? "",
    type: initialRelease?.type ?? "SINGLE",
    explicit: initialRelease?.explicit ?? false,
    labelId: initialRelease?.labelId ?? "",
    copyrightP: initialRelease?.copyrightP ?? "",
    copyrightC: initialRelease?.copyrightC ?? "",
    plannedReleaseDate: toDateInput(initialRelease?.plannedReleaseDate),
    originalReleaseDate: toDateInput(initialRelease?.originalReleaseDate),
    previouslyReleased: initialRelease?.previouslyReleased ?? false,
    upc: initialRelease?.upc ?? "",
    artists: initialRelease?.artists.length
      ? initialRelease.artists
      : [{ artistId: fallbackArtistId ?? "", role: "PRIMARY_ARTIST", sortOrder: 0 }],
    tracks: initialRelease?.tracks.length
      ? initialRelease.tracks.map((track) => ({
          id: track.id,
          title: track.title,
          versionTitle: track.versionTitle ?? "",
          trackNumber: track.trackNumber,
          discNumber: track.discNumber,
          language: track.language,
          explicit: track.explicit,
          instrumental: track.instrumental,
          previouslyReleased: track.previouslyReleased,
          isrc: track.isrc ?? "",
          lyrics: track.lyrics ?? "",
          previewStartSeconds: track.previewStartSeconds ?? 0,
          artists: track.artists.length
            ? track.artists
            : [{ artistId: fallbackArtistId ?? "", role: "PRIMARY_ARTIST", sortOrder: 0 }],
          contributors: [],
        }))
      : [
          {
            title: "",
            versionTitle: "",
            trackNumber: 1,
            discNumber: 1,
            language: "tr",
            explicit: false,
            instrumental: false,
            previouslyReleased: false,
            isrc: "",
            lyrics: "",
            previewStartSeconds: 0,
            artists: [{ artistId: fallbackArtistId ?? "", role: "PRIMARY_ARTIST", sortOrder: 0 }],
            contributors: [],
          },
        ],
    provider: initialRelease?.distributionProvider ?? "INTERNAL",
    stores: initialRelease?.stores.map((store) => store.storeCode as (typeof releaseStoreValues)[number]) ?? ["SPOTIFY", "APPLE_MUSIC"],
    worldwideDistribution: initialRelease?.worldwideDistribution ?? true,
    territories: initialRelease?.territories.map((territory) => territory.territoryCode) ?? [],
    releaseDate: "",
    presaveEnabled: initialRelease?.presaveEnabled ?? false,
    dolbyAtmosEnabled: initialRelease?.dolbyAtmosEnabled ?? false,
    contentIdEnabled: initialRelease?.contentIdEnabled ?? false,
  };
}
