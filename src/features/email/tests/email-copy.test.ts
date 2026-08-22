import { describe, expect, it } from "vitest";

import { formatCustomerEmailCopy } from "@/features/email/lib/email-copy";

describe("formatCustomerEmailCopy", () => {
  it("moves a legacy one-line greeting into its own paragraph", () => {
    expect(
      formatCustomerEmailCopy("Merhaba test6161, Radarune hesabınız hazır."),
    ).toBe("Merhaba test6161,\n\nRadarune hesabınız hazır.");
  });

  it("keeps the customer greeting at exactly one paragraph break", () => {
    expect(
      formatCustomerEmailCopy(
        "Merhaba test6161,\n\n\nRadarune hesabınız hazır.",
      ),
    ).toBe("Merhaba test6161,\n\nRadarune hesabınız hazır.");
  });

  it("does not rewrite operational messages without a greeting", () => {
    const message = "Radarune'e yeni bir yayın gönderildi.";

    expect(formatCustomerEmailCopy(message)).toBe(message);
  });
});
