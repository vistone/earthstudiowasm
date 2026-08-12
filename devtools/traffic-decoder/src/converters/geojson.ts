/**
 * converters/geojson.ts — Convert proto messages to GeoJSON (RFC 7946).
 *
 * Supports:
 *   - RenderableEntity  → GeoJSON Feature (Point with latLon)
 *   - FlyToCamera       → GeoJSON Feature (lookAt/lookFrom position)
 *   - OpenKnowledgeCard → GeoJSON Feature (metadata.latLon)
 *   - Placemark         → GeoJSON Feature (latLngAlt)
 *   - EnterStreetView   → GeoJSON Feature
 *   - LatLngAlt         → GeoJSON Feature
 */

interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: Record<string, unknown>;
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

/**
 * Extract coordinates from various proto message shapes.
 */
function extractCoordinates(protoType: string, msg: Record<string, unknown>): [number, number] | null {
  // FlyToCamera / Camera: lookAt or lookFrom
  if (protoType === "FlyToCamera" || protoType === "FlyToCamera") {
    const lookAt = msg.look_at as Record<string, unknown> | undefined;
    const lookFrom = msg.look_from as Record<string, unknown> | undefined;
    const loc = lookAt || lookFrom;
    if (loc?.latitude !== undefined && loc?.longitude !== undefined) {
      return [loc.longitude as number, loc.latitude as number];
    }
  }

  // RenderableEntity: latLon
  const latLon = msg.lat_lon as Record<string, unknown> | undefined;
  if (latLon?.lat !== undefined && latLon?.lon !== undefined) {
    return [latLon.lon as number, latLon.lat as number];
  }

  // OpenKnowledgeCard: metadata.latLon
  const metadata = msg.metadata as Record<string, unknown> | undefined;
  if (metadata?.lat_lon) {
    const ml = metadata.lat_lon as Record<string, unknown>;
    if (ml.latitude !== undefined && ml.longitude !== undefined) {
      return [ml.longitude as number, ml.latitude as number];
    }
  }

  // Placemark / StreetView / LatLngAlt: latLngAlt
  const lla = msg.lat_lng_alt as Record<string, unknown> | undefined;
  if (lla?.latitude !== undefined && lla?.longitude !== undefined) {
    return [lla.longitude as number, lla.latitude as number];
  }

  // Direct latitude/longitude
  if (msg.latitude !== undefined && msg.longitude !== undefined) {
    return [msg.longitude as number, msg.latitude as number];
  }

  // Camera: location
  const location = msg.location as Record<string, unknown> | undefined;
  if (location?.latitude !== undefined && location?.longitude !== undefined) {
    return [location.longitude as number, location.latitude as number];
  }

  return null;
}

/**
 * Extract properties from the message for the GeoJSON properties bag.
 */
function extractProperties(msg: Record<string, unknown>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const excludeKeys = new Set([
    "lat_lon", "look_at", "look_from", "lat_lng_alt", "_proto_type",
    "camera_type", "camera_animation", "camera_presentation_mode",
    "disable_clamping", "panorama", "suppress_fly_to",
  ]);

  for (const [key, value] of Object.entries(msg)) {
    if (key.startsWith("_")) continue;
    if (excludeKeys.has(key)) continue;
    if (key === "location" || key === "rotation" || key === "metadata" || key === "lat_lon") continue;

    // For nested messages used for geometry, skip
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;
      if (nested.latitude !== undefined && nested.longitude !== undefined) continue;
    }

    props[key] = value;
  }

  return props;
}

/**
 * Convert a proto message to GeoJSON.
 */
export function convertToGeoJSON(
  protoType: string,
  msg: Record<string, unknown>
): GeoJSONFeature | GeoJSONFeatureCollection {
  const coords = extractCoordinates(protoType, msg);

  if (!coords) {
    // Return empty FeatureCollection if no coordinates found
    return {
      type: "FeatureCollection",
      features: [],
    };
  }

  const props = extractProperties(msg);
  props._proto_type = protoType;

  const feature: GeoJSONFeature = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: coords,
    },
    properties: props,
  };

  return feature;
}
