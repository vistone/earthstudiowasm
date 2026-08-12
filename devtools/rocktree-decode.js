#!/usr/bin/env node
// rocktree-decode.js — Precise decoder using geo/globetrotter/proto/rocktree.proto
const fs = require('fs');

// ALL field definitions from rocktree.proto
const PROTO = {
  PlanetoidMetadata: {
    1: ['root_node_metadata', 'NodeMetadata'],
    2: ['radius', 'float'],
    3: ['min_terrain_altitude', 'float'],
    4: ['max_terrain_altitude', 'float'],
  },
  NodeMetadata: {
    1: ['path_and_flags', 'uint32'],
    2: ['epoch', 'uint32'],
    3: ['oriented_bounding_box', 'bytes'],
    4: ['meters_per_texel', 'float'],
    5: ['bulk_metadata_epoch', 'uint32'],
    7: ['imagery_epoch', 'uint32'],
    8: ['available_texture_formats', 'uint32'],
    14: ['octant_type', 'enum'],
  },
  BulkMetadata: {
    1: ['node_metadata', 'NodeMetadata'],  // repeated
    2: ['head_node_key', 'NodeKey'],
    3: ['head_node_center', 'double'],  // repeated
    4: ['meters_per_texel', 'float'],  // repeated
    5: ['default_imagery_epoch', 'uint32'],
    6: ['default_available_texture_formats', 'uint32'],
  },
  NodeKey: {
    1: ['path', 'string'],
    2: ['epoch', 'uint32'],
  },
  NodeData: {
    1: ['matrix_globe_from_mesh', 'double'],  // repeated (16 doubles = 4x4)
    2: ['meshes', 'Mesh'],  // repeated
    3: ['copyright_ids', 'uint32'],  // repeated
    4: ['node_key', 'NodeKey'],
    5: ['kml_bounding_box', 'double'],  // repeated
    8: ['normal_table', 'bytes'],
  },
  Mesh: {
    1: ['vertices', 'bytes'],
    2: ['texture_coords', 'bytes'],
    3: ['indices', 'bytes'],
    5: ['layer_counts', 'bytes'],
    6: ['texture', 'Texture'],  // repeated
    7: ['texture_coordinates', 'bytes'],
    8: ['layer_and_octant_counts', 'bytes'],
    10: ['uv_offset_and_scale', 'float'],  // repeated
    11: ['normals', 'bytes'],
    12: ['mesh_id', 'uint32'],
    13: ['skirt_flags', 'bytes'],
  },
  Texture: {
    1: ['data', 'bytes'],  // repeated
    2: ['format', 'enum'],
    3: ['width', 'uint32'],
    4: ['height', 'uint32'],
  },
};

function readVarint(buf, off) {
  let v = 0n, s = 0n;
  while (off < buf.length) { const b = buf[off++]; v |= BigInt(b & 0x7f) << s; if (!(b & 0x80)) break; s += 7n; }
  return { value: Number(v), pos: off };
}

function decode(bin, msgName) {
  const fields = PROTO[msgName];
  if (!fields) return { _error: 'Unknown message: ' + msgName };
  
  let pos = 0;
  const result = {};
  
  while (pos < bin.length) {
    const tag = bin[pos]; pos++;
    const fn = tag >> 3, wt = tag & 7;
    const f = fields[fn];
    const name = f ? f[0] : ('f' + fn);
    
    if (wt === 0) {
      const r = readVarint(bin, pos); pos = r.pos;
      result[name] = r.value;
    } else if (wt === 2) {
      const r = readVarint(bin, pos); pos = r.pos;
      const bytes = bin.slice(pos, pos + r.value);
      pos += r.value;
      
      if (f && PROTO[f[1]]) {
        // Nested message
        const sub = decode(bytes, f[1]);
        result[name] = sub;
      } else if (f && ['double','float','uint32','int32'].includes(f[1])) {
        const arr = [];
        if (f[1] === 'double') { for (let i=0; i+8<=bytes.length; i+=8) arr.push(bytes.readDoubleLE(i)); }
        else if (f[1] === 'float') { for (let i=0; i+4<=bytes.length; i+=4) arr.push(bytes.readFloatLE(i)); }
        else if (f[1] === 'uint32') { let p=0; while(p<bytes.length){const r=readVarint(bytes,p);p=r.pos;arr.push(r.value);} }
        result[name] = arr;
      } else if (f && f[1] === 'string') {
        result[name] = bytes.toString('utf8');
      } else if (f && f[1] === 'bytes') {
        result[name] = { _size: r.value, _hex: bytes.slice(0, 20).toString('hex') };
      } else {
        result[name] = { _size: r.value };
      }
    } else if (wt === 5) {
      if (pos + 4 <= bin.length) { result[name] = bin.readFloatLE(pos); pos += 4; }
    } else if (wt === 1) {
      if (pos + 8 <= bin.length) { result[name] = bin.readDoubleLE(pos); pos += 8; }
    }
  }
  return result;
}

function decodeRepeated(bin, msgName) {
  let pos = 0;
  const results = [];
  while (pos < bin.length) {
    const tag = bin[pos]; pos++;
    const fn = tag >> 3, wt = tag & 7;
    if (wt === 2) {
      const r = readVarint(bin, pos); pos = r.pos;
      if (fn === 1 || PROTO[msgName][1]) {
        const bytes = bin.slice(pos, pos + r.value);
        results.push(decode(bytes, msgName));
      }
      pos += r.value;
    } else if (wt === 0) {
      const r = readVarint(bin, pos); pos = r.pos;
    }
  }
  return results;
}

// ============ DECODE ALL ============
const data = JSON.parse(fs.readFileSync('captured_data/api-responses.json', 'utf8'));
const keys = Object.keys(data);

function findAndDecode(pattern, msgName, isTextPlain) {
  const k = keys.find(k => k.includes(pattern));
  if (!k) { console.log('NOT FOUND: ' + pattern); return null; }
  const item = data[k];
  let bin = Buffer.from(item.bodyBase64, 'base64');
  if (isTextPlain && item.contentType === 'text/plain') {
    bin = Buffer.from(bin.toString(), 'base64');
  }
  if (bin.length === 0) { console.log('EMPTY: ' + pattern); return null; }
  
  const result = decode(bin, msgName);
  console.log('\n=== ' + msgName + ' (' + bin.length + 'B) ===');
  console.log(JSON.stringify(result, null, 2));
  return result;
}

// 1. PlanetoidMetadata
const pm = findAndDecode('Planetoid', 'PlanetoidMetadata', false);

// 2. BulkMetadata  
const bm = findAndDecode('BulkMetadata', 'BulkMetadata', false);

// 3. NodeData (first tile)
const nk = keys.find(k => k.includes('NodeData') && k.includes('1s13'));
if (nk) {
  const bin = Buffer.from(data[nk].bodyBase64, 'base64');
  const nd = decode(bin, 'NodeData');
  console.log('\n=== NodeData (' + bin.length + 'B) ===');
  // Simplify output
  if (nd.matrix_globe_from_mesh) {
    if (typeof nd.matrix_globe_from_mesh === 'number') {
      // Packed double — need to read from raw binary
      console.log('  matrix: packed doubles (need full parse)');
    } else {
      const m = nd.matrix_globe_from_mesh;
      console.log('  matrix: ' + m.length + ' doubles');
      console.log('  ECEF: [' + m[12].toFixed(0) + ', ' + m[13].toFixed(0) + ', ' + m[14].toFixed(0) + ']');
    }
  }
  if (nd.meshes) {
    console.log('  meshes: ' + nd.meshes.length + ' mesh(es)');
    const mesh = nd.meshes[0];
    if (mesh.vertices) console.log('    vertices: ' + mesh.vertices._size + 'B (int16 quantized)');
    if (mesh.indices) console.log('    indices: ' + mesh.indices._size + 'B (uint16)');
    if (mesh.texture) {
      const tex = mesh.texture;
      console.log('    texture: format=' + (tex.format === 1 ? 'JPEG' : tex.format) + ', ' + tex.width + 'x' + tex.height + ', data=' + (tex.data ? tex.data._size + 'B' : '?'));
    }
    if (mesh.normals) console.log('    normals: ' + mesh.normals._size + 'B');
    if (mesh.mesh_id !== undefined) console.log('    mesh_id: ' + mesh.mesh_id);
  }
  if (nd.copyright_ids) console.log('  copyright_ids: ' + nd.copyright_ids);
}

// 4. Also decode the raw bytes for verification
console.log('\n=== Direct binary verification ===');
const pbin = Buffer.from(data[keys.find(k => k.includes('Planetoid'))].bodyBase64, 'base64');
console.log('PlanetoidMetadata raw: ' + pbin.toString('hex') + ' (' + pbin.length + 'B)');
// 0a 06 = field1(len6), 10 f5 07 = field2(varint 1013), 28 f5 07 = field5(varint 1013), 15 = field2? no. Let me check: 0a=field1,wire2; 10=field2,wire0; 28=field5,wire0; 15=field2,wire5
// Wait: 0a 06 → field1(len6). Inside: 10 f5 07 → NodeMetadata field2(varint 1013), 28 f5 07 → NodeMetadata field5(varint 1013)
// Then 15 = 00010101 → field2, wire5 = 32-bit float. Next 4 bytes: 84 6d c2 4a → float = 6371010.0
console.log('Verified: radius float at bytes 10-13 = ' + pbin.readFloatLE(10));
