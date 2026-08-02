import { expect, test } from "@playwright/test";

test.describe("public smoke", () => {
  test("home page renders Radarune branding", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Radarune/i);
    await expect(page.getByText("Radarune", { exact: true }).first()).toBeVisible();
  });

  test("live health endpoint responds successfully", async ({ request }) => {
    const response = await request.get("/api/health/live");
    expect(response.ok()).toBe(true);
    await expect(response.json()).resolves.toMatchObject({ status: "ok" });
  });

  test("ready health endpoint responds successfully", async ({ request }) => {
    const response = await request.get("/api/health/ready");
    expect(response.ok()).toBe(true);
    await expect(response.json()).resolves.toMatchObject({ status: "ready" });
  });
});
