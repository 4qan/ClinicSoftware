import { test, expect } from '@playwright/test'

test.describe('Patient Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/')
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('ClinicSoftware')
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
        req.onblocked = () => resolve()
      })
    })
    await page.reload()

    // Log in with default password
    await page.getByLabel(/password/i).fill('clinic123')
    await page.getByRole('button', { name: /log in/i }).click()

    // Wait for home page
    await expect(page.getByRole('heading', { name: 'Recent Patients' })).toBeVisible()
  })

  test('register patient, view profile, search, edit, and verify persistence', async ({ page }) => {
    // Navigate to register patient
    await page.getByRole('link', { name: /register new patient/i }).click()
    await expect(page.getByRole('heading', { name: /register new patient/i })).toBeVisible()

    // Fill out form with test data
    await page.getByLabel(/first name/i).fill('Tariq')
    await page.getByLabel(/last name/i).fill('Mehmood')
    await page.getByLabel(/^male$/i).check()
    await page.getByLabel(/age/i).fill('42')
    await page.getByLabel(/contact number/i).fill('03215551234')

    // Save
    await page.getByRole('button', { name: /save patient/i }).click()

    // Verify redirect to patient profile with correct data
    await expect(page.getByText('Tariq Mehmood')).toBeVisible()
    await expect(page.getByText(/42 years/)).toBeVisible()
    await expect(page.getByText(/male/i)).toBeVisible()
    await expect(page.getByText('03215551234')).toBeVisible()

    // Get the patient ID from the profile
    const patientIdElement = page.locator('.font-mono').first()
    const patientId = await patientIdElement.textContent()
    expect(patientId).toMatch(/^\d{4}-\d{4}$/)

    // Verify "No visits yet" in history section
    await expect(page.getByText('No visits yet')).toBeVisible()

    // Navigate to home, verify patient appears in recent patients
    await page.getByRole('link', { name: /clinic software/i }).click()
    await expect(page.getByText('Tariq Mehmood')).toBeVisible()

    // Search by name using header search
    const headerSearch = page.locator('header input[type="text"]')
    await headerSearch.fill('Tariq')
    await expect(page.locator('header').getByText('Tariq Mehmood')).toBeVisible()
    await headerSearch.fill('')

    // Search by patient ID
    await headerSearch.fill(patientId!)
    await expect(page.locator('header').getByText('Tariq Mehmood')).toBeVisible()
    await headerSearch.fill('')

    // Search by contact
    await headerSearch.fill('03215')
    await expect(page.locator('header').getByText('Tariq Mehmood')).toBeVisible()

    // Click result to navigate to profile
    await page.locator('header').getByText('Tariq Mehmood').click()
    await expect(page.getByText(/42 years/)).toBeVisible()

    // Edit patient from profile (change contact number)
    await page.getByRole('button', { name: /edit/i }).click()
    const contactInput = page.getByLabel(/contact/i)
    await contactInput.clear()
    await contactInput.fill('03009999999')
    await page.getByRole('button', { name: /save/i }).click()

    // Verify update persists on page
    await expect(page.getByText('03009999999')).toBeVisible()

    // Refresh page, verify data survives (IndexedDB persistence)
    await page.reload()

    // May need to log in again after reload
    const passwordInput = page.getByLabel(/password/i)
    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await passwordInput.fill('clinic123')
      await page.getByRole('button', { name: /log in/i }).click()
    }

    // Navigate to home
    await page.goto('/')
    if (await page.getByLabel(/password/i).isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.getByLabel(/password/i).fill('clinic123')
      await page.getByRole('button', { name: /log in/i }).click()
    }

    // Verify patient still exists in recent list
    await expect(page.getByText('Tariq Mehmood')).toBeVisible()

    // Register a second patient
    await page.getByRole('link', { name: /register new patient/i }).click()
    await page.getByLabel(/first name/i).fill('Fatima')
    await page.getByLabel(/last name/i).fill('Ali')
    await page.getByLabel(/^female$/i).check()
    await page.getByLabel(/age/i).fill('30')
    await page.getByRole('button', { name: /save patient/i }).click()

    // Verify redirect to second patient profile
    await expect(page.getByText('Fatima Ali')).toBeVisible()

    // Go home, verify both appear in recent list
    await page.getByRole('link', { name: /clinic software/i }).click()
    await expect(page.getByText('Tariq Mehmood')).toBeVisible()
    await expect(page.getByText('Fatima Ali')).toBeVisible()
  })
})
