# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-webkit.spec.js >> PWA UI Fixes - iPhone 14 WebKit >> should show correct chevron counts
- Location: test-webkit.spec.js:139:3

# Error details

```
Test timeout of 30000ms exceeded.
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