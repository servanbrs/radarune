# Radarune V2 kalan işler

Bu dosya, gerçek test veya credential olmadan tamamlandı olarak işaretlenemeyecek işleri izler.

| Alan | Durum | Gerekçe / etki | Tamamlama yöntemi |
|---|---|---|---|
| ONErpm gerçek submit | Bekliyor | Kullanıcı kontrollü, geri döndürülemez üçüncü taraf işlem | Preview + insan final onayı; resmi API varsa sandbox doğrulaması |
| Gerçek ödeme/payout | Bekliyor | Para transferi ve provider credential'ı gerekir | Sandbox/test credential ile integration test; production işlem manuel |
| Harici provider bağlantıları | Credential bekliyor | SMTP, AI, storage, Spotify/YouTube ve ödeme bilgileri ortamda yok | Admin Integration Center üzerinden secret kaydetme ve connection test |
| E2E browser suite | Kısmi | Local veritabanı/credential ve seeded kullanıcı gerektirir | Test database seed + `npm run test:e2e` smoke akışı |
| Production deploy | Yapılmadı | Kullanıcı açıkça deploy/merge istemedi | Deployment runbook sonrası kullanıcı kararıyla çalıştırılmalı |

