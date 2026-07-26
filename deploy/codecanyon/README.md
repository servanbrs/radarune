# Radarune CodeCanyon paketi

Bu paket, Radarune müzik dağıtım platformunun kendi sunucusuna kurulabilen sürümüdür.

## Gereksinimler

- Node.js 20 veya üzeri
- npm 10 veya üzeri
- MySQL 8 veya MariaDB 10.6 veya üzeri
- Kalıcı dosya depolama
- Reverse proxy ve HTTPS

## Sıfır kurulum

1. Zip dosyasını sunucuya açın.
2. Node.js 20+, npm 10+ ve MySQL 8/MariaDB 10.6+ kurulu olduğunu doğrulayın.
3. `npm ci` çalıştırın.
4. `npm run install:codecanyon` komutunu çalıştırın. Sihirbaz MySQL sunucusu, veritabanı, kullanıcı, parola, kalıcı storage yolu, ilk yönetici ve workspace bilgilerini ister.
5. Sihirbaz MySQL bağlantısını test eder, production secret değerlerini üretir, `.env` dosyasını `0600` izinle oluşturur, Prisma migrationlarını uygular ve ilk hesabı `SUPER_ADMIN` olarak oluşturur.
6. `npm run build` çalıştırın.
7. Uygulamayı `npm run start` veya mevcut process manager ile başlatın.

İlk workspace oluşturulduktan sonra `/install` sunucu tarafında kilitlenir ve 404 döner. Kurulum route'u fiziksel olarak silinmez; veritabanı kilidiyle korunması güncellemelerde route'un tekrar yanlışlıkla açılmasını engeller.

Mevcut `.env` dosyası varsa sihirbaz üzerine yazmaz. Mevcut production kurulumlarında yalnızca `npm run prisma:migrate:deploy`, `npm run build` ve process restart uygulanmalıdır.

## Güvenlik

- `.env` dosyasını zip paketine veya Git deposuna eklemeyin.
- Production secret değerlerini parola yöneticisinde saklayın.
- HTTPS kullanın.
- `STORAGE_PROVIDER` için kalıcı S3/R2 veya kalıcı disk yapılandırın.
- Dağıtım, intelligence ve notification worker süreçlerini ayrıca çalıştırın.

## Paket oluşturma

Repository kökünde, commit edilmiş sürüm üzerinden çalıştırın:

```bash
npm run package:codecanyon
```

Çıktı `dist/radarune-codecanyon-<version>.zip` olur. `node_modules`, `.next`, `.env` ve secret dosyaları pakete dahil edilmez.
