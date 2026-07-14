import { createSSRApp, h } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import TimelineControls from './TimelineControls.vue'

describe('TimelineControls', () => {
  it('renders accessible native controls and progress', async () => {
    const app = createSSRApp({ render: () => h(TimelineControls) })
    app.use(createPinia())
    const html = await renderToString(app)
    expect(html).toContain('aria-label="播放拆解动画"')
    expect(html).toContain('aria-label="拆解进度"')
    expect(html).toContain('type="range"')
    expect(html).toContain('0%')
  })
})
