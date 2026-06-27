import { test, expect } from '@playwright/test';

test.describe('ITMS Application Navigation E2E Tests', () => {
  test('should load the home page and verify structural headlines', async ({ page }) => {
    await page.goto('/');

    // Check that the title contains ITMS
    await expect(page).toHaveTitle(/ITMS/);

    // Verify the hero section header is present
    const heroHeading = page.locator('h1');
    await expect(heroHeading).toContainText('Traffic Intelligence');
  });

  test('should navigate to the Login page', async ({ page }) => {
    await page.goto('/');

    // Click "Login" link in the navbar
    const loginLink = page.locator('text=Login').first();
    await loginLink.click();

    // Verify redirect to /login
    await expect(page).toHaveURL(/\/login/);

    // Check login page form elements
    const loginHeader = page.locator('h1:has-text("Access Dashboard")');
    await expect(loginHeader).toBeVisible();

    const emailInput = page.locator('input[type="email"]');
    const pwdInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(pwdInput).toBeVisible();
  });
});
