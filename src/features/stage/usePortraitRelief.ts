import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  FrontSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  WebGLRenderer,
} from 'three'
import { depthToZ } from '../../lib/motion/reliefDepth'
import type { PaintingScene } from '../../types/painting'

interface RotationState {
  x: number
  y: number
}

export function usePortraitRelief() {
  let renderer: WebGLRenderer | null = null
  let camera: PerspectiveCamera | null = null
  let stage: HTMLElement | null = null
  let painting: PaintingScene | null = null
  let group: Group | null = null
  let reliefGeometry: PlaneGeometry | null = null
  let reliefMaterial: MeshStandardMaterial | null = null
  let backingGeometry: BoxGeometry | null = null
  let backingMaterial: MeshStandardMaterial | null = null
  let colorTexture: Texture | null = null
  let depthTexture: Texture | null = null
  let breezeMaskTexture: Texture | null = null
  let depthImage: HTMLImageElement | null = null
  let breezeMaskImage: HTMLImageElement | null = null
  let basePositions: Float32Array | null = null
  let breezeWeights: Float32Array | null = null
  let frame = 0
  let active = false
  let ready = false
  let reducedMotion = false
  const current: RotationState = { x: 0, y: 0 }
  const target: RotationState = { x: 0, y: 0 }
  const scene = new Scene()
  const ambient = new AmbientLight(0xffffff, 0.55)
  const keyLight = new DirectionalLight(0xffffff, 0.9)
  const fillLight = new DirectionalLight(0xffffff, 0.16)

  keyLight.position.set(-180, 220, 360)
  fillLight.position.set(160, -80, 180)
  scene.add(ambient, keyLight, fillLight)

  function configureCamera() {
    if (!stage || !renderer || !camera || !painting) return
    const width = stage.clientWidth
    const height = stage.clientHeight
    const distance = height / (2 * Math.tan(camera.fov * Math.PI / 360))
    camera.aspect = width / height
    camera.position.set(0, 0, distance + painting.relief.depthScale * 0.85)
    camera.near = Math.max(0.1, distance / 100)
    camera.far = distance + 2400
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(width, height, false)
  }

  function disposeModel(disposeTextures = false) {
    if (group) scene.remove(group)
    reliefGeometry?.dispose()
    reliefMaterial?.dispose()
    backingGeometry?.dispose()
    backingMaterial?.dispose()
    group = null
    reliefGeometry = null
    reliefMaterial = null
    backingGeometry = null
    backingMaterial = null
    basePositions = null
    breezeWeights = null
    if (disposeTextures) {
      colorTexture?.dispose()
      depthTexture?.dispose()
      breezeMaskTexture?.dispose()
      colorTexture = null
      depthTexture = null
      breezeMaskTexture = null
      depthImage = null
      breezeMaskImage = null
    }
  }

  function sampleDepth(image: HTMLImageElement): ImageData {
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('relief depth canvas unavailable')
    context.drawImage(image, 0, 0)
    return context.getImageData(0, 0, canvas.width, canvas.height)
  }

  function buildModel() {
    if (!stage || !painting || !colorTexture || !depthImage) return
    disposeModel(false)
    const width = stage.clientWidth
    const height = stage.clientHeight
    const config = painting.relief
    const depth = sampleDepth(depthImage)
    const breezeLayer = painting.layers.find((layer) => layer.ambient?.kind === 'breeze' && layer.ambient.region)
    const breezeMotion = breezeLayer?.ambient
    const breezeMask = breezeMaskImage ? sampleDepth(breezeMaskImage) : null
    reliefGeometry = new PlaneGeometry(width, height, config.segmentsX, config.segmentsY)
    const positions = reliefGeometry.attributes.position
    const uvs = reliefGeometry.attributes.uv
    breezeWeights = new Float32Array(positions.count)
    for (let index = 0; index < positions.count; index += 1) {
      const pixelX = Math.round(uvs.getX(index) * (depth.width - 1))
      const pixelY = Math.round((1 - uvs.getY(index)) * (depth.height - 1))
      const grayscale = depth.data[(pixelY * depth.width + pixelX) * 4]
      positions.setZ(index, depthToZ(grayscale, config.depthScale))
      if (breezeMask && breezeMotion?.region) {
        const maskX = Math.round(uvs.getX(index) * (breezeMask.width - 1))
        const maskY = Math.round((1 - uvs.getY(index)) * (breezeMask.height - 1))
        const percentX = maskX / (breezeMask.width - 1) * 100
        const percentY = maskY / (breezeMask.height - 1) * 100
        const region = breezeMotion.region
        if (percentX >= region.x && percentX <= region.x + region.width
          && percentY >= region.y && percentY <= region.y + region.height) {
          const alpha = breezeMask.data[(maskY * breezeMask.width + maskX) * 4 + 3] / 255
          const progress = (percentY - region.y) / region.height
          const falloff = progress * progress * (3 - 2 * progress)
          breezeWeights[index] = alpha * falloff
        }
      }
    }
    positions.needsUpdate = true
    basePositions = new Float32Array(positions.array as ArrayLike<number>)
    reliefGeometry.computeVertexNormals()
    reliefMaterial = new MeshStandardMaterial({
      map: colorTexture,
      emissive: new Color('#ffffff'),
      emissiveMap: colorTexture,
      emissiveIntensity: 0.58,
      roughness: 0.84,
      metalness: 0,
      side: FrontSide,
    })
    const relief = new Mesh(reliefGeometry, reliefMaterial)
    relief.position.z = 4

    backingGeometry = new BoxGeometry(width, height, 12)
    backingMaterial = new MeshStandardMaterial({
      color: new Color('#18201d'),
      roughness: 0.96,
      metalness: 0,
    })
    const backing = new Mesh(backingGeometry, backingMaterial)
    backing.position.z = -7

    group = new Group()
    group.add(backing, relief)
    scene.add(group)
    ready = true
    render()
  }

  function resetBreeze() {
    if (!reliefGeometry || !basePositions) return
    reliefGeometry.attributes.position.array.set(basePositions)
    reliefGeometry.attributes.position.needsUpdate = true
    reliefGeometry.computeVertexNormals()
  }

  function updateBreeze(time: number) {
    if (!active || reducedMotion || !painting || !reliefGeometry || !basePositions || !breezeWeights) return
    const motion = painting.layers.find((layer) => layer.ambient?.kind === 'breeze' && layer.ambient.region)?.ambient
    if (!motion?.region) return
    const positions = reliefGeometry.attributes.position
    const uvs = reliefGeometry.attributes.uv
    const phase = time / 1000 * Math.PI * 2 / motion.duration + motion.delay
    for (let index = 0; index < positions.count; index += 1) {
      const weight = breezeWeights[index]
      if (weight <= 0) continue
      const wave = phase + (1 - uvs.getY(index)) * 1.15
      const offset = index * 3
      positions.setXYZ(
        index,
        basePositions[offset] + Math.sin(wave) * motion.x * weight,
        basePositions[offset + 1] + Math.cos(wave * .82) * motion.y * weight,
        basePositions[offset + 2] + Math.sin(wave + .9) * motion.rotation * 2.4 * weight,
      )
    }
    positions.needsUpdate = true
    reliefGeometry.computeVertexNormals()
  }

  function render() {
    if (!renderer || !camera) return
    updateBreeze(performance.now())
    if (group) {
      group.rotation.x = current.x
      group.rotation.y = current.y
    }
    keyLight.position.x = -180 + current.y * 1800
    keyLight.position.y = 220 - current.x * 1200
    renderer.render(scene, camera)
  }

  function startFrame() {
    if (!frame && active && ready && !document.hidden) frame = requestAnimationFrame(step)
  }

  function step() {
    frame = 0
    if (!active || !painting) return
    const damping = painting.relief.damping
    current.x += (target.x - current.x) * damping
    current.y += (target.y - current.y) * damping
    render()
    const moving = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > 0.0001
    const breezeMoving = painting.layers.some((layer) => layer.ambient?.kind === 'breeze' && layer.ambient.region)
    if ((moving || breezeMoving) && !reducedMotion) startFrame()
  }

  function mount(canvas: HTMLCanvasElement, stageElement: HTMLElement, sceneConfig: PaintingScene): boolean {
    stage = stageElement
    painting = sceneConfig
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true })
      renderer.setClearColor(0x000000, 0)
      camera = new PerspectiveCamera(35, 1, 0.1, 3000)
      configureCamera()
      document.addEventListener('visibilitychange', resume)
      return true
    } catch {
      renderer = null
      camera = null
      return false
    }
  }

  async function load(colorUrl: string, depthUrl: string, breezeMaskUrl?: string): Promise<boolean> {
    if (!renderer) return false
    disposeModel(true)
    ready = false
    try {
      const [loadedColor, loadedDepth, loadedBreezeMask] = await Promise.all([
        new TextureLoader().loadAsync(colorUrl),
        new TextureLoader().loadAsync(depthUrl),
        breezeMaskUrl ? new TextureLoader().loadAsync(breezeMaskUrl) : Promise.resolve(null),
      ])
      loadedColor.colorSpace = SRGBColorSpace
      colorTexture = loadedColor
      depthTexture = loadedDepth
      breezeMaskTexture = loadedBreezeMask
      depthImage = loadedDepth.image as HTMLImageElement
      breezeMaskImage = loadedBreezeMask?.image as HTMLImageElement | null
      buildModel()
      return ready
    } catch {
      disposeModel(true)
      return false
    }
  }

  function setActive(nextActive: boolean) {
    active = nextActive
    if (!active) {
      target.x = 0
      target.y = 0
      current.x = 0
      current.y = 0
      resetBreeze()
      render()
      return
    }
    render()
    if (!reducedMotion) startFrame()
  }

  function updatePointer(x: number, y: number) {
    if (!painting || reducedMotion) return
    target.x = -Math.min(1, Math.max(-1, y)) * painting.relief.tiltX * Math.PI / 180
    target.y = Math.min(1, Math.max(-1, x)) * painting.relief.tiltY * Math.PI / 180
    startFrame()
  }

  function resize() {
    configureCamera()
    if (depthImage && colorTexture) buildModel()
    render()
  }

  function resume() {
    if (!document.hidden && active) startFrame()
  }

  function dispose() {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    disposeModel(true)
    renderer?.dispose()
    renderer = null
    camera = null
    stage = null
    painting = null
    document.removeEventListener('visibilitychange', resume)
  }

  return { mount, load, setActive, updatePointer, resize, dispose }
}
