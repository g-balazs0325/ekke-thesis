import { afterEach, beforeAll, expect, test } from 'vitest'
import CoordinateUtils, { ConstantCoordinateUtilBounds } from '../../utils/CoordinateUtils'
import { Mesh, MeshBasicMaterial, PerspectiveCamera, Shape, ShapeGeometry, Vector2 } from 'three'
import RaycastFaceSelector from './RaycastFaceSelector'
import Test3DEnvironment from '../../utils/Test3DEnvironment'

let viewportSize: Vector2
let viewportCenter: Vector2
let environment: Test3DEnvironment

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
  mesh.geometry.computeBoundingBox()
  return mesh
}

beforeAll(() => {
  viewportSize = new Vector2(800, 600)
  viewportCenter = new Vector2(400, 300)

  const bounds = new ConstantCoordinateUtilBounds(viewportSize.x, viewportSize.y)
  CoordinateUtils.setBounds(bounds)

  environment = Test3DEnvironment.createAuto(viewportSize)
  environment.setCamera(new PerspectiveCamera(90, viewportSize.x / viewportSize.y, 0.1, 25))
})
afterEach(() => {
  environment.renderFrame()
  environment.clearScene()
})

test('Selection is empty when there is no intersection', () => {
  environment.addObject(createTriangleMesh(0, 5, -5))

  const target = new RaycastFaceSelector(environment.getScene(), environment.getCamera())
  const faces = target.selectFaces(viewportCenter)
  expect(faces).toHaveLength(0)
})

test('Selection has one face when there is one intersection', () => {
  environment.addObject(createTriangleMesh(0, 0, -5))

  const target = new RaycastFaceSelector(environment.getScene(), environment.getCamera())
  const faces = target.selectFaces(viewportCenter)
  expect(faces).toHaveLength(1)
})

test('Selection has the closest face when there are more intersections', () => {
  const closest = createTriangleMesh(0, 0, -5)
  environment.addObject(closest)
  environment.addObject(createTriangleMesh(0, 0, -10))
  environment.addObject(createTriangleMesh(0, 0, -15))

  const target = new RaycastFaceSelector(environment.getScene(), environment.getCamera())
  const faces = target.selectFaces(viewportCenter)
  expect(faces).toHaveLength(1)

  const expected = closest.material
  const actual = faces[0].material
  expect(expected).toEqual(actual)
})

test("Selection returns empty array when 'intersection' is a backface", () => {
  const backface = createTriangleMesh(0, 0, -5)
  backface.rotateY((180 * Math.PI) / 180)
  environment.addObject(backface)

  const target = new RaycastFaceSelector(environment.getScene(), environment.getCamera())
  const faces = target.selectFaces(viewportCenter)
  expect(faces).toHaveLength(0)
})
