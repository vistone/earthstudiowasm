/**
 * decoder.test.ts — Unit tests for the traffic decoder.
 */

import { describe, it, expect } from "vitest";
import { decodeJspbJson, toJspbName, toProtoName, isEnumField, formatProtoMessage } from "../decoder.js";
import { autoDetect, KNOWN_TYPES } from "../matcher.js";
import { convertToGeoJSON } from "../converters/geojson.js";
import { convertToSchemaOrg } from "../converters/schema-org.js";
import { convertToUniversalCamera } from "../converters/camera.js";

// ── Field name conversion ───────────────────────────────────────────

describe("toJspbName", () => {
  it("converts simple snake_case to camelCase", () => {
    expect(toJspbName("look_at")).toBe("lookAt");
    expect(toJspbName("camera_animation")).toBe("cameraAnimation");
    expect(toJspbName("open_knowledge_card")).toBe("openKnowledgeCard");
  });

  it("handles single words", () => {
    expect(toJspbName("title")).toBe("title");
    expect(toJspbName("mid")).toBe("mid");
  });

  it("handles leading underscore (unlikely but safe)", () => {
    expect(toJspbName("_private")).toBe("_private");
  });
});

describe("toProtoName", () => {
  it("converts camelCase to snake_case", () => {
    expect(toProtoName("lookAt")).toBe("look_at");
    expect(toProtoName("cameraAnimation")).toBe("camera_animation");
    expect(toProtoName("openKnowledgeCard")).toBe("open_knowledge_card");
  });

  it("handles all-lowercase", () => {
    expect(toProtoName("title")).toBe("title");
    expect(toProtoName("mid")).toBe("mid");
  });
});

describe("isEnumField", () => {
  it("recognizes known enum fields", () => {
    expect(isEnumField("camera_animation")).toBe(true);
    expect(isEnumField("layer_type")).toBe(true);
    expect(isEnumField("imagery")).toBe(true);
    expect(isEnumField("projection")).toBe(true);
  });

  it("returns false for scalar fields", () => {
    expect(isEnumField("title")).toBe(false);
    expect(isEnumField("latitude")).toBe(false);
    expect(isEnumField("query")).toBe(false);
  });
});

// ── decodeJspbJson ──────────────────────────────────────────────────

describe("decodeJspbJson", () => {
  it("decodes a simple flat message", () => {
    const input = {
      title: "Eiffel Tower",
      mid: "/m/02j81",
      latLon: { lat: 48.8584, lon: 2.2945 },
    };
    const result = decodeJspbJson(input, "RenderableEntity");

    expect(result._proto_type).toBe("RenderableEntity");
    expect(result.title).toBe("Eiffel Tower");
    expect(result.mid).toBe("/m/02j81");
    expect(result.lat_lon).toEqual({ lat: 48.8584, lon: 2.2945, _proto_type: "RenderableEntity" });
  });

  it("decodes repeated fields as arrays", () => {
    const input = {
      description: ["A famous tower", "In Paris, France"],
      addressLine: ["Champ de Mars", "5 Avenue Anatole France", "75007 Paris"],
    };
    const result = decodeJspbJson(input, "RenderableEntity");

    expect(Array.isArray(result.description)).toBe(true);
    expect(result.description).toHaveLength(2);
    expect(Array.isArray(result.address_line)).toBe(true);
    expect(result.address_line).toHaveLength(3);
  });

  it("handles null/undefined gracefully", () => {
    expect(decodeJspbJson(null, "Test")).toEqual({});
    expect(decodeJspbJson(undefined, "Test")).toEqual({});
  });

  it("handles scalar values", () => {
    expect(decodeJspbJson(42, "Test")).toEqual({ _value: 42 });
    expect(decodeJspbJson("hello", "Test")).toEqual({ _value: "hello" });
  });

  it("annotates enum fields", () => {
    const input = {
      cameraAnimation: "CAMERA_ANIMATION_FLY",
      cameraPresentationMode: "PRESENTATION_MODE_STATIC",
    };
    const result = decodeJspbJson(input, "FlyToCamera");

    expect(result.camera_animation).toBe("CAMERA_ANIMATION_FLY");
    expect(result._camera_animation_is_enum).toBe(true);
    expect(result._camera_presentation_mode_is_enum).toBe(true);
  });

  it("decodes FlyToCamera JSPB JSON", () => {
    const input = {
      lookAt: {
        latitude: 40.7128,
        longitude: -74.006,
        altitude: 1000,
        range: 5000,
        heading: 45,
        tilt: 30,
      },
      cameraAnimation: "CAMERA_ANIMATION_TELEPORT",
    };
    const result = decodeJspbJson(input, "FlyToCamera");

    expect(result.look_at).toBeDefined();
    expect(result.look_at.latitude).toBe(40.7128);
    expect(result.look_at.longitude).toBe(-74.006);
    expect(result.camera_animation).toBe("CAMERA_ANIMATION_TELEPORT");
  });
});

// ── autoDetect ──────────────────────────────────────────────────────

describe("autoDetect", () => {
  it("detects RenderableEntity from knowledge card response", () => {
    const input = {
      title: "Eiffel Tower",
      description: ["Famous tower in Paris"],
      mid: "/m/02j81",
      latLon: { lat: 48.8584, lon: 2.2945 },
      image: { url: "https://example.com/eiffel.jpg", width: 800, height: 600 },
      addressLine: ["Champ de Mars, Paris"],
      fact: [{ name: "Height", factValue: [{ stringValue: "330m" }] }],
    };
    const result = autoDetect(input);

    expect(result.type).toBe("RenderableEntity");
    expect(result.confidence).toBeGreaterThan(0.3);
    expect(result.matchedFields).toContain("title");
    expect(result.matchedFields).toContain("latLon");
  });

  it("detects FlyToCamera from lookAt response", () => {
    const input = {
      lookAt: {
        latitude: 40.7128,
        longitude: -74.006,
        altitude: 1000,
      },
      cameraAnimation: "CAMERA_ANIMATION_FLY",
    };
    const result = autoDetect(input);

    expect(result.type).toBe("FlyToCamera");
    expect(result.confidence).toBeGreaterThan(0.2);
    expect(result.matchedFields).toContain("cameraAnimation");
  });

  it("detects ToggleLayer", () => {
    const input = {
      layerType: "LAYER_TYPE_3D_BUILDINGS",
      enabled: true,
    };
    const result = autoDetect(input);

    expect(result.type).toBe("ToggleLayer");
    expect(result.matchedFields).toContain("layerType");
    expect(result.matchedFields).toContain("enabled");
  });

  it("detects PerformSearch", () => {
    const input = {
      query: "Eiffel Tower",
      resultGroupId: "abc123",
    };
    const result = autoDetect(input);

    expect(result.type).toBe("PerformSearch");
    expect(result.matchedFields).toContain("query");
    expect(result.matchedFields).toContain("resultGroupId");
  });

  it("returns unknown for unrecognized input", () => {
    const input = {
      foo: "bar",
      baz: 42,
      qux: true,
    };
    const result = autoDetect(input);

    expect(result.type).toBe("unknown");
  });
});

// ── formatProtoMessage ──────────────────────────────────────────────

describe("formatProtoMessage", () => {
  it("produces readable output", () => {
    const msg = decodeJspbJson(
      { title: "Test", mid: "/m/test", latLon: { lat: 1, lon: 2 } },
      "RenderableEntity"
    );
    const output = formatProtoMessage("RenderableEntity", msg, false);

    expect(output).toContain("RenderableEntity");
    expect(output).toContain("title");
    expect(output).toContain("Test");
    expect(output).toContain("mid");
    expect(output).toContain("/m/test");
  });

  it("verbose mode includes meta fields", () => {
    const msg = decodeJspbJson({ title: "Test" }, "RenderableEntity");
    const output = formatProtoMessage("RenderableEntity", msg, true);

    expect(output).toContain("_proto_type");
  });
});

// ── KNOWN_TYPES completeness ────────────────────────────────────────

describe("KNOWN_TYPES", () => {
  it("includes all 34 command variants", () => {
    const commandFields = KNOWN_TYPES["Command"].fields;

    // All 34 oneof variants from commands.proto
    const expectedCommands = [
      "clearSearchHistory", "openSearchHistory", "openVoyagerGrid", "openVoyagerStory",
      "performSearch", "openFeelingLuckyCard", "openKnowledgeCard", "flyToCamera",
      "openCloudProject", "createCloudProject", "enterTimeMachine", "openKmlDocument",
      "enterTimelapse", "createPointPlacemark", "enterStreetView", "toggleLayer",
      "createFeature", "openKmlDocumentFromContent", "deleteFeature", "editFeature",
      "openProjectByKey", "setHomescreenVisibility", "setBasemapStyle",
      "createFeaturesInFolder", "renderDesign", "viewDesign", "createDesigns",
      "toggleAvailableLayersUi", "previewDataLayer", "viewRateCard",
      "openEarthMateChat", "showLayerCardDetails", "viewOnDemandAnalysis",
      "openImageGenerator",
    ];

    for (const cmd of expectedCommands) {
      expect(commandFields).toContain(cmd);
    }
  });

  it("all types have fields array", () => {
    for (const [name, sig] of Object.entries(KNOWN_TYPES)) {
      expect(sig.fields, `Type ${name} has no fields`).toBeDefined();
      expect(sig.fields.length, `Type ${name} has empty fields`).toBeGreaterThan(0);
    }
  });
});

// ── GeoJSON converter ───────────────────────────────────────────────

describe("convertToGeoJSON", () => {
  it("converts RenderableEntity to GeoJSON Feature", () => {
    const msg = {
      title: "Eiffel Tower",
      mid: "/m/02j81",
      lat_lon: { lat: 48.8584, lon: 2.2945 },
      description: ["Famous tower"],
    };
    const result = convertToGeoJSON("RenderableEntity", msg);

    expect(result.type).toBe("Feature");
    expect(result.geometry.type).toBe("Point");
    expect(result.geometry.coordinates).toEqual([2.2945, 48.8584]);
    expect(result.properties.title).toBe("Eiffel Tower");
  });

  it("converts FlyToCamera lookAt to GeoJSON", () => {
    const msg = {
      look_at: { latitude: 40.7128, longitude: -74.006, altitude: 1000,
                  range: 5000, heading: 45, tilt: 30 },
      camera_animation: "CAMERA_ANIMATION_FLY",
    };
    const result = convertToGeoJSON("FlyToCamera", msg);

    expect(result.type).toBe("Feature");
    expect(result.geometry.coordinates).toEqual([-74.006, 40.7128]);
  });

  it("returns empty FeatureCollection when no coordinates", () => {
    const msg = { title: "No location here" };
    const result = convertToGeoJSON("Unknown", msg);

    expect(result.type).toBe("FeatureCollection");
    expect(result.features).toHaveLength(0);
  });
});

// ── Schema.org converter ────────────────────────────────────────────

describe("convertToSchemaOrg", () => {
  it("converts RenderableEntity to TouristAttraction", () => {
    const msg = {
      title: "Eiffel Tower",
      description: ["Iconic Paris landmark"],
      mid: "/m/02j81",
      lat_lon: { lat: 48.8584, lon: 2.2945 },
      address_line: ["Champ de Mars, 75007 Paris"],
      phone_number: ["+33 1 44 11 23 23"],
      image: { url: "https://example.com/eiffel.jpg" },
      website: { url: "https://toureiffel.paris" },
    };
    const result = convertToSchemaOrg("RenderableEntity", msg);

    expect(result).not.toBeNull();
    expect(result!["@type"]).toBe("TouristAttraction");
    expect(result!["name"]).toBe("Eiffel Tower");
    expect(result!["telephone"]).toBe("+33 1 44 11 23 23");
    expect(result!["geo"]).toBeDefined();
  });

  it("falls back to generic Thing for unknown types", () => {
    const msg = { title: "Something", description: "Unknown type" };
    const result = convertToSchemaOrg("UnknownType", msg);

    expect(result).not.toBeNull();
    expect(result!["@type"]).toBe("Thing");
    expect(result!["_proto_type"]).toBe("UnknownType");
  });
});

// ── Universal Camera converter ──────────────────────────────────────

describe("convertToUniversalCamera", () => {
  it("converts FlyToCamera with lookAt", () => {
    const msg = {
      look_at: {
        latitude: 48.8584, longitude: 2.2945, altitude: 330,
        range: 1000, heading: 180, tilt: 45, roll: 0, fovy: 35,
      },
      camera_animation: "CAMERA_ANIMATION_FLY",
      camera_presentation_mode: "PRESENTATION_MODE_POI_ORBIT",
    };
    const result = convertToUniversalCamera("FlyToCamera", msg);

    expect(result).not.toBeNull();
    expect(result!.format).toBe("universal-camera-v1");
    expect(result!.target.lat).toBe(48.8584);
    expect(result!.target.lng).toBe(2.2945);
    expect(result!.orientation.heading).toBe(180);
    expect(result!.orientation.tilt).toBe(45);
    expect(result!.fov.fovy).toBe(35);
    expect(result!.animation).toBe("CAMERA_ANIMATION_FLY");
    expect(result!.presentationMode).toBe("PRESENTATION_MODE_POI_ORBIT");
  });

  it("converts geometry Camera", () => {
    const msg = {
      location: { latitude: 40.7128, longitude: -74.006, altitude: 500 },
      rotation: { heading: 90, tilt: 30, roll: 0 },
      field_of_view_y: 45,
    };
    const result = convertToUniversalCamera("Camera", msg);

    expect(result).not.toBeNull();
    expect(result!.position.lat).toBe(40.7128);
    expect(result!.position.lng).toBe(-74.006);
    expect(result!.orientation.heading).toBe(90);
    expect(result!.fov.fovy).toBe(45);
  });

  it("returns null for non-camera types", () => {
    const msg = { title: "Not a camera" };
    const result = convertToUniversalCamera("RenderableEntity", msg);
    expect(result).toBeNull();
  });
});
