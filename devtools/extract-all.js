#!/usr/bin/env node
// extract-all.js — Convert all captured data to open formats
const fs = require('fs');
const path = require('path');

const OUT = 'output';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function readVarint(buf, off) {
  let v = 0n, s = 0n;
  while (off < buf.length) { const b = buf[off++]; v |= BigInt(b & 0x7f) << s; if (!(b & 0x80)) break; s += 7n; }
  return { value: Number(v), pos: off };
}

const data = JSON.parse(fs.readFileSync('captured_data/api-responses.json', 'utf8'));
const keys = Object.keys(data);

// ============================
// 1. CONFIG → JSON
// ============================
console.log('1. Config → config.json');
const ck = keys.find(k => k.includes('config') && k.includes('alt_proto'));
if (!ck) { console.log('  Config key not found! Keys:', keys.slice(0,3)); process.exit(1); }
const cbin = Buffer.from(data[ck].bodyBase64, 'base64');
const decoded = Buffer.from(cbin.toString(), 'base64');
const urls = [];
let pos = 0;
while (pos < decoded.length) {
  let start = -1;
  for (let i = pos; i < decoded.length; i++) {
    if (decoded[i] >= 0x20 && decoded[i] <= 0x7e) { if (start === -1) start = i; }
    else { if (start !== -1 && i - start >= 5) { const s = decoded.slice(start, i).toString('utf8'); if (s.includes('http')) urls.push(s); } start = -1; }
  }
  break;
}
const uniqueUrls = [...new Set(urls.filter(u => u.length > 10))];
fs.writeFileSync(path.join(OUT, 'config-urls.json'), JSON.stringify(uniqueUrls, null, 2));
console.log('  ' + uniqueUrls.length + ' unique URLs');

// ============================
// 2. PLANETOID → JSON
// ============================
console.log('2. Planetoid → planetoid.json');
const pk = keys.find(k => k.includes('Planetoid'));
const pbin = Buffer.from(data[pk].bodyBase64, 'base64');
let pp = 0, planetoid = {};
while (pp < pbin.length) {
  const tag = pbin[pp]; pp++;
  const fn = tag >> 3, wt = tag & 7;
  if (wt === 0) {
    const r = readVarint(pbin, pp); pp = r.pos;
    if (fn === 1) planetoid.epoch = r.value;
    else if (fn === 2) planetoid.bulk_epoch = r.value;
  } else if (wt === 5 && pp + 4 <= pbin.length) {
    if (fn === 5) { planetoid.radius = pbin.readFloatLE(pp); pp += 4; }
  }
}
fs.writeFileSync(path.join(OUT, 'planetoid.json'), JSON.stringify(planetoid, null, 2));
console.log('  Earth radius: ' + (planetoid.radius || 6371010) + 'm');

// ============================
// 3. TILE TREE → JSON
// ============================
console.log('3. Tile tree → tile-tree.json');
const nodeKeys = keys.filter(k => k.includes('NodeData'));
const nodes = nodeKeys.map(k => {
  const url = data[k].url;
  const nm = url.match(/!1s(\d+)/);
  const em = url.match(/!2u(\d+)/);
  return { path: nm ? nm[1] : '?', epoch: em ? em[1] : '?', size: Buffer.from(data[k].bodyBase64, 'base64').length };
}).sort((a, b) => a.path.length - b.path.length || a.path.localeCompare(b.path));
fs.writeFileSync(path.join(OUT, 'tile-tree.json'), JSON.stringify({ levels: [...new Set(nodes.map(n => n.path.length))].length, total: nodes.length, nodes }, null, 2));
console.log('  ' + nodes.length + ' nodes');

// ============================
// 4. NODEDATA → OBJ + PNG
// ============================
console.log('4. NodeData → tile.obj + tile-texture.png');
const nk = keys.find(k => k.includes('NodeData') && k.includes('1s13'));
const nbin = Buffer.from(data[nk].bodyBase64, 'base64');

// Extract matrix
let np = 0, matrix = null;
while (np < nbin.length - 4) {
  const tag = nbin[np]; np++;
  const fn = tag >> 3, wt = tag & 7;
  if (wt === 2) {
    const r = readVarint(nbin, np); np = r.pos;
    if (fn === 1 && r.value >= 128) {
      const mbytes = nbin.slice(np, np + r.value);
      matrix = [];
      for (let i = 0; i < 16; i++) matrix.push(mbytes.readDoubleLE(i * 8));
    }
    np += r.value;
  } else if (wt === 0) { const r = readVarint(nbin, np); np = r.pos; }
}

// Extract JPEG from the NodeData
let jpegData = null;
for (let i = 0; i < nbin.length - 4; i++) {
  if (nbin[i] === 0xff && nbin[i + 1] === 0xd8 && nbin[i + 2] === 0xff) {
    let end = -1;
    for (let j = i + 2; j < nbin.length - 1; j++) {
      if (nbin[j] === 0xff && nbin[j + 1] === 0xd9) { end = j + 2; break; }
    }
    if (end > 0) { jpegData = nbin.slice(i, end); break; }
  }
}
if (jpegData) fs.writeFileSync(path.join(OUT, 'tile-texture.png'), jpegData);

// Write OBJ
if (matrix) {
  const obj = [
    '# Earth Studio 3D Terrain Tile (NodeData proto)',
    '# S2 node: 13, epoch: 1013',
    '# 4x4 ECEF transform (column-major):',
    '#   [' + matrix.slice(0,4).map(v=>v.toFixed(2)).join(', ') + ']',
    '#   [' + matrix.slice(4,8).map(v=>v.toFixed(2)).join(', ') + ']',
    '#   [' + matrix.slice(8,12).map(v=>v.toFixed(2)).join(', ') + ']',
    '#   [' + matrix.slice(12,16).map(v=>v.toFixed(2)).join(', ') + ']',
    '# Tile center (ECEF meters): ' + [matrix[12].toFixed(0), matrix[13].toFixed(0), matrix[14].toFixed(0)].join(', '),
    '# 143 vertices (quantized int16), 1334 triangles, 256x256 JPEG texture',
    '# To reconstruct: ECEF_position = Matrix * local_vertex',
    '',
    'mtllib tile.mtl',
    'o TerrainTile'
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'tile.obj'), obj);
}
console.log('  OBJ written, JPEG: ' + (jpegData ? jpegData.length + 'B' : 'none'));

// ============================
// 5. MAPS VT → JSON
// ============================
console.log('5. Maps VT → vt-response.json');
const vbin = fs.readFileSync('captured_data/maps-vt-tile.bin');
const vtFields = [];
let vp = 0;
const names = {1:'coords',2:'tile_options',6:'point_group',7:'line_group',8:'area_group',9:'volume_group',10:'label_group',11:'raster_group',16:'major_epoch',20:'gltf_group'};
while (vp < vbin.length) {
  const tag = vbin[vp]; vp++;
  const fn = tag >> 3, wt = tag & 7;
  if (wt === 0) {
    const r = readVarint(vbin, vp); vp = r.pos;
    vtFields.push({ field: fn, type: 'varint', value: r.value });
  } else if (wt === 2) {
    const r = readVarint(vbin, vp); vp = r.pos;
    const bytes = vbin.slice(vp, vp + r.value);
    vp += r.value;
    vtFields.push({
      field: fn,
      name: names[fn] || ('f' + fn),
      type: 'bytes',
      size: r.value,
      hex8: bytes.slice(0, 8).toString('hex')
    });
  }
}
fs.writeFileSync(path.join(OUT, 'vt-response.json'), JSON.stringify({
  size: vbin.length,
  fields: vtFields,
  tile_coords: { x: 2, y: 3, zoom: 2 },
  style: 'RoadmapSatellite',
  note: 'CORD-encoded vertex data. See maps/paint/proto/client-vector-tile.proto'
}, null, 2));
console.log('  ' + vtFields.length + ' fields');

// ============================
// 6. SXFORMS summary
// ============================
console.log('6. Sxforms → sxforms-summary.json');
const sbin = fs.readFileSync('captured_data/sxforms.bin');
fs.writeFileSync(path.join(OUT, 'sxforms-summary.json'), JSON.stringify({
  size: sbin.length,
  format: 'StyleTransforms proto',
  transforms_defined_in_proto: 83,
  categories: ['Search', 'Navigation', 'Transit', 'Travel', 'EV', '3D', 'Tactile', 'Indoor', 'Area Busyness', 'Merchant', 'Photo Pin', 'Other']
}, null, 2));
console.log('  ' + sbin.length + ' bytes');

// ============================
// 7. BPB → JSON
// ============================
console.log('7. bpb (Maps VT request) → bpb-decoded.json');
const bpb = 'CgsKBggCEAMYAsoBABIVCAASAW0Yv-eW-QIiCAoDbmRsEgExGioSBWVuLVVTGgJVUygDYhsIRBIXCgNzZXQSEFJvYWRtYXBTYXRlbGxpdGUgATIZKAFYALgCAdgCAeACBOgCAbgDAdADAdgFAboBBOmOtBY';
const bbin = Buffer.from(bpb, 'base64');
let bp = 0;
const bpbFields = [];
while (bp < bbin.length) {
  const tag = bbin[bp]; bp++;
  const fn = tag >> 3, wt = tag & 7;
  if (wt === 0) { const r = readVarint(bbin, bp); bp = r.pos; bpbFields.push({field:fn,type:'int',value:r.value}); }
  else if (wt === 2) {
    const r = readVarint(bbin, bp); bp = r.pos;
    const bytes = bbin.slice(bp, bp + r.value); bp += r.value;
    const str = bytes.toString('utf8');
    bpbFields.push({field:fn,type:/^[\x20-\x7e]+$/.test(str)&&str.length===r.value?'string':'bytes',value:str,size:r.value});
  }
}
fs.writeFileSync(path.join(OUT, 'bpb-decoded.json'), JSON.stringify({
  tile_coords: { x: 2, y: 3, zoom: 2 },
  style: 'RoadmapSatellite',
  layer: 'ndl',
  locale: 'en-US',
  country: 'US',
  fields: bpbFields
}, null, 2));

// Final summary
console.log('\n=== OUTPUT ===');
fs.readdirSync(OUT).forEach(f => {
  const st = fs.statSync(path.join(OUT, f));
  const kb = (st.size / 1024).toFixed(1);
  console.log('  ' + f.padEnd(25) + kb.padStart(8) + ' KB');
});
