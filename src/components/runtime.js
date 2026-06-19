import { computed, effect } from '@preact/signals-core';
import { SIGNAL_SOURCE_TYPE } from './constants.js';
import { handleError } from './error-handler.js';
import {
  assertExpressionSignalsExist,
  getBindingInputValue,
} from './expressions.js';
import { getBindingCause } from './logging.js';

function initializeBindings(ctx, bindings) {
  for (const binding of bindings) {
    if (binding.sourceType === SIGNAL_SOURCE_TYPE) {
      configureSignalBinding(ctx, binding);
    }
  }
}

function configureSignalBinding(ctx, binding) {
  if (binding.expression) {
    assertExpressionSignalsExist(binding, ctx.signals);
  }

  const boundSignal = binding.expression
    ? computed(() => binding.expression && getBindingInputValue(ctx, binding))
    : ctx.signals[binding.source];

  if (!boundSignal) {
    throw new Error(
      'HET Error: Bound signal does not exist',
      { cause: getBindingCause(binding, { signalName: binding.source }) },
    );
  }

  const dispose = effect(() => {
    try {
      binding.write(
        binding.el,
        binding.key,
        boundSignal.value,
      );
    } catch (error) {
      handleError(error);
    }
  });
  ctx.addCleanup(dispose);
}

export {
  initializeBindings,
};
