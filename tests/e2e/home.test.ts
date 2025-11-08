import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Welcome to Poker Sense");
  });

  test("shows coming soon message", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("p")).toContainText("coming soon");
  });
});
