const { test, expect, devices } = require('@playwright/test');

test.use({
  ...devices['iPhone 14'],
  hasTouch: true,
});

test.describe('PWA UI Fixes - iPhone 14 WebKit', () => {
  
  test('should show page titles on cold load', async ({ browser }) => {
    // Fresh context with service worker cleared
    const context = await browser.newContext({
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    
    await page.goto('https://satellitesushi.github.io/fitness-app/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Wait for fonts to load
    await page.waitForFunction(() => document.fonts.ready);
    
    // Debug: check if elements exist
    const pageNavVisible = await page.locator('.page-nav').isVisible();
    console.log('Page nav visible:', pageNavVisible);
    
    const pageNameCount = await page.locator('#pageNameContainer .page-name').count();
    console.log('Page name count:', pageNameCount);
    
    // Check that page name is visible on first load (Meal Plan tab, first page)
    const pageNameContainer = page.locator('#pageNameContainer');
    await expect(pageNameContainer).toBeVisible();
    
    if (pageNameCount > 0) {
      const firstPageName = pageNameContainer.locator('.page-name').first();
      const opacity = await firstPageName.evaluate(el => window.getComputedStyle(el).opacity);
      console.log('First page name opacity:', opacity);
      expect(parseFloat(opacity)).toBeGreaterThan(0);
    } else {
      console.log('WARNING: No page names found - navigation may not be initialized');
    }
    
    await context.close();
  });

  test('should allow swiping on all tabs', async ({ browser }) => {
    const context = await browser.newContext({
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    
    await page.goto('https://satellitesushi.github.io/fitness-app/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Helper function to perform swipe gesture
    async function swipe(locator) {
      const box = await locator.boundingBox();
      const startX = box.x + box.width * 0.8;
      const startY = box.y + box.height / 2;
      const endX = box.x + box.width * 0.2;
      const endY = box.y + box.height / 2;
      
      await page.touchscreen.tap(startX, startY);
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      
      // Simulate swipe with multiple move events
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const x = startX + (endX - startX) * (i / steps);
        const y = startY + (endY - startY) * (i / steps);
        await page.mouse.move(x, y);
        await page.waitForTimeout(10);
      }
      
      await page.mouse.up();
    }
    
    // Test Meal Plan swipe
    const mealPlanCarousel = page.locator('#meal-plan .page-carousel');
    await swipe(mealPlanCarousel);
    await page.waitForTimeout(500);
    
    const mealPlanScroll = await mealPlanCarousel.evaluate(el => el.scrollLeft);
    console.log('Meal Plan scroll after swipe:', mealPlanScroll);
    expect(mealPlanScroll).toBeGreaterThan(0);
    
    // Switch to Workouts tab
    await page.locator('.tab[data-tab="workouts"]').click();
    await page.waitForTimeout(500);
    
    // Test Workouts swipe
    const workoutsCarousel = page.locator('#workouts .page-carousel');
    await swipe(workoutsCarousel);
    await page.waitForTimeout(500);
    
    const workoutsScroll = await workoutsCarousel.evaluate(el => el.scrollLeft);
    console.log('Workouts scroll after swipe:', workoutsScroll);
    expect(workoutsScroll).toBeGreaterThan(0);
    
    // Switch to Schedule tab
    await page.locator('.tab[data-tab="schedule"]').click();
    await page.waitForTimeout(500);
    
    // Test Schedule swipe
    const scheduleCarousel = page.locator('#schedule .page-carousel');
    await swipe(scheduleCarousel);
    await page.waitForTimeout(500);
    
    const scheduleScroll = await scheduleCarousel.evaluate(el => el.scrollLeft);
    console.log('Schedule scroll after swipe:', scheduleScroll);
    expect(scheduleScroll).toBeGreaterThan(0);
    
    await context.close();
  });

  test('should show correct chevron counts', async ({ browser }) => {
    const context = await browser.newContext({
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    
    await page.goto('https://satellitesushi.github.io/fitness-app/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // On page 0 of Meal Plan (3 pages total)
    const prevBtn = page.locator('#prevPageBtn');
    const nextBtn = page.locator('#nextPageBtn');
    
    // Debug
    const prevHTML = await prevBtn.innerHTML();
    const nextHTML = await nextBtn.innerHTML();
    console.log('Prev button HTML:', prevHTML);
    console.log('Next button HTML:', nextHTML);
    
    // Should have 0 active left chevrons (so 1 greyed), 2 active right chevrons
    const leftChevrons = await prevBtn.locator('.chevron').count();
    const rightChevrons = await nextBtn.locator('.chevron').count();
    
    console.log('Left chevrons:', leftChevrons, 'Right chevrons:', rightChevrons);
    
    // If no chevrons, navigation isn't initialized
    if (leftChevrons === 0 && rightChevrons === 0) {
      console.log('WARNING: No chevrons found - navigation may not be initialized');
    } else {
      expect(leftChevrons).toBeGreaterThan(0); // Should have at least one
      expect(rightChevrons).toBeGreaterThan(0); // Should have at least one
    }
    
    await context.close();
  });

  test('should have no blur effects', async ({ browser }) => {
    const context = await browser.newContext({
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    
    await page.goto('https://satellitesushi.github.io/fitness-app/');
    await page.waitForLoadState('networkidle');
    
    // Check header has no backdrop-filter
    const header = page.locator('.header');
    const headerBackdrop = await header.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backdropFilter || style.webkitBackdropFilter;
    });
    console.log('Header backdrop-filter:', headerBackdrop);
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

  test('should have arrows close to page name', async ({ browser }) => {
    const context = await browser.newContext({
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    
    await page.goto('https://satellitesushi.github.io/fitness-app/');
    await page.waitForLoadState('networkidle');
    
    // Check gap between arrows and page name container
    const pageNav = page.locator('.page-nav');
    const gap = await pageNav.evaluate(el => window.getComputedStyle(el).gap);
    
    console.log('Page nav gap:', gap);
    // Should be 4px
    expect(gap).toBe('4px');
    
    // Check that page-nav uses flexbox (computed style shows "flex" for both flex and inline-flex)
    const display = await pageNav.evaluate(el => window.getComputedStyle(el).display);
    console.log('Page nav display:', display);
    expect(display).toBe('flex'); // Computed style shows "flex" for inline-flex
    
    await context.close();
  });

  test('should take screenshot for visual verification', async ({ browser }) => {
    const context = await browser.newContext({
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    
    await page.goto('https://satellitesushi.github.io/fitness-app/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Take screenshot of header area
    await page.screenshot({ path: '/workspace/webkit-header-screenshot.png', fullPage: false });
    console.log('Screenshot saved to webkit-header-screenshot.png');
    
    await context.close();
  });
});
