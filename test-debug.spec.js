const { test, expect, devices } = require('@playwright/test');

test.use({
  ...devices['iPhone 14'],
  hasTouch: true,
});

test('debug page initialization', async ({ browser }) => {
  const context = await browser.newContext({
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  
  // Capture console logs and errors
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    errors.push(err.toString());
  });
  
  await page.goto('https://satellitesushi.github.io/fitness-app/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('\n=== Console Logs ===');
  logs.forEach(log => console.log(log));
  
  console.log('\n=== Errors ===');
  if (errors.length === 0) {
    console.log('No errors');
  } else {
    errors.forEach(err => console.log(err));
  }
  
  // Check what's in the tab config
  const tabConfigCheck = await page.evaluate(() => {
    return {
      tabConfigExists: typeof tabConfig !== 'undefined',
      currentTab: typeof currentTab !== 'undefined' ? currentTab : null,
      currentPage: typeof currentPage !== 'undefined' ? currentPage : null,
      mealPlanPages: typeof tabConfig !== 'undefined' ? tabConfig['meal-plan']?.pages : null
    };
  });
  
  console.log('\n=== Tab Config Check ===');
  console.log(JSON.stringify(tabConfigCheck, null, 2));
  
  // Check DOM state
  const domState = await page.evaluate(() => {
    const pageNav = document.querySelector('.page-nav');
    const container = document.getElementById('pageNameContainer');
    return {
      pageNavExists: !!pageNav,
      pageNavDisplay: pageNav ? window.getComputedStyle(pageNav).display : null,
      pageNavVisible: pageNav ? pageNav.offsetWidth > 0 && pageNav.offsetHeight > 0 : false,
      containerExists: !!container,
      containerHTML: container ? container.innerHTML : null,
      containerWidth: container ? container.offsetWidth : null,
      containerStyle: container ? container.getAttribute('style') : null,
    };
  });
  
  console.log('\n=== DOM State ===');
  console.log(JSON.stringify(domState, null, 2));
  
  await context.close();
});
