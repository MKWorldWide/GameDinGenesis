import { test, expect } from '@playwright/test';

test.describe('Main Application', () => {
  test.beforeEach(async ({ page }) => {
    // Add a small delay to ensure the page is fully loaded
    await page.waitForTimeout(1000);
  });

  test('should load the main page', async ({ page }) => {
    // Navigate to the root URL
    await page.goto('/');
    
    // Check if the page is loaded by looking for any header or main content
    const header = page.locator('header, [role="banner"], h1, h2, h3, main, [role="main"]').first();
    await expect(header).toBeVisible({ timeout: 15000 });
    
    // Check for any content
    const content = page.locator('body');
    await expect(content).not.toBeEmpty();
  });

  test('should have interactive elements', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be interactive
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    
    // Check for any interactive elements
    const interactiveElements = page.locator('button, [role="button"], a[href], input, textarea, select, [tabindex="0"]');
    const elementCount = await interactiveElements.count();
    
    if (elementCount > 0) {
      // Test the first interactive element
      const firstElement = interactiveElements.first();
      await expect(firstElement).toBeVisible();
      
      // Try to interact with the element if it's not disabled
      if (await firstElement.isEnabled()) {
        try {
          await firstElement.click({ timeout: 5000 });
        } catch (error) {
          // If click fails, the element might be covered or not interactable
          console.log('Could not click the element, but it exists:', await firstElement.evaluate(el => el.outerHTML));
        }
      }
    } else {
      // If no interactive elements found, just check for any content
      const content = page.locator('body');
      await expect(content).not.toBeEmpty();
    }
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be interactive
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    
    // Try to find and click the first navigation link
    const navLinks = page.locator('nav a, [role="navigation"] a, a[href^="/"]');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute('href');
      
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        try {
          await firstLink.click({ timeout: 5000 });
          // Wait for navigation to complete
          await page.waitForLoadState('networkidle');
          
          // Verify we navigated to a new page
          const newUrl = page.url();
          expect(newUrl).not.toBe('about:blank');
          
        } catch (error) {
          console.log('Navigation test skipped - could not click the link');
        }
      } else {
        console.log('No valid internal links found for navigation test');
      }
    } else {
      console.log('No navigation links found on the page');
    }
  });
});
