import { describe, expect, it } from 'vitest';
import { isAllowedUrl, sanitizeArticleHtml } from './sanitize-article-html';

describe('isAllowedUrl', () => {
  it('allows http and https URLs', () => {
    expect(isAllowedUrl('http://example.com')).toBe(true);
    expect(isAllowedUrl('https://example.com/path')).toBe(true);
  });

  it('allows relative paths and anchors', () => {
    expect(isAllowedUrl('/path')).toBe(true);
    expect(isAllowedUrl('./path')).toBe(true);
    expect(isAllowedUrl('../path')).toBe(true);
    expect(isAllowedUrl('article/slug')).toBe(true);
    expect(isAllowedUrl('#section')).toBe(true);
  });

  it('rejects dangerous schemes', () => {
    expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isAllowedUrl('vbscript:alert(1)')).toBe(false);
    expect(isAllowedUrl('//evil.com')).toBe(false);
  });
});

describe('sanitizeArticleHtml', () => {
  it('strips event handler attributes', () => {
    const result = sanitizeArticleHtml('<img src="https://example.com/a.jpg" onerror="alert(1)">');
    expect(result).not.toContain('onerror');
    expect(result).toContain('https://example.com/a.jpg');
  });

  it('removes svg and script tags', () => {
    expect(sanitizeArticleHtml('<svg><circle r="1"></circle></svg>')).toBe('');
    expect(sanitizeArticleHtml('<script>void 0</script>')).toBe('');
  });

  it('removes iframe tags', () => {
    expect(sanitizeArticleHtml('<iframe src="https://evil.com"></iframe>')).toBe('');
  });

  it('defangs javascript and data links', () => {
    const javascript = sanitizeArticleHtml('<a href="javascript:alert(1)">click</a>');
    expect(javascript).not.toContain('javascript:');
    expect(javascript).toContain('click');

    const dataLink = sanitizeArticleHtml('<a href="data:text/html,<script>alert(1)</script>">click</a>');
    expect(dataLink).not.toContain('data:');
    expect(dataLink).toContain('click');
  });

  it('preserves safe markup', () => {
    const result = sanitizeArticleHtml('<p>Hello <strong>world</strong></p>');
    expect(result).toContain('Hello');
    expect(result).toContain('<strong>world</strong>');
  });

  it('hardens surviving links', () => {
    const result = sanitizeArticleHtml('<a href="https://example.com">link</a>');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('preserves images with lazy loading', () => {
    const result = sanitizeArticleHtml('<img src="https://example.com/a.jpg" alt="x">');
    expect(result).toContain('src="https://example.com/a.jpg"');
    expect(result).toContain('alt="x"');
    expect(result).toContain('loading="lazy"');
  });

  it('preserves tables', () => {
    const result = sanitizeArticleHtml('<table><tr><td>cell</td></tr></table>');
    expect(result).toContain('<table>');
    expect(result).toContain('cell');
  });

  it('allows relative and anchor hrefs', () => {
    const relative = sanitizeArticleHtml('<a href="/path">relative</a>');
    expect(relative).toContain('href="/path"');

    const anchor = sanitizeArticleHtml('<a href="#section">anchor</a>');
    expect(anchor).toContain('href="#section"');
  });

  it('strips class and style attributes', () => {
    const result = sanitizeArticleHtml(
      '<p class="article-body" style="font-size: 24px; max-width: 600px">text</p>',
    );
    expect(result).not.toContain('class=');
    expect(result).not.toContain('style=');
    expect(result).toContain('text');
  });

  it('preserves responsive image attributes', () => {
    const result = sanitizeArticleHtml(
      '<img src="https://example.com/a.jpg" srcset="https://example.com/a-2x.jpg 2x" sizes="(max-width: 600px) 100vw, 600px" alt="photo">',
    );
    expect(result).toContain('src="https://example.com/a.jpg"');
    expect(result).toContain('srcset="https://example.com/a-2x.jpg 2x"');
    expect(result).toContain('sizes="(max-width: 600px) 100vw, 600px"');
    expect(result).toContain('alt="photo"');
  });

  it('preserves picture sources with srcset', () => {
    const result = sanitizeArticleHtml(
      '<picture><source srcset="https://example.com/a.webp" type="image/webp"><img src="https://example.com/a.jpg" alt="photo"></picture>',
    );
    expect(result).toContain('<picture>');
    expect(result).toContain('<source');
    expect(result).toContain('srcset="https://example.com/a.webp"');
    expect(result).toContain('src="https://example.com/a.jpg"');
  });

  it('rejects dangerous srcset URLs', () => {
    const result = sanitizeArticleHtml(
      '<img src="https://example.com/a.jpg" srcset="javascript:alert(1) 1x" alt="photo">',
    );
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('srcset=');
  });
});
