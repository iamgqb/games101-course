import { mat4 } from "gl-matrix";
import { Matrix } from 'ml-matrix';


export function createVector3d(x: number, y: number, z: number) {
    return new Matrix([
        [x],
        [y],
        [z],
        [0]
    ]);
}

export function createPoint3d(x: number, y: number, z: number) {
    return new Matrix([
        [x],
        [y],
        [z],
        [1],
    ]);
}

export function createPoint2d(x: number, y: number) {
    return new Matrix([
        [x],
        [y],
        [1],
    ]);
}

export function createRotateM3(radian: number) {
    return new Matrix([
        [Math.cos(radian), -Math.sin(radian), 1],
        [Math.sin(radian), Math.cos(radian), 2],
        [0, 0, 1]
    ]);
}


/* M4 */
export function createScaleM4(sx: number, sy: number, sz: number) {
    return new Matrix([
        [sx, 0 , 0 , 0,],
        [0 , sy, 0 , 0,],
        [0 , 0 , sz, 0,],
        [0 , 0 , 0 , 1],
    ]);
}

export function createRotateXM4(radian: number) {
    return new Matrix([
        [1, 0 , 0 , 0,],
        [0, Math.cos(radian), -Math.sin(radian), 0,],
        [0, Math.sin(radian),  Math.cos(radian), 0,],
        [0, 0 , 0 , 1],
    ]);
}

export function createRotateYM4(radian: number) {
    return new Matrix([
        [Math.cos(radian), 0, Math.sin(radian), 0,],
        [0, 1, 0, 0,],
        [-Math.sin(radian), 0, Math.cos(radian), 0,],
        [0, 0 , 0 , 1],
    ]);
}

export function createRotateZM4(radian: number) {
    return new Matrix([
        [Math.cos(radian), -Math.sin(radian), 0, 0],
        [Math.sin(radian),  Math.cos(radian), 0, 0],
        [0, 0, 1, 0,],
        [0, 0, 0, 1,],
    ]);
}

export function createTranslateM4(x: number, y: number, z: number) {
    return new Matrix([
        [1, 0, 0, x,],
        [0, 1, 0, y,],
        [0, 0, 1, z,],
        [0, 0, 0, 1,],
    ]);
}

export function createOrthProjection(
    r: number, l: number,
    t: number, b: number,
    n: number, f: number, // near > far  z垂直屏幕向外
) {
    const tm4 = createTranslateM4(
        -(r + l) / 2,
        -(t + b) / 2,
        -(n + f) / 2,
    );
    const sm4 = createScaleM4(
        2 / (r - l),
        2 / (t - b),
        2 / (n - f),
    );
    // 正交投影矩阵，先平移到中心，再缩放
    return sm4.mmul(tm4);
}

export function createPerspectiveProjection(
    fov: number,
    aspectRatio: number,
    near: number,
    far: number,
) {
    const perspective = new Matrix([
        [near, 0, 0, 0,],
        [0, near, 0, 0,],
        [0, 0, near + far, -near * far,],
        [0, 0, 1, 0,],
    ]);

    const t = Math.tan(fov / 2) * near;
    const r = t * aspectRatio;
    const orth = createOrthProjection(
        r, -r,
        t, -t,
        near, far
    );

    // var f = 1.0 / Math.tan(fov / 2);
    // var rangeInv = 1 / (near - far);
 
    // return new Matrix([
    //     [f / aspectRatio, 0,                          0,   0,],
    //     [0,               f,                          0,   0,],
    //     [0,               0,    (near + far) * rangeInv,  -1,],
    //     [0,               0,  near * far * rangeInv * 2,   0]
    // ]);
    // 为什么这里要转置才行
    return orth.mmul(perspective).transpose();
}
