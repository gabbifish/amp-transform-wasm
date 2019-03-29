package main

import (
	"bytes"
	"encoding/json"
	"log"
	"reflect"
	"syscall/js"
	"unsafe"

	t "github.com/ampproject/amppackager/transformer"
	rpb "github.com/ampproject/amppackager/transformer/request"
)

var buf []uint8

func initMem(this js.Value, args []js.Value) interface{} {
	length := args[0].Int()
	buf = make([]uint8, length)
	hdr := (*reflect.SliceHeader)(unsafe.Pointer(&buf))
	ptr := uintptr(unsafe.Pointer(hdr.Data))
	return int(ptr)
}

type TransformRequest struct {
	HTML string `json:"html"`
	URL string `json:"url"`
}

type Preloads struct {
	URL string `json:"url"`
	As  string `json:"as"`
}

type TransformResponse struct {
	HTML    string     `json:"transformed_html"`
	Preload []Preloads `json:"preload"`
	Error   string     `json:"error"`
}

func parsePreloads(preloadEntries []*rpb.Metadata_Preload) []Preloads {
	preloads := make([]Preloads, len(preloadEntries))
	for i, entry := range preloadEntries {
		preloads[i] = Preloads{URL: entry.Url, As: entry.As}
	}
	return preloads
}

func callTransform(this js.Value, args []js.Value) interface{} {
	var rawBytesResponse []byte
	var r *rpb.Request
	var transformResp TransformResponse

	transformReq := TransformRequest{}
	err := json.Unmarshal(buf, &transformReq)
	if err != nil {
		log.Fatal("Unmarshalling request params failed")
	}
	r = &rpb.Request{DocumentUrl: transformReq.URL, Html: transformReq.HTML, Config: rpb.Request_DEFAULT}
	transformedData, preloads, err := t.Process(r)

	transformResp = TransformResponse{}
	if err != nil {
		log.Println("call to transform lib failed")
		transformResp.Error = err.Error()
	}
	transformResp.HTML = transformedData
	transformResp.Preload = parsePreloads(preloads.Preloads)

	rawBytesResponse, err = json.Marshal(&transformResp)
	if err != nil {
		log.Fatal("Failed to marshal response")
	}

	w := new(bytes.Buffer)

	w.Write(rawBytesResponse)
	out := w.Bytes()

	hdr := (*reflect.SliceHeader)(unsafe.Pointer(&out))
	ptr := uintptr(unsafe.Pointer(hdr.Data))

	return []interface{}{int(ptr), len(out)}
}

func registerCallbacks() {
	js.Global().Set("initMem", js.FuncOf(initMem))
	js.Global().Set("callTransform", js.FuncOf(callTransform))
}

func main() {
	c := make(chan struct{}, 0)

	log.Println("WASM Initialized")
	registerCallbacks()
	<-c
}