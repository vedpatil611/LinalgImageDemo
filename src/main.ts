import { encode, RawImageData, BufferLike } from 'jpeg-js'
import * as buffer from 'buffer';
import init, {
    BytesMatrix, BytesVector, FloatsMatrix, FloatsVector, IntegersMatrix,
} from '@ml.wasm/linalg';

(window as any).Buffer = buffer.Buffer;

let lightNormal: FloatsVector;
let ambientLight: BytesVector;
let color: BytesVector;

(async () => {
    await init('node_modules/@ml.wasm/linalg/linalg_bg.wasm');
    
    lightNormal = new FloatsVector([0.0, 1.0, -1.0]);
    ambientLight = new BytesVector([50, 50, 50, 255]);
    color = new BytesVector([255, 255, 0, 255]);

    parseImage()
})();

function parseImage() {
    const WIDTH = 300;
    const HEIGHT = 300;

    let buffer = BytesMatrix.newWithZeroes(WIDTH, HEIGHT * 4);
    let zBuffer = IntegersMatrix.newWithElement(WIDTH, HEIGHT, -1000);

    const cx = zBuffer.ncols() / 2;
    const cy = zBuffer.nrows() / 2;

    const R = 100;
    const r = 30;
    
    let int = Math.trunc;

    lightNormal = normalizeVec3(lightNormal);
    // console.log(lightNormal.toString());

    const rot: FloatsMatrix = xRotationMatrix(degree2rad(30)).dot(zRotationMatrix(degree2rad(30)));
    
    for(let theta = 0.0; theta < Math.PI * 2; theta += 0.01) {
        for (let phi = 0.0; phi < Math.PI * 2; phi += 0.01) {
            const st = Math.sin(theta);
            const ct = Math.cos(theta);
            const sp = Math.sin(phi);
            const cp = Math.cos(phi);
            
            let pos = FloatsVector.newWithZeros(3);
            pos.set(0, cp * (R + r * ct));
            pos.set(1, r * st);
            pos.set(2, -sp * (R + r * ct));
           
            let normal = new FloatsVector([cp * ct, st, -sp * ct]);

            pos = mulMatVec(rot, pos);
            normal = mulMatVec(rot, normal);

            const tx = int(cx + pos.get(0));
            const ty = int(cy + pos.get(1));
            
            let nPow = normal.mul(lightNormal).sum();
            nPow *= -1;
            nPow = (nPow + 1) / 2;

            // If current z is greater means it is on top of previous and value can be overwritten
            if (zBuffer.get([ty, tx]) < pos.get(2)) {
                zBuffer.set([ty, tx], pos.get(2));
                
                let r = ambientLight.get(0) + nPow * color.get(0);
                if (r > 255) { r = 255; }

                let g = ambientLight.get(1) + nPow * color.get(1);
                if (g > 255) { g = 255; }
 
                let b = ambientLight.get(1) + nPow * color.get(2);
                if (b > 255) { b = 255; }
                               
                buffer.set([ty, 4 * tx + 0], r);
                buffer.set([ty, 4 * tx + 1], g);
                buffer.set([ty, 4 * tx + 2], b);
                buffer.set([ty, 4 * tx + 3], 255);
            }
       }
    }
 
    // ENCODE TO JPEG DATA
    const resultImage: RawImageData<BufferLike> = {
        width: buffer.nrows(),
        height: buffer.ncols() / 4,
        data: buffer.toVector().toTypedArray()
    }
    const encoded = encode(resultImage, 100)

    // AS DATA URL
    let binary = '';
    var bytes = new Uint8Array(encoded.data);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    // let processed = 'data:' + files[0].type + ';base64,'
    let processed = 'data:image/jpeg;base64,'
    // console.log(files[0].type)
    processed += window.btoa(binary);

    // ASSIGN DATA URL TO OUTPUT IMAGE ELEMENT
    (document.getElementById('outputimage') as HTMLImageElement).src = processed
}

function degree2rad(angle: number) {
    return angle * Math.PI / 180.0;
}

function normalizeVec3(vec: FloatsVector) {
    // vec.powf(2);
    // return Math.sqrt(vec.sum());
    const len = Math.sqrt(vec.get(0) * vec.get(0) + vec.get(1) * vec.get(1) + vec.get(2) * vec.get(2));
    vec.divConstant(len);
    return vec;
}

function mulMatVec(mat: FloatsMatrix, vec: FloatsVector) {
    let res = FloatsVector.newWithZeros(3);
    
    res.set(0, mat.getR(0).mul(vec).sum());
    res.set(1, mat.getR(1).mul(vec).sum());
    res.set(2, mat.getR(2).mul(vec).sum());

    return res;
}

function scalingMatrix(vec: FloatsVector) {
    let res = FloatsMatrix.newWithZeroes(3, 3);

    res.set([0, 0], vec.get(0));
    res.set([1, 1], vec.get(1));
    res.set([2, 2], vec.get(2));

    return res;
}

function xRotationMatrix(angle: number) {
    let mat = FloatsMatrix.newWithZeroes(3, 3);
    
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    mat.set([0, 0], 1);
    mat.set([1, 1], c);
    mat.set([1, 2], -s);
    mat.set([2, 1], s);
    mat.set([2, 2], c);

    return mat;
}

function yRotationMatrix(angle: number) {
    let mat = FloatsMatrix.newWithZeroes(3, 3);
    
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    mat.set([0, 0], c);
    mat.set([0, 2], s);
    mat.set([1, 1], 1);
    mat.set([2, 0], -s);
    mat.set([2, 2], c);

    return mat;
}

function zRotationMatrix(angle: number) {
    let mat = FloatsMatrix.newWithZeroes(3, 3);

    const c = Math.cos(angle);
    const s = Math.sin(angle);

    mat.set([0, 0], c);
    mat.set([0, 1], -s);
    mat.set([1, 0], s);
    mat.set([1, 1], c);
    mat.set([2, 2], 1);

    return mat;
}
