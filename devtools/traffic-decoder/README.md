# Earth Traffic Decoder

CLI toolkit for capturing, identifying, and decoding HTTP traffic from `https://earth.google.com/web/`.

## Quick Start

```bash
cd devtools/traffic-decoder
npm install
```

## Usage

### Decode a captured response

```bash
# Decode a JSPB JSON response as a specific proto type
npx tsx src/index.ts decode --file captured-response.json --type RenderableEntity

# Auto-detect the proto type
npx tsx src/index.ts decode --file captured-response.json --auto

# Decode binary protobuf
npx tsx src/index.ts decode --file response.bin --type MapStyle --binary
```

### Convert to open formats

```bash
# Convert to GeoJSON (RFC 7946)
npx tsx src/index.ts convert --file response.json --type RenderableEntity --format geojson

# Convert to Schema.org JSON-LD
npx tsx src/index.ts convert --file response.json --type RenderableEntity --format schema-org

# Convert to Universal Camera spec
npx tsx src/index.ts convert --file response.json --type FlyToCamera --format camera

# Write to file instead of stdout
npx tsx src/index.ts convert --file response.json --type RenderableEntity --format geojson -o output.geojson
```

### Batch process HAR files

```bash
# Process an entire HAR file
npx tsx src/index.ts batch --har earth-traffic.har

# Filter by URL pattern
npx tsx src/index.ts batch --har earth-traffic.har --filter "/search"

# Write results to file
npx tsx src/index.ts batch --har earth-traffic.har -o results.json
```

### List known proto types

```bash
npx tsx src/index.ts list-types
```

## Tools Included

### 1. CLI Decoder (`src/index.ts`)

| Command | Description |
|---|---|
| `decode` | Decode JSPB JSON or binary protobuf to readable proto fields |
| `convert` | Convert to GeoJSON, Schema.org, or Universal Camera |
| `batch` | Batch process HAR files, auto-detecting proto types |
| `list-types` | List all known proto types with field signatures |

### 2. Browser Interceptor (`earth-traffic-intercept.js`)

Paste into Chrome DevTools Console on `earth.google.com/web/` to intercept and log all XHR/fetch requests live.

Functions available:
- `exportTraffic()` — Export all captured traffic as JSON
- `exportAsHar()` — Export as HAR-like format for CLI processing
- `filterTraffic(pattern)` — Filter captured requests by URL regex
- `trafficStats()` — Show summary statistics
- `clearTraffic()` — Reset captured data

### 3. Puppeteer Capture (`capture.mjs`)

Automated capture using headless/headful Chrome:

```bash
# Capture for 60 seconds (default)
node capture.mjs

# Headless mode with search
node capture.mjs --headless --search "Eiffel Tower" --duration 30

# Interactive mode (browser stays open, Ctrl+C to stop)
node capture.mjs --interactive

# Custom output file
node capture.mjs --output my-earth-session.har
```

## Supported Proto Types

The auto-detector recognizes **40+ proto message types** across these categories:

| Category | Types | Example Fields |
|---|---|---|
| **knowledge** | `RenderableEntity`, `OpenKnowledgeCard` | `title`, `description`, `latLon`, `addressLine` |
| **config** | `BootstrapClientConfig` | `earthServiceConfig` |
| **mapstyle** | `MapStyle`, `SetBasemapStyle` | `projection`, `imagery`, `threeDFeatures` |
| **command** | `Command` (34 variants) | `performSearch`, `flyToCamera`, `toggleLayer` |
| **camera** | `FlyToCamera`, `Camera` | `lookAt`, `lookFrom`, `cameraAnimation` |
| **search** | `PerformSearch` | `query`, `resultGroupId`, `viewport` |
| **layer** | `ToggleLayer`, `PreviewDataLayer` | `layerType`, `enabled` |
| **feature** | `CreateFeature`, `EditFeature`, `DeleteFeature` | `featureProperties`, `featureStyle` |
| **document** | `OpenCloudProject`, `OpenProjectByKey` | `projectId`, `documentKey` |
| **timemachine** | `EnterTimeMachine`, `EnterTimelapse` | `date`, `timelapseEnabled` |
| **kml** | `OpenKmlDocument`, `OpenKmlDocumentFromContent` | `uri`, `content` |
| **design** | `ViewDesign`, `CreateDesigns` | `selectedDesignId`, `designInputMode` |
| **ai** | `OpenEarthMateChat`, `OpenImageGenerator` | `isOpen`, `initialQuery` |
| **geometry** | `Camera`, `LatLngAlt` | `location`, `rotation`, `fieldOfViewY` |

## Output Formats

### GeoJSON (RFC 7946)

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [2.2945, 48.8584] },
  "properties": { "title": "Eiffel Tower", "mid": "/m/02j81", "_proto_type": "RenderableEntity" }
}
```

### Schema.org JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "TouristAttraction",
  "name": "Eiffel Tower",
  "geo": { "@type": "GeoCoordinates", "latitude": 48.8584, "longitude": 2.2945 },
  "telephone": "+33 1 44 11 23 23"
}
```

### Universal Camera

```json
{
  "format": "universal-camera-v1",
  "position": { "lat": 48.858, "lng": 2.294, "alt": 1500 },
  "target": { "lat": 48.8584, "lng": 2.2945, "alt": 330 },
  "orientation": { "heading": 180, "tilt": 45, "roll": 0 },
  "fov": { "fovy": 35 },
  "range": 1000,
  "animation": "CAMERA_ANIMATION_FLY"
}
```

## JSPB Format

Earth Web uses **JSPB** (Java Server Protobufs) — proto messages serialized as JSON:

- Proto `snake_case` → JSON `camelCase` (`look_at` → `lookAt`)
- Enum integers → Enum strings (`1` → `"CAMERA_ANIMATION_TELEPORT"`)
- Oneof fields → Only active variant present
- Optional fields → Omitted from JSON (no `null`, no defaults)

## Testing

```bash
npm test
```
