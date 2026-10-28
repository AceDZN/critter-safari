/** Local campaign progress. School grades are source provenance, never a gate. */
export const LEVEL_COUNT = 50;
export const SAVE_KEY = "critter-safari-campaign-v1";
export interface LevelResult {
  attempts: number;
  hints: number;
  seconds: number;
  rescues: number;
}
export interface CampaignSave {
  version: 1;
  currentLevel: number;
  completed: Record<number, LevelResult>;
}
export interface ProgressStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
const levelNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= LEVEL_COUNT;
const validResult = (r: unknown): r is LevelResult => {
  if (!r || typeof r !== "object") return false;
  const v = r as LevelResult;
  return Number.isInteger(v.attempts) && v.attempts >= 1 &&
    Number.isInteger(v.hints) && v.hints >= 0 &&
    Number.isFinite(v.seconds) && v.seconds >= 0 &&
    Number.isInteger(v.rescues) && v.rescues >= 1 && v.rescues <= 3;
};
export function highestUnlocked(save: CampaignSave): number {
  let level = 1;
  while (level < LEVEL_COUNT && save.completed[level]) level++;
  return level;
}
export function canPlay(save: CampaignSave, level: number): boolean {
  return levelNumber(level) && (level <= highestUnlocked(save) || !!save.completed[level]);
}
export function readProgress(value: unknown): CampaignSave {
  const v = value as Partial<CampaignSave> | null;
  const completed: Record<number, LevelResult> = {};
  if (v?.version === 1 && v.completed && typeof v.completed === "object" && !Array.isArray(v.completed)) {
    for (let n = 1; n <= LEVEL_COUNT; n++) {
      const r = v.completed[n];
      if (validResult(r)) completed[n] = { attempts: r.attempts, hints: r.hints, seconds: r.seconds, rescues: r.rescues };
    }
  }
  const save: CampaignSave = { version: 1, currentLevel: 1, completed };
  save.currentLevel = levelNumber(v?.currentLevel) && canPlay(save, v.currentLevel)
    ? v.currentLevel : highestUnlocked(save);
  return save;
}
function better(a: LevelResult, b: LevelResult): LevelResult {
  // Reading assistance is retained as evidence, not a barrier to unlocking.
  if (a.attempts !== b.attempts) return a.attempts < b.attempts ? a : b;
  if (a.hints !== b.hints) return a.hints < b.hints ? a : b;
  return a.seconds <= b.seconds ? a : b;
}
function merge(a: CampaignSave, b: CampaignSave): CampaignSave {
  const completed = { ...a.completed };
  for (const [key, result] of Object.entries(b.completed)) {
    const n = Number(key);
    completed[n] = completed[n] ? better(completed[n], result) : result;
  }
  return readProgress({ version: 1, currentLevel: a.currentLevel, completed });
}

export class SafariProgression {
  save = readProgress(null);
  warning = "";
  private writable = true;
  constructor(private storage: ProgressStore | null, private key = SAVE_KEY) {
    if (!storage) this.warning = "ההתקדמות נשמרת רק בחלון הזה.";
    const stored = this.readStored();
    if (stored) this.save = stored;
  }
  get completedCount() { return Object.keys(this.save.completed).length; }
  get highestUnlocked() { return highestUnlocked(this.save); }
  get currentLevel() { return this.save.currentLevel; }
  canPlay(level: number) { return canPlay(this.save, level); }
  private readStored(): CampaignSave | null {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !parsed.completed || typeof parsed.completed !== "object" || Array.isArray(parsed.completed)) {
        throw Error("unsupported progress");
      }
      return readProgress(parsed);
    } catch {
      // Never overwrite an unreadable or future-version save with a fresh run.
      this.writable = false;
      this.warning = "לא ניתן לקרוא או לשמור התקדמות במכשיר. אפשר לשחק בחלון הזה; הנתונים הקודמים לא הוחלפו.";
      return null;
    }
  }
  refresh() {
    const stored = this.readStored();
    if (stored) this.save = merge(this.save, stored);
  }
  private persist() {
    if (!this.storage || !this.writable) return;
    try {
      this.storage.setItem(this.key, JSON.stringify(this.save));
    } catch {
      this.warning = "אין אפשרות לשמור במכשיר. ההתקדמות נשמרת רק בחלון הזה.";
    }
  }
  enter(level: number, lessonEntry = false) {
    this.refresh();
    if (!levelNumber(level) || (!lessonEntry && !this.canPlay(level))) return false;
    // Explicit lesson links may open any level, without unlocking skipped work.
    if (this.canPlay(level)) {
      this.save.currentLevel = level;
      this.persist();
    }
    return true;
  }
  complete(level: number, result: LevelResult) {
    if (!levelNumber(level) || !validResult(result)) return false;
    this.refresh();
    const previous = this.save.completed[level];
    this.save.completed[level] = previous ? better(previous, result) : { ...result };
    const next = Math.min(LEVEL_COUNT, level + 1);
    this.save.currentLevel = canPlay(this.save, next) ? next : highestUnlocked(this.save);
    this.persist();
    return true;
  }
}
