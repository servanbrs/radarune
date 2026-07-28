"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Save,
  Send,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldPath,
} from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  releaseStoreValues,
  releaseTypeLabels,
  releaseTypeValues,
  storeLabels,
} from "@/features/releases/constants/release.constants";
import { TrackEditor } from "@/features/releases/components/track-editor";
import { TrackRightsEditor } from "@/features/releases/components/track-rights-editor";
import { ValidationSummary } from "@/features/releases/components/validation-summary";
import {
  WizardStepNavigation,
  type WizardStep,
} from "@/features/releases/components/wizard-step-navigation";
import { updateReleaseSchema } from "@/features/releases/schemas/release.schema";

type SelectOption = {
  id: string;
  name: string;
};

type ReleaseIssue = {
  id?: string;
  fieldPath: string;
  message: string;
  severity: "ERROR" | "WARNING" | "INFO" | "CRITICAL";
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
  artworkUploadId?: string | null;
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
    audioUploadId?: string | null;
    lyrics: string | null;
    previewStartSeconds: number | null;
    artists: Array<{
      artistId: string;
      role: "PRIMARY_ARTIST" | "FEATURED_ARTIST" | "REMIXER" | "PRODUCER";
      sortOrder: number;
    }>;
    contributors?: Array<{
      name: string;
      role:
        | "COMPOSER"
        | "LYRICIST"
        | "PRODUCER"
        | "MIXING_ENGINEER"
        | "MASTERING_ENGINEER"
        | "ARRANGER"
        | "VOCALIST"
        | "BACKGROUND_VOCALIST"
        | "GUITARIST"
        | "BASSIST"
        | "PIANIST"
        | "DRUMMER";
    }>;
  }>;
  validationIssues: ReleaseIssue[];
};

export type ReleaseWizardFormValues = z.input<typeof updateReleaseSchema>;

type StepId =
  | "details"
  | "tracks"
  | "rights"
  | "distribution"
  | "files"
  | "review";

const steps: Array<WizardStep & { id: StepId }> = [
  { id: "details", title: "Yayın bilgileri" },
  { id: "tracks", title: "Parçalar" },
  { id: "rights", title: "Hak sahipleri" },
  { id: "distribution", title: "Dağıtım" },
  { id: "files", title: "Dosyalar" },
  { id: "review", title: "Kontrol ve gönder" },
];

const detailFields: FieldPath<ReleaseWizardFormValues>[] = [
  "type",
  "title",
  "primaryLanguage",
  "primaryGenre",
  "copyrightP",
  "copyrightC",
  "plannedReleaseDate",
  "artists",
  "previouslyReleased",
  "upc",
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
  const [currentStep, setCurrentStep] = useState<StepId>("details");
  const [maxAccessibleIndex, setMaxAccessibleIndex] = useState(0);
  const [issues, setIssues] = useState<ReleaseIssue[]>(
    initialRelease?.validationIssues ?? [],
  );
  const [artworkUploaded, setArtworkUploaded] = useState(
    Boolean(initialRelease?.artworkUploadId),
  );
  const [audioUploadedByTrackId, setAudioUploadedByTrackId] = useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(
      (initialRelease?.tracks ?? []).map((track) => [
        track.id,
        Boolean(track.audioUploadId),
      ]),
    ),
  );
  const [persistedTrackIds, setPersistedTrackIds] = useState<string[]>(
    initialRelease?.tracks.map((track) => track.id) ?? [],
  );
  const [isPending, startTransition] = useTransition();

  const form = useForm<ReleaseWizardFormValues>({
    resolver: zodResolver(updateReleaseSchema),
    defaultValues: toFormDefaults(initialRelease, artists[0]?.id),
    mode: "onTouched",
  });

  const tracks = useFieldArray({
    control: form.control,
    name: "tracks",
  });

  const watchedValues = useWatch({
    control: form.control,
  });

  const currentStepIndex = steps.findIndex(
    (step) => step.id === currentStep,
  );
  const missingRights = (watchedValues.tracks ?? []).flatMap((track, index) => {
    const roles = new Set((track.contributors ?? []).map((contributor) => contributor.role));
    return !roles.has("COMPOSER") || (!track.instrumental && !roles.has("LYRICIST"))
      ? [`${index + 1}. parça için ${!roles.has("COMPOSER") ? "besteci" : "söz yazarı"} ekleyin.`]
      : [];
  });

  async function validateCurrentStep(step: StepId) {
    if (step === "details") {
      const valid = await form.trigger(detailFields, {
        shouldFocus: true,
      });

      const values = form.getValues();
      if (values.previouslyReleased && !values.upc) {
        form.setError("upc", {
          type: "manual",
          message: "Daha önce dağıtılan yayınlarda UPC zorunludur.",
        });
        return false;
      }

      return valid;
    }

    if (step === "tracks") {
      const valid = await form.trigger("tracks", {
        shouldFocus: true,
      });
      if (!valid) {
        return false;
      }

      const values = form.getValues();
      const trackCount = values.tracks?.length ?? 0;
      const releaseType = values.type ?? "SINGLE";

      if (releaseType === "SINGLE" && trackCount !== 1) {
        toast.error("Single yayın tam olarak bir parça içermelidir.");
        return false;
      }

      if (releaseType === "EP" && (trackCount < 2 || trackCount > 6)) {
        toast.error("EP yayın 2 ile 6 parça arasında olmalıdır.");
        return false;
      }

      if (releaseType === "ALBUM" && trackCount < 7) {
        toast.error("Albüm en az 7 parça içermelidir.");
        return false;
      }

      return true;
    }

    if (step === "rights") {
      const valid = await form.trigger("tracks", {
        shouldFocus: true,
      });
      if (!valid) {
        return false;
      }

      const formTracks = form.getValues("tracks") ?? [];
      for (const [index, track] of formTracks.entries()) {
        const roles = new Set(
          (track.contributors ?? []).map((contributor) => contributor.role),
        );

        if (!roles.has("COMPOSER")) {
          toast.error(
            `${index + 1}. parça için en az bir besteci ekleyin.`,
          );
          return false;
        }

        if (!track.instrumental && !roles.has("LYRICIST")) {
          toast.error(
            `${index + 1}. sözlü parça için en az bir söz yazarı ekleyin.`,
          );
          return false;
        }
      }

      return true;
    }

    if (step === "distribution") {
      const valid = await form.trigger(
        ["stores", "worldwideDistribution"],
        { shouldFocus: true },
      );
      const stores = form.getValues("stores") ?? [];

      if (stores.length === 0) {
        form.setError("stores", {
          type: "manual",
          message: "En az bir dijital platform seçmelisiniz.",
        });
        toast.error("En az bir dijital platform seçmelisiniz.");
        return false;
      }

      return valid;
    }

    return true;
  }

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

    const createdReleaseId = result.data.id as string;
    setReleaseId(createdReleaseId);
    window.history.replaceState(
      null,
      "",
      `/releases/${createdReleaseId}/edit`,
    );
    return createdReleaseId;
  }

  async function savePayload(
    targetReleaseId: string,
    payload: Record<string, unknown>,
  ) {
    const response = await fetch(`/api/releases/${targetReleaseId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      toast.error(result.message ?? "Taslak kaydedilemedi.");
      return false;
    }

    return true;
  }

  async function saveCurrentStep(step: StepId) {
    const values = form.getValues();
    const targetReleaseId = await ensureRelease(values);
    if (!targetReleaseId) {
      return false;
    }

    let payload: Record<string, unknown> = {};

    if (step === "details") {
      payload = {
        title: values.title,
        versionTitle: values.versionTitle,
        primaryLanguage: values.primaryLanguage,
        primaryGenre: values.primaryGenre,
        secondaryGenre: values.secondaryGenre,
        type: values.type,
        explicit: values.explicit,
        labelId: values.labelId,
        copyrightP: values.copyrightP,
        copyrightC: values.copyrightC,
        plannedReleaseDate: values.plannedReleaseDate,
        originalReleaseDate: values.originalReleaseDate,
        previouslyReleased: values.previouslyReleased,
        upc: values.upc,
        artists: values.artists,
      };
    }

    if (step === "tracks" || step === "rights") {
      payload = {
        tracks: values.tracks,
      };
    }

    if (step === "distribution") {
      payload = {
        stores: values.stores,
        territories: values.territories,
        worldwideDistribution: values.worldwideDistribution,
        presaveEnabled: values.presaveEnabled,
        dolbyAtmosEnabled: values.dolbyAtmosEnabled,
        contentIdEnabled: values.contentIdEnabled,
      };
    }

    if (Object.keys(payload).length === 0) {
      return true;
    }

    const saved = await savePayload(targetReleaseId, payload);
    if (saved && (step === "tracks" || step === "rights")) {
      await syncReleaseDetail(targetReleaseId);
    }

    return saved;
  }

  async function syncReleaseDetail(targetReleaseId: string) {
    const response = await fetch(`/api/releases/${targetReleaseId}`, {
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      toast.error(result.message ?? "Yayın bilgileri yenilenemedi.");
      return false;
    }

    const serverTracks = (result.data.tracks ?? []) as Array<{
      id: string;
      audioUploadId: string | null;
    }>;

    setPersistedTrackIds(serverTracks.map((track) => track.id));
    setArtworkUploaded(Boolean(result.data.artworkUploadId));
    setAudioUploadedByTrackId(
      Object.fromEntries(
        serverTracks.map((track) => [track.id, Boolean(track.audioUploadId)]),
      ),
    );

    serverTracks.forEach((track, index) => {
      form.setValue(`tracks.${index}.id`, track.id, {
        shouldDirty: false,
      });
    });

    return true;
  }

  async function validateOnServer(targetReleaseId: string) {
    const response = await fetch(
      `/api/releases/${targetReleaseId}/validate`,
      { method: "POST" },
    );
    const result = await response.json();
    setIssues(result.data?.issues ?? []);

    if (!response.ok || !result.success) {
      toast.error(
        result.message ?? "Eksik veya hatalı yayın bilgileri bulunuyor.",
      );
      return false;
    }

    return true;
  }

  function runAsync(task: () => Promise<void>) {
    startTransition(() => {
      void task().catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Adım kaydedilemedi. Lütfen tekrar deneyin.");
      });
    });
  }

  function handleNext() {
    runAsync(async () => {
      const valid = await validateCurrentStep(currentStep);
      if (!valid) {
        return;
      }

      if (currentStep === "files") {
        const targetReleaseId = await ensureRelease(form.getValues());
        if (!targetReleaseId) {
          return;
        }

        const serverValid = await validateOnServer(targetReleaseId);
        if (!serverValid) {
          return;
        }
      } else {
        const saved = await saveCurrentStep(currentStep);
        if (!saved) {
          return;
        }
      }

      const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
      setMaxAccessibleIndex((current) => Math.max(current, nextIndex));
      setCurrentStep(steps[nextIndex]?.id ?? currentStep);
      router.refresh();
    });
  }

  function saveDraft() {
    runAsync(async () => {
      const valid = await validateCurrentStep(currentStep);
      if (!valid) {
        return;
      }

      const saved = await saveCurrentStep(currentStep);
      if (!saved) {
        return;
      }

      toast.success("Taslak kaydedildi.");
      router.refresh();
    });
  }

  function uploadFile(
    kind: "AUDIO" | "ARTWORK",
    file: File | null,
    trackIndex?: number,
  ) {
    if (!file) {
      toast.error("Dosya seçilmedi.");
      return;
    }

    runAsync(async () => {
      const targetReleaseId = await ensureRelease(form.getValues());
      if (!targetReleaseId) {
        return;
      }

      let trackId =
        trackIndex === undefined ? undefined : persistedTrackIds[trackIndex];

      if (kind === "AUDIO" && !trackId && trackIndex !== undefined) {
        const synced = await syncReleaseDetail(targetReleaseId);
        if (!synced) {
          return;
        }

        const currentTracks = form.getValues("tracks") as
          | Array<{ id?: string }>
          | undefined;
        trackId = currentTracks?.[trackIndex]?.id;
      }

      if (kind === "AUDIO" && !trackId) {
        toast.error("Parçayı önce kaydedin, ardından ses dosyasını yükleyin.");
        return;
      }

      const formData = new FormData();
      formData.set("kind", kind);
      formData.set("file", file);
      if (trackId) {
        formData.set("trackId", trackId);
      }

      const response = await fetch(
        `/api/releases/${targetReleaseId}/uploads`,
        {
          method: "POST",
          body: formData,
        },
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message ?? "Dosya yüklenemedi.");
        return;
      }

      if (kind === "ARTWORK") {
        setArtworkUploaded(true);
        toast.success("Kapak görseli yüklendi.");
      } else if (trackId) {
        setAudioUploadedByTrackId((current) => ({
          ...current,
          [trackId]: true,
        }));
        toast.success("Ses dosyası yüklendi.");
      }

      router.refresh();
    });
  }

  function submitForReview() {
    runAsync(async () => {
      const targetReleaseId = await ensureRelease(form.getValues());
      if (!targetReleaseId) {
        return;
      }

      const serverValid = await validateOnServer(targetReleaseId);
      if (!serverValid) {
        return;
      }

      const response = await fetch(
        `/api/releases/${targetReleaseId}/submit`,
        { method: "POST" },
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        setIssues(result.data?.issues ?? issues);
        toast.error(
          result.message ?? "Yayın incelemeye gönderilemedi.",
        );
        return;
      }

      toast.success("Yayın Radarune incelemesine gönderildi.");
      router.push(`/releases/${targetReleaseId}`);
      router.refresh();
    });
  }

  return (
    <form
      className="min-w-0 space-y-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <WizardStepNavigation
        currentStep={currentStep}
        maxAccessibleIndex={maxAccessibleIndex}
        onSelect={(step) => setCurrentStep(step as StepId)}
        steps={steps}
      />

      <section className="min-w-0 rounded-3xl border border-line bg-surface p-4 shadow-sm sm:p-6">
        {currentStep === "details" ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Yayın bilgileri</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Yayının temel metadata bilgilerini ve yayın adına işlem
                yapacağınız sanatçıyı seçin.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {releaseTypeValues.map((type) => (
                <label
                  className="rounded-2xl border border-line bg-white p-5 text-sm font-semibold"
                  key={type}
                >
                  <input
                    className="mr-2"
                    type="radio"
                    value={type}
                    {...form.register("type")}
                  />
                  {releaseTypeLabels[type]}
                </label>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                error={form.formState.errors.title?.message}
                htmlFor="title"
                label="Yayın adı"
              >
                <Input id="title" {...form.register("title")} />
              </Field>

              <Field htmlFor="versionTitle" label="Sürüm adı">
                <Input
                  id="versionTitle"
                  placeholder="Remix, Acoustic gibi — yoksa boş bırakın"
                  {...form.register("versionTitle")}
                />
              </Field>

              <Field
                error={form.formState.errors.primaryLanguage?.message}
                htmlFor="primaryLanguage"
                label="Birincil dil"
              >
                <Input
                  id="primaryLanguage"
                  placeholder="tr"
                  {...form.register("primaryLanguage")}
                />
              </Field>

              <Field
                error={form.formState.errors.primaryGenre?.message}
                htmlFor="primaryGenre"
                label="Ana tür"
              >
                <Input
                  id="primaryGenre"
                  placeholder="Pop, Rap, Elektronik..."
                  {...form.register("primaryGenre")}
                />
              </Field>

              <Field htmlFor="secondaryGenre" label="Alt tür">
                <Input
                  id="secondaryGenre"
                  {...form.register("secondaryGenre")}
                />
              </Field>

              <Field htmlFor="labelId" label="Label / şirket">
                <Select id="labelId" {...form.register("labelId")}>
                  <option value="">Bağımsız yayın</option>
                  {labels.map((label) => (
                    <option key={label.id} value={label.id}>
                      {label.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                error={form.formState.errors.artists?.message}
                htmlFor="releasePrimaryArtist"
                label="Ana sanatçı"
              >
                <Select
                  id="releasePrimaryArtist"
                  {...form.register("artists.0.artistId")}
                >
                  <option value="">Sanatçı seçin</option>
                  {artists.map((artist) => (
                    <option key={artist.id} value={artist.id}>
                      {artist.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <input
                type="hidden"
                value="PRIMARY_ARTIST"
                {...form.register("artists.0.role")}
              />
              <input
                type="hidden"
                value={0}
                {...form.register("artists.0.sortOrder", {
                  valueAsNumber: true,
                })}
              />

              <Field
                error={form.formState.errors.copyrightP?.message}
                hint="Örnek: ℗ 2026 Blaa Records"
                htmlFor="copyrightP"
                label="Ses kaydı hakkı (℗)"
              >
                <Input id="copyrightP" {...form.register("copyrightP")} />
              </Field>

              <Field
                error={form.formState.errors.copyrightC?.message}
                hint="Örnek: © 2026 Blaa Records"
                htmlFor="copyrightC"
                label="Telif hakkı (©)"
              >
                <Input id="copyrightC" {...form.register("copyrightC")} />
              </Field>

              <Field
                error={form.formState.errors.plannedReleaseDate?.message}
                htmlFor="plannedReleaseDate"
                label="Planlanan yayın tarihi"
              >
                <Input
                  id="plannedReleaseDate"
                  type="date"
                  {...form.register("plannedReleaseDate")}
                />
              </Field>

              <Field
                htmlFor="originalReleaseDate"
                label="İlk yayın tarihi"
              >
                <Input
                  id="originalReleaseDate"
                  type="date"
                  {...form.register("originalReleaseDate")}
                />
              </Field>

              <div className="rounded-2xl border border-line bg-white p-4 md:col-span-2">
                <label className="flex items-start gap-3 text-sm font-medium">
                  <input
                    className="mt-1"
                    type="checkbox"
                    {...form.register("previouslyReleased")}
                  />
                  <span>
                    <strong className="block">Bu yayın daha önce dağıtıldı</strong>
                    <span className="mt-1 block text-xs font-normal text-muted">
                      İşaretlerseniz mevcut UPC ve parça ISRC kodları zorunlu olur.
                    </span>
                  </span>
                </label>
              </div>

              {watchedValues.previouslyReleased ? (
                <Field
                  error={form.formState.errors.upc?.message}
                  htmlFor="upc"
                  label="Mevcut UPC / EAN"
                >
                  <Input
                    id="upc"
                    inputMode="numeric"
                    placeholder="12 veya 13 hane"
                    {...form.register("upc")}
                  />
                </Field>
              ) : (
                <div className="rounded-2xl border border-line bg-white p-4 text-sm">
                  <p className="font-semibold">UPC işlemi</p>
                  <p className="mt-1 text-muted">
                    Yeni yayın için gerekli kod Radarune dağıtım sürecinde
                    atanabilir.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {currentStep === "tracks" ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Parçalar</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Parça metadata bilgilerini girin. Daha önce dağıtılmış
                parçalarda mevcut ISRC kodu zorunludur.
              </p>
            </div>

            {tracks.fields.map((field, index) => (
              <TrackEditor
                artists={artists}
                index={index}
                key={field.id}
                onRemove={() => tracks.remove(index)}
                register={form.register}
              />
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
                  artists: [
                    {
                      artistId: artists[0]?.id ?? "",
                      role: "PRIMARY_ARTIST",
                      sortOrder: 0,
                    },
                  ],
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

        {currentStep === "rights" ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Hak sahipleri</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Besteci, söz yazarı ve prodüksiyon katkılarını parça bazında
                eksiksiz girin.
              </p>
            </div>
            {missingRights.length > 0 ? <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">{missingRights.join(" ")} Sözlü parçalarda besteci ve söz yazarı zorunludur.</div> : null}

            {(form.getValues("tracks") ?? []).map((track, index) => (
              <TrackRightsEditor
                control={form.control}
                index={index}
                key={track.id ?? `${track.trackNumber}-${index}`}
                register={form.register}
              />
            ))}
          </div>
        ) : null}

        {currentStep === "distribution" ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-accent/25 bg-accent/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Dağıtım hizmeti
              </p>
              <h2 className="mt-2 text-xl font-semibold">Radarune Dağıtımı</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Teknik dağıtım sağlayıcısı Radarune yönetimi tarafından yayın
                uygunluğu ve anlaşmalara göre belirlenir.
              </p>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold">Dijital platformlar</p>
                <button className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent" onClick={() => form.setValue("stores", (form.getValues("stores") ?? []).length === releaseStoreValues.length ? [] : [...releaseStoreValues], { shouldDirty: true })} type="button">
                  {(watchedValues.stores ?? []).length === releaseStoreValues.length ? "Seçimi temizle" : "Tümünü seç"}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {releaseStoreValues.map((store) => (
                  <label
                    className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm"
                    key={store}
                  >
                    <input
                      type="checkbox"
                      value={store}
                      {...form.register("stores")}
                    />
                    {storeLabels[store]}
                  </label>
                ))}
              </div>
              {form.formState.errors.stores?.message ? (
                <p className="mt-2 text-xs text-danger">
                  {form.formState.errors.stores.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 text-sm font-medium">
                <input
                  className="mt-1"
                  type="checkbox"
                  {...form.register("worldwideDistribution")}
                />
                <span>
                  <strong className="block">Dünya geneli dağıtım</strong>
                  <span className="mt-1 block text-xs font-normal text-muted">
                    Uygun olan tüm ülke ve bölgelerde yayınlayın.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 text-sm font-medium">
                <input
                  className="mt-1"
                  type="checkbox"
                  {...form.register("presaveEnabled")}
                />
                <span>
                  <strong className="block">Pre-save kampanyası</strong>
                  <span className="mt-1 block text-xs font-normal text-muted">
                    Yayın öncesi takipçi ve dinleyici toplayın.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 text-sm font-medium">
                <input
                  className="mt-1"
                  type="checkbox"
                  {...form.register("dolbyAtmosEnabled")}
                />
                <span>
                  <strong className="block">Dolby Atmos</strong>
                  <span className="mt-1 block text-xs font-normal text-muted">
                    Uyumlu teslim dosyası ayrıca kontrol edilir.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 text-sm font-medium">
                <input
                  className="mt-1"
                  type="checkbox"
                  {...form.register("contentIdEnabled")}
                />
                <span>
                  <strong className="block">YouTube Content ID başvurusu</strong>
                  <span className="mt-1 block text-xs font-normal text-muted">
                    Hak sahipliği uygunluğu inceleme sırasında doğrulanır.
                  </span>
                </span>
              </label>
            </div>
          </div>
        ) : null}

        {currentStep === "files" ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Kapak ve ses dosyaları</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Kapak görselini ve her parça için kayıpsız ses dosyasını
                yükleyin.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Kapak görseli</p>
                  <p className="mt-1 text-xs text-muted">
                    JPG veya PNG, kare, en az 3000 × 3000 piksel, en fazla 20 MB.
                  </p>
                </div>
                <StatusPill ready={artworkUploaded} />
              </div>

              <Input
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className="mt-4"
                id="artwork"
                onChange={(event) =>
                  uploadFile(
                    "ARTWORK",
                    event.target.files?.[0] ?? null,
                  )
                }
                type="file"
              />
            </div>

            <div className="grid gap-4">
              {(form.getValues("tracks") ?? []).map((track, index) => {
                const trackId = persistedTrackIds[index];
                const uploaded = trackId
                  ? Boolean(audioUploadedByTrackId[trackId])
                  : false;

                return (
                  <div
                    className="rounded-2xl border border-line bg-white p-5"
                    key={track.id ?? `${track.trackNumber}-${index}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {index + 1}. {track.title || "İsimsiz parça"}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          WAV veya FLAC, kayıpsız master dosyası.
                        </p>
                      </div>
                      <StatusPill ready={uploaded} />
                    </div>

                    <Input
                      accept=".wav,.flac,audio/wav,audio/flac"
                      className="mt-4"
                      id={`audio-${index}`}
                      onChange={(event) =>
                        uploadFile(
                          "AUDIO",
                          event.target.files?.[0] ?? null,
                          index,
                        )
                      }
                      type="file"
                    />
                  </div>
                );
              })}
            </div>

            {issues.length > 0 ? <ValidationSummary issues={issues} /> : null}
          </div>
        ) : null}

        {currentStep === "review" ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Kontrol ve gönder</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Yayınınız Radarune ekibi tarafından incelendikten sonra uygun
                dağıtım kanalına yönlendirilir.
              </p>
            </div>

            <div className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
              <SummaryItem
                label="Yayın"
                value={asDisplayString(watchedValues.title)}
              />
              <SummaryItem
                label="Tür"
                value={releaseTypeLabels[watchedValues.type ?? "SINGLE"]}
              />
              <SummaryItem
                label="Parça sayısı"
                value={String(watchedValues.tracks?.length ?? 0)}
              />
              <SummaryItem label="Dağıtım" value="Radarune Dağıtımı" />
              <SummaryItem
                label="UPC"
                value={
                  asDisplayString(watchedValues.upc) ||
                  "Yeni yayın için Radarune atayabilir"
                }
              />
              <SummaryItem
                label="Platform sayısı"
                value={String(watchedValues.stores?.length ?? 0)}
              />
              <SummaryItem
                label="Bölge"
                value={
                  watchedValues.worldwideDistribution
                    ? "Dünya geneli"
                    : "Seçili bölgeler"
                }
              />
              <SummaryItem label="Durum" value="Taslak" />
            </div>

            <ValidationSummary issues={issues} />

            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" />
                <div>
                  <p className="font-semibold">Gönderime hazır</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Gönderimden sonra yayın kilitlenir. Radarune ekibi gerekli
                    görürse revizyon talebi gönderir.
                  </p>
                </div>
              </div>
            </div>

            <Button
              disabled={isPending}
              onClick={submitForReview}
              type="button"
            >
              <Send className="mr-2 size-4" />
              Radarune incelemesine gönder
            </Button>
          </div>
        ) : null}
      </section>

      <div className="sticky bottom-3 z-20 -mx-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 p-2 shadow-xl backdrop-blur md:-mx-4 md:p-3">
        <div className="flex flex-wrap gap-3">
          {currentStepIndex > 0 ? (
            <Button
              disabled={isPending}
              onClick={() =>
                setCurrentStep(
                  steps[Math.max(currentStepIndex - 1, 0)]?.id ?? "details",
                )
              }
              type="button"
              variant="ghost"
            >
              <ArrowLeft className="mr-2 size-4" />
              Geri
            </Button>
          ) : null}

          {currentStep !== "files" && currentStep !== "review" ? (
            <Button
              disabled={isPending}
              onClick={saveDraft}
              type="button"
              variant="secondary"
            >
              <Save className="mr-2 size-4" />
              Taslağı kaydet
            </Button>
          ) : null}
        </div>

        {currentStep !== "review" ? (
          <Button disabled={isPending} onClick={handleNext} type="button">
            {currentStep === "files" ? (
              <CheckCircle2 className="mr-2 size-4" />
            ) : currentStep === "distribution" ? (
              <Upload className="mr-2 size-4" />
            ) : (
              <ArrowRight className="mr-2 size-4" />
            )}
            {currentStep === "files" ? "Dosyaları doğrula" : "Kaydet ve ilerle"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function StatusPill({ ready }: { ready: boolean }) {
  return (
    <span
      className={
        ready
          ? "rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
          : "rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning"
      }
    >
      {ready ? "Yüklendi" : "Zorunlu"}
    </span>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-semibold uppercase text-muted">{label}</p>
      <p className="mt-2 break-words font-semibold">{value}</p>
    </div>
  );
}

function asDisplayString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toDateInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function toFormDefaults(
  initialRelease: InitialRelease | null | undefined,
  fallbackArtistId: string | undefined,
): ReleaseWizardFormValues {
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
      : [
          {
            artistId: fallbackArtistId ?? "",
            role: "PRIMARY_ARTIST",
            sortOrder: 0,
          },
        ],
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
            : [
                {
                  artistId: fallbackArtistId ?? "",
                  role: "PRIMARY_ARTIST",
                  sortOrder: 0,
                },
              ],
          contributors: track.contributors ?? [],
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
            artists: [
              {
                artistId: fallbackArtistId ?? "",
                role: "PRIMARY_ARTIST",
                sortOrder: 0,
              },
            ],
            contributors: [],
          },
        ],
    stores:
      initialRelease?.stores.map(
        (store) => store.storeCode as (typeof releaseStoreValues)[number],
      ) ?? ["SPOTIFY", "APPLE_MUSIC", "YOUTUBE_MUSIC"],
    worldwideDistribution: initialRelease?.worldwideDistribution ?? true,
    territories:
      initialRelease?.territories.map(
        (territory) => territory.territoryCode,
      ) ?? [],
    presaveEnabled: initialRelease?.presaveEnabled ?? false,
    dolbyAtmosEnabled: initialRelease?.dolbyAtmosEnabled ?? false,
    contentIdEnabled: initialRelease?.contentIdEnabled ?? false,
  };
}
