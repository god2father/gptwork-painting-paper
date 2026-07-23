// @vitest-environment jsdom

import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from '@vue/server-renderer'
import { beforeAll, describe, expect, it } from 'vitest'
import App from './App.vue'

describe('painting switcher', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    })
  })

  it('offers all paintings and marks the initial selection', async () => {
    const app = createSSRApp(App)
    app.use(createPinia())
    const html = await renderToString(app)
    expect(html).toContain('page-shell--opening')
    expect(html).toContain('data-opening="true"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('aria-label="切换世界名画"')
    expect(html).toContain('播放刀剑出鞘声并开始开场动画')
    expect(html).toContain('轻触启封')
    expect(html).toContain('戴珍珠耳环的少女')
    expect(html).toContain('阿尔诺芬妮夫妇像')
    expect(html).toContain('神奈川冲浪里')
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('aria-pressed="false"')
  })
})
