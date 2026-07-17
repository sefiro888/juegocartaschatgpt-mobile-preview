import { describe, expect, it } from 'vitest';
import { getPreconstructedDeck } from '../cardsDb';
import { DECK_CATALOG } from '../deckCatalog';
import { CardSchema } from '../../types/card';

describe('mazos preconstruidos', () => {
  it('publica 20 mazos sin identificadores duplicados', () => {
    expect(DECK_CATALOG).toHaveLength(20);
    expect(new Set(DECK_CATALOG.map((deck) => deck.id)).size).toBe(DECK_CATALOG.length);
  });

  it.each(DECK_CATALOG)('$id contiene 50 cartas validas', ({ id }) => {
    const deck = getPreconstructedDeck(id);

    expect(deck).toHaveLength(50);
    deck.forEach((card) => expect(CardSchema.safeParse(card).success).toBe(true));
  });
});
