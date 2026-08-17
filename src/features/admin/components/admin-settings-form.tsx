import { updateAdminSettingsAction } from "@/features/admin/server/actions/admin-settings.actions";

type SettingItem = {
  key: string;
  value: unknown;
};

type AdminSettingsFormProps = {
  settings: readonly SettingItem[];
};

function getValue(
  settings: readonly SettingItem[],
  key: string,
) {
  return settings.find((setting) => setting.key === key)?.value;
}

function getStringValue(
  settings: readonly SettingItem[],
  key: string,
  fallback = "",
) {
  const value = getValue(settings, key);

  return typeof value === "string" ? value : fallback;
}

function getBooleanValue(
  settings: readonly SettingItem[],
  key: string,
  fallback = false,
) {
  const value = getValue(settings, key);

  return typeof value === "boolean" ? value : fallback;
}

function getNumberValue(
  settings: readonly SettingItem[],
  key: string,
  fallback = 0,
) {
  const value = getValue(settings, key);

  return typeof value === "number" ? value : fallback;
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/10";

export function AdminSettingsForm({
  settings,
}: AdminSettingsFormProps) {
  const audioSizeMb =
    getNumberValue(
      settings,
      "MAX_AUDIO_FILE_SIZE_BYTES",
      536870912,
    ) /
    1024 /
    1024;

  const artworkSizeMb =
    getNumberValue(
      settings,
      "MAX_ARTWORK_FILE_SIZE_BYTES",
      20971520,
    ) /
    1024 /
    1024;

  return (
    <form
      action={updateAdminSettingsAction}
      className="grid gap-6"
    >
      <section className="grid gap-5 rounded-2xl border border-line bg-white/70 p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Genel site ayarları
          </h2>

          <p className="mt-1 text-sm text-muted">
            Site adı, logo ve destek adresini yönetin.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium">
            Site adı
            <input
              className={inputClassName}
              defaultValue={getStringValue(
                settings,
                "PLATFORM_NAME",
                "Radarune",
              )}
              name="platformName"
              required
              type="text"
            />
          </label>

          <label className="text-sm font-medium">
            Destek e-posta adresi
            <input
              className={inputClassName}
              defaultValue={getStringValue(
                settings,
                "SUPPORT_EMAIL",
                "support@radarune.com",
              )}
              name="supportEmail"
              required
              type="email"
            />
          </label>

          <label className="text-sm font-medium md:col-span-2">
            Logo adresi
            <input
              className={inputClassName}
              defaultValue={getStringValue(
                settings,
                "LOGO_URL",
              )}
              name="logoUrl"
              placeholder="/logo.svg veya https://..."
              type="text"
            />
          </label>
          <label className="text-sm font-medium md:col-span-2">SEO sayfa başlığı<input className={inputClassName} defaultValue={getStringValue(settings, "SEO_TITLE", "Radarune | Müzik operasyon platformu")} name="seoTitle" maxLength={70} /></label>
          <label className="text-sm font-medium md:col-span-2">SEO açıklaması<textarea className={inputClassName} defaultValue={getStringValue(settings, "SEO_DESCRIPTION", "")} name="seoDescription" maxLength={160} rows={3} /></label>
        </div>
      </section>

      <section className="grid gap-5 rounded-2xl border border-line bg-white/70 p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Ödül uygunluk kuralları</h2>
          <p className="mt-1 text-sm text-muted">
            Ödül, koşulların tamamı sağlanmadan verilmeyecek şekilde güvenli bir bekleme kuralı uygular.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
            <input
              defaultChecked={getBooleanValue(settings, "REWARD_EMAIL_VERIFICATION_REQUIRED", true)}
              name="rewardEmailVerificationRequired"
              type="checkbox"
            />
            <span>
              <strong className="block text-sm">E-posta doğrulaması zorunlu</strong>
              <span className="mt-1 block text-xs text-muted">
                Doğrulanmamış hesaplar ödül için uygun sayılmaz.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
            <input
              defaultChecked={getBooleanValue(settings, "REWARD_REAL_INTERACTION_REQUIRED", true)}
              name="rewardRealInteractionRequired"
              type="checkbox"
            />
            <span>
              <strong className="block text-sm">Gerçek etkileşim zorunlu</strong>
              <span className="mt-1 block text-xs text-muted">
                En az bir geçerli oy, beğeni, yorum, takip veya anlamlı oynatma gerekir.
              </span>
            </span>
          </label>
        </div>

        <label className="text-sm font-medium md:max-w-sm">
          Minimum aktiflik süresi
          <div className="relative mt-2">
            <input
              className={inputClassName}
              defaultValue={getNumberValue(settings, "REWARD_MIN_ACTIVE_DAYS", 7)}
              min={0}
              max={3650}
              name="rewardMinActiveDays"
              type="number"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted">gün</span>
          </div>
          <span className="mt-1 block text-xs text-muted">
            Varsayılan: 7 gün. Kullanıcı bu süre boyunca aktif hesap durumunda olmalıdır.
          </span>
        </label>
      </section>

      <section className="grid gap-5 rounded-2xl border border-line bg-white/70 p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Üyelik ve başvurular
          </h2>

          <p className="mt-1 text-sm text-muted">
            Yeni kullanıcı ve sanatçı başvuru ayarları.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
            <input
              defaultChecked={getBooleanValue(
                settings,
                "USER_REGISTRATION_ENABLED",
                true,
              )}
              name="userRegistrationEnabled"
              type="checkbox"
            />

            <span>
              <strong className="block text-sm">
                Kullanıcı üyeliği açık
              </strong>

              <span className="mt-1 block text-xs text-muted">
                Yeni kullanıcılar hesap oluşturabilir.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
            <input
              defaultChecked={getBooleanValue(
                settings,
                "ARTIST_APPLICATIONS_ENABLED",
                true,
              )}
              name="artistApplicationsEnabled"
              type="checkbox"
            />

            <span>
              <strong className="block text-sm">
                Sanatçı başvuruları açık
              </strong>

              <span className="mt-1 block text-xs text-muted">
                Kullanıcılar sanatçı olmaya başvurabilir.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
            <input
              defaultChecked={getBooleanValue(
                settings,
                "EMAIL_VERIFICATION_REQUIRED",
                true,
              )}
              name="emailVerificationRequired"
              type="checkbox"
            />

            <span>
              <strong className="block text-sm">
                E-posta doğrulaması zorunlu
              </strong>

              <span className="mt-1 block text-xs text-muted">
                Doğrulanmamış hesapların işlemleri kısıtlanır.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="grid gap-5 rounded-2xl border border-line bg-white/70 p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Dağıtım ayarları
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium">
            Varsayılan provider
            <select
              className={inputClassName}
              defaultValue={getStringValue(
                settings,
                "DEFAULT_DISTRIBUTION_PROVIDER",
                "INTERNAL",
              )}
              name="defaultDistributionProvider"
            >
              <option value="INTERNAL">Radarune Internal</option>
              <option value="ONE_RPM">ONErpm</option>
              <option value="FUGA">FUGA</option>
              <option value="SYMPHONIC">Symphonic</option>
              <option value="REVELATOR">Revelator</option>
            </select>
          </label>

          <label className="flex items-start gap-3 self-end rounded-xl border border-line bg-white p-4">
            <input
              defaultChecked={getBooleanValue(
                settings,
                "AUTO_DISTRIBUTION_ENABLED",
                false,
              )}
              name="autoDistributionEnabled"
              type="checkbox"
            />

            <span>
              <strong className="block text-sm">
                Otomatik dağıtım
              </strong>

              <span className="mt-1 block text-xs text-muted">
                Onaylanan yayınlar otomatik olarak kuyruğa alınır.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="grid gap-5 rounded-2xl border border-line bg-white/70 p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Dosya yükleme sınırları
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="text-sm font-medium">
            Maksimum ses dosyası
            <div className="relative">
              <input
                className={`${inputClassName} pr-14`}
                defaultValue={audioSizeMb}
                min="1"
                name="maxAudioFileSizeMb"
                required
                type="number"
              />

              <span className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-xs text-muted">
                MB
              </span>
            </div>
          </label>

          <label className="text-sm font-medium">
            Maksimum kapak dosyası
            <div className="relative">
              <input
                className={`${inputClassName} pr-14`}
                defaultValue={artworkSizeMb}
                min="1"
                name="maxArtworkFileSizeMb"
                required
                type="number"
              />

              <span className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-xs text-muted">
                MB
              </span>
            </div>
          </label>

          <label className="text-sm font-medium">
            Minimum kapak çözünürlüğü
            <input
              className={inputClassName}
              defaultValue={getNumberValue(
                settings,
                "MIN_ARTWORK_RESOLUTION",
                3000,
              )}
              min="500"
              name="minArtworkResolution"
              required
              type="number"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-5 rounded-2xl border border-line bg-white/70 p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Bakım modu
          </h2>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
          <input
            defaultChecked={getBooleanValue(
              settings,
              "MAINTENANCE_MODE_ENABLED",
              false,
            )}
            name="maintenanceModeEnabled"
            type="checkbox"
          />

          <span>
            <strong className="block text-sm">
              Bakım modunu etkinleştir
            </strong>

            <span className="mt-1 block text-xs text-muted">
              Site geçici olarak ziyaretçilere kapatılır.
            </span>
          </span>
        </label>

        <label className="text-sm font-medium">
          Bakım mesajı
          <textarea
            className={`${inputClassName} min-h-28 resize-y`}
            defaultValue={getStringValue(
              settings,
              "MAINTENANCE_MESSAGE",
            )}
            name="maintenanceMessage"
            placeholder="Radarune kısa süreli bakım çalışmasındadır."
          />
        </label>
      </section>

      <section className="panel sticky bottom-3 z-20 grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="text-sm font-medium text-foreground">
          Değişiklik sebebi
          <input
            className={inputClassName}
            minLength={10}
            name="reason"
            placeholder="Örneğin: Site genel ayarları güncellendi."
            required
            type="text"
          />
        </label>

        <button
          className="h-12 rounded-xl bg-foreground px-6 text-sm font-semibold text-white hover:opacity-90"
          type="submit"
        >
          Ayarları Kaydet
        </button>
      </section>
    </form>
  );
}
