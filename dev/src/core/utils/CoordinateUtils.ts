import { Vector2, Vector3 } from "three";

const clientToNormalized = function (clientPosition: Vector2): Vector2 {
  return new Vector2(
    (clientPosition.x / window.innerWidth) * 2 - 1,
    -((clientPosition.y / window.innerHeight) * 2 - 1)
  );
};
const normalizedToClient = function (normalizedPosition: Vector2): Vector2 {
  return new Vector2(
    ((normalizedPosition.x + 1) / 2) * window.innerWidth,
    (-(normalizedPosition.y + 1) / 2) * window.innerHeight
  );
};
const ndcToClient = function (ndcPosition: Vector3): Vector2 {
  return new Vector2(
    ((ndcPosition.x + 1) / 2) * window.innerWidth,
    ((-ndcPosition.y + 1) / 2) * window.innerHeight
  );
};

const CoordinateUtils = {
  clientToNormalized,
  normalizedToClient,
  ndcToClient,
};
export default CoordinateUtils;
