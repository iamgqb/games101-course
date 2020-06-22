import { initShaders, flatPoints, createCube, createCubeTexture, createPlane } from '../utils';
import { mat4, vec3, glMatrix, vec2, vec4 } from 'gl-matrix';

import { transpose, inverse, intersectBox, translate } from '../utils/glsl';
import imgLoader from '../utils/imgLoader';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
if (!canvas) {
    throw new Error('no canvas');
}

const projection = mat4.perspective(mat4.create(),
glMatrix.toRadian(60), 1, 0.1, 1000)

const view = mat4.lookAt(
    mat4.create(),
    vec3.fromValues(2, -4, 4),
    vec3.fromValues(0, 0, 0),
    vec3.fromValues(0, 1, 0),
);

const transform = mat4.identity(mat4.create());


const vertexShader = `
    attribute vec3 a_position;
    attribute vec3 a_color;
    attribute vec2 a_texture;

    uniform mat4 u_project;
    uniform mat4 u_view;
    uniform mat4 u_model;

    varying vec3 v_color;
    varying vec2 v_texture;
    varying vec2 v_position;

    void main() {
        // vec4 position = u_project * u_view * u_model * vec4(a_position, 1.0);

        v_color = a_color;
        v_texture = a_texture;
        v_position = vec2(a_position.x, a_position.y);
        gl_Position = vec4(a_position, 1.0);
        // gl_Position = position;
    }
`;

const fragmentShader = `
    precision mediump float;

    ${translate}

    ${intersectBox}

    varying vec2 v_position;
    varying vec3 v_color;
    varying vec2 v_texture;

    uniform sampler2D u_sampler0;
    uniform sampler2D u_sampler1;
    uniform vec3 u_cameraPos;
    uniform vec3 u_light;

    // vec3 light = vec3(6.0, 6.0, 10.0);
    vec3 light = u_light;
    vec3 lightTo = normalize(light - vec3(0.0, 0.0, 0.0));

    // vec3 cameraPos = vec3(6.0, -6.0, 6.0);
    vec3 cameraPos = u_cameraPos;
    vec3 lookAt = vec3(0.0, 0.0, 0.0);
    vec3 cameraUp = vec3(0.0, 0.0, 1.0);

    // camera matrix
    vec3 ww = normalize(lookAt - cameraPos);
    vec3 uu = normalize(cross(ww, cameraUp));
    vec3 vv = normalize(cross(uu, ww));

    vec3 box = vec3(0.5, 0.5, 0.5); // box size
    vec3 planePoint = vec3(0.0, 0.0, 0.0);
    vec3 planeNormal = vec3(0.0, 0.0, 1.0);
    vec2 planeSize = vec2(10.0, 10.0);

    vec2 mappingBox(vec3 point, vec3 nor) {
        if (nor.x > 0.0) {
            return 1.0 / vec2(box.yz) * point.yz * 0.5 + 0.5;
        }
        if (nor.x < 0.0) {
            return 1.0 / vec2(box.yz) * vec2(-point.y, point.z) * 0.5 + 0.5;
        }
        if (nor.y > 0.0) {
            return 1.0 / vec2(box.xz) * vec2(-point.x, point.z) * 0.5 + 0.5;
        }
        if (nor.y < 0.0) {
            return 1.0 / vec2(box.xz) * point.xz * 0.5 + 0.5;
        }
        if (nor.z > 0.0){
            return 1.0 / vec2(box.xy) * point.xy * 0.5 + 0.5;
        }
        if (nor.z < 0.0){
            return 1.0 / vec2(box.xy) * vec2(-point.x, point.y) * 0.5 + 0.5;
        }
    }

    void main() {
        vec3 ray = normalize(v_position.x*uu + v_position.y*vv + 2.0*ww);
        mat4 txx = inverse(translate(0.0, 0.0, 0.5)); // box放在原点

        float tMin = 1000.0;
        vec3 nor = vec3(0.0);
        vec3 iPoint = vec3(0.0);
        float iid = 0.0;

        float t = dot(planePoint - cameraPos, planeNormal) / dot(ray, planeNormal);
        if (t > 0.0) {
            vec3 intersectP = cameraPos + ray * t;
            if (
                intersectP.x > -planeSize.x && intersectP.x < planeSize.x &&
                intersectP.y > -planeSize.y && intersectP.y < planeSize.y
            ) {
                iPoint = intersectP;
                tMin = t;
                nor = planeNormal;
                iid = 1.0;
            }
        }

        vec4 res = intersectBox(cameraPos, ray, txx, box);
        vec3 intersect = res.x * ray + cameraPos;
        if (res.x > 0.0 && res.x < tMin) {
            iPoint = (txx*vec4(intersect, 1.0)).xyz;
            nor = normalize((txx*vec4(res.yzw, 0.0))).xyz;

            vec2 uv = mappingBox(iPoint, nor);
            iid = 2.0;

            gl_FragColor = texture2D(u_sampler1, vec2(uv.x, 1.0 - uv.y));
        }

        if (iid > 1.5) {
            // box
        } else {
            if (iid > 0.5) {
                // plane
                // shadow on plane
                vec3 shadowRay = light - iPoint;
                vec4 res = intersectBox(iPoint, shadowRay, txx, box);
                if (res.x > 0.0) {
                    gl_FragColor = vec4(0, 0, 0, 1.0);
                } else {
                    gl_FragColor = texture2D(u_sampler0, vec2(iPoint));
                }
                // gl_FragColor = texture2D(u_sampler0, vec2(iPoint));

            } else {
                gl_FragColor = vec4(0, 0, 0, 1.0);
            }
        }

        vec3 lightRay = normalize(light - iPoint);
        float r = length(light - iPoint);
        if (dot(lightRay, lightTo) > 0.0) {
            float diffuse = 50.0 / r / r * max(dot(nor, lightRay), 0.0);

            gl_FragColor.rgb = (0.2 + diffuse) * gl_FragColor.rgb;
        } else {
            gl_FragColor.rgb = 0.2 * gl_FragColor.rgb;
        }



        // gl_FragColor = texture2D(u_sampler, v_texture);
        // gl_FragColor = vec4(-1.0, -1.0, 1.0, 1.0);
        // gl_FragColor = vec4(v_color.xyz, 1.0);
        // gl_FragColor = vec4(v_position, 1.0, 1.0);
    }
`;

const gl = canvas?.getContext('webgl', {
    antialias: true,
});
if (!gl) {
    throw new Error('no ctx');
}

// init program
const program = initShaders(gl, vertexShader, fragmentShader);

// get location
const positionAttribLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionAttribLocation);
const colorAttribLocation = gl.getAttribLocation(program, 'a_color');
gl.enableVertexAttribArray(colorAttribLocation);
const textureAttribLocation = gl.getAttribLocation(program, 'a_texture');
gl.enableVertexAttribArray(textureAttribLocation);

const modelUniformLocation = gl.getUniformLocation(program, 'u_model');
const projectUniformLocation = gl.getUniformLocation(program, 'u_project');
const viewUniformLocation = gl.getUniformLocation(program, 'u_view');
const cameraUniformLocation = gl.getUniformLocation(program, 'u_cameraPos');
const lightUniformLocation = gl.getUniformLocation(program, 'u_light');
const u_image0Location = gl.getUniformLocation(program, "u_sampler0");
const u_image1Location = gl.getUniformLocation(program, "u_sampler1");

async function main(gl: WebGLRenderingContext) {
    const img = await imgLoader('../models/UV_Grid_Sm.jpg');
    const t0 = await imgLoader('../models/t0.jpg');
    
    // const position: vec3[] = createCube();
    const position: vec3[] = [
        vec3.fromValues(1, 1, 1),
        vec3.fromValues(-1, 1, 1),
        vec3.fromValues(1, -1, 1),
        vec3.fromValues(-1, -1, 1),
    ]
    const texture: vec2[] = createCubeTexture();
    const color: vec3[] = new Array(position.length).fill(vec3.fromValues(0, 1, 0));

    // const plane = createPlane(5, 5, 4, 4);
    // plane.indices.forEach((pos, idx) => {
    //     position.push(
    //         plane.positions[pos]
    //     );

    //     let tex = vec2.create();
    //     switch (idx % 6) {
    //         case 0:
    //         case 3: tex = vec2.fromValues(0, 0); break;
    //         case 2:
    //         case 4: tex = vec2.fromValues(1, 1); break;
    //         case 1: tex = vec2.fromValues(1, 0); break;
    //         case 5: tex = vec2.fromValues(0, 1); break;
    //     }

    //     texture.push(
    //         tex
    //     );

    //     color.push(
    //         (idx / 6 >>> 0) % 2 === 0 ?
    //         vec3.fromValues(1, 0, 0) :
    //         vec3.fromValues(0, 0, 1)
    //     );
    // })

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatPoints(position), gl.STATIC_DRAW);
    gl.vertexAttribPointer(
        positionAttribLocation, 3, gl.FLOAT, false, 0, 0
    );

    const textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatPoints(texture), gl.STATIC_DRAW);
    gl.vertexAttribPointer(
        textureAttribLocation, 2, gl.FLOAT, false, 0, 0
    );

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatPoints(color), gl.STATIC_DRAW);
    gl.vertexAttribPointer(
        colorAttribLocation, 3, gl.FLOAT, false, 0, 0
    );

    const sampler = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sampler);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, sampler);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, t0);
    gl.generateMipmap(gl.TEXTURE_2D);

    const uvImg = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, uvImg);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.useProgram(program);

    gl.uniformMatrix4fv(viewUniformLocation, false, view);
    gl.uniformMatrix4fv(projectUniformLocation, false, projection);
    gl.uniformMatrix4fv(modelUniformLocation, false, transform);
    gl.uniform3fv(cameraUniformLocation, [6.0, -6.0, 6.0]);
    gl.uniform1i(u_image0Location, 0);  // texture unit 0
    gl.uniform1i(u_image1Location, 1);  // texture unit 1
    // gl.enable(gl.CULL_FACE);
    // gl.enable(gl.DEPTH_TEST);


    const origin = vec3.fromValues(0, 0, 0);
    const cameraPos = vec3.fromValues(6, -6, 6);
    const light = vec3.fromValues(6, 6, 6);

    let lightRotate = 0;
    function raf() {
        gl.clearColor(0.235294, 0.67451, 0.843137, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, position.length);

        requestAnimationFrame(() => {
            // vec3.rotateZ(cameraPos, cameraPos, origin, glMatrix.toRadian(0.5));
            // gl.uniform3fv(cameraUniformLocation, new Float32Array(cameraPos));

            vec3.rotateZ(light, light, origin, glMatrix.toRadian(0.1));
            gl.uniform3fv(lightUniformLocation, new Float32Array(light));
            raf();
        });
    }

    raf();

}

main(gl);