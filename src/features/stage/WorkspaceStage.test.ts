import { createSSRApp, h } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import rawScene from '../../../manifests/paintings/painting-01.json'
import { validatePaintingScene } from '../../lib/scene/painting'
import WorkspaceStage from './WorkspaceStage.vue'

describe('WorkspaceStage', () => {
  it('renders one overhead atelier instead of a three-column viewer', async () => {
    const app = createSSRApp({ render: () => h(WorkspaceStage, { scene: validatePaintingScene(rawScene), assembled: false }) })
    app.use(createPinia())
    const html = await renderToString(app)
    expect(html).toContain('暖色木桌上的纸张、铅笔和裁切工具')
    expect(html).toContain('atelier__painting-transition')
    expect(html).toContain('data-motion-camera')
    expect(html).toContain('data-motion-frame')
    expect(html).toContain('data-motion-wipe-top')
    expect(html).toContain('data-motion-wipe-bottom')
    expect(html).toContain('data-motion-wipe-top-static')
    expect(html).toContain('data-motion-wipe-bottom-static')
    expect(html).toContain('data-motion-paper-knife')
    expect(html.match(/class="atelier__cut-mark"/g)).toHaveLength(4)
    expect(html).toContain('>紙</b>')
    expect(html.match(/data-layer-id=/g)).toHaveLength(6)
    expect(html.match(/data-testid="portrait-relief-overlay"/g)).toHaveLength(1)
    expect(html).not.toContain('paper-mesh-overlay')
    expect(html.match(/stage-layer__visual/g)).toHaveLength(6)
    expect(html.match(/stage-layer__image/g)).toHaveLength(6)
    expect(html).not.toContain('stage-layer__facet')
    expect(html).toContain('戴珍珠耳环的少女')
    expect(html).toContain('约翰内斯·维米尔')
    expect(html).toContain('Girl with a Pearl Earring')
    expect(html).toContain('PAPER STUDY · 001')
    expect(html).toContain('<details')
    expect(html).toContain('paper-label__seal')
    expect(html).toContain('作品介绍')
    expect(html).toContain('炸开全部图层')
    expect(html).toContain('查看图层：珍珠耳环')
    expect(html).toContain('aria-pressed="false"')
    expect(html).not.toContain('museum-grid')
    expect(html).not.toContain('LAYER INSPECTOR')
  })
})
