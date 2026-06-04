import { describe, expect, it } from 'vitest';
import {
  clearFullscreenSession,
  consumeFullscreenSession,
  normalizeRestorableWindowState,
  trackFullscreenSession,
} from './fullscreen-session';

describe('fullscreen-session', () => {
  it('tracks and consumes a session by tab id', () => {
    trackFullscreenSession(42, { windowId: 7, priorState: 'maximized' });

    expect(consumeFullscreenSession(42)).toEqual({ windowId: 7, priorState: 'maximized' });
    expect(consumeFullscreenSession(42)).toBeUndefined();
  });

  it('clears a tracked session without consuming restore state', () => {
    trackFullscreenSession(9, { windowId: 3, priorState: 'normal' });
    clearFullscreenSession(9);

    expect(consumeFullscreenSession(9)).toBeUndefined();
  });

  it('normalizes unknown window states to normal', () => {
    expect(normalizeRestorableWindowState('fullscreen')).toBe('normal');
    expect(normalizeRestorableWindowState(undefined)).toBe('normal');
    expect(normalizeRestorableWindowState('maximized')).toBe('maximized');
  });
});
