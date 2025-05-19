import { CanvasTexture, Color, Material } from 'three'
import Painter, { TextureOfMaterial } from './Painter'
import Selector from './selectors/Selector'
import FaceData from './datastructures/FaceData'

export default class FacesPainter extends Painter {
  private color: Color
  setColor(value: Color) {
    this.color = value
  }

  constructor(selector: Selector, color: Color) {
    super(selector)
    this.color = color
  }

  protected doPaint<T extends Material>(faces: FaceData[], textureKey: TextureOfMaterial<T>): void {
    if (faces.length == 0) return
    faces.sort((a, b) => {
      return a.material.id - b.material.id
    })

    let currentMaterial: T = null
    let canvas: HTMLCanvasElement
    let context: CanvasRenderingContext2D
    let texture: CanvasTexture
    for (let i = 0; i < faces.length; i++) {
      const face = faces[i]
      const material = face.material as T

      if (currentMaterial != material) {
        currentMaterial = material
        texture = material[textureKey] as CanvasTexture
        canvas = texture.image as HTMLCanvasElement
        context = canvas.getContext('2d')
      }

      const uvs = [face.a.uv, face.b.uv, face.c.uv]
      const [w, h] = [canvas.width, canvas.height]

      context.strokeStyle = context.fillStyle = `rgb(${this.color.r * 255}, ${
        this.color.g * 255
      }, ${this.color.b * 255})`
      context.lineWidth = 1

      context.beginPath()
      context.moveTo(w * uvs[2].x, h * (1 - uvs[2].y))
      for (let i = 0; i < 3; i++) {
        context.lineTo(w * uvs[i].x, h * (1 - uvs[i].y))
      }
      context.closePath()
      context.fill()
      context.stroke()

      this.markTextureForUpdate(texture)
    }
  }
}
