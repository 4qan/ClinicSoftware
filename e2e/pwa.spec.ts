import { test, expect } from '@playwright/test'

test.describe('PWA', () => {
  test('production build serves manifest', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest')
    expect(response?.status()).toBe(200)

    const manifest = await response?.json()
    expect(manifest.name).toBe('Clinic Software')
    expect(manifest.short_name).toBe('Clinic')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
  })

  test('service worker is registered', async ({ page }) => {
    await page.goto('/')
    // Wait for SW registration (the registerSW.js script auto-registers)
    await page.waitForTimeout(2000)

    const swRegistrations = await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations()
      return registrations.length
    })

    expect(swRegistrations).toBeGreaterThanOrEqual(1)
  })

  test('app shows login page on load', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Clinic Software' })).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible()
  })
})
