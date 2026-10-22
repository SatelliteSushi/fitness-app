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
  
  // Force fresh load with cache-busting
  const timestamp = Date.now();
  await page.goto(`https://satellitesushi.github.io/fitness-app/?nocache=${timestamp}`, {
    waitUntil: 'load', // Wait for load event, not just networkidle
  });
  
  // Wait for load event to have processed
  await page.waitForFunction(() => {
    // Check if initialization has run by checking if container has children
    const container = document.getElementById('pageNameContainer');
    return container && container.children.length > 0;
  }, { timeout: 5000 }).catch(() => {
    // If it times out, the load event didn't trigger initialization
    console.log('Load event did not trigger initialization');
  });
  
  await page.waitForTimeout(1000);
  
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
    // Check if functions exist
    const switchTabExists = typeof switchTab === 'function';
    const updatePageNavigationExists = typeof updatePageNavigation === 'function';
    
    // Try calling updatePageNavigation manually
    let manualCallResult = null;
    if (updatePageNavigationExists) {
      try {
        updatePageNavigation();
        manualCallResult = 'success';
      } catch (e) {
        manualCallResult = e.toString();
      }
    }
    
    return {
      tabConfigExists: typeof tabConfig !== 'undefined',
      currentTab: typeof currentTab !== 'undefined' ? currentTab : null,
      currentPage: typeof currentPage !== 'undefined' ? currentPage : null,
      mealPlanPages: typeof tabConfig !== 'undefined' ? tabConfig['meal-plan']?.pages : null,
      switchTabExists,
      updatePageNavigationExists,
      manualCallResult,
    };
  });
  
  console.log('\n=== Tab Config Check ===');
  console.log(JSON.stringify(tabConfigCheck, null, 2));
  
  // Check DOM state
  const domState = await page.evaluate(() => {
    const pageNav = document.querySelector('.page-nav');
    const container = document.getElementById('pageNameContainer');
    
    // After manual call, check again
    const pageNames = container ? container.querySelectorAll('.page-name') : [];
    const pageNameData = Array.from(pageNames).map(el => ({
      text: el.textContent,
      className: el.className,
      offsetWidth: el.offsetWidth,
      opacity: window.getComputedStyle(el).opacity,
    }));
    
    return {
      pageNavExists: !!pageNav,
      pageNavDisplay: pageNav ? window.getComputedStyle(pageNav).display : null,
      pageNavVisible: pageNav ? pageNav.offsetWidth > 0 && pageNav.offsetHeight > 0 : false,
      containerExists: !!container,
      containerHTML: container ? container.innerHTML.substring(0, 200) : null,
      containerWidth: container ? container.offsetWidth : null,
      containerStyle: container ? container.getAttribute('style') : null,
      pageNameCount: pageNames.length,
      pageNameData,
    };
  });
  
  console.log('\n=== DOM State ===');
  console.log(JSON.stringify(domState, null, 2));
  
  await context.close();
});
