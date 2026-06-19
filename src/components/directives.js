import {
  MODEL_TYPES,
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
    name: 'het-sync',
    sourceType: READ_SOURCE_TYPE,
    allowMultiple: true,
    acquisitionStrategy: 'sync',
  },
  {
    name: 'het-text',
    keyRequired: false,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: false,
    write: (el, key, value) => {
      el[key] = value;
    },
    defaultKey: 'textContent',
  },
  {
    name: 'het-props',
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: true,
    write: (el, key, value) => {
      el[key] = value;
    },
  },
  {
    name: 'het-attrs',
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: true,
    write: (el, key, value) => {
      el.setAttribute(key, String(value));
    },
  },
  {
    name: 'het-bool-attrs',
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: true,
    write: (el, key, value) => {
      if (value) {
        el.setAttribute(key, '');
      } else {
        el.removeAttribute(key);
      }
    },
  },
  {
    name: 'het-class',
    keyRequired: true,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: true,
    write: (el, key, value) => {
      if (value) {
        el.classList.add(key);
      } else {
        el.classList.remove(key);
      }
    },
  },
  {
    name: 'het-model',
    keyRequired: false,
    sourceType: SIGNAL_SOURCE_TYPE,
    allowMultiple: false,
    write: (el, key, value) => {
      el[key] = value;
    },
  },
];

const DIRECTIVE_BY_NAME = Object.fromEntries(
  DIRECTIVES.map((directive) => [directive.name, directive]),
);
const DIRECTIVE_ATTR_NAMES = DIRECTIVES.flatMap((directive) => {
  if (directive.name === 'het-model') {
    return [
      directive.name,
      ...MODEL_TYPES.map((type) => `${directive.name}:${type}`),
    ];
  }
  return [directive.name];
});
const DIRECTIVES_SELECTOR = DIRECTIVE_ATTR_NAMES
  .map((name) => `[${escapeAttributeSelectorName(name)}]`)
  .join(', ');

export {
  DIRECTIVES,
  DIRECTIVE_ATTR_NAMES,
  DIRECTIVE_BY_NAME,
  DIRECTIVES_SELECTOR,
};
