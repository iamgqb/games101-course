import { createPoint2d, createRotateM3 } from '../utils/m';

const p = createPoint2d(2, 1);

const r = 45 / 180 * Math.PI;

const rotateM = createRotateM3(r);

console.log(rotateM.mmul(p))