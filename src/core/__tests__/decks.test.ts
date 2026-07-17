import { describe, expect, it } from 'vitest';
import { getPreconstructedDeck } from '../cardsDb';
import { CardSchema } from '../../types/card';

const deckIds = [
  'FURIA',
  'FURIA_AGRO',
  'FURIA_CONTROL',
  'ARCANO',
  'ARCANO_FREEZE',
  'ARCANO_SPELL',
  'NEXO_HIBRIDO',
  'BARAJA_BESTIAS',
  'FORTALEZA_RUNICA',
  'MAZO_VACIO',
  'MAZO_ORDEN',
  'MAZO_ULTIMO_ALIENTO',
  'MAZO_DOBLE_ATAQUE',
  'MAZO_FORESTAL_CONTROL',
  'MAZO_SOMBRA',
  'MAZO_NATURALEZA',
  'MAZO_CELESTIAL',
  'MAZO_ACUATICO',
  'MAZO_RENEGADOS',
  'MAZO_ORCOS_BESTIAS',
] as const;

describe('mazos preconstruidos', () => {
  it.each(deckIds)('%s contiene 50 cartas validas', (deckId) => {
    const deck = getPreconstructedDeck(deckId);

    expect(deck).toHaveLength(50);
    deck.forEach((card) => expect(CardSchema.safeParse(card).success).toBe(true));
  });
});
