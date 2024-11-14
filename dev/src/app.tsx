import { Canvas, RootState } from "@react-three/fiber";
import * as React from "react";
import { createRoot } from "react-dom/client";
import {
  Camera,
  CanvasTexture,
  Color,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MOUSE,
  Scene,
  Vector2,
} from "three";
import BlankCanvasTexture from "./components/canvas/BlankCanvasTexture";
import { Environment, OrbitControls } from "@react-three/drei";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";
import RaycastFaceSelector from "./core/painting/selectors/RaycastFaceSelector";
import FacesPainter from "./core/painting/FacesPainter";

import env_studio from "./assets/hdris/studio_small_03_1k.hdr";
import env_meadow from "./assets/hdris/meadow_2_1k.hdr";
import env_sky from "./assets/hdris/kloofendal_48d_partly_cloudy_puresky_1k.hdr";
import env_nightcity from "./assets/hdris/cobblestone_street_night_1k.hdr";
import CircleSelector from "./core/painting/selectors/CircleSelector";

class MyApp extends React.Component {
  private static hdris: Map<string, string> = new Map<string, string>([
    ["Studio", env_studio],
    ["Meadows", env_meadow],
    ["Sky", env_sky],
    ["City (night)", env_nightcity],
  ]);
  private static currentHdriName: string = "Studio";

  private canvasRef: React.MutableRefObject<HTMLCanvasElement>;
  private textureRef: React.MutableRefObject<CanvasTexture>;
  private painter: FacesPainter;

  private scene: Scene;
  private camera: Camera;

  public albedoColor: Color = new Color("blue");
  public roughnessIntensity: number = 255;
  public metalnessIntensity: number = 0;
  private gui: GUI;

  state = {
    wf: false,
    hdri: env_studio,
    useHdriAsBackground: true,
  };

  constructor(props: any) {
    super(props);
    this.canvasRef = React.createRef();
    this.textureRef = React.createRef();
    this.state.hdri = MyApp.hdris.get(MyApp.currentHdriName);
  }

  componentDidMount(): void {
    this.initializeGUI();
  }

  private initializeGUI(): void {
    this.gui = new GUI();

    const folderHdri = this.gui.addFolder("HDRI options");
    folderHdri
      .add<any, string>(MyApp, "currentHdriName", [...MyApp.hdris.keys()])
      .name("Theme")
      .onChange((key) => {
        const hdri: string = MyApp.hdris.get(key);
        this.setState({ hdri: hdri });
      });
    folderHdri
      .add(this.state, "useHdriAsBackground")
      .name("Use HDRI as background")
      .onChange((value) => this.setState({ hdriBackground: value }));

    const folderBrush = this.gui.addFolder("Brush options");
    folderBrush.addColor(this, "albedoColor").name("Albedo Color");
    folderBrush
      .add(this as MyApp, "roughnessIntensity", 0, 255, 1)
      .name("Roughness");
    folderBrush
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
          onCreated={this.setSceneAndCamera.bind(this)}
          onClick={this.onClick.bind(this)}
        >
          <React.Suspense fallback={null}>
            <Environment
              background={this.state.useHdriAsBackground}
              backgroundIntensity={0.9}
              files={this.state.hdri}
            />
          </React.Suspense>

          <OrbitControls
            mouseButtons={{
              LEFT: null,
              MIDDLE: MOUSE.DOLLY,
              RIGHT: MOUSE.ROTATE,
            }}
          />
          <ambientLight intensity={0.5} />

          <mesh>
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

  private setSceneAndCamera(state: RootState): void {
    this.scene = state.scene;
    this.camera = state.camera;
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

  private onClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const clientPosition = new Vector2(e.clientX, e.clientY);

    if (!this.painter)
      this.painter = new FacesPainter(
        new CircleSelector(this.scene, this.camera, 40),
        null
      );

    const painter = this.painter;
    const valueR = this.roughnessIntensity / 255;
    const valueM = this.metalnessIntensity / 255;

    painter.beginPainting(clientPosition);
    painter.setColor(this.albedoColor);
    painter.paint<MeshStandardMaterial>("map");
    painter.setColor(new Color(valueR, valueR, valueR));
    painter.paint<MeshPhysicalMaterial>("roughnessMap");
    painter.setColor(new Color(valueM, valueM, valueM));
    painter.paint<MeshPhysicalMaterial>("metalnessMap");
    painter.endPainting();
  }
}

const root = createRoot(document.getElementById("root"));
root.render(<MyApp />);
