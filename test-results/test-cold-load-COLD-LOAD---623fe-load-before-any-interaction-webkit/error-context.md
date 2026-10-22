# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-cold-load.spec.js >> COLD LOAD - page titles must render on first load before any interaction
- Location: test-cold-load.spec.js:8:1

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
  - main [ref=e5]:
    - generic [ref=e7]:
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]:
            - heading "Breakfast" [level=2] [ref=e12]
            - generic [ref=e13]: Sample
          - generic [ref=e14]:
            - paragraph [ref=e15]: Start your day with balanced nutrition
            - generic [ref=e16]:
              - generic [ref=e17]: Calories
              - generic [ref=e18]: "450"
            - generic [ref=e19]:
              - generic [ref=e20]: Protein
              - generic [ref=e21]: 25g
        - generic [ref=e22]:
          - generic [ref=e23]:
            - heading "Lunch" [level=2] [ref=e24]
            - generic [ref=e25]: Sample
          - generic [ref=e26]:
            - paragraph [ref=e27]: Midday fuel for sustained energy
            - generic [ref=e28]:
              - generic [ref=e29]: Calories
              - generic [ref=e30]: "680"
      - generic [ref=e33]:
        - generic [ref=e34]:
          - heading "Create Meal" [level=2] [ref=e35]
          - generic [ref=e36]: Sample
        - generic [ref=e37]:
          - paragraph [ref=e38]: Build custom meals to fit your macros
          - generic [ref=e39]:
            - generic [ref=e40]: Recipes
            - generic [ref=e41]: 120+
      - generic [ref=e44]:
        - generic [ref=e45]:
          - heading "Saved Meals" [level=2] [ref=e46]
          - generic [ref=e47]: Sample
        - generic [ref=e48]:
          - paragraph [ref=e49]: Your favorite meal combinations
          - generic [ref=e50]:
            - generic [ref=e51]: Saved
            - generic [ref=e52]: "12"
  - navigation [ref=e53]:
    - link "Meal Plan" [ref=e54] [cursor=pointer]:
      - /url: javascript:void(0)
    - link "Workouts" [ref=e60] [cursor=pointer]:
      - /url: javascript:void(0)
    - link "Schedule" [ref=e67] [cursor=pointer]:
      - /url: javascript:void(0)
    - link "Settings" [ref=e72] [cursor=pointer]:
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
  8   | test('COLD LOAD - page titles must render on first load before any interaction', async ({ browser }) => {
  9   |   const context = await browser.newContext({
  10  |     serviceWorkers: 'block',
  11  |   });
  12  |   const page = await context.newPage();
  13  |   
  14  |   // Capture console logs
  15  |   const logs = [];
  16  |   page.on('console', msg => {
  17  |     logs.push(`${msg.type()}: ${msg.text()}`);
  18  |   });
  19  |   
  20  |   // Force cold load with cache-busting
  21  |   const timestamp = Date.now();
  22  |   await page.goto(`https://satellitesushi.github.io/fitness-app/?nocache=${timestamp}`, {
  23  |     waitUntil: 'load',
  24  |   });
  25  |   
  26  |   // Wait a moment for initialization
  27  |   await page.waitForTimeout(1000);
  28  |   
  29  |   console.log('\n=== COLD LOAD TEST - NO INTERACTION YET ===');
  30  |   console.log('Console logs:');
  31  |   logs.forEach(log => console.log('  ' + log));
  32  |   
  33  |   // Check page titles BEFORE any interaction
  34  |   const titlesRow = await page.locator('#pageTitlesRow');
  35  |   const isVisible = await titlesRow.isVisible();
  36  |   console.log(`\nTitles row visible: ${isVisible}`);
  37  |   
  38  |   const titleCount = await page.locator('.page-title-item').count();
  39  |   console.log(`Page title count: ${titleCount}`);
  40  |   
  41  |   const innerHTML = await titlesRow.innerHTML();
  42  |   console.log(`Titles row HTML (first 200 chars): ${innerHTML.substring(0, 200)}`);
  43  |   
  44  |   // Take screenshot BEFORE any interaction
  45  |   await page.screenshot({ 
  46  |     path: '/workspace/cold-load-proof.png', 
  47  |     fullPage: false 
  48  |   });
  49  |   console.log('\n✓ Screenshot saved to cold-load-proof.png');
  50  |   
  51  |   // Verify titles exist
> 52  |   expect(titleCount).toBeGreaterThan(0);
      |                      ^ Error: expect(received).toBeGreaterThan(expected)
  53  |   
  54  |   // Verify they're visible
  55  |   const firstTitle = page.locator('.page-title-item').first();
  56  |   await expect(firstTitle).toBeVisible();
  57  |   
  58  |   // Check opacity
  59  |   const opacity = await firstTitle.evaluate(el => window.getComputedStyle(el).opacity);
  60  |   console.log(`First title opacity: ${opacity}`);
  61  |   expect(parseFloat(opacity)).toBeGreaterThan(0.9);
  62  |   
  63  |   // Get all title texts
  64  |   const titles = await page.locator('.page-title-item').allTextContents();
  65  |   console.log(`Title texts: ${titles.join(', ')}`);
  66  |   expect(titles).toEqual(["Today's Meals", "Meal Builder", "My Meals"]);
  67  |   
  68  |   console.log('\n=== COLD LOAD SUCCESSFUL ===');
  69  |   
  70  |   await context.close();
  71  | });
  72  | 
  73  | test('focused title is ALWAYS centered, even for first/last pages', async ({ browser }) => {
  74  |   const context = await browser.newContext({
  75  |     serviceWorkers: 'block',
  76  |   });
  77  |   const page = await context.newPage();
  78  |   
  79  |   const timestamp = Date.now();
  80  |   await page.goto(`https://satellitesushi.github.io/fitness-app/?nocache=${timestamp}`, {
  81  |     waitUntil: 'load',
  82  |   });
  83  |   
  84  |   await page.waitForTimeout(1000);
  85  |   
  86  |   console.log('\n=== CENTERING TEST ===');
  87  |   
  88  |   // Get the first title position (should be centered)
  89  |   const firstTitle = page.locator('.page-title-item').first();
  90  |   const firstBox = await firstTitle.boundingBox();
  91  |   const viewportWidth = page.viewportSize().width;
  92  |   const firstTitleCenter = firstBox.x + firstBox.width / 2;
  93  |   
  94  |   console.log(`Viewport width: ${viewportWidth}`);
  95  |   console.log(`First title center X: ${firstTitleCenter}`);
  96  |   console.log(`Distance from screen center: ${Math.abs(firstTitleCenter - viewportWidth / 2)}px`);
  97  |   
  98  |   // Should be centered (within 5px tolerance)
  99  |   expect(Math.abs(firstTitleCenter - viewportWidth / 2)).toBeLessThan(5);
  100 |   
  101 |   // Click last title
  102 |   const lastTitle = page.locator('.page-title-item').last();
  103 |   await lastTitle.click();
  104 |   await page.waitForTimeout(500);
  105 |   
  106 |   // Check last title is also centered
  107 |   const lastBox = await lastTitle.boundingBox();
  108 |   const lastTitleCenter = lastBox.x + lastBox.width / 2;
  109 |   
  110 |   console.log(`Last title center X: ${lastTitleCenter}`);
  111 |   console.log(`Distance from screen center: ${Math.abs(lastTitleCenter - viewportWidth / 2)}px`);
  112 |   
  113 |   expect(Math.abs(lastTitleCenter - viewportWidth / 2)).toBeLessThan(5);
  114 |   
  115 |   // Take screenshot showing last page centered
  116 |   await page.screenshot({ 
  117 |     path: '/workspace/last-page-centered.png', 
  118 |     fullPage: false 
  119 |   });
  120 |   console.log('Screenshot saved to last-page-centered.png');
  121 |   
  122 |   await context.close();
  123 | });
  124 | 
```