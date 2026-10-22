const { test, expect, devices } = require('@playwright/test');

test.use({
  ...devices['iPhone 14'],
  hasTouch: true,
});

test('detailed debug - trace updatePageNavigation execution', async ({ browser }) => {
  const context = await browser.newContext({
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  const errors = [];
  page.on('pageerror', err => {
    errors.push(err.toString());
  });
  
  const timestamp = Date.now();
  await page.goto(`https://satellitesushi.github.io/fitness-app/?nocache=${timestamp}`, {
    waitUntil: 'load',
  });
  
  // Wait for initialization
  await page.waitForTimeout(2000);
  
  console.log('\n=== Console Logs ===');
  logs.forEach(log => console.log(log));
  
  console.log('\n=== Errors ===');
  if (errors.length > 0) {
    errors.forEach(err => console.log(err));
  } else {
    console.log('No errors');
  }
  
  // Check what updatePageNavigation is doing
  const debugInfo = await page.evaluate(() => {
    return {
      currentTab,
      currentPage,
      tabConfigExists: typeof tabConfig !== 'undefined',
      mealPlanPages: tabConfig ? tabConfig['meal-plan']?.pages : null,
      pageNavExists: !!document.getElementById('pageNav'),
      titlesRowExists: !!document.getElementById('pageTitlesRow'),
      titlesRowHTML: document.getElementById('pageTitlesRow')?.innerHTML || 'MISSING',
      pageTitleElementsCount: Object.keys(pageTitleElements).length,
      updatePageNavigationExists: typeof updatePageNavigation === 'function',
    };
  });
  
  console.log('\n=== Debug Info ===');
  console.log(JSON.stringify(debugInfo, null, 2));
  
  // Try calling updatePageNavigation manually
  await page.evaluate(() => {
    console.log('Manually calling updatePageNavigation...');
    updatePageNavigation();
    console.log('updatePageNavigation called');
  });
  
  await page.waitForTimeout(500);
  
  const afterManual = await page.evaluate(() => {
    return {
      titlesRowHTML: document.getElementById('pageTitlesRow')?.innerHTML || 'MISSING',
      titleCount: document.querySelectorAll('.page-title-item').length,
    };
  });
  
  console.log('\n=== After Manual Call ===');
  console.log(JSON.stringify(afterManual, null, 2));
  
  await context.close();
});
