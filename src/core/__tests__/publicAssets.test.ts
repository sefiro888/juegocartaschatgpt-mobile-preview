import { describe, expect, it } from 'vitest';
import { getCardArtCandidates, resolvePublicAsset } from '../publicAssets';

describe('public asset paths', () => {
  it('prefixes repository assets with the configured Vite base', () => {
    expect(resolvePublicAsset('/assets/cards/art/example.webp', '/juegocartaschatgpt/')).toBe(
      '/juegocartaschatgpt/assets/cards/art/example.webp',
    );
  });

  it('leaves embedded and remote sources unchanged', () => {
    expect(resolvePublicAsset('data:image/svg+xml,example')).toBe('data:image/svg+xml,example');
    expect(resolvePublicAsset('https://example.com/card.webp')).toBe('https://example.com/card.webp');
  });

  it('builds unique fallbacks around the canonical card art', () => {
    const candidates = getCardArtCandidates(
      {
        id: 'example',
        artPath: '/assets/cards/art/example.webp',
      },
      '/juegocartaschatgpt/',
    );

    expect(candidates).toEqual([
      '/juegocartaschatgpt/assets/cards/art/example.webp',
      '/juegocartaschatgpt/assets/cards/art/example.png',
      '/juegocartaschatgpt/assets/cards/art/example.svg',
    ]);
  });
});
