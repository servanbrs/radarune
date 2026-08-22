"use client";

import { useActionState } from "react";
import { transferArtistOwnershipAction } from "@/features/admin/server/actions/admin-artist.actions";

type OwnershipState = {
  success: boolean;
  message: string;
};

const initialState: OwnershipState = { success: false, message: "" };

async function submitOwnership(_previousState: OwnershipState, formData: FormData) {
  return transferArtistOwnershipAction(formData);
}

type Props = {
  artistId: string;
  currentOwnerId: string | null;
  users: Array<{ id: string; name: string; email: string }>;
};

export function ArtistChannelOwnershipForm({ artistId, currentOwnerId, users }: Props) {
  const [state, formAction, pending] = useActionState(submitOwnership, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-3 border-t border-line pt-5">
      <input type="hidden" name="artistId" value={artistId} />
      <div>
        <h3 className="font-semibold">Kanal sahipliği</h3>
        <p className="mt-1 text-xs text-muted">Otomatik içe aktarılan veya sahipsiz kanalı gerçek sanatçı hesabına bağlayın.</p>
      </div>
      <select name="ownerUserId" defaultValue={currentOwnerId ?? ""} className="input" disabled={pending}>
        <option value="">Atanmamış (yalnızca admin)</option>
        {users.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.email}</option>)}
      </select>
      <button type="submit" className="button-primary disabled:cursor-wait disabled:opacity-60" disabled={pending}>
        {pending ? "Devrediliyor…" : "Kanalı devret"}
      </button>
      {state.message ? <p className={state.success ? "text-sm text-accent" : "text-sm text-danger"} role="status">{state.message}</p> : null}
    </form>
  );
}
