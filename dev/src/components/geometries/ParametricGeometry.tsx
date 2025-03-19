import React, { useState } from "react";

export function ParametricGeometry() {
  const [vertices, setVertices] = useState(
    new Float32Array([0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0])
  );
  const [uvs, setUvs] = useState(
    new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0])
  );
  const normals = new Float32Array([0.0, 0.0, 1.0]);

  return (
    <bufferGeometry>
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
        attach={"attributes-normal"}
        array={normals}
        itemSize={3}
        count={normals.length / 3}
      />
    </bufferGeometry>
  );
}

export default ParametricGeometry;
