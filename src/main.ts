import { encode, RawImageData, BufferLike } from 'jpeg-js'
import * as buffer from 'buffer';
import init, {
    BytesMatrix, BytesVector, FloatsMatrix, FloatsVector, IntegersMatrix,
} from '@ml.wasm/linalg';

(window as any).Buffer = buffer.Buffer;

// const lightNormal = [ 0.0, 0.0, -1.0 ];
// const ambientLight = [30, 30, 30, 255];

let lightNormal: FloatsVector;
let ambientLight: BytesVector;

(async () => {
    await init('node_modules/@ml.wasm/linalg/linalg_bg.wasm');
    
    lightNormal = new FloatsVector([0.0, 0.0, -10.0]);
    ambientLight = new BytesVector([50, 50, 50, 255]);
    // document.getElementById('fileinput')!.onchange = parseImage;
    
    parseImage()
})();

/* function processImage(array: Uint8Array, _width: number, _height: number) : Uint8Array {
    // const linArr = IntegersVector.newFromTypedArray(array);
    const linArr = BytesVector.newFromTypedArray(array);
    // console.log(array[0], array[1], array[2], array[3])
    // console.log(linArr.len());
    linArr.transform(function (data: number) {
        return 256 - data;
    });

    return linArr.toTypedArray();
} */

function parseImage() {
    // const files = (<HTMLInputElement>event.target).files;

    // if (!files || files.length < 1) {
        // return;
    // }
    /* if (files[0].type != 'image/jpeg') {
        console.log('file is not a jpeg!');
        return;
    } */

    const dataUrlReader = new FileReader();
    dataUrlReader.addEventListener('load', function () {
        (document.getElementById('inputimage') as HTMLImageElement).src = dataUrlReader.result as string;
    });
    // dataUrlReader.readAsDataURL(files[0]);

    // const arrayReader = new FileReader();
    // arrayReader.addEventListener('load', function () {
        // const d = decode(arrayReader.result as ArrayBuffer);
        // const result = processImage(new Int32Array(d.data), d.width, d.height)
        // console.log(result.length)
        // console.log(d.width * d.height * 4)

    const WIDTH = 200;
    const HEIGHT = 200;

    let buffer = BytesMatrix.newWithZeroes(WIDTH, HEIGHT * 4);
    let zBuffer = IntegersMatrix.newWithElement(WIDTH, HEIGHT, -1000);
    // console.log(zBuffer.get([0,0]))

    const cx = zBuffer.ncols() / 2;
    const cy = zBuffer.nrows() / 2;

    const R = 75;
    const r = 20;
    
    let int = Math.trunc;

    lightNormal = normalizeVec3(lightNormal);
    // lightNormal.divConstant(lightNormal.powf(2).sum());

    const rot: FloatsMatrix = xRotationMatrix(degree2rad(30)).dot(zRotationMatrix(degree2rad(30)));
    console.log(xRotationMatrix(degree2rad(30)).toString());
    console.log(zRotationMatrix(degree2rad(30)).toString());
    console.log(rot.toString());
    
    for(let theta = 0.0; theta < Math.PI * 2; theta += 0.01) {
        for (let phi = 0.0; phi < Math.PI * 2; phi += 0.01) {
            // const x = R * Math.cos(theta);
            // const y = R * Math.sin(theta);
            
            const st = Math.sin(theta);
            const ct = Math.cos(theta);
            const sp = Math.sin(phi);
            const cp = Math.cos(phi);
            
            let pos = FloatsVector.newWithZeros(3);
            pos.set(0, cp * (R + r * ct));
            pos.set(1, r * st);
            pos.set(2, -sp * (R + r * ct));

            // const x = cp * (R + r * ct);
            // const y = r * st;
            // const z = - sp * (R + r * ct);

            // const nx = cp * ct;
            // const ny = st;
            // const nz = - sp * ct;

            // let nPow = nx * lightNormal.get(0) + ny * lightNormal.get(1) + nz * lightNormal.get(2);
            
            let normal = new FloatsVector([cp * ct, st, -sp * ct]);

            pos = mulMatVec(rot, pos);
            normal = mulMatVec(rot, normal);

            const tx = int(cx + pos.get(0));
            const ty = int(cy + pos.get(1));
            
            let nPow = normal.mul(lightNormal).sum();
            nPow *= -1;

            // If current z is greater means it is on top of previous and value can be overwritten
            if (zBuffer.get([ty, tx]) < pos.get(2)) {
                zBuffer.set([ty, tx], pos.get(2));
                
                let r = ambientLight.get(0) + nPow * 255;
                if (r > 255) { r = 255; }

                let g = ambientLight.get(1) + nPow * 0;
                if (g > 255) { g = 255; }
 
                let b = ambientLight.get(1) + nPow * 0;
                if (b > 255) { b = 255; }
                               
                // buffer.set([ty, 4 * tx + 0], ambientLight[0] + nPow * 255);
                buffer.set([ty, 4 * tx + 0], r);
                buffer.set([ty, 4 * tx + 1], g);
                buffer.set([ty, 4 * tx + 2], b);
                buffer.set([ty, 4 * tx + 3], 255);
            }
            // buffer.set([int(cy + y), 4 * int(cx + x) + 0], 255);
            // buffer.set([int(cy + y), 4 * int(cx + x) + 1], 0);
            // buffer.set([int(cy + y), 4 * int(cx + x) + 2], 0);
            // buffer.set([int(cy + y), 4 * int(cx + x) + 3], 255);
       }
    }
/*
    const tx = cx + 0;
    const ty = cy + 0;
    
    console.log(buffer.get([ty, tx]));
    console.log(buffer.get([ty, tx + 1]));
    console.log(buffer.get([ty, tx + 2]));
    console.log(buffer.get([ty, tx + 3])); */

    /* for (let i = 0; i < zBuffer.nrows(); i++) {
        for (let j = 0; j < zBuffer.ncols(); j++) {
            if ((cx - i) * (cx - i) + (cy - j) * (cy - j) <= R * R) {
                buffer.set([i,4 * j], 255);
                buffer.set([i,4 * j + 1], 0);
                buffer.set([i,4 * j + 2], 0);
                buffer.set([i,4 * j + 3], 255);
            }
        }
    } */
    
    /* for(let i = 0; i < zBuffer.nrows(); i++) {
        for (let j = 0; j < zBuffer.ncols(); j++) {
            if(i > zBuffer.nrows() / 2) {
                if(j > zBuffer.ncols() / 2) {
                    buffer.set([i,4 * j], 255);
                    buffer.set([i,4 * j + 1], 0);
                    buffer.set([i,4 * j + 2], 0);
                    buffer.set([i,4 * j + 3], 255);
                } else {
                    buffer.set([i,4 * j], 0);
                    buffer.set([i,4 * j + 1], 0);
                    buffer.set([i,4 * j + 2], 255);
                    buffer.set([i,4 * j + 3], 255);
                }
            } else {
                buffer.set([i,4 * j], 0);
                buffer.set([i,4 * j + 1], 255);
                buffer.set([i,4 * j + 2], 0);
                buffer.set([i,4 * j + 3], 255);
            }
        }
    } */

    // console.log(buffer.toVector().toString());

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
    // })
    // arrayReader.readAsArrayBuffer(files[0]);
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
