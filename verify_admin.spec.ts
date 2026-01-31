import { test, expect } from '@playwright/test';

test('login as admin and navigate to admin center', async ({ page }) => {
  await page.goto('http://localhost:3004');

  // Wait for login modal
  await page.waitForSelector('input[placeholder="ACCESS_NODE_ID"]');

  // Login as admin
  await page.fill('input[placeholder="ACCESS_NODE_ID"]', 'admin');
  await page.fill('input[placeholder="••••••••••••"]', 'admin');
  await page.click('button:has-text("Execute")');

  // Wait for sidebar to appear
  await page.waitForSelector('aside');

  // Click Admin Center button in sidebar
  // It has AdminCenterIcon and text from translations. EN: "Admin Center"
  await page.click('button:has-text("Admin Center")');

  // Check if Admin Dashboard is visible
  await page.waitForSelector('h1:has-text("ADMIN")');

  await page.screenshot({ path: 'admin_center_success.png', fullPage: true });

  const title = await page.textContent('h1');
  expect(title?.toUpperCase()).toContain('ADMIN');
});
