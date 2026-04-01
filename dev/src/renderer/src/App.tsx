import env_studio from './assets/hdris/studio_small_03_1k.hdr'
import env_meadow from './assets/hdris/meadow_2_1k.hdr'
import env_sky from './assets/hdris/kloofendal_48d_partly_cloudy_puresky_1k.hdr'
import env_nightcity from './assets/hdris/cobblestone_street_night_1k.hdr'

import { Canvas, RootState } from '@react-three/fiber'
import * as React from 'react'
import {
  Camera,
  CanvasTexture,
  Color,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MOUSE,
  Scene,
  Vector2
} from 'three'
import { BlankCanvasTexture } from './components/canvas/BlankCanvasTexture'
import { Environment, OrbitControls } from '@react-three/drei'
import { GUI } from 'lil-gui'
import RaycastFaceSelector from './core/painting/selectors/RaycastFaceSelector'
import FacesPainter from './core/painting/FacesPainter'
import CircleSelector from './core/painting/selectors/CircleSelector'
import Selector from './core/painting/selectors/Selector'
import ParametricGeometry, { ParametricFunction } from './components/geometries/ParametricGeometry'
import { compile, evaluate } from 'mathjs'
import SelectorGUI from './core/painting/selectors/gui/SelectorGUI'
import SelectorGUIFactory from './core/painting/selectors/gui/SelectorGUIFactory'
import CanvasOverlay from './components/canvas/CanvasOverlay'
import { OrbitControls as ThreeOrbitControls } from 'three-stdlib'

enum HdriEnum {
  Studio = 'Studio',
  Meadows = 'Meadows',
  Sky = 'Sky',
  City = 'City (night)'
}
enum SelectorEnum {
  Raycast = 'Raycast',
  Circle = 'Circle'
}

interface AppState {
  wireframe?: boolean
  hdri?: string
  useHdriAsBackground?: boolean

  parametricProps?: {
    xFn: ParametricFunction
    yFn: ParametricFunction
    zFn: ParametricFunction
    uStart: number
    uEnd: number
    uSegments: number
    vStart: number
    vEnd: number
    vSegments: number
  }
}

class App extends React.Component {
  private hdris: Map<HdriEnum, string> = new Map<HdriEnum, string>([
    [HdriEnum.Studio, env_studio],
    [HdriEnum.Meadows, env_meadow],
    [HdriEnum.Sky, env_sky],
    [HdriEnum.City, env_nightcity]
  ])
  public currentHdriName = HdriEnum.Studio

  private canvasRef: React.RefObject<HTMLCanvasElement>
  private textureRef: React.RefObject<CanvasTexture>

  private painter: FacesPainter
  private selectors: Map<SelectorEnum, Selector>
  public currentSelectorName: SelectorEnum

  private scene: Scene
  private camera: Camera
  private orbitControlsRef: ThreeOrbitControls

  public albedoColor: Color = new Color('blue')
  public roughnessIntensity = 255
  public metalnessIntensity = 0
  private gui: GUI

  private overlayDivRef: HTMLDivElement
  private selectorGUI: SelectorGUI
  private selectorControllersRoot: GUI

  private parametricProps = {
    xFn: 'cos(u) * sin(v)',
    yFn: 'cos(v)',
    zFn: 'sin(u) * sin(v)',
    uStart: '0',
    uEnd: '2 * pi',
    uSegments: 16,
    vStart: '0',
    vEnd: 'pi',
    vSegments: 16
  }

  state: AppState = {
    wireframe: false,
    hdri: env_studio,
    useHdriAsBackground: true
  }

  constructor(props: unknown) {
    super(props)
    this.canvasRef = React.createRef()
    this.textureRef = React.createRef()
    this.state.hdri = this.hdris.get(this.currentHdriName)
    this.state.parametricProps = this.compileParametricProperties()
  }

  private compileParametricProperties(): typeof this.state.parametricProps {
    const meshProps = this.parametricProps
    const compiledX = compile(meshProps.xFn)
    const compiledY = compile(meshProps.yFn)
    const compiledZ = compile(meshProps.zFn)

    return {
      xFn: (u: number, v: number) => compiledX.evaluate({ u: u, v: v }),
      yFn: (u: number, v: number) => compiledY.evaluate({ u: u, v: v }),
      zFn: (u: number, v: number) => compiledZ.evaluate({ u: u, v: v }),
      uStart: evaluate(meshProps.uStart),
      uEnd: evaluate(meshProps.uEnd),
      uSegments: meshProps.uSegments,
      vStart: evaluate(meshProps.vStart),
      vEnd: evaluate(meshProps.vEnd),
      vSegments: meshProps.vSegments
    }
  }

  componentWillUnmount(): void {
    this.gui?.destroy()
  }

  render(): React.ReactElement {
    const meshProps = this.state.parametricProps

    return (
      <React.StrictMode>
        <Canvas
          tabIndex={0}
          onCreated={this.onSceneCreated.bind(this)}
          onClick={this.onClick.bind(this)}
          onMouseMove={this.onMouseMove.bind(this)}
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
              RIGHT: MOUSE.ROTATE
            }}
            ref={(ref) => {
              this.orbitControlsRef = ref
            }}
          />
          <ambientLight intensity={0.5} />

          <mesh>
            <ParametricGeometry {...meshProps} />
            <meshPhysicalMaterial wireframe={this.state.wireframe} roughness={1} metalness={1}>
              <BlankCanvasTexture
                size={2048}
                color={'red'}
                attach={'map'}
                canvasRef={this.canvasRef}
                textureRef={(ref) => (this.textureRef.current = ref)}
                onInitialize={this.initializeCanvasTexture.bind(this)}
              />
              <BlankCanvasTexture size={2048} color={'white'} attach={'roughnessMap'} />
              <BlankCanvasTexture size={2048} color={'black'} attach={'metalnessMap'} />
            </meshPhysicalMaterial>
          </mesh>
        </Canvas>
        <CanvasOverlay
          ref={(ref: HTMLDivElement) => {
            this.overlayDivRef = ref
          }}
        />
      </React.StrictMode>
    )
  }

  private onSceneCreated(state: RootState): void {
    this.scene = state.scene
    this.camera = state.camera

    this.initializePaintingObjects()
    this.initializeGUI()
    this.initializeSelectorGUI()
  }

  private initializePaintingObjects(): void {
    this.selectors = new Map<SelectorEnum, Selector>([
      [SelectorEnum.Raycast, new RaycastFaceSelector(this.scene, this.camera)],
      [SelectorEnum.Circle, new CircleSelector(this.scene, this.camera, 40)]
    ])

    this.currentSelectorName = SelectorEnum.Raycast
    const selector = this.selectors.get(this.currentSelectorName)
    this.painter = new FacesPainter(selector, this.albedoColor)
  }

  private initializeGUI(): void {
    this.gui = new GUI()

    const folderControls = this.gui.addFolder('Controls')
    folderControls.add(this as App, 'showControls').name('Show controls')
    folderControls.add(this as App, 'resetCamera').name('Reset camera')

    const folderHdri = this.gui.addFolder('Render options')
    folderHdri
      .add(this, 'currentHdriName', [...this.hdris.keys()])
      .name('HDRI theme')
      .onChange((key: HdriEnum) => {
        const hdri: string = this.hdris.get(key)
        this.setState({ hdri: hdri })
      })
    folderHdri
      .add(this.state, 'useHdriAsBackground')
      .name('Use HDRI as background')
      .onChange((value: boolean) => this.setState({ useHdriAsBackground: value }))
    folderHdri
      .add(this.state, 'wireframe')
      .name('Wireframe')
      .onChange((value: boolean) => this.setState({ wireframe: value }))

    const folderBrush = this.gui.addFolder('Brush options')
    folderBrush
      .add(this, 'currentSelectorName', [...this.selectors.keys()])
      .name('Selector')
      .onChange((value: SelectorEnum) => {
        const newSelector = this.selectors.get(value)
        this.painter.setSelector(newSelector)
        this.changeSelectorGUI(newSelector)
      })

    this.selectorControllersRoot = folderBrush.addFolder('Selector options')

    folderBrush.addColor(this, 'albedoColor').name('Albedo Color')
    folderBrush.add(this as App, 'roughnessIntensity', 0, 255, 1).name('Roughness')
    folderBrush.add(this as App, 'metalnessIntensity', 0, 255, 1).name('Metalness')

    const folderMesh = this.gui.addFolder('Mesh generation')
    const folderMeshFunctions = folderMesh.addFolder('Equations')
    folderMeshFunctions.add(this.parametricProps, 'xFn').name('X')
    folderMeshFunctions.add(this.parametricProps, 'yFn').name('Y')
    folderMeshFunctions.add(this.parametricProps, 'zFn').name('Z')
    const folderMeshU = folderMesh.addFolder('U parameters')
    folderMeshU.add(this.parametricProps, 'uStart').name('Start')
    folderMeshU.add(this.parametricProps, 'uEnd').name('End')
    folderMeshU.add(this.parametricProps, 'uSegments', 1).name('Segments')
    const folderMeshV = folderMesh.addFolder('V parameters')
    folderMeshV.add(this.parametricProps, 'vStart').name('Start')
    folderMeshV.add(this.parametricProps, 'vEnd').name('End')
    folderMeshV.add(this.parametricProps, 'vSegments', 1).name('Segments')

    folderMesh.add(this as App, 'regenerateMesh').name('Regenerate')
  }

  private initializeSelectorGUI(): void {
    const selector = this.painter.getSelector()
    this.changeSelectorGUI(selector)
  }

  private changeSelectorGUI(newSelector: Selector): void {
    const oldSelectorGUI = this.selectorGUI
    oldSelectorGUI?.onUnselected()

    const newSelectorGUI = SelectorGUIFactory.create(
      newSelector,
      this.overlayDivRef,
      this.selectorControllersRoot
    )
    newSelectorGUI.onSelected()
    this.selectorGUI = newSelectorGUI
  }

  public showControls(): void {
    const controls =
      'Press LMB: Paint\n' +
      'Hold RMB: Rotate camera\n' +
      'Mouse wheel/Hold MMB: Zoom camera\n' +
      'Hold Shift+RMB: Move camera'
    window.dialog.showInfo('Controls', controls)
  }

  public resetCamera(): void {
    this.orbitControlsRef?.reset()
  }

  public regenerateMesh(): void {
    try {
      const meshProps = this.parametricProps
      const scopes = { u: 0, v: 0 }
      this.throwOnBadExpression('X', meshProps.xFn, scopes)
      this.throwOnBadExpression('Y', meshProps.yFn, scopes)
      this.throwOnBadExpression('Z', meshProps.zFn, scopes)

      this.throwOnBadExpression('U Start', meshProps.uStart)
      this.throwOnBadExpression('U End', meshProps.uEnd)

      this.throwOnBadExpression('V Start', meshProps.vStart)
      this.throwOnBadExpression('V End', meshProps.vEnd)

      this.setState({ parametricProps: this.compileParametricProperties() })
    } catch ({ message }) {
      window.dialog.showError('Input error', message)
    }
  }

  private initializeCanvasTexture(canvas: HTMLCanvasElement, texture: CanvasTexture): void {
    this.strokeCanvasRandomly(canvas, 'green')
    texture.needsUpdate = true
  }

  private strokeCanvasRandomly(canvas: HTMLCanvasElement, strokeStyle: string): void {
    const size = canvas.width
    const context = canvas.getContext('2d')

    context.strokeStyle = strokeStyle
    context.lineWidth = 5
    context.lineCap = 'round'

    context.beginPath()
    for (let i = 0; i < 30; i++) {
      context.lineTo(Math.random() * size, Math.random() * size)
    }
    context.closePath()
    context.stroke()
  }

  private onClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void {
    const clientPosition = new Vector2(e.clientX, e.clientY)

    if (!this.painter)
      this.painter = new FacesPainter(new CircleSelector(this.scene, this.camera, 40), null)

    const painter = this.painter
    const valueR = this.roughnessIntensity / 255
    const valueM = this.metalnessIntensity / 255

    painter.beginPainting(clientPosition)
    painter.setColor(this.albedoColor)
    painter.paint<MeshStandardMaterial>('map')
    painter.setColor(new Color(valueR, valueR, valueR))
    painter.paint<MeshPhysicalMaterial>('roughnessMap')
    painter.setColor(new Color(valueM, valueM, valueM))
    painter.paint<MeshPhysicalMaterial>('metalnessMap')
    painter.endPainting()
  }

  private onMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void {
    this.selectorGUI?.onMouseMove(e.clientX, e.clientY)
  }

  private throwOnBadExpression(readableFieldName: string, expr: string, scope: object = {}): void {
    try {
      const result = evaluate(expr, scope)
      if (typeof result != 'number') {
        throw new SyntaxError('Result is not a number')
      }
    } catch ({ message }) {
      throw new SyntaxError(`Invalid expression at field '${readableFieldName}': "${message}"`)
    }
  }
}

export default App
