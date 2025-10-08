import { afterEach, beforeAll, expect, test } from 'vitest'
import CoordinateUtils, { ConstantCoordinateUtilBounds } from '../../utils/CoordinateUtils'
import {
  Camera,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Shape,
  ShapeGeometry,
  Vector2,
  WebGLRenderer,
  WireframeGeometry
} from 'three'
import RaycastFaceSelector from './RaycastFaceSelector'

let scene: Scene
let camera: Camera
let renderer: WebGLRenderer

function createTriangleMesh(x: number, y: number, z: number): Mesh {
  const shape = new Shape()
  shape.moveTo(-2, -2)
  shape.lineTo(0, 2)
  shape.lineTo(2, -2)
  shape.lineTo(-2, -2)

  const geometry = new ShapeGeometry(shape, 1)
  const material = new MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.3 })
  const mesh = new Mesh(geometry, material)

  mesh.translateX(x)
  mesh.translateY(y)
  mesh.translateZ(z)
  mesh.updateMatrixWorld()
  mesh.geometry.computeBoundingBox()
  return mesh
}
function addWireframes(): void {
  for (const obj of scene.children) {
    if (!('isMesh' in obj && obj.isMesh)) continue
    const mesh = obj as Mesh
    const wireframe = new WireframeGeometry(mesh.geometry)
    const material = new LineBasicMaterial({ color: 0xff0000, depthTest: false })
    const line = new LineSegments(wireframe, material)
    line.translateOnAxis(mesh.position, 1)
    line.updateMatrixWorld()
    scene.add(line)
  }
}

beforeAll(() => {
  const bounds = new ConstantCoordinateUtilBounds(800, 600)
  CoordinateUtils.setBounds(bounds)

  scene = new Scene()
  camera = new PerspectiveCamera(90, 800 / 600, 0.1, 25)

  renderer = new WebGLRenderer()
  renderer.setSize(800, 600)
  document.body.appendChild(renderer.domElement)
})

afterEach(() => {
  addWireframes()
  renderer.render(scene, camera)

  while (scene.children.length > 0) {
    const object = scene.children[0]
    scene.remove(object)
  }
})

test('Selection is empty when there is no intersection', () => {
  scene.add(createTriangleMesh(0, 5, -5))

  const target = new RaycastFaceSelector(scene, camera)
  const screenCenter = new Vector2(400, 300)
  const faces = target.selectFaces(screenCenter)
  expect(faces).toHaveLength(0)
})

test('Selection has one face when there is one intersection', () => {
  scene.add(createTriangleMesh(0, 0, -5))

  const target = new RaycastFaceSelector(scene, camera)
  const screenCenter = new Vector2(400, 300)
  const faces = target.selectFaces(screenCenter)
  expect(faces).toHaveLength(1)
})

test('Selection has the closest face when there are more intersections', () => {
  const closest = createTriangleMesh(0, 0, -5)
  scene.add(closest)
  scene.add(createTriangleMesh(0, 0, -10))
  scene.add(createTriangleMesh(0, 0, -15))

  const target = new RaycastFaceSelector(scene, camera)
  const screenCenter = new Vector2(400, 300)
  const faces = target.selectFaces(screenCenter)
  expect(faces).toHaveLength(1)

  const expected = closest.material
  const actual = faces[0].material
  expect(expected).toEqual(actual)
})

test("Selection returns empty array when 'intersection' is a backface", () => {
  const backface = createTriangleMesh(0, 0, -5)
  backface.rotateY((180 * Math.PI) / 180)
  backface.updateMatrixWorld()
  scene.add(backface)

  const target = new RaycastFaceSelector(scene, camera)
  const screenCenter = new Vector2(400, 300)
  const faces = target.selectFaces(screenCenter)
  expect(faces).toHaveLength(0)
})
