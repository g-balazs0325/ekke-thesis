import React from 'react'
import { CanvasTexture, ColorRepresentation } from 'three'

interface BlankCanvasTextureProps {
  size: number
  color?: ColorRepresentation
  attach?: string
  textureRef?: React.ForwardedRef<CanvasTexture>
  canvasRef?: React.ForwardedRef<HTMLCanvasElement>
  onInitialize?: (canvas: HTMLCanvasElement, texture: CanvasTexture) => void

  image?: undefined
}

export class BlankCanvasTexture extends React.Component<BlankCanvasTextureProps> {
  public static defaultProps = { color: 'white' }

  private canvas: HTMLCanvasElement
  private texture: CanvasTexture

  constructor(props: BlankCanvasTextureProps) {
    super(props)

    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = props.size
    this.drawCanvasBase(canvas)

    this.canvas = canvas
  }

  render(): React.ReactElement {
    return (
      <canvasTexture
        image={this.canvas}
        ref={(ref) => this.textureRefIsUpdated(ref)}
        attach={this.props.attach}
      />
    )
  }

  private drawCanvasBase(canvas: HTMLCanvasElement): void {
    const { color } = this.props

    const context = canvas.getContext('2d')
    context.fillStyle = color.toString()
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  private onInitialize(texture: CanvasTexture): void {
    const callback = this.props.onInitialize
    if (callback) callback(this.canvas, texture)
  }

  private textureRefIsUpdated(newTextureRef: CanvasTexture): void {
    this.setRef(this.props.canvasRef, this.canvas)
    this.setRef(this.props.textureRef, newTextureRef)

    if (newTextureRef) {
      if (!this.texture) this.onInitialize(newTextureRef)
      this.texture = newTextureRef
    }
  }

  //TODO: különszedni egy külön osztályba
  private setRef<T>(ref: React.ForwardedRef<T>, value: T): void {
    if (!ref) return
    if (typeof ref === 'function') ref(value)
    else ref.current = value
  }
}
