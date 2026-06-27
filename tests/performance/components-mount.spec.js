import { expect, test } from '@playwright/test';

const warmupRuns = 3;
const measuredRuns = 30;
const benchmarkScale = 'large';
const expectedComponentCount = 5001;
const fixture = `/components/performance/mount-baseline?scale=${benchmarkScale}`;
const groupedBindingsFixture = `${fixture}&groupedBindings=true`;
const groupedEffectsFixture = `${groupedBindingsFixture}&groupSignalEffects=true`;

test.describe('components mount performance', () => {
  test.skip(!process.env.HET_PERF, 'Performance benchmarks are opt-in. Run with HET_PERF=1.');
  test.skip(({ browserName }) => browserName !== 'chromium', 'Performance benchmark runs on Chromium only.');
  test.setTimeout(180_000);

  test('does not collect mount metrics by default', async ({ page }) => {
    await page.goto('/');
    const metrics = await page.evaluate(() => window.__hetComponentMountMetrics);

    expect(metrics).toBeUndefined();
  });

  test('reports initial mount baseline stats', async ({ page }) => {
    await runMountBenchmark(page, {
      fixture,
      label: 'components mount performance baseline',
      expectGroupedEffects: false,
    });
  });

  test('reports grouped-binding mount stats with grouped effects disabled', async ({ page }) => {
    await runMountBenchmark(page, {
      fixture: groupedBindingsFixture,
      label: 'components mount performance grouped bindings',
      expectGroupedEffects: false,
    });
  });

  test('reports grouped signal effect mount stats', async ({ page }) => {
    await runMountBenchmark(page, {
      fixture: groupedEffectsFixture,
      label: 'components mount performance grouped signal effects',
      expectGroupedEffects: true,
    });
  });
});

async function runMountBenchmark(page, options) {
  const { expectGroupedEffects, fixture, label } = options;
    const samples = [];
    const metricSamples = [];
    const totalRuns = warmupRuns + measuredRuns;

    for (let run = 0; run < totalRuns; run += 1) {
      await page.goto(`${fixture}&run=${run}`);
      await expect(page.locator('#mount-baseline-summary')).toHaveText(
        `Mounted ${expectedComponentCount} components`,
      );
      await expect(page.locator('[het-mount-pending]')).toHaveCount(0);

      const result = await page.evaluate(() => window.hetMountBenchmark);

      expect(typeof result.duration).toBe('number');
      expect(result.mountedComponentCount).toBe(expectedComponentCount);
      expect(result.initializedComponentCount).toBe(expectedComponentCount);
      expect(result.expectedComponentCount).toBe(expectedComponentCount);
      expect(result.scale).toBe(benchmarkScale);
      expect(result.metrics).toEqual(expect.objectContaining({
        buckets: expect.any(Object),
        counters: expect.any(Object),
        duration: expect.any(Number),
      }));
      expect(result.metrics.counters.mountedComponents).toBe(expectedComponentCount);
      expect(result.metrics.counters.bindingParseCacheHits).toBeGreaterThan(
        result.metrics.counters.bindingParseCacheMisses,
      );
      expect(result.metrics.counters.directiveAttrCacheHits).toBeGreaterThan(
        result.metrics.counters.directiveAttrCacheMisses,
      );
      expect(result.metrics.buckets.collectScopedDom.duration).toEqual(expect.any(Number));
      expect(result.metrics.buckets.parseBindings.duration).toEqual(expect.any(Number));
      expect(result.metrics.buckets.initializeRuntimeBindings.duration).toEqual(expect.any(Number));
      if (expectGroupedEffects) {
        expect(result.metrics.counters.runtimeSignalEffectGroupCount).toBeGreaterThan(0);
        expect(result.metrics.counters.runtimeGroupedSignalBindingCount).toBeGreaterThan(0);
      } else {
        expect(result.metrics.counters.runtimeSignalEffectGroupCount).toBeUndefined();
        expect(result.metrics.counters.runtimeGroupedSignalBindingCount).toBeUndefined();
      }

      if (run >= warmupRuns) {
        samples.push(result.duration);
        metricSamples.push(result.metrics);
      }
    }

    const stats = summarize(samples);
    const bucketStats = summarizeBuckets(metricSamples, stats.trimmedMean);
    console.info(label, JSON.stringify({
      fixture,
      scale: benchmarkScale,
      browser: 'chromium',
      expectedComponentCount,
      warmupRuns,
      measuredRuns,
      buckets: bucketStats,
      counters: metricSamples.at(-1).counters,
      ...stats,
    }));
}

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);

  return {
    count: samples.length,
    trimmedCount: trimmed.length,
    min: round(sorted[0]),
    max: round(sorted.at(-1)),
    median: round(percentile(sorted, 0.5)),
    mean: round(mean(sorted)),
    p90: round(percentile(sorted, 0.9)),
    trimmedMean: round(mean(trimmed)),
    samples: sorted.map(round),
  };
}

function summarizeBuckets(metrics, totalDuration) {
  const bucketNames = Array.from(new Set(
    metrics.flatMap((metric) => Object.keys(metric.buckets)),
  )).sort();
  const result = {};

  for (const bucketName of bucketNames) {
    const durations = metrics.map((metric) => metric.buckets[bucketName]?.duration || 0);
    const stats = summarize(durations);
    result[bucketName] = {
      count: metrics.at(-1).buckets[bucketName]?.count || 0,
      mean: stats.mean,
      median: stats.median,
      trimmedMean: stats.trimmedMean,
      percentOfDuration: round((stats.trimmedMean / totalDuration) * 100),
    };
  }

  return result;
}

function percentile(sorted, percentileValue) {
  const index = Math.ceil(sorted.length * percentileValue) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
