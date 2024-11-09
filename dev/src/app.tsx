import { Canvas, ThreeEvent } from "@react-three/fiber";
import * as React from "react";
import { createRoot } from "react-dom/client";
import {
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  Mesh,
  MeshPhysicalMaterial,
  Vector2,
} from "three";
import BlankCanvasTexture from "./components/canvas/BlankCanvasTexture";
import { OrbitControls } from "@react-three/drei";

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
          <OrbitControls />
          <directionalLight position={[0, 1, 0]} />
          <ambientLight intensity={0.5} />

          <mesh onClick={this.onClick.bind(this)}>
            <torusKnotGeometry />
            <meshPhysicalMaterial wireframe={this.state.wf} roughness={1}>
              <BlankCanvasTexture
                size={512}
                color={"red"}
                attach={"map"}
                canvasRef={this.canvasRef}
                textureRef={(ref) => (this.textureRef.current = ref)}
                onInitialize={this.initializeCanvasTexture.bind(this)}
              />
              <BlankCanvasTexture
                size={1024}
                color={"white"}
                attach={"roughnessMap"}
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

  private onClick(e: ThreeEvent<MouseEvent>) {
    const mesh = e.object as Mesh;
    if (!mesh) return;
    console.log(mesh);

    const geometry = mesh.geometry;
    const uvs = geometry.attributes.uv as Float32BufferAttribute;
    if (!uvs) return;
    console.log(uvs);

    const indices = [e.face.a, e.face.b, e.face.c];
    let uvcoords: Vector2[] = [];
    indices.forEach((index) => {
      uvcoords.push(new Vector2(uvs.getX(index), uvs.getY(index)));
    });

    const material = mesh.material as MeshPhysicalMaterial;
    const albedoCanvas = material.map as CanvasTexture;
    const roughnessCanvas = material.roughnessMap as CanvasTexture;
    if (!(albedoCanvas && roughnessCanvas)) return;

    this.paintFaceOnCanvasTexture(albedoCanvas, uvcoords, new Color("blue"));
    this.paintFaceOnCanvasTexture(
      roughnessCanvas,
      uvcoords,
      new Color("black")
    );
  }

  private paintFaceOnCanvasTexture(
    texture: CanvasTexture,
    uvs: Vector2[],
    color: Color
  ) {
    if (uvs.length != 3)
      throw new Error("Given UV coordinates do not form a triangle.");

    const canvas = texture.image as HTMLCanvasElement;
    if (!canvas) return;

    const [w, h] = [canvas.width, canvas.height];
    const context = canvas.getContext("2d");

    context.strokeStyle = context.fillStyle = color.getStyle();
    context.lineWidth = 1;

    context.beginPath();
    context.moveTo(w * uvs[2].x, h * (1 - uvs[2].y));
    for (let i = 0; i < 3; i++) {
      context.lineTo(w * uvs[i].x, h * (1 - uvs[i].y));
    }
    context.closePath();
    context.fill();
    context.stroke();

    texture.needsUpdate = true;
  }
}

const root = createRoot(document.getElementById("root"));
root.render(<MyApp />);
