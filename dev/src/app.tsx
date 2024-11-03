import { Canvas } from "@react-three/fiber";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { CanvasTexture, createCanvasElement } from "three";
import BlankCanvasTexture from "./components/canvas/BlankCanvasTexture";

class MyApp extends React.Component {
  private canvasRef: React.MutableRefObject<HTMLCanvasElement>;
  private textureRef: React.MutableRefObject<CanvasTexture>;

  state = {
    wf: false,
  };

  constructor(props: any) {
    super(props);
    this.canvasRef = React.createRef();
    this.textureRef = React.createRef();
  }

  render() {
    return (
      <React.StrictMode>
        <Canvas
          tabIndex={0}
          onKeyDown={() => this.updateWf(true)}
          onKeyUp={() => this.updateWf(false)}
        >
          <directionalLight position={[0, 1, 0]} />
          <ambientLight intensity={0.5} />
          <mesh>
            <torusKnotGeometry />
            <meshPhysicalMaterial wireframe={this.state.wf}>
              <BlankCanvasTexture
                size={512}
                color={"red"}
                attach={"map"}
                canvasRef={this.canvasRef}
                textureRef={(ref) => (this.textureRef.current = ref)}
                onInitialize={this.initializeCanvasTexture.bind(this)}
              />
            </meshPhysicalMaterial>
          </mesh>
        </Canvas>
      </React.StrictMode>
    );
  }

  private initializeCanvasTexture(
    canvas: HTMLCanvasElement,
    texture: CanvasTexture
  ) {
    this.strokeCanvasRandomly(canvas, "green");
    texture.needsUpdate = true;
  }

  private strokeCanvasRandomly(canvas: HTMLCanvasElement, strokeStyle: string) {
    const size = canvas.width;
    const context = canvas.getContext("2d");

    context.strokeStyle = strokeStyle;
    context.lineWidth = 5;
    context.lineCap = "round";

    context.beginPath();
    for (let i = 0; i < 30; i++) {
      context.lineTo(Math.random() * size, Math.random() * size);
    }
    context.closePath();
    context.stroke();
  }

  private updateWf(value: boolean) {
    this.setState({ wf: value });
  }
}

const root = createRoot(document.getElementById("root"));
root.render(<MyApp />);
