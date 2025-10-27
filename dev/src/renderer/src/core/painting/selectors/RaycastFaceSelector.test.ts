import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import CoordinateUtils, { ConstantCoordinateUtilBounds } from '../../utils/CoordinateUtils'
import {
  BufferGeometry,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Shape,
  ShapeGeometry,
  Vector2
} from 'three'
import RaycastFaceSelector from './RaycastFaceSelector'
import Test3DEnvironment from '../../utils/tests/Test3DEnvironment'
import FaceData from '../datastructures/FaceData'

const viewportSize = new Vector2(800, 600)
const viewportCenter = viewportSize.clone().multiplyScalar(0.5)
const viewportRatio = viewportSize.x / viewportSize.y
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
function addUIRayPoint(screenCoords: Vector2): void {
  if (!environment.canRenderFrames()) return

  const point = document.createElement('div')
  const style = point.style
  style.width = '3px'
  style.height = '3px'
  style.transform = 'translate(-50%, -50%)'
  style.backgroundColor = 'white'

  environment.addUIElement(point, screenCoords)
}
function addSelectionHelper(faces: FaceData[]): void {
  if (!environment.canRenderFrames()) return
  if (faces.length == 0) return

  const face = faces[0]
  const points = [face.a.position, face.b.position, face.c.position]
  const geometry = new BufferGeometry().setFromPoints(points)
  const material = new LineBasicMaterial({
    color: 0x00ff00,
    depthTest: false
  })
  const line = new LineLoop(geometry, material)
  line.computeLineDistances()
  environment.addHelper(line)
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

describe('General tests from the center of the screen', () => {
  beforeAll(() => {
    environment.clearUI()
    environment.setCamera(new PerspectiveCamera(90, viewportRatio, 0.1, 25))
    addUIRayPoint(viewportCenter)
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
    addSelectionHelper(faces)
    expect(faces).toHaveLength(1)
  })

  test('Selection has the closest face when there are more intersections', () => {
    const closest = createTriangleMesh(0, 0, -5)
    environment.addObject(closest)
    environment.addObject(createTriangleMesh(0, 0, -10))
    environment.addObject(createTriangleMesh(0, 0, -15))

    const target = new RaycastFaceSelector(environment.getScene(), environment.getCamera())
    const faces = target.selectFaces(viewportCenter)
    addSelectionHelper(faces)
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
})

describe('Tests with different projections and screen coordinates (800x600)', () => {
  const cameras = {
    perspective50: {
      camera: new PerspectiveCamera(50, viewportRatio, 0.1, 25),
      description: '50° perspective'
    },
    perspective90: {
      camera: new PerspectiveCamera(90, viewportRatio, 0.1, 25),
      description: '90° perspective'
    },
    orthographic: {
      camera: new OrthographicCamera(-4, 4, 3, -3, 0.1, 25),
      description: '8x6 orthographic'
    }
  }

  beforeEach(() => {
    environment.clearUI()
  })

  test.for([
    { ...cameras.perspective50, count: 1 },
    { ...cameras.perspective90, count: 0 },
    { ...cameras.orthographic, count: 1 }
  ])(
    'Selection has $count face(s) when clicked at (400, 200) with $description projection',
    ({ camera, count }) => {
      environment.setCamera(camera)
      environment.addObject(createTriangleMesh(0, 0, -5))

      const screenCoords = new Vector2(400, 150)
      addUIRayPoint(screenCoords)

      const target = new RaycastFaceSelector(environment.getScene(), environment.getCamera())
      const faces = target.selectFaces(screenCoords)
      addSelectionHelper(faces)
      expect(faces).toHaveLength(count)
    }
  )

  test.for([
    { ...cameras.perspective50, count: 1 },
    { ...cameras.perspective90, count: 0 },
    { ...cameras.orthographic, count: 0 }
  ])(
    'Selection has $count face(s) when clicked at (290, 265) with $description projection',
    ({ camera, count }) => {
      environment.setCamera(camera)
      environment.addObject(createTriangleMesh(0, 0, -5))

      const screenCoords = new Vector2(290, 265)
      addUIRayPoint(screenCoords)

      const target = new RaycastFaceSelector(environment.getScene(), environment.getCamera())
      const faces = target.selectFaces(screenCoords)
      addSelectionHelper(faces)
      expect(faces).toHaveLength(count)
    }
  )
})
