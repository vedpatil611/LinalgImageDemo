import { decode, encode, RawImageData, BufferLike } from 'jpeg-js'
import * as buffer from 'buffer';
import init, {
    IntegersMatrix,
    IntegersVector
} from '@ml.wasm/linalg';

(window as any).Buffer = buffer.Buffer;

(async () => {
    await init('node_modules/@ml.wasm/linalg/linalg_bg.wasm');
    document.getElementById('fileinput')!.onchange = parseImage;
})();

function processImage(array: Int32Array, _width: number, _height: number) : Int32Array {
    const linArr = IntegersVector.newFromTypedArray(array);
    // console.log(array[0], array[1], array[2], array[3])
    // console.log(linArr.len());
    linArr.transform(function (data: number) {
        return 256 - data;
    });

    return linArr.toTypedArray();
}

function parseImage(event: Event) {
    const files = (<HTMLInputElement>event.target).files;

    if (!files || files.length < 1) {
        return;
    }
    if (files[0].type != 'image/jpeg') {
        console.log('file is not a jpeg!');
        return;
    }

    const dataUrlReader = new FileReader();
    dataUrlReader.addEventListener('load', function () {
        (document.getElementById('inputimage') as HTMLImageElement).src = dataUrlReader.result as string;
    });
    dataUrlReader.readAsDataURL(files[0]);

    const arrayReader = new FileReader();
    arrayReader.addEventListener('load', function () {
        // const d = decode(arrayReader.result as ArrayBuffer);
        // const result = processImage(new Int32Array(d.data), d.width, d.height)
        // console.log(result.length)
        // console.log(d.width * d.height * 4)

        let buffer = IntegersMatrix.newWithZeroes(640,480 * 4);
        for(let i = 0; i < buffer.nrows(); i++) {
            for (let j = 0; j < buffer.ncols(); j+=4) {
                buffer.set([i,j], 255);
                buffer.set([i,j + 1], 0);
                buffer.set([i,j + 2], 0);
                buffer.set([i,j + 3], 255);
            }
        }

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
        let processed = 'data:' + files[0].type + ';base64,'
        console.log(files[0].type)
        processed += window.btoa(binary);

        // ASSIGN DATA URL TO OUTPUT IMAGE ELEMENT
        (document.getElementById('outputimage') as HTMLImageElement).src = processed
    })
    arrayReader.readAsArrayBuffer(files[0]);
}
