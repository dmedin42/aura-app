import { useEffect, useRef } from 'react';

// Calls fn every `ms` while `enabled`, one call at a time: the next tick is scheduled only after
// fn settles. Background tabs skip ticks and catch up as soon as they're visible again.
// fn can resolve to true ("there's more") to run again right away.
export function usePoll(fn, ms, enabled = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return undefined;
    let timer = null;
    let running = false;
    let stopped = false;

    const schedule = (delay) => {
      clearTimeout(timer);
      timer = setTimeout(tick, delay);
    };
    async function tick() {
      if (stopped || running || document.hidden) return; // visibilitychange restarts a hidden tab
      running = true;
      let again = false;
      try {
        again = (await fnRef.current()) === true;
      } catch {
        // fn handles its own errors; a failed tick just waits for the next one.
      }
      running = false;
      if (!stopped) schedule(again ? 0 : ms);
    }
    const onVisibility = () => {
      if (!document.hidden && !running) schedule(0);
    };

    schedule(ms);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ms, enabled]);
}
