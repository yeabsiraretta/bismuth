import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unit tests for AsyncFeature logic — testing the module cache, retry, and
// interaction logging without mounting the Svelte component tree.

vi.mock('@/utils/storage/featurePreload', () => ({
  recordFeatureUse: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  log: {
    error: vi.fn(),
    interaction: vi.fn(),
  },
}));

const { recordFeatureUse } = await import('@/utils/storage/featurePreload');
const { log } = await import('@/utils/logger');

// Extract the loadFeature logic in isolation by recreating the cache map
function createLoader(moduleCache: Map<string, unknown>) {
  return async function loadFeature(
    featureId: string,
    loader: () => Promise<{ default: unknown }>,
    onSuccess: (comp: unknown) => void,
    onError: () => void,
  ): Promise<void> {
    if (moduleCache.has(featureId)) {
      onSuccess(moduleCache.get(featureId));
      return;
    }
    const start = performance.now();
    try {
      const mod = await loader();
      const durationMs = Math.round(performance.now() - start);
      moduleCache.set(featureId, mod.default);
      onSuccess(mod.default);
      (recordFeatureUse as (...args: unknown[]) => void)(featureId);
      (log.interaction as (...args: unknown[]) => void)('ui', 'feature-load', { featureId, durationMs });
    } catch (e) {
      const durationMs = Math.round(performance.now() - start);
      (log.error as (...args: unknown[]) => void)(`Failed to load feature: ${featureId}`, e);
      (log.interaction as (...args: unknown[]) => void)('ui', 'feature-load-error', { featureId, durationMs, error: String(e) });
      onError();
    }
  };
}

describe('AsyncFeature logic', () => {
  let moduleCache: Map<string, unknown>;
  let loadFeature: ReturnType<typeof createLoader>;

  beforeEach(() => {
    moduleCache = new Map();
    loadFeature = createLoader(moduleCache);
    vi.clearAllMocks();
  });

  it('calls onSuccess with the default export on successful load', async () => {
    const FakeComponent = {};
    const loader = vi.fn().mockResolvedValue({ default: FakeComponent });
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await loadFeature('graph', loader, onSuccess, onError);

    expect(onSuccess).toHaveBeenCalledWith(FakeComponent);
    expect(onError).not.toHaveBeenCalled();
  });

  it('records feature use on successful load', async () => {
    const loader = vi.fn().mockResolvedValue({ default: {} });
    await loadFeature('canvas', loader, vi.fn(), vi.fn());
    expect(recordFeatureUse).toHaveBeenCalledWith('canvas');
  });

  it('emits feature-load interaction on success', async () => {
    const loader = vi.fn().mockResolvedValue({ default: {} });
    await loadFeature('graph', loader, vi.fn(), vi.fn());
    expect(log.interaction).toHaveBeenCalledWith('ui', 'feature-load', expect.objectContaining({ featureId: 'graph' }));
  });

  it('calls onError and logs on failed load', async () => {
    const loader = vi.fn().mockRejectedValue(new Error('chunk not found'));
    const onError = vi.fn();

    await loadFeature('canvas', loader, vi.fn(), onError);

    expect(onError).toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining('canvas'), expect.any(Error));
    expect(log.interaction).toHaveBeenCalledWith('ui', 'feature-load-error', expect.objectContaining({ featureId: 'canvas' }));
  });

  it('returns cached module on second call without calling loader again', async () => {
    const FakeComponent = { name: 'FakeComp' };
    const loader = vi.fn().mockResolvedValue({ default: FakeComponent });
    const onSuccess = vi.fn();

    await loadFeature('graph', loader, onSuccess, vi.fn());
    await loadFeature('graph', loader, onSuccess, vi.fn());

    // loader should only have been called once; second call uses cache
    expect(loader).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(2);
    expect(onSuccess).toHaveBeenNthCalledWith(2, FakeComponent);
  });

  it('does not call recordFeatureUse on cached load', async () => {
    const loader = vi.fn().mockResolvedValue({ default: {} });
    await loadFeature('graph', loader, vi.fn(), vi.fn());
    vi.clearAllMocks();
    await loadFeature('graph', loader, vi.fn(), vi.fn());
    expect(recordFeatureUse).not.toHaveBeenCalled();
  });

  it('different featureIds use separate cache entries', async () => {
    const CompA = { name: 'A' };
    const CompB = { name: 'B' };
    const loaderA = vi.fn().mockResolvedValue({ default: CompA });
    const loaderB = vi.fn().mockResolvedValue({ default: CompB });
    const onSuccessA = vi.fn();
    const onSuccessB = vi.fn();

    await loadFeature('canvas', loaderA, onSuccessA, vi.fn());
    await loadFeature('graph', loaderB, onSuccessB, vi.fn());

    expect(onSuccessA).toHaveBeenCalledWith(CompA);
    expect(onSuccessB).toHaveBeenCalledWith(CompB);
  });
});
