'use client';

import { useCallback, useEffect, useSyncExternalStore, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab inside `ref` and closes on Escape, for as long as `active` is true.
 *
 * Shared by every overlay on the site so the dialogs cannot drift apart in how
 * they handle the keyboard. `offsetParent !== null` filters out anything the
 * layout is currently hiding — a collapsed section, an off-screen honeypot —
 * so the cycle only ever visits controls the visitor can actually see.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape: () => void,
) {
  useEffect(() => {
    if (!active) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;

      const nodes = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null,
      );
      if (!nodes.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;

      if (e.shiftKey && (activeEl === first || !ref.current.contains(activeEl))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ref, active, onEscape]);
}

/**
 * Live height of the visual viewport in px, or null when it is unknown.
 *
 * `svh` does NOT shrink when the on-screen keyboard opens, so a sheet sized in
 * `svh` puts its footer and half its list underneath the keyboard the moment a
 * search field is focused. visualViewport is the only thing that reports the
 * space actually left.
 *
 * Read through useSyncExternalStore rather than an effect: the viewport is an
 * external source of truth, and subscribing to it directly avoids the extra
 * render pass a setState-in-an-effect would cost on every keyboard event.
 */
const NOOP = () => () => {};

export function useVisualViewportHeight(active: boolean): number | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const vv = window.visualViewport;
      if (!active || !vv) return NOOP();
      vv.addEventListener('resize', onChange);
      vv.addEventListener('scroll', onChange);
      return () => {
        vv.removeEventListener('resize', onChange);
        vv.removeEventListener('scroll', onChange);
      };
    },
    [active],
  );

  const getSnapshot = useCallback(
    () => (active ? (window.visualViewport?.height ?? null) : null),
    [active],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
