import { describe, expect, it } from 'vitest';
import { DECK_CATALOG } from '../core/deckCatalog';
import { createOnlineGameState, configureOnlineGuestDeck } from './gameSetup';

function completeDeckIds(state: ReturnType<typeof createOnlineGameState>, side: 'player' | 'opponent') {
  const player = state[side];
  return [...player.hand, ...player.deck, ...player.graveyard].map((card) => card.id).sort();
}

describe('preparacion de partidas online', () => {
  it.each(DECK_CATALOG)('permite crear una sala con $name', ({ id, commanderFaction }) => {
    const state = createOnlineGameState(id);

    expect(completeDeckIds(state, 'player')).toHaveLength(50);
    expect(state.player.commander.faction).toBe(commanderFaction);
  });

  it.each(DECK_CATALOG)('permite al invitado elegir $name', ({ id, commanderFaction }) => {
    const waitingState = createOnlineGameState('FURIA');
    const hostDeckBeforeJoin = completeDeckIds(waitingState, 'player');
    const readyState = configureOnlineGuestDeck(waitingState, id);

    expect(completeDeckIds(readyState, 'player')).toEqual(hostDeckBeforeJoin);
    expect(completeDeckIds(readyState, 'opponent')).toHaveLength(50);
    expect(readyState.opponent.commander.faction).toBe(commanderFaction);
  });
});
