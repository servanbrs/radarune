# Radarune V2 teknik audit

Tarih: 2026-08-02  
Branch: `feature/radarune-v2-complete`

## Başlangıç kanıtı

- Çalışma ağacı başlangıçta temiz değildi. Kullanıcıya ait mevcut değişiklikler korunuyor; bu dalda üzerine yazılmadı.
- Başlangıç branch'i `main`, son commit `3cf4d28` (`feat: finalize discover experience and remove global player`).
- `npm run typecheck`: başarılı.
- `npm test -- --reporter=dot`: başarılı — 30 test dosyası, 69 test.
- `npm run build`: başarılı. Next.js 16 production build tamamlandı; local storage runtime yolu daraltılarak NFT tracing uyarısı giderildi.
- Prisma schema ve generated client mevcut; migration geçmişi kapsamlı ve release, social, billing, storage, analytics ve distribution alanlarını içeriyor.

## Çalışan veya güçlü temeli olan modüller

- Next.js App Router public, dashboard, artist, admin ve API route ağacı.
- Better Auth + Prisma adapter; email/password, email OTP ve e-posta tabanlı 2FA akışı.
- Merkezi `authSessionService` ve server-side RBAC/organization context.
- Release oluşturma, track/upload, validation, submit ve admin review route'ları.
- Discover event, like, comment, follow, playlist, presave, smart link ve report servisleri.
- Provider registry'leri, distribution queue/job/retry/dead-letter ve webhook temeli.
- Billing provider adapter'ları ve finance/royalty route'ları.
- Local/S3 uyumlu storage registry temeli ve private storage route'u.
- Admin dashboard, user/application/release/distribution/finance/storage/health ekranlarının önemli bölümü.
- AI/intelligence provider ve job ekranlarının ilk sürümü.
- Public sitemap, robots, public profile/release/chart route'ları.
- Distribution automation domain/session testleri ve ONErpm session capture/check script'leri.

## Yarım kalan veya doğrulanması gereken alanlar

- `/admin/v2` mevcut admin ağacından ayrı görünüyor; ortak admin shell/navigation ile bütünleşmesi ve yetki kontrolünün sayfa seviyesinde açıkça kanıtlanması gerekiyor.
- Configuration resolver, secret lifecycle, cache invalidation ve env-to-admin migration tam bir ortak sözleşme olarak belgelenmemiş.
- Integration Center tüm provider kategorilerini tek bir durum/connection-test ekranında toplamıyor.
- Email, AI, storage, OAuth, payment ve distribution ayarlarının hepsi aynı merkezi resolver üzerinden geçtiği henüz kanıtlanmış değil.
- ONErpm otomasyonu session check/preview sınırında; gerçek submit bilinçli olarak yapılmıyor. Worker ve kullanıcı onayı akışı tamamlanmalı.
- Platform analytics için consent, bot filtering, admin exclusion ve visitor/session hash modelinin uçtan uca kullanımı doğrulanmalı.
- Finance import, royalty split ve payout yetki izolasyonunun kapsamlı integration testleri eksik.
- Setup wizard, feature flags, maintenance/registration/application flag senkronizasyonu eksik veya parçalı.
- E2E browser suite credential/seed gerektiriyor; deploy sonrası live/readiness doğrulaması için `npm run production:smoke` eklendi.
- Deployment, worker, security ve configuration dokümantasyonu eksik.

## Güvenlik ve runtime riskleri

- Auth kodunda 2FA OTP akışı mevcut olsa da güvenli `next` redirect, resend/verify rate limit ve session revoke davranışı testlerle güvence altına alınmalı.
- `src/features/authentication/server/auth.ts` içinde OTP kodu loglanmıyor; ancak 2FA operasyon logları ve e-posta provider hataları için hassas veri redaction standardı merkezi hale getirilmeli.
- Environment dosyaları ignore ediliyor; `.radarune-private/` de ignore ediliyor. ONErpm storage-state dosyasının yanlışlıkla artifact/backup içine girmediği CI kontrolü eklenmeli.
- Production env validation root secret'ların bir bölümünü kontrol ediyor; istenen yeni root secret adları (`CONFIGURATION_ENCRYPTION_KEY`, `SESSION_ENCRYPTION_KEY`, `INTERNAL_WORKER_SECRET`) ile mevcut `ENCRYPTION_KEY` sözleşmesi hizalanmalı.
- Local storage adapter'ın dinamik filesystem erişimi build tracing uyarısı üretiyor; runtime güvenliğini bozmadan tracing kapsamı daraltılmalı.
- Public/client payload'larda secret, filesystem path veya session içeriği sızmadığı route bazında test edilmeli.
- API route'larında rate limit ve idempotency kapsamı endpoint matrisiyle belgelenmeli.

## Veri modeli, performans ve bakım

- Prisma schema geniş; yeni migration eklemek veri kaybı riski taşıdığından yalnızca backwards-compatible ve açıkça gerekli değişiklikler yapılmalı.
- Dashboard analytics sorguları gerçek Prisma count/groupBy sorguları kullanıyor; 30 günlük grafikler için indeks ve boş veri davranışı doğrulanmalı.
- Public feed ve discover pagination/duplicate prevention mevcut servislerle korunmalı; yeni global player eklenmemeli.
- Bazı UI alanları büyük client component'lerde toplanmış; erişilebilir loading/error/empty state ve mobil navigation sistematik audit edilmeli.
- Untracked admin V2/ONErpm dosyaları ve silinmiş context dosyaları kullanıcı değişikliği olabilir; otomatik temizlenmeyecek.

## Eksik test matrisi

- Unit: config resolver/cache, secret masking, secure redirect, OTP policy, analytics consent/hash, finance calculations.
- Integration: sign-in → 2FA → safe redirect, artist application approval, release draft persistence, configuration override/fallback, organization isolation.
- E2E: public discover card playback, admin settings propagation, upload/release wizard, health/worker smoke tests.
- ONErpm gerçek submit testi normal test suite'e eklenmemeli; manual preview/approval test olarak kalmalı.

## Production blocker'ları

1. Root secret sözleşmesinin tekilleştirilmesi ve production validation.
2. Merkezi configuration/secret resolver'ın tüm integration provider'larına uygulanması.
3. Admin V2'nin mevcut admin shell ile tek ağaca alınması.
4. Worker/cron/health durumlarının gerçek heartbeat ve queue verisiyle bağlanması.
5. E2E ve production smoke testleri.
6. Deployment, backup/restore, worker ve security dokümantasyonu.
