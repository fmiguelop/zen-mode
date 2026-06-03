import { t } from './i18n';

const WORDS_PER_MINUTE = 225;

export function formatReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  if (words === 0) {
    return '';
  }

  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return t('readingTimeMin', String(minutes));
}
