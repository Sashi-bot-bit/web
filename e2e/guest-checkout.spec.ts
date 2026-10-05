import { expect, test } from "@playwright/test";
import { expectAccessible } from "./a11y";

test("guest orders for pay on delivery and can track the order", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /orders close in$/ })).toBeVisible();
  await expectAccessible(page);

  await page.getByRole("link", { name: /E2E Burgers/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "E2E Burgers" })).toBeVisible();
  await expectAccessible(page);

  // Item sheet shows allergens before purchase.
  await page.getByRole("button", { name: "Test Burger", exact: true }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("Cereals containing gluten")).toBeVisible();
  await expect(sheet.getByText("Milk")).toBeVisible();
  await sheet.getByRole("button", { name: /Increase quantity/ }).click();
  await sheet.getByRole("button", { name: /Add to basket/ }).click();
  await expect(page.getByRole("link", { name: "Basket, 2 items" })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByText("Delivery fee")).toBeVisible();
  await expect(page.getByText("£18.50")).toBeVisible(); // 2 × £8.50 + £1.50
  await expectAccessible(page);
  await page.getByRole("link", { name: "Go to checkout" }).click();

  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await page.getByRole("radio", { name: /Library steps/ }).check();
  await page.getByRole("textbox", { name: "Name" }).fill("Grace Guest");
  await page.getByRole("textbox", { name: /Mobile number/ }).fill("07700 900456");
  await page.getByRole("textbox", { name: /Email/ }).fill("grace@example.test");

  // Terms are required.
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page.getByText("Accept the terms to place your order")).toBeVisible();
  await page.getByLabel(/I accept the/).check();
  await expectAccessible(page);
  await page.getByRole("button", { name: /Place order · £18.50/ }).click();

  await expect(page).toHaveURL(/\/orders\/[^?]+\?t=.+&placed=1/);
  await expect(page.getByText("Your order is confirmed.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Order confirmed!" })).toBeVisible();
  await expect(page.getByText("Library steps").first()).toBeVisible();
  await expectAccessible(page);

  // Guest can cancel before the cutoff.
  await page.getByRole("button", { name: "Cancel order" }).click();
  await page.getByRole("button", { name: "Yes, cancel order" }).click();
  await expect(page.getByText("This order was cancelled")).toBeVisible();

  // The tracking link without its token is not viewable.
  const url = new URL(page.url());
  await page.goto(url.pathname);
  await expect(page.getByText("We can’t find that page")).toBeVisible();
});
