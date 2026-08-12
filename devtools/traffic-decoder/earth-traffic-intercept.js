/**
 * earth-traffic-intercept.js
 *
 * Browser script — paste into Chrome DevTools Console on earth.google.com/web/
 * to intercept and log all XHR/fetch requests.
 *
 * Usage:
 *   1. Open https://earth.google.com/web/
 *   2. Open DevTools → Console tab
 *   3. Paste this entire script and press Enter
 *   4. Use Earth normally — requests are logged with colored output
 *   5. Run exportTraffic() to get JSON dump
 *   6. Run clearTraffic() to reset
 *   7. Copy the JSON output and save as captured-traffic.json
 */

(function () {
  "use strict";

  const LOG = [];
  let requestId = 0;

  // ── Pretty-print helpers ──────────────────────────────────────────

  /**
   * Format bytes to human-readable string.
   */
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + "B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
    return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  }

  /**
   * Detect likely proto type from URL.
   */
  function guessType(url) {
    if (/search|suggest|autocomplete/i.test(url)) return "🔍 SEARCH";
    if (/config|bootstrap/i.test(url)) return "⚙️ CONFIG";
    if (/knowledge|entity|card/i.test(url)) return "📋 KNOWLEDGE";
    if (/tiles|kh\//i.test(url)) return "🗺️ TILE";
    if (/terrain|elevation/i.test(url)) return "⛰️ TERRAIN";
    if (/3d|buildings|gltf/i.test(url)) return "🏢 3D";
    if (/earthfeed|voyager|feed/i.test(url)) return "📖 FEED";
    if (/earthmate|chat|ai|mate/i.test(url)) return "🤖 AI";
    if (/log|stats|analytics/i.test(url)) return "📊 ANALYTICS";
    if (/state|settings|pref/i.test(url)) return "💾 STATE";
    if (/document|feature|cloudproject|project/i.test(url)) return "📝 DOCUMENT";
    if (/kml|import|export/i.test(url)) return "📄 KML";
    if (/imagegen|image.*generat/i.test(url)) return "🖼️ IMAGEGEN";
    if (/streetview|photo|pano/i.test(url)) return "📷 STREETVIEW";
    if (/design|solar|analysis/i.test(url)) return "📐 DESIGN";
    if (/command|rpc/i.test(url)) return "📤 COMMAND";
    return "❓ OTHER";
  }

  // ── Console logging ───────────────────────────────────────────────

  const COLORS = {
    GET: "color: #4fc3f7; font-weight: bold", // cyan
    POST: "color: #ffb74d; font-weight: bold", // orange
    PUT: "color: #ba68c8; font-weight: bold", // purple
    DELETE: "color: #ef5350; font-weight: bold", // red
    statusOk: "color: #66bb6a", // green
    statusErr: "color: #ef5350", // red
    url: "color: #90a4ae", // gray
    duration: "color: #fff176", // yellow
    size: "color: #ce93d8", // magenta
    type: "color: #4dd0e1; font-weight: bold", // teal
  };

  function logEntry(entry) {
    const methodStyle = COLORS[entry.method] || "color: white";
    const statusStyle = entry.status < 400 ? COLORS.statusOk : COLORS.statusErr;
    const typeLabel = guessType(entry.url);

    console.groupCollapsed(
      `%c${entry.method} %c${entry.status} ${typeLabel} %c${entry.url}`,
      methodStyle,
      statusStyle,
      COLORS.url
    );

    if (entry.duration !== undefined) {
      console.log(`%c⏱ Duration: %c${entry.duration}ms`, "color: gray", COLORS.duration);
    }
    if (entry.bodySize !== undefined) {
      console.log(`%c📦 Body: %c${formatBytes(entry.bodySize)}`, "color: gray", COLORS.size);
    }
    if (entry.contentType) {
      console.log(`%c📋 Content-Type: %c${entry.contentType}`, "color: gray", "color: white");
    }

    // Show request headers for POST/PUT
    if (entry.requestHeaders && (entry.method === "POST" || entry.method === "PUT")) {
      console.log("%c📤 Request Headers:", "color: gray");
      console.table(entry.requestHeaders);
    }

    // Show response headers
    if (entry.responseHeaders) {
      console.log("%c📥 Response Headers:", "color: gray");
      console.table(entry.responseHeaders);
    }

    // Show truncated response body
    if (entry.bodyPreview) {
      const preview = entry.bodyPreview;
      console.log(
        `%c📄 Response Preview (${formatBytes(preview.length)}):`,
        "color: gray"
      );
      console.log(preview);

      // Try to parse and show as table if JSON
      try {
        const parsed = JSON.parse(entry.bodyPreview);
        if (typeof parsed === "object" && parsed !== null) {
          console.log("%c📊 Parsed JSON keys:", "color: gray", Object.keys(parsed));
        }
      } catch (e) {
        // Not JSON — show as is
      }
    }

    console.groupEnd();
  }

  // ── Fetch interceptor ─────────────────────────────────────────────

  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const id = ++requestId;
    const start = performance.now();
    const url = typeof args[0] === "string" ? args[0] : args[0].url;
    const method = (args[1]?.method || "GET").toUpperCase();
    const requestHeaders = args[1]?.headers || {};

    let response;
    try {
      response = await origFetch.apply(this, args);
    } catch (err) {
      const entry = {
        id,
        url,
        method,
        status: 0,
        error: err.message,
        duration: Math.round(performance.now() - start),
      };
      LOG.push(entry);
      console.error(`%c${method} %cERR %c${url} — ${err.message}`,
        COLORS[method], "color: red; font-weight: bold", COLORS.url);
      throw err;
    }

    const duration = Math.round(performance.now() - start);
    const clone = response.clone();
    const contentType = response.headers.get("content-type") || "unknown";

    // Parse response headers
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Read body preview
    clone.text().then((body) => {
      const entry = {
        id,
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        contentType,
        duration,
        bodyPreview: body.substring(0, 2000),
        bodySize: body.length,
        requestHeaders,
        responseHeaders,
        timestamp: new Date().toISOString(),
      };
      LOG.push(entry);
      logEntry(entry);
    }).catch(() => {
      // Binary or streamed response — can't read as text
      const entry = {
        id,
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        contentType,
        duration,
        bodyPreview: "[binary/streamed — cannot read as text]",
        bodySize: response.headers.get("content-length") || "unknown",
        requestHeaders,
        responseHeaders,
        timestamp: new Date().toISOString(),
      };
      LOG.push(entry);
      logEntry(entry);
    });

    return response;
  };

  // ── XHR interceptor ───────────────────────────────────────────────

  const OrigXHR = window.XMLHttpRequest;

  const origOpen = OrigXHR.prototype.open;
  const origSend = OrigXHR.prototype.send;
  const origSetRequestHeader = OrigXHR.prototype.setRequestHeader;

  OrigXHR.prototype.open = function (method, url, ...rest) {
    this.__earth_method = method.toUpperCase();
    this.__earth_url = typeof url === "string" ? url : url.toString();
    this.__earth_id = ++requestId;
    this.__earth_start = performance.now();
    this.__earth_requestHeaders = {};
    return origOpen.apply(this, [method, url, ...rest]);
  };

  OrigXHR.prototype.setRequestHeader = function (header, value) {
    if (!this.__earth_requestHeaders) this.__earth_requestHeaders = {};
    this.__earth_requestHeaders[header] = value;
    return origSetRequestHeader.apply(this, [header, value]);
  };

  OrigXHR.prototype.send = function (body) {
    const xhr = this;

    xhr.addEventListener("load", function () {
      const duration = Math.round(performance.now() - xhr.__earth_start);
      const responseHeaders = {};

      // Parse response headers
      const allHeaders = xhr.getAllResponseHeaders();
      if (allHeaders) {
        allHeaders.split("\r\n").forEach((line) => {
          const colon = line.indexOf(":");
          if (colon > 0) {
            const key = line.substring(0, colon).trim();
            const value = line.substring(colon + 1).trim();
            responseHeaders[key] = value;
          }
        });
      }

      const contentType = xhr.getResponseHeader("content-type") || "unknown";

      const entry = {
        id: xhr.__earth_id,
        url: xhr.__earth_url,
        method: xhr.__earth_method,
        status: xhr.status,
        statusText: xhr.statusText,
        contentType,
        duration,
        bodyPreview: typeof xhr.responseText === "string"
          ? xhr.responseText.substring(0, 2000)
          : "[binary]",
        bodySize: xhr.responseText?.length || xhr.response?.byteLength || "unknown",
        requestHeaders: xhr.__earth_requestHeaders,
        responseHeaders,
        timestamp: new Date().toISOString(),
      };
      LOG.push(entry);
      logEntry(entry);
    });

    xhr.addEventListener("error", function () {
      const entry = {
        id: xhr.__earth_id,
        url: xhr.__earth_url,
        method: xhr.__earth_method,
        status: 0,
        error: "Network error",
        duration: Math.round(performance.now() - xhr.__earth_start),
      };
      LOG.push(entry);
      console.error(`%c${xhr.__earth_method} %cERR %c${xhr.__earth_url} — Network error`,
        COLORS[xhr.__earth_method], "color: red; font-weight: bold", COLORS.url);
    });

    return origSend.apply(this, arguments);
  };

  // ── Export functions ──────────────────────────────────────────────

  /**
   * Export all captured traffic as JSON.
   * Copy the output from the console.
   */
  window.exportTraffic = function () {
    const summary = {
      capturedAt: new Date().toISOString(),
      totalRequests: LOG.length,
      byType: {},
      requests: LOG,
    };

    // Count by type
    for (const entry of LOG) {
      const type = guessType(entry.url);
      summary.byType[type] = (summary.byType[type] || 0) + 1;
    }

    const json = JSON.stringify(summary, null, 2);
    console.log(json);
    return LOG;
  };

  /**
   * Export as simplified HAR-like format for the decoder CLI.
   */
  window.exportAsHar = function () {
    const entries = LOG.map((entry) => ({
      startedDateTime: entry.timestamp,
      time: entry.duration,
      request: {
        method: entry.method,
        url: entry.url,
        headers: Object.entries(entry.requestHeaders || {}).map(([name, value]) => ({
          name,
          value: String(value),
        })),
      },
      response: {
        status: entry.status,
        statusText: entry.statusText || "",
        headers: Object.entries(entry.responseHeaders || {}).map(([name, value]) => ({
          name,
          value: String(value),
        })),
        content: {
          size: entry.bodySize || 0,
          mimeType: entry.contentType || "unknown",
          text: entry.bodyPreview || "",
        },
      },
      timings: {
        send: 0,
        wait: entry.duration || 0,
        receive: 0,
      },
    }));

    const har = {
      log: {
        version: "1.2",
        creator: { name: "EarthTrafficIntercept", version: "1.0" },
        entries,
      },
    };

    const json = JSON.stringify(har, null, 2);
    console.log(json);
    return json;
  };

  /**
   * Filter captured traffic by URL pattern.
   */
  window.filterTraffic = function (pattern) {
    const re = new RegExp(pattern, "i");
    return LOG.filter((e) => re.test(e.url));
  };

  /**
   * Clear all captured traffic.
   */
  window.clearTraffic = function () {
    LOG.length = 0;
    requestId = 0;
    console.log("%c🧹 Traffic log cleared", "color: #66bb6a");
  };

  /**
   * Get summary statistics.
   */
  window.trafficStats = function () {
    const stats = {
      total: LOG.length,
      byStatus: {},
      byMethod: {},
      byType: {},
      totalKB: 0,
      avgDurationMs: 0,
    };

    let totalDuration = 0;
    let withDuration = 0;

    for (const entry of LOG) {
      // Status
      const statusBucket = Math.floor(entry.status / 100) * 100;
      stats.byStatus[statusBucket + "x"] = (stats.byStatus[statusBucket + "x"] || 0) + 1;

      // Method
      stats.byMethod[entry.method] = (stats.byMethod[entry.method] || 0) + 1;

      // Type
      const type = guessType(entry.url);
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Size
      if (typeof entry.bodySize === "number") {
        stats.totalKB += entry.bodySize / 1024;
      }

      // Duration
      if (entry.duration !== undefined) {
        totalDuration += entry.duration;
        withDuration++;
      }
    }

    stats.avgDurationMs = withDuration > 0 ? Math.round(totalDuration / withDuration) : 0;
    stats.totalKB = Math.round(stats.totalKB);

    console.table(stats);
    return stats;
  };

  // ── Startup message ───────────────────────────────────────────────

  console.log(
    "%c🌍 Earth Traffic Interceptor Active%c\n" +
    "──────────────────────────────\n" +
    "  exportTraffic()   — Export all captured traffic as JSON\n" +
    "  exportAsHar()     — Export as HAR-like format for decoder CLI\n" +
    "  filterTraffic(re) — Filter by URL regex pattern\n" +
    "  trafficStats()    — Show summary statistics\n" +
    "  clearTraffic()    — Clear all captured traffic\n\n" +
    "Use Earth normally — all XHR/fetch requests will be logged below.",
    "color: #4fc3f7; font-size: 16px; font-weight: bold",
    "color: #90a4ae"
  );
})();
