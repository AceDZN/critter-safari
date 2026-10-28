import type { CandidateRule, Clause, Contract, CreatureSpec, Objective, Reference } from './content';

const EPSILON = 1e-9;
const MAX_REFERENCE_DEPTH = 24;
export interface SemanticContext { rescuedIds: readonly string[] }
interface Environment {
  roster: readonly CreatureSpec[];
  byId: ReadonlyMap<string, CreatureSpec>;
  rescued: ReadonlySet<string>;
}

export function objectiveCount(contract: Contract): number {
  return contract.objectives?.length ?? 1;
}
export function objectiveFor(contract: Contract, index = 0): Objective {
  if (!Number.isInteger(index) || index < 0 || index >= objectiveCount(contract)) {
    throw new RangeError(`${contract.id}: invalid objective index ${index}`);
  }
  return contract.objectives?.[index] ?? {
    instruction: contract.instruction, rule: contract.rule, misconceptionHe: contract.misconceptionHe,
  };
}
function depthCheck(depth: number) {
  if (depth > MAX_REFERENCE_DEPTH) throw new Error('Reference nesting exceeds the authored limit');
}
function known(id: string, env: Environment): CreatureSpec {
  const actor = env.byId.get(id);
  if (!actor) throw new Error(`Unknown comparison reference: ${id}`);
  return actor;
}
/** Check every named reference, including inactive conditional branches. */
function checkRule(rule: CandidateRule, env: Environment, depth = 0): void {
  depthCheck(depth);
  const reference = (ref: Reference) => {
    if (ref.kind === 'id') known(ref.id, env);
    else checkRule(ref.rule, env, depth + 1);
  };
  for (const clause of rule.all) {
    if (clause.kind === 'comparison') {
      if (clause.referenceId !== undefined) known(clause.referenceId, env);
      else reference(clause.reference);
    } else if (clause.kind === 'exclude') {
      if (clause.referenceId !== undefined) known(clause.referenceId, env);
      else reference(clause.reference);
    }
    else if (clause.kind === 'named-set') clause.ids.forEach(id => known(id, env));
    else if (clause.kind === 'trait-reference') reference(clause.reference);
  }
  if (rule.conditional) {
    reference(rule.conditional.reference);
    checkRule(rule.conditional.ifTrue, env, depth + 1);
    checkRule(rule.conditional.ifFalse, env, depth + 1);
  }
}
function resolve(ref: Reference, env: Environment, depth: number): CreatureSpec {
  depthCheck(depth);
  if (ref.kind === 'id') return known(ref.id, env);
  // Facts about a described reference remain available after rescue. A rescue
  // reference instead requires an actual matching record in this run.
  const pool = ref.kind === 'rescued' ? env.roster.filter(c => env.rescued.has(c.id)) : env.roster;
  const matches = evaluate(pool, ref.rule, env, depth + 1);
  if (matches.length !== 1) throw new Error(`Expected one ${ref.kind} reference, found ${matches.length}`);
  return matches[0]!;
}
function comparisonReference(clause: Extract<Clause, { kind: 'comparison' }>, env: Environment, depth: number) {
  return clause.referenceId !== undefined ? known(clause.referenceId, env) : resolve(clause.reference, env, depth);
}
function evaluate(pool: readonly CreatureSpec[], rule: CandidateRule, env: Environment, depth = 0): CreatureSpec[] {
  depthCheck(depth);
  let candidates = [...pool];
  if (rule.conditional) {
    const condition = rule.conditional;
    const actor = resolve(condition.reference, env, depth + 1);
    candidates = evaluate(pool, actor[condition.trait] === condition.value ? condition.ifTrue : condition.ifFalse, env, depth + 1);
  }
  // Resolve before filtering: an earlier false clause must not conceal an
  // ambiguous or missing reference later in the same sentence.
  const references = new Map<Clause, CreatureSpec>();
  for (const clause of rule.all) {
    if (clause.kind === 'comparison') references.set(clause, comparisonReference(clause, env, depth + 1));
    if (clause.kind === 'trait-reference') references.set(clause, resolve(clause.reference, env, depth + 1));
    if (clause.kind === 'exclude' && clause.reference) references.set(clause, resolve(clause.reference, env, depth + 1));
  }
  candidates = candidates.filter(actor => rule.all.every(clause => {
    if (clause.kind === 'trait') return clause.negate ? actor[clause.trait] !== clause.value : actor[clause.trait] === clause.value;
    if (clause.kind === 'exclude') return actor.id !== (clause.referenceId ?? references.get(clause)!.id);
    if (clause.kind === 'named-set') return clause.ids.includes(actor.id);
    const ref = references.get(clause)!;
    if (clause.kind === 'trait-reference') {
      const same = actor[clause.trait] === ref[clause.trait];
      return clause.relation === 'same' ? same : !same;
    }
    const difference = actor[clause.measure] - ref[clause.measure];
    return clause.relation === 'equal' ? Math.abs(difference) <= EPSILON
      : clause.relation === 'greater' ? difference > EPSILON : difference < -EPSILON;
  }));
  if (rule.extreme && candidates.length) {
    const { measure, direction } = rule.extreme;
    const values = candidates.map(c => c[measure]);
    const extreme = direction === 'max' ? Math.max(...values) : Math.min(...values);
    candidates = candidates.filter(c => Math.abs(c[measure] - extreme) <= EPSILON);
  }
  return candidates;
}

/** Only original individual preferences and base measures determine truth.
 * Captured actors leave the candidate pool, but remain comparison references.
 * Lure, calming, motion and animation modifiers cannot redefine usual speed. */
export function selectCandidates(creatures: readonly CreatureSpec[], rule: CandidateRule, context: SemanticContext = { rescuedIds: [] }): string[] {
  const env: Environment = { roster: creatures, byId: new Map(creatures.map(c => [c.id, c])), rescued: new Set(context.rescuedIds) };
  for (const id of env.rescued) if (!env.byId.has(id)) throw new Error(`Unknown rescued individual: ${id}`);
  checkRule(rule, env);
  return evaluate(creatures.filter(c => !env.rescued.has(c.id)), rule, env).map(c => c.id);
}
function validateRoster(contract: Contract) {
  const ids = new Set<string>();
  for (const c of contract.creatures) {
    if (ids.has(c.id)) throw new Error(`${contract.id}: duplicate creature ID ${c.id}`);
    ids.add(c.id);
    if (!Number.isFinite(c.usualSpeed) || c.usualSpeed <= 0 || !Number.isFinite(c.size) || c.size <= 0) {
      throw new Error(`${contract.id}: invalid base measurement for ${c.id}`);
    }
  }
}
export function validateObjective(contract: Contract, index = 0, rescuedIds: readonly string[] = []): string {
  validateRoster(contract);
  if (new Set(rescuedIds).size !== rescuedIds.length) throw new Error(`${contract.id}: duplicate rescue record`);
  const objective = objectiveFor(contract, index);
  const matches = selectCandidates(contract.creatures, objective.rule, { rescuedIds });
  if (matches.length !== 1) throw new Error(`${contract.id}, objective ${index + 1}: expected one semantic target, found ${matches.length}`);
  return matches[0]!;
}
/** Validate each authored step with the preceding unique successes. Return the
 * first target for compatibility; this is authoring validation, not a win. */
export function validateContract(contract: Contract): string {
  if (objectiveCount(contract) < 1) throw new Error(`${contract.id}: no objectives`);
  const rescuedIds: string[] = [];
  for (let index = 0; index < objectiveCount(contract); index++) {
    rescuedIds.push(validateObjective(contract, index, rescuedIds));
  }
  return rescuedIds[0]!;
}
export function acceptsCapture(contract: Contract, creatureId: string, objectiveIndex = 0, rescuedIds: readonly string[] = []): boolean {
  return validateObjective(contract, objectiveIndex, rescuedIds) === creatureId;
}
