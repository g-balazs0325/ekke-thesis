import {
  Euler,
  Line3,
  PerspectiveCamera,
  Quaternion,
  Vector2,
  Vector3,
} from "three";
import CameraRayCalculation from "./CameraRayCalculation";

export default class PerspectiveCameraRayCalculation
  implements CameraRayCalculation<PerspectiveCamera>
{
  calculateCameraRay(
    camera: PerspectiveCamera,
    normalizedPosition: Vector2
  ): Line3 {
    let position: Vector3;
    camera.getWorldPosition(position);

    const halfFovVert = camera.fov / 2;
    const halfFovHoriz = halfFovVert * camera.aspect;
    const quaternionShift = new Quaternion();
    quaternionShift.setFromEuler(
      new Euler(
        halfFovVert * normalizedPosition.y,
        halfFovHoriz * normalizedPosition.x,
        0
      )
    );

    let direction: Vector3;
    camera.getWorldDirection(direction);
    direction.applyQuaternion(quaternionShift);

    const near = camera.near;
    const far = camera.far;
    return new Line3(
      position.add(direction.multiplyScalar(near)),
      position.add(direction.multiplyScalar(far))
    );
  }
}
