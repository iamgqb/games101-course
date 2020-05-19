import { vec2 } from "gl-matrix";

export default class Bbx2d {
    private _min: vec2;
    private _max: vec2;
    constructor(points: vec2[]) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        points.forEach(p => {
            const [x, y] = p;
            if (x < minX) {
                minX = x;
            }
            if (x > maxX) {
                maxX = x;
            }
            if (y < minY) {
                minY = y;
            }
            if (y > maxY) {
                maxY = y;
            }
        });
        this._min = vec2.fromValues(minX, minY);
        this._max = vec2.fromValues(maxX, maxY);
    }

    get min() {
        return this._min;
    }

    get max() {
        return this._max;
    }
}