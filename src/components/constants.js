const SIGNAL_SOURCE_TYPE = 0;
const READ_SOURCE_TYPE = 3;
const PREACT_SIGNAL_BRAND = Symbol.for('preact-signals');
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
  CONTEXTUAL_IDENTIFIERS,
  FORBIDDEN_MEMBER_NAMES,
  INTRINSIC_IDENTIFIERS,
  PREACT_SIGNAL_BRAND,
  READ_SOURCE_TYPE,
  SIGNAL_SOURCE_TYPE,
};
