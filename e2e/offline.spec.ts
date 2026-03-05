import { test, expect } from '@playwright/test'

test.describe('Offline capability', () => {
  test('app loads and login works, then works with network disabled', async ({
    page,
    context,
  }) => {
    // First load - online (caches assets via service worker)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Clinic Software' })).toBeVisible()

    // Wait for service worker to cache assets
    await page.waitForTimeout(3000)

    // Log in while online
    await page.getByLabel(/password/i).fill('clinic123')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page.getByText('Welcome, Doctor')).toBeVisible()

    // Log out
    await page.getByRole('button', { name: /log out/i }).click()
    await expect(page.getByLabel(/password/i)).toBeVisible()

    // Go offline
    await context.setOffline(true)

    // Reload the page offline - should still work from cache
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Clinic Software' })).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()

    // Login should still work offline (IndexedDB is local)
    await page.getByLabel(/password/i).fill('clinic123')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page.getByText('Welcome, Doctor')).toBeVisible()
  })
})
