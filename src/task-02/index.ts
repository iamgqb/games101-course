import { initShaders, flatPoints, degree2radian } from '../utils';
import { createTranslateM4, createPerspectiveProjection, createRotateZM4 } from '../utils/m';
import { mat4, vec3, vec2 } from 'gl-matrix';
import Bbx2d from '../utils/bbx';
const canvas = document.querySelector<HTMLCanvasElement>('#stage');
if (!canvas) {
    throw new Error('no canvas');
}

const p0 = vec3.fromValues(2, 0, -2);
const p1 = vec3.fromValues(0, 2, -2);
const p2 = vec3.fromValues(-2, 0, -2);

const p3 = vec3.fromValues(3.5, -1, -5);
const p4 = vec3.fromValues(2.5, 1.5, -5);
const p5 = vec3.fromValues(-1, 0.5, -5);

const colorA = [217.0, 238.0, 185.0];
const colorB = [185.0, 217.0, 238.0];

const perspectiveProjection = createPerspectiveProjection(
    degree2radian(45),
    1 / 1,
    2, 50
);


const w = canvas.width;
const h = canvas.height;

// 记录下 z 与 color; 纯粹的模拟记录
const colorWithZ: {
    [key:string] : {
        z: number,
        color: number[]
    }
} = {

}

// 这里写死了 Z, 应该要算深度插值的
function triangleTest(data: vec3[], color: number[], z: number) {
    const triangle = data.map(v => {
        vec3.transformMat4(v, v, perspectiveProjection);
        return vec3.fromValues(v[0] * w + w , v[1] * h + h, v[2]);
    }) as [vec2, vec2, vec2];
    const bbx = new Bbx2d(triangle);

    const minX = Math.floor(bbx.min[0]);
    const minY = Math.floor(bbx.min[1]);
    const maxX = Math.floor(bbx.max[0]);
    const maxY = Math.floor(bbx.max[1]);

    for (let i = minX; i < maxX; i++) {
        for (let j = minY; j < maxY; j++) {
            // 这里可以 msaa 一下, 把color的alpha值记录下来
            const testP = vec2.fromValues(i + 0.5, j + 0.5);
            if (isInTriangle(testP, triangle)) {
                const key = `${i}:${j}`;
                const val = colorWithZ[key];
                if (val) {
                    if (z > val.z) {
                        val.color = color;
                    }
                } else {
                    colorWithZ[key] = {
                        color,
                        z
                    }
                }
            }
        }
    }
}

triangleTest([p0, p1, p2], colorA, -2);
triangleTest([p3, p4, p5], colorB, -5);

const points: vec3[] = [];
const color: number[] = [];

Object.keys(colorWithZ).forEach(key => {
    const splitV = key.split(':');
    const x = parseInt(splitV[0], 10);
    const y = parseInt(splitV[1], 10);
    points.push(vec3.fromValues(x / w - 1, y / h - 1, 0));
    color.push(...colorWithZ[key].color);
})

// console.log(points, color)

const vertexShader = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    varying vec4 v_color;

    void main() {
        gl_Position = a_position;
        gl_PointSize = 1.0;
        v_color = a_color;
    }
`;

const fragmentShader = `
    precision mediump float;
    varying vec4 v_color;

    void main() {
        float r = v_color.r / 255.0;
        float g = v_color.g / 255.0;
        float b = v_color.a / 255.0;
        gl_FragColor = vec4(r, g, b, 1);
    }
`;

const gl = canvas?.getContext('webgl', {
    antialias: false, // 去掉抗锯齿
});
if (!gl) {
    throw new Error('no ctx');
}

// init program
const program = initShaders(gl, vertexShader, fragmentShader);

// get location
const positionAttribLocation = gl.getAttribLocation(program, 'a_position');
const colorAttribLocation = gl.getAttribLocation(program, 'a_color');

// create point buffer And bind
const positionValue = flatPoints(points);
// console.log(positionValue)
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positionValue, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionAttribLocation);
gl.vertexAttribPointer(
    positionAttribLocation, 3, gl.FLOAT, false, 0, 0
);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
gl.enableVertexAttribArray(colorAttribLocation);
gl.vertexAttribPointer(
    colorAttribLocation, 3, gl.FLOAT, false, 0, 0
);

gl.useProgram(program);

function draw(gl: WebGLRenderingContext) {
    // gl.clearColor(0, 0, 0, 0);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.POINTS, 0, points.length);

    requestAnimationFrame(() => {
        draw(gl);
    });
}

draw(gl);


function isInTriangle(point: vec2, triangle: [vec2, vec2, vec2]) {
    const p0 = triangle[0];
    const p1 = triangle[1];
    const p2 = triangle[2];

    const v01 = vec2.sub(vec2.create(), p0, p1);
    const v12 = vec2.sub(vec2.create(), p1, p2);
    const v20 = vec2.sub(vec2.create(), p2, p0);

    const v0p = vec2.sub(vec2.create(), p0, point);
    const v1p = vec2.sub(vec2.create(), p1, point);
    const v2p = vec2.sub(vec2.create(), p2, point);

    const t0 = vec2.cross(vec3.create(), v01, v0p);
    const t1 = vec2.cross(vec3.create(), v12, v1p);
    const t2 = vec2.cross(vec3.create(), v20, v2p);

    return (t0[2] <= 0 && t1[2] <= 0 && t2[2] <= 0) || (t0[2] >= 0 && t1[2] >= 0 && t2[2] >= 0)
}