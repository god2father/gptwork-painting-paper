import { createSSRApp, h } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import rawScene from '../../../manifests/paintings/painting-01.json'
import { validatePaintingScene } from '../../lib/scene/painting'
import WorkspaceStage from './WorkspaceStage.vue'

describe('WorkspaceStage', () => {
  it('renders one overhead atelier instead of a three-column viewer', async () => {
    const app = createSSRApp({ render: () => h(WorkspaceStage, { scene: validatePaintingScene(rawScene) }) })
    app.use(createPinia())
    const html = await renderToString(app)
    expect(html).toContain('暖色木桌上的纸张、铅笔和裁切工具')
    expect(html).toContain('data-motion-camera')
    expect(html).toContain('data-motion-frame')
    expect(html).toContain('data-motion-wipe-top')
    expect(html).toContain('data-motion-wipe-bottom')
    expect(html.match(/data-layer-id=/g)).toHaveLength(6)
    expect(html).toContain('戴珍珠耳环的少女')
    expect(html).not.toContain('museum-grid')
    expect(html).not.toContain('LAYER INSPECTOR')
  })
})
