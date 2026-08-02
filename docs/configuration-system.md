# Merkezi configuration sistemi

Radarune ayarları için ortak çözüm sırası:

1. Organization admin ayarı
2. Platform admin ayarı
3. Environment fallback
4. Güvenli kod varsayılanı

`src/features/configuration/server/configuration-resolver.service.ts` bu sırayı uygular. Resolver, `AdminSetting` tablosunu yeniden kullanır; yeni migration gerektirmez. Sonuçta seçilen değerin kaynağı (`ORGANIZATION`, `PLATFORM`, `ENVIRONMENT`, `DEFAULT`) gösterilebilir, ancak secret değerleri hiçbir zaman client response'una aktarılmamalıdır.

Resolver 30 saniyelik in-memory TTL kullanır. Ayar güncellendiğinde ilgili key ve organization için `configurationResolver.invalidate(...)` çağrılmalıdır; testlerde `resetForTests()` kullanılabilir. Process yeniden başlatıldığında cache doğal olarak temizlenir.

Yeni bir provider entegrasyonu doğrudan `process.env` okumak yerine resolver çağırmalı, credential eksikliğini `CONFIGURATION_REQUIRED` olarak raporlamalı ve secret maskesini yalnızca server tarafında üretmelidir.

