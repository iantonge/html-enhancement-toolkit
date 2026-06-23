const SIGNAL_SOURCE_TYPE = 0;
const FUNC_SOURCE_TYPE = 1;
const ASSIGNMENT_SOURCE_TYPE = 2;
const READ_SOURCE_TYPE = 3;
const PREACT_SIGNAL_BRAND = Symbol.for('preact-signals');
const MODEL_TYPES = ['int', 'bool', 'float'];
const EXPORTS_ATTR = 'het-exports';
const IMPORTS_ATTR = 'het-imports';
const IF_ATTR = 'het-if';
const FOR_ATTR = 'het-for';
const KEYBOARD_EVENT_NAMES = ['keydown', 'keyup', 'keypress'];
const ACQUISITION_STRATEGIES = ['seed', 'sync'];
const FORBIDDEN_MEMBER_NAMES = new Set(['__proto__', 'prototype', 'constructor']);
const CONTEXTUAL_IDENTIFIERS = new Set([
  '$event',
  '$target',
  '$currentTarget',
  '$text',
  '$props',
  '$attrs',
  '$boolAttrs',
  '$classes',
  '$key',
]);
const INTRINSIC_IDENTIFIERS = new Set(['$int', '$float', '$bool']);
const EMPTY_EXPORTS_SET = new Set();
const STRUCTURAL_ATTRS = [IF_ATTR, FOR_ATTR];

export {
  ACQUISITION_STRATEGIES,
  ASSIGNMENT_SOURCE_TYPE,
  CONTEXTUAL_IDENTIFIERS,
  EMPTY_EXPORTS_SET,
  EXPORTS_ATTR,
  FOR_ATTR,
  FORBIDDEN_MEMBER_NAMES,
  FUNC_SOURCE_TYPE,
  IF_ATTR,
  IMPORTS_ATTR,
  INTRINSIC_IDENTIFIERS,
  KEYBOARD_EVENT_NAMES,
  MODEL_TYPES,
  PREACT_SIGNAL_BRAND,
  READ_SOURCE_TYPE,
  SIGNAL_SOURCE_TYPE,
  STRUCTURAL_ATTRS,
};
