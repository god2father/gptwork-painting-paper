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
    expect(html).toContain('<details')
    expect(html).toContain('<summary')
    expect(html).toContain('更多控制')
    expect(html).toContain('重新播放拆解动画')
    expect(html).toContain('还原完整作品')
    expect(html).not.toContain('timeline-controls__buttons')
  })
})
