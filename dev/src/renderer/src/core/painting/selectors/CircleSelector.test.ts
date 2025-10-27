import {
  BufferGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Shape,
  ShapeGeometry,
  Vector2,
  Vector3
} from 'three'
import Test3DEnvironment from '../../utils/Test3DEnvironment'
import FaceData from '../datastructures/FaceData'
import CoordinateUtils, { ConstantCoordinateUtilBounds } from '../../utils/CoordinateUtils'
import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import CircleSelector from './CircleSelector'

const viewportSize = new Vector2(800, 600)
const viewportCenter = viewportSize.clone().multiplyScalar(0.5)
const viewportRatio = viewportSize.x / viewportSize.y
let environment: Test3DEnvironment

// TODO: elmozgatni később
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

// TODO: elmozgatni később
function addSelectionHelper(faces: FaceData[]): void {
  if (!environment.canRenderFrames()) return
  if (faces.length === 0) return

  const geometry = new BufferGeometry()
  geometry.setFromPoints(getLineSegmentVertices(faces))
  const material = new LineBasicMaterial({
    color: 0x00ff00,
    depthTest: false
  })

  const line = new LineSegments(geometry, material)
  environment.addHelper(line)
}
function getLineSegmentVertices(faces: FaceData[]): Vector3[] {
  const vertices: Vector3[] = []
  for (const face of faces) {
    const { a, b, c } = face
    vertices.push(a.position.clone(), b.position.clone())
    vertices.push(b.position.clone(), c.position.clone())
    vertices.push(c.position.clone(), a.position.clone())
  }

  return vertices
}

function addUISelectorCircle(position: Vector2, radius: number): void {
  if (!environment.canRenderFrames()) return

  const test = document.createElement('div')
  const style = test.style
  style.width = `${radius * 2}px`
  style.height = `${radius * 2}px`
  style.transform = 'translate(-50%, -50%)'
  style.borderRadius = '50%'
  style.border = '1px solid white'

  environment.addUIElement(test, position)
}

beforeAll(() => {
  const bounds = new ConstantCoordinateUtilBounds(viewportSize.x, viewportSize.y)
  CoordinateUtils.setBounds(bounds)

  environment = Test3DEnvironment.createAuto(viewportSize)
})
afterEach(() => {
  environment.renderFrame()
  environment.clearScene()
})

describe('Tests for the circle intersection algorithm', () => {
  const circleRadius = 20

  beforeAll(() => {
    environment.setCamera(new PerspectiveCamera(90, viewportRatio, 0.1, 25))
  })
  beforeEach(() => {
    environment.clearUI()
    environment.addObject(createTriangleMesh(0, 0, -5))
  })

  // TODO: ellenőrzés hozzáadása, hogy ebben a tesztben a lap tényleg a 'csúcs a körben'
  //       metódus segítségével lett kiválasztva, és nem pedig az 'él metszi kört' metódussal
  test('The face is selected when one of its vertex is inside the circle', () => {
    const clickPosition = new Vector2(400, 162)
    addUISelectorCircle(clickPosition, circleRadius)

    const target = new CircleSelector(environment.getScene(), environment.getCamera(), circleRadius)
    const faces = target.selectFaces(clickPosition)
    addSelectionHelper(faces)
    expect(faces).toHaveLength(1)
  })

  test("The face is selected when the circle's origin is inside it", () => {
    const clickPosition = new Vector2(400, 300)
    addUISelectorCircle(clickPosition, circleRadius)

    const target = new CircleSelector(environment.getScene(), environment.getCamera(), circleRadius)
    const faces = target.selectFaces(clickPosition)
    addSelectionHelper(faces)
    expect(faces).toHaveLength(1)
  })

  test('The face is selected when one of its edges intersect with the circle', () => {
    const clickPosition = new Vector2(320, 300)
    addUISelectorCircle(clickPosition, circleRadius)

    const target = new CircleSelector(environment.getScene(), environment.getCamera(), circleRadius)
    const faces = target.selectFaces(clickPosition)
    addSelectionHelper(faces)
    expect(faces).toHaveLength(1)
  })

  test('No face is selected when none of the conditions apply', () => {
    const clickPosition = new Vector2(400, 150)
    addUISelectorCircle(clickPosition, circleRadius)

    const target = new CircleSelector(environment.getScene(), environment.getCamera(), circleRadius)
    const faces = target.selectFaces(clickPosition)
    addSelectionHelper(faces)
    expect(faces).toHaveLength(0)
  })
})

describe('General tests from center of the screen', () => {
  const circleRadius = 200

  beforeAll(() => {
    environment.clearUI()
    addUISelectorCircle(viewportCenter, circleRadius)
    environment.setCamera(new PerspectiveCamera(90, viewportRatio, 0.1, 25))
  })

  test('Both faces are selected when the two faces do not overlap', () => {
    environment.addObject(createTriangleMesh(-2.1, 0, -5))
    environment.addObject(createTriangleMesh(2.1, 0, -5))

    const target = new CircleSelector(environment.getScene(), environment.getCamera(), circleRadius)
    const faces = target.selectFaces(viewportCenter)
    addSelectionHelper(faces)
    expect(faces).toHaveLength(2)
  })

  test('Both faces are selected even when one of the faces is partially obstructed', () => {
    environment.addObject(createTriangleMesh(1, 0, -5))
    environment.addObject(createTriangleMesh(-1, 0, -10))

    const target = new CircleSelector(environment.getScene(), environment.getCamera(), circleRadius)
    const faces = target.selectFaces(viewportCenter)
    addSelectionHelper(faces)
    expect(faces).toHaveLength(2)
  })

  test('Only the face that is not completely obstructed is selected', () => {
    const nonObstructed = createTriangleMesh(0, 0, -5)
    environment.addObject(nonObstructed)
    environment.addObject(createTriangleMesh(0, 0, -10))

    const target = new CircleSelector(environment.getScene(), environment.getCamera(), circleRadius)
    const faces = target.selectFaces(viewportCenter)
    addSelectionHelper(faces)
    expect(faces).toHaveLength(1)

    const face = faces[0]
    expect(face.material).toEqual(nonObstructed.material)
  })

  test('Face that is behind the camera is not selected', () => {
    environment.addObject(createTriangleMesh(0, 0, 1))

    const target = new CircleSelector(environment.getScene(), environment.getCamera(), circleRadius)
    const faces = target.selectFaces(viewportCenter)
    addSelectionHelper(faces)
    expect(faces).toHaveLength(0)
  })

  test('Backface is not selected', () => {
    const mesh = createTriangleMesh(0, 0, -5)
    mesh.rotateY(Math.PI)
    environment.addObject(mesh)

    const target = new CircleSelector(environment.getScene(), environment.getCamera(), circleRadius)
    const faces = target.selectFaces(viewportCenter)
    expect(faces).toHaveLength(0)
  })
})
