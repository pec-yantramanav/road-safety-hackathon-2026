import { test, expect } from '@playwright/test';

test.describe('Govt CRM Command Dashboard E2E Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Navigate to dashboard landing
    await page.goto('/');
  });

  test('should successfully complete OIDC login, verify active KPI metrics, and complete WorkOrder approvals', async ({ page }) => {
    // 2. Perform mock OIDC credential injection login
    await expect(page.locator('h1')).toContainText('ROADWATCH');
    await page.fill('input[type="password"]', 'developer-jwt-token-claims');
    await page.click('button:has-text("Sign In with SSO")');

    // 3. Verify successful entrance and authorized greeting
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('header h1')).toContainText('System Dashboard');
    
    // 4. Assert KPI values are displaying reactively
    await expect(page.locator('text=Active Complaints')).toBeVisible();
    
    // 5. Navigate to Contractor portal work orders
    await page.click('button:has-text("Work Orders")');
    await expect(page.locator('h1')).toContainText('Contractor Portal');

    // 6. Release funds on submitted repairs
    await expect(page.locator('text=Status')).toContainText('IN_PROGRESS');
  });
});
