import { test, expect, Page } from "@playwright/test";

const shortenUrl = async (page: Page, longUrl: string) => {
  await page.goto("/create/shorten");
  await page.getByPlaceholder("Enter the URL to shorten").fill(longUrl);
  await page.getByRole("button", { name: "Make it short as" }).click();
  await expect(page.getByTestId("url-card").filter({ hasText: longUrl })).toBeVisible({ timeout: 10000 });
};

const urlCard = (page: Page, longUrl: string) => page.getByTestId("url-card").filter({ hasText: longUrl });

const deleteUrl = async (page: Page, longUrl: string) => {
  await urlCard(page, longUrl).locator("button[aria-haspopup='menu']").click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("URL deleted")).toBeVisible();
};

test("shorten a URL and see it in Your URLs", async ({ page }) => {
  const uniqueUrl = `https://example.com/e2e-shorten-${Date.now()}`;
  await shortenUrl(page, uniqueUrl);

  await expect(page.getByRole("heading", { name: "URLs" })).toBeVisible();

  await deleteUrl(page, uniqueUrl);
  await expect(page.getByText(uniqueUrl)).not.toBeVisible();
});

test("edit a URL", async ({ page }) => {
  const uniqueUrl = `https://example.com/e2e-edit-${Date.now()}`;
  await shortenUrl(page, uniqueUrl);

  await urlCard(page, uniqueUrl).locator("button[aria-haspopup='menu']").click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  await expect(page.getByLabel("Long URL")).not.toHaveValue("", { timeout: 10000 });

  const updatedUrl = `https://example.com/e2e-edited-${Date.now()}`;
  await page.getByLabel("Long URL").fill(updatedUrl);
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByText("URL updated")).toBeVisible();

  await page.goto("/create/shorten");
  await expect(page.getByText(updatedUrl)).toBeVisible({ timeout: 10000 });
  await deleteUrl(page, updatedUrl);
});

test("analytics page loads", async ({ page }) => {
  const uniqueUrl = `https://example.com/e2e-analytics-${Date.now()}`;
  await shortenUrl(page, uniqueUrl);

  await urlCard(page, uniqueUrl).locator("button[aria-haspopup='menu']").click();
  await page.getByRole("menuitem", { name: "Analytics" }).click();

  await expect(page.getByText("Region")).toBeVisible();
  await expect(page.getByText("Country")).toBeVisible();
  await expect(page.getByText("Device")).toBeVisible();
  await expect(page.getByText("Referer")).toBeVisible();

  await page.goto("/create/shorten");
  await expect(page.getByText(uniqueUrl)).toBeVisible({ timeout: 10000 });
  await deleteUrl(page, uniqueUrl);
});

test("profile page loads", async ({ page }) => {
  await page.goto("/create/profile");

  await expect(page.getByText("E2E Test User")).toBeVisible();
  await expect(page.getByText("e2e@test.local")).toBeVisible();
});
