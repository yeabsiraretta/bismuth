let polling = $state(false);
const DEFAULT_INTERVAL = 30_000;
const TIMER_KEY = '__bismuth_poll_timer';
const VISIBILITY_KEY = '__bismuth_poll_visibility';

type WatchCallback = () => void | Promise<void>;

let callbacks: WatchCallback[] = [];

function isPolling(): boolean {
  return polling;
}

export function addWatchCallback(cb: WatchCallback) {
  if (!callbacks.includes(cb)) {
    callbacks.push(cb);
  }
}

export function removeWatchCallback(cb: WatchCallback) {
  callbacks = callbacks.filter((c) => c !== cb);
}

async function runCallbacks() {
  for (const cb of callbacks) {
    try {
      await cb();
    } catch {
      // non-fatal
    }
  }
}

export function startWatching(intervalMs = DEFAULT_INTERVAL) {
  stopWatching();
  polling = true;
  const timer = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    runCallbacks();
  }, intervalMs);
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>)[TIMER_KEY] = timer;
  }

  if (typeof document !== 'undefined') {
    const onVisibility = () => {
      if (!document.hidden && polling) {
        runCallbacks();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>)[VISIBILITY_KEY] = onVisibility;
    }
  }
}

export function stopWatching() {
  if (typeof window !== 'undefined') {
    const existing = (window as unknown as Record<string, unknown>)[TIMER_KEY];
    if (existing != null) {
      clearInterval(existing as ReturnType<typeof setInterval>);
      (window as unknown as Record<string, unknown>)[TIMER_KEY] = null;
    }
    const visCb = (window as unknown as Record<string, unknown>)[VISIBILITY_KEY];
    if (visCb != null) {
      document.removeEventListener('visibilitychange', visCb as EventListener);
      (window as unknown as Record<string, unknown>)[VISIBILITY_KEY] = null;
    }
  }
  polling = false;
}

export function clearWatchCallbacks() {
  callbacks = [];
}
