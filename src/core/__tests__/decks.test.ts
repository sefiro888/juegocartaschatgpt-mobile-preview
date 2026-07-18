import { describe, expect, it } from 'vitest';
import { CARDS_DB, getPreconstructedDeck } from '../cardsDb';
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

  it('incluye al Devorador Entropico en el mazo de Vacio', () => {
    const card = CARDS_DB['devorador-entropico'];
    const deck = getPreconstructedDeck('MAZO_VACIO');

    expect(CardSchema.safeParse(card).success).toBe(true);
    expect(card.artPath).toBe('/assets/cards/art/devorador-entropico.webp');
    expect(deck.some((deckCard) => deckCard.id === card.id)).toBe(true);
  });

  it('expone las ilustraciones destacadas de la carpeta nueva', () => {
    const featuredIds = [
      'basilisco-caos', 'biblioteca-runica', 'clerigo-luz', 'demonio-infernal',
      'espectro-siniestro', 'esqueleto-guerrero', 'gigante-magma', 'golem-runico',
      'grifo-orden', 'guardian-escarchado', 'juicio-divino', 'leviatan-abisal',
      'murcielago-sombra', 'orco-comandante', 'orco-guerrero', 'parasito-vacio',
      'pegaso-celestial', 'pesadilla-mortal', 'zombi-hambriento',
    ];

    const artPathOverrides: Record<string, string> = {
      'orco-comandante': '/assets/cards/art/cacique-orco.png',
      'zombi-hambriento': '/assets/cards/art/zombi-infectado.png',
    };

    featuredIds.forEach((id) => {
      expect(CARDS_DB[id]?.artPath).toBe(artPathOverrides[id] ?? `/assets/cards/art/${id}.webp`);
      expect(CardSchema.safeParse(CARDS_DB[id]).success).toBe(true);
    });
  });

  it('expone las nuevas cartas creadas desde ilustraciones locales', () => {
    const expectedCards: Record<string, string> = {
      'golem-piedra': '/assets/cards/art/golem-piedra.png',
      'minotauro-brasa': '/assets/cards/art/minotauro-brasa.png',
      'cacique-orco': '/assets/cards/art/cacique-orco.png',
      'horca-renegada': '/assets/cards/art/horca-renegada.png',
      'tumba-olvidada': '/assets/cards/art/tumba-olvidada.png',
      'zombi-infectado': '/assets/cards/art/zombi-infectado.png',
      'vampiro-noble': '/assets/cards/art/vampiro-noble.png',
      'espora-venenosa': '/assets/cards/art/espora-venenosa.png',
      'totem-naturaleza': '/assets/cards/art/totem-naturaleza.png',
      'centauro-guerrero': '/assets/cards/art/centauro-guerrero.png',
      'fauno-bosque': '/assets/cards/art/fauno-bosque.png',
      'obelisco-estelar': '/assets/cards/art/obelisco-estelar.png',
    };

    Object.entries(expectedCards).forEach(([id, artPath]) => {
      expect(CARDS_DB[id]?.artPath).toBe(artPath);
      expect(CardSchema.safeParse(CARDS_DB[id]).success).toBe(true);
    });
  });
});
