import { createSSRApp, h } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import rawScene from '../../../manifests/paintings/painting-01.json'
import { validatePaintingScene } from '../../lib/scene/painting'
import LayeredStage from './LayeredStage.vue'

describe('LayeredStage', () => {
  it('renders the background and 12 keyboard-reachable layers', async () => {
    const app = createSSRApp({ render: () => h(LayeredStage, { scene: validatePaintingScene(rawScene) }) })
    app.use(createPinia())
    const html = await renderToString(app)
    expect(html).toContain('深绿黑色纸张背景')
    expect(html.match(/data-layer-id=/g)).toHaveLength(12)
    expect(html).toContain('查看图层：眼睛与眉部')
  })
})
