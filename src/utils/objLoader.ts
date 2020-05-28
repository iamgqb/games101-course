interface Face {
    indices: number[];
    texture: number[];
    normal: number[];
}

export default async function(url: string) {
    const vertices: number[][] = [];
    const textures: number[][] = [];
    const normals: number[][] = [];
    const faces: Face[] = [];

    const res = await fetch(url);
    const text = await res.text();
    text.split('\n').forEach(parseLine);

    function parseLine(line: string) {
        /*Not include comment*/
        const commentStart = line.indexOf("#");
        if (commentStart != -1) {
            line = line.substring(0, commentStart);
        }
        line = line.trim();

        const dividedLine = line.split(/\s+/);

        if (dividedLine[0] === 'v') {
            const vertex = [
                Number(dividedLine[1]),
                Number(dividedLine[2]),
                Number(dividedLine[3]),
                dividedLine[4] ? Number(dividedLine[4]) : 1
            ];
            vertices.push(vertex);
        } else if (dividedLine[0] === 'vt') {
            const textureCoord = [
                Number(dividedLine[1]),
                Number(dividedLine[2]),
                dividedLine[3] ? Number(dividedLine[3]) : 1
            ];
            textures.push(textureCoord);
        } else if (dividedLine[0] === 'vn') {
            const normal = [
                Number(dividedLine[1]),
                Number(dividedLine[2]),
                Number(dividedLine[3])
            ];
            normals.push(normal);
        } else if (dividedLine[0] === 'f') {
            const face: Face = {
                indices: [],
                texture: [],
                normal: []
            };

            for (let i = 1; i < dividedLine.length; ++i) {
                const dIndex = dividedLine[i].indexOf('//');
                const dividedFaceIndices = dividedLine[i].split(/\W+/);

                if (dIndex > 0) {
                    /*Vertex Normal Indices Without Texture Coordinate Indices*/
                    face.indices.push(Number(dividedFaceIndices[0]));
                    face.normal.push(Number(dividedFaceIndices[1]));
                } else {
                    if (dividedFaceIndices.length === 1) {
                        /*Vertex Indices*/
                        face.indices.push(Number(dividedFaceIndices[0]));
                    } else if (dividedFaceIndices.length === 2) {
                        /*Vertex Texture Coordinate Indices*/
                        face.indices.push(Number(dividedFaceIndices[0]));
                        face.texture.push(Number(dividedFaceIndices[1]));
                    } else if (dividedFaceIndices.length === 3) {
                        /*Vertex Normal Indices*/
                        face.indices.push(Number(dividedFaceIndices[0]));
                        face.texture.push(Number(dividedFaceIndices[1]));
                        face.normal.push(Number(dividedFaceIndices[2]));
                    }
                }
            }

            faces.push(face);
        }
    }

    return {
        vertices,
        textures,
        normals,
        faces,
    }
}