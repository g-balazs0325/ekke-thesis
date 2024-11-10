import { BufferGeometry, Face, Material, Mesh, NormalBufferAttributes, Vector2, Vector3 } from "three";

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

    static createFromMesh(mesh: Mesh, originalFace: Face): FaceData {
        const geometry = mesh.geometry;
        const materials = mesh.material;
        
        const material = Array.isArray(materials) ? materials[originalFace.materialIndex] : materials;
        
        const vertexIndices = [originalFace.a, originalFace.b, originalFace.c];
        const vertices = this.createVertexDataForVertices(geometry, vertexIndices);

        return new FaceData({
            material: material,
            a: vertices[0],
            b: vertices[1],
            c: vertices[2]
        });
    }

    private static createVertexDataForVertices(geometry: BufferGeometry<NormalBufferAttributes>, vertexIndices: number[]): VertexData[] {
        const positions = geometry.attributes.position;
        const uvs = geometry.attributes.uv;
        const normals = geometry.attributes.normal;
        if(!(positions && uvs && normals))
            throw new Error("Given 'mesh' is invalid"); //TODO: create new error type
        
        let vertices: VertexData[] = [];
        vertexIndices.forEach(index => {
            vertices.push({
                position: new Vector3(positions.getX(index), positions.getY(index), positions.getZ(index)),
                normal: new Vector3(normals.getX(index), normals.getY(index), normals.getZ(index)),
                uv: new Vector2(uvs.getX(index), uvs.getY(index))
            });
        });

        return vertices;
    }
}