const KEY_PREFIX = 'still-scroll:';

function storageKey(url: string): string {
  return `${KEY_PREFIX}${url}`;
}

export function saveScrollPosition(url: string, scrollTop: number): void {
  try {
    sessionStorage.setItem(storageKey(url), String(scrollTop));
  } catch {
    // sessionStorage unavailable
  }
}

export function getScrollPosition(url: string): number | null {
  try {
    const value = sessionStorage.getItem(storageKey(url));

    if (value == null) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function restoreScrollPosition(element: HTMLElement, url: string): void {
  const saved = getScrollPosition(url);

  if (saved == null) {
    return;
  }

  const apply = (): void => {
    const maxScroll = element.scrollHeight - element.clientHeight;
    element.scrollTop = Math.min(saved, Math.max(0, maxScroll));
  };

  requestAnimationFrame(apply);
}
