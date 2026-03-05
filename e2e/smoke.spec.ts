import { test, expect } from '@playwright/test'

test('app loads and shows login or app heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Clinic Software')).toBeVisible()
})
