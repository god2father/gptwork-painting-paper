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
  let depthImage: HTMLImageElement | null = null
  let frame = 0
  let active = false
  let ready = false
  let reducedMotion = false
  const current: RotationState = { x: 0, y: 0 }
  const target: RotationState = { x: 0, y: 0 }
  const scene = new Scene()
  const ambient = new AmbientLight(0xfff2de, 1.35)
  const keyLight = new DirectionalLight(0xffdfb0, 2.8)
  const fillLight = new DirectionalLight(0x7f9bb5, 0.48)

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
    if (disposeTextures) {
      colorTexture?.dispose()
      depthTexture?.dispose()
      colorTexture = null
      depthTexture = null
      depthImage = null
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
    reliefGeometry = new PlaneGeometry(width, height, config.segmentsX, config.segmentsY)
    const positions = reliefGeometry.attributes.position
    const uvs = reliefGeometry.attributes.uv
    for (let index = 0; index < positions.count; index += 1) {
      const pixelX = Math.round(uvs.getX(index) * (depth.width - 1))
      const pixelY = Math.round((1 - uvs.getY(index)) * (depth.height - 1))
      const grayscale = depth.data[(pixelY * depth.width + pixelX) * 4]
      positions.setZ(index, depthToZ(grayscale, config.depthScale))
    }
    positions.needsUpdate = true
    reliefGeometry.computeVertexNormals()
    reliefMaterial = new MeshStandardMaterial({
      map: colorTexture,
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

  function render() {
    if (!renderer || !camera) return
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
    if (moving && !reducedMotion) startFrame()
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

  async function load(colorUrl: string, depthUrl: string): Promise<boolean> {
    if (!renderer) return false
    disposeModel(true)
    ready = false
    try {
      const [loadedColor, loadedDepth] = await Promise.all([
        new TextureLoader().loadAsync(colorUrl),
        new TextureLoader().loadAsync(depthUrl),
      ])
      loadedColor.colorSpace = SRGBColorSpace
      colorTexture = loadedColor
      depthTexture = loadedDepth
      depthImage = loadedDepth.image as HTMLImageElement
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
