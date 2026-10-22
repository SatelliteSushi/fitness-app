const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'webkit',
      use: { 
        ...devices['iPhone 14'],
        browserName: 'webkit',
        hasTouch: true,
      },
    },
  ],
});
