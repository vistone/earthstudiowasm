/**
 * converters/camera.ts — Convert camera-related proto messages to a universal camera format.
 *
 * The Universal Camera format is a projection-independent camera spec:
 *   - position: { lat, lng, alt }  — where the camera IS
 *   - target:   { lat, lng, alt }  — what the camera looks AT
 *   - orientation: { heading, tilt, roll }  — degrees
 *   - fov: { fovy }  — vertical field of view in degrees
 *   - range: number  — distance from camera to target (meters)
 *
 * Supports: FlyToCamera, Camera (geometry.proto), LookAt, LookFrom
 */

interface UniversalCamera {
  format: "universal-camera-v1";
  position: { lat: number; lng: number; alt: number };
  target: { lat: number; lng: number; alt: number };
  orientation: { heading: number; tilt: number; roll: number };
  fov: { fovy: number };
  range: number; // meters
  animation?: string;
  presentationMode?: string;
}

/**
 * Convert a FlyToCamera proto message to Universal Camera format.
 *
 * FlyToCamera has two modes:
 *   - LookAt:  specifies target position + range; camera position is derived
 *   - LookFrom: specifies camera position + orientation; target is implicit
 */
function convertFlyToCamera(msg: Record<string, unknown>): UniversalCamera {
  const lookAt = msg.look_at as Record<string, unknown> | undefined;
  const lookFrom = msg.look_from as Record<string, unknown> | undefined;

  // Default values
  let position = { lat: 0, lng: 0, alt: 0 };
  let target = { lat: 0, lng: 0, alt: 0 };
  let heading = 0;
  let tilt = 0;
  let roll = 0;
  let fovy = 30;
  let range = 0;

  if (lookAt) {
    // LookAt mode: we know the target and range
    target = {
      lat: (lookAt.latitude as number) ?? 0,
      lng: (lookAt.longitude as number) ?? 0,
      alt: (lookAt.altitude as number) ?? 0,
    };
    range = (lookAt.range as number) ?? 0;
    heading = (lookAt.heading as number) ?? 0;
    tilt = (lookAt.tilt as number) ?? 0;
    roll = (lookAt.roll as number) ?? 0;
    fovy = (lookAt.fovy as number) ?? 30;

    // Camera position is derived from target + orientation + range
    // Heading: degrees from North (0=North, 90=East)
    // Tilt: degrees from nadir (0=straight down, 90=horizontal)
    // We compute position by going FROM target towards the camera
    const tiltRad = ((90 - tilt) * Math.PI) / 180; // pitch angle from horizontal
    const headingRad = (heading * Math.PI) / 180;

    const horizontalDistance = range * Math.cos(tiltRad);
    const verticalOffset = range * Math.sin(tiltRad);

    // Earth radius at this latitude for converting meters to degrees
    const earthRadius = 6378137;
    const latRad = (target.lat * Math.PI) / 180;
    const metersPerDegLat = (Math.PI * earthRadius) / 180;
    const metersPerDegLng = metersPerDegLat * Math.cos(latRad);

    // Camera is behind us (heading direction), so we subtract to get camera position
    position = {
      lat: target.lat - (horizontalDistance * Math.cos(headingRad)) / metersPerDegLat,
      lng: target.lng - (horizontalDistance * Math.sin(headingRad)) / metersPerDegLng,
      alt: target.alt + verticalOffset,
    };
  } else if (lookFrom) {
    // LookFrom mode: we know camera position + orientation
    position = {
      lat: (lookFrom.latitude as number) ?? 0,
      lng: (lookFrom.longitude as number) ?? 0,
      alt: (lookFrom.altitude as number) ?? 0,
    };
    heading = (lookFrom.heading as number) ?? 0;
    tilt = (lookFrom.tilt as number) ?? 0;
    roll = (lookFrom.roll as number) ?? 0;
    fovy = (lookFrom.fovy as number) ?? 30;
    // Target is unknown in LookFrom mode
  }

  return {
    format: "universal-camera-v1",
    position,
    target,
    orientation: { heading, tilt, roll },
    fov: { fovy },
    range,
    animation: msg.camera_animation as string | undefined,
    presentationMode: msg.camera_presentation_mode as string | undefined,
  };
}

/**
 * Convert a geometry.proto Camera message to Universal Camera format.
 */
function convertGeometryCamera(msg: Record<string, unknown>): UniversalCamera {
  const location = msg.location as Record<string, unknown> | undefined;
  const rotation = msg.rotation as Record<string, unknown> | undefined;
  const screenSize = msg.screen_size as Record<string, unknown> | undefined;

  return {
    format: "universal-camera-v1",
    position: {
      lat: (location?.latitude as number) ?? 0,
      lng: (location?.longitude as number) ?? 0,
      alt: (location?.altitude as number) ?? 0,
    },
    target: { lat: 0, lng: 0, alt: 0 }, // not available from Camera proto alone
    orientation: {
      heading: (rotation?.heading as number) ?? 0,
      tilt: (rotation?.tilt as number) ?? 0,
      roll: (rotation?.roll as number) ?? 0,
    },
    fov: { fovy: (msg.field_of_view_y as number) ?? 30 },
    range: 0, // not available from Camera proto alone
  };
}

/**
 * Convert a proto message to Universal Camera format.
 */
export function convertToUniversalCamera(
  protoType: string,
  msg: Record<string, unknown>
): UniversalCamera | null {
  switch (protoType) {
    case "FlyToCamera":
      return convertFlyToCamera(msg);
    case "Camera":
      return convertGeometryCamera(msg);
    default:
      // Try to detect camera-like structure
      const hasLookAt = msg.look_at !== undefined;
      const hasLookFrom = msg.look_from !== undefined;
      const hasLocation = msg.location !== undefined;

      if (hasLookAt || hasLookFrom) {
        return convertFlyToCamera(msg);
      }
      if (hasLocation) {
        return convertGeometryCamera(msg);
      }

      return null;
  }
}
