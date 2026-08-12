#!/usr/bin/env node
// Proto Binary Decoder v2.0 — complete type resolution from all 1,316 .proto files
// Usage: node devtools/decode-all.js [config|billing|planetoid|bulkmeta|nodedata|copyrights|all]

const fs = require('fs');
const path = require('path');

// ============================================================
// STEP 1: Parse all proto files, build complete type registry
// ============================================================
function buildTypeRegistry(rootDir) {
  const msgs = {};       // shortName -> [{num, name, type, rule}]
  const fullNames = {};  // fullName -> shortName
  const enums = {};      // shortName -> {valueName: number}
  
  function walk(dir) {
    if (dir.includes('/.git') || dir.includes('node_modules')) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch(e) { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.proto')) parseProtoFile(full);
    }
  }
  
  function parseProtoFile(fp) {
    let content;
    try { content = fs.readFileSync(fp, 'utf8'); } catch(e) { return; }
    
    let packageName = '';
    const pkgMatch = content.match(/^package\s+([\w.]+)\s*;/m);
    if (pkgMatch) packageName = pkgMatch[1];
    
    // Stack: [{name, fullName}]
    let stack = [];
    
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('//') || t.startsWith('/*')) continue;
      
      // Message start
      const msgMatch = t.match(/^message\s+(\w+)\s*\{/);
      if (msgMatch) {
        const shortName = msgMatch[1];
        const fullName = packageName ? packageName + '.' + shortName : shortName;
        stack.push({ shortName, fullName });
        msgs[shortName] = msgs[shortName] || [];
        fullNames[fullName] = shortName;
        continue;
      }
      
      // Enum start
      const enumMatch = t.match(/^enum\s+(\w+)\s*\{/);
      if (enumMatch && stack.length === 0) {
        const shortName = enumMatch[1];
        enums[shortName] = enums[shortName] || {};
        // Track enum body
        let i = content.indexOf(line) + line.length;
        let braceCount = 1;
        while (braceCount > 0 && i < content.length) {
          const ch = content[i];
          if (ch === '{') braceCount++;
          if (ch === '}') braceCount--;
          i++;
        }
        const enumBody = content.substring(content.indexOf(line), i);
        const valMatches = enumBody.matchAll(/(\w+)\s*=\s*(-?\d+)/g);
        for (const vm of valMatches) {
          enums[shortName][vm[1]] = parseInt(vm[2]);
        }
        continue;
      }
      
      // Field
      const fieldMatch = t.match(/^(optional|repeated|required)\s+(\S+)\s+(\w+)\s*=\s*(\d+)/);
      if (fieldMatch && stack.length > 0) {
        const msg = msgs[stack[stack.length-1].shortName];
        msg.push({
          num: parseInt(fieldMatch[4]),
          name: fieldMatch[3],
          type: fieldMatch[2],
          rule: fieldMatch[1]
        });
        continue;
      }
      
      // Brace tracking
      if (stack.length > 0) {
        const opens = (t.match(/\{/g) || []).length;
        const closes = (t.match(/\}/g) || []).length;
        if (closes > opens) stack.pop();
      }
    }
  }
  
  walk(rootDir);
  return { msgs, fullNames, enums };
}

// ============================================================
// STEP 2: Resolve type name to message definition
// ============================================================
function resolveType(typeName, registry) {
  // Already a short name
  if (registry.msgs[typeName]) return typeName;
  
  // Try full name
  if (registry.fullNames[typeName]) return registry.fullNames[typeName];
  
  // Try last segment
  const parts = typeName.split('.');
  const last = parts[parts.length - 1];
  if (registry.msgs[last]) return last;
  
  // Try second-to-last.last (for nested types like ClientConfig.ServiceConfig)
  if (parts.length >= 2) {
    const nested = parts[parts.length - 2] + '.' + last;
    if (registry.msgs[nested]) return nested;
  }
  
  return null;
}

// ============================================================
// STEP 3: Decode binary protobuf using field definitions
// ============================================================
function decodeProto(binary, msgName, registry, depth) {
  depth = depth || 0;
  if (depth > 15) return '__MAX_DEPTH__';
  
  const fields = registry.msgs[msgName] || [];
  const byNum = {};
  fields.forEach(f => {
    if (!byNum[f.num]) byNum[f.num] = [];
    byNum[f.num].push(f);
  });
  
  let pos = 0;
  const out = {};
  
  while (pos < binary.length) {
    if (pos >= binary.length) break;
    const tag = binary[pos]; pos++;
    const fn = tag >> 3;
    const wt = tag & 7;
    const fs = byNum[fn];
    const f = fs ? fs[0] : null;
    
    if (wt === 0) { // varint
      let v = 0n, s = 0n;
      while (pos < binary.length) { 
        const b = binary[pos++]; 
        v |= BigInt(b & 0x7f) << s; 
        if (!(b & 0x80)) break; 
        s += 7n; 
      }
      const key = f ? f.name : ('field_' + fn);
      // Check if this is an enum
      if (f && registry.enums[f.type]) {
        const enumDef = registry.enums[f.type];
        const enumName = Object.keys(enumDef).find(k => enumDef[k] === Number(v));
        out[key] = enumName || Number(v);
      } else if (f && resolveType(f.type, registry)) {
        // It's a message type reference used as varint? Unlikely, treat as int
        out[key] = Number(v);
      } else {
        out[key] = Number(v);
      }
    } else if (wt === 2) { // length-delimited
      let len = 0, sh = 0;
      while (pos < binary.length) { 
        const b = binary[pos++]; 
        len |= (b & 0x7f) << sh; 
        if (!(b & 0x80)) break; 
        sh += 7; 
      }
      if (pos + len > binary.length) { out['_truncated'] = true; break; }
      const bytes = binary.slice(pos, pos + len);
      pos += len;
      
      const key = f ? f.name : ('field_' + fn);
      
      if (f) {
        // Resolve type
        const resolved = resolveType(f.type, registry);
        if (resolved) {
          const sub = decodeProto(bytes, resolved, registry, depth + 1);
          out[key] = sub;
        } else if (f.type === 'string' || f.type === 'bytes') {
          const str = bytes.toString('utf8');
          if (f.type === 'string' || (/^[\x20-\x7e]+$/.test(str) && str.length === len)) {
            out[key] = str;
          } else {
            out[key] = bytes.toString('hex').substring(0, 40) + (len > 20 ? '...(' + len + 'B)' : '');
          }
        } else {
          // Unknown type, try string or hex
          const str = bytes.toString('utf8');
          if (/^[\x20-\x7e]+$/.test(str) && str.length === len && str.length > 1) {
            out[key] = str;
          } else {
            out[key] = '<' + len + ' bytes>';
          }
        }
      } else {
        // Unknown field, try to decode as printable
        const str = bytes.toString('utf8');
        if (/^[\x20-\x7e]+$/.test(str) && str.length > 1 && str.length === len) {
          out[key] = str;
        } else {
          out[key] = '<' + len + ' bytes>';
        }
      }
    } else if (wt === 1) { // 64-bit (double)
      if (pos + 8 > binary.length) break;
      const v = binary.readDoubleLE(pos); pos += 8;
      const key = f ? f.name : ('field_' + fn);
      out[key] = Math.round(v * 1e7) / 1e7;
    } else if (wt === 5) { // 32-bit (float)
      if (pos + 4 > binary.length) break;
      const v = binary.readFloatLE(pos); pos += 4;
      const key = f ? f.name : ('field_' + fn);
      out[key] = Math.round(v * 1e5) / 1e5;
    }
  }
  return out;
}

// ============================================================
// MAIN
// ============================================================
const target = process.argv[2] || 'config';

console.log('Proto Binary Decoder v2.0');
console.log('='.repeat(50));

console.log('Building type registry from 1,316 proto files...');
const registry = buildTypeRegistry('.');
console.log('  Messages: ' + Object.keys(registry.msgs).length);
console.log('  Full names: ' + Object.keys(registry.fullNames).length);
console.log('  Enums: ' + Object.keys(registry.enums).length);

const data = JSON.parse(fs.readFileSync('captured_data/api-responses.json', 'utf8'));
const keys = Object.keys(data);

function decodeOne(pattern, msgName, isTextPlain) {
  const k = keys.find(k => k.includes(pattern));
  if (!k) { console.log('\nNOT FOUND: ' + pattern); return; }
  const item = data[k];
  let bin = Buffer.from(item.bodyBase64, 'base64');
  // Config and billing responses are text/plain with base64-encoded proto inside
  if (isTextPlain && item.contentType === 'text/plain') {
    bin = Buffer.from(bin.toString(), 'base64');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('TYPE: ' + msgName);
  console.log('URL:  ' + item.url.substring(0, 100));
  console.log('CT:   ' + item.contentType);
  
  if (bin.length === 0) { console.log('EMPTY response\n'); return; }
  console.log('SIZE: ' + bin.length + ' bytes\n');
  
  const result = decodeProto(bin, msgName, registry);
  console.log(JSON.stringify(result, null, 2));
}

if (target === 'config' || target === 'all') {
  decodeOne('earth_pa', 'BootstrapClientConfig', true);
}
if (target === 'billing' || target === 'all') {
  decodeOne('billing', 'ActiveRateCard', true);
}
if (target === 'planetoid' || target === 'all') {
  decodeOne('Planetoid', 'PlanetoidMetadata', false);
}
if (target === 'bulkmeta' || target === 'all') {
  decodeOne('BulkMetadata', 'BulkMetadata', false);
}
if (target === 'nodedata' || target === 'all') {
  decodeOne('NodeData_pb__1m2_1s13', 'NodeData', false);
}
if (target === 'copyrights' || target === 'all') {
  decodeOne('Copyrights', 'Copyrights', false);
}

console.log('\nDone.');
