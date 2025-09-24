import { afterEach, beforeAll, expect, test } from 'vitest'
import CoordinateUtils, { ConstantCoordinateUtilBounds } from '../../utils/CoordinateUtils'
import {
  Camera,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Shape,
  ShapeGeometry,
  Vector2
} from 'three'
import RaycastFaceSelector from './RaycastFaceSelector'

let scene: Scene
let camera: Camera

function createTriangleMesh(x: number, y: number, z: number): Mesh {
  const shape = new Shape()
  shape.moveTo(-2, -2)
  shape.lineTo(0, 2)
  shape.lineTo(2, -2)
  shape.lineTo(-2, -2)

  const geometry = new ShapeGeometry(shape, 1)
  const material = new MeshBasicMaterial()
  const mesh = new Mesh(geometry, material)

  mesh.translateX(x)
  mesh.translateY(y)
  mesh.translateZ(z)
  mesh.updateMatrixWorld()
  mesh.geometry.computeBoundingBox()
  return mesh
}

beforeAll(() => {
  const bounds = new ConstantCoordinateUtilBounds(800, 600)
  CoordinateUtils.setBounds(bounds)

  scene = new Scene()
  camera = new PerspectiveCamera(90, 800 / 600, 0.1, 25)
})

afterEach(() => {
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
