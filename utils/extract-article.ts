import { Readability } from '@mozilla/readability';

export interface ExtractedArticle {
  title: string;
  content: string;
  byline: string | null;
  siteName: string | null;
}

export function extractArticle(doc: Document = document): ExtractedArticle | null {
  const clone = doc.cloneNode(true) as Document;
  const reader = new Readability(clone);
  const article = reader.parse();

  if (!article?.content) {
    return null;
  }

  return {
    title: article.title ?? doc.title,
    content: article.content,
    byline: article.byline ?? null,
    siteName: article.siteName ?? null,
  };
}
