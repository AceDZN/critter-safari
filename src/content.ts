/** Original game fixtures; Workbook source snapshots are in docs/curriculum/.
 * These are fictional individual animals. Preferences and garden pace are game
 * facts about each named individual, not claims about real species' diets or speed.
 */
export type Archetype = 'rabbit' | 'deer' | 'tortoise';
/** Legacy data key `diet` means preferred lure, never an exclusive biological diet. */
export type Diet = 'leaf' | 'berry';
export type Measure = 'usualSpeed' | 'size';

export interface CreatureSpec {
  id: string;
  name: string;
  archetype: Archetype;
  /** This individual's preferred lure in the fictional garden. */
  diet: Diet;
  habit: string;
  /** Usual unbaited travel pace on the same level surface, garden units/s. */
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

/** Contracts 3 and 4 use the identical six-actor scene and different English. */
export const CLEARING_CREATURES: readonly CreatureSpec[] = [
  { id: 'moss', name: 'Moss', archetype: 'rabbit', diet: 'leaf', habit: 'rests by ferns', usualSpeed: 0.62, size: 1.10, spawn: [-3, -1] },
  { id: 'pip', name: 'Pip', archetype: 'rabbit', diet: 'berry', habit: 'circles pebbles', usualSpeed: 1.55, size: 0.70, spawn: [2.6, 0.7] },
  { id: 'tumble', name: 'Tumble', archetype: 'tortoise', diet: 'leaf', habit: 'shelters in shade', usualSpeed: 0.95, size: 1.30, spawn: [3, -2] },
  { id: 'reed', name: 'Reed', archetype: 'deer', diet: 'leaf', habit: 'rests beside twigs', usualSpeed: 1.25, size: 0.80, spawn: [-0.8, -2] },
  { id: 'nib', name: 'Nib', archetype: 'deer', diet: 'berry', habit: 'seeks sunny patches', usualSpeed: 1.85, size: 0.90, spawn: [1.1, 0.7] },
  { id: 'pebble', name: 'Pebble', archetype: 'tortoise', diet: 'berry', habit: 'rests by logs', usualSpeed: 0.78, size: 1.10, spawn: [-2.5, 1] },
];

/** Two visible, similar rabbits; no first-task six-row lookup burden. */
export const INTRO_CREATURES: readonly CreatureSpec[] = [
  { ...CLEARING_CREATURES[0]!, spawn: [-2, 0] },
  { ...CLEARING_CREATURES[1]!, spawn: [2, 0] },
];

/** Three candidates introduce comparisons before the six-actor clearing. */
export const COMPARISON_CREATURES: readonly CreatureSpec[] = [
  { ...CLEARING_CREATURES[0]!, spawn: [-2, -0.6] },
  { ...CLEARING_CREATURES[1]!, spawn: [2, 0.7] },
  { ...CLEARING_CREATURES[3]!, spawn: [0, -1.5] },
];

/** New names and changed species/preference assignments prevent a species shortcut. */
export const TRANSFER_CREATURES: readonly CreatureSpec[] = [
  { id: 'alba', name: 'Alba', archetype: 'deer', diet: 'leaf', habit: 'rests by stones', usualSpeed: 0.90, size: 1.20, spawn: [-3, 0.3] },
  { id: 'brin', name: 'Brin', archetype: 'rabbit', diet: 'berry', habit: 'shelters in reeds', usualSpeed: 0.70, size: 0.85, spawn: [2.9, -1.9] },
  { id: 'coda', name: 'Coda', archetype: 'rabbit', diet: 'berry', habit: 'circles fallen seeds', usualSpeed: 1.10, size: 1.05, spawn: [-0.6, -2] },
  { id: 'dune', name: 'Dune', archetype: 'tortoise', diet: 'berry', habit: 'seeks dry ground', usualSpeed: 1.50, size: 0.65, spawn: [2.8, 1] },
  { id: 'echo', name: 'Echo', archetype: 'tortoise', diet: 'leaf', habit: 'circles mushrooms', usualSpeed: 1.85, size: 0.75, spawn: [-2.7, -2] },
  { id: 'fizz', name: 'Fizz', archetype: 'deer', diet: 'leaf', habit: 'rests by moss', usualSpeed: 0.55, size: 1.30, spawn: [0.9, 0.6] },
];

export const CONTRACTS: readonly Contract[] = [
  {
    id: 'first-capture', titleHe: 'לכידה ראשונה',
    instruction: 'Catch the rabbit that prefers leaves.',
    helpHe: 'prefers פירושו מעדיף. התיאור שאחרי that מזהה איזה ארנב מחפשים.',
    misconceptionHe: 'prefers leaves פירושו מעדיף עלים. לשני הארנבים העדפות פיתיון שונות.',
    scene: 'clearing', creatures: INTRO_CREATURES,
    rule: { all: [{ kind: 'trait', trait: 'archetype', value: 'rabbit' }, { kind: 'trait', trait: 'diet', value: 'leaf' }] },
    sourceUrls: [SOURCES.relative], transfer: false,
  },
  {
    id: 'small-and-swift', titleHe: 'קטן וזריז',
    instruction: 'Catch the rabbit that is smaller than Moss but faster than Reed.',
    helpHe: 'smaller משווה גודל; faster משווה קצב תנועה רגיל. שני התנאים צריכים להתקיים יחד.',
    misconceptionHe: 'קטן יותר אינו בהכרח איטי יותר. בדקו בנפרד smaller than Moss וגם faster than Reed.',
    scene: 'clearing', creatures: COMPARISON_CREATURES,
    rule: { all: [{ kind: 'trait', trait: 'archetype', value: 'rabbit' }, { kind: 'comparison', measure: 'size', relation: 'less', referenceId: 'moss' }, { kind: 'comparison', measure: 'usualSpeed', relation: 'greater', referenceId: 'reed' }] },
    sourceUrls: [SOURCES.comparative, SOURCES.relative], transfer: false,
  },
  {
    id: 'between-speeds', titleHe: 'בין שתי מהירויות',
    instruction: 'Catch the animal that prefers leaves and is slower than Reed but faster than Moss.',
    helpHe: 'צריך לבדוק העדפת פיתיון וגם שני תנאי מהירות. קצב התנועה הרגיל צריך להיות בין שתי המהירויות שבמשפט.',
    misconceptionHe: 'צריך גם להעדיף עלים, גם להיות איטי מ־Reed וגם מהיר מ־Moss. תנאי אחד לבדו אינו מספיק.',
    scene: 'clearing', creatures: CLEARING_CREATURES,
    rule: { all: [{ kind: 'trait', trait: 'diet', value: 'leaf' }, { kind: 'comparison', measure: 'usualSpeed', relation: 'less', referenceId: 'reed' }, { kind: 'comparison', measure: 'usualSpeed', relation: 'greater', referenceId: 'moss' }] },
    sourceUrls: [SOURCES.comparative, SOURCES.relative], transfer: false,
  },
  {
    id: 'bounded-fastest', titleHe: 'הכי מהיר בקבוצה',
    instruction: 'Among the three animals that prefer leaves, catch the fastest.',
    helpHe: 'the fastest מתייחס רק לקבוצה שמופיעה אחרי among. קצב התנועה של בעלי העדפת פירות אינו קובע כאן.',
    misconceptionHe: 'Among the three animals that prefer leaves מגביל את ההשוואה למעדיפי העלים. בעל החיים הכי מהיר בכל הגינה יכול להיות מחוץ לקבוצה.',
    scene: 'clearing', creatures: CLEARING_CREATURES,
    rule: { all: [{ kind: 'trait', trait: 'diet', value: 'leaf' }], extreme: { measure: 'usualSpeed', direction: 'max' } },
    sourceUrls: [SOURCES.extreme, SOURCES.relative], transfer: false,
  },
  {
    id: 'new-clearing', titleHe: 'קרחת יער חדשה',
    instruction: 'Among the three animals that prefer berries, catch the slowest.',
    helpHe: '',
    misconceptionHe: 'הקבוצה השתנתה למעדיפי פירות והמדד הוא slowest. בדקו את הנתונים החדשים, ולא את המסלול או בעל החיים מהמשימה הקודמת.',
    scene: 'transfer', creatures: TRANSFER_CREATURES,
    rule: { all: [{ kind: 'trait', trait: 'diet', value: 'berry' }], extreme: { measure: 'usualSpeed', direction: 'min' } },
    sourceUrls: [SOURCES.extreme, SOURCES.relative], transfer: true,
  },
];

/** On-demand vocabulary support never identifies a contract's target. */
export const GLOSSARY: ReadonlyArray<readonly [string, string]> = [
  ['catch', 'ללכוד'], ['that', 'ש־; מתחיל כאן תיאור מזהה'],
  ['rabbit', 'ארנב'], ['tortoise', 'צב יבשה'], ['deer', 'אייל'],
  ['prefers', 'מעדיף'], ['leaves', 'עלים'], ['berries', 'פירות יער'],
  ['among', 'מבין; בתוך הקבוצה'],
  ['smaller than', 'קטן יותר מ־'], ['bigger than', 'גדול יותר מ־'],
  ['faster than', 'מהיר יותר מ־'], ['slower than', 'איטי יותר מ־'],
  ['the fastest', 'המהיר ביותר בקבוצה'], ['the slowest', 'האיטי ביותר בקבוצה'],
];
