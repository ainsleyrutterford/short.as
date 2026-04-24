import { test, expect } from "@playwright/test";

test("shorten a URL", async ({ page }) => {
  await page.goto("/create/shorten");

  await page.getByPlaceholder("Enter the URL to shorten").fill("https://example.com");
  await page.getByRole("button", { name: "Make it short as" }).click();

  await expect(page.getByText("Wow, that really is")).toBeVisible();
  await expect(page.getByText("Short.as URL")).toBeVisible();
});

test("short URL redirects to long URL", async ({ page, request }) => {
  await page.goto("/create/shorten");

  const longUrl = "https://example.com";
  await page.getByPlaceholder("Enter the URL to shorten").fill(longUrl);
  await page.getByRole("button", { name: "Make it short as" }).click();

  await expect(page.getByText("Short.as URL")).toBeVisible();

  const shortUrlText = await page.getByText(/short\.as\//).textContent();
  const shortUrlId = shortUrlText?.split("/").pop();

  const baseURL = process.env.BASE_URL || "https://dev.short.as";
  const response = await request.fetch(`${baseURL}/${shortUrlId}`, { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  expect(response.headers()["location"]).toBe(longUrl);
});

test("login page shows OAuth buttons", async ({ page }) => {
  await page.goto("/create/login");

  await expect(page.getByText("Welcome to short.as")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue with Microsoft" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue with GitHub" })).toBeVisible();
});
