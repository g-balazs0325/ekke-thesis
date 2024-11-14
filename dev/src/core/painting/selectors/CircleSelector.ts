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
    output = output.filter(
      (face) =>
        this.filterBackface(face) &&
        this.filterFaceOutsideCircle(face, clientPosition)
    );

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

  private filterBackface(face: FaceData): boolean {
    let cameraWorldPos = new Vector3();
    this.camera.getWorldPosition(cameraWorldPos);

    const cameraNormal = face
      .getPosition()
      .clone()
      .sub(cameraWorldPos)
      .normalize();
    return face.getNormal().clone().dot(cameraNormal) < 0;
  }

  private filterFaceOutsideCircle(
    face: FaceData,
    clientPosition: Vector2
  ): boolean {
    const vertexNdcCoords: Vector3[] = [
      face.a.position.clone().project(this.camera),
      face.b.position.clone().project(this.camera),
      face.c.position.clone().project(this.camera),
    ];

    const relativeCoords = vertexNdcCoords.map((ndcCoords) => {
      return CoordinateUtils.ndcToClient(ndcCoords).sub(clientPosition);
    });

    // https://www.phatcode.net/articles.php?id=459
    let result = false;
    result ||= this.vertexWithinCircle(relativeCoords);
    result ||= this.circleCenterWithinTriangle(relativeCoords);
    result ||= this.circleIntersectsEdge(relativeCoords);

    return result;
  }
  private vertexWithinCircle(relativeCoords: Vector2[]): boolean {
    for (const key in relativeCoords) {
      const coords = relativeCoords[key] as Vector2;

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
      const c1 = P1;

      const le1l = e1.length();
      const lc1l = c1.length();

      const p = lc1l;
      const dot = c1.dot(e1);
      const k = dot / le1l;
      const d = Math.sqrt(p * p - k * k);

      const intersectsLine = d <= this.radius;
      let pointIsInSegment = true;
      pointIsInSegment &&= dot <= 0;
      pointIsInSegment &&= k >= le1l;

      if (intersectsLine && pointIsInSegment) return true;
    }

    return false;
  }
}
