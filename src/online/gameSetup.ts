import { CARDS_DB, getPreconstructedDeck } from '../core/cardsDb';
import { getDeckDefinition, type DeckId } from '../core/deckCatalog';
import { initializeGame } from '../core/engine';
import type { Card, GameState } from '../types/card';

function getCommander(faction: 'FURIA' | 'ARCANO'): Card {
  return faction === 'FURIA'
    ? CARDS_DB['comandante-furia']
    : CARDS_DB['comandante-arcano'];
}

export function createOnlineGameState(hostDeckId: DeckId): GameState {
  const hostDeck = getDeckDefinition(hostDeckId);
  const guestDeckId: DeckId = hostDeck.commanderFaction === 'FURIA' ? 'ARCANO' : 'FURIA';
  const guestDeck = getDeckDefinition(guestDeckId);

  return initializeGame(
    getPreconstructedDeck(hostDeck.id),
    getPreconstructedDeck(guestDeck.id),
    getCommander(hostDeck.commanderFaction),
    getCommander(guestDeck.commanderFaction),
    `online-game-${Date.now()}`,
  );
}

export function configureOnlineGuestDeck(gameState: GameState, guestDeckId: DeckId): GameState {
  const guestDeck = getDeckDefinition(guestDeckId);
  const completeHostDeck = [
    ...gameState.player.hand,
    ...gameState.player.deck,
    ...gameState.player.graveyard,
  ];

  return initializeGame(
    completeHostDeck,
    getPreconstructedDeck(guestDeck.id),
    gameState.player.commander,
    getCommander(guestDeck.commanderFaction),
    `${gameState.seed}-guest-ready`,
  );
}
