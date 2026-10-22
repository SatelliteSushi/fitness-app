# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-debug.spec.js >> debug page initialization
- Location: test-debug.spec.js:8:1

# Error details

```
Test timeout of 30000ms exceeded.
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