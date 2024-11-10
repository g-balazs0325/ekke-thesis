import { Vector2 } from "three";
import FaceData from "../datastructures/FaceData";

export default interface Selector {
    selectFaces(normalizedPosition: Vector2): FaceData[];
}