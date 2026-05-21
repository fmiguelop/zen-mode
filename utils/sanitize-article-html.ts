export function sanitizeArticleHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  for (const element of doc.body.querySelectorAll('*')) {
    element.removeAttribute('style');

    if (element.tagName === 'A') {
      const anchor = element as HTMLAnchorElement;
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    }

    if (element.tagName === 'IMG') {
      element.setAttribute('loading', 'lazy');
    }
  }

  return doc.body.innerHTML;
}
