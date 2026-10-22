const { test, expect, devices } = require('@playwright/test');

test.use({
  ...devices['iPhone 14'],
  hasTouch: true,
});

test('new page navigation design - all titles visible with opacity', async ({ browser }) => {
  const context = await browser.newContext({
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  
  // Force fresh load
  const timestamp = Date.now();
  await page.goto(`https://satellitesushi.github.io/fitness-app/?nocache=${timestamp}`, {
    waitUntil: 'load',
  });
  
  // Wait for initialization
  await page.waitForFunction(() => {
    const titlesRow = document.getElementById('pageTitlesRow');
    return titlesRow && titlesRow.children.length > 0;
  }, { timeout: 5000 }).catch(() => null);
  
  await page.waitForTimeout(500);
  
  console.log('\n=== Page Navigation Test ===');
  
  // Check that all titles are visible
  const titleCount = await page.locator('.page-title-item').count();
  console.log(`Total page titles visible: ${titleCount}`);
  expect(titleCount).toBe(3); // Meal Plan has 3 pages
  
  // Check opacity of titles
  const titles = await page.locator('.page-title-item').all();
  const opacities = await Promise.all(titles.map(t => t.evaluate(el => window.getComputedStyle(el).opacity)));
  console.log(`Title opacities: ${opacities.join(', ')}`);
  
  // First title should be fully opaque (1), others should be 0.35
  expect(parseFloat(opacities[0])).toBeGreaterThan(0.9);
  expect(parseFloat(opacities[1])).toBeLessThan(0.5);
  expect(parseFloat(opacities[2])).toBeLessThan(0.5);
  
  // Check that separators exist
  const separatorCount = await page.locator('.page-title-separator').count();
  console.log(`Separators: ${separatorCount}`);
  expect(separatorCount).toBe(2); // 3 titles = 2 separators
  
  // Test clicking on a title
  await titles[2].click(); // Click "My Meals"
  await page.waitForTimeout(500);
  
  // Check that opacity changed
  const newOpacities = await Promise.all(titles.map(t => t.evaluate(el => window.getComputedStyle(el).opacity)));
  console.log(`After click, title opacities: ${newOpacities.join(', ')}`);
  expect(parseFloat(newOpacities[2])).toBeGreaterThan(0.9); // Now focused
  expect(parseFloat(newOpacities[0])).toBeLessThan(0.5); // No longer focused
  
  // Take screenshot
  await page.screenshot({ path: '/workspace/new-design-screenshot.png', fullPage: false });
  console.log('Screenshot saved to new-design-screenshot.png');
  
  // Test swipe on Workouts tab
  await page.locator('.tab[data-tab="workouts"]').click();
  await page.waitForTimeout(500);
  
  const workoutsTitles = await page.locator('.page-title-item').count();
  console.log(`\nWorkouts tab has ${workoutsTitles} titles`);
  
  // Test swipe gesture
  const carousel = page.locator('#workouts .page-carousel');
  const box = await carousel.boundingBox();
  
  // Simulate swipe with mouse drag
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.down();
  
  for (let i = 0; i <= 20; i++) {
    const x = box.x + box.width * (0.8 - 0.6 * (i / 20));
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.waitForTimeout(10);
  }
  
  await page.mouse.up();
  await page.waitForTimeout(500);
  
  const scrollLeft = await carousel.evaluate(el => el.scrollLeft);
  console.log(`Workouts carousel scrolled: ${scrollLeft}px`);
  expect(scrollLeft).toBeGreaterThan(0);
  
  await context.close();
});

test('no blur effects present', async ({ browser }) => {
  const context = await browser.newContext({
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  
  const timestamp = Date.now();
  await page.goto(`https://satellitesushi.github.io/fitness-app/?nocache=${timestamp}`, {
    waitUntil: 'load',
  });
  await page.waitForTimeout(500);
  
  // Check header has no backdrop-filter
  const header = page.locator('.header');
  const headerBackdrop = await header.evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.backdropFilter || style.webkitBackdropFilter;
  });
  console.log('\nHeader backdrop-filter:', headerBackdrop);
  expect(headerBackdrop).toBe('none');
  
  // Check cards have no backdrop-filter
  const card = page.locator('.card').first();
  const cardBackdrop = await card.evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.backdropFilter || style.webkitBackdropFilter;
  });
  console.log('Card backdrop-filter:', cardBackdrop);
  expect(cardBackdrop).toBe('none');
  
  await context.close();
});
