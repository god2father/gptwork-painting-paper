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
        exploded: true,
      }),
    })
    const html = await renderToString(app)
    expect(html).not.toContain('stage-layer--mesh-active')
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain(`aria-label="查看图层：${scene.layers[0]!.name}"`)
    expect(html).toContain('stage-layer--exploded')
    expect(html).toContain('--explode-x')
    expect(html.match(/stage-layer__image/g)).toHaveLength(1)
  })

  it('renders the pearl earring as its own sparkling button', async () => {
    const scene = validatePaintingScene(rawScene)
    const pearl = scene.layers.find((layer) => layer.id === 'layer-006-pearl-highlight')!
    const app = createSSRApp({ render: () => h(StageLayer, { layer: pearl, canvas: scene.canvas, selected: false, ambientActive: true }) })
    const html = await renderToString(app)
    expect(html).toContain('stage-layer--ambient-sparkle')
    expect(html).toContain('stage-layer--ambient-active')
    expect(html).toContain('aria-label="查看图层：珍珠耳环"')
    expect(html).toContain('--ambient-duration')
    expect(html).toContain('--sparkle-left:44%')
    expect(html).toContain('--sparkle-top:63%')
    expect(html).not.toContain('--relief-left')
    expect(html).not.toContain('--relief-top')
  })

  it('marks only the lower ochre tail for mesh-based breeze motion', async () => {
    const scene = validatePaintingScene(rawScene)
    const wrap = scene.layers.find((layer) => layer.id === 'layer-004-yellow-wrap-tail')!
    const app = createSSRApp({ render: () => h(StageLayer, { layer: wrap, canvas: scene.canvas, selected: false, ambientActive: true }) })
    const html = await renderToString(app)
    expect(html).toContain('stage-layer--ambient-mesh')
    expect(html).toContain('--ambient-x:18px')
  })
})
