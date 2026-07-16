import { useEffect, useState, useCallback, useRef } from 'react';

// ── usePrefersReducedMotion ────────────────────────────────
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}

// ── useCoarsePointer ───────────────────────────────────────
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(pointer: coarse)');
    const handler = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return coarse;
}

// ── useDocumentVisibility ──────────────────────────────────
export function useDocumentVisibility(): boolean {
  const [visible, setVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  });

  useEffect(() => {
    const handler = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return visible;
}

// ── useAriaAnnouncement ────────────────────────────────────
// Returns an announce function and a ref callback for a live region div.
export function useAriaAnnouncement() {
  const ref = useRef<HTMLDivElement | null>(null);

  const announce = useCallback((message: string) => {
    if (ref.current) {
      ref.current.textContent = '';
      void ref.current.offsetHeight;
      ref.current.textContent = message;
    }
  }, []);

  const liveRegionProps: {
    ref: React.RefObject<HTMLDivElement | null>;
    role: 'status';
    'aria-live': 'polite';
    'aria-atomic': true;
    style: React.CSSProperties;
  } = {
    ref,
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': true,
    style: {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0,0,0,0)',
      whiteSpace: 'nowrap',
      border: 0,
    },
  };

  return { announce, liveRegionProps };
}
