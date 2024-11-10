import { Camera, Mesh, Object3D, Vector2 } from "three";
import FaceData from "../datastructures/FaceData";
import Selector from "./Selector";
import { Raycaster } from "three/src/Three";

export default class RaycastFaceSelector implements Selector {
  private raycaster: Raycaster;
  private root: Object3D;
  private camera: Camera;

  constructor(root: Object3D, camera: Camera) {
    this.raycaster = new Raycaster();
    this.root = root;
    this.camera = camera;
  }

  selectFaces(normalizedPosition: Vector2): FaceData[] {
    let rc = this.raycaster;

    rc.setFromCamera(normalizedPosition, this.camera);
    const intersections = rc.intersectObject(this.root, true);
    console.log(intersections);

    if (intersections.length == 0 || intersections[0].object! instanceof Mesh)
      return [];

    const mesh = intersections[0].object as Mesh;
    const originalFace = intersections[0].face;
    return [FaceData.createFromMesh(mesh, originalFace)];
  }
}
