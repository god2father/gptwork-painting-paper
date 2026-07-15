export interface Size {
  width: number
  height: number
}

export interface LayerTransform {
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number
}

export interface DepthTransform extends LayerTransform {
  z: number
}

export interface SceneChapter {
  id: 'reveal' | 'arrival' | 'focus' | 'layers' | 'observe'
  start: number
  end: number
}

export interface EnvironmentAsset {
  src: string
  alt: string
}

export interface ReliefConfig {
  colorMap: string
  depthMap: string
  segmentsX: number
  segmentsY: number
  depthScale: number
  tiltX: number
  tiltY: number
  damping: number
  transitionDuration: number
}

export interface SelectionTransform3D {
  z: number
  rotateX: number
  rotateY: number
  scale: number
  foldAngle: number
  mesh: PaperMeshConfig
}

export interface PaperMeshConfig {
  segmentsX: number
  segmentsY: number
  maxBend: number
  maxLift: number
  maxTwist: number
  damping: number
}

export interface AssemblyMotion {
  start: number
  duration: number
  from: {
    x: number
    y: number
    rotation: number
    scale: number
  }
  via: {
    x: number
    y: number
  }
  ease: string
}

export interface AmbientMotion {
  kind: 'breeze' | 'sparkle'
  x: number
  y: number
  rotation: number
  duration: number
  delay: number
  anchor?: {
    x: number
    y: number
  }
  region?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface AmbientHighlight {
  x: number
  y: number
  size: number
  duration: number
  delay: number
  parallax: {
    x: number
    y: number
  }
}

export interface ArchiveConfig {
  artist: string
  year: string
  englishTitle: string
  accession: string
  paperColor: string
  stampColor: string
  inkColor: string
}

export interface PaintingLayer {
  id: string
  name: string
  src: string
  alt: string
  description: string
  z: number
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  collapsed: DepthTransform
  expanded: DepthTransform
  shadow: number
  selection3d: SelectionTransform3D
  assembly: AssemblyMotion
  ambient?: AmbientMotion
  animation: {
    start: number
    duration: number
    ease: string
  }
  parallax: {
    x: number
    y: number
  }
}

export interface PaintingScene {
  id: string
  title: string
  subtitle: string
  introduction: string
  duration: number
  archive: ArchiveConfig
  ambientHighlight?: AmbientHighlight
  canvas: Size
  background: {
    src: string
    alt: string
  }
  relief: ReliefConfig
  environment: {
    workspace: EnvironmentAsset
  }
  camera: {
    collapsed: DepthTransform
    focused: DepthTransform
  }
  chapters: SceneChapter[]
  layers: PaintingLayer[]
}
