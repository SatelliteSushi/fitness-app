# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-webkit.spec.js >> PWA UI Fixes - iPhone 14 WebKit >> should show page titles on cold load
- Location: test-webkit.spec.js:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#pageNameContainer')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" locator('#pageNameContainer') with timeout 5000ms
  - waiting for locator('#pageNameContainer')
    14 × locator resolved to <div id="pageNameContainer" class="page-name-container"></div>
       - unexpected value "hidden"

```

```yaml
- banner:
  - heading "MEAL PLAN" [level=1]
  - button
  - button
- main:
  - heading "Breakfast" [level=2]
  - text: Sample
  - paragraph: Start your day with balanced nutrition
  - text: Calories 450 Protein 25g
  - heading "Lunch" [level=2]
  - text: Sample
  - paragraph: Midday fuel for sustained energy
  - text: Calories 680
  - heading "Create Meal" [level=2]
  - text: Sample
  - paragraph: Build custom meals to fit your macros
  - text: Recipes 120+
  - heading "Saved Meals" [level=2]
  - text: Sample
  - paragraph: Your favorite meal combinations
  - text: Saved 12
- navigation:
  - link "Meal Plan":
    - /url: javascript:void(0)
    - img
    - text: Meal Plan
  - link "Workouts":
    - /url: javascript:void(0)
    - img
    - text: Workouts
  - link "Schedule":
    - /url: javascript:void(0)
    - img
    - text: Schedule
  - link "Settings":
    - /url: javascript:void(0)
    - img
    - text: Settings
```

# Test source

```ts
  1   | const { test, expect, devices } = require('@playwright/test');
  2   | 
  3   | test.use({
  4   |   ...devices['iPhone 14'],
  5   |   hasTouch: true,
  6   | });
  7   | 
  8   | test.describe('PWA UI Fixes - iPhone 14 WebKit', () => {
  9   |   
  10  |   test('should show page titles on cold load', async ({ browser }) => {
  11  |     // Fresh context with service worker cleared
  12  |     const context = await browser.newContext({
  13  |       serviceWorkers: 'block',
  14  |     });
  15  |     const page = await context.newPage();
  16  |     
  17  |     await page.goto('https://satellitesushi.github.io/fitness-app/');
  18  |     await page.waitForLoadState('networkidle');
  19  |     await page.waitForTimeout(1000);
  20  |     
  21  |     // Wait for fonts to load
  22  |     await page.waitForFunction(() => document.fonts.ready);
  23  |     
  24  |     // Debug: check if elements exist
  25  |     const pageNavVisible = await page.locator('.page-nav').isVisible();
  26  |     console.log('Page nav visible:', pageNavVisible);
  27  |     
  28  |     const pageNameCount = await page.locator('#pageNameContainer .page-name').count();
  29  |     console.log('Page name count:', pageNameCount);
  30  |     
  31  |     // Check that page name is visible on first load (Meal Plan tab, first page)
  32  |     const pageNameContainer = page.locator('#pageNameContainer');
> 33  |     await expect(pageNameContainer).toBeVisible();
      |                                     ^ Error: expect(locator).toBeVisible() failed
  34  |     
  35  |     if (pageNameCount > 0) {
  36  |       const firstPageName = pageNameContainer.locator('.page-name').first();
  37  |       const opacity = await firstPageName.evaluate(el => window.getComputedStyle(el).opacity);
  38  |       console.log('First page name opacity:', opacity);
  39  |       expect(parseFloat(opacity)).toBeGreaterThan(0);
  40  |     } else {
  41  |       console.log('WARNING: No page names found - navigation may not be initialized');
  42  |     }
  43  |     
  44  |     await context.close();
  45  |   });
  46  | 
  47  |   test('should allow swiping on all tabs', async ({ browser }) => {
  48  |     const context = await browser.newContext({
  49  |       serviceWorkers: 'block',
  50  |     });
  51  |     const page = await context.newPage();
  52  |     
  53  |     await page.goto('https://satellitesushi.github.io/fitness-app/');
  54  |     await page.waitForLoadState('networkidle');
  55  |     await page.waitForTimeout(1000);
  56  |     
  57  |     // Helper function to perform swipe gesture
  58  |     async function swipe(locator) {
  59  |       const box = await locator.boundingBox();
  60  |       const startX = box.x + box.width * 0.8;
  61  |       const startY = box.y + box.height / 2;
  62  |       const endX = box.x + box.width * 0.2;
  63  |       const endY = box.y + box.height / 2;
  64  |       
  65  |       await page.touchscreen.tap(startX, startY);
  66  |       await page.mouse.move(startX, startY);
  67  |       await page.mouse.down();
  68  |       
  69  |       // Simulate swipe with multiple move events
  70  |       const steps = 20;
  71  |       for (let i = 0; i <= steps; i++) {
  72  |         const x = startX + (endX - startX) * (i / steps);
  73  |         const y = startY + (endY - startY) * (i / steps);
  74  |         await page.mouse.move(x, y);
  75  |         await page.waitForTimeout(10);
  76  |       }
  77  |       
  78  |       await page.mouse.up();
  79  |     }
  80  |     
  81  |     // Test Meal Plan swipe
  82  |     const mealPlanCarousel = page.locator('#meal-plan .page-carousel');
  83  |     await swipe(mealPlanCarousel);
  84  |     await page.waitForTimeout(500);
  85  |     
  86  |     const mealPlanScroll = await mealPlanCarousel.evaluate(el => el.scrollLeft);
  87  |     console.log('Meal Plan scroll after swipe:', mealPlanScroll);
  88  |     expect(mealPlanScroll).toBeGreaterThan(0);
  89  |     
  90  |     // Switch to Workouts tab
  91  |     await page.locator('.tab[data-tab="workouts"]').click();
  92  |     await page.waitForTimeout(500);
  93  |     
  94  |     // Test Workouts swipe
  95  |     const workoutsCarousel = page.locator('#workouts .page-carousel');
  96  |     await swipe(workoutsCarousel);
  97  |     await page.waitForTimeout(500);
  98  |     
  99  |     const workoutsScroll = await workoutsCarousel.evaluate(el => el.scrollLeft);
  100 |     console.log('Workouts scroll after swipe:', workoutsScroll);
  101 |     expect(workoutsScroll).toBeGreaterThan(0);
  102 |     
  103 |     // Switch to Schedule tab
  104 |     await page.locator('.tab[data-tab="schedule"]').click();
  105 |     await page.waitForTimeout(500);
  106 |     
  107 |     // Test Schedule swipe
  108 |     const scheduleCarousel = page.locator('#schedule .page-carousel');
  109 |     await swipe(scheduleCarousel);
  110 |     await page.waitForTimeout(500);
  111 |     
  112 |     const scheduleScroll = await scheduleCarousel.evaluate(el => el.scrollLeft);
  113 |     console.log('Schedule scroll after swipe:', scheduleScroll);
  114 |     expect(scheduleScroll).toBeGreaterThan(0);
  115 |     
  116 |     await context.close();
  117 |   });
  118 | 
  119 |   test('should show correct chevron counts', async ({ browser }) => {
  120 |     const context = await browser.newContext({
  121 |       serviceWorkers: 'block',
  122 |     });
  123 |     const page = await context.newPage();
  124 |     
  125 |     await page.goto('https://satellitesushi.github.io/fitness-app/');
  126 |     await page.waitForLoadState('networkidle');
  127 |     await page.waitForTimeout(1000);
  128 |     
  129 |     // On page 0 of Meal Plan (3 pages total)
  130 |     const prevBtn = page.locator('#prevPageBtn');
  131 |     const nextBtn = page.locator('#nextPageBtn');
  132 |     
  133 |     // Debug
```