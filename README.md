# AMP-transformer
This repository contains a go/WASM port of the [AMP packager transform library](https://github.com/ampproject/amppackager/tree/master/transformer). It is derived from Devin Mullin's work towards minimizing the Go WASM runtime so Go/WASM binaries can be run within CF Workers' 128-MB heap memory limit.

## Building the AMP transformation
You'll need to compile a separate branch of Go that contains changes to the runtime such that
the amount of heap memory used can reasonably fit in a worker.

```bash
git clone https://github.com/gabbifish/go
cd go/
git checkout gabbi-small
src/make.bash
```

Then use it to build the wasm binary from worker.go:
```bash
cd go-wasm/
GOOS=js GOARCH=wasm path/to/custom-go/bin/go build -o main.wasm worker.go
```

Upload the wasm to Cloudflare Workers with name `TRANSFORM_WASM`.

## Building for Workers
First, make sure to pull node dependencies:
```bash
npm install
```

then, to build for workers, run 
```bash
npm run build
```
The final outputted workers code is in the `dist/` directory. There is a fully minified and less minified version of the code, so you can debug the code in the workers console using the less minified version before deploying the fully minified version.

## Todo:
1. Set up makefile with nice API calls for easily uploading the worker and the wasm binary.
