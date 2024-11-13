import {
  Camera,
  Euler,
  Line3,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Vector2,
  Vector3,
} from "three";
import FaceData from "../datastructures/FaceData";
import Selector from "./Selector";
import CameraRayCalculation from "./raycalculations/CameraRayCalculation";

export default class CircleSelector<T extends Camera> implements Selector {
  private root: Object3D;
  private camera: T;
  private rayCalculation: CameraRayCalculation<T>;

  private radius: number;
  getRadius(): number {
    return this.radius;
  }
  setRadius(value: number): void {
    this.radius = value;
  }

  constructor(
    root: Object3D,
    camera: T,
    rayCalculation: CameraRayCalculation<T>,
    radius: number
  ) {
    this.root = root;
    this.camera = camera;
    this.rayCalculation = rayCalculation;
    this.radius = radius;
  }

  selectFaces(clientPosition: Vector2): FaceData[] {
    throw new Error("Method not implemented.");
  }

  private getNormalizedPosition(clientPosition: Vector2): Vector2 {
    return new Vector2(
      (clientPosition.x / window.innerWidth) * 2 - 1,
      -((clientPosition.y / window.innerHeight) * 2 - 1)
    );
  }

  // solution: https://math.stackexchange.com/questions/1993953/closest-points-between-two-lines
  private faceIsInCircle(face: FaceData, normalizedPosition: Vector2): boolean {
    let inCircle = true;

    const Lc = this.calculateCameraRay(normalizedPosition);
    const Pc = Lc.start;
    const Vc = Lc.end.sub(Lc.start).normalize();

    let faces = [face.a, face.b, face.c];
    for (let i = 0; i < 3; i++) {
      if (!inCircle) break;

      const Lf = new Line3(faces[i].position, faces[(i + 1) % 3].position);
      const Pf = Lf.start;
      const Vf = Lf.end.sub(Lf.start).normalize();

      const Vx = Vf.cross(Vc);

      // linear equation: Pc + tc*Vc + tx*Vx = Pf + tf*Vf
      let tc: number, tf: number, tx: number;
    }

    return inCircle;
  }

  private calculateCameraRay(normalizedPosition: Vector2): Line3 {
    return this.rayCalculation.calculateCameraRay(
      this.camera,
      normalizedPosition
    );
  }
}
