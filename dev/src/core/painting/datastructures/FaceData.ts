import {
  BufferGeometry,
  Face,
  Material,
  Matrix3,
  Mesh,
  NormalBufferAttributes,
  Vector2,
  Vector3,
} from "three";

interface FaceDataProps {
  material: Material;
  a: VertexData;
  b: VertexData;
  c: VertexData;
}

interface VertexData {
  position: Vector3;
  normal: Vector3;
  uv: Vector2;
}

export default class FaceData {
  readonly material: Material;
  readonly a: VertexData;
  readonly b: VertexData;
  readonly c: VertexData;

  private constructor(props: FaceDataProps) {
    this.material = props.material;
    this.a = props.a;
    this.b = props.b;
    this.c = props.c;
  }

  getPosition(): Vector3 {
    return this.a.position
      .clone()
      .add(this.b.position)
      .add(this.c.position)
      .divideScalar(3);
  }
  getNormal(): Vector3 {
    return this.a.normal
      .clone()
      .add(this.b.normal)
      .add(this.c.normal)
      .divideScalar(3)
      .normalize();
  }

  static createFromFace(mesh: Mesh, originalFace: Face): FaceData {
    const geometry = mesh.geometry;
    const materials = mesh.material;

    const material = Array.isArray(materials)
      ? materials[originalFace.materialIndex]
      : materials;

    let localToWorldMatrix = new Matrix3();
    localToWorldMatrix.getNormalMatrix(mesh.matrixWorld);
    const vertexIndices = [originalFace.a, originalFace.b, originalFace.c];
    const vertices = this.createVertexDataForVertices(
      geometry,
      vertexIndices,
      localToWorldMatrix
    );

    return new FaceData({
      material: material,
      a: vertices[0],
      b: vertices[1],
      c: vertices[2],
    });
  }

  static createArrayFromMesh(mesh: Mesh): FaceData[] {
    let faces: FaceData[] = [];
    const geometry = mesh.geometry;

    let localToWorldMatrix = new Matrix3();
    localToWorldMatrix.getNormalMatrix(mesh.matrixWorld);
    if (!Array.isArray(mesh.material)) {
      const material = mesh.material as Material;

      faces.push(
        ...this.createFacesFromIndices(geometry, material, localToWorldMatrix)
      );
    } else {
      const materials = mesh.material as Material[];
      const groups = geometry.groups;
      groups.forEach((group) => {
        const material = materials[group.materialIndex];
        const end = group.start + group.count;
        faces.push(
          ...this.createFacesFromIndices(
            geometry,
            material,
            localToWorldMatrix,
            group.start,
            end
          )
        );
      });
    }

    return faces;
  }

  private static createFacesFromIndices(
    geometry: BufferGeometry<NormalBufferAttributes>,
    material: Material,
    localToWorldMatrix: Matrix3,
    start: number = 0,
    end: number = -1
  ): FaceData[] {
    let faces: FaceData[] = [];
    const indices = geometry.index.array;

    if (end == -1) end = indices.length;

    for (let i = start; i < end - 2; i += 3) {
      const vertexIndices = [indices[i], indices[i + 1], indices[i + 2]];

      const vertices = this.createVertexDataForVertices(
        geometry,
        vertexIndices,
        localToWorldMatrix
      );

      const face = new FaceData({
        material: material,
        a: vertices[0],
        b: vertices[1],
        c: vertices[2],
      });

      faces.push(face);
    }

    return faces;
  }

  private static createVertexDataForVertices(
    geometry: BufferGeometry<NormalBufferAttributes>,
    vertexIndices: number[],
    localToWorldMatrix: Matrix3
  ): VertexData[] {
    const positions = geometry.attributes.position;
    const uvs = geometry.attributes.uv;
    const normals = geometry.attributes.normal;

    if (!(positions && uvs && normals))
      throw new Error("Given 'mesh' is invalid"); //TODO: create new error type

    let vertices: VertexData[] = [];
    vertexIndices.forEach((index) => {
      const localPosition = new Vector3(
        positions.getX(index),
        positions.getY(index),
        positions.getZ(index)
      );

      const localNormal = new Vector3(
        normals.getX(index),
        normals.getY(index),
        normals.getZ(index)
      );
      const uv = new Vector2(uvs.getX(index), uvs.getY(index));

      vertices.push({
        position: localPosition.applyMatrix3(localToWorldMatrix),
        normal: localNormal.applyMatrix3(localToWorldMatrix).normalize(),
        uv: uv,
      });
    });

    return vertices;
  }
}
