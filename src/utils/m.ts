import { mat3, mat4 } from 'gl-matrix';

export function createTranslateM3(x: number, y: number) {
    const m3 = mat3.fromValues(
        1, 0, x,
        0, 1, y,
        0, 0, 1
    );
    return mat3.transpose(m3, m3);
}

export function createRotateM3(radian: number) {
    const m3 = mat3.fromValues(
        Math.cos(radian), -Math.sin(radian), 0,
        Math.sin(radian), Math.cos(radian), 0,
        0, 0, 1
    );
    return mat3.transpose(m3, m3);
}


/* M4 */
export function createScaleM4(sx: number, sy: number, sz: number) {
    return mat4.fromValues(
        sx, 0 , 0 , 0,
        0 , sy, 0 , 0,
        0 , 0 , sz, 0,
        0 , 0 , 0 , 1
    );
}

export function createRotateXM4(radian: number) {
    const m4 = mat4.fromValues(
        1, 0 , 0 , 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian),  Math.cos(radian), 0,
        0, 0 , 0 , 1
    );
    return mat4.transpose(m4, m4);
    // return new Matrix([
    //     [1, 0 , 0 , 0,],
    //     [0, Math.cos(radian), -Math.sin(radian), 0,],
    //     [0, Math.sin(radian),  Math.cos(radian), 0,],
    //     [0, 0 , 0 , 1],
    // ]);
}

export function createRotateYM4(radian: number) {
    const m4 = mat4.fromValues(
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0 , 0 , 1
    );
    return mat4.transpose(m4, m4);
    // return new Matrix([
    //     [Math.cos(radian), 0, Math.sin(radian), 0,],
    //     [0, 1, 0, 0,],
    //     [-Math.sin(radian), 0, Math.cos(radian), 0,],
    //     [0, 0 , 0 , 1],
    // ]);
}

export function createRotateZM4(radian: number) {
    const m4 = mat4.fromValues(
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian),  Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    );
    return mat4.transpose(m4, m4);
    // return new Matrix([
    //     [Math.cos(radian), -Math.sin(radian), 0, 0],
    //     [Math.sin(radian),  Math.cos(radian), 0, 0],
    //     [0, 0, 1, 0,],
    //     [0, 0, 0, 1,],
    // ]);
}

export function createTranslateM4(x: number, y: number, z: number) {
    const m4 = mat4.fromValues(
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1,
    );
    return mat4.transpose(m4, m4);
    // return new Matrix([
    //     [1, 0, 0, x,],
    //     [0, 1, 0, y,],
    //     [0, 0, 1, z,],
    //     [0, 0, 0, 1,],
    // ]);
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
    )
    // const tm4 = createTranslateM4(
    //     -(r + l) / 2,
    //     -(t + b) / 2,
    //     -(n + f) / 2,
    // );
    const sm4 = createScaleM4(
        2 / (r - l),
        2 / (t - b),
        2 / (n - f),
    );
    // const sm4 = createScaleM4(
    //     2 / (r - l),
    //     2 / (t - b),
    //     2 / (n - f),
    // );
    // 正交投影矩阵，先平移到中心，再缩放
    // return sm4.mmul(tm4);
    return mat4.multiply(mat4.create(), sm4, tm4);
}

export function createPerspectiveProjection(
    fov: number,
    aspectRatio: number,
    near: number, // 正数 near < far
    far: number, // 正数 near < far
) {
    const perspective = mat4.fromValues(
        near, 0, 0, 0,
        0, near, 0, 0,
        0, 0, -near - far, -near * far,
        0, 0, -1, 0,
    );
    mat4.transpose(perspective, perspective);
    // const perspective = new Matrix([
    //     [near, 0, 0, 0,],
    //     [0, near, 0, 0,],
    //     [0, 0, -near - far, -near * far,],
    //     [0, 0, -1, 0,],
    // ]);

    const t = Math.tan(fov / 2) * Math.abs(near);
    const r = t * aspectRatio;
    const orth = createOrthProjection(
        r, -r,
        t, -t,
        far, near
    );

    // var f = 1.0 / Math.tan(fov / 2);
    // var rangeInv = 1 / (near - far);
 
    // return new Matrix([
    //     [f / aspectRatio, 0,                          0,   0,],
    //     [0,               f,                          0,   0,],
    //     [0,               0,    (near + far) * rangeInv,  -1,],
    //     [0,               0,  near * far * rangeInv * 2,   0]
    // ]);
    // 为什么这里乘出来需要转置？
    mat4.multiply(perspective, orth, perspective);
    return mat4.transpose(perspective, perspective);
    // return orth.mmul(perspective).transpose();
}
