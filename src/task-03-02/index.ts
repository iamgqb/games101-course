import { initShaders, flatPoints } from '../utils';
import { createTranslateM4, createRotateZM4, createRotateXM4, createRotateYM4, createOrthProjection, createScaleM4 } from '../utils/m';
import { mat4, vec3, glMatrix } from 'gl-matrix';
import objLoader from '../utils/objLoader';
import imgLoader from '../utils/imgLoader';
import { transpose, inverse } from '../utils/glsl';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
if (!canvas) {
    throw new Error('no canvas');
}

// const colorA = [123.0 / 255.0, 178.0 / 255.0, 79.0 / 255.0, 1.0];
const colorA = [1.0, 1.0, 1.0, 1.0];

// const orthProjection = createOrthProjection(
//     3, -3,
//     3, -3,
//     10, -10
// );
const orthProjection = mat4.perspective(
    mat4.create(),
    glMatrix.toRadian(60),
    1,
    0.1,
    1000
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
    attribute vec3 a_normal; // 各点 normal
    attribute vec2 a_texture;
    uniform mat4 u_project;
    uniform mat4 u_view;
    uniform mat4 u_model;

    varying vec3 v_position;
    varying vec3 v_normal;
    varying vec2 v_texture;

    void main() {
        vec4 position = u_project * u_view * u_model * a_position;

        // normal 插值时不要projection
        mat4 u_world = inverse(u_view * u_model);
        v_normal = normalize(u_world * vec4(a_normal, 0.0)).xyz;

        v_position = position.xyz;
        v_texture = a_texture;
        gl_Position = position;
    }
`;

const fragmentShader = `
    precision mediump float;
    uniform vec4 u_color;
    uniform vec3 u_lightPos; // 光源位置
    uniform vec3 u_eyePos; // 视角位置
    uniform sampler2D u_sampler;

    varying vec3 v_position;
    varying vec3 v_normal;
    varying vec2 v_texture;

    vec3 lightPos = u_lightPos;
    vec3 lightDir = normalize(u_lightPos); // 假定照向原点
    vec3 eyePos = u_eyePos;

    float ambient = 0.1; // 环境光
    float I = 100.0; // 光强

    void main() {
        float light = 0.0;
        float specular = 0.0;

        vec3 lightToSurface = normalize(lightPos - v_position);
        vec3 viewToSurface = normalize(eyePos - v_position);

        float r = length(lightPos - v_position);
        float diffuse = I / r / r * max(dot(lightToSurface, v_normal), 0.0);

        vec3 h = normalize(viewToSurface + lightToSurface);

        if (dot(lightDir, lightToSurface) > 0.0) { // 聚光灯
            light = diffuse + ambient;
            specular = I / r / r * pow(max(dot(h, v_normal), 0.0), 100.0);
        }


        // gl_FragColor = u_color;
        gl_FragColor = texture2D(u_sampler, v_texture);
        gl_FragColor.rgb *= light;
        gl_FragColor.rgb += specular;
        // gl_FragColor = vec4(color.rgb, 1.0);
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
const textureAttribLocation = gl.getAttribLocation(program, 'a_texture');

const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
const modelUniformLocation = gl.getUniformLocation(program, 'u_model');
const projectUniformLocation = gl.getUniformLocation(program, 'u_project');
const viewUniformLocation = gl.getUniformLocation(program, 'u_view');
const lightUniformLocation = gl.getUniformLocation(program, 'u_lightPos');
const eyeUniformLocation = gl.getUniformLocation(program, 'u_eyePos');


async function main(gl: WebGLRenderingContext) {
    const img = await imgLoader('../models/spot/spot_texture.png');

    const {
        faces,
        vertices,
        textures,
        normals,
    } = await objLoader('../models/spot/spot_triangulated_good.obj');

    const mergeVertex: number[] = [];
    const mergeNormal: number[] = [];
    const mergeTexture: number[] = [];

    faces.forEach(face => {
        face.indices.forEach(idx => {
            const vertex = vertices[idx - 1];
            mergeVertex.push(vertex[0], vertex[1], vertex[2]);
        });
        face.normal.forEach(idx => {
            mergeNormal.push(...normals[idx - 1]);
        });
        face.texture.forEach(idx => {
            const texture = textures[idx - 1];
            mergeTexture.push(texture[0], 1 - texture[1]);
        })
    });

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mergeVertex), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttribLocation);
    gl.vertexAttribPointer(
        positionAttribLocation, 3, gl.FLOAT, false, 0, 0
    );

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mergeNormal), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(normalAttribLocation);
    gl.vertexAttribPointer(
        normalAttribLocation, 3, gl.FLOAT, false, 0, 0
    );

    const textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mergeTexture), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(textureAttribLocation);
    gl.vertexAttribPointer(
        textureAttribLocation, 2, gl.FLOAT, false, 0, 0
    );

    const sampler = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, sampler);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);


    gl.useProgram(program);

    gl.uniform4fv(colorUniformLocation, new Float32Array(colorA));
    gl.uniform3f(lightUniformLocation, 10.0, 6.0, 0.0); // 光源位置
    gl.uniform3f(eyeUniformLocation, 0.0, 0.0, 4.0); // eye
    
    gl.uniformMatrix4fv(viewUniformLocation, false, view);
    gl.uniformMatrix4fv(projectUniformLocation, false, orthProjection);
    gl.uniformMatrix4fv(modelUniformLocation, false, transform);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);


    const identity = mat4.identity(mat4.create());
    const translate = createTranslateM4(-1, 0, 0);
    const translateT = mat4.invert(mat4.create(), translate);
    const scale = createScaleM4(-1, 1, 1);
    let rotateY = 0;
    // mat4.multiply(transform, transform, createScaleM4(2, 2, 2));
    // mat4.multiply(transform, transform, createRotateXM4(Math.asin(1/Math.sqrt(3))));
    // mat4.multiply(transform, transform, createRotateZM4(glMatrix.toRadian(45)));
    function raf() {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // mat4.multiply(transform, identity, scale);
        mat4.multiply(transform, identity, createRotateYM4(glMatrix.toRadian(rotateY++)))

        gl.uniformMatrix4fv(modelUniformLocation, false, transform);

        gl.drawArrays(gl.TRIANGLES, 0, mergeVertex.length / 3);

        requestAnimationFrame(() => {
            raf();
        });
    }

    raf();

}

main(gl);