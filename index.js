import './wasm_exec'

let mod, bytes, inst;

addEventListener("fetch", function(event) {
    event.respondWith(handle(event.request));
}.bind(this));

function instantiate() {
    const go = new Go();

    inst = new WebAssembly.Instance(TRANSFORM_WASM, go.importObject);
    go.run(inst);
}

async function handle(request) {
    try {
        if (typeof inst == 'undefined') {
            instantiate();
        }
        // Forward the request to our origin.
        let response = await fetch("https://cloudflareamp.org/amp/home");

        let inputObj = {
            html: await response.text(),
            url: "https://cloudflareamp.org/amp/home"
        }

        let inputString = JSON.stringify(inputObj)

        // First, read the object above into memory.
        bytes = str2ab(inputString)

        // Call our WebAssembly module's init() function to allocate space for
        // the image.
        let pointer = initMem(bytes.length);

        let memoryBytes = new Uint8Array(inst.exports.mem.buffer);
        memoryBytes.set(bytes, pointer);

        let result = callTransform();

        // arena could have moved
        memoryBytes = new Uint8Array(inst.exports.mem.buffer);
        // Extract the result bytes from WebAssembly memory.
        let resultBytes = memoryBytes.slice(result[0], result[0] + result[1]);
        let resultString = string(resultBytes)

        // Create a response with the transformed html.
        let newResponse = new Response(resultString);
        newResponse.headers.set("Content-Type", "application/json");

        // Return the response.
        return newResponse;
    } catch (err) {
        return new Response(err.stack)
    }
}

// source: http://stackoverflow.com/a/11058858
function str2ab(str) {
    let buf = new ArrayBuffer(str.length); // 1 byte for each ASCII char
    let bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str[i];
    }
    return buf;
}