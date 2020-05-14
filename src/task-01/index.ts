import { initShaders, createFloatArray32, flatMatrix, degree2radian } from '../utils';
import { createOrthProjection, createTranslateM4, createPoint3d, createPerspectiveProjection, createRotateZM4 } from '../utils/m';
import Matrix from 'ml-matrix';

const p0 = createPoint3d(0, 0, -10);
const p1 = createPoint3d(0, 200, -10);
const p2 = createPoint3d(200, 0, -10);
const p3 = createPoint3d(0, 0, -20);
const p4 = createPoint3d(-200, 0, -20);
const p5 = createPoint3d(0, -100, -20);
const points = [p0, p1, p2]

const orthProjection = createOrthProjection(
    300, -300,
    300, -300,
    -5, -25
);

let near = -10;
let far = -20;
let perspectiveProjection = createPerspectiveProjection(
    degree2radian(60),
    1 / 1,
    near, far
);

const T = {
    x: 0,
    y: 0,
    zRotate: 0,
}
let modelMatrix = Matrix.identity(4);

window.addEventListener('keydown', (e: KeyboardEvent) => {
    switch (e.key) {
        case 'a': T.zRotate++; break;
        case 'd': T.zRotate--; break;
        // case 'w': T.y++; break;
        // case 's': T.y--; break;
        // case 'a': far+=0.01; break;
        // case 'd': far-=0.01; break;
        // case 'w': near+=0.01; break;
        // case 's': near-=0.01; break;
        default: return;
    }

    perspectiveProjection = createPerspectiveProjection(
        degree2radian(60),
        1 / 1,
        near, far
    );
    

    const rotateM = createRotateZM4(degree2radian(T.zRotate));
    const translateM = createTranslateM4(T.x, T.y, 0);
    modelMatrix = translateM.mmul(rotateM);
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
const positionValue = createFloatArray32(points);
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

    gl.uniformMatrix4fv(projectionUniformLocation, false, new Float32Array(flatMatrix(perspectiveProjection)));

    gl.uniformMatrix4fv(modelUniformLocation, false, new Float32Array(flatMatrix(modelMatrix)));

    gl.drawArrays(gl.LINE_LOOP, 0, points.length);

    requestAnimationFrame(() => {
        draw(gl);
    });
}

draw(gl);