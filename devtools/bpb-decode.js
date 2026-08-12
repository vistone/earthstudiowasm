const bin = Buffer.from("CgsKBggCEAMYAsoBABIVCAASAW0Yv-eW-QIiCAoDbmRsEgExGioSBWVuLVVTGgJVUygDYhsIRBIXCgNzZXQSEFJvYWRtYXBTYXRlbGxpdGUgATIZKAFYALgCAdgCAeACBOgCAbgDAdADAdgFAboBBOmOtBY","base64");
let pos = 0;
function rV(e) { let v=0n,s=0n;while(pos<e){const b=bin[pos++];v|=BigInt(b&0x7f)<<s;if(!(b&0x80))break;s+=7n;}return Number(v); }
function isStr(b) { let s=b.toString("utf8"); return /^[\x20-\x7e]+$/.test(s) && s.length===b.length && s.length>=1; }
function decode(end, indent) {
  const p = "  ".repeat(indent);
  while (pos < end) {
    let tag = rV(end), fn = tag >> 3, wt = tag & 7;
    if (wt === 0) {
      let val = rV(end);
      console.log(p + "f" + fn + " = varint " + val);
    } else if (wt === 2) {
      let len = rV(end), data = bin.slice(pos, pos + len);
      if (isStr(data)) {
        console.log(p + "f" + fn + " = string(" + len + ") " + JSON.stringify(data.toString("utf8")));
        pos += len;
      } else {
        console.log(p + "f" + fn + " = message(" + len + ") {");
        decode(pos + len, indent + 1);
        console.log(p + "}");
      }
    }
  }
}
console.log("=== BPB 完整解码 ===\n");
decode(bin.length, 0);
console.log("\npos=" + pos + "/" + bin.length + (pos === bin.length ? " CORRECT" : " MISALIGNED"));
