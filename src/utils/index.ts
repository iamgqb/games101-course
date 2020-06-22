import { vec2, vec3 } from "gl-matrix";

export function initShaders(
    gl: WebGLRenderingContext,
    vertexShaderString: string,
    fragmentShaderString: string)
{
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
        throw new Error('create Vertex Shader Error');
    }
    gl.shaderSource(vertexShader, vertexShaderString);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
        throw new Error('create Fragment Shader Error');
    }
    gl.shaderSource(fragmentShader, fragmentShaderString);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    if (!program) {
        throw new Error('create Program Error');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    return program;
}

export function flatPoints(val: vec2[] | vec3[]) {
    if (val.length === 0) {
        return new Float32Array();
    }

    const dimension = val[0].length;
    const res: number[] = [];

    for (const v of val) {
        if (v.length !== dimension) {
            throw new Error('different dimension');
        }
        res.push(...v);
    }

    return new Float32Array(res);
}

export function degree2radian(degree: number) {
    return degree / 180 * Math.PI;
}

export function createCube() {
    const p0 = vec3.fromValues(0, 0, 0);
    const p1 = vec3.fromValues(0, 1, 0);
    const p2 = vec3.fromValues(1, 1, 0);
    const p3 = vec3.fromValues(1, 0, 0);
    const p4 = vec3.fromValues(0, 0, 1);
    const p5 = vec3.fromValues(0, 1, 1);
    const p6 = vec3.fromValues(1, 1, 1);
    const p7 = vec3.fromValues(1, 0, 1);

    return [
        p0, p3, p7,
        p0, p7, p4,
        p3, p2, p6,
        p3, p6, p7,
        p2, p1, p5,
        p2, p5, p6,
        p1, p0, p4,
        p1, p4, p5,
        p4, p7, p6,
        p4, p6, p5,
        p3, p0, p1,
        p3, p1, p2,
    ];
}

export function createCubeTexture() {
    const p0 = vec2.fromValues(0, 0);
    const p1 = vec2.fromValues(0, 1);
    const p2 = vec2.fromValues(1, 1);
    const p3 = vec2.fromValues(1, 0);

    return [
        p0, p1, p2,
        p0, p2, p3,
        p0, p1, p2,
        p0, p2, p3,
        p0, p1, p2,
        p0, p2, p3,
        p0, p1, p2,
        p0, p2, p3,
        p0, p1, p2,
        p0, p2, p3,
        p0, p1, p2,
        p0, p2, p3,
    ];
}

/**
   * Creates XY plane vertices.
*/
export function createPlane(
    width: number,
    depth: number,
    subdivisionsWidth: number,
    subdivisionsDepth: number,
) {
  width = width || 1;
  depth = depth || 1;
  subdivisionsWidth = subdivisionsWidth || 1;
  subdivisionsDepth = subdivisionsDepth || 1;

  const positions: vec3[] = [];
  const normals: vec3[] = []
  const texcoords: vec2[] = [];

  for (let y = 0; y <= subdivisionsDepth; y++) {
    for (let x = 0; x <= subdivisionsWidth; x++) {
      const u = x / subdivisionsWidth;
      const v = y / subdivisionsDepth;
      positions.push(vec3.fromValues(
          width * u - width * 0.5,
          depth * v - depth * 0.5,
          0,
      ));
      normals.push(vec3.fromValues(0, 0, 1));
      texcoords.push(vec2.fromValues(u, v));
    }
  }

  const numVertsAcross = subdivisionsWidth + 1;
  const indices: number[] = [];

  for (let z = 0; z < subdivisionsDepth; z++) {
    for (let x = 0; x < subdivisionsWidth; x++) {
      // Make triangle 1 of quad.
      indices.push(
          (z + 0) * numVertsAcross + x,
          (z + 0) * numVertsAcross + x + 1,
          (z + 1) * numVertsAcross + x + 1);

      // Make triangle 2 of quad.
      indices.push(
          (z + 0) * numVertsAcross + x,
          (z + 1) * numVertsAcross + x + 1,
          (z + 1) * numVertsAcross + x);
    }
  }

  return {
      indices,
      positions,
      normals,
      texcoords,
  }

}