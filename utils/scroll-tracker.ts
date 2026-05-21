const COMPLETION_THRESHOLD = 0.95;

export function attachScrollTracker(
  container: HTMLElement,
  onComplete: () => void,
): () => void {
  let completed = false;

  const handleScroll = (): void => {
    if (completed) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;

    if (maxScroll <= 0) {
      return;
    }

    if (scrollTop / maxScroll >= COMPLETION_THRESHOLD) {
      completed = true;
      onComplete();
    }
  };

  container.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    container.removeEventListener('scroll', handleScroll);
  };
}
