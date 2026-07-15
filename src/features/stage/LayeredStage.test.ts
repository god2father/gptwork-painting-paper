import { createSSRApp, h } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import rawScene from '../../../manifests/paintings/painting-01.json'
import { validatePaintingScene } from '../../lib/scene/painting'
import LayeredStage from './LayeredStage.vue'
import StageLayer from './StageLayer.vue'

describe('LayeredStage', () => {
  it('renders the background and six keyboard-reachable semantic layers', async () => {
    const app = createSSRApp({ render: () => h(LayeredStage, { scene: validatePaintingScene(rawScene), assembled: true }) })
    app.use(createPinia())
    const html = await renderToString(app)
    expect(html).toContain('深绿黑色纸张背景')
    expect(html.match(/data-layer-id=/g)).toHaveLength(6)
    expect(html).toContain('查看图层：回望的双眼')
    expect(html).toContain('data-relief-active="true"')
  })

  it('keeps the selected layer button accessible while its WebGL mesh is active', async () => {
    const scene = validatePaintingScene(rawScene)
    const app = createSSRApp({
      render: () => h(StageLayer, {
        layer: scene.layers[0]!,
        canvas: scene.canvas,
        selected: true,
      }),
    })
    const html = await renderToString(app)
    expect(html).not.toContain('stage-layer--mesh-active')
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain(`aria-label="查看图层：${scene.layers[0]!.name}"`)
    expect(html.match(/stage-layer__image/g)).toHaveLength(1)
  })
})
