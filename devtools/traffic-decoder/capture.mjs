#!/usr/bin/env node
/**
 * capture.mjs — Automated capture of earth.google.com/web/ traffic using Puppeteer.
 *
 * Launches a headful Chrome browser, navigates to Earth Web, and captures
 * all network traffic as a HAR file for later analysis with the decoder CLI.
 *
 * Usage:
 *   node capture.mjs [--headless] [--duration 60] [--output earth-traffic.har]
 *   node capture.mjs --interactive  # Keep browser open, capture until Ctrl+C
 *
 * Requirements:
 *   npm install puppeteer
 */

import puppeteer from "puppeteer";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Configuration ───────────────────────────────────────────────────

const CONFIG = {
  url: "https://earth.google.com/web/",
  headless: process.argv.includes("--headless"),
  output: process.argv.includes("--output")
    ? process.argv[process.argv.indexOf("--output") + 1]
    : "earth-traffic.har",
  duration: (() => {
    const idx = process.argv.indexOf("--duration");
    return idx >= 0 ? parseInt(process.argv[idx + 1], 10) * 1000 : 60000; // default 60s
  })(),
  interactive: process.argv.includes("--interactive"),
  // Actions to perform during capture (configure as needed)
  searchQuery: process.argv.includes("--search")
    ? process.argv[process.argv.indexOf("--search") + 1]
    : null,
};

// ── HAR builder ─────────────────────────────────────────────────────

class HarBuilder {
  constructor() {
    this.entries = [];
    this.startTime = new Date().toISOString();
  }

  addEntry(request, response) {
    const entry = {
      startedDateTime: new Date().toISOString(),
      time: response._timing || 0,
      request: {
        method: request.method(),
        url: request.url(),
        httpVersion: "HTTP/1.1",
        headers: request.headers(),
        queryString: [],
        cookies: [],
        headersSize: -1,
        bodySize: request.postData()?.length || 0,
        postData: request.postData()
          ? { mimeType: "application/json", text: request.postData() }
          : undefined,
      },
      response: {
        status: response.status(),
        statusText: response.statusText(),
        httpVersion: "HTTP/1.1",
        headers: response.headers(),
        cookies: [],
        content: {
          size: response._body?.length || 0,
          mimeType: response.headers()["content-type"] || "application/octet-stream",
          text: response._body || "",
        },
        redirectURL: "",
        headersSize: -1,
        bodySize: response._body?.length || 0,
      },
      cache: {},
      timings: {
        send: 0,
        wait: response._timing || 0,
        receive: 0,
      },
    };

    this.entries.push(entry);
  }

  toJSON() {
    return {
      log: {
        version: "1.2",
        creator: { name: "EarthTrafficCapture", version: "1.0" },
        entries: this.entries,
      },
    };
  }
}

// ── Main capture logic ──────────────────────────────────────────────

async function main() {
  console.log("🌍 Earth Web Traffic Capture");
  console.log("═══════════════════════════");
  console.log(`  URL:        ${CONFIG.url}`);
  console.log(`  Headless:   ${CONFIG.headless}`);
  console.log(`  Duration:   ${CONFIG.duration / 1000}s`);
  console.log(`  Output:     ${CONFIG.output}`);
  console.log(`  Interactive: ${CONFIG.interactive}`);
  if (CONFIG.searchQuery) console.log(`  Search:     "${CONFIG.searchQuery}"`);
  console.log("");

  const har = new HarBuilder();

  const browser = await puppeteer.launch({
    headless: CONFIG.headless ? "new" : false,
    defaultViewport: { width: 1920, height: 1080 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });

  const page = await browser.newPage();

  // ── Network interception ──────────────────────────────────────────

  await page.setRequestInterception(true);

  page.on("request", (request) => {
    // Only intercept API calls (not static assets like images, fonts, etc.)
    const url = request.url();
    const resourceType = request.resourceType();

    // Always allow navigation and document requests
    if (resourceType === "document" || resourceType === "xhr" || resourceType === "fetch") {
      // Log it
      const startTime = Date.now();
      request._startTime = startTime;
    }

    request.continue();
  });

  page.on("response", async (response) => {
    const request = response.request();
    const resourceType = request.resourceType();
    const url = response.url();

    // Only capture API calls
    if (resourceType !== "xhr" && resourceType !== "fetch" && resourceType !== "document") return;

    const timing = Date.now() - (request._startTime || Date.now());
    response._timing = timing;

    // Capture response body for JSON/text responses
    const contentType = response.headers()["content-type"] || "";
    if (
      contentType.includes("json") ||
      contentType.includes("javascript") ||
      contentType.includes("text") ||
      contentType.includes("xml")
    ) {
      try {
        const body = await response.text();
        response._body = body;
      } catch {
        // Binary or streamed — skip body capture
      }
    }

    har.addEntry(request, response);
  });

  // ── Navigate to Earth Web ─────────────────────────────────────────

  console.log("📡 Navigating to Earth Web...");
  try {
    await page.goto(CONFIG.url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    console.log("✅ Earth Web loaded successfully\n");
  } catch (err) {
    console.error("⚠️  Navigation timeout or error:", err.message);
    console.log("   Continuing capture anyway...\n");
  }

  // ── Perform search if configured ──────────────────────────────────

  if (CONFIG.searchQuery) {
    console.log(`🔍 Performing search: "${CONFIG.searchQuery}"`);
    try {
      // Wait for the search box to be available
      await page.waitForSelector('input[type="search"], input[placeholder*="Search"], .searchbox', {
        timeout: 15000,
      });

      // Click the search box and type
      const searchInput = await page.$('input[type="search"], input[placeholder*="Search"], .searchbox input');
      if (searchInput) {
        await searchInput.click();
        await page.keyboard.type(CONFIG.searchQuery, { delay: 50 });
        await page.keyboard.press("Enter");

        // Wait for search results
        await new Promise((r) => setTimeout(r, 5000));
        console.log("✅ Search completed\n");
      } else {
        console.log("⚠️  Search box not found, skipping search\n");
      }
    } catch (err) {
      console.error("⚠️  Search interaction error:", err.message, "\n");
    }
  }

  // ── Wait for capture duration ─────────────────────────────────────

  if (CONFIG.interactive) {
    console.log("🎮 Interactive mode — browser is open.");
    console.log("   Use Earth Web normally. Press Ctrl+C to stop and save.\n");

    // Keep running until interrupted
    await new Promise(() => {}); // Will be killed by Ctrl+C
  } else {
    console.log(`⏱  Capturing traffic for ${CONFIG.duration / 1000} seconds...`);

    // Periodic progress updates
    const interval = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      process.stdout.write(`\r  ${elapsed}s elapsed — ${har.entries.length} requests captured...`);
    }, 5000);

    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, CONFIG.duration));
    clearInterval(interval);
    process.stdout.write("\n");

    console.log(`✅ Capture complete — ${har.entries.length} total requests captured`);
  }

  // ── Save HAR ──────────────────────────────────────────────────────

  const harJson = har.toJSON();
  const outputPath = resolve(CONFIG.output);
  writeFileSync(outputPath, JSON.stringify(harJson, null, 2));

  console.log(`\n📁 HAR file saved to: ${outputPath}`);
  console.log(`   Total entries: ${harJson.log.entries.length}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  npx tsx src/index.ts batch --har ${CONFIG.output}`);
  console.log("");

  await browser.close();
}

// ── Handle Ctrl+C gracefully ────────────────────────────────────────

process.on("SIGINT", () => {
  console.log("\n\n⚠️  Interrupted — HAR file may be incomplete");
  process.exit(0);
});

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
