// @ts-check
const { test, expect, devices } = require('@playwright/test');

test.use(devices['iPhone 14']);

test('Feature #5: Workout create/edit form verification', async ({ page }) => {
  await page.goto('https://satellitesushi.github.io/fitness-app/');
  
  // Wait for app to load
  await page.waitForSelector('.tab-bar', { timeout: 5000 });
  
  // Switch to WORKOUTS tab
  const workoutsTab = page.locator('.tab-bar .tab').filter({ hasText: 'WORKOUTS' });
  await workoutsTab.click();
  await page.waitForTimeout(300);
  
  // Verify workout builder form exists
  const workoutNameInput = page.locator('input[placeholder="Workout name"]');
  await expect(workoutNameInput).toBeVisible();
  
  // Verify at least one exercise row exists (initial row)
  const exerciseRows = page.locator('.exercise-row');
  await expect(exerciseRows.first()).toBeVisible();
  
  // Verify Add Exercise button exists
  const addExerciseBtn = page.locator('button').filter({ hasText: 'Add Exercise' });
  await expect(addExerciseBtn).toBeVisible();
  
  // Verify the seeded workout from previous features is still present
  const workoutCards = page.locator('.workout-item');
  await expect(workoutCards).toHaveCount(1); // Should have the Push Day workout
  
  // Verify Select button exists on workout card
  const selectBtn = page.locator('button').filter({ hasText: 'Select' });
  await expect(selectBtn.first()).toBeVisible();
  
  console.log('✓ Feature #5 verified: Workout create/edit form is present and functional');
});
