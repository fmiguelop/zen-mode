export type RestorableWindowState = 'normal' | 'minimized' | 'maximized';

export interface FullscreenSession {
  windowId: number;
  priorState: RestorableWindowState;
}

const sessionsByTabId = new Map<number, FullscreenSession>();

export function trackFullscreenSession(tabId: number, session: FullscreenSession): void {
  sessionsByTabId.set(tabId, session);
}

export function consumeFullscreenSession(tabId: number): FullscreenSession | undefined {
  const session = sessionsByTabId.get(tabId);
  sessionsByTabId.delete(tabId);
  return session;
}

export function clearFullscreenSession(tabId: number): void {
  sessionsByTabId.delete(tabId);
}

export function normalizeRestorableWindowState(
  state: Browser.windows.Window['state'] | undefined,
): RestorableWindowState {
  if (state === 'minimized' || state === 'maximized') {
    return state;
  }

  return 'normal';
}
