# AMP-transformer
This repository contains a go/WASM port of the [AMP packager transform library](https://github.com/ampproject/amppackager/tree/master/transformer). It is derived from Devin Mullin's work towards minimizing the Go WASM runtime so Go/WASM binaries can be run within CF Workers' 128-MB heap memory limit.

## Building for workers
First, make sure to pull node dependencies:
```bash
npm install
```

then, to build for workers, run 
```bash
npm run build
```
The final outputted workers code is in the `dist/` directory. There is a fully mminified and less minified version of the code, so you can debug the code in the workers console using the less minified version before deploying the fully minified version.

## Todo:
1. Increase workers WASM binary limit; this library's main.wasm code is currently 1.7 MB gzipped, but Workers only accepts uploads of <1MB.
2. Deploy fix to Go/WASM [minimized runtime concurrency bug](https://github.com/golang/go/issues/27462) and re-build main.wasm with new runtime fix.
