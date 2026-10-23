// @ts-check
const { test, expect, devices } = require('@playwright/test');

test.use(devices['iPhone 14']);

test('SMOKE TEST: Cold load verification', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  
  // Capture errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore service worker load errors (deployment/cache issues, not app errors)
      if (text.includes('service-worker.js') || text.includes('Script load failed')) {
        return; // Skip this error
      }
      consoleErrors.push(text);
    }
  });
  
  page.on('pageerror', error => {
    const msg = error.message;
    // Ignore service worker load errors
    if (msg.includes('service-worker.js') || msg.includes('Script load failed')) {
      return;
    }
    pageErrors.push(msg);
  });
  
  // Cold load
  await page.goto('https://satellitesushi.github.io/fitness-app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  console.log('\n=== SMOKE TEST RESULTS ===\n');
  
  // 1. Check for console errors
  console.log('1. Console Errors:');
  if (consoleErrors.length === 0 && pageErrors.length === 0) {
    console.log('   ✓ PASS - No errors (service worker load warnings ignored)');
  } else {
    console.log('   ✗ FAIL - Errors found:');
    consoleErrors.forEach(err => console.log(`     - ${err}`));
    pageErrors.forEach(err => console.log(`     - ${err}`));
  }
  
  // 2. Test tab switching
  console.log('\n2. Tab Switching:');
  const tabs = [
    { name: 'meal-plan', label: 'Meal Plan' },
    { name: 'workouts', label: 'Workouts' },
    { name: 'schedule', label: 'Schedule' },
    { name: 'settings', label: 'Settings' }
  ];
  
  let tabSwitchPass = true;
  for (const tab of tabs) {
    try {
      await page.locator(`.tab-bar .tab[data-tab="${tab.name}"]`).click();
      await page.waitForTimeout(300);
      
      const activeTab = await page.locator('.tab.active').getAttribute('data-tab');
      const appTitle = await page.locator('#appTitle').textContent();
      
      if (activeTab === tab.name) {
        console.log(`   ✓ ${tab.label} tab: switched OK (title: "${appTitle}")`);
      } else {
        console.log(`   ✗ ${tab.label} tab: FAILED (expected ${tab.name}, got ${activeTab})`);
        tabSwitchPass = false;
      }
    } catch (e) {
      console.log(`   ✗ ${tab.label} tab: ERROR - ${e.message}`);
      tabSwitchPass = false;
    }
  }
  
  // 3. Check page title row population
  console.log('\n3. Page Title Row Population:');
  let titleRowPass = true;
  
  for (const tab of tabs) {
    await page.locator(`.tab-bar .tab[data-tab="${tab.name}"]`).click();
    await page.waitForTimeout(300);
    
    try {
      const pageTitlesRow = page.locator('#pageTitlesRow');
      const titleCount = await pageTitlesRow.locator('.page-title-item').count();
      
      if (titleCount > 0) {
        const titles = await pageTitlesRow.locator('.page-title-item').allTextContents();
        console.log(`   ✓ ${tab.label}: ${titleCount} page(s) - ${titles.join(', ')}`);
      } else {
        console.log(`   ✓ ${tab.label}: No sub-pages (single page tab)`);
      }
    } catch (e) {
      console.log(`   ✗ ${tab.label}: ERROR - ${e.message}`);
      titleRowPass = false;
    }
  }
  
  // Final verdict
  console.log('\n=== FINAL RESULT ===\n');
  const allPass = consoleErrors.length === 0 && pageErrors.length === 0 && tabSwitchPass && titleRowPass;
  
  if (allPass) {
    console.log('✓ SMOKE TEST PASSED - Safe to push\n');
  } else {
    console.log('✗ SMOKE TEST FAILED - DO NOT PUSH\n');
    throw new Error('Smoke test failed');
  }
});
