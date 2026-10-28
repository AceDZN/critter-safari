/** Original game fixtures; Workbook source snapshots are in docs/curriculum/.
 * These are fictional individual animals. Preferences and garden pace are game
 * facts about each named individual, not claims about real species' diets or speed.
 */
export type Archetype = 'rabbit' | 'deer' | 'tortoise';
/** Legacy data key `diet` means preferred lure, never an exclusive biological diet. */
export type Diet = 'leaf' | 'berry';
export type Measure = 'usualSpeed' | 'size';
export type Trait = 'diet' | 'archetype' | 'habit';

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

/** Described references use the original roster; rescued references use actual
 * recorded rescues. Both must resolve uniquely, never to an authored answer ID. */
export type Reference =
  | { kind: 'id'; id: string }
  | { kind: 'described'; rule: CandidateRule }
  | { kind: 'rescued'; rule: CandidateRule };
type Comparison = { kind: 'comparison'; measure: Measure; relation: 'greater' | 'less' | 'equal' };
export type Clause =
  | { kind: 'trait'; trait: Trait; value: string; negate?: boolean }
  | (Comparison & ({ referenceId: string; reference?: never } | { reference: Reference; referenceId?: never }))
  | { kind: 'exclude'; referenceId: string; reference?: never }
  | { kind: 'exclude'; reference: Reference; referenceId?: never }
  | { kind: 'named-set'; ids: readonly string[] }
  | { kind: 'trait-reference'; trait: Trait; relation: 'same' | 'different'; reference: Reference };

/** Filter the stated set first, then find its requested extreme. No target ID. */
export interface CandidateRule {
  all: readonly Clause[];
  extreme?: { measure: Measure; direction: 'max' | 'min' };
  conditional?: {
    reference: Reference;
    trait: Trait;
    value: string;
    ifTrue: CandidateRule;
    ifFalse: CandidateRule;
  };
}

export interface Objective {
  instruction: string;
  rule: CandidateRule;
  misconceptionHe?: string;
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
  level: number;
  chapter: number;
  skill: string;
  difficulty: { language: number; planning: number };
  sourceModules: readonly string[];
  /** Source provenance only. Never a learner-facing grade gate. */
  sourceGrades: readonly (7 | 8 | 9)[];
  objectives?: readonly Objective[];
}
type OriginalContract = Omit<Contract, 'level' | 'chapter' | 'skill' | 'difficulty' | 'sourceModules' | 'sourceGrades'>;

export const SOURCES = {
  comparative: 'https://english.workbook.co.il/grade-7/chapter-3/compare-two-places',
  extreme: 'https://english.workbook.co.il/grade-8/chapter-3/extremes-and-fair-comparisons',
  relative: 'https://english.workbook.co.il/grade-8/chapter-11/relative-clauses-reference',
  negativeBe: 'https://english.workbook.co.il/grade-7/chapter-1/be-statements-and-questions',
  negativeHabit: 'https://english.workbook.co.il/grade-7/chapter-10/present-simple-rules',
  equality: 'https://english.workbook.co.il/grade-9/chapter-11/comparatives-and-superlatives-reference',
  reference: 'https://english.workbook.co.il/grade-8/chapter-9/tracking-reference-and-connections',
  advancedRelative: 'https://english.workbook.co.il/grade-9/chapter-11/relative-clauses-reference',
  exception: 'https://english.workbook.co.il/grade-9/chapter-4/a-rule-and-its-exception',
  conditional: 'https://english.workbook.co.il/grade-9/chapter-11/conditionals-reference',
  brief: 'https://english.workbook.co.il/grade-9/chapter-12/reading-comprehension-and-evidence-reference',
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

const ORIGINAL_CONTRACTS: readonly OriginalContract[] = [
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
  ['as fast as', 'מהיר באותה מידה כמו'], ['not as fast as', 'אינו מהיר באותה מידה; איטי יותר'],
  ['as small as', 'קטן באותה מידה כמו'], ['whose', 'ש־... שלו; מתאר שייכות'],
  ['usual speed', 'מהירות רגילה לפני השפעת פיתיון או הרגעה'], ['rescued', 'חילצתם'],
  ['remaining', 'שנשארו'], ['excluded', 'מוחרג; מחוץ לקבוצה'],
  ['instead', 'במקום זאת'], ['if', 'אם'], ['same', 'זהה'], ['different', 'שונה'],
];

/** Historical five-level release: reference fixtures, not campaign menu entries. */
export const LEGACY_CONTRACTS: readonly Contract[] = ORIGINAL_CONTRACTS.map((contract, i) => ({
  ...contract, level: i + 1, chapter: 1, skill: 'original release regression',
  difficulty: { language: 1, planning: 1 },
  sourceModules: contract.sourceUrls.map(url => url.replace('https://english.workbook.co.il/', '')),
  sourceGrades: [...new Set(contract.sourceUrls.map(url => Number(url.match(/grade-(\d)/)?.[1]) as 7 | 8 | 9))],
}));

export const EQUALITY_CREATURES: readonly CreatureSpec[] = [
  { id: 'fern', name: 'Fern', archetype: 'rabbit', diet: 'leaf', habit: 'rests by ferns', usualSpeed: .90, size: 1.20, spawn: [-4, -2.4] },
  { id: 'glint', name: 'Glint', archetype: 'rabbit', diet: 'berry', habit: 'rests by the pond', usualSpeed: .90, size: .80, spawn: [-2, 1.4] },
  { id: 'hush', name: 'Hush', archetype: 'tortoise', diet: 'leaf', habit: 'rests by stones', usualSpeed: 1.20, size: 1.20, spawn: [0, -2.4] },
  { id: 'iris', name: 'Iris', archetype: 'tortoise', diet: 'berry', habit: 'rests by ferns', usualSpeed: 1.20, size: .80, spawn: [2, 1.4] },
  { id: 'juniper', name: 'Juniper', archetype: 'deer', diet: 'leaf', habit: 'rests by the pond', usualSpeed: 1.50, size: 1.00, spawn: [4, -2.4] },
  { id: 'kite', name: 'Kite', archetype: 'deer', diet: 'berry', habit: 'rests by stones', usualSpeed: 1.50, size: 1.40, spawn: [0, 2.7] },
];
export const REFERENCE_CREATURES: readonly CreatureSpec[] = [
  { id: 'lark', name: 'Lark', archetype: 'rabbit', diet: 'berry', habit: 'shelters in reeds', usualSpeed: .80, size: .90, spawn: [-4, -2.4] },
  { id: 'mica', name: 'Mica', archetype: 'rabbit', diet: 'leaf', habit: 'rests by ferns', usualSpeed: 1.20, size: 1.10, spawn: [-2, 1.4] },
  { id: 'nori', name: 'Nori', archetype: 'tortoise', diet: 'berry', habit: 'circles pebbles', usualSpeed: 1.20, size: 1.30, spawn: [0, -2.4] },
  { id: 'orris', name: 'Orris', archetype: 'tortoise', diet: 'leaf', habit: 'rests by logs', usualSpeed: .60, size: .75, spawn: [2, 1.4] },
  { id: 'pollen', name: 'Pollen', archetype: 'deer', diet: 'berry', habit: 'seeks sunny patches', usualSpeed: 1.70, size: .85, spawn: [4, -2.4] },
  { id: 'quill', name: 'Quill', archetype: 'deer', diet: 'leaf', habit: 'rests beside twigs', usualSpeed: 1.40, size: 1.25, spawn: [0, 2.7] },
];
export const FINAL_CREATURES: readonly CreatureSpec[] = [
  { id: 'alder', name: 'Alder', archetype: 'rabbit', diet: 'berry', habit: 'circles fallen seeds', usualSpeed: .88, size: .92, spawn: [-4, -2.4] },
  { id: 'bramble', name: 'Bramble', archetype: 'rabbit', diet: 'leaf', habit: 'rests by moss', usualSpeed: 1.28, size: 1.12, spawn: [-2, 1.4] },
  { id: 'clover', name: 'Clover', archetype: 'tortoise', diet: 'berry', habit: 'shelters in shade', usualSpeed: 1.28, size: 1.32, spawn: [0, -2.4] },
  { id: 'drift', name: 'Drift', archetype: 'tortoise', diet: 'leaf', habit: 'rests by stones', usualSpeed: .64, size: .76, spawn: [2, 1.4] },
  { id: 'ember', name: 'Ember', archetype: 'deer', diet: 'berry', habit: 'seeks dry ground', usualSpeed: 1.76, size: .86, spawn: [4, -2.4] },
  { id: 'fable', name: 'Fable', archetype: 'deer', diet: 'leaf', habit: 'circles mushrooms', usualSpeed: 1.44, size: 1.24, spawn: [0, 2.7] },
];

const slots: readonly (readonly [number, number])[] = [[-4, -2.4], [-2, 1.4], [0, -2.4], [2, 1.4], [4, -2.4], [0, 2.7]];
function roster(source: readonly CreatureSpec[], ids?: readonly string[]): readonly CreatureSpec[] {
  const selected = ids ? ids.map(id => {
    const actor = source.find(c => c.id === id);
    if (!actor) throw new Error(`Unknown authored roster member: ${id}`);
    return actor;
  }) : source;
  const positions = selected.length === 2 ? [[-2, 0], [2, 0]] as const
    : selected.length === 3 ? [[-3, -1], [3, -1], [0, 2]] as const : slots;
  return selected.map((actor, i) => ({ ...actor, spawn: positions[i]! }));
}
const A = roster(CLEARING_CREATURES), B = roster(TRANSFER_CREATURES), C = roster(EQUALITY_CREATURES), D = roster(REFERENCE_CREATURES), F = roster(FINAL_CREATURES);
const trait = (key: Trait, value: string, negate = false): Clause => ({ kind: 'trait', trait: key, value, ...(negate ? { negate: true } : {}) });
const leaf = () => trait('diet', 'leaf'), berry = () => trait('diet', 'berry');
const kind = (value: Archetype, negate = false) => trait('archetype', value, negate);
const compare = (measure: Measure, relation: 'greater' | 'less' | 'equal', reference: string | Reference): Clause =>
  typeof reference === 'string' ? { kind: 'comparison', measure, relation, referenceId: reference } : { kind: 'comparison', measure, relation, reference };
const faster = (r: string | Reference) => compare('usualSpeed', 'greater', r);
const slower = (r: string | Reference) => compare('usualSpeed', 'less', r);
const sameSpeed = (r: string | Reference) => compare('usualSpeed', 'equal', r);
const bigger = (r: string | Reference) => compare('size', 'greater', r);
const smaller = (r: string | Reference) => compare('size', 'less', r);
const sameSize = (r: string | Reference) => compare('size', 'equal', r);
const all = (...clauses: Clause[]): CandidateRule => ({ all: clauses });
const extreme = (measure: Measure, direction: 'max' | 'min', ...clauses: Clause[]): CandidateRule => ({ all: clauses, extreme: { measure, direction } });
const described = (...clauses: Clause[]): Reference => ({ kind: 'described', rule: all(...clauses) });
const rescued = (archetype: Archetype): Reference => ({ kind: 'rescued', rule: all(kind(archetype)) });
const exclude = (referenceId: string): Clause => ({ kind: 'exclude', referenceId });
const exception = (diet: Diet, testKind: Archetype): CandidateRule => ({
  all: [], conditional: {
    reference: { kind: 'described', rule: extreme('usualSpeed', 'max', trait('diet', diet)) },
    trait: 'archetype', value: testKind,
    ifTrue: extreme('usualSpeed', 'min', trait('diet', diet)),
    ifFalse: extreme('usualSpeed', 'max', trait('diet', diet)),
  },
});
const O = (instruction: string, rule: CandidateRule, misconceptionHe?: string): Objective => ({ instruction, rule, misconceptionHe });

export const CHAPTERS = [
  { number: 1, titleHe: 'שביל ההיכרות', skill: 'זיהוי לפי תיאור והעדפה' },
  { number: 2, titleHe: 'גדול או מהיר', skill: 'השוואת גודל ומהירות בנפרד' },
  { number: 3, titleHe: 'כל התנאים', skill: 'שלילה ושילוב תנאים' },
  { number: 4, titleHe: 'בין הקצוות', skill: 'שתי השוואות בתוך קבוצה' },
  { number: 5, titleHe: 'הכי בתוך הקבוצה', skill: 'צורת הפלגה בקבוצה מוגדרת' },
  { number: 6, titleHe: 'שווים ושונים', skill: 'שוויון ואי־שוויון בהשוואה' },
  { number: 7, titleHe: 'מי מתואר?', skill: 'מאוזכרים ותיאורים מקוננים' },
  { number: 8, titleHe: 'מי כבר חולץ?', skill: 'פסוקיות זיקה ורישום חילוצים' },
  { number: 9, titleHe: 'הכלל והחריג', skill: 'החרגה ותנאי עם תחום מוגדר' },
  { number: 10, titleHe: 'מסע החילוץ הגדול', skill: 'שילוב ראיות במסע רב־שלבי' },
] as const;
const levelSkills = [
  'זיהוי ארנב לפי העדפה', 'אותה חיה, העדפה שונה', 'תיאור מזהה של אייל', 'שילוב סוג והעדפה', 'העברה לשמות חדשים',
  'השוואת גודל עם smaller than', 'השוואת מהירות עם faster than', 'הפרדת גודל ממהירות', 'שתי השוואות במדדים שונים', 'השוואות בנתונים חדשים',
  'שלילת העדפה עם does not', 'העדפה וגם גודל', 'שלילת סוג ושתי השוואות', 'שינוי slower ל-faster', 'שלושה תנאים בהקשר חדש',
  'השוואה בתוך קבוצת העדפה', 'מהירות בין שני גבולות', 'קבוצה אחרת וגבולות אחרים', 'גודל בין שני גבולות', 'סוג ושני גבולות בהקשר חדש',
  'המהיר ביותר בקבוצה מוגדרת', 'החלפת קבוצת ההשוואה', 'הגדול ביותר לפי גודל', 'סינון מהירות ואז מינימום גודל', 'מינימום בקבוצה חדשה',
  'שוויון מהירות והבדל גודל', 'שוויון גודל והבדל מהירות', 'not as fast אינו שוויון', 'מינימום בתוך קבוצת שוויון', 'שוויון בהקשר חדש',
  'זיהוי נקודת ייחוס מתיאור', 'שתי נקודות ייחוס מתיאורים', 'whose ומהירות של המועמד', 'שתי תכונות של אותו מאוזכר', 'מאוזכר מפורש בין שני משפטים',
  'פסוקית מושא על חילוץ קודם', 'שימוש במהירות של חילוץ קודם', 'שוויון לחילוץ שנרשם', 'whose ופסוקית מושא יחד', 'שתי נקודות ייחוס מרישומי חילוץ',
  'מקסימום לאחר החרגה', 'החרגה בקבוצת העדפה אחרת', 'חריג שתנאו מתקיים', 'חריג שתנאו אינו מתקיים', 'תחום החרגה והקבוצה שנותרה',
  'סינון, שוויון ורישום חילוץ', 'חריג ושתי השוואות לרישום', 'שלילה והשוואה בין גבולות', 'שרשרת של שלושה חילוצים', 'העברת כלל, חריג ורישומים להקשר חדש',
] as const;
const chapterSources: readonly (readonly string[])[] = [
  [SOURCES.relative], [SOURCES.comparative, SOURCES.relative],
  [SOURCES.negativeBe, SOURCES.negativeHabit, SOURCES.comparative, SOURCES.relative],
  [SOURCES.comparative, SOURCES.relative], [SOURCES.extreme, SOURCES.relative],
  [SOURCES.equality, SOURCES.extreme, SOURCES.relative],
  [SOURCES.advancedRelative, SOURCES.reference, SOURCES.comparative],
  [SOURCES.advancedRelative, SOURCES.reference, SOURCES.equality, SOURCES.extreme],
  [SOURCES.exception, SOURCES.conditional, SOURCES.extreme, SOURCES.advancedRelative],
  [SOURCES.brief, SOURCES.advancedRelative, SOURCES.equality, SOURCES.extreme, SOURCES.exception],
];
function level(n: number, titleHe: string, creatures: readonly CreatureSpec[], ...objectives: Objective[]): Contract {
  const chapter = Math.ceil(n / 5), sourceUrls = [...chapterSources[chapter - 1]!];
  if (n === 50) sourceUrls.push(SOURCES.conditional);
  const first = objectives[0]!;
  const misconceptionHe = first.misconceptionHe ?? 'בדקו את כל חלקי התיאור: הקבוצה, התכונה וההשוואה. תנאי אחד לבדו אינו מספיק.';
  const sourceModules = sourceUrls.map(url => url.replace('https://english.workbook.co.il/', ''));
  return {
    id: `level-${String(n).padStart(2, '0')}`, level: n, chapter, titleHe,
    instruction: objectives.length > 1 ? `Rescue ${objectives.length === 2 ? 'two' : 'three'} animals in order. Follow each new instruction after a rescue.` : first.instruction,
    helpHe: n % 5 === 0 ? '' : chapter <= 2 ? 'that פותח תיאור מזהה. smaller משווה גודל; faster משווה מהירות רגילה.'
      : chapter === 6 ? 'as … as מציין שוויון; not as fast as מציין מהירות רגילה נמוכה יותר. פיתיון או אזור הרגעה לא משנים את הנתון.'
      : chapter >= 8 ? 'קראו את הקבוצה ואת החריג. animal you rescued מפנה לרישום חילוץ אמיתי מהשלב הקודם.'
      : 'קראו כל תנאי ובדקו למי מתייחס התיאור. הנתונים הגלויים נשארים זמינים בזמן תכנון.',
    misconceptionHe, scene: n % 5 === 0 ? 'transfer' : 'clearing', creatures,
    rule: first.rule, sourceUrls, sourceModules,
    sourceGrades: [...new Set(sourceModules.map(path => Number(path.match(/grade-(\d)/)?.[1]) as 7 | 8 | 9))],
    transfer: n % 5 === 0, skill: levelSkills[n - 1]!,
    difficulty: { language: Math.min(5, Math.ceil(chapter / 2)), planning: Math.min(5, Math.ceil(chapter / 2)) },
    ...(objectives.length > 1 ? { objectives: objectives.map(objective => ({ ...objective, misconceptionHe: objective.misconceptionHe ?? misconceptionHe })) } : {}),
  };
}

/** Fifty authored English decisions, not a target-name list or random generator. */
export const CONTRACTS: readonly Contract[] = [
  level(1, 'לכידה ראשונה', roster(CLEARING_CREATURES, ['moss', 'pip']), O('Catch the rabbit that prefers leaves.', all(kind('rabbit'), leaf()), 'prefers leaves פירושו מעדיף עלים. לשני הארנבים העדפות שונות.')),
  level(2, 'שני צבים', roster(CLEARING_CREATURES, ['tumble', 'pebble']), O('Catch the tortoise that prefers berries.', all(kind('tortoise'), berry()), 'berries הם פירות יער. שני הצבים אינם מעדיפים אותו פיתיון.')),
  level(3, 'שני איילים', roster(CLEARING_CREATURES, ['reed', 'nib']), O('Catch the deer that prefers leaves.', all(kind('deer'), leaf()))),
  level(4, 'העדפה אחרת', roster(CLEARING_CREATURES, ['moss', 'pip', 'reed']), O('Catch the rabbit that prefers berries.', all(kind('rabbit'), berry()))),
  level(5, 'שמות חדשים', roster(EQUALITY_CREATURES, ['fern', 'glint']), O('Catch the rabbit that prefers berries.', all(kind('rabbit'), berry()))),

  level(6, 'הארנב הקטן יותר', roster(CLEARING_CREATURES, ['moss', 'pip', 'reed']), O('Catch the rabbit that is smaller than Moss.', all(kind('rabbit'), smaller('moss')))),
  level(7, 'מהיר מהארנב', roster(CLEARING_CREATURES, ['moss', 'pip', 'reed', 'nib']), O('Catch the deer that is faster than Pip.', all(kind('deer'), faster('pip')))),
  level(8, 'גודל אינו מהירות', roster(CLEARING_CREATURES, ['moss', 'pip', 'reed', 'nib']), O('Catch the rabbit that is bigger than Pip.', all(kind('rabbit'), bigger('pip')), 'bigger משווה גודל, לא מהירות.')),
  level(9, 'קטן וזריז', roster(CLEARING_CREATURES, ['moss', 'pip', 'reed']), O('Catch the rabbit that is smaller than Moss but faster than Reed.', all(kind('rabbit'), smaller('moss'), faster('reed')))),
  level(10, 'השוואה בקרחת יער חדשה', B, O('Catch the rabbit that is smaller than Coda but faster than Fizz.', all(kind('rabbit'), smaller('coda'), faster('fizz')))),

  level(11, 'המילה שאומרת לא', A, O('Catch the rabbit that does not prefer leaves.', all(kind('rabbit'), trait('diet', 'leaf', true)), 'does not prefer שולל את ההעדפה. בדקו את מילת השלילה.')),
  level(12, 'העדפה וגודל', A, O('Catch the animal that prefers leaves and is bigger than Moss.', all(leaf(), bigger('moss')))),
  level(13, 'שלושה תנאים', A, O('Catch the animal that is not a rabbit, is smaller than Moss, and is slower than Pip.', all(kind('rabbit', true), smaller('moss'), slower('pip')))),
  level(14, 'מילה אחת משנה', A, O('Catch the animal that is not a rabbit, is smaller than Moss, and is faster than Pip.', all(kind('rabbit', true), smaller('moss'), faster('pip')))),
  level(15, 'לא אותו הרגל', B, O('Catch the animal that does not prefer berries, is bigger than Coda, and is slower than Brin.', all(trait('diet', 'berry', true), bigger('coda'), slower('brin')))),

  level(16, 'בקבוצה הנכונה', A, O('Catch the animal that prefers berries and is slower than Tumble.', all(berry(), slower('tumble')))),
  level(17, 'בין שתי מהירויות', A, O('Catch the animal that prefers leaves and is slower than Reed but faster than Moss.', all(leaf(), slower('reed'), faster('moss')))),
  level(18, 'קצוות אחרים', A, O('Catch the animal that prefers berries and is faster than Tumble but slower than Nib.', all(berry(), faster('tumble'), slower('nib')))),
  level(19, 'בין שני גדלים', A, O('Catch the animal that is bigger than Reed but smaller than Moss.', all(bigger('reed'), smaller('moss')))),
  level(20, 'שביל האמצע', B, O('Catch the rabbit that is faster than Brin but slower than Dune.', all(kind('rabbit'), faster('brin'), slower('dune')))),

  level(21, 'הכי מהיר בקבוצה', A, O('Among the three animals that prefer leaves, catch the fastest.', extreme('usualSpeed', 'max', leaf()), 'among מגביל את ההשוואה למעדיפי העלים. החיה המהירה בכל הגינה יכולה להיות מחוץ לקבוצה.')),
  level(22, 'הקבוצה התחלפה', A, O('Among the three animals that prefer berries, catch the fastest.', extreme('usualSpeed', 'max', berry()))),
  level(23, 'הכי גדול בקבוצה', A, O('Among the animals that prefer leaves, catch the biggest.', extreme('size', 'max', leaf()))),
  level(24, 'הקטן מבין המהירים', A, O('Among the animals that are faster than Tumble, catch the smallest.', extreme('size', 'min', faster('tumble')))),
  level(25, 'קרחת יער חדשה', B, O('Among the three animals that prefer berries, catch the slowest.', extreme('usualSpeed', 'min', berry()))),

  level(26, 'אותה מהירות', C, O('Catch the rabbit that is as fast as Glint but bigger than Glint.', all(kind('rabbit'), sameSpeed('glint'), bigger('glint')))),
  level(27, 'אותו גודל', C, O('Catch the tortoise that is as small as Glint but faster than Fern.', all(kind('tortoise'), sameSize('glint'), faster('fern')))),
  level(28, 'לא מהיר באותה מידה', C, O('Catch the animal that prefers leaves and is not as fast as Hush.', all(leaf(), slower('hush')), 'not as fast as פירושו איטי יותר; מהירות שווה אינה מספיקה. אזור הרגעה לא משנה את המהירות הרגילה.')),
  level(29, 'שווים במהירות ושונים בגודל', C, O('Among the animals that are as fast as Kite, catch the smaller one.', extreme('size', 'min', sameSpeed('kite')))),
  level(30, 'שוויון במקום חדש', D, O('Among the animals that are as fast as Nori, catch the smaller one.', extreme('size', 'min', sameSpeed('nori')))),

  level(31, 'מי הארנב המתואר?', A, O('Catch the animal that prefers berries and is faster than the rabbit that prefers berries.', all(berry(), faster(described(kind('rabbit'), berry()))))),
  level(32, 'שני תיאורים מקוננים', A, O('Catch the animal that prefers leaves and is slower than the deer that prefers leaves but faster than the rabbit that prefers leaves.', all(leaf(), slower(described(kind('deer'), leaf())), faster(described(kind('rabbit'), leaf()))))),
  level(33, 'של מי המהירות?', A, O('Of the two tortoises, catch the one whose usual speed is lower.', extreme('usualSpeed', 'min', kind('tortoise')))),
  level(34, 'גודל ומהירות של אותו אייל', A, O("Of the two deer, catch the one whose size is smaller than Moss's but whose usual speed is higher than Pip's.", all(kind('deer'), smaller('moss'), faster('pip')))),
  level(35, 'אל מי המשפט חוזר?', B, O('Alba and Fizz prefer leaves. Of these two, catch the faster animal.', extreme('usualSpeed', 'max', { kind: 'named-set', ids: ['alba', 'fizz'] }))),

  level(36, 'האייל שכבר חולץ', A,
    O('Catch the deer that prefers leaves.', all(kind('deer'), leaf())),
    O('Catch the animal that prefers leaves and is slower than the deer you rescued but faster than Moss.', all(leaf(), slower(rescued('deer')), faster('moss')))),
  level(37, 'להשתמש ברישום', A,
    O('Among the animals that prefer berries, catch the fastest.', extreme('usualSpeed', 'max', berry())),
    O('Catch the rabbit that is slower than the deer you rescued but faster than Moss.', all(kind('rabbit'), slower(rescued('deer')), faster('moss')))),
  level(38, 'מהירות שנשארה רשומה', C,
    O('Catch the rabbit that prefers berries.', all(kind('rabbit'), berry())),
    O('Catch the animal that prefers leaves and is as fast as the rabbit you rescued.', all(leaf(), sameSpeed(rescued('rabbit'))))),
  level(39, 'למי שייכת ההשוואה?', B,
    O('Of the deer that prefer leaves, catch the faster one.', extreme('usualSpeed', 'max', kind('deer'), leaf())),
    O('Catch the rabbit whose usual speed is higher than the usual speed of the deer you rescued.', all(kind('rabbit'), faster(rescued('deer'))))),
  level(40, 'שני רישומים ויעד אחד', D,
    O('Catch the rabbit that prefers berries.', all(kind('rabbit'), berry())),
    O('Catch the deer that prefers leaves.', all(kind('deer'), leaf())),
    O('Catch the animal that prefers berries and is faster than the rabbit you rescued but slower than the deer you rescued.', all(berry(), faster(rescued('rabbit')), slower(rescued('deer'))))),

  level(41, 'משאירים חבר חופשי', A, O('Reed must stay free. Among the other animals that prefer leaves, catch the fastest.', extreme('usualSpeed', 'max', leaf(), exclude('reed')))),
  level(42, 'חריג בקבוצה אחרת', A, O('Nib must stay free. Among the other animals that prefer berries, catch the fastest.', extreme('usualSpeed', 'max', berry(), exclude('nib')))),
  level(43, 'מתי החריג חל?', B, O('Among the animals that prefer berries, catch the fastest. If that animal is a tortoise, leave it free and catch the slowest berry-preferring animal instead.', exception('berry', 'tortoise'), 'החריג חל רק אם החיה המהירה בקבוצה היא צב. בודקים את התנאי לפני שמחליפים את הבחירה.')),
  level(44, 'מתי הכלל נשאר?', C, O('Among the animals that prefer leaves, catch the fastest. If that animal is a tortoise, leave it free and catch the slowest leaf-preferring animal instead.', exception('leaf', 'tortoise'), 'אם התנאי אינו מתקיים, הכלל המקורי נשאר. החריג אינו הוראה להחליף תמיד.')),
  level(45, 'תחום החריג', B, O('Only animals that prefer berries are included. Dune is excluded. Among the animals still included, catch the fastest.', extreme('usualSpeed', 'max', berry(), exclude('dune')))),

  level(46, 'גודל שווה לאחר החילוץ', C,
    O('Among the animals that prefer berries and are faster than Fern, catch the smallest.', extreme('size', 'min', berry(), faster('fern'))),
    O('Catch the remaining animal that is as small as the tortoise you rescued but slower than that tortoise.', all(sameSize(rescued('tortoise')), slower(rescued('tortoise'))))),
  level(47, 'חריג ורישום יחד', B,
    O('Echo must stay free. Among the other animals that prefer leaves, catch the fastest.', extreme('usualSpeed', 'max', leaf(), exclude('echo'))),
    O('Catch the rabbit that is faster than the deer you rescued and smaller than that deer.', all(kind('rabbit'), faster(rescued('deer')), smaller(rescued('deer'))))),
  level(48, 'גם אחרי שהחבר עזב', A,
    O('Among the animals that are not rabbits and prefer berries, catch the slower one.', extreme('usualSpeed', 'min', kind('rabbit', true), berry())),
    O('Catch the animal that prefers leaves and is faster than the tortoise you rescued but not as fast as Reed.', all(leaf(), faster(rescued('tortoise')), slower('reed')))),
  level(49, 'שלושה חילוצים מחוברים', C,
    O('Among the animals that are as fast as Kite, catch the smaller one.', extreme('size', 'min', sameSpeed('kite'))),
    O('Among the animals that prefer leaves and are not as fast as the deer you rescued, catch the fastest.', extreme('usualSpeed', 'max', leaf(), slower(rescued('deer')))),
    O('Catch the animal whose usual speed is the same as the tortoise you rescued but whose preference is different.', all(sameSpeed(rescued('tortoise')), { kind: 'trait-reference', trait: 'diet', relation: 'different', reference: rescued('tortoise') }))),
  level(50, 'מסע חילוץ בקרחת יער חדשה', F,
    O('Among the animals that prefer berries, catch the fastest. If that animal is a deer, leave it free and catch the slowest berry-preferring animal instead.', exception('berry', 'deer')),
    O('Catch the animal that prefers leaves and is slower than the rabbit you rescued.', all(leaf(), slower(rescued('rabbit')))),
    O('The deer that prefers berries must stay free. Among the remaining animals faster than the rabbit you rescued, catch the smallest.', extreme('size', 'min', faster(rescued('rabbit')), { kind: 'exclude', reference: described(kind('deer'), berry()) }))),
];
