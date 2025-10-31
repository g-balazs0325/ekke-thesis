import {
  Camera,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  Object3D,
  Scene,
  Vector2,
  WebGLRenderer,
  WireframeGeometry
} from 'three'

type RenderMode = 'none' | 'manual'

const HELPER_LAYER = 31 // TODO: figyelembe vett rétegek konfigurálhatósága szelektoroknál
const HELPER_COLOR = 0xff0000

interface RenderModeBase {
  onInitialize(viewportSize: Vector2): void
  onAddObject(scene: Scene, object: Object3D): void
  onAddHelper(scene: Scene, object: Object3D): void
  onAddUIElement(element: HTMLElement, position: Vector2): void
  onClearUI(): void
  onRenderFrame(scene: Scene, camera: Camera): void
  canRenderFrames(): boolean
}
class NoneRenderMode implements RenderModeBase {
  /* eslint-disable */
  onInitialize(): void {}
  onAddObject(): void {}
  onAddHelper(): void {}
  onAddUIElement(): void {}
  onClearUI(): void {}
  onRenderFrame(): void {}
  /* eslint-enable */
  canRenderFrames(): boolean {
    return false
  }
}
class ManualRenderMode implements RenderModeBase {
  private renderer: WebGLRenderer
  private ui: HTMLDivElement

  onInitialize(viewportSize: Vector2): void {
    this.renderer = new WebGLRenderer()
    this.renderer.setSize(viewportSize.x, viewportSize.y)
    document.body.appendChild(this.renderer.domElement)

    const rendererStyle = this.renderer.domElement.style
    rendererStyle.position = 'absolute'
    rendererStyle.left = '0px'
    rendererStyle.right = '0px'

    this.initializeUI(viewportSize)
  }
  private initializeUI(viewportSize: Vector2): void {
    this.ui = document.createElement('div')

    const style = this.ui.style
    style.overflow = 'hidden'
    style.position = 'absolute'
    style.left = '0px'
    style.width = `${viewportSize.x}px`
    style.top = '0px'
    style.height = `${viewportSize.y}px`

    document.body.appendChild(this.ui)
  }

  onAddObject(scene: Scene, object: Object3D): void {
    if (!(object as Mesh).isMesh) return

    const mesh = object as Mesh
    const wireframe = new WireframeGeometry(mesh.geometry)
    const material = new LineBasicMaterial({ color: HELPER_COLOR, depthTest: false })
    const line = new LineSegments(wireframe, material)
    line.layers.set(HELPER_LAYER)
    line.translateOnAxis(mesh.position, 1)
    line.updateMatrixWorld()
    scene.add(line)
  }

  onAddHelper(scene: Scene, object: Object3D): void {
    object.layers.set(HELPER_LAYER)
    object.updateMatrixWorld()
    scene.add(object)
  }

  onAddUIElement(element: HTMLElement, position: Vector2): void {
    const style = element.style
    style.position = 'relative'
    style.left = `${position.x}px`
    style.top = `${position.y}px`

    this.ui.appendChild(element)
  }

  onClearUI(): void {
    while (this.ui.lastChild) {
      this.ui.removeChild(this.ui.lastChild)
    }
  }

  onRenderFrame(scene: Scene, camera: Camera): void {
    this.renderer.render(scene, camera)
  }

  canRenderFrames(): boolean {
    return true
  }
}

export default class Test3DEnvironment {
  private viewportSize: Vector2
  private scene = new Scene()
  private camera: Camera
  private renderMode: RenderModeBase

  public constructor(viewportSize: Vector2, renderMode: RenderMode) {
    this.viewportSize = viewportSize
    this.initializeRenderMode(renderMode)
  }
  private initializeRenderMode(renderMode: RenderMode): void {
    if (renderMode == 'none') this.renderMode = new NoneRenderMode()
    else if (renderMode == 'manual') this.renderMode = new ManualRenderMode()
    this.renderMode.onInitialize(this.viewportSize)
  }

  public static createAuto(viewportSize: Vector2): Test3DEnvironment {
    if (typeof document === 'undefined') return new Test3DEnvironment(viewportSize, 'none')
    return new Test3DEnvironment(viewportSize, 'manual')
  }

  public getCamera(): Camera {
    return this.camera
  }

  public setCamera(camera: Camera): void {
    this.camera = camera
    this.camera.layers.enable(HELPER_LAYER)
  }

  public getScene(): Scene {
    return this.scene
  }

  public addObject(object: Object3D): void {
    object.updateMatrixWorld()
    this.scene.add(object)
    this.renderMode.onAddObject(this.scene, object)
  }

  public addHelper(helper: Object3D): void {
    this.renderMode.onAddHelper(this.scene, helper)
  }

  public clearScene(): void {
    const scene = this.scene
    while (scene.children.length > 0) scene.remove(scene.children[0])
  }

  public addUIElement(element: HTMLElement, position: Vector2): void {
    this.renderMode.onAddUIElement(element, position)
  }

  public clearUI(): void {
    this.renderMode.onClearUI()
  }

  public renderFrame(): void {
    this.renderMode.onRenderFrame(this.scene, this.camera)
  }

  public canRenderFrames(): boolean {
    return this.renderMode.canRenderFrames()
  }
}
