import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/gptwork-painting-paper/',
  plugins: [vue()],
  test: {
    environment: 'node',
  },
})
