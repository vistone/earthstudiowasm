const fs = require('fs');

function parseAll(filePaths) {
  const msgs = {};
  for (const fp of filePaths) {
    const content = fs.readFileSync(fp, 'utf8');
    let stack = [];
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (t.startsWith('message ')) {
        const name = t.split(/\s+/)[1].replace('{','');
        stack.push(name);
        msgs[name] = msgs[name] || [];
      }
      if (stack.length) {
        const d = (t.match(/\{/g)||[]).length - (t.match(/\}/g)||[]).length;
        if (d < 0) stack.pop();
      }
      const m = t.match(/^(optional|repeated|required)\s+(\S+)\s+(\w+)\s*=\s*(\d+)/);
      if (m && stack.length) {
        msgs[stack[stack.length-1]].push({num:parseInt(m[4]), name:m[3], type:m[2]});
      }
    }
  }
  return msgs;
}

const msgs = parseAll([
  'google/internal/earth/v1/client_config.proto',
  'google/internal/earth/v1/shared.proto',
  'geo/earth/proto/bootstrap_client_config.proto',
]);

function decode(binary, msgName, indent) {
  indent = indent || 0;
  const fields = msgs[msgName] || [];
  const byNum = {}; fields.forEach(f => byNum[f.num] = f);
  
  let pos = 0, out = {};
  
  while (pos < binary.length) {
    const tag = binary[pos]; pos++;
    const fn = tag >> 3, wt = tag & 7;
    const f = byNum[fn];
    const key = f ? f.name : ('field_' + fn);
    
    if (wt === 0) {
      let v = 0n, s = 0n;
      while (true) { const b = binary[pos++]; v |= BigInt(b & 0x7f) << s; if (!(b & 0x80)) break; s += 7n; }
      out[key] = Number(v);
    } else if (wt === 2) {
      let len = 0, sh = 0;
      while (true) { const b = binary[pos++]; len |= (b & 0x7f) << sh; if (!(b & 0x80)) break; sh += 7; }
      const bytes = binary.slice(pos, pos + len); pos += len;
      
      if (f && (msgs[f.type] || msgs[f.type.split('.').pop()])) {
        // Nested message with known type (strip package prefix)
        const nestedType = msgs[f.type] ? f.type : f.type.split('.').pop();
        const sub = decode(bytes, nestedType, indent + 1);
        if (Object.keys(sub).length > 0) out[key] = sub;
      } else if (f && f.type === 'string') {
        out[key] = bytes.toString('utf8');
      } else {
        const str = bytes.toString('utf8');
        const printable = /^[\x20-\x7e]+$/.test(str) && str.length > 2;
        if (printable) {
          out[key] = str;
        } else if (len < 100) {
          out[key] = bytes.toString('hex');
        } else {
          out[key] = '<binary ' + len + ' bytes>';
        }
      }
    }
  }
  return out;
}

// Decode Config
const bin = fs.readFileSync('captured_data/config.bin');
const decoded = Buffer.from(bin.toString(), 'base64');
const result = decode(decoded, 'BootstrapClientConfig');
console.log(JSON.stringify(result, null, 2));
