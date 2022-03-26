import { encode, RawImageData, BufferLike } from 'jpeg-js'
import * as buffer from 'buffer';
import init, {
    BytesMatrix,
} from '@ml.wasm/linalg';

(window as any).Buffer = buffer.Buffer;

// const lightNormal = [ 0.0, 0.0, -1.0 ];
// const ambientLight = [ 10, 10, 10, 255 ];

(async () => {
    await init('node_modules/@ml.wasm/linalg/linalg_bg.wasm');
    document.getElementById('fileinput')!.onchange = parseImage;
    parseImage(null)
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

function parseImage(_event: Event) {
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

    let buffer = BytesMatrix.newWithZeroes(400,400 * 4);
    // let zBuffer = BytesMatrix.newWithElement(640,480,-1000);

    // const cx = zBuffer.nrows() / 2 - 1;
    // const cy = zBuffer.ncols() / 2 - 1;

    // const R = 150;
    // const r = 50;

    /* for(let theta = 0.0; theta < Math.PI * 2; theta += 0.001) {
        // for (let phi = 0.0; phi < Math.PI * 2; phi += 0.01) {
        const x = R * Math.cos(theta);
        const y = R * Math.sin(theta);

        buffer.set([(cy + y), 4 * (cx + x)], 255);
        buffer.set([(cy + y), 4 * (cx + x) + 1], 0);
        buffer.set([(cy + y), 4 * (cx + x) + 2], 0);
        buffer.set([(cy + y), 4 * (cx + x) + 3], 255);
        // }
    } */
    
    // console.log("gjekjge");
    for(let i = 0; i < buffer.nrows(); i++) {
        for (let j = 0; j < buffer.ncols(); j+=4) {
            if(i > buffer.nrows() / 2) {
                if(j > buffer.ncols() / 2) {
                    buffer.set([i,j], 255);
                    buffer.set([i,j + 1], 0);
                    buffer.set([i,j + 2], 0);
                    buffer.set([i,j + 3], 255);
                } else {
                    buffer.set([i,j], 0);
                    buffer.set([i,j + 1], 0);
                    buffer.set([i,j + 2], 255);
                    buffer.set([i,j + 3], 255);
                }
            } else {
                buffer.set([i,j], 0);
                buffer.set([i,j + 1], 255);
                buffer.set([i,j + 2], 0);
                buffer.set([i,j + 3], 255);
            }
        }
    }

    console.log(buffer.toVector().toString());

    // console.log(d.width, d.height)

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
    let processed = 'data:' + 'image/jpeg' + ';base64,'
    // console.log(files[0].type)
    processed += window.btoa(binary);

    // ASSIGN DATA URL TO OUTPUT IMAGE ELEMENT
    (document.getElementById('outputimage') as HTMLImageElement).src = processed
    // })
    // arrayReader.readAsArrayBuffer(files[0]);
}
