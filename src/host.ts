// The workbook games bridge (acedzn-tools docs/games/PLAN.md, section 4).
// The same file ships in every game. Inside the workbook player (an iframe on
// *.workbook.co.il) the game tells the page when it is ready and when a level
// starts or ends; run on its own it posts nothing.

export type HostMessage =
  | { type: "ready" }
  | { type: "level-start"; level: number }
  | {
      type: "level-complete";
      level: number;
      stars?: number;
      score?: number;
      durationMs?: number;
    }
  | { type: "error"; message: string };

const PARENT_ORIGIN =
  /^(https:\/\/([a-z0-9-]+\.)*workbook\.co\.il|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;
export function isWorkbookParentOrigin(origin: string): boolean {
  return PARENT_ORIGIN.test(origin);
}

/**
 * `?level=N` (1-based) as a level index, or null when absent or out of range.
 * A deep-linked level opens even if the player's save has it locked.
 */
export function parseLevelParam(
  search: string,
  levelCount: number,
  key = "level",
): number | null {
  const raw = new URLSearchParams(search).get(key);
  if (raw === null || !/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 1 && n <= levelCount ? n - 1 : null;
}

function parentOrigin(): string | null {
  if (typeof window === "undefined" || window.parent === window) return null;
  let origin = window.location.ancestorOrigins?.[0] ?? "";
  if (!origin && document.referrer) {
    try {
      origin = new URL(document.referrer).origin;
    } catch {
      origin = "";
    }
  }
  return isWorkbookParentOrigin(origin) ? origin : null;
}

let slug = "";
let target: string | null = null;

export function initHost(gameSlug: string): void {
  slug = gameSlug;
  target = parentOrigin();
  if (!target) return;
  window.addEventListener("error", (e) =>
    postToHost({ type: "error", message: String(e.message).slice(0, 200) }),
  );
}

export function postToHost(message: HostMessage): void {
  if (!target) return;
  window.parent.postMessage(
    { source: "workbook-game", version: 1, slug, ...message },
    target,
  );
}

/** One ready event per document; starts/completions follow actual loaded contracts. */
export class WorkbookSession {
  private ready = false;
  private level: number | null = null;
  private completed = false;
  constructor(private send: (message: HostMessage) => void) {}
  restart() {
    this.level = null;
    this.completed = false;
  }
  sync(state: {
    ready: boolean;
    level: number;
    complete: boolean;
    durationMs: number;
  }) {
    if (!state.ready) return;
    if (!this.ready) {
      this.ready = true;
      this.send({ type: "ready" });
    }
    if (this.level !== state.level) {
      this.level = state.level;
      this.completed = false;
      this.send({ type: "level-start", level: state.level });
    }
    if (state.complete && !this.completed) {
      this.completed = true;
      this.send({
        type: "level-complete",
        level: state.level,
        durationMs: Math.max(0, Math.round(state.durationMs)),
      });
    }
  }
}
