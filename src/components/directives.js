import {
  READ_SOURCE_TYPE,
  SIGNAL_SOURCE_TYPE,
  FUNC_SOURCE_TYPE,
} from './constants.js';

function escapeAttributeSelectorName(name) {
  return name.replace(/:/g, '\\:');
}

const DIRECTIVES = [
  {
    name: 'het-on',
    sourceType: FUNC_SOURCE_TYPE,
    allowMultiple: true,
  },
  {
    name: 'het-seed',
    sourceType: READ_SOURCE_TYPE,
    allowMultiple: true,
    acquisitionStrategy: 'seed',
  },
  {
    name: 'het-text',
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: false,
    write: (el, key, value) => {
      el[key] = value;
    },
    defaultKey: 'textContent',
  },
];

const DIRECTIVE_BY_NAME = Object.fromEntries(
  DIRECTIVES.map((directive) => [directive.name, directive]),
);
const DIRECTIVE_ATTR_NAMES = DIRECTIVES.map((directive) => directive.name);
const DIRECTIVES_SELECTOR = DIRECTIVE_ATTR_NAMES
  .map((name) => `[${escapeAttributeSelectorName(name)}]`)
  .join(', ');

export {
  DIRECTIVES,
  DIRECTIVE_ATTR_NAMES,
  DIRECTIVE_BY_NAME,
  DIRECTIVES_SELECTOR,
};
