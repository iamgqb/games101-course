import { initShaders, flatPoints, degree2radian } from '../utils';
import { createOrthProjection, createTranslateM4, createPerspectiveProjection, createRotateZM4 } from '../utils/m';
import { mat4, vec3 } from 'gl-matrix';

const p0 = vec3.fromValues(2, 0, -2);
const p1 = vec3.fromValues(0, 2, -2);
const p2 = vec3.fromValues(-2, 0, -2);

const points = [p0, p1, p2]

const orthProjection = createOrthProjection(
    10, -10,
    10, -10,
    5, -5
);

let near = 2;
let far = 50;
let perspectiveProjection = createPerspectiveProjection(
    degree2radian(45),
    1 / 1,
    near, far
);

const T = {
    x: 0,
    y: 0,
    zRotate: 0,
}
let modelMatrix = mat4.identity(mat4.create());

window.addEventListener('keydown', (e: KeyboardEvent) => {
    switch (e.key) {
        case 'a': T.zRotate++; break;
        case 'd': T.zRotate--; break;
        // case 'w': T.y++; break;
        // case 's': T.y--; break;
        // case 'a': far+=0.01; break;
        // case 'd': far-=0.01; break;
        case 'w': near+=0.01; break;
        case 's': near-=0.01; break;
        default: return;
    }

    perspectiveProjection = createPerspectiveProjection(
        degree2radian(45),
        1 / 1,
        near, far
    );

    const rotateM = createRotateZM4(degree2radian(T.zRotate));
    const translateM = createTranslateM4(T.x, T.y, 0);
    modelMatrix = mat4.multiply(modelMatrix, translateM, rotateM)
})

const vertexShader = `
    attribute vec4 a_position;
    uniform mat4 u_project;
    uniform mat4 u_model;

    void main() {
        gl_Position = u_project * u_model * a_position;
    }
`;

const fragmentShader = `
    precision mediump float;

    void main() {
        gl_FragColor = vec4(0, 0, 0, 1);
    }
`;

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
const gl = canvas?.getContext('webgl');
if (!gl) {
    throw new Error('no ctx');
}

// init program
const program = initShaders(gl, vertexShader, fragmentShader);

// get location
const positionAttribLocation = gl.getAttribLocation(program, 'a_position')
const projectionUniformLocation = gl.getUniformLocation(program, 'u_project');
const modelUniformLocation = gl.getUniformLocation(program, 'u_model');

// create point buffer And bind
const positionValue = flatPoints(points);
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positionValue, gl.STATIC_DRAW);

gl.useProgram(program);

function draw(gl: WebGLRenderingContext) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        positionAttribLocation, 3, gl.FLOAT, false, 0, 0
    );

    gl.uniformMatrix4fv(projectionUniformLocation, false, orthProjection);

    gl.uniformMatrix4fv(modelUniformLocation, false, modelMatrix);

    gl.drawArrays(gl.LINE_LOOP, 0, points.length);

    requestAnimationFrame(() => {
        draw(gl);
    });
}

draw(gl);