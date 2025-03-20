import React, { useEffect, useMemo, useRef } from "react";
import { BufferGeometry } from "three";

type BufferGeometryRef = React.Ref<BufferGeometry>;

export type ParametricFunction = (u: number, v: number) => number;

export interface ParametricGeometryProps {
  x: ParametricFunction;
  y: ParametricFunction;
  z: ParametricFunction;
  uRange: [number, number];
  uSteps: number;
  vRange: [number, number];
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
    for (let i = 0; i < props.uSteps; i++) {
      v = vMin;
      for (let j = 0; j < props.vSteps; j++) {
        const [x00, y00, z00] = calcVert(u, v, x, y, z);
        const [x01, y01, z01] = calcVert(u, v + vStep, x, y, z);
        const [x10, y10, z10] = calcVert(u + uStep, v, x, y, z);
        const [x11, y11, z11] = calcVert(u + uStep, v + vStep, x, y, z);

        vertsArray.push(x11, y11, z11);
        vertsArray.push(x10, y10, z10);
        vertsArray.push(x00, y00, z00);

        vertsArray.push(x00, y00, z00);
        vertsArray.push(x01, y01, z01);
        vertsArray.push(x11, y11, z11);

        uvsArray.push((i + 1) / props.uSteps, (j + 1) / props.vSteps);
        uvsArray.push((i + 1) / props.uSteps, j / props.vSteps);
        uvsArray.push(i / props.uSteps, j / props.vSteps);

        uvsArray.push(i / props.uSteps, j / props.vSteps);
        uvsArray.push(i / props.uSteps, (j + 1) / props.vSteps);
        uvsArray.push((i + 1) / props.uSteps, (j + 1) / props.vSteps);

        indicesArray.push(indicesArray.length);
        indicesArray.push(indicesArray.length);
        indicesArray.push(indicesArray.length);

        indicesArray.push(indicesArray.length);
        indicesArray.push(indicesArray.length);
        indicesArray.push(indicesArray.length);

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
    console.log(ref);
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

function calcVert(
  u: number,
  v: number,
  x: ParametricFunction,
  y: ParametricFunction,
  z: ParametricFunction
): [number, number, number] {
  return [x(u, v), y(u, v), z(u, v)];
}

export default ParametricGeometry;
