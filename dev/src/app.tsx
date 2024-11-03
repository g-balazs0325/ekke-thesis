import { Canvas } from "@react-three/fiber";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { CanvasTexture } from "three";

/*const MyApp = () => {
  const myCanvasElement = React.useRef();
  // ref stb. definíciók
  // ref-et használó dolgok

  React.useEffect(() => {
    const myCanvas: HTMLCanvasElement = myCanvasElement.current;
    const context = myCanvas.getContext("2d");
    context.fillRect(0, 0, 256, 256);
  }, []);

  return (
    <>
      <canvas ref={"myCanvasElement"} width={256} height={256} hidden />
      <Canvas>
        <directionalLight position={[0, 1, 0]} />
        <mesh>
          <torusKnotGeometry />
          <meshPhysicalMaterial>
            <canvasTexture attach={"map"} image={myCanvasElement.current} />
          </meshPhysicalMaterial>
        </mesh>
      </Canvas>
    </>
  );
};*/

class MyApp extends React.Component {
  private canvasRef: React.MutableRefObject<HTMLCanvasElement>;
  private textureRef: React.MutableRefObject<CanvasTexture>;

  constructor(props: any) {
    super(props);
    this.canvasRef = React.createRef();

    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = canvas.height = 1024;
    this.canvasRef.current = canvas;

    this.textureRef = React.createRef();
  }

  componentDidMount() {
    const canvas: HTMLCanvasElement = this.canvasRef.current;
const size = canvas.width;
    const context = canvas.getContext("2d");

    context.fillStyle = "red";
    context.fillRect(0, 0, size, size);

    context.strokeStyle = "green";
    context.lineWidth = 5;
    context.lineCap = "round";

    context.beginPath();
    for (let i = 0; i < 30; i++) {
      context.lineTo(Math.random() * size, Math.random() * size);
    }
    context.closePath();
    context.stroke();
  }

  private initializeTexture(ref: CanvasTexture) {
    const texture = ref;
    const canvas: HTMLCanvasElement = this.canvasRef.current;

    texture.image = canvas;
    texture.needsUpdate = true;

    this.textureRef.current = texture;
  }

  render() {
    return (
      <React.StrictMode>
        <canvas ref={this.canvasRef} width={256} height={256} hidden />
        <Canvas>
          <directionalLight position={[0, 1, 0]} />
          <ambientLight intensity={0.5} />
          <mesh>
            <torusKnotGeometry />
            <meshPhysicalMaterial>
              <canvasTexture
                ref={(ref) => this.initializeTexture(ref)}
                attach={"map"}
              />
            </meshPhysicalMaterial>
          </mesh>
        </Canvas>
      </React.StrictMode>
    );
  }
}

const root = createRoot(document.getElementById("root"));
root.render(<MyApp />);
