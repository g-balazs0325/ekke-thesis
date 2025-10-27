import {
  BufferGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Shape,
  ShapeGeometry,
  Vector3
} from 'three'
import FaceData from '../../painting/datastructures/FaceData'

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

function createSelectionHelper(faces: FaceData[]): Object3D {
  if (faces.length === 0) return new Object3D()

  const geometry = new BufferGeometry()
  geometry.setFromPoints(getLineSegmentVertices(faces))
  const material = new LineBasicMaterial({
    color: 0x00ff00,
    depthTest: false
  })

  const line = new LineSegments(geometry, material)
  return line
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

const Test3DObjectCreator = {
  createTriangleMesh,
  createSelectionHelper
}
export default Test3DObjectCreator
