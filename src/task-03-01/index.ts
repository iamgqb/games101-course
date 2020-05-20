import { initShaders, flatPoints } from '../utils';
import { createTranslateM4, createRotateZM4, createRotateXM4, createRotateYM4, createOrthProjection } from '../utils/m';
import { mat4, vec3, glMatrix } from 'gl-matrix';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
if (!canvas) {
    throw new Error('no canvas');
}

const p0 = vec3.fromValues(0, 0, -2);
const p1 = vec3.fromValues(2, 0, -2);
const p2 = vec3.fromValues(2, 0, -4);
const p3 = vec3.fromValues(0, 0, -4);
const p4 = vec3.fromValues(0, 2, -2);
const p5 = vec3.fromValues(2, 2, -2);
const p6 = vec3.fromValues(2, 2, -4);
const p7 = vec3.fromValues(0, 2, -4);

const colorA = [123.0 / 255.0, 178.0 / 255.0, 79.0 / 255.0, 1.0];

const orthProjection = createOrthProjection(
    3, -3,
    3, -3,
    10, -10
)

const tetrahedron = [
    p0, p1, p5,
    p0, p5, p4,
    p1, p2, p6,
    p1, p6, p5,
    p3, p0, p4,
    p3, p4, p7,
    p2, p3, p7,
    p2, p7, p6,
    p4, p5, p6,
    p4, p6, p7,
    p1, p0, p3,
    p1, p3, p2,
];

const vertexShader = `
    attribute vec4 a_position;
    attribute vec3 a_normal; // 各点 normal
    uniform mat4 u_project;
    uniform mat4 u_model;
    uniform vec3 u_light; // 光源位置
    varying float percent; // 计算得的明暗

    void main() {
        vec4 light = vec4(u_light, 0.0);
        vec4 position = u_project * u_model * a_position;

        vec4 normal = normalize(u_project * u_model * vec4(a_normal, 0.0));
        vec4 ray = normalize(light - position);

        float r = length(light - position);

        float I = 300.0; // 光强
        percent = I / r / r * max(dot(ray, normal), 0.0);
        gl_Position = position;
    }
`;

const fragmentShader = `
    precision mediump float;
    uniform vec4 u_color;
    varying float percent;

    void main() {
        gl_FragColor = u_color;
        gl_FragColor.rgb *= percent;
    }
`;

const gl = canvas?.getContext('webgl');
if (!gl) {
    throw new Error('no ctx');
}

// init program
const program = initShaders(gl, vertexShader, fragmentShader);

// get location
const positionAttribLocation = gl.getAttribLocation(program, 'a_position');
const normalAttribLocation = gl.getAttribLocation(program, 'a_normal');
const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
const modelUniformLocation = gl.getUniformLocation(program, 'u_model');
const projectUniformLocation = gl.getUniformLocation(program, 'u_project');
const lightUniformLocation = gl.getUniformLocation(program, 'u_light');

// create point buffer And bind
const positionValue = flatPoints(tetrahedron);
const normalValue = [];
for(let i = 0; i < tetrahedron.length; i+=3) {
    const p0 = tetrahedron[i];
    const p1 = tetrahedron[i + 1];
    const p2 = tetrahedron[i + 2];
    const vA = vec3.sub(vec3.create(), p1, p0);
    const vB = vec3.sub(vec3.create(), p2, p1);
    const n = vec3.cross(vec3.create(), vA, vB);
    normalValue.push(n, n, n);
}

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positionValue, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionAttribLocation);
gl.vertexAttribPointer(
    positionAttribLocation, 3, gl.FLOAT, false, 0, 0
);

const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, flatPoints(normalValue), gl.STATIC_DRAW);
gl.enableVertexAttribArray(normalAttribLocation);
gl.vertexAttribPointer(
    normalAttribLocation, 3, gl.FLOAT, false, 0, 0
);

gl.useProgram(program);

gl.uniform4fv(colorUniformLocation, new Float32Array(colorA));
gl.uniform3f(lightUniformLocation, 0.0, 0.0, 14.0); // 光源位置

gl.enable(gl.CULL_FACE)
let angleX = 0;
let angleY = 0;
let angleZ = 0;
function draw(gl: WebGLRenderingContext) {
    // gl.clearColor(0, 0, 0, 0);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    angleX += 0.1;
    angleY += 0.2;
    angleZ += 0.3;

    const transform = mat4.identity(mat4.create());
    const translate = createTranslateM4(-1, -1, 3);
    const translateI = mat4.invert(mat4.create(), translate);

    mat4.multiply(transform, transform, translateI);
    mat4.multiply(transform, transform, createRotateZM4(glMatrix.toRadian(angleZ)))
    mat4.multiply(transform, transform, createRotateYM4(glMatrix.toRadian(angleY)))
    mat4.multiply(transform, transform, createRotateXM4(glMatrix.toRadian(angleX)))
    mat4.multiply(transform, transform, translate);

    gl.uniformMatrix4fv(projectUniformLocation, false, orthProjection);
    gl.uniformMatrix4fv(modelUniformLocation, false, transform);

    gl.drawArrays(gl.TRIANGLES, 0, tetrahedron.length);

    requestAnimationFrame(() => {
        draw(gl);
    });
}

draw(gl);