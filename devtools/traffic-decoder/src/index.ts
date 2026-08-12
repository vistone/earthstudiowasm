#!/usr/bin/env node
/**
 * Earth Traffic Decoder — CLI entry point
 *
 * Decodes HTTP responses from earth.google.com/web/ by matching them against
 * proto message definitions and converting to open formats.
 *
 * Usage:
 *   npx tsx src/index.ts decode --file response.json --type RenderableEntity
 *   npx tsx src/index.ts decode --file response.json --auto
 *   npx tsx src/index.ts convert --file response.json --type Placemark --format geojson
 *   npx tsx src/index.ts batch --har earth-traffic.har
 */

import { Command } from "commander";
import { readFileSync, writeFileSync } from "node:fs";
import { decodeJspbJson, decodeBinary, formatProtoMessage } from "./decoder.js";
import { autoDetect } from "./matcher.js";
import { convertToGeoJSON, convertToSchemaOrg, convertToUniversalCamera } from "./converters/index.js";
import type { HarFile, HarEntry } from "./har-types.js";

const program = new Command();

program
  .name("earth-traffic-decoder")
  .description("Decode and analyze HTTP traffic from earth.google.com/web/")
  .version("1.0.0");

// ── decode ──────────────────────────────────────────────────────────
program
  .command("decode")
  .description("Decode a captured HTTP response body to proto fields")
  .requiredOption("-f, --file <path>", "Path to the captured response file (JSON or binary)")
  .option("-t, --type <name>", "Proto message type name (e.g., RenderableEntity)")
  .option("-a, --auto", "Auto-detect the proto type")
  .option("-b, --binary", "Input is binary protobuf (not JSPB JSON)")
  .option("-v, --verbose", "Show verbose output including raw proto fields")
  .action(async (opts) => {
    const raw = readFileSync(opts.file);
    let data: unknown;
    let decoded: unknown;

    // Detect auto mode
    if (opts.auto) {
      if (opts.binary) {
        console.error("Error: --auto is only supported for JSPB JSON, not binary");
        process.exit(1);
      }
      data = JSON.parse(raw.toString("utf-8"));
      const result = autoDetect(data);
      console.log(`\n🔍 Auto-detect: ${result.type} (confidence: ${(result.confidence * 100).toFixed(1)}%)\n`);

      if (result.confidence < 0.3) {
        console.log("⚠️  Low confidence. Try specifying --type explicitly.\n");
      }

      decoded = decodeJspbJson(data, result.type);
      console.log(formatProtoMessage(result.type, decoded as Record<string, unknown>, opts.verbose ?? false));
      return;
    }

    if (!opts.type) {
      console.error("Error: Either --type or --auto is required");
      process.exit(1);
    }

    // Decode
    if (opts.binary) {
      decoded = decodeBinary(new Uint8Array(raw), opts.type);
    } else {
      data = JSON.parse(raw.toString("utf-8"));
      decoded = decodeJspbJson(data, opts.type);
    }

    console.log(formatProtoMessage(opts.type, decoded as Record<string, unknown>, opts.verbose ?? false));
  });

// ── convert ─────────────────────────────────────────────────────────
program
  .command("convert")
  .description("Convert a decoded proto response to an open format")
  .requiredOption("-f, --file <path>", "Path to the captured response file")
  .requiredOption("-t, --type <name>", "Proto message type name")
  .requiredOption("--format <fmt>", "Output format: geojson | schema-org | camera")
  .option("-b, --binary", "Input is binary protobuf")
  .option("-o, --output <path>", "Write output to file instead of stdout")
  .action(async (opts) => {
    const raw = readFileSync(opts.file);
    let data: unknown;
    let decoded: unknown;

    if (opts.binary) {
      decoded = decodeBinary(new Uint8Array(raw), opts.type);
    } else {
      data = JSON.parse(raw.toString("utf-8"));
      decoded = decodeJspbJson(data, opts.type);
    }

    let output: string;
    switch (opts.format) {
      case "geojson":
        output = JSON.stringify(convertToGeoJSON(opts.type, decoded as Record<string, unknown>), null, 2);
        break;
      case "schema-org":
        output = JSON.stringify(convertToSchemaOrg(opts.type, decoded as Record<string, unknown>), null, 2);
        break;
      case "camera":
        output = JSON.stringify(convertToUniversalCamera(opts.type, decoded as Record<string, unknown>), null, 2);
        break;
      default:
        console.error(`Unknown format: ${opts.format}. Use geojson, schema-org, or camera`);
        process.exit(1);
    }

    if (opts.output) {
      writeFileSync(opts.output, output);
      console.error(`Wrote ${opts.format} output to ${opts.output}`);
    } else {
      console.log(output);
    }
  });

// ── batch ───────────────────────────────────────────────────────────
program
  .command("batch")
  .description("Batch process a HAR file, decoding all entries")
  .requiredOption("--har <path>", "Path to HAR file")
  .option("-o, --output <path>", "Write output to file instead of stdout")
  .option("--filter <pattern>", "Only process entries whose URL matches this regex")
  .option("--json-only", "Only process JSON (JSPB) entries")
  .action(async (opts) => {
    const harRaw = readFileSync(opts.har, "utf-8");
    const har: HarFile = JSON.parse(harRaw);

    const entries = har.log.entries;
    const filterRe = opts.filter ? new RegExp(opts.filter, "i") : null;

    const results: BatchResult[] = [];

    for (const entry of entries) {
      if (filterRe && !filterRe.test(entry.request.url)) continue;

      const mimeType = entry.response.content.mimeType;
      const isJson = mimeType.includes("json") || mimeType.includes("javascript");
      if (opts.jsonOnly && !isJson) continue;

      if (!isJson) {
        results.push({
          url: entry.request.url,
          method: entry.request.method,
          status: entry.response.status,
          contentType: mimeType,
          type: null,
          confidence: 0,
          note: "Skipped: non-JSON response (use --no-json-only to attempt binary decode)",
        });
        continue;
      }

      let text = entry.response.content.text;
      // Some HAR files store base64-encoded content
      if (entry.response.content.encoding === "base64" && text) {
        text = Buffer.from(text, "base64").toString("utf-8");
      }

      if (!text) {
        results.push({
          url: entry.request.url,
          method: entry.request.method,
          status: entry.response.status,
          contentType: mimeType,
          type: null,
          confidence: 0,
          note: "Empty response body",
        });
        continue;
      }

      try {
        const json = JSON.parse(text);
        const detected = autoDetect(json);
        results.push({
          url: entry.request.url,
          method: entry.request.method,
          status: entry.response.status,
          contentType: mimeType,
          type: detected.type,
          confidence: detected.confidence,
          size: text.length,
          fields: detected.matchedFields?.slice(0, 20),
        });
      } catch {
        results.push({
          url: entry.request.url,
          method: entry.request.method,
          status: entry.response.status,
          contentType: mimeType,
          type: null,
          confidence: 0,
          note: "Failed to parse as JSON",
        });
      }
    }

    const output = JSON.stringify({ total: results.length, results }, null, 2);
    if (opts.output) {
      writeFileSync(opts.output, output);
      console.error(`Wrote ${results.length} batch results to ${opts.output}`);
    } else {
      console.log(output);
    }
  });

// ── list-types ──────────────────────────────────────────────────────
program
  .command("list-types")
  .description("List all known proto message types with their field signatures")
  .action(async () => {
    const { KNOWN_TYPES } = await import("./matcher.js");
    for (const [name, info] of Object.entries(KNOWN_TYPES as Record<string, { fields: string[]; category: string }>)) {
      console.log(`\n${name} (${info.category})`);
      console.log(`  Fields: ${info.fields.join(", ")}`);
    }
  });

interface BatchResult {
  url: string;
  method: string;
  status: number;
  contentType: string;
  type: string | null;
  confidence: number;
  size?: number;
  note?: string;
  fields?: string[];
}

program.parse();
