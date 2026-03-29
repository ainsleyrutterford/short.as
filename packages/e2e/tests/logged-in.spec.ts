import { test, expect } from "@playwright/test";

test("shorten a URL and see it in Your URLs", async ({ page }) => {
  const uniqueUrl = `https://example.com/e2e-${Date.now()}`;
  await page.goto("/create/shorten");

  await page.getByPlaceholder("Enter the URL to shorten").fill(uniqueUrl);
  await page.getByRole("button", { name: "Make it short as" }).click();

  // Logged in users stay on /create/shorten and the URL appears in the list below
  await expect(page.getByRole("heading", { name: "URLs" })).toBeVisible();
  await expect(page.getByText(uniqueUrl)).toBeVisible({ timeout: 10000 });

  await page.locator("button[aria-haspopup='menu']").first().click();
  await page.getByText("Delete").click();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByText("URL deleted")).toBeVisible();
  await expect(page.getByText(uniqueUrl)).not.toBeVisible();
});
