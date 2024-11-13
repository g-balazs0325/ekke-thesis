import { Camera, Line3, Vector2 } from "three";

export default interface CameraRayCalculation<T extends Camera> {
  calculateCameraRay(camera: T, normalizedPosition: Vector2): Line3;
}
