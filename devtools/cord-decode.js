#!/usr/bin/env node
// cord-decode.js — Decode CORD-encoded vertex data from ClientVectorTile
// Based on maps/paint/proto/client-vector-tile-serialization.proto

const fs = require('fs');

// ========================================================
// Enums from client-vector-tile-serialization.proto
// ========================================================
const VertexEncoding = {
  0: 'UNKNOWN',
  1: 'SEQUENTIAL_VARINT',
  2: 'SEQUENTIAL_FIXED16',
  3: 'DELTA_VARINT',
};

const VertexResolution = {
  0: 'UNKNOWN',
  1: '16TH_PIXEL',
  2: '4TH_PIXEL',
  3: '8TH_PIXEL',
  4: '32ND_PIXEL',
  5: '64TH_PIXEL',
  6: '128TH_PIXEL',
  7: '256TH_PIXEL',
  8: '512TH_PIXEL',
  9: '1KTH_PIXEL',
  10: '2KTH_PIXEL',
  11: '4KTH_PIXEL',
  12: '8KTH_PIXEL',
  13: '16KTH_PIXEL',
  14: '32KTH_PIXEL',
  15: '64KTH_PIXEL',
  16: '128KTH_PIXEL',
  17: '256KTH_PIXEL',
  18: '512KTH_PIXEL',
  19: '1MTH_PIXEL',
  20: '2MTH_PIXEL',
  21: '4MTH_PIXEL',
};

// Resolution → divisor (pixels per unit)
const ResolutionDivisor = {
  1: 16, 2: 4, 3: 8, 4: 32, 5: 64, 6: 128, 7: 256, 8: 512,
  9: 1024, 10: 2048, 11: 4096, 12: 8192, 13: 16384, 14: 32768,
  15: 65536, 16: 131072, 17: 262144, 18: 524288, 19: 1048576,
  20: 2097152, 21: 4194304,
};

// ========================================================
// Generic proto decode helpers
// ========================================================
function readVarint(buf, pos) {
  let v = 0n, s = 0n, start = pos;
  while (pos < buf.length) { const b = buf[pos++]; v |= BigInt(b & 0x7f) << s; if (!(b & 0x80)) break; s += 7n; }
  return { value: Number(v), pos };
}

function zigzagDecode(v) {
  return (v >>> 1) ^ -(v & 1);
}

// ========================================================
// CORD vertex data decoders
// ========================================================
function decodeSequentialVarint(bytes, count) {
  // Each coordinate is a varint
  const coords = [];
  let pos = 0;
  while (pos < bytes.length && coords.length < count) {
    const r = readVarint(bytes, pos);
    pos = r.pos;
    coords.push(r.value);
  }
  return coords;
}

function decodeSequentialFixed16(bytes, count) {
  // Each coordinate is a fixed 16-bit signed int
  const coords = [];
  for (let i = 0; i < count && i * 2 < bytes.length; i++) {
    coords.push(bytes.readInt16LE(i * 2));
  }
  return coords;
}

function decodeDeltaVarint(bytes, count) {
  // Each coordinate is a zigzag-encoded varint delta from previous
  const coords = [];
  let pos = 0;
  let prev = 0;
  while (pos < bytes.length && coords.length < count) {
    const r = readVarint(bytes, pos);
    pos = r.pos;
    const delta = zigzagDecode(r.value);
    prev += delta;
    coords.push(prev);
  }
  return coords;
}

// ========================================================
// Main decode
// ========================================================
function decodeVertexData(vertexData, encoding, resolution, vertexCount) {
  const div = ResolutionDivisor[resolution] || 1;
  
  let rawCoords;
  switch (encoding) {
    case 1: // SEQUENTIAL_VARINT
      rawCoords = decodeSequentialVarint(vertexData, vertexCount * 2); // x,y pairs
      break;
    case 2: // SEQUENTIAL_FIXED16
      rawCoords = decodeSequentialFixed16(vertexData, vertexCount * 2);
      break;
    case 3: // DELTA_VARINT
      rawCoords = decodeDeltaVarint(vertexData, vertexCount * 2);
      break;
    default:
      rawCoords = [];
  }
  
  // Convert to points (x,y pairs) in pixel coordinates
  const points = [];
  for (let i = 0; i + 1 < rawCoords.length; i += 2) {
    const px = rawCoords[i] / div;
    const py = rawCoords[i + 1] / div;
    points.push({ x: px, y: py });
  }
  
  return { encoding: VertexEncoding[encoding], resolution: VertexResolution[resolution], divisor: div, rawCoordCount: rawCoords.length, points };
}

// ========================================================
// Test with captured data
// ========================================================
console.log('=== CORD Vertex Data Decoder ===\n');

// Read the Maps VT response
const vtbin = fs.readFileSync('captured_data/maps-vt-tile.bin');
console.log('Maps VT response: ' + vtbin.length + ' bytes');

// Parse the ClientVectorTile to find tile_options (field 2)
let pos = 0;
let tileOptions = null;

while (pos < vtbin.length) {
  const tagR = readVarint(vtbin, pos);
  pos = tagR.pos;
  const fn = tagR.value >> 3, wt = tagR.value & 7;
  
  if (wt === 0) {
    const v = readVarint(vtbin, pos);
    pos = v.pos;
  } else if (wt === 2) {
    const lenR = readVarint(vtbin, pos);
    pos = lenR.pos;
    const data = vtbin.slice(pos, pos + lenR.value);
    pos += lenR.value;
    
    if (fn === 2) {
      // tile_options
      tileOptions = data;
      console.log('Found tile_options (' + lenR.value + ' bytes): ' + data.toString('hex'));
      break;
    }
  }
}

if (tileOptions) {
  // Decode tile_options: field 1 = vertex_encoding, field 2 = vertex_resolution
  let tp = 0;
  let encoding = 0, resolution = 0;
  while (tp < tileOptions.length) {
    const r = readVarint(tileOptions, tp);
    tp = r.pos;
    const fn = r.value >> 3, wt = r.value & 7;
    if (wt === 0) {
      const v = readVarint(tileOptions, tp);
      tp = v.pos;
      if (fn === 1) encoding = v.value;
      else if (fn === 2) resolution = v.value;
    }
  }
  console.log('vertex_encoding: ' + encoding + ' (' + VertexEncoding[encoding] + ')');
  console.log('vertex_resolution: ' + resolution + ' (' + VertexResolution[resolution] + ')');
  
  // Now find the line_group (field 7) vertex_data
  pos = 0;
  while (pos < vtbin.length) {
    const tagR = readVarint(vtbin, pos);
    pos = tagR.pos;
    const fn = tagR.value >> 3, wt = tagR.value & 7;
    if (wt === 0) { pos = readVarint(vtbin, pos).pos; }
    else if (wt === 2) {
      const lenR = readVarint(vtbin, pos);
      pos = lenR.pos;
      const data = vtbin.slice(pos, pos + lenR.value);
      pos += lenR.value;
      
      if (fn === 7) {
        // line_group → LineRenderOpGroup → repeated line_op (field 1)
        console.log('\nFound line_group (' + lenR.value + ' bytes)');
        
        // Parse LineRenderOpGroup: field 1 = line_op (repeated)
        let lp = 0;
        while (lp < data.length) {
          const r = readVarint(data, lp);
          lp = r.pos;
          const lfn = r.value >> 3, lwt = r.value & 7;
          if (lwt === 2) {
            const llenR = readVarint(data, lp);
            lp = llenR.pos;
            const opData = data.slice(lp, lp + llenR.value);
            lp += llenR.value;
            
            if (lfn === 1) {
              // LineRenderOp: field 1 = vertex_data (bytes), field 7 = vertex_count
              console.log('  LineRenderOp (' + llenR.value + ' bytes)');
              let op = 0;
              let vertexData = null, vertexCount = 0;
              while (op < opData.length) {
                const or = readVarint(opData, op);
                op = or.pos;
                const ofn = or.value >> 3, owt = or.value & 7;
                if (owt === 0) {
                  const ov = readVarint(opData, op);
                  op = ov.pos;
                  if (ofn === 7) vertexCount = ov.value;
                } else if (owt === 2) {
                  const olen = readVarint(opData, op);
                  op = olen.pos;
                  const odata = opData.slice(op, op + olen.value);
                  op += olen.value;
                  if (ofn === 1) vertexData = odata;
                }
              }
              
              if (vertexData) {
                console.log('  vertex_data: ' + vertexData.length + ' bytes');
                console.log('  vertex_count: ' + vertexCount);
                console.log('  vertex_data hex: ' + vertexData.toString('hex').substring(0, 100));
                
                // Try each encoding
                for (let enc = 1; enc <= 3; enc++) {
                  const result = decodeVertexData(vertexData, enc, resolution, vertexCount);
                  console.log('\n  --- Encoding: ' + result.encoding + ' ---');
                  console.log('  raw coord count: ' + result.rawCoordCount);
                  if (result.points.length > 0) {
                    console.log('  first 5 points (pixel coords):');
                    result.points.slice(0, 5).forEach(p => {
                      console.log('    (' + p.x.toFixed(3) + ', ' + p.y.toFixed(3) + ')');
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
