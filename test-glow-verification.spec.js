const { test, expect, devices } = require('@playwright/test');

test.use({
  ...devices['iPhone 14'],
  hasTouch: true,
});

test('verify glow effect and data loading', async ({ browser }) => {
  const context = await browser.newContext({
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  
  const timestamp = Date.now();
  await page.goto(`https://satellitesushi.github.io/fitness-app/?nocache=${timestamp}`, {
    waitUntil: 'load',
  });
  
  await page.waitForTimeout(2000);
  
  console.log('\n=== VERIFICATION TEST ===\n');
  
  // 1. Check glow effect exists
  const cardGlow = await page.locator('.card').first().evaluate(el => {
    const before = window.getComputedStyle(el, '::before');
    return {
      content: before.content,
      background: before.background,
      opacity: before.opacity
    };
  });
  console.log('Card glow ::before:', cardGlow.content !== 'none' ? 'EXISTS' : 'MISSING');
  
  // 2. Navigate to My Meals
  await page.locator('.tab[data-tab="meal-plan"]').click();
  await page.waitForTimeout(500);
  
  // Click "My Meals" title
  const myMealsTitle = page.locator('.page-title-item').filter({ hasText: 'My Meals' });
  await myMealsTitle.click();
  await page.waitForTimeout(500);
  
  // Check recipes are displayed
  const recipeCards = await page.locator('#meal-plan .card').count();
  console.log(`My Meals: ${recipeCards} recipe cards found`);
  
  const recipeNames = await page.locator('#meal-plan .card-title').allTextContents();
  console.log(`Recipe names: ${recipeNames.join(', ')}`);
  
  // 3. Navigate to Workouts
  await page.locator('.tab[data-tab="workouts"]').click();
  await page.waitForTimeout(500);
  
  // Click "Workouts" title
  const workoutsTitle = page.locator('.page-title-item').filter({ hasText: 'Workouts' }).last();
  await workoutsTitle.click();
  await page.waitForTimeout(500);
  
  const workoutCards = await page.locator('#workouts .card').count();
  console.log(`Workouts: ${workoutCards} workout cards found`);
  
  // 4. Take screenshot
  await page.screenshot({ path: '/workspace/glow-and-data-verification.png', fullPage: false });
  console.log('\n✓ Screenshot saved');
  
  // 5. Verify no blur on header
  const headerBackdrop = await page.locator('.header').evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.backdropFilter || style.webkitBackdropFilter;
  });
  console.log(`Header backdrop-filter: ${headerBackdrop} (should be none)`);
  expect(headerBackdrop).toBe('none');
  
  console.log('\n=== VERIFICATION COMPLETE ===\n');
  
  await context.close();
});
