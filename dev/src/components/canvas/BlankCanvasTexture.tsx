import { CanvasTextureProps } from "@react-three/fiber";
import React, {
  Component,
  ForwardedRef,
  MutableRefObject,
  Ref,
  RefObject,
} from "react";
import { CanvasTexture, Color, ColorRepresentation } from "three";

interface BlankCanvasTextureProps extends CanvasTextureProps {
  size: number;
  color?: ColorRepresentation;
  textureRef?: ForwardedRef<CanvasTexture>;
  canvasRef?: ForwardedRef<HTMLCanvasElement>;
  onInitialize?: (canvas: HTMLCanvasElement, texture: CanvasTexture) => void;

  image?: undefined;
}

export class BlankCanvasTexture extends Component<BlankCanvasTextureProps> {
  public static defaultProps = { color: "white" };

  private canvas: HTMLCanvasElement;
  private texture: CanvasTexture;

  constructor(props: BlankCanvasTextureProps) {
    super(props);

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = props.size;
    this.drawCanvasBase(canvas);

    this.canvas = canvas;
  }

  private drawCanvasBase(canvas: HTMLCanvasElement) {
    const { color } = this.props;

    const context = canvas.getContext("2d");
    context.fillStyle = color.toString();
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  private onInitialize(texture: CanvasTexture) {
    const callback = this.props.onInitialize;
    if (callback) callback(this.canvas, texture);
  }

  private textureRefIsUpdated(newTextureRef: CanvasTexture) {
    this.setRef(this.props.canvasRef, this.canvas);
    this.setRef(this.props.textureRef, newTextureRef);

    if (newTextureRef) {
      if (!this.texture) this.onInitialize(newTextureRef);
      this.texture = newTextureRef;
    }
  }

  private setRef<T>(ref: ForwardedRef<T>, value: T) {
    if (!ref) return;
    if (typeof ref === "function") ref(value);
    else ref.current = value;
  }

  render() {
    return (
      <canvasTexture
        image={this.canvas}
        ref={(ref) => this.textureRefIsUpdated(ref)}
        {...(this.props as CanvasTextureProps)}
      />
    );
  }
}

export default BlankCanvasTexture;
