import { BufferAttribute, BufferGeometry, Vector3 } from "three";

type ParametricFunction = (u: number, v: number) => number;
type VertexMapItem = {
  indices: number[];
  normal: Vector3;
};
type VertexMap = Map<string, VertexMapItem>;

export class ParametricGeometryGenerator {
  private geometry: BufferGeometry;

  private xFn: ParametricFunction;
  private yFn: ParametricFunction;
  private zFn: ParametricFunction;

  private uStart: number;
  private uEnd: number;
  private uSegments: number;
  private vStart: number;
  private vEnd: number;
  private vSegments: number;

  private state = {
    position: new Array<number>(),
    uv: new Array<number>(),
    index: new Array<number>(),
  };

  public setGeometry(geometry: BufferGeometry): this {
    this.geometry = geometry;
    return this;
  }
  public setXFunction(xFn: ParametricFunction): this {
    this.xFn = xFn;
    return this;
  }
  public setYFunction(yFn: ParametricFunction): this {
    this.yFn = yFn;
    return this;
  }
  public setZFunction(zFn: ParametricFunction): this {
    this.zFn = zFn;
    return this;
  }
  public setUParameters(start: number, end: number, segments: number): this {
    this.uStart = start;
    this.uEnd = end;
    this.uSegments = segments;
    return this;
  }
  public setVParameters(start: number, end: number, segments: number): this {
    this.vStart = start;
    this.vEnd = end;
    this.vSegments = segments;
    return this;
  }

  public generate(): void {
    this.emptyState();

    this.generateShape();
    this.generateNormalsAndTangents();
  }

  private emptyState(): void {
    this.state.position = [];
    this.state.uv = [];
    this.state.index = [];
  }
  private generateShape(): void {
    const uDiff = this.uEnd - this.uStart;
    const vDiff = this.vEnd - this.vStart;

    let u: number, v: number;
    for (let uInd = 0; uInd < this.uSegments + 1; uInd++) {
      u = this.uStart + uDiff * (uInd / this.uSegments);

      for (let vInd = 0; vInd < this.vSegments + 1; vInd++) {
        v = this.vStart + vDiff * (vInd / this.vSegments);

        this.makeVertex(u, v);
        this.makeUVMapCoords(uInd, vInd);
        this.makeFaces(uInd, vInd);
      }
    }

    this.updateShapeAttributes();
  }
  private generateNormalsAndTangents(): void {
    this.geometry.computeVertexNormals();
    this.averageOverlappingVertexNormals();
    this.geometry.computeTangents();
  }

  private makeVertex(u: number, v: number): void {
    const verts = this.state.position;

    const x = this.roundVertexCoord(this.xFn(u, v));
    const y = this.roundVertexCoord(this.yFn(u, v));
    const z = this.roundVertexCoord(this.zFn(u, v));

    verts.push(x, y, z);
  }
  private makeUVMapCoords(uInd: number, vInd: number): void {
    const uvs = this.state.uv;

    const mapU = Math.fround(uInd / this.uSegments);
    const mapV = Math.fround(vInd / this.vSegments);
    uvs.push(mapU, mapV);
  }
  private makeFaces(uInd: number, vInd: number): void {
    if (uInd == 0 || vInd == 0) return;

    const a = this.getSingularIndexFromTwo(uInd - 1, vInd - 1);
    const b = this.getSingularIndexFromTwo(uInd - 1, vInd);
    const c = this.getSingularIndexFromTwo(uInd, vInd - 1);
    const d = this.getSingularIndexFromTwo(uInd, vInd);

    this.makeFaceIfValidTriangle(b, c, d);
    this.makeFaceIfValidTriangle(c, b, a);
  }
  private updateShapeAttributes() {
    const positionArray = new Float32Array(this.state.position);
    const uvArray = new Float32Array(this.state.uv);
    const indexArray = new Uint32Array(this.state.index);

    const positionBuffer = new BufferAttribute(positionArray, 3);
    const uvBuffer = new BufferAttribute(uvArray, 2);
    const indexBuffer = new BufferAttribute(indexArray, 1);

    this.geometry.setAttribute("position", positionBuffer);
    this.geometry.setAttribute("uv", uvBuffer);
    this.geometry.setIndex(indexBuffer);
  }

  private averageOverlappingVertexNormals(): void {
    const normals = this.geometry.getAttribute("normal");

    const map = new Map<string, VertexMapItem>();
    this.fillVertexMap(map);

    for (const mapItem of map.values()) {
      if (mapItem.indices.length <= 1) continue;

      const normal = mapItem.normal.normalize();
      for (const index of mapItem.indices) {
        normals.setXYZ(index, normal.x, normal.y, normal.z);
      }
    }
  }

  private roundVertexCoord(x: number, eps = 1e-15): number {
    const result64 = Math.round(x / eps) * eps;
    return Math.fround(result64);
  }

  private getSingularIndexFromTwo(uInd: number, vInd: number): number {
    return uInd * (this.vSegments + 1) + vInd;
  }
  private makeFaceIfValidTriangle(a: number, b: number, c: number): void {
    const abcIndices = [a, b, c];
    const abcLength = 3;
    for (let abcIndex = 0; abcIndex < abcLength; abcIndex++) {
      const vertIndex1 = abcIndices[abcIndex];
      const vertIndex2 = abcIndices[(abcIndex + 1) % abcLength];

      if (this.verticesOverlap(vertIndex1, vertIndex2)) return;
    }

    const indices = this.state.index;
    for (const abcIndex of abcIndices) indices.push(abcIndex);
  }

  private fillVertexMap(map: VertexMap) {
    const verts = this.geometry.getAttribute("position");
    const normals = this.geometry.getAttribute("normal");

    const tempVector = new Vector3();

    const vertsCount = verts.count;
    for (let i = 0; i < vertsCount; i++) {
      let mapItem: VertexMapItem;

      const vertex = tempVector.fromBufferAttribute(verts, i);
      const key = this.getVertexMapKey(vertex);

      mapItem = map.get(key);
      if (!mapItem) {
        mapItem = { indices: [], normal: new Vector3() };
        map.set(key, mapItem);
      }

      const normal = tempVector.fromBufferAttribute(normals, i);
      mapItem.indices.push(i);
      mapItem.normal.add(normal);
    }
  }

  private verticesOverlap(indexA: number, indexB: number): boolean {
    const verts = this.state.position;

    let fullMatch = true;
    const axes = 3;
    for (let axis = 0; axis < axes; axis++) {
      const coordA = verts[indexA * axes + axis];
      const coordB = verts[indexB * axes + axis];
      fullMatch &&= coordA == coordB;
    }

    return fullMatch;
  }

  private getVertexMapKey(v: Vector3): string {
    return JSON.stringify(v.toArray());
  }
}
