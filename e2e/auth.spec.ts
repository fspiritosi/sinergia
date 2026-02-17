import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to sign-in', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/dashboard');

    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/.*sign-in.*/);
  });

  test('should load sign-in page', async ({ page }) => {
    await page.goto('/sign-in');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify we're on the sign-in page
    await expect(page).toHaveURL(/.*sign-in.*/);

    // Check that Clerk sign-in component is loaded
    // Clerk uses iframes or hosted UI, so we check for common elements
    const hasSignInForm = await page.locator('form, [data-clerk-component]').count() > 0;
    expect(hasSignInForm).toBe(true);
  });

  test('should load sign-up page', async ({ page }) => {
    await page.goto('/sign-up');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify we're on the sign-up page
    await expect(page).toHaveURL(/.*sign-up.*/);

    // Check that Clerk sign-up component is loaded
    const hasSignUpForm = await page.locator('form, [data-clerk-component]').count() > 0;
    expect(hasSignUpForm).toBe(true);
  });

  /**
   * NOTE: Testing actual Clerk authentication requires:
   * 1. Valid test credentials
   * 2. Handling Clerk's hosted authentication flow
   * 3. Potentially using @clerk/testing for programmatic auth
   *
   * For manual testing:
   * - Verify users can sign in with valid credentials
   * - Verify users are redirected to /dashboard after sign-in
   * - Verify sign-out functionality works correctly
   */
});
