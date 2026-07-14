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

export interface PaintingLayer {
  id: string
  name: string
  src: string
  alt: string
  description: string
  z: number
  collapsed: LayerTransform
  expanded: LayerTransform
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
  layers: PaintingLayer[]
}
