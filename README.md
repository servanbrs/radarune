This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Dosya depolama

Radarune, yerel disk yanında Amazon S3 uyumlu servislerde de çalışır. VPS üzerinde
MinIO, başka bir sunucudaki S3 uyumlu gateway, Cloudflare R2 veya DigitalOcean
Spaces kullanabilirsiniz. `.env` içinde sağlayıcıyı seçip uygulamayı yeniden
başlatın:

```dotenv
STORAGE_PROVIDER=S3_COMPATIBLE
STORAGE_S3_ENDPOINT=https://storage.example.com
STORAGE_S3_REGION=us-east-1
STORAGE_S3_BUCKET=radarune
STORAGE_S3_ACCESS_KEY_ID=...
STORAGE_S3_SECRET_ACCESS_KEY=...
STORAGE_S3_FORCE_PATH_STYLE=false
STORAGE_S3_PUBLIC_BASE_URL=https://cdn.example.com/radarune
```

AWS için `STORAGE_S3_ENDPOINT` boş bırakılır. MinIO için genellikle
`STORAGE_PROVIDER=MINIO` ve `STORAGE_S3_FORCE_PATH_STYLE=true` kullanılır.
Yerel VPS diski için `STORAGE_PROVIDER=LOCAL`, `STORAGE_ALLOW_LOCAL_IN_PRODUCTION=true`
ve `STORAGE_LOCAL_ROOT=/var/lib/radarune/storage` ayarlanabilir. Yönetim → Dosya
Depolama ekranı gerekli değişkenleri ve provider durumunu gösterir; gizli anahtarlar
istemciye gönderilmez.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
