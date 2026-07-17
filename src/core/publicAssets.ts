import type { Card } from '../types/card';

const EXTERNAL_SOURCE = /^(?:data:|blob:|https?:\/\/)/i;

export function resolvePublicAsset(source: string, basePath = import.meta.env.BASE_URL): string {
  if (EXTERNAL_SOURCE.test(source)) return source;
  const base = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return `${base}${source.replace(/^\/+/, '')}`;
}

export function getCardArtCandidates(
  card: Pick<Card, 'id' | 'artPath'>,
  basePath = import.meta.env.BASE_URL,
): string[] {
  const candidates: string[] = [];

  if (card.artPath) {
    candidates.push(card.artPath);
  }

  candidates.push(
    `/assets/cards/art/${card.id}.webp`,
    `/assets/cards/art/${card.id}.png`,
    `/assets/cards/art/${card.id}.svg`,
  );

  if (card.artPath && !card.artPath.startsWith('data:')) {
    const svgPath = card.artPath.replace(/\.(png|webp|jpg|jpeg)$/i, '.svg');
    if (svgPath !== card.artPath) candidates.push(svgPath);
  }

  const resolved = candidates.map((source) => resolvePublicAsset(source, basePath));
  return [...new Set(resolved)];
}
