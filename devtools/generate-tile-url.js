#!/usr/bin/env node
// generate-tile-url.js — Construct Maps VT URLs for any tile coordinate
// Usage: node devtools/generate-tile-url.js <zoom> <x> <y> [style]

const x = parseInt(process.argv[2]) || 2;
const y = parseInt(process.argv[3]) || 3;
const z = parseInt(process.argv[4]) || 2;
const style = process.argv[5] || "RoadmapSatellite";

// ========================================================
// Protobuf binary encoder for TileRequest message
// ========================================================

function encodeVarint(v) {
  const bytes = [];
  let val = BigInt(v);
  while (val > 127n) {
    bytes.push(Number((val & 0x7fn) | 0x80n));
    val >>= 7n;
  }
  bytes.push(Number(val));
  return Buffer.from(bytes);
}

function encodeFieldWire2(fieldNum, data) {
  // tag = (fieldNum << 3) | 2
  const tag = encodeVarint((fieldNum << 3) | 2);
  const len = encodeVarint(data.length);
  return Buffer.concat([tag, len, data]);
}

function encodeFieldWire0(fieldNum, value) {
  const tag = encodeVarint((fieldNum << 3) | 0);
  const val = encodeVarint(value);
  return Buffer.concat([tag, val]);
}

function encodeString(fieldNum, str) {
  return encodeFieldWire2(fieldNum, Buffer.from(str, "utf8"));
}

function encodeSubMessage(fieldNum, msgBytes) {
  return encodeFieldWire2(fieldNum, msgBytes);
}

function encodePackedVarint(fieldNum, values) {
  const packed = Buffer.concat(values.map(v => encodeVarint(v)));
  return encodeFieldWire2(fieldNum, packed);
}

// Build the complete TileRequest
function buildTileRequest(x, y, z, style, language, country) {
  language = language || "en-US";
  country = country || "US";

  // f1: tile_coords
  //   f1: packed varints for x, y, z
  const coords = encodeSubMessage(1, encodePackedVarint(1, [x, y, z]));

  // f2: map_state
  const mapState = encodeSubMessage(2, Buffer.concat([
    encodeFieldWire0(1, 0),                    // viewport_zoom
    encodeString(2, "m"),                      // map_style_key
    encodeFieldWire0(3, Math.floor(Math.random() * 1000000000)), // request_token (random for demo)
    encodeSubMessage(4, Buffer.concat([        // active_layer
      encodeString(1, "ndl"),                  //   layer_id
      encodeString(2, "1"),                    //   version
    ])),
  ]));

  // f3: client_context
  const styleConfig = encodeSubMessage(12, Buffer.concat([
    encodeFieldWire0(1, 68),                   // style_id
    encodeSubMessage(2, Buffer.concat([        // style_name
      encodeString(1, "set"),
      encodeString(2, style),
    ])),
  ]));
  
  const clientCtx = encodeSubMessage(3, Buffer.concat([
    encodeString(2, language),
    encodeString(3, country),
    encodeFieldWire0(5, 3),                    // app_platform = Earth Web
    styleConfig,
  ]));

  // f4: pixel_ratio
  const pixelRatio = encodeFieldWire0(4, 1);

  // f6: feature_flags (same as captured)
  const flags = encodeSubMessage(6, Buffer.concat([
    encodeFieldWire0(5, 1),
    encodeFieldWire0(11, 0),
    encodeFieldWire0(39, 1),
    encodeFieldWire0(43, 1),
    encodeFieldWire0(44, 4),
    encodeFieldWire0(45, 1),
    encodeFieldWire0(55, 1),
    encodeFieldWire0(58, 1),
    encodeFieldWire0(91, 1),
  ]));

  // f23: trailer (4 bytes from original)
  const trailer = encodeFieldWire2(23, Buffer.from("e98eb416", "hex"));

  return Buffer.concat([coords, mapState, clientCtx, pixelRatio, flags, trailer]);
}

// ========================================================
// URL generation
// ========================================================

// Calculate max tiles at this zoom
const maxTiles = Math.pow(2, z);

console.log("=== Maps VT URL Generator ===\n");
console.log("Zoom: " + z + " | Tiles per row: " + maxTiles + " | Total tiles: " + (maxTiles * maxTiles));
console.log("Tile: x=" + x + ", y=" + y + " | Style: " + style + "\n");

const protoBinary = buildTileRequest(x, y, z, style);
const bpb = protoBinary.toString("base64");

// Decode and verify
const verify = require("child_process").execSync("node devtools/bpb-decode.js 2>&1", {
  input: bpb,
  cwd: __dirname + "/.."
}).toString();
console.log("Verification: " + (verify.includes("CORRECT") ? "✓ Passed" : "✗ Failed"));

const url = "https://www.google.com/maps/vt/proto?bpb=" + bpb + "&token=95292";

console.log("\n=== Generated URL ===");
console.log(url);
console.log("\n=== bpb (base64) ===");
console.log(bpb);

// ========================================================
// Batch generation for a zoom level
// ========================================================
if (process.argv.includes("--batch")) {
  console.log("\n=== Batch URL Generation (all tiles for zoom " + z + ") ===");
  const urls = [];
  for (let y2 = 0; y2 < maxTiles; y2++) {
    for (let x2 = 0; x2 < maxTiles; x2++) {
      const proto = buildTileRequest(x2, y2, z, style);
      urls.push({
        x: x2,
        y: y2,
        zoom: z,
        url: "https://www.google.com/maps/vt/proto?bpb=" + proto.toString("base64") + "&token=95292"
      });
    }
  }
  console.log("Generated " + urls.length + " URLs");
  require("fs").writeFileSync("output/batch-urls-z" + z + ".json", JSON.stringify(urls, null, 2));
  console.log("Saved: output/batch-urls-z" + z + ".json");
}
