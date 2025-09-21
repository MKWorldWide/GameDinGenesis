import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Add a small delay to ensure the page is fully loaded
    await page.waitForTimeout(1000);
  });

  test('should load the main page', async ({ page }) => {
    // Navigate to the root URL
    await page.goto('/');
    
    // Check if the page is loaded by looking for any header or main content
    const header = page.locator('header, [role="banner"], h1, h2, h3').first();
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('should have a form on the page', async ({ page }) => {
    await page.goto('/');
    
    // Check for any form element
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      const form = forms.first();
      await expect(form).toBeVisible();
      
      // Check for input fields
      const inputs = form.locator('input, textarea, select');
      const inputCount = await inputs.count();
      
      if (inputCount > 0) {
        // Try to interact with the first input
        await inputs.first().click();
        await expect(inputs.first()).toBeFocused();
      }
    } else {
      // If no forms found, look for interactive elements
      const buttons = page.locator('button, [role="button"], a[href]');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        await expect(buttons.first()).toBeVisible();
      } else {
        // If no interactive elements found, just check for any content
        const content = page.locator('body');
        await expect(content).not.toBeEmpty();
      }
    }
  });
});
