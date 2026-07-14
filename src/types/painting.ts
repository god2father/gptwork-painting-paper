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

export interface SelectionTransform3D {
  z: number
  rotateX: number
  rotateY: number
  scale: number
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
  duration: number
  canvas: Size
  background: {
    src: string
    alt: string
  }
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
