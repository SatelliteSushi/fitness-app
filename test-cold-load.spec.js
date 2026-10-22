const { test, expect, devices } = require('@playwright/test');

test.use({
  ...devices['iPhone 14'],
  hasTouch: true,
});

test('COLD LOAD - page titles must render on first load before any interaction', async ({ browser }) => {
  const context = await browser.newContext({
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  
  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Force cold load with cache-busting
  const timestamp = Date.now();
  await page.goto(`https://satellitesushi.github.io/fitness-app/?nocache=${timestamp}`, {
    waitUntil: 'load',
  });
  
  // Wait a moment for initialization
  await page.waitForTimeout(1000);
  
  console.log('\n=== COLD LOAD TEST - NO INTERACTION YET ===');
  console.log('Console logs:');
  logs.forEach(log => console.log('  ' + log));
  
  // Check page titles BEFORE any interaction
  const titlesRow = await page.locator('#pageTitlesRow');
  const isVisible = await titlesRow.isVisible();
  console.log(`\nTitles row visible: ${isVisible}`);
  
  const titleCount = await page.locator('.page-title-item').count();
  console.log(`Page title count: ${titleCount}`);
  
  const innerHTML = await titlesRow.innerHTML();
  console.log(`Titles row HTML (first 200 chars): ${innerHTML.substring(0, 200)}`);
  
  // Take screenshot BEFORE any interaction
  await page.screenshot({ 
    path: '/workspace/cold-load-proof.png', 
    fullPage: false 
  });
  console.log('\n✓ Screenshot saved to cold-load-proof.png');
  
  // Verify titles exist
  expect(titleCount).toBeGreaterThan(0);
  
  // Verify they're visible
  const firstTitle = page.locator('.page-title-item').first();
  await expect(firstTitle).toBeVisible();
  
  // Check opacity
  const opacity = await firstTitle.evaluate(el => window.getComputedStyle(el).opacity);
  console.log(`First title opacity: ${opacity}`);
  expect(parseFloat(opacity)).toBeGreaterThan(0.9);
  
  // Get all title texts
  const titles = await page.locator('.page-title-item').allTextContents();
  console.log(`Title texts: ${titles.join(', ')}`);
  expect(titles).toEqual(["Today's Meals", "Meal Builder", "My Meals"]);
  
  console.log('\n=== COLD LOAD SUCCESSFUL ===');
  
  await context.close();
});

test('focused title is ALWAYS centered, even for first/last pages', async ({ browser }) => {
  const context = await browser.newContext({
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  
  const timestamp = Date.now();
  await page.goto(`https://satellitesushi.github.io/fitness-app/?nocache=${timestamp}`, {
    waitUntil: 'load',
  });
  
  await page.waitForTimeout(1000);
  
  console.log('\n=== CENTERING TEST ===');
  
  // Get the first title position (should be centered)
  const firstTitle = page.locator('.page-title-item').first();
  const firstBox = await firstTitle.boundingBox();
  const viewportWidth = page.viewportSize().width;
  const firstTitleCenter = firstBox.x + firstBox.width / 2;
  
  console.log(`Viewport width: ${viewportWidth}`);
  console.log(`First title center X: ${firstTitleCenter}`);
  console.log(`Distance from screen center: ${Math.abs(firstTitleCenter - viewportWidth / 2)}px`);
  
  // Should be centered (within 5px tolerance)
  expect(Math.abs(firstTitleCenter - viewportWidth / 2)).toBeLessThan(5);
  
  // Click last title
  const lastTitle = page.locator('.page-title-item').last();
  await lastTitle.click();
  await page.waitForTimeout(500);
  
  // Check last title is also centered
  const lastBox = await lastTitle.boundingBox();
  const lastTitleCenter = lastBox.x + lastBox.width / 2;
  
  console.log(`Last title center X: ${lastTitleCenter}`);
  console.log(`Distance from screen center: ${Math.abs(lastTitleCenter - viewportWidth / 2)}px`);
  
  expect(Math.abs(lastTitleCenter - viewportWidth / 2)).toBeLessThan(5);
  
  // Take screenshot showing last page centered
  await page.screenshot({ 
    path: '/workspace/last-page-centered.png', 
    fullPage: false 
  });
  console.log('Screenshot saved to last-page-centered.png');
  
  await context.close();
});
