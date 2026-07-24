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
  artistTypeValues,
  createArtistSchema,
  type CreateArtistInput,
} from "@/features/artist/schemas/artist.schema";
import { createArtistAction } from "@/features/artist/server/actions/create-artist.action";

type CreateArtistFormValues = z.input<typeof createArtistSchema>;

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateArtistForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootMessage, setRootMessage] = useState<string | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);
  const form = useForm<CreateArtistFormValues, undefined, CreateArtistInput>({
    resolver: zodResolver(createArtistSchema),
    defaultValues: {
      name: "",
      slug: "",
      sortName: "",
      type: "SOLO",
      spotifyProfileUrl: "",
      appleMusicProfileUrl: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setRootError(null);
    setRootMessage(null);

    startTransition(async () => {
      const result = await createArtistAction(values);

      if (!result.success) {
        setRootError(result.message);
        return;
      }

      setRootMessage(`Artist created: ${result.data.name}`);
      form.reset({
        name: "",
        slug: "",
        sortName: "",
        type: "SOLO",
        spotifyProfileUrl: "",
        appleMusicProfileUrl: "",
      });
      router.refresh();
    });
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <Field
        error={form.formState.errors.name?.message}
        htmlFor="artist-name"
        label="Artist name"
      >
        <Input
          id="artist-name"
          placeholder="Aylin Yilmaz"
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

      <Field
        error={form.formState.errors.slug?.message}
        htmlFor="artist-slug"
        label="Artist slug"
      >
        <Input
          autoCapitalize="none"
          id="artist-slug"
          placeholder="aylin-yilmaz"
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
        error={form.formState.errors.sortName?.message}
        hint="Optional canonical sort name."
        htmlFor="artist-sort-name"
        label="Sort name"
      >
        <Input id="artist-sort-name" placeholder="Yilmaz, Aylin" {...form.register("sortName")} />
      </Field>

      <Field
        error={form.formState.errors.type?.message}
        htmlFor="artist-type"
        label="Artist type"
      >
        <select
          className="h-12 w-full rounded-2xl border bg-white px-4 text-sm text-foreground outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
          id="artist-type"
          {...form.register("type")}
        >
          {artistTypeValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </Field>

      <Field
        error={form.formState.errors.spotifyProfileUrl?.message}
        hint="Optional public Spotify artist page."
        htmlFor="artist-spotify-url"
        label="Spotify profile URL"
      >
        <Input
          id="artist-spotify-url"
          placeholder="https://open.spotify.com/artist/..."
          {...form.register("spotifyProfileUrl")}
        />
      </Field>

      <Field
        error={form.formState.errors.appleMusicProfileUrl?.message}
        hint="Optional public Apple Music artist page."
        htmlFor="artist-apple-url"
        label="Apple Music profile URL"
      >
        <Input
          id="artist-apple-url"
          placeholder="https://music.apple.com/artist/..."
          {...form.register("appleMusicProfileUrl")}
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
        {isPending ? "Creating artist..." : "Create artist"}
      </Button>
    </form>
  );
}
