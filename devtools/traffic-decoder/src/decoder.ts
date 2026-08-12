/**
 * decoder.ts — Decode captured HTTP response bodies to proto field structures.
 *
 * Handles two formats:
 *   1. JSPB JSON (camelCase field names, enum strings) — the primary wire format
 *   2. Binary protobuf (via protobuf-ts, when .proto → .ts codegen is available)
 */

// ── Field name mapping: snake_case proto → camelCase JSPB ────────────
// This is the standard JSPB convention used by Google's Java Server Protobufs.

/** Convert proto snake_case field name to JSPB camelCase */
export function toJspbName(protoField: string): string {
  // Skip leading underscores, then convert snake_case to camelCase
  return protoField.replace(/(?<!^)_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Convert JSPB camelCase field name back to proto snake_case */
export function toProtoName(jspbField: string): string {
  return jspbField.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}

// ── Known enum string values → they stay as strings in JSPB ─────────

/** Fields that are known to contain enum string values in JSPB */
const ENUM_FIELDS = new Set([
  "camera_animation", "camera_presentation_mode", "card_size",
  "layer_type", "imagery", "projection", "three_d_features",
  "gridlines_layer", "altitude_mode", "document_namespace",
  "design_input_mode", "pano_front_end", "entity_type",
  "entity_class",
]);

/** Check if a field likely contains an enum string */
export function isEnumField(fieldName: string): boolean {
  return ENUM_FIELDS.has(fieldName);
}

// ── Type definitions ────────────────────────────────────────────────

export interface ProtoMessage {
  [field: string]: unknown;
}

// ── JSPB JSON Decoder ───────────────────────────────────────────────

/**
 * Decode a JSPB JSON object into a structured proto message representation.
 *
 * JSPB uses camelCase keys, enum strings, and omits absent optional fields.
 * We convert camelCase → snake_case for canonical representation and annotate
 * enum fields for clarity.
 */
export function decodeJspbJson(
  json: unknown,
  protoType: string
): ProtoMessage {
  if (json === null || json === undefined) return {};
  if (typeof json !== "object") return { _value: json };

  const input = json as Record<string, unknown>;
  const result: ProtoMessage = {};

  for (const [key, value] of Object.entries(input)) {
    const protoName = toProtoName(key);

    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      // Repeated field
      result[protoName] = value.map((v) =>
        typeof v === "object" && v !== null
          ? decodeJspbJson(v, protoType) // nested message
          : v
      );
    } else if (typeof value === "object") {
      // Nested message or enum object
      result[protoName] = decodeJspbJson(value, protoType);
    } else {
      // Scalar: string (possibly enum), number, boolean
      result[protoName] = value;
    }

    // Annotate known enum fields
    if (isEnumField(protoName) && typeof value === "string") {
      result[`_${protoName}_is_enum`] = true;
    }
  }

  result._proto_type = protoType;
  return result;
}

/**
 * Attempt to decode binary protobuf data.
 *
 * This is a placeholder — full binary deserialization requires
 * protobuf-ts codegen from the .proto files. For now, just report
 * the buffer size and suggest using JSPB JSON format.
 */
export function decodeBinary(
  buffer: Uint8Array,
  protoType: string
): ProtoMessage {
  return {
    _proto_type: protoType,
    _format: "binary_protobuf",
    _size_bytes: buffer.length,
    _note: "Binary protobuf decoding requires protobuf-ts codegen. For now, prefer capturing as JSPB JSON (application/json Content-Type).",
  };
}

// ── Pretty-printer ──────────────────────────────────────────────────

/**
 * Format a decoded proto message for display.
 *
 * @param protoType The proto message type name
 * @param message  The decoded message fields
 * @param verbose  If true, include raw proto fields; if false, show annotated summaries
 */
export function formatProtoMessage(
  protoType: string,
  message: ProtoMessage,
  verbose: boolean
): string {
  const lines: string[] = [];

  lines.push(`═`.repeat(60));
  lines.push(` Proto Type: ${protoType}`);
  lines.push(`═`.repeat(60));
  lines.push("");

  // Group fields by category
  const scalarFields: [string, unknown][] = [];
  const nestedFields: [string, unknown][] = [];
  const arrayFields: [string, unknown][] = [];
  const enumFields: [string, unknown][] = [];
  const metaFields: [string, unknown][] = [];

  for (const [key, value] of Object.entries(message)) {
    if (key.startsWith("_")) {
      metaFields.push([key, value]);
    } else if (isEnumField(key)) {
      enumFields.push([key, value]);
    } else if (Array.isArray(value)) {
      arrayFields.push([key, value]);
    } else if (typeof value === "object" && value !== null) {
      nestedFields.push([key, value]);
    } else {
      scalarFields.push([key, value]);
    }
  }

  if (scalarFields.length > 0) {
    lines.push("── Scalar Fields ──");
    for (const [key, value] of scalarFields) {
      const typeLabel = typeof value === "boolean" ? "bool" :
                        typeof value === "number" ? (Number.isInteger(value) ? "int" : "double") :
                        "string";
      lines.push(`  ${key}: ${JSON.stringify(value)}  (${typeLabel})`);
    }
    lines.push("");
  }

  if (enumFields.length > 0) {
    lines.push("── Enum Fields ──");
    for (const [key, value] of enumFields) {
      lines.push(`  ${key}: "${value}"`);
    }
    lines.push("");
  }

  if (nestedFields.length > 0) {
    lines.push("── Nested Messages ──");
    for (const [key, value] of nestedFields) {
      const nested = value as Record<string, unknown>;
      const fieldCount = Object.keys(nested).filter((k) => !k.startsWith("_")).length;
      lines.push(`  ${key}: { ${fieldCount} fields }`);
      for (const [nk, nv] of Object.entries(nested)) {
        if (nk.startsWith("_")) continue;
        lines.push(`    ${nk}: ${JSON.stringify(nv)}`);
      }
    }
    lines.push("");
  }

  if (arrayFields.length > 0) {
    lines.push("── Repeated Fields (arrays) ──");
    for (const [key, value] of arrayFields) {
      const arr = value as unknown[];
      lines.push(`  ${key}: [ ${arr.length} items ]`);
      if (arr.length <= 5 || verbose) {
        for (let i = 0; i < Math.min(arr.length, verbose ? arr.length : 5); i++) {
          if (typeof arr[i] === "object" && arr[i] !== null) {
            const itemKeys = Object.keys(arr[i] as object).filter((k) => !k.startsWith("_"));
            lines.push(`    [${i}]: { ${itemKeys.join(", ")} }`);
          } else {
            lines.push(`    [${i}]: ${JSON.stringify(arr[i])}`);
          }
        }
        if (arr.length > 5 && !verbose) {
          lines.push(`    ... and ${arr.length - 5} more items`);
        }
      }
    }
    lines.push("");
  }

  if (verbose && metaFields.length > 0) {
    lines.push("── Meta ──");
    for (const [key, value] of metaFields) {
      lines.push(`  ${key}: ${JSON.stringify(value)}`);
    }
    lines.push("");
  }

  lines.push(`═`.repeat(60));

  return lines.join("\n");
}
