import React, { useEffect, useRef } from "react";
import { ParametricGeometryGenerator } from "../../core/geometries/ParametricGeometryGenerator";
import { BufferGeometry } from "three";

type BufferGeometryRef = React.Ref<BufferGeometry>;
type RangeTuple = [start: number, end: number];

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

  useEffect(() => {
    const ref = geometryRef.current;
    if (!ref) return;

    new ParametricGeometryGenerator()
      .setGeometry(ref)
      .setXFunction(props.xFn)
      .setYFunction(props.yFn)
      .setZFunction(props.zFn)
      .setUParameters(props.uRange[0], props.uRange[1], props.uSegments)
      .setVParameters(props.vRange[0], props.vRange[1], props.vSegments)
      .generate();
  }, [geometryRef.current]);

  return <bufferGeometry ref={geometryRef} />;
}

export default ParametricGeometry;
