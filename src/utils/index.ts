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