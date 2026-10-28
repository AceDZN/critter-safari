interface GroundPoint { x: number; z: number }

/** Face the displacement actually rendered, including turns within a slow frame.
 * Easing yaw independently from translation makes an animal strafe or backpedal.
 * Stationary redraws keep the last travel heading. */
export function travelHeading(previous: GroundPoint, current: GroundPoint, stationaryHeading: number) {
  const dx = current.x - previous.x, dz = current.z - previous.z;
  return dx * dx + dz * dz > 1e-10 ? Math.atan2(dx, dz) : stationaryHeading;
}
