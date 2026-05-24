import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'div',
  'span',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'img',
  'figure',
  'figcaption',
  'picture',
  'blockquote',
  'pre',
  'code',
  'em',
  'strong',
  'b',
  'i',
  'u',
  'mark',
  'sub',
  'sup',
  'small',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'br',
  'hr',
];

const ALLOWED_ATTR = [
  'id',
  'lang',
  'dir',
  'href',
  'title',
  'src',
  'alt',
  'width',
  'height',
  'colspan',
  'rowspan',
  'scope',
  'start',
  'type',
  'reversed',
];

const URL_ATTRS = new Set(['href', 'src']);

const purify = DOMPurify(window);

purify.addHook('uponSanitizeAttribute', (node, data) => {
  if (!URL_ATTRS.has(data.attrName)) {
    return;
  }

  if (!isAllowedUrl(data.attrValue)) {
    data.keepAttr = false;
    data.attrValue = '';
  }
});

export function isAllowedUrl(url: string): boolean {
  const trimmed = url.trim();

  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith('#')) {
    return true;
  }

  if (trimmed.startsWith('//')) {
    return false;
  }

  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1]!.toLowerCase();
    return scheme === 'http' || scheme === 'https';
  }

  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true;
  }

  // Scheme-less relative paths (e.g. "article/slug")
  return !trimmed.includes(':');
}

function postProcessFragment(fragment: DocumentFragment): string {
  const wrapper = document.createElement('div');
  wrapper.appendChild(fragment);

  for (const element of wrapper.querySelectorAll('*')) {
    element.removeAttribute('style');

    if (element.tagName === 'A') {
      const anchor = element as HTMLAnchorElement;
      if (anchor.hasAttribute('href')) {
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
      }
    }

    if (element.tagName === 'IMG') {
      element.setAttribute('loading', 'lazy');
    }
  }

  return wrapper.innerHTML;
}

export function sanitizeArticleHtml(html: string): string {
  const fragment = purify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    RETURN_DOM_FRAGMENT: true,
  }) as DocumentFragment;

  return postProcessFragment(fragment);
}
