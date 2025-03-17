import { Vector2, Vector3 } from "three";

const clientToNormalized = function (clientPosition: Vector2): Vector2 {
  return new Vector2(
    (clientPosition.x / window.innerWidth) * 2 - 1,
    -((clientPosition.y / window.innerHeight) * 2 - 1)
  );
};
const normalizedToClient = function (normalizedPosition: Vector2): Vector2 {
  return new Vector2(
    ((1 + normalizedPosition.x) / 2) * window.innerWidth,
    ((1 - normalizedPosition.y) / 2) * window.innerHeight
  );
};
const ndcToClientWithDepth = function (ndcPosition: Vector3): Vector3 {
  return new Vector3(
    ((1 + ndcPosition.x) / 2) * window.innerWidth,
    ((1 - ndcPosition.y) / 2) * window.innerHeight,
    ndcPosition.z
  );
};
const ndcToClient = function (ndcPosition: Vector3): Vector2 {
  return new Vector2(
    ((1 + ndcPosition.x) / 2) * window.innerWidth,
    ((1 - ndcPosition.y) / 2) * window.innerHeight
  );
};

const CoordinateUtils = {
  clientToNormalized,
  normalizedToClient,
  ndcToClientWithDepth,
  ndcToClient,
};
export default CoordinateUtils;
