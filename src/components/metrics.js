let currentMetrics;

function resetComponentMountMetrics(config) {
  if (config?.measureComponents !== true) {
    currentMetrics = undefined;
    if (typeof window !== 'undefined') {
      delete window.__hetComponentMountMetrics;
    }
    return;
  }

  currentMetrics = {
    startedAt: performance.now(),
    endedAt: undefined,
    duration: undefined,
    buckets: Object.create(null),
    counters: Object.create(null),
  };

  if (typeof window !== 'undefined') {
    window.__hetComponentMountMetrics = currentMetrics;
  }
}

function finishComponentMountMetrics() {
  if (!currentMetrics) return;

  currentMetrics.endedAt = performance.now();
  currentMetrics.duration = currentMetrics.endedAt - currentMetrics.startedAt;
  currentMetrics = undefined;
}

function measureMountBucket(name, fn) {
  if (!currentMetrics) return fn();

  const start = performance.now();
  try {
    return fn();
  } finally {
    recordMountBucket(name, performance.now() - start);
  }
}

function recordMountBucket(name, duration) {
  if (!currentMetrics) return;

  const bucket = currentMetrics.buckets[name] || {
    duration: 0,
    count: 0,
  };

  bucket.duration += duration;
  bucket.count += 1;
  currentMetrics.buckets[name] = bucket;
}

function recordMountCount(name, count = 1) {
  if (!currentMetrics) return;
  currentMetrics.counters[name] = (currentMetrics.counters[name] || 0) + count;
}

function recordRuntimeDomWriteAttempt() {
  recordMountCount('runtimeDomWriteAttempts');
}

function recordRuntimeDomWriteSkip() {
  recordMountCount('runtimeDomWriteSkips');
}

function recordRuntimeDomWrite() {
  recordMountCount('runtimeDomWrites');
}

function recordRuntimeDomWriteQueued() {
  recordMountCount('runtimeDomWriteQueued');
}

function recordRuntimeDomWriteCoalesced() {
  recordMountCount('runtimeDomWriteCoalesced');
}

function recordRuntimeDomWriteFlushed() {
  recordMountCount('runtimeDomWriteFlushed');
}

export {
  finishComponentMountMetrics,
  measureMountBucket,
  recordMountCount,
  recordRuntimeDomWrite,
  recordRuntimeDomWriteAttempt,
  recordRuntimeDomWriteCoalesced,
  recordRuntimeDomWriteFlushed,
  recordRuntimeDomWriteQueued,
  recordRuntimeDomWriteSkip,
  resetComponentMountMetrics,
};
