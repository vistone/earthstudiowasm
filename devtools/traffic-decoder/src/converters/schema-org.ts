/**
 * converters/schema-org.ts — Convert proto messages to Schema.org JSON-LD.
 *
 * Supports:
 *   - RenderableEntity → schema:TouristAttraction / schema:Place
 *   - Knowledge card results → schema:Place with rich metadata
 *
 * Schema.org types (https://schema.org/):
 *   - TouristAttraction: title, description, image, geo, address, telephone
 *   - Place: name, description, image, geo, address, telephone, openingHours
 */

interface SchemaOrgThing {
  "@context": "https://schema.org";
  "@type": string;
  [key: string]: unknown;
}

/**
 * Convert RenderableEntity to Schema.org Place / TouristAttraction.
 */
function convertRenderableEntity(msg: Record<string, unknown>): SchemaOrgThing {
  const result: SchemaOrgThing = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
  };

  if (msg.title) result["name"] = msg.title;
  if (msg.known_for) result["alternateName"] = msg.known_for;

  // description is a repeated string field
  if (Array.isArray(msg.description) && msg.description.length > 0) {
    result["description"] = msg.description.join("\n");
  }

  // Image
  const image = msg.image as Record<string, unknown> | undefined;
  if (image?.url) {
    result["image"] = image.url;
  }

  // Geo coordinates
  const latLon = msg.lat_lon as Record<string, unknown> | undefined;
  if (latLon?.lat !== undefined && latLon?.lon !== undefined) {
    result["geo"] = {
      "@type": "GeoCoordinates",
      "latitude": latLon.lat,
      "longitude": latLon.lon,
    };
  }

  // Address
  if (Array.isArray(msg.address_line) && msg.address_line.length > 0) {
    result["address"] = {
      "@type": "PostalAddress",
      "streetAddress": msg.address_line.join(", "),
    };
  }

  // Phone
  if (Array.isArray(msg.phone_number) && msg.phone_number.length > 0) {
    result["telephone"] = msg.phone_number[0];
  }

  // Website
  const website = msg.website as Record<string, unknown> | undefined;
  if (website?.url) {
    result["url"] = website.url;
  }
  if (msg.maps_url) {
    result["sameAs"] = msg.maps_url;
  }

  // Open hours
  const openHours = msg.open_hours as Record<string, unknown> | undefined;
  if (openHours?.day && Array.isArray(openHours.day)) {
    const hoursSpecs: unknown[] = [];
    for (const day of openHours.day) {
      const d = day as Record<string, unknown>;
      if (d.day_name && Array.isArray(d.open_interval) && d.open_interval.length > 0) {
        hoursSpecs.push({
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": `https://schema.org/${d.day_name}`,
          "opens": d.open_interval[0]?.toString().split("–")[0]?.trim(),
          "closes": d.open_interval[0]?.toString().split("–")[1]?.trim(),
        });
      }
    }
    if (hoursSpecs.length > 0) {
      result["openingHoursSpecification"] = hoursSpecs;
    }
  }

  // MID as identifier
  if (msg.mid) {
    result["identifier"] = `mid:${msg.mid}`;
  }

  // Facts as additional properties
  if (Array.isArray(msg.fact) && msg.fact.length > 0) {
    const additionalProperties: unknown[] = [];
    for (const fact of msg.fact) {
      const f = fact as Record<string, unknown>;
      if (f.name && Array.isArray(f.fact_value)) {
        const values = f.fact_value.map((fv: Record<string, unknown>) => fv.string_value).filter(Boolean);
        if (values.length > 0) {
          additionalProperties.push({
            "@type": "PropertyValue",
            "name": f.name,
            "value": values.join(", "),
          });
        }
      }
    }
    if (additionalProperties.length > 0) {
      result["additionalProperty"] = additionalProperties;
    }
  }

  return result;
}

/**
 * Convert a proto message to Schema.org JSON-LD.
 */
export function convertToSchemaOrg(
  protoType: string,
  msg: Record<string, unknown>
): SchemaOrgThing | null {
  switch (protoType) {
    case "RenderableEntity":
      return convertRenderableEntity(msg);

    default:
      // Generic fallback: wrap as a Thing with available fields
      const thing: SchemaOrgThing = {
        "@context": "https://schema.org",
        "@type": "Thing",
        _proto_type: protoType,
      };

      if (msg.title) thing["name"] = msg.title;
      if (msg.description) {
        const desc = Array.isArray(msg.description) ? msg.description.join("\n") : msg.description;
        thing["description"] = desc;
      }
      if (msg.url) thing["url"] = msg.url;

      // Copy all non-metadata fields
      for (const [key, value] of Object.entries(msg)) {
        if (key.startsWith("_")) continue;
        if (!(key in thing)) {
          thing[key] = value;
        }
      }

      return thing;
  }
}
