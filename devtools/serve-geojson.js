#!/usr/bin/env node
// serve-geojson.js — Start HTTP server to serve GeoJSON files for testing
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8765;
const OUTPUT = path.join(__dirname, '..', 'output');

// Generate an HTML page with embedded Leaflet viewer
const viewerHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Earth Studio GeoJSON Viewer</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: monospace; background: #111; color: #fff; display: flex; }
    #sidebar { width: 320px; background: #1a1a2e; padding: 16px; overflow-y: auto; border-right: 2px solid #333; }
    #map { flex: 1; height: 100vh; }
    h2 { color: #22d3ee; margin: 0 0 8px 0; font-size: 14px; }
    a { color: #34d399; text-decoration: none; display: block; padding: 6px 8px; margin: 2px 0; border-radius: 4px; font-size: 12px; }
    a:hover { background: #2a2a4e; }
    .section { margin-bottom: 16px; }
    .url-hint { color: #666; font-size: 10px; margin-top: 4px; word-break: break-all; }
    .status { color: #fbbf24; font-size: 11px; margin-left: 8px; }
    .legend { margin-top: 20px; padding: 10px; background: #111; border-radius: 4px; font-size: 10px; line-height: 1.6; }
  </style>
</head>
<body>
  <div id="sidebar">
    <h2>🌍 Earth Studio GeoJSON Viewer</h2>
    <p style="color:#666;font-size:11px;margin-bottom:12px;">Click a file to load it on the map</p>
    
    <div class="section">
      <h2>📋 Tile Request (bpb)</h2>
      <a href="#" onclick="loadGeoJSON('bpb-tile-request.geojson');return false">bpb-tile-request.geojson</a>
      <a href="https://geojson.io/#data=https://raw.githubusercontent.com/vistone/earthstudiowasm/main/output/bpb-tile-request.geojson" target="_blank">→ Open in geojson.io ↗</a>
    </div>
    
    <div class="section">
      <h2>📍 Features</h2>
      <a href="#" onclick="loadGeoJSON('placemark.geojson');return false">placemark.geojson (Point/Line/Polygon)</a>
      <a href="#" onclick="loadGeoJSON('knowledge-card.geojson');return false">knowledge-card.geojson</a>
      <a href="#" onclick="loadGeoJSON('camera.geojson');return false">camera.geojson</a>
    </div>
    
    <div class="section">
      <h2>🗺️ Tile Coverage</h2>
      <a href="#" onclick="loadGeoJSON('tile-coverage.geojson');return false">tile-coverage.geojson (48 S2 tiles)</a>
    </div>

    <div class="section">
      <h2>🔗 geojson.io quick links</h2>
      <a href="https://geojson.io/#data=https://raw.githubusercontent.com/vistone/earthstudiowasm/main/output/bpb-tile-request.geojson" target="_blank">bpb tile request ↗</a>
      <a href="https://geojson.io/#data=https://raw.githubusercontent.com/vistone/earthstudiowasm/main/output/placemark.geojson" target="_blank">placemarks ↗</a>
      <a href="https://geojson.io/#data=https://raw.githubusercontent.com/vistone/earthstudiowasm/main/output/tile-coverage.geojson" target="_blank">tile coverage ↗</a>
      <a href="https://geojson.io/#data=https://raw.githubusercontent.com/vistone/earthstudiowasm/main/output/knowledge-card.geojson" target="_blank">knowledge card ↗</a>
      <a href="https://geojson.io/#data=https://raw.githubusercontent.com/vistone/earthstudiowasm/main/output/camera.geojson" target="_blank">camera viewport ↗</a>
    </div>

    <div class="legend">
      <strong>Legend:</strong><br>
      🟦 Tile bounding box<br>
      🔴 Tile center point<br>
      🟢 Placemarks<br>
      🟡 S2 tile coverage
    </div>
  </div>
  <div id="map"></div>

  <script>
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap'
    }).addTo(map);

    let currentLayer;

    async function loadGeoJSON(filename) {
      if (currentLayer) { map.removeLayer(currentLayer); }
      try {
        const resp = await fetch('/' + filename);
        const data = await resp.json();
        currentLayer = L.geoJSON(data, {
          style: function(f) {
            if (f.properties && f.properties.type === 'tile_bounding_box') return {color: '#22d3ee', weight: 2, fillOpacity: 0.1};
            return {color: '#34d399', weight: 2, fillOpacity: 0.2};
          },
          pointToLayer: function(f, latlng) {
            return L.circleMarker(latlng, {radius: 6, color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 0.8});
          },
          onEachFeature: function(f, layer) {
            if (f.properties) {
              let popup = '<pre style="font-size:11px;">' + JSON.stringify(f.properties, null, 2).substring(0, 500) + '</pre>';
              layer.bindPopup(popup);
            }
          }
        }).addTo(map);
        map.fitBounds(currentLayer.getBounds());
        console.log('Loaded:', filename, data.features ? data.features.length + ' features' : '1 feature');
      } catch(e) {
        alert('Failed to load ' + filename + ': ' + e.message);
      }
    }

    // Auto-load first file
    loadGeoJSON('bpb-tile-request.geojson');
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = req.url;
  
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(viewerHTML);
    return;
  }
  
  // Serve GeoJSON files
  const filePath = path.join(OUTPUT, url.replace(/^\//, ''));
  
  if (fs.existsSync(filePath) && filePath.endsWith('.geojson')) {
    res.writeHead(200, { 
      'Content-Type': 'application/geo+json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(fs.readFileSync(filePath));
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('\n=== Earth Studio GeoJSON Viewer ===');
  console.log('Open in browser: http://localhost:' + PORT);
  console.log('');
  console.log('=== geojson.io Quick Links ===');
  const files = fs.readdirSync(OUTPUT).filter(f => f.endsWith('.geojson'));
  files.forEach(f => {
    const url = 'https://geojson.io/#data=https://raw.githubusercontent.com/vistone/earthstudiowasm/main/output/' + f;
    console.log('  ' + f + ': ' + url);
  });
  console.log('\nPress Ctrl+C to stop.\n');
});
