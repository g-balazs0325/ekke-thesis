import { CanvasTexture, Material, Texture, Vector2 } from 'three'
import Selector from './selectors/Selector'
import FaceData from './datastructures/FaceData'

export type TextureOfMaterial<T extends Material> = {
  [K in keyof T]: T[K] extends Texture ? K : never
}[keyof T]

export default abstract class Painter {
  private cachedFaces: FaceData[] = null
  private texturesNeedingUpdate: Set<CanvasTexture> = new Set<CanvasTexture>()

  private selector: Selector
  getSelector(): Selector {
    return this.selector
  }
  setSelector(value: Selector): void {
    this.selector = value
  }

  constructor(selector: Selector) {
    this.selector = selector
  }

  protected markTextureForUpdate(texture: CanvasTexture): void {
    this.checkBegin()

    if (!this.texturesNeedingUpdate.has(texture)) this.texturesNeedingUpdate.add(texture)
  }

  beginPainting(clientPosition: Vector2): void {
    if (this.cachedFaces)
      throw new PainterError('Painter was trying to begin while not in closed state.')
    this.cachedFaces = this.selector.selectFaces(clientPosition)
  }

  endPainting(): void {
    if (!this.cachedFaces)
      throw new PainterError('Painter was trying to close while in closed state.')

    this.texturesNeedingUpdate.forEach((texture) => {
      texture.needsUpdate = true
    })
    this.texturesNeedingUpdate.clear()

    this.cachedFaces = null
  }

  paint<T extends Material>(textureKey: TextureOfMaterial<T>): void {
    this.checkBegin()
    this.doPaint(this.getFacesWithCanvasTexture(textureKey), textureKey)
  }
  protected abstract doPaint<T extends Material>(
    faces: FaceData[],
    textureKey: TextureOfMaterial<T>
  ): void

  private checkBegin(): void {
    if (!this.cachedFaces)
      throw new PainterError('Painter needs to begin painting before calling this method.')
  }

  private getFacesWithCanvasTexture<T extends Material>(
    textureKey: TextureOfMaterial<T>
  ): FaceData[] {
    return this.cachedFaces.filter((face) => {
      const material = face.material as T
      if (!material) return false
      const texture = material[textureKey] as CanvasTexture
      if (!texture) return false

      return texture.image instanceof HTMLCanvasElement
    })
  }
}

class PainterError extends Error {
  constructor(message?: string) {
    super(message)
  }
}
