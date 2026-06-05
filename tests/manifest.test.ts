import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const MANIFEST_PATH = resolve('.output/chrome-mv3/manifest.json');
const manifestExists = existsSync(MANIFEST_PATH);

interface GeneratedManifest {
  permissions?: string[];
  host_permissions?: string[];
  content_scripts?: Array<{ matches?: string[] }>;
  web_accessible_resources?: Array<{
    resources?: string[];
    matches?: string[];
    use_dynamic_url?: boolean;
  }>;
}

function readGeneratedManifest(): GeneratedManifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as GeneratedManifest;
}

function hasAllUrlsMatch(matches: string[] | undefined): boolean {
  return matches?.includes('<all_urls>') ?? false;
}

describe.skipIf(!manifestExists)('generated Chrome MV3 manifest', () => {
  const manifest = readGeneratedManifest();

  it('keeps only user-initiated permissions', () => {
    expect(manifest.permissions).toEqual(['activeTab', 'scripting', 'storage']);
  });

  it('does not declare broad host permissions', () => {
    expect(manifest.host_permissions).toBeUndefined();
  });

  it('does not register a static all-URL content script', () => {
    const contentScripts = manifest.content_scripts ?? [];

    expect(contentScripts.some((script) => hasAllUrlsMatch(script.matches))).toBe(false);
  });

  it('keeps bundled fonts web-accessible without broad page-read permissions', () => {
    const fontResources = manifest.web_accessible_resources ?? [];

    expect(fontResources).toEqual([
      {
        resources: ['fonts/*'],
        matches: ['<all_urls>'],
        use_dynamic_url: true,
      },
    ]);
  });
});
