const { test, expect, devices } = require('@playwright/test');

test.use({
  ...devices['iPhone 14'],
  hasTouch: true,
});

test('FINAL VERIFICATION - all fixes working', async ({ browser }) => {
  const context = await browser.newContext({
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  
  const timestamp = Date.now();
  await page.goto(`https://satellitesushi.github.io/fitness-app/?nocache=${timestamp}`, {
    waitUntil: 'load',
  });
  
  // Wait for full initialization
  await page.waitForTimeout(1500);
  
  console.log('\n=== FINAL VERIFICATION TEST ===\n');
  
  // 1. Verify titles render on cold load
  const titleCount = await page.locator('.page-title-item').count();
  console.log(`✓ Page titles rendered on cold load: ${titleCount} titles`);
  expect(titleCount).toBe(3);
  
  const titles = await page.locator('.page-title-item').allTextContents();
  console.log(`  Titles: ${titles.join(', ')}`);
  
  // 2. Verify focused title is centered
  const firstTitle = page.locator('.page-title-item').first();
  const firstBox = await firstTitle.boundingBox();
  const viewportWidth = page.viewportSize().width;
  const firstTitleCenter = firstBox.x + firstBox.width / 2;
  const distanceFromCenter = Math.abs(firstTitleCenter - viewportWidth / 2);
  console.log(`✓ First title centered: ${distanceFromCenter.toFixed(1)}px from screen center`);
  expect(distanceFromCenter).toBeLessThan(10);
  
  // 3. Verify opacity
  const opacities = await page.locator('.page-title-item').evaluateAll(els => 
    els.map(el => parseFloat(window.getComputedStyle(el).opacity))
  );
  console.log(`✓ Opacities correct: [${opacities.map(o => o.toFixed(2)).join(', ')}]`);
  expect(opacities[0]).toBeGreaterThan(0.9);
  expect(opacities[1]).toBeLessThan(0.5);
  
  // 4. Test clicking to jump
  await page.locator('.page-title-item').last().click();
  await page.waitForTimeout(500);
  
  const newOpacities = await page.locator('.page-title-item').evaluateAll(els => 
    els.map(el => parseFloat(window.getComputedStyle(el).opacity))
  );
  console.log(`✓ Click to jump works: [${newOpacities.map(o => o.toFixed(2)).join(', ')}]`);
  expect(newOpacities[2]).toBeGreaterThan(0.9);
  
  // 5. Test swipe on Workouts tab
  await page.locator('.tab[data-tab="workouts"]').click();
  await page.waitForTimeout(500);
  
  const workoutsCarousel = page.locator('#workouts .page-carousel');
  const box = await workoutsCarousel.boundingBox();
  
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 0; i <= 20; i++) {
    const x = box.x + box.width * (0.8 - 0.6 * (i / 20));
    await page.mouse.move(x, box.y + box.height / 2);
    await page.waitForTimeout(10);
  }
  await page.mouse.up();
  await page.waitForTimeout(500);
  
  const scrollLeft = await workoutsCarousel.evaluate(el => el.scrollLeft);
  console.log(`✓ Swipe works on Workouts tab: ${scrollLeft}px scrolled`);
  expect(scrollLeft).toBeGreaterThan(0);
  
  // 6. Verify no blur effects
  const headerBackdrop = await page.locator('.header').evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.backdropFilter || style.webkitBackdropFilter;
  });
  console.log(`✓ No blur on header: ${headerBackdrop}`);
  expect(headerBackdrop).toBe('none');
  
  // 7. Take final screenshot
  await page.screenshot({ path: '/workspace/final-verification.png', fullPage: false });
  console.log('\n✓ Screenshot saved to final-verification.png');
  
  console.log('\n=== ALL TESTS PASSED ===\n');
  
  await context.close();
});
