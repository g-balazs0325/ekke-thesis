import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { OrthographicCamera, PerspectiveCamera, Vector2 } from 'three'
import CoordinateUtils, { ConstantCoordinateUtilBounds } from '../../utils/CoordinateUtils'
import Test3DEnvironment from '../../utils/tests/Test3DEnvironment'
import Test3DObjectCreator from '../../utils/tests/Test3DObjectCreator'
import CircleSelector from './CircleSelector'
import FaceData from '../datastructures/FaceData'

const viewportSize = new Vector2(800, 600)
const viewportRatio = viewportSize.x / viewportSize.y
let environment: Test3DEnvironment

function addSelectionHelper(faces: FaceData[]): void {
  if (!environment.canRenderFrames()) return
  const helper = Test3DObjectCreator.createSelectionHelper(faces)
  environment.addHelper(helper)
}
const { createTriangleMesh, createPlaneMesh } = Test3DObjectCreator

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

function addRotatedPlaneMesh(distance: number): void {
  const mesh = createPlaneMesh({ x: 0, y: 0, z: -distance }, { x: 8, y: 6 }, { x: 16, y: 12 })
  mesh.rotateY((10 * Math.PI) / 180)
  environment.addObject(mesh)
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
  const viewportCenter = viewportSize.clone().multiplyScalar(0.5)
  const circleRadius = 200

  beforeAll(() => {
    environment.clearUI()
    environment.setCamera(new PerspectiveCamera(90, viewportRatio, 0.1, 25))
    addUISelectorCircle(viewportCenter, circleRadius)
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
    mesh.rotateY((180 * Math.PI) / 180)
    environment.addObject(mesh)

    const target = new CircleSelector(environment.getScene(), environment.getCamera(), circleRadius)
    const faces = target.selectFaces(viewportCenter)
    addSelectionHelper(faces)
    expect(faces).toHaveLength(0)
  })
})

describe('Tests with different projections, screen coordinates (800x600) and radii on a slightly-rotated 8x6 plane with 16x12 segments', () => {
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
    { ...cameras.perspective50, count: 3 },
    { ...cameras.perspective90, count: 11 },
    { ...cameras.orthographic, count: 6 } // 'túl közel van' az ortografikus kamerához a plane, 0 db lap kerül kiválasztásra
  ])(
    'Selection has $count face(s) when clicked at (290, 260) with 25 radius and $description projection',
    ({ camera, count }) => {
      environment.setCamera(camera)
      addRotatedPlaneMesh(5)

      const screenCoords = new Vector2(290, 260)
      const radius = 25
      addUISelectorCircle(screenCoords, radius)

      const target = new CircleSelector(environment.getScene(), environment.getCamera(), radius)
      const faces = target.selectFaces(screenCoords)
      addSelectionHelper(faces)

      expect(faces).toHaveLength(count)
    }
  )

  test.for([
    { ...cameras.perspective50, count: 20 },
    { ...cameras.perspective90, count: 0 },
    { ...cameras.orthographic, count: 22 }
  ])(
    'Selection has $count face(s) when clicked at (725, 510) with 75 radius and $description projection',
    ({ camera, count }) => {
      environment.setCamera(camera)
      addRotatedPlaneMesh(5)

      const screenCoords = new Vector2(725, 510)
      const radius = 75
      addUISelectorCircle(screenCoords, radius)

      const target = new CircleSelector(environment.getScene(), environment.getCamera(), radius)
      const faces = target.selectFaces(screenCoords)
      addSelectionHelper(faces)

      expect(faces).toHaveLength(count)
    }
  )
})
