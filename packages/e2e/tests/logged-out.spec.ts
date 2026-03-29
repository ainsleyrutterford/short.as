import { test, expect } from "@playwright/test";

test("shorten a URL", async ({ page }) => {
  await page.goto("/create/shorten");

  await page.getByPlaceholder("Enter the URL to shorten").fill("https://example.com");
  await page.getByRole("button", { name: "Make it short as" }).click();

  await expect(page.getByText("Wow, that really is")).toBeVisible();
  await expect(page.getByText("Short.as URL")).toBeVisible();
});
