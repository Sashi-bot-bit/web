import { expect, test } from "@playwright/test";
import { expectAccessible } from "./a11y";

test("customer signs up, orders, and sees the order in their history", async ({ page }) => {
  await page.goto("/signup");
  await expectAccessible(page);
  await page.getByRole("textbox", { name: "Name" }).fill("Sam Student");
  await page.getByRole("textbox", { name: "Email" }).fill(`sam-${Date.now()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("a-long-test-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByText("Not confirmed")).toBeVisible();

  await page.goto("/r/e2e-burgers");
  await page.getByRole("button", { name: "Add Test Fries to basket" }).click();
  await page.getByRole("button", { name: "Add Test Burger to basket" }).click();
  await page.goto("/checkout");
  await expect(page.getByText(/Signed in as/)).toBeVisible();
  await page.getByRole("radio", { name: /Library steps/ }).check();
  await page.getByRole("textbox", { name: /Mobile number/ }).fill("07700 900789");
  await page.getByLabel(/I accept the/).check();
  await page.getByRole("button", { name: /Place order · £13.00/ }).click(); // £8.50 + £3.00 + £1.50
  await expect(page.getByText("Your order is confirmed.")).toBeVisible();
  const number = await page.locator("h1.tabular").innerText();

  await page.goto("/account/orders");
  await expect(page.getByText(number)).toBeVisible();
  await expectAccessible(page);

  // Reorder puts the items back in the basket at current prices.
  await page.getByRole("button", { name: "Order again" }).click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(page.getByText("Test Fries").first()).toBeVisible();

  // Mobile number was saved to the profile.
  await page.goto("/account");
  await expect(page.getByRole("textbox", { name: /Mobile number/ })).toHaveValue("07700 900789");
});
