"use client";

import type { UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ReleaseWizardFormValues } from "@/features/releases/components/release-wizard";

type ArtistOption = {
  id: string;
  name: string;
};

export function TrackEditor({
  artists,
  index,
  register,
  onRemove,
}: {
  artists: ArtistOption[];
  index: number;
  register: UseFormRegister<ReleaseWizardFormValues>;
  onRemove: () => void;
}) {
  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">{index + 1}. parça</h3>
        <Button onClick={onRemove} size="sm" type="button" variant="ghost">
          Sil
        </Button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field htmlFor={`tracks.${index}.title`} label="Parça adı">
          <Input id={`tracks.${index}.title`} {...register(`tracks.${index}.title`)} />
        </Field>
        <Field htmlFor={`tracks.${index}.versionTitle`} label="Sürüm">
          <Input id={`tracks.${index}.versionTitle`} {...register(`tracks.${index}.versionTitle`)} />
        </Field>
        <Field htmlFor={`tracks.${index}.trackNumber`} label="Parça numarası">
          <Input id={`tracks.${index}.trackNumber`} min={1} type="number" {...register(`tracks.${index}.trackNumber`, { valueAsNumber: true })} />
        </Field>
        <Field htmlFor={`tracks.${index}.discNumber`} label="Disk numarası">
          <Input id={`tracks.${index}.discNumber`} min={1} type="number" {...register(`tracks.${index}.discNumber`, { valueAsNumber: true })} />
        </Field>
        <Field htmlFor={`tracks.${index}.language`} label="Dil">
          <Input id={`tracks.${index}.language`} {...register(`tracks.${index}.language`)} />
        </Field>
        <Field htmlFor={`tracks.${index}.isrc`} label="ISRC">
          <Input id={`tracks.${index}.isrc`} {...register(`tracks.${index}.isrc`)} />
        </Field>
        <Field htmlFor={`tracks.${index}.sourceUrl`} label="Müzik bağlantısı">
          <Input
            id={`tracks.${index}.sourceUrl`}
            placeholder="YouTube, Spotify, Apple Music veya Deezer"
            type="url"
            {...register(`tracks.${index}.sourceUrl`)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            YouTube/Spotify yapılandırılmışsa metadata ve oynatma otomatik bağlanır; diğer izinli linkler güvenli şekilde saklanır.
          </p>
        </Field>
        <Field htmlFor={`tracks.${index}.primaryArtist`} label="Primary artist">
          <Select id={`tracks.${index}.primaryArtist`} {...register(`tracks.${index}.artists.0.artistId`)}>
            <option value="">Sanatçı seç</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
              </option>
            ))}
          </Select>
        </Field>
        <input type="hidden" value="PRIMARY_ARTIST" {...register(`tracks.${index}.artists.0.role`)} />
        <input type="hidden" value={0} {...register(`tracks.${index}.artists.0.sortOrder`, { valueAsNumber: true })} />
        <Field htmlFor={`tracks.${index}.previewStartSeconds`} label="Preview başlangıç saniyesi">
          <Input id={`tracks.${index}.previewStartSeconds`} min={0} type="number" {...register(`tracks.${index}.previewStartSeconds`, { valueAsNumber: true })} />
        </Field>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" {...register(`tracks.${index}.explicit`)} />
          Explicit
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" {...register(`tracks.${index}.instrumental`)} />
          Instrumental
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" {...register(`tracks.${index}.previouslyReleased`)} />
          Daha önce dağıtıldı
        </label>
      </div>
      <div className="mt-4">
        <Field htmlFor={`tracks.${index}.lyrics`} label="Sözler">
          <Textarea id={`tracks.${index}.lyrics`} {...register(`tracks.${index}.lyrics`)} />
        </Field>
      </div>
    </article>
  );
}
