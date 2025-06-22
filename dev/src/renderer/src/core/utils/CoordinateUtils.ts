import { Vector2, Vector3 } from 'three'

interface CoordinateUtilBounds {
  get innerWidth(): number
  get innerHeight(): number
}
export class WindowCoordinateUtilBounds implements CoordinateUtilBounds {
  public get innerWidth(): number {
    return window.innerWidth
  }
  public get innerHeight(): number {
    return window.innerHeight
  }
}
export class ConstantCoordinateUtilBounds implements CoordinateUtilBounds {
  private width: number
  private height: number

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  public get innerWidth(): number {
    return this.width
  }
  public get innerHeight(): number {
    return this.height
  }
}

let bounds = new WindowCoordinateUtilBounds()

const setBounds = function (newBounds: CoordinateUtilBounds): void {
  bounds = newBounds
}

const clientToNormalized = function (clientPosition: Vector2): Vector2 {
  return new Vector2(
    (clientPosition.x / bounds.innerWidth) * 2 - 1,
    -((clientPosition.y / bounds.innerHeight) * 2 - 1)
  )
}
const normalizedToClient = function (normalizedPosition: Vector2): Vector2 {
  return new Vector2(
    ((1 + normalizedPosition.x) / 2) * bounds.innerWidth,
    ((1 - normalizedPosition.y) / 2) * bounds.innerHeight
  )
}
const ndcToClientWithDepth = function (ndcPosition: Vector3): Vector3 {
  return new Vector3(
    ((1 + ndcPosition.x) / 2) * bounds.innerWidth,
    ((1 - ndcPosition.y) / 2) * bounds.innerHeight,
    ndcPosition.z
  )
}
const ndcToClient = function (ndcPosition: Vector3): Vector2 {
  return new Vector2(
    ((1 + ndcPosition.x) / 2) * bounds.innerWidth,
    ((1 - ndcPosition.y) / 2) * bounds.innerHeight
  )
}

const CoordinateUtils = {
  setBounds,
  clientToNormalized,
  normalizedToClient,
  ndcToClientWithDepth,
  ndcToClient
}
export default CoordinateUtils
