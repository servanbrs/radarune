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
2. `.env.production.example` dosyasını `.env` olarak kopyalayın ve tüm secret değerlerini doldurun.
3. `npm ci` çalıştırın.
4. `npm run prisma:generate` çalıştırın.
5. `npm run validate:production` ile ortamı doğrulayın.
6. `npm run prisma:migrate:deploy` ile MySQL migrationlarını uygulayın.
7. `npm run build` çalıştırın.
8. Uygulamayı `npm run start` veya mevcut process manager ile başlatın.
9. Tarayıcıdan `/install` adresini açıp ilk çalışma alanını oluşturun.

İlk organizasyon oluşturulduktan sonra `/install` sunucu tarafında kilitlenir ve 404 döner. Kurulum dosyası paket içinde bulunsa bile ikinci kez çalıştırılamaz.

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
