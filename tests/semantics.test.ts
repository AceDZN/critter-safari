import test from 'node:test';
import assert from 'node:assert/strict';
import { CLEARING_CREATURES, CONTRACTS, TRANSFER_CREATURES, type Contract, type CreatureSpec } from '../src/content';
import { acceptsCapture, selectCandidates, validateContract } from '../src/semantics';

// Hand-authored answer oracle. This does not compute expected answers using the selector.
const ORACLE = [
  ['first-capture', 'moss'], ['small-and-swift', 'pip'], ['between-speeds', 'tumble'],
  ['bounded-fastest', 'reed'], ['new-clearing', 'brin'],
] as const;

// Independent compact truth fixtures: id, diet, usual speed, size.
const CLEARING_TABLE = [
  ['moss', 'leaf', 0.62, 1.10], ['pip', 'berry', 1.55, 0.70],
  ['tumble', 'leaf', 0.95, 1.30], ['reed', 'leaf', 1.25, 0.80],
  ['nib', 'berry', 1.85, 0.90], ['pebble', 'berry', 0.78, 1.10],
];
const TRANSFER_TABLE = [
  ['alba', 'leaf', 0.90, 1.20], ['brin', 'berry', 0.70, 0.85],
  ['coda', 'berry', 1.10, 1.05], ['dune', 'berry', 1.50, 0.65],
  ['echo', 'leaf', 1.85, 0.75], ['fizz', 'leaf', 0.55, 1.30],
];

const compact = (creatures: readonly CreatureSpec[]) => creatures.map((c) => [c.id, c.diet, c.usualSpeed, c.size]);
const withContract = (patch: Partial<Contract>): Contract => ({ ...CONTRACTS[0]!, ...patch });

test('authored measurements match independent tables', () => {
  assert.deepEqual(compact(CLEARING_CREATURES), CLEARING_TABLE);
  assert.deepEqual(compact(TRANSFER_CREATURES), TRANSFER_TABLE);
});

test('all five original English fixtures have exactly the hand-authored target', () => {
  for (const [id, target] of ORACLE) {
    const contract = CONTRACTS.find((c) => c.id === id)!;
    assert.equal(validateContract(contract), target);
    assert.deepEqual(selectCandidates(contract.creatures, contract.rule), [target]);
    for (const creature of contract.creatures) assert.equal(acceptsCapture(contract, creature.id), creature.id === target);
  }
});

test('the same scene requires different decisions, all archetypes are targets', () => {
  assert.ok(CONTRACTS.slice(0, 4).every((c) => c.creatures === CLEARING_CREATURES));
  assert.notEqual(validateContract(CONTRACTS[1]!), validateContract(CONTRACTS[3]!));
  assert.deepEqual(new Set(ORACLE.map(([id, target]) => CONTRACTS.find((c) => c.id === id)!.creatures.find((c) => c.id === target)!.archetype)), new Set(['puffling', 'shellback', 'hopper']));
});

test('bounded extremes exclude faster/slower outside-set distractors', () => {
  assert.equal(CLEARING_CREATURES.find((c) => c.id === 'nib')!.usualSpeed, 1.85);
  assert.equal(validateContract(CONTRACTS[3]!), 'reed');
  assert.equal(TRANSFER_CREATURES.find((c) => c.id === 'fizz')!.usualSpeed, 0.55);
  assert.equal(validateContract(CONTRACTS[4]!), 'brin');
  assert.equal(acceptsCapture(CONTRACTS[3]!, 'nib'), false);
  assert.equal(acceptsCapture(CONTRACTS[4]!, 'fizz'), false);
});

test('strict comparisons reject equal endpoints and reject one-condition near misses', () => {
  assert.deepEqual(selectCandidates(CLEARING_CREATURES, CONTRACTS[2]!.rule), ['tumble']);
  assert.equal(acceptsCapture(CONTRACTS[2]!, 'moss'), false);
  assert.equal(acceptsCapture(CONTRACTS[2]!, 'reed'), false);
  assert.equal(acceptsCapture(CONTRACTS[2]!, 'pebble'), false); // speed is between; diet fails
  assert.equal(acceptsCapture(CONTRACTS[1]!, 'nib'), false); // small/fast; archetype fails
  assert.equal(acceptsCapture(CONTRACTS[1]!, 'moss'), false); // puffling; speed and strict size fail
});

test('ties, empty and ambiguous targets fail authoring instead of arbitrary selection', () => {
  const tied = CLEARING_CREATURES.map((c) => c.id === 'tumble' ? { ...c, usualSpeed: 1.25 } : { ...c });
  assert.throws(() => validateContract({ ...CONTRACTS[3]!, creatures: tied }), /found 2/);
  assert.throws(() => validateContract(withContract({ rule: { all: [{ kind: 'trait', trait: 'diet', value: 'stone' }] } })), /found 0/);
  assert.throws(() => validateContract(withContract({ rule: { all: [{ kind: 'trait', trait: 'archetype', value: 'puffling' }] } })), /found 2/);
  assert.throws(() => validateContract(withContract({ rule: { all: [], extreme: { measure: 'size', direction: 'min' } }, creatures: [] })), /found 0/);
});

test('missing references, duplicate IDs and invalid base measures are rejected', () => {
  assert.throws(() => validateContract(withContract({ rule: { all: [{ kind: 'comparison', measure: 'usualSpeed', relation: 'less', referenceId: 'unknown' }] } })), /Unknown comparison reference/);
  assert.throws(() => validateContract(withContract({ creatures: [CLEARING_CREATURES[0]!, CLEARING_CREATURES[0]!] })), /duplicate/);
  assert.throws(() => validateContract(withContract({ creatures: CLEARING_CREATURES.map((c, i) => i ? c : { ...c, usualSpeed: NaN }) })), /invalid base measurement/);
});

test('bait bursts, mud, traps and animation rates cannot change semantic speed truth', () => {
  const modified = CLEARING_CREATURES.map((c, index) => ({
    ...c, currentSpeed: index === 0 ? 8 : 0, movementMultiplier: index === 3 ? 0.1 : 4,
    animationRate: index === 0 ? 3 : 0.2, trapped: index === 3,
  }));
  assert.deepEqual(selectCandidates(modified, CONTRACTS[2]!.rule), ['tumble']);
  assert.deepEqual(selectCandidates(modified, CONTRACTS[3]!.rule), ['reed']);
});

test('appearance, actor array order and position do not encode a target', () => {
  for (const [id, target] of ORACLE) {
    const contract = CONTRACTS.find((c) => c.id === id)!;
    const reordered = [...contract.creatures].reverse().map((c, index) => ({ ...c, colour: index % 2 ? 'gold' : 'green', spawn: [index - 3, 0] as const }));
    assert.equal(validateContract({ ...contract, creatures: reordered }), target);
  }
});

test('transfer uses new names, changed diet/size assignments and no solution hint', () => {
  const transfer = CONTRACTS[4]!;
  assert.equal(transfer.transfer, true);
  assert.equal(transfer.helpHe, '');
  assert.ok(transfer.creatures.every((c) => !CLEARING_CREATURES.some((old) => old.id === c.id || old.name === c.name)));
  assert.notDeepEqual(transfer.creatures.map((c) => c.spawn), CLEARING_CREATURES.map((c) => c.spawn));
  assert.equal(transfer.creatures.find((c) => c.id === 'echo')!.archetype, 'shellback');
  assert.equal(validateContract(transfer), 'brin');
});
