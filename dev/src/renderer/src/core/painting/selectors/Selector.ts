import { Vector2 } from 'three'
import FaceData from '../datastructures/FaceData'

export default interface Selector {
  selectFaces(clientPosition: Vector2): FaceData[]
}
