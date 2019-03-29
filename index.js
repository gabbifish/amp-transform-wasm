import './wasm_exec'

let  bytes, inst;

addEventListener("fetch", function(event) {
    event.respondWith(handle(event.request));
});

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

        let input = await request.json()

        if (!input.html || !input.url) {
            throw Error('both the \'html\' and \'url\' fields must be populated')
        }

        // Read the input into shared memory.
        bytes = str2ab(JSON.stringify(input))

        // Call our WebAssembly module's init() function to allocate space for
        // the input.
        let pointer = initMem(bytes.length);

        let memoryBytes = new Uint8Array(inst.exports.mem.buffer);
        memoryBytes.set(bytes, pointer);

        let result = callTransform();

        if (!result) {
            throw Error("Transformation failed; are you sure you put correct HTML in your request's html field?")
        }

        // arena could have moved
        memoryBytes = new Uint8Array(inst.exports.mem.buffer);
        // Extract the result bytes from WebAssembly memory.
        let resultBytes = memoryBytes.slice(result[0], result[0] + result[1]);

        // Create a new response with the transformed html output.
        let newResponse = new Response(resultBytes);
        newResponse.headers.set("Content-Type", "application/json");

        // Return the response.
        return newResponse;
    } catch (err) {
        return new Response(err.stack)
    }
}

// source: http://stackoverflow.com/a/11058858
function str2ab(str) {
    var buf = new ArrayBuffer(str.length); // 1 bytes for each char (they will all be ascii)
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return bufView;
}
