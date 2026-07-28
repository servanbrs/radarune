import { createLocalStorageProviderAction } from "@/features/admin/storage/server/actions/admin-storage.actions";

const inputClassName =
  "mt-2 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-foreground outline-none transition placeholder:text-muted/60 focus:border-accent";

export function CreateLocalStorageForm() {
  return (
    <form
      action={createLocalStorageProviderAction}
      className="panel grid gap-5 p-5 sm:p-6"
    >
      <div>
        <h2 className="font-semibold text-foreground">
          Local Storage ekle
        </h2>

        <p className="mt-1 text-sm leading-6 text-muted">
          Geliştirme ortamı veya tek sunuculu kurulumlar
          için yerel bir depolama dizini oluşturun.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Provider adı

          <input
            className={inputClassName}
            defaultValue="Radarune Local Storage"
            minLength={2}
            name="name"
            required
            type="text"
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Maksimum dosya boyutu

          <div className="relative">
            <input
              className={`${inputClassName} pr-14`}
              defaultValue="512"
              min="1"
              name="maxFileSizeMb"
              required
              step="1"
              type="number"
            />

            <span className="pointer-events-none absolute bottom-0 right-3 flex h-11 items-center text-xs font-semibold text-muted">
              MB
            </span>
          </div>
        </label>
      </div>

      <label className="text-sm font-medium text-foreground">
        Yerel dizin

        <input
          className={`${inputClassName} font-mono`}
          defaultValue="./storage"
          name="localBasePath"
          placeholder="./storage"
          required
          type="text"
        />

        <span className="mt-2 block text-xs leading-5 text-muted">
          Dizin mevcut değilse bağlantı testi sırasında
          otomatik oluşturulur.
        </span>
      </label>

      <label className="text-sm font-medium text-foreground">
        Public Base URL

        <input
          className={inputClassName}
          name="publicBaseUrl"
          placeholder="https://cdn.radarune.com"
          type="url"
        />

        <span className="mt-2 block text-xs leading-5 text-muted">
          Dosyalar sadece özel erişimle kullanılacaksa boş
          bırakabilirsiniz.
        </span>
      </label>

      <div className="flex justify-end border-t border-line pt-5">
        <button
          className="h-11 rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-85"
          type="submit"
        >
          Local Storage oluştur
        </button>
      </div>
    </form>
  );
}
