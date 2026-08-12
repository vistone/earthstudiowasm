/**
 * matcher.ts — Auto-detect which proto message type a JSPB JSON response matches.
 *
 * Works by computing a signature of expected field names for each known proto type,
 * then scoring the overlap between the response's actual fields and each signature.
 */

// ── Known Proto Type Signatures ─────────────────────────────────────
// Each type has a list of expected JSPB field names (camelCase).
// We also track the category for reporting.

export interface TypeSignature {
  fields: string[];
  category: string;
}

export const KNOWN_TYPES: Record<string, TypeSignature> = {
  // ── Knowledge / Search ──
  RenderableEntity: {
    fields: ["title", "knownFor", "description", "mid", "image", "latLon", "addressLine",
             "fact", "source", "cardSet", "phoneNumber", "website", "openHours",
             "openLocationCode", "featureId", "boundingBox", "camera", "mapsUrl",
             "funFact", "placeAttribute", "isLatLonEntity", "error", "entityThumbnailList"],
    category: "knowledge",
  },

  // ── Bootstrap / Config ──
  BootstrapClientConfig: {
    fields: ["earthServiceConfig", "serviceConfig"],
    category: "config",
  },

  // ── Map Style ──
  MapStyle: {
    fields: ["projection", "imagery", "threeDFeatures", "showClouds", "baseLayers",
             "showDiscoveryLayer", "useAnimatedClouds", "gridlinesLayer",
             "showThreeDCoverageLayer", "showUpdatedImageryLayer",
             "showLandParcelsLayer", "showPinnedProjectsLayer"],
    category: "mapstyle",
  },

  // ── User Commands (34 oneof variants) ──
  Command: {
    fields: ["commands", "clearSearchHistory", "openSearchHistory",
             "openVoyagerGrid", "openVoyagerStory",
             "performSearch", "openFeelingLuckyCard", "openKnowledgeCard",
             "flyToCamera", "openCloudProject", "createCloudProject",
             "enterTimeMachine", "openKmlDocument", "enterTimelapse",
             "createPointPlacemark", "enterStreetView", "toggleLayer",
             "createFeature", "openKmlDocumentFromContent",
             "deleteFeature", "editFeature", "openProjectByKey",
             "setHomescreenVisibility", "setBasemapStyle",
             "createFeaturesInFolder", "renderDesign",
             "viewDesign", "createDesigns", "toggleAvailableLayersUi",
             "previewDataLayer", "viewRateCard", "openEarthMateChat",
             "showLayerCardDetails", "viewOnDemandAnalysis",
             "openImageGenerator"],
    category: "command",
  },

  // ── FlyToCamera ──
  FlyToCamera: {
    fields: ["lookAt", "lookFrom", "cameraAnimation", "cameraPresentationMode",
             "panorama", "disableClamping",
             "latitude", "longitude", "altitude", "range", "heading", "tilt", "roll", "fovy"],
    category: "camera",
  },

  // ── ToggleLayer ──
  ToggleLayer: {
    fields: ["layerType", "enabled"],
    category: "layer",
  },

  // ── SetBasemapStyle ──
  SetBasemapStyle: {
    fields: ["imagery"],
    category: "mapstyle",
  },

  // ── PerformSearch ──
  PerformSearch: {
    fields: ["query", "resultGroupId", "viewport", "suppressFlyToResults", "north", "south", "east", "west"],
    category: "search",
  },

  // ── OpenKnowledgeCard ──
  OpenKnowledgeCard: {
    fields: ["fid", "mid", "metadata", "cardSize", "flyToImmediately", "latLon", "query", "layerId"],
    category: "knowledge",
  },

  // ── Feature CRUD ──
  CreateFeature: {
    fields: ["featureProperties", "featureStyle", "documentKey", "overheadImageryProperties"],
    category: "feature",
  },
  EditFeature: {
    fields: ["documentKey", "featureId", "featureProperties", "featureStyle"],
    category: "feature",
  },
  DeleteFeature: {
    fields: ["documentKey", "featureId"],
    category: "feature",
  },

  // ── Cloud Project / Document ──
  OpenCloudProject: {
    fields: ["projectId", "flyToAfterLoad", "resourceKey", "documentNamespace", "presentMode", "featureId"],
    category: "document",
  },
  CreateCloudProject: {
    fields: ["folderId"],
    category: "document",
  },
  OpenProjectByKey: {
    fields: ["documentKey", "flyToAfterLoad"],
    category: "document",
  },

  // ── Time Machine / Timelapse ──
  EnterTimeMachine: {
    fields: ["date", "expanded", "timelapseEnabled", "timelapseFramerateMultiplier", "timelapsePausedAtYear"],
    category: "timemachine",
  },
  EnterTimelapse: {
    fields: ["enabled", "expanded", "framerateMultiplier", "pausedAtYear"],
    category: "timelapse",
  },

  // ── CreatePointPlacemark ──
  CreatePointPlacemark: {
    fields: ["latLngAlt", "altitudeMode", "latitude", "longitude", "altitude"],
    category: "placemark",
  },

  // ── EnterStreetView ──
  EnterStreetView: {
    fields: ["latLngAlt"],
    category: "streetview",
  },

  // ── OpenKmlDocument ──
  OpenKmlDocument: {
    fields: ["uri"],
    category: "kml",
  },
  OpenKmlDocumentFromContent: {
    fields: ["content"],
    category: "kml",
  },

  // ── CreateFeaturesInFolder ──
  CreateFeaturesInFolder: {
    fields: ["commands", "documentKey", "folderName"],
    category: "feature",
  },

  // ── ViewDesign / CreateDesigns ──
  ViewDesign: {
    fields: ["selectedDesignId", "isDesignDetailsOpen", "isDesignViewerOpen"],
    category: "design",
  },
  CreateDesigns: {
    fields: ["designInputMode"],
    category: "design",
  },

  // ── ToggleAvailableLayersUi ──
  ToggleAvailableLayersUi: {
    fields: ["openDataCatalog"],
    category: "layer",
  },

  // ── PreviewDataLayer / ShowLayerCardDetails ──
  PreviewDataLayer: {
    fields: ["earthDataLayerIdentifier"],
    category: "layer",
  },
  ShowLayerCardDetails: {
    fields: ["earthDataLayerIdentifier"],
    category: "layer",
  },

  // ── ViewRateCard ──
  ViewRateCard: {
    fields: ["openRateCard"],
    category: "misc",
  },

  // ── Earth Mate / Image Generator ──
  OpenEarthMateChat: {
    fields: ["isOpen", "initialQuery"],
    category: "ai",
  },
  OpenImageGenerator: {
    fields: ["initialQuery"],
    category: "ai",
  },

  // ── ViewOnDemandAnalysis ──
  ViewOnDemandAnalysis: {
    fields: ["openSlopeAnalysis", "openAspectAnalysis", "openCutAndFillAnalysis", "openContourAnalysis"],
    category: "analysis",
  },

  // ── Geometry primitives ──
  Camera: {
    fields: ["location", "rotation", "screenSize", "fieldOfViewY", "longitude", "latitude", "altitude",
             "heading", "tilt", "roll", "width", "height"],
    category: "geometry",
  },
  LatLngAlt: {
    fields: ["latitude", "longitude", "altitude"],
    category: "geometry",
  },

  // ── SetHomescreenVisibility ──
  SetHomescreenVisibility: {
    fields: ["isOpen"],
    category: "ui",
  },
};

// ── Detection logic ─────────────────────────────────────────────────

export interface AutoDetectResult {
  type: string;
  confidence: number;
  matchedFields?: string[];
  allScores?: Array<{ type: string; score: number }>;
}

/**
 * Extract all field names from a JSON object (recursively, top-level only).
 */
function extractFields(obj: unknown): string[] {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== "object") return [];
  if (Array.isArray(obj)) {
    return obj.flatMap((item) => extractFields(item));
  }
  return Object.keys(obj as Record<string, unknown>);
}

/**
 * Score how well a response matches a known proto type signature.
 *
 * Uses a weighted Jaccard-like score:
 *   score = (matched expected fields)² / (expected fields × actual fields)
 *
 * This penalizes types that have too many unmatched expected fields
 * while rewarding good overlap relative to total fields.
 */
function scoreMatch(expectedFields: string[], actualFields: string[]): number {
  const expectedSet = new Set(expectedFields);
  const actualSet = new Set(actualFields);

  let intersection = 0;
  for (const f of actualSet) {
    if (expectedSet.has(f)) intersection++;
  }

  if (intersection === 0) return 0;

  // Weighted score: intersection² / (expected × actual)
  // High when intersection is a large fraction of BOTH sets
  const denominator = expectedSet.size * actualSet.size;
  return (intersection * intersection) / denominator;
}

/**
 * Auto-detect which proto type a JSPB JSON response most likely matches.
 *
 * @param data  The parsed JSON response body
 * @returns     Best match with confidence score (0–1)
 */
export function autoDetect(data: unknown): AutoDetectResult {
  const actualFields = extractFields(data);

  if (actualFields.length === 0) {
    return { type: "unknown", confidence: 0, matchedFields: [] };
  }

  const scores: Array<{ type: string; score: number }> = [];

  for (const [typeName, sig] of Object.entries(KNOWN_TYPES)) {
    const score = scoreMatch(sig.fields, actualFields);
    if (score > 0) {
      scores.push({ type: typeName, score });
    }
  }

  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    return { type: "unknown", confidence: 0, matchedFields: actualFields };
  }

  const best = scores[0];
  const expectedSet = new Set(KNOWN_TYPES[best.type].fields);
  const matchedFields = actualFields.filter((f) => expectedSet.has(f));

  // Normalize confidence: the raw score is already reasonable as 0–1
  return {
    type: best.type,
    confidence: Math.min(best.score * 10, 1.0), // amplify for readability
    matchedFields,
    allScores: scores.slice(0, 5),
  };
}
