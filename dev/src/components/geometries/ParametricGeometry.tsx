import React, { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, NormalBufferAttributes, Vector3 } from "three";

type BufferGeometryRef = React.Ref<BufferGeometry>;

export type ParametricFunction = (u: number, v: number) => number;
type RangeTuple = [start: number, end: number];
type VertexCacheItem = {
  position: Vector3;
  indices: number[];
  normal: Vector3;
};

export interface ParametricGeometryProps {
  x: ParametricFunction;
  y: ParametricFunction;
  z: ParametricFunction;
  uRange: RangeTuple;
  uSteps: number;
  vRange: RangeTuple;
  vSteps: number;
}

export function ParametricGeometry(props: ParametricGeometryProps) {
  const geometryRef: BufferGeometryRef = useRef(null);
  const [vertices, uvs, indices] = useMemo(() => {
    const vertsArray: number[] = [];
    const uvsArray: number[] = [];
    const indicesArray: number[] = [];

    const [x, y, z] = [props.x, props.y, props.z];
    const [uMin, uMax] = props.uRange;
    const [vMin, vMax] = props.vRange;
    const uDiff = uMax - uMin;
    const vDiff = vMax - vMin;
    const uStep = uDiff / props.uSteps;
    const vStep = vDiff / props.vSteps;

    let u = uMin;
    let v = vMin;
    for (let i = 0; i <= props.uSteps; i++) {
      v = vMin;
      for (let j = 0; j <= props.vSteps; j++) {
        const [vertX, vertY, vertZ] = calcVert(u, v, x, y, z);
        vertsArray.push(vertX, vertY, vertZ);
        uvsArray.push(i / props.uSteps, j / props.vSteps);

        if (i > 0 && j > 0) {
          const a = getIndex(i - 1, j - 1, props.vSteps + 1);
          const b = getIndex(i - 1, j, props.vSteps + 1);
          const c = getIndex(i, j - 1, props.vSteps + 1);
          const d = getIndex(i, j, props.vSteps + 1);

          makeFaceIfValid(indicesArray, c, b, a, vertsArray);
          makeFaceIfValid(indicesArray, b, c, d, vertsArray);
        }

        v += vStep;
      }
      u += uStep;
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
    fixVertexNormals(ref);
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
  for (let i = 0; i < indices.length; i++) {
    const faceIndex1 = indices[i];
    const faceIndex2 = indices[(i + 1) % 3];

    let matches = true;
    for (let j = 0; j < 3; j++) {
      matches &&=
        vertsArray[faceIndex1 * 3 + j] == vertsArray[faceIndex2 * 3 + j];
    }

    if (matches) return;
  }

  indicesArray.push(a, b, c);
}

function calcVert(
  u: number,
  v: number,
  x: ParametricFunction,
  y: ParametricFunction,
  z: ParametricFunction
): [number, number, number] {
  return [x(u, v), y(u, v), z(u, v)];
}

function getIndex(i: number, j: number, jLength: number): number {
  let value = i * jLength + j;
  return value;
}

function fixVertexNormals(ref: BufferGeometry<NormalBufferAttributes>) {
  const vertices = ref.getAttribute("position");
  const normals = ref.getAttribute("normal");
  const cache: VertexCacheItem[] = [];
  const tempVector = new Vector3();

  for (let i = 0; i < vertices.count; i++) {
    let cacheItem: VertexCacheItem;

    tempVector.fromBufferAttribute(vertices, i);
    cacheItem = cache.find((value) => value.position.equals(tempVector));
    if (cacheItem === undefined) {
      cacheItem = {
        position: tempVector.clone(),
        indices: [],
        normal: new Vector3(),
      };
      cache.push(cacheItem);
    }

    cacheItem.indices.push(i);
    cacheItem.normal.add(tempVector.fromBufferAttribute(normals, i));
  }

  cache.forEach((value) => {
    if (value.indices.length <= 1) return;
    const normal = value.normal.normalize();
    value.indices.forEach((value) => {
      normals.setXYZ(value, normal.x, normal.y, normal.z);
    });
  });
}

export default ParametricGeometry;
