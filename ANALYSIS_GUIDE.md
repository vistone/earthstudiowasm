# Earth Web Traffic Analysis Guide

> **Goal**: Capture and decode real HTTP traffic from `https://earth.google.com/web/` using the proto definitions in this repo.

## Prerequisites

- Chrome/Chromium browser
- Node.js 18+ with `tsx` installed (`npm install -g tsx`)
- This repo cloned locally

---

## Step 1: Open Chrome DevTools

1. Navigate to **https://earth.google.com/web/**
2. Open DevTools: `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Opt+I` (Mac)
3. Go to the **Network** tab
4. Check **"Preserve log"** so requests survive page navigations
5. Filter by **Fetch/XHR** (click the Fetch/XHR button) to see only API calls
6. Clear the log before you start testing: click the 🚫 (Clear) button

---

## Step 2: Identify Key Requests by URL Pattern

Based on proto analysis of the 1,316 proto files in this repo, here are the request patterns to watch for:

| Feature | Likely URL Pattern | Proto Message Type | Format |
|---|---|---|---|
| **Bootstrap Config** | `config`, `bootstrap` | `BootstrapClientConfig` | JSPB JSON |
| **Search Autocomplete** | `search/suggest`, `autocomplete` | (search suggest proto) | JSPB JSON |
| **Search Results / Knowledge Card** | `search`, `knowledge`, `entity` | `RenderableEntity` | JSPB JSON |
| **Feature CRUD** (create/edit/delete) | `document`, `feature`, `cloudproject` | `content_editing_model` | JSPB JSON |
| **Map Imagery Tiles** | `tiles`, `kh/` | `MapStyle` + binary tile | Binary (JPEG/PNG/WebP) |
| **3D Terrain / Elevation** | `terrain`, `elevation` | elevation proto | Binary (quantized mesh) |
| **3D Buildings** (glTF / 3D Tiles) | `3d`, `buildings` | building proto | Binary (glTF/3D Tiles) |
| **Voyager / Earth Feed** | `earthfeed`, `voyager`, `feed` | `EarthFeedItem` | JSPB JSON |
| **Earth Mate AI Chat** | `earthmate`, `chat`, `ai` | earth_mate proto | JSPB JSON |
| **Analytics / Logging** | `log`, `stats`, `analytics` | `earth_log` (89 event types) | JSPB JSON |
| **User State / Settings** | `state`, `settings`, `preferences` | state/*.proto (60+ slices) | JSPB JSON |
| **Commands** (sent by client) | `command`, `rpc` | `Command` (34 types, see below) | JSPB JSON |
| **KML Import/Export** | `kml`, `import`, `export` | KML document proto | JSPB JSON |
| **Image Generation** | `imagegen`, `image` | image generator proto | JSPB JSON |
| **Design / Solar / Analysis** | `design`, `solar`, `analysis` | design/analysis proto | JSPB JSON |
| **Street View Metadata** | `streetview`, `photo`, `pano` | photo/meta proto | binary or JSPB JSON |

### The 34 User Commands (commands.proto)

Every user action in Earth Web is sent as a `Command` message (oneof with these variants):

| # | Command | Trigger |
|---|---|---|
| 1 | `ClearSearchHistory` | Click clear search history |
| 2 | `OpenSearchHistory` | Open search history panel |
| 3 | `OpenVoyagerGrid` | [deprecated] Browse Voyager |
| 4 | `OpenVoyagerStory` | [deprecated] Open a story |
| 5 | `PerformSearch` | Type in search box + enter |
| 6 | `OpenFeelingLuckyCard` | Click "I'm Feeling Lucky" |
| 7 | `OpenKnowledgeCard` | Click a place on the map |
| 8 | `FlyToCamera` | Click a search result / deeplink |
| 9 | `OpenCloudProject` | Open a saved project |
| 10 | `CreateCloudProject` | Create new project |
| 11 | `EnterTimeMachine` | Enter historical imagery |
| 12 | `OpenKmlDocument` | Open KML by URL |
| 13 | `EnterTimelapse` | Toggle timelapse mode |
| 14 | `CreatePointPlacemark` | Click "Add placemark" |
| 15 | `EnterStreetView` | Drop Pegman on map |
| 16 | `ToggleLayer` | Toggle any layer in Layers panel |
| 17 | `CreateFeature` | Draw polygon/line on map |
| 18 | `OpenKmlDocumentFromContent` | Paste KML content |
| 19 | `DeleteFeature` | Delete a feature |
| 20 | `EditFeature` | Edit feature properties |
| 21 | `OpenProjectByKey` | Open project by numeric key |
| 22 | `SetHomescreenVisibility` | Open/close Voyager home |
| 23 | `SetBasemapStyle` | Change map style (Satellite/Roadmap/Terrain) |
| 24 | `CreateFeaturesInFolder` | Batch create in folder |
| 25 | `RenderDesign` | [deprecated] |
| 26 | `ViewDesign` | View design details |
| 27 | `CreateDesigns` | Start solar/new build |
| 28 | `ToggleAvailableLayersUi` | Open data catalog |
| 29 | `PreviewDataLayer` | Preview a data layer |
| 30 | `ViewRateCard` | View pricing card |
| 31 | `OpenEarthMateChat` | Open AI Earth Mate |
| 32 | `ShowLayerCardDetails` | Show layer details |
| 33 | `ViewOnDemandAnalysis` | Terrain analysis (slope/aspect/etc) |
| 34 | `OpenImageGenerator` | Open AI image generator |

Commands are batched: `{ commands: [{ performSearch: {...} }, ...] }`.

---

## Step 3: Copy Request/Response Data

For each interesting request:

### Method A: Copy as cURL (best for replay)
1. Right-click the request in DevTools
2. **Copy → Copy as cURL**
3. Paste into a terminal to replay the exact request
4. Save the response body to a file: `curl ... > response.json`

### Method B: Save response directly
1. Right-click the request
2. **Copy → Copy response**
3. Paste into a file: `captured-response.json`

### Method C: Export entire session as HAR
1. Right-click any request
2. **Save all as HAR with content**
3. Use the decoder tool: `npx tsx src/index.ts batch --har earth-traffic.har`

---

## Step 4: Determine the Data Format

Check the **Content-Type** response header:

| Content-Type | Format | How to decode |
|---|---|---|
| `application/json` | **JSPB JSON** — proto fields as camelCase JSON | `decodeJspbJson()` — parse JSON, map camelCase → snake_case, resolve enum strings |
| `application/x-protobuf` | **Binary protobuf** | `decodeBinary()` — use protobuf deserializer |
| `application/octet-stream` | Binary data (tiles, terrain, glTF) | Raw bytes — not proto-decodable |
| `image/jpeg`, `image/png`, `image/webp` | Map tile image | Raw image — not proto-decodable |

### JSPB JSON Conventions

The Earth web client uses **JSPB** (Java Server Protobufs):

| Proto | JSPB JSON | Notes |
|---|---|---|
| `snake_case` field names | `camelCase` keys | `look_at` → `lookAt` |
| Enum values (integers) | Enum names (strings) | `1` → `"CAMERA_ANIMATION_TELEPORT"` |
| `oneof` fields | Only active variant present | `{ "lookAt": {...} }` not `{ "lookAt": ..., "lookFrom": ... }` |
| Optional/absent fields | Omitted from JSON | No `null`, no zero defaults |
| `repeated` fields | JSON arrays | `[{...}, {...}]` |
| Nested messages | Nested JSON objects | `{ "lookAt": { "lat": ..., "lng": ... } }` |

#### Example: Proto → JSPB

Proto (`commands.proto` — `FlyToCamera.LookAt`):
```protobuf
message LookAt {
    optional double latitude = 1;
    optional double longitude = 2;
    optional double altitude = 3;
    optional double range = 4;
    optional double heading = 5;
    optional double tilt = 6;
}
```

JSPB JSON (actual wire format):
```json
{
  "lookAt": {
    "latitude": 40.7128,
    "longitude": -74.006,
    "altitude": 1000,
    "range": 5000,
    "heading": 45,
    "tilt": 30
  },
  "cameraAnimation": "CAMERA_ANIMATION_FLY"
}
```

---

## Step 5: Match Response to Proto Type

Look at the field names and structure to identify which proto message:

### Quick Field Matching Guide

| Response has field... | Proto message type |
|---|---|
| `title`, `description`, `image`, `latLon`, `addressLine` | `RenderableEntity` (Knowledge card) |
| `earthServiceConfig`, `serviceConfig` | `BootstrapClientConfig` |
| `projection`, `imagery`, `threeDFeatures`, `showClouds` | `MapStyle` |
| `performSearch`, `flyToCamera`, `toggleLayer`, `openKnowledgeCard` | `Command` (oneof wrappers) |
| `lookAt` or `lookFrom` | `FlyToCamera` |
| `featureId`, `featureProperties`, `featureStyle` | `CreateFeature` / `EditFeature` |
| `fid` or `mid` | `OpenKnowledgeCard` or `RenderableEntity` |
| `latitude`, `longitude`, `altitude`, `heading`, `tilt` | `LookAt` / `LookFrom` / `Location` + `Rotation` |
| `layerType`, `enabled` | `ToggleLayer` |
| `projectId`, `documentNamespace` | `OpenCloudProject` |
| `date`, `timelapseEnabled` | `EnterTimeMachine` |

### Automated matching:

Use the decoder tool's `--auto` flag:
```bash
npx tsx src/index.ts decode --file captured-response.json --auto
```

This tries each known proto type and scores based on field name overlap, returning the best match with a confidence score.

---

## Step 6: Decode with the Traffic Decoder Tool

```bash
cd devtools/traffic-decoder

# Install dependencies
npm install

# Decode a captured response as a specific type
npx tsx src/index.ts decode --file captured-response.json --type RenderableEntity

# Auto-detect the type
npx tsx src/index.ts decode --file captured-response.json --auto

# Convert to GeoJSON
npx tsx src/index.ts convert --file captured-response.json --type Placemark --format geojson

# Convert to Schema.org JSON-LD
npx tsx src/index.ts convert --file captured-response.json --type RenderableEntity --format schema-org

# Batch process a HAR file
npx tsx src/index.ts batch --har earth-traffic.har

# Decode binary proto file
npx tsx src/index.ts decode --file response.bin --type MapStyle --binary
```

---

## Step 7: Use the Browser Interceptor (Live Capture)

For live interception during a browsing session:

1. Open `devtools/traffic-decoder/earth-traffic-intercept.js` in a text editor
2. Copy the entire script
3. Open Chrome DevTools on `earth.google.com/web/` → **Console** tab
4. Paste and press Enter
5. Use Earth normally — all XHR/fetch requests are logged with colored output
6. Run `exportTraffic()` in console to get JSON dump of all captured traffic
7. Run `clearTraffic()` to reset

---

## Common Workflows

### Workflow 1: Capture a Search Result

1. Open DevTools → Network → Filter Fetch/XHR → Clear
2. Type "Eiffel Tower" in the search box → press Enter
3. Look for `performSearch` in the request body (click on request, see "Payload")
4. Find the response with `title: "Eiffel Tower"`, `latLon`, `description`
5. Copy response → save as `eiffel-tower.json`
6. Decode:
   ```bash
   npx tsx src/index.ts decode --file eiffel-tower.json --auto
   ```
7. Output should identify it as `RenderableEntity` with high confidence

### Workflow 2: Capture a Knowledge Card

1. Click on a place on the map (e.g., a city, landmark, or business)
2. Find the `openKnowledgeCard` request
3. Find the response with `title`, `description[]`, `image`, `fact[]`, `addressLine[]`
4. Save and decode as `RenderableEntity`

### Workflow 3: Capture a FlyTo (Navigation)

1. Click a search result
2. Find `flyToCamera` in a Command batch request
3. The `lookAt` contains latitude, longitude, altitude, range, heading, tilt
4. Decode as `FlyToCamera`

### Workflow 4: Capture Map Style Changes

1. Click the "Map Style" button → change from Satellite to Roadmap
2. Find `setBasemapStyle` request
3. Decode: `{ imagery: "IMAGERY_NORMAL_ROADMAP" }`

---

## Tips

- **Clear between actions**: Clear the Network tab before each test to isolate requests
- **Preserve log ON**: Keeps requests from previous pages when Earth navigates internally
- **Filter by domain**: Add `-domain:googleapis.com` to filter out unrelated Google API calls
- **Look at Initiator**: Click a request and check the "Initiator" tab to see what JavaScript triggered it
- **Response tab vs Preview tab**: The "Response" tab shows raw text; "Preview" shows formatted JSON
- **HAR export**: Export the full session as HAR and use `batch --har` for automated processing
