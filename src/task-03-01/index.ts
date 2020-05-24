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
// const colorA = [1.0, 1.0, 1.0, 1.0];

const orthProjection = createOrthProjection(
    3, -3,
    3, -3,
    10, -10
)
// const orthProjection = mat4.perspective(mat4.create(),
// glMatrix.toRadian(45), 1, 0.1, 100);
const view = mat4.lookAt(mat4.create(), vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0))
mat4.multiply(orthProjection, orthProjection, view)

const cube = [
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

    varying vec4 v_position;
    varying vec4 v_normal;

    void main() {
        vec4 position = u_project * u_model * a_position;

        v_normal = normalize(u_project * u_model * vec4(a_normal, 0.0));

        v_position = position;
        gl_Position = position;
    }
`;

const fragmentShader = `
    precision mediump float;
    uniform vec4 u_color;
    uniform vec3 u_lightPos; // 光源位置
    uniform vec3 u_eyePos; // 视角位置

    varying vec4 v_position;
    varying vec4 v_normal;

    vec4 lightPos = vec4(u_lightPos, 1.0);
    vec4 eyePos = vec4(u_eyePos, 1.0);

    float ambient = 0.4; // 环境光
    float I = 50.0; // 光强

    void main() {
        vec4 lightDir = normalize(lightPos - v_position);

        float r = length(lightPos - v_position);
        float diffuse = I / r / r * max(dot(lightDir, v_normal), 0.0);

        vec4 eyeDir = normalize(eyePos - v_position);
        vec4 h = normalize((eyeDir + lightDir) / 2.0);
        float specular = pow(max(dot(h, v_normal), 0.0), 200.0);

        vec4 color = specular * vec4(1.0, 1.0, 1.0, 1.0) + (ambient + diffuse) * u_color;

        gl_FragColor = vec4(color.rgb, 1.0);
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
const lightUniformLocation = gl.getUniformLocation(program, 'u_lightPos');
const eyeUniformLocation = gl.getUniformLocation(program, 'u_eyePos');

// create point buffer And bind
const positionValue = flatPoints(cube);
const normalValue = [];
for(let i = 0; i < cube.length; i+=3) {
    const p0 = cube[i];
    const p1 = cube[i + 1];
    const p2 = cube[i + 2];
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
gl.uniform3f(lightUniformLocation, 20.0, 0.0, 0.0); // 光源位置
gl.uniform3f(eyeUniformLocation, 0.0, 0.0, 5.0); // eye

gl.enable(gl.CULL_FACE)
let angleX = 0;
let angleY = 45;
let angleZ = 0;
function draw(gl: WebGLRenderingContext) {
    // gl.clearColor(0, 0, 0, 0);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    // angleX -= 0.1;
    angleY -= 0.1;
    // angleZ -= 0.1;

    const transform = mat4.identity(mat4.create());
    const translate = createTranslateM4(-1, -1, 3);
    const translateI = mat4.invert(mat4.create(), translate);

    // mat4.multiply(transform, transform, translateI);
    mat4.multiply(transform, transform, createRotateZM4(glMatrix.toRadian(angleZ)))
    mat4.multiply(transform, transform, createRotateYM4(glMatrix.toRadian(angleY)))
    mat4.multiply(transform, transform, createRotateXM4(glMatrix.toRadian(angleX)))
    mat4.multiply(transform, transform, translate);

    gl.uniformMatrix4fv(projectUniformLocation, false, orthProjection);
    gl.uniformMatrix4fv(modelUniformLocation, false, transform);

    gl.drawArrays(gl.TRIANGLES, 0, cube.length);

    requestAnimationFrame(() => {
        draw(gl);
    });
}

draw(gl);