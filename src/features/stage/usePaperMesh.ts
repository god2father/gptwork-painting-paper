import {
  AmbientLight,
  BackSide,
  Color,
  DirectionalLight,
  FrontSide,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  WebGLRenderer,
} from 'three'
import { deformPaperVertex } from '../../lib/motion/paperDeformation'
import type { PaintingLayer, PaintingScene } from '../../types/painting'

interface MotionState {
  bend: number
  twist: number
}

const backVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const backFragmentShader = `
  uniform sampler2D alphaTexture;
  uniform vec3 paperColor;
  varying vec2 vUv;
  void main() {
    float alpha = texture2D(alphaTexture, vUv).a;
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(paperColor, alpha);
  }
`

export function usePaperMesh() {
  let renderer: WebGLRenderer | null = null
  let stage: HTMLElement | null = null
  let painting: PaintingScene | null = null
  let camera: PerspectiveCamera | null = null
  let front: Mesh | null = null
  let back: Mesh | null = null
  let geometry: PlaneGeometry | null = null
  let frontMaterial: MeshStandardMaterial | null = null
  let backMaterial: ShaderMaterial | null = null
  let texture: Texture | null = null
  let layer: PaintingLayer | null = null
  let originalPositions: Float32Array | null = null
  let planeWidth = 0
  let planeHeight = 0
  let frame = 0
  let selectionVersion = 0
  let clearing = false
  const scene = new Scene()
  const ambient = new AmbientLight(0xfff3df, 1.65)
  const directional = new DirectionalLight(0xffe2b8, 2.35)
  const current: MotionState = { bend: 0.65, twist: 0 }
  const target: MotionState = { bend: 0.65, twist: 0 }

  directional.position.set(-180, 220, 360)
  scene.add(ambient, directional)

  function configureCamera() {
    if (!stage || !renderer || !camera) return
    const width = stage.clientWidth
    const height = stage.clientHeight
    const distance = height / (2 * Math.tan(camera.fov * Math.PI / 360))
    camera.aspect = width / height
    camera.position.set(0, 0, distance)
    camera.near = Math.max(0.1, distance / 100)
    camera.far = distance + 2400
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(width, height, false)
  }

  function disposeMesh(disposeTexture = true) {
    if (front) scene.remove(front)
    if (back) scene.remove(back)
    geometry?.dispose()
    frontMaterial?.dispose()
    backMaterial?.dispose()
    if (disposeTexture) texture?.dispose()
    front = null
    back = null
    geometry = null
    frontMaterial = null
    backMaterial = null
    originalPositions = null
    if (disposeTexture) texture = null
  }

  function buildMesh() {
    if (!stage || !painting || !layer || !texture) return
    disposeMesh(false)
    const scaleX = stage.clientWidth / painting.canvas.width
    const scaleY = stage.clientHeight / painting.canvas.height
    planeWidth = layer.bounds.width * scaleX
    planeHeight = layer.bounds.height * scaleY
    geometry = new PlaneGeometry(
      planeWidth,
      planeHeight,
      layer.selection3d.mesh.segmentsX,
      layer.selection3d.mesh.segmentsY,
    )
    originalPositions = new Float32Array(geometry.attributes.position.array)
    texture.repeat.set(
      layer.bounds.width / painting.canvas.width,
      layer.bounds.height / painting.canvas.height,
    )
    texture.offset.set(
      layer.bounds.x / painting.canvas.width,
      1 - (layer.bounds.y + layer.bounds.height) / painting.canvas.height,
    )
    texture.needsUpdate = true

    frontMaterial = new MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.02,
      roughness: 0.9,
      metalness: 0,
      side: FrontSide,
    })
    backMaterial = new ShaderMaterial({
      uniforms: {
        alphaTexture: { value: texture },
        paperColor: { value: new Color('#e3d3b8') },
      },
      vertexShader: backVertexShader,
      fragmentShader: backFragmentShader,
      transparent: true,
      side: BackSide,
    })
    front = new Mesh(geometry, frontMaterial)
    back = new Mesh(geometry, backMaterial)
    const x = (layer.bounds.x + layer.bounds.width / 2) * scaleX - stage.clientWidth / 2
    const y = stage.clientHeight / 2 - (layer.bounds.y + layer.bounds.height / 2) * scaleY
    front.position.set(x, y, 0)
    back.position.copy(front.position)
    front.renderOrder = 2
    back.renderOrder = 1
    scene.add(back, front)
    updateGeometry()
  }

  function updateGeometry() {
    if (!geometry || !originalPositions || !layer) return
    const positions = geometry.attributes.position
    for (let index = 0; index < positions.count; index += 1) {
      const offset = index * 3
      const next = deformPaperVertex(
        {
          x: originalPositions[offset],
          y: originalPositions[offset + 1],
          z: originalPositions[offset + 2],
        },
        { width: planeWidth, height: planeHeight },
        current,
        layer.selection3d.mesh,
      )
      positions.setXYZ(index, next.x, next.y, next.z)
    }
    positions.needsUpdate = true
    geometry.computeVertexNormals()
  }

  function render() {
    if (!renderer || !camera) return
    directional.position.x = -180 + current.twist * 140
    const offset = 4 + current.bend * 13
    const blur = 6 + current.bend * 12
    renderer.domElement.style.filter = `drop-shadow(${offset}px ${offset}px ${blur}px rgba(25, 14, 7, 0.46))`
    renderer.render(scene, camera)
  }

  function startFrame() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(step)
  }

  function step() {
    frame = 0
    if (!layer) return
    const damping = layer.selection3d.mesh.damping
    current.bend += (target.bend - current.bend) * damping
    current.twist += (target.twist - current.twist) * damping
    updateGeometry()
    render()
    const moving = Math.abs(target.bend - current.bend) + Math.abs(target.twist - current.twist) > 0.001
    if (clearing && !moving) {
      disposeMesh()
      layer = null
      clearing = false
      renderer?.clear()
      return
    }
    if (moving) startFrame()
  }

  function mount(canvas: HTMLCanvasElement, stageElement: HTMLElement, sceneConfig: PaintingScene): boolean {
    stage = stageElement
    painting = sceneConfig
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
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

  async function select(nextLayer: PaintingLayer, url: string): Promise<boolean> {
    const version = ++selectionVersion
    if (!renderer) return false
    disposeMesh()
    layer = nextLayer
    clearing = false
    current.bend = 0.2
    current.twist = 0
    target.bend = 0.68
    target.twist = 0
    try {
      const loaded = await new TextureLoader().loadAsync(url)
      if (version !== selectionVersion || layer?.id !== nextLayer.id) {
        loaded.dispose()
        return false
      }
      loaded.colorSpace = SRGBColorSpace
      texture = loaded
      buildMesh()
      startFrame()
      return true
    } catch {
      if (version === selectionVersion) {
        disposeMesh()
        layer = null
      }
      return false
    }
  }

  function updatePointer(x: number, y: number) {
    if (!layer || clearing) return
    target.twist = Math.min(1, Math.max(-1, x))
    target.bend = Math.min(1, Math.max(0.25, (1 - y) / 2))
    startFrame()
  }

  function clear(immediate = false) {
    selectionVersion += 1
    if (!layer || immediate) {
      disposeMesh()
      layer = null
      renderer?.clear()
      return
    }
    clearing = true
    target.bend = 0
    target.twist = 0
    startFrame()
  }

  function resize() {
    configureCamera()
    if (layer && texture) buildMesh()
    render()
  }

  function resume() {
    if (!document.hidden && layer) startFrame()
  }

  function dispose() {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    selectionVersion += 1
    disposeMesh()
    renderer?.dispose()
    renderer = null
    camera = null
    layer = null
    stage = null
    painting = null
    document.removeEventListener('visibilitychange', resume)
  }

  return { mount, select, updatePointer, clear, resize, dispose }
}
