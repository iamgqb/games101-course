import { initShaders, flatPoints } from '../utils';
import { mat4, vec3, glMatrix, vec2, vec4 } from 'gl-matrix';

import { transpose, inverse } from '../utils/glsl';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
if (!canvas) {
    throw new Error('no canvas');
}

const orthProjection = mat4.ortho(mat4.create(),
    0, 600,
    0, 600,
    -10, 10
)

const view = mat4.lookAt(
    mat4.create(),
    vec3.fromValues(0, 0, 4),
    vec3.fromValues(0, 0, 0),
    vec3.fromValues(0, 1, 0),
);

const transform = mat4.identity(mat4.create());


const vertexShader = `
    ${transpose}
    ${inverse}

    attribute vec4 a_position;
    attribute vec4 a_color;

    uniform mat4 u_project;
    uniform mat4 u_view;
    uniform mat4 u_model;

    varying vec4 v_color;

    void main() {
        vec4 position = u_project * u_view * u_model * a_position;
        v_color = a_color;
        gl_PointSize = 3.0;
        gl_Position = position;
    }
`;

const fragmentShader = `
    precision mediump float;
    varying vec4 v_color;

    void main() {
        gl_FragColor = v_color; //vec4(1.0, 0.0, 0.0, 1.0);
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
const colorAttribLocation = gl.getAttribLocation(program, 'a_color');

const modelUniformLocation = gl.getUniformLocation(program, 'u_model');
const projectUniformLocation = gl.getUniformLocation(program, 'u_project');
const viewUniformLocation = gl.getUniformLocation(program, 'u_view');

function naiveBezier(points: vec3[]) {
    const p0 = points[0];
    const p1 = points[1];
    const p2 = points[2];
    const p3 = points[3];

    const p:vec3[] = []
    for (let t = 0; t <= 1.0; t += 0.01) {
        const x = Math.pow(1 - t, 3) * p0[0] + 3 * t * Math.pow(1 - t, 2) * p1[0] + 3 * Math.pow(t, 2) * (1 - t) * p2[0] + Math.pow(t, 3) * p3[0];
        const y = Math.pow(1 - t, 3) * p0[1] + 3 * t * Math.pow(1 - t, 2) * p1[1] + 3 * Math.pow(t, 2) * (1 - t) * p2[1] + Math.pow(t, 3) * p3[1];
        p.push(vec3.fromValues(x, y, 0))
    }
    return p;
}

function recursiveBezier(points: vec3[], t: number): vec3 {

    if (t === 0) {
        return points[0];
    }
    if (t === 1) {
        return points[points.length - 1];
    }

    const recursive: vec3[] = [];
    for (let i = 0; i < points.length - 1; i++) {
        recursive.push(vec3.lerp(vec3.create(), points[i], points[i+1], t));
    }

    if (recursive.length === 1) {
        return recursive[0];
    }

    return recursiveBezier(recursive, t);
}

function deCasteljau(points: vec3[]) {
    const p: vec3[] = []
    for (let t = 0; t <= 1.0; t += 0.001) {
        p.push(recursiveBezier(points, t));
    }
    return p;
}

const control: vec3[] = [];
for (let i = 0; i < 5; i++) {
    control.push(
        vec3.fromValues(
            Math.random() * 600,
            Math.random() * 600,
            0,
        )
    )
}
console.log(control)

// control.push(
//     vec3.fromValues(
//         267.0174255371094,
//         394.6279602050781,
//         0
//     ),
//     vec3.fromValues(
//         235.3860626220703,
//         206.26498413085938,
//         0
//     ),
//     vec3.fromValues(
//         435.6445007324219,
//         173.09451293945312,
//         0
//     ),
//     vec3.fromValues(
//         202.21499633789062,
//         32.04990005493164,
//         0
//     )
// );

async function main(gl: WebGLRenderingContext) {
    const position = deCasteljau(control);
    const color = new Array(position.length).fill(vec4.fromValues(1.0, 0.0, 0.0, 1.0));
    position.push(...control);
    color.push(...new Array(control.length).fill(vec4.fromValues(1.0, 1.0, 1.0, 1.0)));

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatPoints(position), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttribLocation);
    gl.vertexAttribPointer(
        positionAttribLocation, 3, gl.FLOAT, false, 0, 0
    );

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatPoints(color), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorAttribLocation);
    gl.vertexAttribPointer(
        colorAttribLocation, 4, gl.FLOAT, false, 0, 0
    );

    gl.useProgram(program);

    gl.uniformMatrix4fv(viewUniformLocation, false, view);
    gl.uniformMatrix4fv(projectUniformLocation, false, orthProjection);
    gl.uniformMatrix4fv(modelUniformLocation, false, transform);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);


    function raf() {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawArrays(gl.POINTS, 0, position.length);

        requestAnimationFrame(() => {
            raf();
        });
    }

    raf();

}

main(gl);