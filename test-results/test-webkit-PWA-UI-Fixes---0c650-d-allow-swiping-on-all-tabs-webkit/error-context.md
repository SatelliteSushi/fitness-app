# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-webkit.spec.js >> PWA UI Fixes - iPhone 14 WebKit >> should allow swiping on all tabs
- Location: test-webkit.spec.js:47:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - heading "MEAL PLAN" [level=1] [ref=e4]
    - generic [ref=e5]:
      - button
      - button
  - main [ref=e6]:
    - generic [ref=e8]:
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]:
            - heading "Breakfast" [level=2] [ref=e13]
            - generic [ref=e14]: Sample
          - generic [ref=e15]:
            - paragraph [ref=e16]: Start your day with balanced nutrition
            - generic [ref=e17]:
              - generic [ref=e18]: Calories
              - generic [ref=e19]: "450"
            - generic [ref=e20]:
              - generic [ref=e21]: Protein
              - generic [ref=e22]: 25g
        - generic [ref=e23]:
          - generic [ref=e24]:
            - heading "Lunch" [level=2] [ref=e25]
            - generic [ref=e26]: Sample
          - generic [ref=e27]:
            - paragraph [ref=e28]: Midday fuel for sustained energy
            - generic [ref=e29]:
              - generic [ref=e30]: Calories
              - generic [ref=e31]: "680"
      - generic [ref=e34]:
        - generic [ref=e35]:
          - heading "Create Meal" [level=2] [ref=e36]
          - generic [ref=e37]: Sample
        - generic [ref=e38]:
          - paragraph [ref=e39]: Build custom meals to fit your macros
          - generic [ref=e40]:
            - generic [ref=e41]: Recipes
            - generic [ref=e42]: 120+
      - generic [ref=e45]:
        - generic [ref=e46]:
          - heading "Saved Meals" [level=2] [ref=e47]
          - generic [ref=e48]: Sample
        - generic [ref=e49]:
          - paragraph [ref=e50]: Your favorite meal combinations
          - generic [ref=e51]:
            - generic [ref=e52]: Saved
            - generic [ref=e53]: "12"
  - navigation [ref=e54]:
    - link "Meal Plan" [ref=e55] [cursor=pointer]:
      - /url: javascript:void(0)
    - link "Workouts" [ref=e61] [cursor=pointer]:
      - /url: javascript:void(0)
    - link "Schedule" [ref=e68] [cursor=pointer]:
      - /url: javascript:void(0)
    - link "Settings" [ref=e73] [cursor=pointer]:
      - /url: javascript:void(0)
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
  33  |     await expect(pageNameContainer).toBeVisible();
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
> 88  |     expect(mealPlanScroll).toBeGreaterThan(0);
      |                            ^ Error: expect(received).toBeGreaterThan(expected)
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
  134 |     const prevHTML = await prevBtn.innerHTML();
  135 |     const nextHTML = await nextBtn.innerHTML();
  136 |     console.log('Prev button HTML:', prevHTML);
  137 |     console.log('Next button HTML:', nextHTML);
  138 |     
  139 |     // Should have 0 active left chevrons (so 1 greyed), 2 active right chevrons
  140 |     const leftChevrons = await prevBtn.locator('.chevron').count();
  141 |     const rightChevrons = await nextBtn.locator('.chevron').count();
  142 |     
  143 |     console.log('Left chevrons:', leftChevrons, 'Right chevrons:', rightChevrons);
  144 |     
  145 |     // If no chevrons, navigation isn't initialized
  146 |     if (leftChevrons === 0 && rightChevrons === 0) {
  147 |       console.log('WARNING: No chevrons found - navigation may not be initialized');
  148 |     } else {
  149 |       expect(leftChevrons).toBeGreaterThan(0); // Should have at least one
  150 |       expect(rightChevrons).toBeGreaterThan(0); // Should have at least one
  151 |     }
  152 |     
  153 |     await context.close();
  154 |   });
  155 | 
  156 |   test('should have no blur effects', async ({ browser }) => {
  157 |     const context = await browser.newContext({
  158 |       serviceWorkers: 'block',
  159 |     });
  160 |     const page = await context.newPage();
  161 |     
  162 |     await page.goto('https://satellitesushi.github.io/fitness-app/');
  163 |     await page.waitForLoadState('networkidle');
  164 |     
  165 |     // Check header has no backdrop-filter
  166 |     const header = page.locator('.header');
  167 |     const headerBackdrop = await header.evaluate(el => {
  168 |       const style = window.getComputedStyle(el);
  169 |       return style.backdropFilter || style.webkitBackdropFilter;
  170 |     });
  171 |     console.log('Header backdrop-filter:', headerBackdrop);
  172 |     expect(headerBackdrop).toBe('none');
  173 |     
  174 |     // Check cards have no backdrop-filter
  175 |     const card = page.locator('.card').first();
  176 |     const cardBackdrop = await card.evaluate(el => {
  177 |       const style = window.getComputedStyle(el);
  178 |       return style.backdropFilter || style.webkitBackdropFilter;
  179 |     });
  180 |     console.log('Card backdrop-filter:', cardBackdrop);
  181 |     expect(cardBackdrop).toBe('none');
  182 |     
  183 |     await context.close();
  184 |   });
  185 | 
  186 |   test('should have arrows close to page name', async ({ browser }) => {
  187 |     const context = await browser.newContext({
  188 |       serviceWorkers: 'block',
```