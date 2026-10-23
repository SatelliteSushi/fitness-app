// @ts-check
const { test, expect, devices } = require('@playwright/test');

test.use(devices['iPhone 14']);

test('DIAGNOSE: Capture console errors on live site', async ({ page }) => {
  const consoleMessages = [];
  const pageErrors = [];
  
  // Capture console messages
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });
  
  // Load live site
  await page.goto('https://satellitesushi.github.io/fitness-app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => {
    console.log(`[${msg.type}] ${msg.text}`);
    if (msg.location) {
      console.log(`  at ${msg.location.url}:${msg.location.lineNumber}:${msg.location.columnNumber}`);
    }
  });
  
  console.log('\n=== PAGE ERRORS ===');
  pageErrors.forEach(err => {
    console.log(`ERROR: ${err.message}`);
    if (err.stack) {
      console.log(err.stack);
    }
  });
  
  // Check tab bar
  const tabBar = await page.locator('.tab-bar').count();
  console.log(`\n=== DIAGNOSTICS ===`);
  console.log(`Tab bar found: ${tabBar > 0}`);
  
  // Check page titles
  const pageTitles = await page.locator('#pageTitlesRow').count();
  console.log(`Page titles row found: ${pageTitles > 0}`);
  
  // Try clicking tabs
  if (tabBar > 0) {
    try {
      await page.locator('.tab-bar .tab').first().click();
      console.log(`Tab click: OK`);
    } catch (e) {
      console.log(`Tab click: FAILED - ${e.message}`);
    }
  }
  
  // Take screenshot
  await page.screenshot({ path: '/workspace/diagnostic-screenshot.png', fullPage: true });
  console.log(`Screenshot saved`);
});
