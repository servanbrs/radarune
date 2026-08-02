# ONErpm otomasyon akışı

## Çalışma modeli

1. Kullanıcı veya yetkili admin ONErpm hesabında manuel login ve 2FA tamamlar.
2. `npm run onerpm:session:capture` browser storage state'i `.radarune-private/onerpm/` altında 0600 izinle saklar.
3. Admin dağıtım provider ayarından ONErpm modunu `AUTOMATION` seçer.
4. Release otomatik dağıtım job'ı ONErpm için oluşturulur ve normal API worker'a gönderilmeden manuel inceleme kuyruğunda tutulur.
5. `npm run worker:onerpm-automation` geçerli session ile browser açar, canonical metadata'yı güvenli locator sırasıyla form alanlarına doldurur ve screenshot alır.
6. Job `WAITING_FINAL_APPROVAL` olarak kalır. Son kontrol ve ONErpm Submit butonuna basma kullanıcı tarafından yapılır.

Worker CAPTCHA çözmez, OTP okumaz, şifre saklamaz, cookie/session içeriğini loglamaz ve final Submit işlemini otomatikleştirmez.

## Çalıştırma

```bash
npm run onerpm:session:capture
npm run onerpm:session:check
npm run worker:onerpm-automation
```

İlk gerçek provider testi staging/manuel preview ile yapılmalıdır. ONErpm form selector'ları değişirse worker `AUTOMATION_PREPARATION_FAILED` ile job'ı tekrar manuel incelemeye bırakır; sessizce yanlış veri göndermemesi beklenen davranıştır.

## Destek

Kullanıcılar `/dashboard/support` üzerinden release, ISRC veya UPC referanslı destek talebi açabilir. Admin/moderatör `/admin/support` üzerinden ticket'ları polling ile izler, yanıt verir ve ekip içi not ekleyebilir.

