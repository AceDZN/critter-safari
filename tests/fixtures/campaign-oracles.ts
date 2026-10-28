/** Independent handwritten targets from the factual tables and original English.
 * Tests only: never import this file into runtime or derive it with selectors.
 * Index = level - 1; each inner array is the ordered successful rescue IDs. */
export const CAPTURE_ORACLES = [
  ['moss'], ['pebble'], ['reed'], ['pip'], ['glint'],
  ['pip'], ['nib'], ['moss'], ['pip'], ['brin'],
  ['pip'], ['tumble'], ['reed'], ['nib'], ['fizz'],
  ['pebble'], ['tumble'], ['pip'], ['nib'], ['coda'],
  ['reed'], ['nib'], ['tumble'], ['pip'], ['brin'],
  ['fern'], ['iris'], ['fern'], ['juniper'], ['mica'],
  ['nib'], ['tumble'], ['pebble'], ['nib'], ['alba'],
  ['reed', 'tumble'], ['nib', 'pip'], ['glint', 'fern'], ['alba', 'coda'], ['lark', 'quill', 'nori'],
  ['tumble'], ['pip'], ['brin'], ['juniper'], ['coda'],
  ['iris', 'glint'], ['alba', 'coda'], ['pebble', 'tumble'], ['juniper', 'hush', 'iris'], ['alder', 'drift', 'bramble'],
] as const;
