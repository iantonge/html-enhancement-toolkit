const SIGNAL_SOURCE_TYPE = 0;
const FUNC_SOURCE_TYPE = 1;
const ASSIGNMENT_SOURCE_TYPE = 2;
const READ_SOURCE_TYPE = 3;
const PREACT_SIGNAL_BRAND = Symbol.for('preact-signals');
const KEYBOARD_EVENT_NAMES = ['keydown', 'keyup', 'keypress'];
const ACQUISITION_STRATEGIES = ['seed'];
const FORBIDDEN_MEMBER_NAMES = new Set(['__proto__', 'prototype', 'constructor']);
const CONTEXTUAL_IDENTIFIERS = new Set([
  '$event',
  '$target',
  '$currentTarget',
  '$text',
  '$props',
]);
const INTRINSIC_IDENTIFIERS = new Set(['$int', '$float', '$bool']);

export {
  ACQUISITION_STRATEGIES,
  ASSIGNMENT_SOURCE_TYPE,
  CONTEXTUAL_IDENTIFIERS,
  FORBIDDEN_MEMBER_NAMES,
  FUNC_SOURCE_TYPE,
  INTRINSIC_IDENTIFIERS,
  KEYBOARD_EVENT_NAMES,
  PREACT_SIGNAL_BRAND,
  READ_SOURCE_TYPE,
  SIGNAL_SOURCE_TYPE,
};
