import { batch, computed, effect, signal, untracked } from '@preact/signals-core';
import { destroy, init, registerComponent } from './het.js';

const signals = Object.freeze({
  signal,
  effect,
  computed,
  batch,
  untracked,
});

export {
  init,
  destroy,
  registerComponent,
  signals,
};
