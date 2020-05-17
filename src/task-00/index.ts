import { createRotateM3, createTranslateM3 } from '../utils/m';
import { vec2, mat3 } from 'gl-matrix';

const p = vec2.fromValues(2, 0);

const r = 45 / 180 * Math.PI;

const rotateM = createRotateM3(r);
const translateM = createTranslateM3(1, 2);
const m3 = mat3.multiply(mat3.create(), translateM, rotateM);

console.log(vec2.transformMat3(p, p, m3))