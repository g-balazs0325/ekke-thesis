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
  onRenderFrame(scene: Scene, camera: Camera): void
}
class NoneRenderMode implements RenderModeBase {
  /* eslint-disable */
  onInitialize(): void {}
  onAddObject(): void {}
  onRenderFrame(): void {}
  /* eslint-enable */
}
class ManualRenderMode implements RenderModeBase {
  private renderer: WebGLRenderer

  onInitialize(viewportSize: Vector2): void {
    this.renderer = new WebGLRenderer()
    this.renderer.setSize(viewportSize.x, viewportSize.y)
    document.body.appendChild(this.renderer.domElement)
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
  onRenderFrame(scene: Scene, camera: Camera): void {
    this.renderer.render(scene, camera)
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
  public clearScene(): void {
    const scene = this.scene
    while (scene.children.length > 0) scene.remove(scene.children[0])
  }

  public renderFrame(): void {
    this.renderMode.onRenderFrame(this.scene, this.camera)
  }
}
