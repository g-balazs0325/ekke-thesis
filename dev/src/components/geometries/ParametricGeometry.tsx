import React, { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, NormalBufferAttributes, Vector3 } from "three";

type BufferGeometryRef = React.Ref<BufferGeometry>;
type RangeTuple = [start: number, end: number];
type VertexCacheItem = {
  indices: number[];
  normal: Vector3;
};
type ParametricFunction = (u: number, v: number) => number;

interface ParametricGeometryProps {
  xFn: ParametricFunction;
  yFn: ParametricFunction;
  zFn: ParametricFunction;
  uRange: RangeTuple;
  uSegments: number;
  vRange: RangeTuple;
  vSegments: number;
}

export function ParametricGeometry(props: ParametricGeometryProps) {
  const geometryRef: BufferGeometryRef = useRef(null);
  const [vertices, uvs, indices] = useMemo(() => {
    const vertsArray: number[] = [];
    const uvsArray: number[] = [];
    const indicesArray: number[] = [];

    const [xFn, yFn, zFn] = [props.xFn, props.yFn, props.zFn];
    const [uMin, uMax] = props.uRange;
    const [vMin, vMax] = props.vRange;
    const uDiff = uMax - uMin;
    const vDiff = vMax - vMin;
    const uSegments = props.uSegments;
    const vSegments = props.vSegments;

    let u = uMin;
    let v = vMin;
    for (let i = 0; i <= uSegments; i++) {
      u = uMin + uDiff * (i / uSegments);

      for (let j = 0; j <= vSegments; j++) {
        v = vMin + vDiff * (j / vSegments);

        const [x, y, z] = calculateVertex(u, v, xFn, yFn, zFn);
        vertsArray.push(x, y, z);

        uvsArray.push(i / uSegments, j / vSegments); // TODO: UV leképezés

        if (i > 0 && j > 0) {
          const jLength = vSegments + 1;
          const a = getIndexFrom2D(i - 1, j - 1, jLength);
          const b = getIndexFrom2D(i - 1, j, jLength);
          const c = getIndexFrom2D(i, j - 1, jLength);
          const d = getIndexFrom2D(i, j, jLength);

          makeFaceIfValid(indicesArray, c, b, a, vertsArray);
          makeFaceIfValid(indicesArray, b, c, d, vertsArray);
        }
      }
    }

    const vertices = new Float32Array(vertsArray);
    const uvs = new Float32Array(uvsArray);
    const indices = new Uint32Array(indicesArray);
    return [vertices, uvs, indices];
  }, [props, geometryRef]);

  useEffect(() => {
    const ref = geometryRef.current;
    if (!ref) return;

    ref.computeVertexNormals();
    mergeVertexNormals(ref);
    ref.computeTangents();
  }, [vertices, uvs]);

  return (
    <bufferGeometry ref={geometryRef}>
      <bufferAttribute
        attach={"attributes-position"}
        array={vertices}
        itemSize={3}
        count={vertices.length / 3}
      />
      <bufferAttribute
        attach={"attributes-uv"}
        array={uvs}
        itemSize={2}
        count={uvs.length / 2}
      />
      <bufferAttribute
        attach={"index"}
        array={indices}
        itemSize={1}
        count={indices.length}
      />
    </bufferGeometry>
  );
}

function makeFaceIfValid(
  indicesArray: number[],
  a: number,
  b: number,
  c: number,
  vertsArray: number[]
) {
  const indices = [a, b, c];
  const length = 3;
  for (let i = 0; i < length; i++) {
    const vertIndex1 = indices[i];
    const vertIndex2 = indices[(i + 1) % length];

    let matches = true;
    const dimensions = 3;
    for (let j = 0; j < dimensions; j++) {
      const coord1 = vertsArray[vertIndex1 * dimensions + j];
      const coord2 = vertsArray[vertIndex2 * dimensions + j];
      matches &&= coord1 == coord2;
    }

    if (matches) return;
  }

  indicesArray.push(a, b, c);
}

function calculateVertex(
  u: number,
  v: number,
  xFn: ParametricFunction,
  yFn: ParametricFunction,
  zFn: ParametricFunction
): [number, number, number] {
  const x = roundToEps(xFn(u, v));
  const y = roundToEps(yFn(u, v));
  const z = roundToEps(zFn(u, v));
  return [x, y, z];
}

function getIndexFrom2D(i: number, j: number, jLength: number): number {
  const value = i * jLength + j;
  return value;
}

function mergeVertexNormals(ref: BufferGeometry<NormalBufferAttributes>) {
  const vertices = ref.getAttribute("position");
  const normals = ref.getAttribute("normal");

  const cache = new Map<string, VertexCacheItem>();
  const tempVector = new Vector3();

  const verticesCount = vertices.count;
  for (let i = 0; i < verticesCount; i++) {
    let cacheItem: VertexCacheItem;

    const vertex = tempVector.fromBufferAttribute(vertices, i);
    const hash = calculateCacheKey(vertex);

    cacheItem = cache.get(hash);
    if (!cacheItem) {
      cacheItem = {
        indices: [],
        normal: new Vector3(),
      };
      cache.set(hash, cacheItem);
    }

    const normal = tempVector.fromBufferAttribute(normals, i);
    cacheItem.indices.push(i);
    cacheItem.normal.add(normal);
  }

  for (const cacheItem of cache.values()) {
    if (cacheItem.indices.length <= 1) continue;

    const normal = cacheItem.normal.normalize();
    for (const index of cacheItem.indices) {
      normals.setXYZ(index, normal.x, normal.y, normal.z);
    }
  }
}

function roundToEps(x: number, eps = 1e-14): number {
  return Math.round(x / eps) * eps;
}

function calculateCacheKey(v: Vector3): string {
  return JSON.stringify(v.toArray());
}

export default ParametricGeometry;
