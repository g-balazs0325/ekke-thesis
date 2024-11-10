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
import { Environment, OrbitControls } from "@react-three/drei";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";

import env_studio from "./assets/hdris/studio_small_03_1k.hdr";
import env_meadow from "./assets/hdris/meadow_2_1k.hdr";
import env_sky from "./assets/hdris/kloofendal_48d_partly_cloudy_puresky_1k.hdr";
import env_nightcity from "./assets/hdris/cobblestone_street_night_1k.hdr";

class MyApp extends React.Component {
  private static hdris: Map<string, string> = new Map<string, string>([
    ["Studio", env_studio],
    ["Meadows", env_meadow],
    ["Sky", env_sky],
    ["City (night)", env_nightcity],
  ]);
  private static current_hdri_name: string = "Studio";

  private canvasRef: React.MutableRefObject<HTMLCanvasElement>;
  private textureRef: React.MutableRefObject<CanvasTexture>;

  public albedoColor: Color = new Color("blue");
  public roughnessIntensity: number = 255;
  public metalnessIntensity: number = 0;
  private gui: GUI;

  state = {
    wf: false,
    hdri: env_studio,
    hdri_background: true,
  };

  constructor(props: any) {
    super(props);
    this.canvasRef = React.createRef();
    this.textureRef = React.createRef();
    this.state.hdri = MyApp.hdris.get(MyApp.current_hdri_name);
  }

  componentDidMount(): void {
    this.initializeGUI();
  }

  private initializeGUI(): void {
    this.gui = new GUI();

    const folder_hdri = this.gui.addFolder("HDRI options");
    folder_hdri
      .add<any, string>(MyApp, "current_hdri_name", [...MyApp.hdris.keys()])
      .name("Theme")
      .onChange((key) => {
        const hdri: string = MyApp.hdris.get(key);
        this.setState({ hdri: hdri });
      });
    folder_hdri
      .add(this.state, "hdri_background")
      .name("Use HDRI as background")
      .onChange((value) => this.setState({ hdri_background: value }));

    const folder_brush = this.gui.addFolder("Brush options");
    folder_brush.addColor(this, "albedoColor").name("Albedo Color");
    folder_brush
      .add(this as MyApp, "roughnessIntensity", 0, 255, 1)
      .name("Roughness");
    folder_brush
      .add(this as MyApp, "metalnessIntensity", 0, 255, 1)
      .name("Metalness");
  }

  componentWillUnmount(): void {
    this.gui.destroy();
  }

  render(): React.ReactElement {
    return (
      <React.StrictMode>
        <Canvas
          tabIndex={0}
          onKeyDown={() => this.updateWf(true)}
          onKeyUp={() => this.updateWf(false)}
        >
          <React.Suspense fallback={null}>
            <Environment
              background={this.state.hdri_background}
              backgroundIntensity={0.9}
              files={this.state.hdri}
            />
          </React.Suspense>

          <OrbitControls />
          <ambientLight intensity={0.5} />

          <mesh onClick={this.onClick.bind(this)}>
            <torusKnotGeometry />
            <meshPhysicalMaterial
              wireframe={this.state.wf}
              roughness={1}
              metalness={1}
            >
              <BlankCanvasTexture
                size={2048}
                color={"red"}
                attach={"map"}
                canvasRef={this.canvasRef}
                textureRef={(ref) => (this.textureRef.current = ref)}
                onInitialize={this.initializeCanvasTexture.bind(this)}
              />
              <BlankCanvasTexture
                size={2048}
                color={"white"}
                attach={"roughnessMap"}
              />
              <BlankCanvasTexture
                size={2048}
                color={"black"}
                attach={"metalnessMap"}
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
  ): void {
    this.strokeCanvasRandomly(canvas, "green");
    texture.needsUpdate = true;
  }

  private strokeCanvasRandomly(
    canvas: HTMLCanvasElement,
    strokeStyle: string
  ): void {
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

  private updateWf(value: boolean): void {
    this.setState({ wf: value });
  }

  private onClick(e: ThreeEvent<MouseEvent>): void {
    if (e.delta != 0) return;

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
    const metalnessCanvas = material.metalnessMap as CanvasTexture;
    if (!(albedoCanvas && roughnessCanvas && metalnessCanvas)) return;

    this.paintFaceOnCanvasTexture(albedoCanvas, uvcoords, this.albedoColor);

    const valueR = this.roughnessIntensity / 255;
    this.paintFaceOnCanvasTexture(
      roughnessCanvas,
      uvcoords,
      new Color(valueR, valueR, valueR)
    );
    const valueM = this.metalnessIntensity / 255;
    this.paintFaceOnCanvasTexture(
      metalnessCanvas,
      uvcoords,
      new Color(valueM, valueM, valueM)
    );
  }

  private paintFaceOnCanvasTexture(
    texture: CanvasTexture,
    uvs: Vector2[],
    color: Color
  ): void {
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
