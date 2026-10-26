/** Original authored English fixtures. Source snapshots: docs/curriculum/. */
export type Archetype = 'puffling' | 'hopper' | 'shellback';
export type Diet = 'leaf' | 'berry';
export type Measure = 'usualSpeed' | 'size';

export interface CreatureSpec {
  id: string;
  name: string;
  archetype: Archetype;
  diet: Diet;
  habit: string;
  /** Unbaited ground speed on the same flat observation lane, garden units/s. */
  usualSpeed: number;
  /** Independent authored body-size measure; never inferred from speed. */
  size: number;
  spawn: readonly [number, number];
}

export type Clause =
  | { kind: 'trait'; trait: 'diet' | 'archetype' | 'habit'; value: string }
  | { kind: 'comparison'; measure: Measure; relation: 'greater' | 'less'; referenceId: string };

/** Filter the stated set first, then find its requested extreme. No target ID. */
export interface CandidateRule {
  all: readonly Clause[];
  extreme?: { measure: Measure; direction: 'max' | 'min' };
}

export interface Contract {
  id: string;
  titleHe: string;
  instruction: string;
  helpHe: string;
  misconceptionHe: string;
  scene: 'clearing' | 'transfer';
  creatures: readonly CreatureSpec[];
  rule: CandidateRule;
  sourceUrls: readonly string[];
  transfer: boolean;
}

export const SOURCES = {
  comparative: 'https://english.workbook.co.il/grade-7/chapter-3/compare-two-places',
  extreme: 'https://english.workbook.co.il/grade-8/chapter-3/extremes-and-fair-comparisons',
  relative: 'https://english.workbook.co.il/grade-8/chapter-11/relative-clauses-reference',
} as const;

/** Shared scene for contracts 1–4: changing the English changes the target. */
export const CLEARING_CREATURES: readonly CreatureSpec[] = [
  { id: 'moss', name: 'Moss', archetype: 'puffling', diet: 'leaf', habit: 'rests by ferns', usualSpeed: 0.62, size: 1.10, spawn: [-3, -1] },
  { id: 'pip', name: 'Pip', archetype: 'puffling', diet: 'berry', habit: 'circles pebbles', usualSpeed: 1.55, size: 0.70, spawn: [2.6, 0.7] },
  { id: 'tumble', name: 'Tumble', archetype: 'shellback', diet: 'leaf', habit: 'shelters in shade', usualSpeed: 0.95, size: 1.30, spawn: [3, -2] },
  { id: 'reed', name: 'Reed', archetype: 'hopper', diet: 'leaf', habit: 'hops beside twigs', usualSpeed: 1.25, size: 0.80, spawn: [-0.8, -2] },
  { id: 'nib', name: 'Nib', archetype: 'hopper', diet: 'berry', habit: 'seeks sunny patches', usualSpeed: 1.85, size: 0.90, spawn: [0.6, 0.4] },
  { id: 'pebble', name: 'Pebble', archetype: 'shellback', diet: 'berry', habit: 'rests by logs', usualSpeed: 0.78, size: 1.10, spawn: [-2.5, 1] },
];

export const TRANSFER_CREATURES: readonly CreatureSpec[] = [
  { id: 'alba', name: 'Alba', archetype: 'hopper', diet: 'leaf', habit: 'rests by stones', usualSpeed: 0.90, size: 1.20, spawn: [-3, 0.3] },
  { id: 'brin', name: 'Brin', archetype: 'shellback', diet: 'berry', habit: 'shelters in reeds', usualSpeed: 0.70, size: 0.85, spawn: [2.9, -1.9] },
  { id: 'coda', name: 'Coda', archetype: 'puffling', diet: 'berry', habit: 'circles fallen seeds', usualSpeed: 1.10, size: 1.05, spawn: [-0.6, -2] },
  { id: 'dune', name: 'Dune', archetype: 'hopper', diet: 'berry', habit: 'seeks dry ground', usualSpeed: 1.50, size: 0.65, spawn: [2.8, 1] },
  { id: 'echo', name: 'Echo', archetype: 'shellback', diet: 'leaf', habit: 'circles mushrooms', usualSpeed: 1.85, size: 0.75, spawn: [-2.7, -2] },
  { id: 'fizz', name: 'Fizz', archetype: 'puffling', diet: 'leaf', habit: 'rests by moss', usualSpeed: 0.55, size: 1.30, spawn: [0.9, 0.6] },
];

export const CONTRACTS: readonly Contract[] = [
  {
    id: 'first-capture', titleHe: 'לכידה ראשונה',
    instruction: 'Catch the puffling that eats leaves and rests by the ferns.',
    helpHe: 'המשפט שאחרי that מזהה איזה יצור מחפשים. בדקו גם מזון וגם הרגל ביומן.',
    misconceptionHe: 'puffling מציין את סוג היצור; eats leaves מציין תזונה; rests by the ferns מציין הרגל. צריך את כל התיאור, ולא רק מראה דומה.',
    scene: 'clearing', creatures: CLEARING_CREATURES,
    rule: { all: [{ kind: 'trait', trait: 'archetype', value: 'puffling' }, { kind: 'trait', trait: 'diet', value: 'leaf' }, { kind: 'trait', trait: 'habit', value: 'rests by ferns' }] },
    sourceUrls: [SOURCES.relative], transfer: false,
  },
  {
    id: 'small-and-swift', titleHe: 'קטן וזריז',
    instruction: 'Catch the puffling that is smaller than Moss but faster than Reed.',
    helpHe: 'smaller משווה גודל; faster משווה מהירות רגילה. שני התנאים צריכים להתקיים יחד.',
    misconceptionHe: 'קטן יותר אינו בהכרח איטי יותר. בדקו בנפרד smaller than Moss וגם faster than Reed.',
    scene: 'clearing', creatures: CLEARING_CREATURES,
    rule: { all: [{ kind: 'trait', trait: 'archetype', value: 'puffling' }, { kind: 'comparison', measure: 'size', relation: 'less', referenceId: 'moss' }, { kind: 'comparison', measure: 'usualSpeed', relation: 'greater', referenceId: 'reed' }] },
    sourceUrls: [SOURCES.comparative, SOURCES.relative], transfer: false,
  },
  {
    id: 'between-speeds', titleHe: 'בין שתי מהירויות',
    instruction: 'Among the three leaf-eaters, catch the one that is slower than Reed but faster than Moss.',
    helpHe: 'among מגביל את הקבוצה. חפשו מהירות רגילה שנמצאת בין שתי המהירויות שבמשפט.',
    misconceptionHe: 'צריך גם לאכול עלים, גם להיות איטי מ־Reed וגם מהיר מ־Moss. תנאי אחד לבדו אינו מספיק.',
    scene: 'clearing', creatures: CLEARING_CREATURES,
    rule: { all: [{ kind: 'trait', trait: 'diet', value: 'leaf' }, { kind: 'comparison', measure: 'usualSpeed', relation: 'less', referenceId: 'reed' }, { kind: 'comparison', measure: 'usualSpeed', relation: 'greater', referenceId: 'moss' }] },
    sourceUrls: [SOURCES.comparative, SOURCES.relative], transfer: false,
  },
  {
    id: 'bounded-fastest', titleHe: 'הכי מהיר בקבוצה',
    instruction: 'Among the three leaf-eaters, catch the fastest one.',
    helpHe: 'the fastest מתייחס רק לקבוצה שמופיעה אחרי among. מהירות של אוכלי פירות אינה קובעת כאן.',
    misconceptionHe: 'Among the three leaf-eaters מגביל את ההשוואה לאוכלי העלים. היצור הכי מהיר בכל הגינה יכול להיות מחוץ לקבוצה.',
    scene: 'clearing', creatures: CLEARING_CREATURES,
    rule: { all: [{ kind: 'trait', trait: 'diet', value: 'leaf' }], extreme: { measure: 'usualSpeed', direction: 'max' } },
    sourceUrls: [SOURCES.extreme], transfer: false,
  },
  {
    id: 'new-clearing', titleHe: 'קרחת יער חדשה',
    instruction: 'Among the three berry-eaters, catch the slowest one.',
    helpHe: '',
    misconceptionHe: 'הקבוצה השתנתה לאוכלי פירות והמדד הוא slowest. בדקו את הנתונים החדשים, ולא את המסלול או היצור מהמשימה הקודמת.',
    scene: 'transfer', creatures: TRANSFER_CREATURES,
    rule: { all: [{ kind: 'trait', trait: 'diet', value: 'berry' }], extreme: { measure: 'usualSpeed', direction: 'min' } },
    sourceUrls: [SOURCES.extreme], transfer: true,
  },
];

/** Vocabulary support never identifies a contract's target. */
export const GLOSSARY: ReadonlyArray<readonly [string, string]> = [
  ['catch', 'ללכוד'], ['that', 'ש־; מתחיל כאן תיאור מזהה'],
  ['leaf-eater', 'אוכל עלים'], ['berry-eater', 'אוכל פירות יער'],
  ['rests', 'נח'], ['ferns', 'שרכים'], ['among', 'מבין; בתוך הקבוצה'],
  ['smaller than', 'קטן יותר מ־'], ['bigger than', 'גדול יותר מ־'],
  ['faster than', 'מהיר יותר מ־'], ['slower than', 'איטי יותר מ־'],
  ['the fastest', 'המהיר ביותר בקבוצה'], ['the slowest', 'האיטי ביותר בקבוצה'],
];
