import React, { useEffect, useRef } from 'react'
import { ParametricGeometryGenerator } from '../../core/geometries/ParametricGeometryGenerator'
import { BufferGeometry } from 'three'

type BufferGeometryRef = React.Ref<BufferGeometry>

export type ParametricFunction = (u: number, v: number) => number

interface ParametricGeometryProps {
  xFn: ParametricFunction
  yFn: ParametricFunction
  zFn: ParametricFunction
  uStart: number
  uEnd: number
  uSegments: number
  vStart: number
  vEnd: number
  vSegments: number
}

export function ParametricGeometry(props: ParametricGeometryProps) {
  const geometryRef: BufferGeometryRef = useRef(null)

  useEffect(() => {
    const ref = geometryRef.current
    if (!ref) return

    new ParametricGeometryGenerator()
      .setGeometry(ref)
      .setXFunction(props.xFn)
      .setYFunction(props.yFn)
      .setZFunction(props.zFn)
      .setUParameters(props.uStart, props.uEnd, props.uSegments)
      .setVParameters(props.vStart, props.vEnd, props.vSegments)
      .generate()
  }, [...Object.values(props)])

  return <bufferGeometry ref={geometryRef} />
}

export default ParametricGeometry
