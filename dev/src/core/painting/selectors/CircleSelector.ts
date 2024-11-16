import {
  Camera,
  Frustum,
  Matrix4,
  Mesh,
  Object3D,
  Vector2,
  Vector3,
} from "three";
import FaceData from "../datastructures/FaceData";
import Selector from "./Selector";
import CameraRayCalculation from "./raycalculations/CameraRayCalculation";
import CoordinateUtils from "../../utils/CoordinateUtils";

export default class CircleSelector implements Selector {
  private root: Object3D;
  private camera: Camera;

  private frustum: Frustum;

  private radius: number;
  getRadius(): number {
    return this.radius;
  }
  setRadius(value: number): void {
    this.radius = value;
  }

  constructor(root: Object3D, camera: Camera, radius: number) {
    this.root = root;
    this.camera = camera;
    this.radius = radius;
    this.frustum = new Frustum();
  }

  selectFaces(clientPosition: Vector2): FaceData[] {
    let output: FaceData[] = [];

    this.camera.updateMatrix();
    this.camera.updateMatrixWorld();
    this.frustum = this.frustum.setFromProjectionMatrix(
      new Matrix4().multiplyMatrices(
        this.camera.projectionMatrix.clone(),
        this.camera.matrixWorldInverse.clone()
      )
    );

    this.selectUnsortedFaces(clientPosition, this.root, output);
    output = output.filter((face) => this.filterFace(face, clientPosition));

    return output;
  }

  private selectUnsortedFaces(
    clientPosition: Vector2,
    object: Object3D,
    output: FaceData[]
  ) {
    object.children.forEach((child) => {
      this.selectUnsortedFaces(clientPosition, child, output);
    });

    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    if (!this.frustum.intersectsObject(mesh)) return;

    output.push(...FaceData.createArrayFromMesh(mesh));
  }

  private filterFace(face: FaceData, clientPosition: Vector2): boolean {
    const vertexNdcCoords: Vector3[] = [
      face.a.position.clone().project(this.camera),
      face.b.position.clone().project(this.camera),
      face.c.position.clone().project(this.camera),
    ];

    return (
      this.filterBackface(face) &&
      this.filterDepths(vertexNdcCoords) && // experimental fix
      this.filterFaceOutsideCircle(clientPosition, vertexNdcCoords)
    );
  }

  private filterBackface(face: FaceData): boolean {
    let cameraWorldPos = new Vector3();
    this.camera.getWorldPosition(cameraWorldPos);

    const cameraNormal = this.camera.getWorldDirection(new Vector3());
    return face.getNormal().clone().dot(cameraNormal) < 0;
  }

  private filterDepths(vertexNdcCoords: Vector3[]): boolean {
    for (let i = 0; i < vertexNdcCoords.length; i++) {
      const vertex = vertexNdcCoords[i];
      if (vertex.z <= 0 || vertex.z > 3) return false;
    }
    return true;
  }

  private filterFaceOutsideCircle(
    clientPosition: Vector2,
    vertexNdcCoords: Vector3[]
  ): boolean {
    const depth: number[] = [];
    const relativeCoords = vertexNdcCoords.map((ndcCoords) => {
      const ndc = CoordinateUtils.ndcToClientWithDepth(ndcCoords);
      const relativeCoord = new Vector2(ndc.x, ndc.y).sub(clientPosition);
      depth.push(ndc.z);
      return relativeCoord;
    });

    // https://www.phatcode.net/articles.php?id=459
    let result = false;
    result ||= this.vertexWithinCircle(relativeCoords);
    result ||= this.circleCenterWithinTriangle(relativeCoords);
    result ||= this.circleIntersectsEdge(relativeCoords);

    return result;
  }
  private vertexWithinCircle(relativeCoords: Vector2[]): boolean {
    for (let i = 0; i < relativeCoords.length; i++) {
      const coords = relativeCoords[i] as Vector2;

      if (coords.length() <= this.radius) return true;
    }
    return false;
  }
  private circleCenterWithinTriangle(relativeCoords: Vector2[]): boolean {
    const length = relativeCoords.length;
    for (let i = 0; i < length; i++) {
      const P1 = relativeCoords[i];
      const P2 = relativeCoords[(i + 1) % length];

      // assumption: all faces' vertices are in clockwise order
      const normal = new Vector2(P2.y - P1.y, P1.x - P2.x);
      const sign = normal.x * -P1.x + normal.y * -P1.y;
      if (sign < 0) return false;
    }

    return true;
  }
  private circleIntersectsEdge(relativeCoords: Vector2[]): boolean {
    const length = relativeCoords.length;
    for (let i = 0; i < length; i++) {
      const P1 = relativeCoords[i];
      const P2 = relativeCoords[(i + 1) % length];

      const e1 = P2.clone().sub(P1);
      const c1 = P1.clone().multiplyScalar(-1);

      const le1l = e1.length();
      const lc1l = c1.length();

      const p = lc1l;
      const dot = c1.dot(e1);
      const k = dot / le1l;
      const d = Math.sqrt(p * p - k * k);

      const intersectsLine = d <= this.radius;
      let pointIsInSegment = true;
      pointIsInSegment &&= dot > 0;
      pointIsInSegment &&= k < le1l;

      if (intersectsLine && pointIsInSegment) return true;
    }

    return false;
  }
}
