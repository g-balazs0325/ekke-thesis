import { Camera, Frustum, Matrix4, Mesh, Object3D, Vector2, Vector3 } from 'three'
import FaceData from '../datastructures/FaceData'
import Selector from './Selector'
import CoordinateUtils from '../../utils/CoordinateUtils'

export default class CircleSelector implements Selector {
  private root: Object3D
  private camera: Camera

  private projMat: Matrix4
  private frustum: Frustum

  private radius: number
  getRadius(): number {
    return this.radius
  }
  setRadius(value: number): void {
    this.radius = value
  }

  constructor(root: Object3D, camera: Camera, radius: number) {
    this.root = root
    this.camera = camera
    this.radius = radius
  }

  selectFaces(clientPosition: Vector2): FaceData[] {
    let output: FaceData[] = []

    this.camera.updateMatrix()
    this.camera.updateMatrixWorld()

    this.projMat = new Matrix4().multiplyMatrices(
      this.camera.projectionMatrix.clone(),
      this.camera.matrixWorldInverse.clone()
    )
    this.frustum = new Frustum().setFromProjectionMatrix(this.projMat)

    this.selectUnsortedFaces(clientPosition, this.root, output)
    output = output.filter((face) => this.filterFaceOutsideFrustum(face))
    output = output.filter((face) => this.filterProjectedFaces(face, clientPosition))

    return output
  }

  private selectUnsortedFaces(clientPosition: Vector2, object: Object3D, output: FaceData[]): void {
    for (const child of object.children) {
      this.selectUnsortedFaces(clientPosition, child, output)
    }

    const mesh = object as Mesh
    if (!mesh.isMesh) return
    if (!this.frustum.intersectsObject(mesh)) return

    const faces = FaceData.createArrayFromMesh(mesh)
    for (let i = 0; i < faces.length; i++) output.push(faces[i])
  }

  private filterFaceOutsideFrustum(face: FaceData): boolean {
    let positions = [face.a.position, face.b.position, face.c.position, face.getPosition()]
    // 1. fázis: csúcsok és középpont
    for (const pos of positions) {
      if (this.frustum.containsPoint(pos)) return true
    }
    // 2. fázis: előző koordináták átlaga, iterálva
    const ITERATIONS = 2

    let jMinimumStart = 0
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      const averages = []

      for (let i = 0; i < positions.length - 1; i++) {
        for (let j = Math.max(jMinimumStart, i + 1); j < positions.length; j++) {
          const pos1 = positions[i]
          const pos2 = positions[j]

          const avg = new Vector3()
          avg.copy(pos1).add(pos2)
          avg.divideScalar(2)

          if (this.frustum.containsPoint(avg)) return true
          averages.push(avg)
        }
      }

      jMinimumStart = positions.length
      positions = positions.concat(averages)
    }

    return false
  }

  private filterProjectedFaces(face: FaceData, clientPosition: Vector2): boolean {
    const vertexNdcCoords: Vector3[] = [
      face.a.position.clone().project(this.camera),
      face.b.position.clone().project(this.camera),
      face.c.position.clone().project(this.camera)
    ]

    return (
      this.filterBackface(face) && this.filterFaceOutsideCircle(clientPosition, vertexNdcCoords)
    )
  }

  private filterBackface(face: FaceData): boolean {
    const faceCenterNdc = face.getPosition().project(this.camera)

    const centerNdcNear = faceCenterNdc.clone().setZ(-1)
    const centerNdcFar = faceCenterNdc.clone().setZ(1)

    const projectionRayStart = centerNdcNear.unproject(this.camera)
    const projectionRayEnd = centerNdcFar.unproject(this.camera)

    const rayNormal = projectionRayEnd.sub(projectionRayStart).normalize()
    return rayNormal.dot(face.getNormal()) < 0
  }

  private filterFaceOutsideCircle(clientPosition: Vector2, vertexNdcCoords: Vector3[]): boolean {
    const depth: number[] = []
    const relativeCoords = vertexNdcCoords.map((ndcCoords) => {
      const ndc = CoordinateUtils.ndcToClientWithDepth(ndcCoords)
      const relativeCoord = new Vector2(ndc.x, ndc.y).sub(clientPosition)
      depth.push(ndc.z)
      return relativeCoord
    })

    // https://www.phatcode.net/articles.php?id=459
    let result = false
    result ||= this.vertexWithinCircle(relativeCoords)
    result ||= this.circleCenterWithinTriangle(relativeCoords)
    result ||= this.circleIntersectsEdge(relativeCoords)

    return result
  }
  private vertexWithinCircle(relativeCoords: Vector2[]): boolean {
    for (let i = 0; i < relativeCoords.length; i++) {
      const coords = relativeCoords[i] as Vector2

      if (coords.length() <= this.radius) return true
    }
    return false
  }
  private circleCenterWithinTriangle(relativeCoords: Vector2[]): boolean {
    const length = relativeCoords.length
    for (let i = 0; i < length; i++) {
      const P1 = relativeCoords[i]
      const P2 = relativeCoords[(i + 1) % length]

      // assumption: all faces' vertices are in clockwise order
      const normal = new Vector2(P2.y - P1.y, P1.x - P2.x)
      const sign = normal.x * -P1.x + normal.y * -P1.y
      if (sign < 0) return false
    }

    return true
  }
  private circleIntersectsEdge(relativeCoords: Vector2[]): boolean {
    const length = relativeCoords.length
    for (let i = 0; i < length; i++) {
      const P1 = relativeCoords[i]
      const P2 = relativeCoords[(i + 1) % length]

      const e1 = P2.clone().sub(P1)
      const c1 = P1.clone().multiplyScalar(-1)

      const le1l = e1.length()
      const lc1l = c1.length()

      const p = lc1l
      const dot = c1.dot(e1)
      const k = dot / le1l
      const d = Math.sqrt(p * p - k * k)

      const intersectsLine = d <= this.radius
      let pointIsInSegment = true
      pointIsInSegment &&= dot > 0
      pointIsInSegment &&= k < le1l

      if (intersectsLine && pointIsInSegment) return true
    }

    return false
  }
}
