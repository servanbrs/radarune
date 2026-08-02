# Radarune V2 kalan işler

Bu dosya, gerçek test veya credential olmadan tamamlandı olarak işaretlenemeyecek işleri izler.

| Alan | Durum | Gerekçe / etki | Tamamlama yöntemi |
|---|---|---|---|
| ONErpm gerçek submit | Bekliyor | Kullanıcı kontrollü, geri döndürülemez üçüncü taraf işlem | Preview + insan final onayı; resmi API varsa sandbox doğrulaması |
| Gerçek ödeme/payout | Bekliyor | Para transferi ve provider credential'ı gerekir | Sandbox/test credential ile integration test; production işlem manuel |
| Harici provider bağlantıları | Credential bekliyor | SMTP, AI, storage, Spotify/YouTube ve ödeme bilgileri ortamda yok | Admin Integration Center üzerinden secret kaydetme ve connection test |
| E2E browser suite | Public smoke tamamlandı | Authenticated seed/credential senaryoları ayrıca gerekir | `npm run test:e2e` public home/live/ready akışını doğrular |
| Production deploy | Main güncel, Hostinger doğrulaması bekliyor | Hostinger panel/SSH deploy erişimi bu ortamda yok | `main` branch deploy sonrası `npm run production:smoke` çalıştırılmalı |
