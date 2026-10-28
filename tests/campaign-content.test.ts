import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTRACTS, CHAPTERS, CLEARING_CREATURES, TRANSFER_CREATURES, EQUALITY_CREATURES,
  REFERENCE_CREATURES, FINAL_CREATURES, type CandidateRule, type Contract, type CreatureSpec,
} from '../src/content';
import { acceptsCapture, objectiveCount, objectiveFor, selectCandidates, validateContract, validateObjective } from '../src/semantics';

/** Hand-authored from the independent factual tables and English, never from
 * validateContract/selectCandidates or an answer field in runtime content. */
import { CAPTURE_ORACLES as EXPECTED } from "./fixtures/campaign-oracles";
const at = (level: number) => CONTRACTS[level - 1]!;
const compact = (roster: readonly CreatureSpec[]) => roster.map(c => [c.id, c.archetype, c.diet, c.usualSpeed, c.size]);
const table = (id: number, rule: CandidateRule): Contract => ({ ...at(id), objectives: undefined, rule });

test('fifty authored numbered contracts form ten five-level chapters with internal provenance', () => {
  assert.equal(CONTRACTS.length, 50);
  assert.equal(EXPECTED.length, 50);
  assert.equal(CHAPTERS.length, 10);
  assert.equal(new Set(CONTRACTS.map(c => c.id)).size, 50);
  for (let i = 0; i < 50; i++) {
    const c = CONTRACTS[i]!;
    assert.equal(c.level, i + 1);
    assert.equal(c.chapter, Math.ceil((i + 1) / 5));
    assert.equal(c.id, `level-${String(i + 1).padStart(2, '0')}`);
    assert.ok(c.titleHe.length && c.skill.length && c.instruction.length);
    assert.ok(c.sourceModules.length);
    assert.deepEqual(c.sourceUrls, c.sourceModules.map(p => `https://english.workbook.co.il/${p}`));
    assert.ok(c.sourceModules.every(p => /^grade-[789]\/chapter-\d+\/[a-z0-9-]+$/.test(p)));
    assert.ok(c.sourceGrades.every(g => [7, 8, 9].includes(g)));
    assert.ok(c.difficulty.language >= 1 && c.difficulty.language <= 5);
    assert.ok(c.difficulty.planning >= 1 && c.difficulty.planning <= 5);
    if (i > 0) assert.ok(c.difficulty.language >= at(i).difficulty.language);
    assert.equal(c.transfer, (i + 1) % 5 === 0);
    assert.ok(c.creatures.length >= 2 && c.creatures.length <= 6);
    assert.equal(c.rule, objectiveFor(c, 0).rule);
    assert.equal(objectiveCount(c), EXPECTED[i]!.length);
  }
});

test('new factual tables retain independent measures, deliberate equalities and fresh final identities', () => {
  assert.deepEqual(compact(EQUALITY_CREATURES), [
    ['fern','rabbit','leaf',.90,1.20], ['glint','rabbit','berry',.90,.80],
    ['hush','tortoise','leaf',1.20,1.20], ['iris','tortoise','berry',1.20,.80],
    ['juniper','deer','leaf',1.50,1.00], ['kite','deer','berry',1.50,1.40],
  ]);
  assert.deepEqual(compact(REFERENCE_CREATURES), [
    ['lark','rabbit','berry',.80,.90], ['mica','rabbit','leaf',1.20,1.10],
    ['nori','tortoise','berry',1.20,1.30], ['orris','tortoise','leaf',.60,.75],
    ['pollen','deer','berry',1.70,.85], ['quill','deer','leaf',1.40,1.25],
  ]);
  assert.deepEqual(compact(FINAL_CREATURES), [
    ['alder','rabbit','berry',.88,.92], ['bramble','rabbit','leaf',1.28,1.12],
    ['clover','tortoise','berry',1.28,1.32], ['drift','tortoise','leaf',.64,.76],
    ['ember','deer','berry',1.76,.86], ['fable','deer','leaf',1.44,1.24],
  ]);
  const previous = new Set([...CLEARING_CREATURES, ...TRANSFER_CREATURES, ...EQUALITY_CREATURES, ...REFERENCE_CREATURES].map(c => c.id));
  assert.ok(FINAL_CREATURES.every(c => !previous.has(c.id)));
});

for (let n = 1; n <= 50; n++) test(`level ${n}: every original-English stage matches its independent target and rejects all distractors`, () => {
  const c = at(n), expected = EXPECTED[n - 1]!, rescuedIds: string[] = [];
  assert.equal(validateContract(c), expected[0]);
  for (const [index, target] of expected.entries()) {
    assert.equal(validateObjective(c, index, rescuedIds), target);
    assert.deepEqual(selectCandidates(c.creatures, objectiveFor(c, index).rule, { rescuedIds }), [target]);
    for (const actor of c.creatures) assert.equal(acceptsCapture(c, actor.id, index, rescuedIds), actor.id === target, `L${n}/${index + 1}/${actor.id}`);
    rescuedIds.push(target);
  }
  assert.equal(new Set(rescuedIds).size, rescuedIds.length, 'an actor cannot be rescued twice in one order');
});

test('the same exact scene changes target when a consequential English word changes', () => {
  assert.equal(at(13).creatures, at(14).creatures);
  assert.equal(at(13).instruction.replace('slower', 'faster'), at(14).instruction);
  assert.equal(validateContract(at(13)), 'reed');
  assert.equal(validateContract(at(14)), 'nib');
  assert.equal(at(21).creatures, at(22).creatures);
  assert.equal(at(21).instruction.replace('leaves', 'berries'), at(22).instruction);
  assert.equal(validateContract(at(21)), 'reed');
  assert.equal(validateContract(at(22)), 'nib');
});

test('strict endpoints, negative traits and equality have different meanings', () => {
  assert.equal(validateContract(at(11)), 'pip');
  assert.equal(acceptsCapture(at(11), 'moss'), false);
  const equal: CandidateRule = { all: [{ kind: 'comparison', measure: 'usualSpeed', relation: 'equal', referenceId: 'kite' }] };
  assert.deepEqual(selectCandidates(at(29).creatures, equal), ['juniper', 'kite']);
  assert.deepEqual(selectCandidates(at(29).creatures, { all: [{ kind: 'comparison', measure: 'usualSpeed', relation: 'greater', referenceId: 'kite' }] }), []);
  assert.equal(validateContract(at(28)), 'fern');
  assert.equal(acceptsCapture(at(28), 'hush'), false, 'not as fast excludes an equal-speed candidate');
});

test('named exclusions and conditional scope change the outcome, including an inactive exception', () => {
  assert.equal(validateContract(at(41)), 'tumble'); // Reed removed from leaf maximum.
  assert.equal(validateContract(at(42)), 'pip'); // Nib removed from berry maximum.
  assert.equal(validateContract(at(43)), 'brin'); // Dune is tortoise: bounded minimum.
  assert.equal(validateContract(at(44)), 'juniper'); // Juniper is deer: original maximum.
  assert.equal(validateContract(at(45)), 'coda'); // Dune excluded, Echo outside group.
  const original = at(43).rule.conditional!;
  assert.equal(validateContract(table(43, { all: [], conditional: { ...original, value: 'rabbit' } })), 'dune');
  assert.deepEqual(selectCandidates(at(45).creatures, { all: [{ kind: 'trait', trait: 'diet', value: 'berry' }], extreme: { measure: 'usualSpeed', direction: 'max' } }), ['dune']);
});

test('rescued references require genuine matching history; original facts remain referenceable', () => {
  assert.throws(() => validateObjective(at(36), 1, []), /one rescued reference, found 0/);
  assert.throws(() => validateObjective(at(36), 1, ['nib']), /found 2/);
  assert.throws(() => validateObjective(at(37), 1, ['reed', 'nib']), /one rescued reference, found 2/);
  assert.equal(validateObjective(at(36), 1, ['reed']), 'tumble');
  assert.equal(validateObjective(at(49), 2, ['juniper', 'hush']), 'iris');
  assert.deepEqual(selectCandidates(at(31).creatures, at(31).rule, { rescuedIds: ['pip'] }), ['nib'], 'described original reference Pip stays available');
  assert.throws(() => validateObjective(at(36), 1, ['unknown']), /Unknown rescued/);
  assert.throws(() => validateObjective(at(36), 1, ['reed', 'reed']), /duplicate rescue/);
  const bad = { ...at(36), objectives: [objectiveFor(at(36), 0), { instruction: 'Invalid repeated rescue', rule: { all: [{ kind: 'named-set' as const, ids: ['reed'] }] } }] };
  assert.throws(() => validateContract(bad), /found 0/);
});

test('ambiguous, missing and cyclic references fail instead of silently choosing the first', () => {
  const ambiguous: CandidateRule = { all: [
    { kind: 'trait', trait: 'diet', value: 'not-a-preference' },
    { kind: 'comparison', measure: 'usualSpeed', relation: 'greater', reference: { kind: 'described', rule: { all: [{ kind: 'trait', trait: 'archetype', value: 'rabbit' }] } } },
  ] };
  assert.throws(() => selectCandidates(at(31).creatures, ambiguous), /one described reference, found 2/);
  const condition = at(43).rule.conditional!;
  const inactiveInvalid = { ...condition, ifFalse: { all: [{ kind: 'exclude' as const, referenceId: 'missing' }] } };
  assert.throws(() => selectCandidates(at(43).creatures, { all: [], conditional: inactiveInvalid }), /Unknown comparison reference/);
  const ambiguousExclusion = { ...at(50), creatures: at(50).creatures.map(c => c.id === 'fable' ? { ...c, diet: 'berry' as const } : c) };
  assert.throws(() => validateObjective(ambiguousExclusion, 2, ['alder', 'drift']), /one described reference, found 2/, 'the final exclusion resolves the described deer, rather than secretly hardcoding Ember');
  const cyclic: CandidateRule = { all: [] };
  cyclic.all = [{ kind: 'comparison', measure: 'size', relation: 'less', reference: { kind: 'described', rule: cyclic } }];
  assert.throws(() => selectCandidates(at(31).creatures, cyclic), /nesting/);
});

test('ties, empty sets, invalid measurements and invalid objective indices fail authoring', () => {
  assert.throws(() => validateContract(table(29, { all: [], extreme: { measure: 'usualSpeed', direction: 'max' } })), /found 2/);
  assert.throws(() => validateContract(table(29, { all: [], extreme: { measure: 'size', direction: 'min' } })), /found 2/);
  assert.throws(() => validateContract(table(26, { all: [{ kind: 'trait', trait: 'diet', value: 'stone' }] })), /found 0/);
  assert.throws(() => validateContract({ ...at(26), creatures: at(26).creatures.map((c, i) => i ? c : { ...c, usualSpeed: NaN }) }), /invalid base measurement/);
  assert.throws(() => validateContract({ ...at(26), creatures: [at(26).creatures[0]!, at(26).creatures[0]!] }), /duplicate creature/);
  assert.throws(() => validateContract({ ...at(26), objectives: [] }), /no objectives/);
  for (const index of [-1, .5, NaN, 2]) assert.throws(() => objectiveFor(at(36), index), /invalid objective/);
});

test('appearance, positions, actor order and temporary runtime modifiers cannot change any campaign target', () => {
  for (const [n, c] of CONTRACTS.entries()) {
    const modified = [...c.creatures].reverse().map((actor, i) => ({
      ...actor, colour: i % 2 ? 'blue' : 'gold', spawn: [i, 0] as const,
      currentSpeed: i % 2 ? 0 : 100, calmingMultiplier: .1, lureMultiplier: 8, animationRate: i,
    }));
    const rescuedIds: string[] = [];
    for (const [index, target] of EXPECTED[n]!.entries()) {
      assert.deepEqual(selectCandidates(modified, objectiveFor(c, index).rule, { rescuedIds }), [target]);
      rescuedIds.push(target);
    }
  }
});

test('campaign uses safe separated spawn slots without changing the legacy source fixtures', () => {
  const sixSlots = [[-4,-2.4],[-2,1.4],[0,-2.4],[2,1.4],[4,-2.4],[0,2.7]];
  for (const c of CONTRACTS) {
    if (c.creatures.length === 6) assert.deepEqual(c.creatures.map(a => a.spawn), sixSlots);
    for (let i = 0; i < c.creatures.length; i++) for (let j = i + 1; j < c.creatures.length; j++) {
      const a = c.creatures[i]!.spawn, b = c.creatures[j]!.spawn;
      assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1]) > 1.5);
    }
  }
  assert.deepEqual(CLEARING_CREATURES[0]!.spawn, [-3, -1]);
});
