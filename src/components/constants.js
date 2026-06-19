const SIGNAL_SOURCE_TYPE = 0;
const FUNC_SOURCE_TYPE = 1;
const ASSIGNMENT_SOURCE_TYPE = 2;
const READ_SOURCE_TYPE = 3;
const PREACT_SIGNAL_BRAND = Symbol.for('preact-signals');
const MODEL_TYPES = ['int', 'bool', 'float'];
const EXPORTS_ATTR = 'het-exports';
const IMPORTS_ATTR = 'het-imports';
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
const EMPTY_EXPORTS_SET = new Set();

export {
  ACQUISITION_STRATEGIES,
  ASSIGNMENT_SOURCE_TYPE,
  CONTEXTUAL_IDENTIFIERS,
  EMPTY_EXPORTS_SET,
  EXPORTS_ATTR,
  FORBIDDEN_MEMBER_NAMES,
  FUNC_SOURCE_TYPE,
  IMPORTS_ATTR,
  INTRINSIC_IDENTIFIERS,
  KEYBOARD_EVENT_NAMES,
  MODEL_TYPES,
  PREACT_SIGNAL_BRAND,
  READ_SOURCE_TYPE,
  SIGNAL_SOURCE_TYPE,
};
