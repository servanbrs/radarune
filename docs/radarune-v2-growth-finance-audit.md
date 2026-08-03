# Radarune V2 Growth & Finance Audit

Tarih: 2026-08-03

## Başlangıç durumu

- Branch: `feature/radarune-v2-complete`
- Çalışma ağacında önceki V2 ve mobil çalışmalarına ait kullanıcı değişiklikleri mevcut; korunmuştur.
- Local `/sitemap.xml` isteği 200 dönüyor ve `Content-Type: application/xml`.
- Local `/robots.txt` isteği 200 dönüyor ve public sitemap adresini gösteriyor.
- Canonical temel URL `seoUrl()` üzerinden `NEXT_PUBLIC_APP_URL` veya `SEO_CANONICAL_BASE_URL` ile üretiliyor.
- Production örneklerinde canonical URL `https://radarune.com`; local development auth URL’si localhost olarak kalıyor.

## Tespitler

1. Sitemap tek bir büyük `urlset` olarak üretiliyordu; index ve bölümlendirme yoktu.
2. Sitemap üretimi admin ekranında yalnızca doğrudan servis çağrısıydı; public XML rebuild/validation durumu yoktu.
3. Artist, Smart Link, public playlist ve active pre-save içerikleri sitemap’e alınabiliyor; admin/dashboard/auth/internal API yolları alınmıyordu.
4. Public sitemap’in DB hatasında kontrollü hata/son hata gösterimi bulunmuyor.
5. Finance, payout, hype ve growth için mevcut modeller ve servisler kısmen var; yeni geliştirmeler duplicate model oluşturmadan mevcut ledger/RBAC yapısı üzerinden sürdürülmeli.

## B fazı uygulaması

- `/sitemap.xml` artık public sitemap index olarak çalışır.
- Bölümler: static, artists, smart-links, playlists, presaves.
- Bölüm endpoint’leri: `/sitemaps/{name}.xml`.
- XML cevaplarında `application/xml; charset=utf-8` ve public cache başlıkları bulunur.
- URL segmentleri XML ve URL encoding ile güvenli biçimde üretilir.

## Açık işler

- Public release/track route’ları oluşturulmadan bu içerikler sitemap’e eklenmemelidir.
- SEO admin’de gerçek validation/rebuild action ve Search Console bağlantı durumu eklenmelidir.
- Imported artist source, claim, rights, hype, finance commission/payout ve growth modülleri sonraki fazlarda mevcut RBAC/audit altyapısına bağlanmalıdır.
- Legal metinler production öncesi hukuk incelemesi gerektirir.
