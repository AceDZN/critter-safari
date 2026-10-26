import type { CandidateRule, Clause, Contract, CreatureSpec } from './content';

const EPSILON = 1e-9;

function matches(creature: CreatureSpec, clause: Clause, byId: ReadonlyMap<string, CreatureSpec>): boolean {
  if (clause.kind === 'trait') return creature[clause.trait] === clause.value;
  const reference = byId.get(clause.referenceId);
  if (!reference) throw new Error(`Unknown comparison reference: ${clause.referenceId}`);
  const difference = creature[clause.measure] - reference[clause.measure];
  return clause.relation === 'greater' ? difference > EPSILON : difference < -EPSILON;
}

/** Only authored base measures enter truth. Runtime speed/animation/modifiers are ignored. */
export function selectCandidates(creatures: readonly CreatureSpec[], rule: CandidateRule): string[] {
  const byId = new Map(creatures.map((creature) => [creature.id, creature]));
  // Validate references even when an earlier filter would otherwise short-circuit.
  for (const clause of rule.all) {
    if (clause.kind === 'comparison' && !byId.has(clause.referenceId)) {
      throw new Error(`Unknown comparison reference: ${clause.referenceId}`);
    }
  }
  let candidates = creatures.filter((creature) => rule.all.every((clause) => matches(creature, clause, byId)));
  if (rule.extreme && candidates.length) {
    const { measure, direction } = rule.extreme;
    const values = candidates.map((creature) => creature[measure]);
    const extreme = direction === 'max' ? Math.max(...values) : Math.min(...values);
    candidates = candidates.filter((creature) => Math.abs(creature[measure] - extreme) <= EPSILON);
  }
  return candidates.map((creature) => creature.id);
}

/** Fail during authoring/loading rather than marking an arbitrary tied answer correct. */
export function validateContract(contract: Contract): string {
  const ids = new Set<string>();
  for (const creature of contract.creatures) {
    if (ids.has(creature.id)) throw new Error(`${contract.id}: duplicate creature ID ${creature.id}`);
    ids.add(creature.id);
    if (!Number.isFinite(creature.usualSpeed) || creature.usualSpeed <= 0 || !Number.isFinite(creature.size) || creature.size <= 0) {
      throw new Error(`${contract.id}: invalid base measurement for ${creature.id}`);
    }
  }
  const matches = selectCandidates(contract.creatures, contract.rule);
  if (matches.length !== 1) {
    throw new Error(`${contract.id}: expected one semantic target, found ${matches.length}`);
  }
  return matches[0]!;
}

export function acceptsCapture(contract: Contract, creatureId: string): boolean {
  return validateContract(contract) === creatureId;
}
