export interface HabitatObstacle { x: number; z: number; r: number }
export type FoliageKind = 'cypress' | 'bush' | 'olive' | 'anemone' | 'poppy-daisy';
export type HabitatPath = 'winding' | 'diagonal' | 'fork' | 'crescent' | 'twin' | 'loop';
export interface HabitatConfig {
  id: string;
  titleHe: string;
  titleEn: string;
  grass: number;
  earth: number;
  path: HabitatPath;
  border: 'timber' | 'stone' | 'mixed';
  feature: 'ferns' | 'flowers' | 'berries' | 'limestone' | 'orchard' | 'cypress' | 'creek' | 'pond' | 'leaves' | 'crossroads';
  foliage: readonly FoliageKind[];
}

/** Ten consecutive five-level chapters; no grade or age gates. */
export const CHAPTERS: readonly HabitatConfig[] = [
  { id: 'fern-clearing', titleHe: 'קרחת השרכים', titleEn: 'Fern Clearing', grass: 0x4e7335, earth: 0x856443, path: 'winding', border: 'timber', feature: 'ferns', foliage: ['poppy-daisy'] },
  { id: 'wildflower-meadow', titleHe: 'אחו פרחי הבר', titleEn: 'Wildflower Meadow', grass: 0x597b3c, earth: 0x99744f, path: 'crescent', border: 'timber', feature: 'flowers', foliage: ['anemone', 'poppy-daisy'] },
  { id: 'berry-garden', titleHe: 'גינת פירות היער', titleEn: 'Berry Hedge Garden', grass: 0x486c39, earth: 0x805c40, path: 'fork', border: 'mixed', feature: 'berries', foliage: ['bush', 'anemone'] },
  { id: 'limestone-court', titleHe: 'חצר אבן הגיר', titleEn: 'Limestone Courtyard', grass: 0x6c8050, earth: 0xa28b67, path: 'diagonal', border: 'stone', feature: 'limestone', foliage: ['cypress', 'poppy-daisy'] },
  { id: 'olive-edge', titleHe: 'שולי מטע הזיתים', titleEn: 'Olive Orchard Edge', grass: 0x6a7d4c, earth: 0x9b7d55, path: 'twin', border: 'mixed', feature: 'orchard', foliage: ['olive', 'bush', 'poppy-daisy'] },
  { id: 'cypress-glade', titleHe: 'חורשת הברושים', titleEn: 'Cypress Glade', grass: 0x4c7140, earth: 0x856a4e, path: 'diagonal', border: 'stone', feature: 'cypress', foliage: ['cypress', 'anemone'] },
  { id: 'dry-creek', titleHe: 'ערוץ הנחל היבש', titleEn: 'Dry Creek Garden', grass: 0x7b8751, earth: 0xb39a70, path: 'winding', border: 'mixed', feature: 'creek', foliage: ['bush', 'poppy-daisy'] },
  { id: 'pond-terrace', titleHe: 'גדת הבריכה', titleEn: 'Pondside Terrace', grass: 0x527c51, earth: 0x8e795b, path: 'crescent', border: 'stone', feature: 'pond', foliage: ['cypress', 'poppy-daisy'] },
  { id: 'amber-glade', titleHe: 'קרחת עלי הסתיו', titleEn: 'Amber Leaf Glade', grass: 0x858049, earth: 0x9c6c42, path: 'loop', border: 'timber', feature: 'leaves', foliage: ['olive', 'anemone'] },
  { id: 'reserve-crossroads', titleHe: 'מפגש שבילי השמורה', titleEn: 'Reserve Crossroads', grass: 0x597544, earth: 0x967654, path: 'fork', border: 'mixed', feature: 'crossroads', foliage: ['cypress', 'bush', 'poppy-daisy'] },
];

export function habitatForLevel(levelIndex: number): HabitatConfig {
  const index = Number.isFinite(levelIndex) ? Math.max(0, Math.floor(levelIndex)) : 0;
  return CHAPTERS[Math.min(CHAPTERS.length - 1, Math.floor(index / 5))];
}

// Authored landmarks avoid every campaign spawn family, including the opening
// two-/three-animal arrangements. Wide side lanes remain available around them.
const LAYOUTS: readonly (readonly HabitatObstacle[])[] = [
  [{ x: -5.2, z: .9, r: .52 }, { x: 5.2, z: .9, r: .52 }, { x: 0, z: -.55, r: .50 }, { x: -3.8, z: 3.5, r: .48 }, { x: 3.8, z: 3.5, r: .48 }],
  [{ x: -4.8, z: 3.2, r: .56 }, { x: 4.8, z: -.45, r: .50 }, { x: -1.25, z: -3.85, r: .46 }, { x: 1.3, z: -3.85, r: .46 }, { x: 3.9, z: 3.6, r: .48 }],
  [{ x: -1.25, z: -3.85, r: .48 }, { x: 1.25, z: -3.85, r: .48 }, { x: 0, z: -.45, r: .52 }, { x: -5.25, z: 1.15, r: .50 }, { x: 5.25, z: 1.15, r: .50 }],
  [{ x: -4.5, z: 3.5, r: .54 }, { x: 4.5, z: 3.5, r: .54 }, { x: -.2, z: -.5, r: .48 }, { x: -5.35, z: -.55, r: .48 }, { x: 5.35, z: -.55, r: .48 }],
  [{ x: -5.25, z: -.5, r: .52 }, { x: 4.8, z: 3.4, r: .54 }, { x: 1.25, z: -3.85, r: .46 }, { x: 0, z: -.45, r: .48 }, { x: -3.9, z: 3.6, r: .48 }],
  [{ x: 5.25, z: -.5, r: .52 }, { x: -4.8, z: 3.4, r: .54 }, { x: -1.25, z: -3.85, r: .46 }, { x: 0, z: -.45, r: .48 }, { x: 3.9, z: 3.6, r: .48 }],
];

/** Zero-based campaign index. Return copies so simulation and art cannot mutate a shared layout. */
export function obstaclesForLevel(levelIndex: number): HabitatObstacle[] {
  const index = Number.isFinite(levelIndex) ? Math.max(0, Math.floor(levelIndex)) : 0;
  if (index < 5) return [];
  const chapter = Math.min(9, Math.floor(index / 5)), step = index % 5;
  const count = Math.min(5, 2 + Math.floor((chapter - 1) / 3) + (step === 4 ? 1 : 0));
  const layout = LAYOUTS[(chapter * 2 + step) % LAYOUTS.length];
  return layout.slice(0, count).map(obstacle => ({ ...obstacle }));
}
