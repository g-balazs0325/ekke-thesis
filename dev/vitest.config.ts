import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    browser: {
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
      viewport: {
        width: 800,
        height: 600
      }
    },
    setupFiles: './src/test/vitest.setup.ts'
  }
})
