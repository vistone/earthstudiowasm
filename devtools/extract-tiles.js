#!/usr/bin/env node
// Extract all tile data: textures, vertices, metadata
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('captured_data/api-responses.json', 'utf8'));
const keys = Object.keys(data);
const outDir = 'captured_data/tiles';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Find all NodeData responses
const tileKeys = keys.filter(k => k.includes('NodeData'));

console.log('Extracting data from ' + tileKeys.length + ' tiles...\n');

const tiles = [];

for (const key of tileKeys) {
  const item = data[key];
  const bin = Buffer.from(item.bodyBase64, 'base64');
  
  // Parse URL for node info
  const url = item.url;
  const nodeMatch = url.match(/!1s(\d+)/);
  const epochMatch = url.match(/!2u(\d+)/);
  const nodeId = nodeMatch ? nodeMatch[1] : 'unknown';
  const epoch = epochMatch ? epochMatch[1] : 'unknown';
  
  const tile = { nodeId, epoch, size: bin.length, textures: [], vertexCount: 0, indexCount: 0 };
  
  // Find all JPEG textures in the binary
  let searchPos = 0;
  let texIdx = 0;
  while (searchPos < bin.length - 4) {
    // JPEG start marker: FF D8 FF
    if (bin[searchPos] === 0xff && bin[searchPos+1] === 0xd8 && bin[searchPos+2] === 0xff) {
      // Find JPEG end: FF D9
      let jpegEnd = -1;
      for (let i = searchPos + 2; i < bin.length - 1; i++) {
        if (bin[i] === 0xff && bin[i+1] === 0xd9) {
          jpegEnd = i + 2;
          break;
        }
      }
      if (jpegEnd > 0) {
        const jpegData = bin.slice(searchPos, jpegEnd);
        const jpegLen = jpegData.length;
        
        // Only save if it's a reasonable size (not a tiny thumbnail)
        if (jpegLen > 1000) {
          const texFile = 'tile_' + nodeId + '_tex' + texIdx + '.jpg';
          fs.writeFileSync(path.join(outDir, texFile), jpegData);
          tile.textures.push({ file: texFile, size: jpegLen, offset: searchPos });
          texIdx++;
        }
        searchPos = jpegEnd;
      } else {
        searchPos += 3;
      }
    } else {
      searchPos++;
    }
  }
  
  // Extract vertex/index counts from proto structure
  // Look for length-delimited fields that contain vertex data patterns
  let pos = 0;
  while (pos < bin.length - 2) {
    const tag = bin[pos];
    pos++;
    const wt = tag & 7;
    if (wt === 2) {
      let len = 0, sh = 0;
      while (pos < bin.length) { const b = bin[pos++]; len |= (b & 0x7f) << sh; if (!(b & 0x80)) break; sh += 7; }
      if (pos + len <= bin.length) {
        const bytes = bin.slice(pos, pos + len);
        // Check if this looks like vertex data (repeated 8-byte patterns)
        if (len >= 24 && len % 8 === 0) {
          // Sample first few floats
          if (len >= 24) {
            const f1 = bytes.readFloatLE(0);
            const f2 = bytes.readFloatLE(4);
            const f3 = bytes.readFloatLE(8);
            // Vertex coords are typically in range [-1, 1] or [0, 1] or small values
            if (Math.abs(f1) < 100 && Math.abs(f2) < 100 && Math.abs(f3) < 100) {
              if (len > tile.vertexCount) {
                tile.vertexCount = len;
                tile.vertexSample = [f1, f2, f3];
              }
            }
          }
        }
        // Check if this looks like index data (repeated 2-byte or 4-byte ints)
        if (len >= 6 && len % 2 === 0 && len < 5000) {
          const i1 = bytes.readUInt16LE(0);
          const i2 = bytes.readUInt16LE(2);
          if (i1 < 50000 && i2 < 50000 && i1 !== i2) {
            if (len > tile.indexCount) {
              tile.indexCount = len;
            }
          }
        }
        pos += len;
      }
    }
  }
  
  tiles.push(tile);
  console.log('Node ' + nodeId.padStart(6) + ' | ' + String(tile.size).padStart(6) + 'B | textures: ' + tile.textures.length + ' | size: ' + (tile.textures[0] ? tile.textures[0].size : 0) + 'B');
}

// Save tile index
fs.writeFileSync(path.join(outDir, 'tile-index.json'), JSON.stringify(tiles, null, 2));

console.log('\nTotal tiles: ' + tiles.length);
console.log('Total textures extracted: ' + tiles.reduce((s, t) => s + t.textures.length, 0));
const totalTexBytes = tiles.reduce((s, t) => s + t.textures.reduce((ss, tx) => ss + tx.size, 0), 0);
console.log('Total texture data: ' + (totalTexBytes / 1024).toFixed(1) + ' KB');
console.log('Output: ' + outDir);
