#!/usr/bin/env node
// Proto Binary Decoder - reads .proto sources + captured binary data
// Usage: node devtools/decode-captured.js [config|billing|planetoid|nodedata]

const fs = require('fs');
const path = require('path');

// Parse all proto files in the repo and extract field definitions
function parseAllProtos(rootDir) {
  const msgs = {};
  
  function walk(dir) {
    if (dir.includes('.git') || dir.includes('node_modules')) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.proto')) {
        parseFile(full, msgs);
      }
    }
  }
  
  walk(rootDir);
  return msgs;
}

function parseFile(fp, msgs) {
  let content;
  try { content = fs.readFileSync(fp, 'utf8'); } catch(e) { return; }
  
  let stack = [];
  for (const line of content.split('\n')) {
    const t = line.trim();
    
    if (t.startsWith('message ')) {
      const name = t.split(/\s+/)[1].replace('{','');
      const fullName = stack.length ? stack[stack.length-1] + '.' + name : name;
      stack.push(fullName);
      msgs[fullName] = msgs[fullName] || [];
      // Also register short name
      if (!msgs[name] || msgs[name].length === 0) {
        // Don't overwrite if already exists
      }
    }
    
    if (stack.length) {
      const d = (t.match(/\{/g)||[]).length - (t.match(/\}/g)||[]).length;
      if (d < 0) stack.pop();
    }
    
    const m = t.match(/^(optional|repeated|required)\s+(\S+)\s+(\w+)\s*=\s*(\d+)/);
    if (m && stack.length) {
      msgs[stack[stack.length-1]].push({
        num: parseInt(m[4]),
        name: m[3],
        type: m[2],
        rule: m[1]
      });
    }
  }
}

// Decode binary using field definitions
function decode(binary, msgName, msgs, depth) {
  depth = depth || 0;
  if (depth > 10) return { _max_depth: true };
  
  const fields = msgs[msgName] || [];
  const byNum = {};
  fields.forEach(f => byNum[f.num] = f);
  
  let pos = 0;
  const out = {};
  
  while (pos < binary.length) {
    const tag = binary[pos]; pos++;
    const fn = tag >> 3, wt = tag & 7;
    const f = byNum[fn];
    const key = f ? f.name : ('f' + fn);
    
    if (wt === 0) {
      let v = 0n, s = 0n;
      while (true) { const b = binary[pos++]; v |= BigInt(b & 0x7f) << s; if (!(b & 0x80)) break; s += 7n; }
      out[key] = Number(v);
    } else if (wt === 2) {
      let len = 0, sh = 0;
      while (true) { const b = binary[pos++]; len |= (b & 0x7f) << sh; if (!(b & 0x80)) break; sh += 7; }
      const bytes = binary.slice(pos, pos + len); pos += len;
      
      if (f) {
        // Try to find message type by short name or full name
        const shortType = f.type.split('.').pop();
        if (msgs[shortType]) {
          out[key] = decode(bytes, shortType, msgs, depth + 1);
        } else if (msgs[f.type]) {
          out[key] = decode(bytes, f.type, msgs, depth + 1);
        } else {
          const str = bytes.toString('utf8');
          if (/^[\x20-\x7e]+$/.test(str) && str.length > 1) {
            out[key] = str;
          } else {
            out[key] = '<' + len + ' bytes>';
          }
        }
      } else {
        out[key] = '<' + len + ' bytes>';
      }
    } else if (wt === 1) {
      const v = binary.readDoubleLE(pos); pos += 8;
      out[key] = Math.round(v * 1e6) / 1e6;
    } else if (wt === 5) {
      const v = binary.readFloatLE(pos); pos += 4;
      out[key] = Math.round(v * 1e4) / 1e4;
    }
  }
  return out;
}

// Main
const target = process.argv[2] || 'config';
console.log('Proto Binary Decoder v1.0');
console.log('Target: ' + target + '\n');

console.log('Parsing proto files...');
const msgs = parseAllProtos('.');
console.log('Parsed ' + Object.keys(msgs).length + ' message types\n');

const data = JSON.parse(fs.readFileSync('captured_data/api-responses.json', 'utf8'));
const keys = Object.keys(data);

function findAndDecode(pattern, msgName, isBase64) {
  const k = keys.find(k => k.includes(pattern));
  if (!k) { console.log('Not found: ' + pattern); return; }
  const item = data[k];
  let bin = Buffer.from(item.bodyBase64, 'base64');
  if (isBase64) bin = Buffer.from(bin.toString(), 'base64');
  if (bin.length === 0) { console.log('Empty response'); return; }
  
  console.log('URL: ' + item.url.substring(0, 80));
  console.log('Size: ' + bin.length + ' bytes\n');
  const result = decode(bin, msgName, msgs);
  console.log(JSON.stringify(result, null, 2));
}

if (target === 'config') {
  findAndDecode('earth_pa', 'BootstrapClientConfig', true);
} else if (target === 'billing') {
  findAndDecode('billing', 'ActiveRateCard', true);
} else if (target === 'planetoid') {
  findAndDecode('Planetoid', 'PlanetoidMetadata', false);
} else if (target === 'nodedata') {
  findAndDecode('NodeData', 'NodeData', false);
}
