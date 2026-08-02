# Production deployment

## Uygulama

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
npm run validate:production
npm start
```

Deploy sonrası canlılık ve readiness kontrolü için uygulama ayakta iken çalıştırılabilir:

```bash
SMOKE_BASE_URL=https://app.example.com npm run production:smoke
```

Komut `/api/health/live` ve `/api/health/ready` endpoint'lerini 10 saniye timeout ile kontrol eder; başarısız readiness durumunda non-zero exit code döndürür.

Pull request ve `main`/feature push'larında `.github/workflows/quality.yml` typecheck, lint, unit test ve production build kapılarını çalıştırır. Gerçek database/provider smoke testi ayrıca deploy ortamında `production:smoke` ile yapılmalıdır.

`prisma migrate dev` shadow database yetkisi olmayan managed MySQL kurulumlarında çalışmayabilir. Production/staging için migration dosyaları review edildikten sonra `prisma migrate deploy` kullanılmalıdır.

## Worker süreçleri

En az şu süreçler ayrı process olarak çalıştırılmalıdır:

- `npm run worker:distribution`
- `npm run worker:intelligence`
- `npm run worker:notifications`
- `npm run worker:onerpm-automation` (ONErpm modu AUTOMATION ise)

ONErpm worker yalnızca manuel login/2FA ile daha önce oluşturulmuş storage state kullanır; CAPTCHA, OTP okuma ve final Submit yapmaz.

## Health

- `/api/health/live`: process canlılığı.
- `/api/health/ready`: environment, database ve storage readiness.
- `/api/admin/system/health`: admin yetkisiyle database, auth, mail, queue ve encryption kontrolleri.

Backup/restore ve production provider credential testleri deploy sonrasında ayrıca doğrulanmalıdır.
