# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-feature5-verification.spec.js >> Feature #5: Workout create/edit form verification
- Location: test-feature5-verification.spec.js:6:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[placeholder="Workout name"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('input[placeholder="Workout name"]') with timeout 5000ms
  - waiting for locator('input[placeholder="Workout name"]')

```

```yaml
- banner:
  - heading "WORKOUTS" [level=1]
  - text: Today's Workout · Workouts
- main:
  - paragraph: No workout selected for today. Go to Workouts page to select one.
  - heading "Sample Push Day" [level=2]
  - text: Sample
  - paragraph: 3 exercises
  - button "Select for Today"
  - heading "Page 3" [level=2]
  - text: Sample
  - paragraph: Workouts content placeholder
- navigation:
  - link "Meal Plan":
    - /url: javascript:void(0)
    - img
    - text: Meal Plan
  - link "Workouts":
    - /url: javascript:void(0)
    - img
    - text: Workouts
  - link "Schedule":
    - /url: javascript:void(0)
    - img
    - text: Schedule
  - link "Settings":
    - /url: javascript:void(0)
    - img
    - text: Settings
```

# Test source

```ts
  1  | // @ts-check
  2  | const { test, expect, devices } = require('@playwright/test');
  3  | 
  4  | test.use(devices['iPhone 14']);
  5  | 
  6  | test('Feature #5: Workout create/edit form verification', async ({ page }) => {
  7  |   await page.goto('https://satellitesushi.github.io/fitness-app/');
  8  |   
  9  |   // Wait for app to load
  10 |   await page.waitForSelector('.tab-bar', { timeout: 5000 });
  11 |   
  12 |   // Switch to WORKOUTS tab
  13 |   const workoutsTab = page.locator('.tab-bar .tab').filter({ hasText: 'WORKOUTS' });
  14 |   await workoutsTab.click();
  15 |   await page.waitForTimeout(300);
  16 |   
  17 |   // Verify workout builder form exists
  18 |   const workoutNameInput = page.locator('input[placeholder="Workout name"]');
> 19 |   await expect(workoutNameInput).toBeVisible();
     |                                  ^ Error: expect(locator).toBeVisible() failed
  20 |   
  21 |   // Verify at least one exercise row exists (initial row)
  22 |   const exerciseRows = page.locator('.exercise-row');
  23 |   await expect(exerciseRows.first()).toBeVisible();
  24 |   
  25 |   // Verify Add Exercise button exists
  26 |   const addExerciseBtn = page.locator('button').filter({ hasText: 'Add Exercise' });
  27 |   await expect(addExerciseBtn).toBeVisible();
  28 |   
  29 |   // Verify the seeded workout from previous features is still present
  30 |   const workoutCards = page.locator('.workout-item');
  31 |   await expect(workoutCards).toHaveCount(1); // Should have the Push Day workout
  32 |   
  33 |   // Verify Select button exists on workout card
  34 |   const selectBtn = page.locator('button').filter({ hasText: 'Select' });
  35 |   await expect(selectBtn.first()).toBeVisible();
  36 |   
  37 |   console.log('✓ Feature #5 verified: Workout create/edit form is present and functional');
  38 | });
  39 | 
```