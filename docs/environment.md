# Radarune environment sözleşmesi

## Başlangıçta zorunlu kök değişkenler

- `DATABASE_URL`: Prisma/MySQL bağlantısı.
- `BETTER_AUTH_SECRET`: en az 32 karakter; session ve auth imzalama.
- `BETTER_AUTH_URL`: auth callback origin.
- `NEXT_PUBLIC_APP_URL`: public uygulama origin.

Production ortamında ayrıca HTTPS URL'leri, `ENCRYPTION_KEY`, `CRON_SECRET`, `WEBHOOK_SIGNING_SECRET`, `API_KEY_PEPPER` ve `IP_HASH_SALT` gerekir. `npm run validate:production` ile kontrol edilir.

## Environment fallback kullanan entegrasyonlar

SMTP, AI, YouTube, Spotify, billing, distribution ve storage değişkenleri mevcut kurulumlarla geriye dönük uyumluluk için fallback olarak okunabilir. Yeni admin ayarı varsa provider-specific servis öncelikle admin ayarını kullanmalıdır. Secret değerleri client'a veya audit metadata'sına gönderilmez.

## Env → Admin aktarımı

```bash
npm run config:migrate-env
```

Script ilk organization'a yalnızca boş admin ayarlarını aktarır; mevcut değerleri ezmez, SMTP parolasını AES-256-GCM ile şifreler ve secret değerini loglamaz. Bu aktarım production migration değildir; önce backup ve staging bağlantı testi önerilir.

## Git'e girmemesi gerekenler

`.env*` dosyaları (`.env.example` ve `.env.production.example` hariç), `.radarune-private/`, storage runtime klasörleri ve ONErpm browser state dosyaları commit edilmemelidir.

