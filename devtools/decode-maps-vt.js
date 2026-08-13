#!/usr/bin/env node
// decode-maps-vt.js — Correctly decode Maps VT response with PaintedRegion wrapper
// Response structure: PaintedRegionList → PaintedRegion → ClientVectorTile
const fs = require('fs');

function rV(buf, p) {
  let v = 0n, s = 0n;
  while (p < buf.length) { const b = buf[p++]; v |= BigInt(b & 0x7f) << s; if (!(b & 0x80)) break; s += 7n; }
  return { v: Number(v), pos: p };
}

const bin = fs.readFileSync('captured_data/maps-vt-tile.bin');
let p = 0;

// ============ LAYER 1: PaintedRegionList ============
// field 1 = region (repeated PaintedRegion), wire 2
let tag = rV(bin, p); p = tag.pos;
console.log('PaintedRegionList field ' + (tag.v >> 3) + ' wire ' + (tag.v & 7));

let len = rV(bin, p); p = len.pos;
console.log('region length = ' + len.v + ' bytes\n');
let regionEnd = p + len.v;

// ============ LAYER 2: PaintedRegion ============
let clientVectorTile = null;
while (p < regionEnd) {
  let rt = rV(bin, p); p = rt.pos;
  let fn = rt.v >> 3, wt = rt.v & 7;
  
  if (wt === 0) {
    let val = rV(bin, p); p = val.pos;
    const names = {1:'status', 6:'enable_public_caching', 8:'major_epoch', 10:'combined_epoch', 13:'skip_cache', 14:'routile_version', 16:'may_be_personalized', 17:'payload_attributes'};
    console.log('PaintedRegion ' + (names[fn] || ('f' + fn)) + ' = ' + val.v);
  } else if (wt === 2) {
    let l = rV(bin, p); p = l.pos;
    let data = bin.slice(p, p + l.v);
    p += l.v;
    if (fn === 3) {
      clientVectorTile = data;
      console.log('PaintedRegion data = ' + l.v + ' bytes (ClientVectorTile)\n');
    } else if (fn === 7) {
      console.log('PaintedRegion content_type = "' + data.toString() + '"');
    } else if (fn === 15) {
      console.log('PaintedRegion error_message = "' + data.toString() + '"');
    } else if (fn === 9) {
      console.log('PaintedRegion version_id = "' + data.toString() + '"');
    } else {
      console.log('PaintedRegion f' + fn + ' = <' + l.v + ' bytes>');
    }
  } else if (wt === 5) {
    let v = bin.readFloatLE(p); p += 4;
    console.log('PaintedRegion f' + fn + ' (float ttl_seconds) = ' + v);
  }
}

// ============ LAYER 3: ClientVectorTile ============
if (!clientVectorTile) { console.log('No ClientVectorTile found'); process.exit(1); }
fs.writeFileSync('captured_data/client-vector-tile.bin', clientVectorTile);

const VertexEncoding = {1:'SEQUENTIAL_VARINT', 2:'SEQUENTIAL_FIXED16', 3:'DELTA_VARINT'};
const VertexResolution = {1:'16TH', 2:'4TH', 3:'8TH', 4:'32ND', 5:'64TH', 6:'128TH', 7:'256TH'};

console.log('=== ClientVectorTile (' + clientVectorTile.length + ' bytes) ===\n');

let cp = 0;
while (cp < clientVectorTile.length) {
  let ct = rV(clientVectorTile, cp); cp = ct.pos;
  let fn = ct.v >> 3, wt = ct.v & 7;
  
  if (wt === 0) {
    let val = rV(clientVectorTile, cp); cp = val.pos;
    const names = {14:'attributes', 16:'major_epoch'};
    console.log('  ClientVectorTile ' + (names[fn] || ('f' + fn)) + ' = ' + val.v);
  } else if (wt === 2) {
    let cl = rV(clientVectorTile, cp); cp = cl.pos;
    let data = clientVectorTile.slice(cp, cp + cl.v);
    cp += cl.v;
    const names = {1:'coords', 2:'tile_options', 3:'multi_zoom_style_table', 4:'sprite_map', 6:'point_group', 7:'line_group', 8:'area_group', 9:'volume_group', 10:'label_group', 11:'raster_group', 12:'shader_group'};
    console.log('  ClientVectorTile ' + (names[fn] || ('f' + fn)) + ' = <' + cl.v + ' bytes>');
    
    if (fn === 2) {
      // tile_options
      let tp = 0;
      while (tp < data.length) {
        let tr = rV(data, tp); tp = tr.pos;
        let tfn = tr.v >> 3, twt = tr.v & 7;
        if (twt === 0) {
          let tv = rV(data, tp); tp = tv.pos;
          if (tfn === 1) console.log('    tile_options.vertex_encoding = ' + tv.v + ' (' + (VertexEncoding[tv.v] || '?') + ')');
          else if (tfn === 2) console.log('    tile_options.vertex_resolution = ' + tv.v + ' (' + (VertexResolution[tv.v] || '?') + ')');
          else if (tfn === 3) console.log('    tile_options.line_3d_encoding = ' + tv.v);
        } else if (twt === 2) {
          let tl = rV(data, tp); tp = tl.pos;
          tp += tl.v;
        }
      }
    } else if (fn === 7) {
      // line_group: repeated line_op (field 1)
      console.log('    LineRenderOpGroup:');
      let lp = 0;
      while (lp < data.length) {
        let lr = rV(data, lp); lp = lr.pos;
        let lfn = lr.v >> 3, lwt = lr.v & 7;
        if (lwt === 2) {
          let ll = rV(data, lp); lp = ll.pos;
          let op = data.slice(lp, lp + ll.v);
          lp += ll.v;
          if (lfn === 1) {
            console.log('      LineRenderOp (' + ll.v + ' bytes):');
            let opP = 0;
            let vertexData = null, vertexCount = 0;
            while (opP < op.length) {
              let or = rV(op, opP); opP = or.pos;
              let ofn = or.v >> 3, owt = or.v & 7;
              if (owt === 0) {
                let ov = rV(op, opP); opP = ov.pos;
                if (ofn === 7) vertexCount = ov.v;
              } else if (owt === 2) {
                let ol = rV(op, opP); opP = ol.pos;
                let od = op.slice(opP, opP + ol.v);
                opP += ol.v;
                if (ofn === 1) vertexData = od;
              }
            }
            if (vertexData) {
              console.log('        vertex_data: ' + vertexData.length + ' bytes');
              console.log('        vertex_count: ' + vertexCount);
              console.log('        vertex_data hex: ' + vertexData.slice(0, 50).toString('hex'));
            }
          }
        } else if (lwt === 0) {
          lp = rV(data, lp).pos;
        }
      }
    }
  }
}
