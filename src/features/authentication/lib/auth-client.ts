"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient, twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),

    /*
     * Otomatik yönlendirme kapalı.
     * OTP gönderimi ve /verify-login geçişi
     * sign-in-form.tsx tarafından yönetiliyor.
     */
    twoFactorClient(),
  ],
});
