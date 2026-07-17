import { create } from 'zustand';
import type { GameState, Card, Position, BoardEntity } from '../types/card';
import { initializeGame, playManaCard, summonUnit, moveUnit, combatAttack, playSpell, endTurn } from '../core/engine';
import { getPreconstructedDeck, CARDS_DB } from '../core/cardsDb';
import { executeAITurn } from '../core/ai';
import { audioService } from '../core/audio';

interface GameStore {
  gameState: GameState | null;
  selectedCardInHand: Card | null;
  selectedEntity: BoardEntity | null;
  hoveredEntity: BoardEntity | null;
  inspectedCard: Card | null;
  activeFaction: 'FURIA' | 'ARCANO' | null;
  isAIThinking: boolean;
  
  // Game Actions
  startNewGame: (playerFaction: 'FURIA' | 'ARCANO', deckTheme?: string) => void;
  selectCardInHand: (card: Card | null) => void;
  selectEntity: (entity: BoardEntity | null) => void;
  setHoveredEntity: (entity: BoardEntity | null) => void;
  setInspectedCard: (card: Card | null) => void;
  
  playMana: (cardId: string) => void;
  summon: (cardId: string, pos: Position, battlecryTarget?: Position) => void;
  move: (from: Position, to: Position) => void;
  attack: (attackerPos: Position, targetPos: Position) => void;
  castSpell: (cardId: string, targetPos: Position) => void;
  endActiveTurn: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  selectedCardInHand: null,
  selectedEntity: null,
  hoveredEntity: null,
  inspectedCard: null,
  activeFaction: null,
  isAIThinking: false,

  startNewGame: (playerFaction: 'FURIA' | 'ARCANO', deckTheme?: string) => {
    const playerDeck = getPreconstructedDeck(deckTheme || playerFaction);
    const opponentFaction = playerFaction === 'FURIA' ? 'ARCANO' : 'FURIA';
    
    // Choose a random opponent theme to make the battle diverse
    const oppThemes = opponentFaction === 'FURIA' 
      ? ['FURIA', 'FURIA_AGRO', 'FURIA_CONTROL'] 
      : ['ARCANO', 'ARCANO_FREEZE', 'ARCANO_SPELL'];
    const randomOppTheme = oppThemes[Math.floor(Math.random() * oppThemes.length)];
    const opponentDeck = getPreconstructedDeck(randomOppTheme);

    const playerCommander = playerFaction === 'FURIA' ? CARDS_DB['comandante-furia'] : CARDS_DB['comandante-arcano'];
    const opponentCommander = opponentFaction === 'FURIA' ? CARDS_DB['comandante-furia'] : CARDS_DB['comandante-arcano'];

    const seed = `game-seed-${Date.now()}`;
    const newState = initializeGame(playerDeck, opponentDeck, playerCommander, opponentCommander, seed);

    set({
      gameState: newState,
      selectedCardInHand: null,
      selectedEntity: null,
      hoveredEntity: null,
      inspectedCard: null,
      activeFaction: playerFaction,
      isAIThinking: false,
    });
  },

  selectCardInHand: (card) => {
    const { isAIThinking } = get();
    if (isAIThinking) return;
    if (card) audioService.playHover();
    set({ selectedCardInHand: card, selectedEntity: null });
  },
  selectEntity: (entity) => {
    const { isAIThinking } = get();
    if (isAIThinking) return;
    if (entity) audioService.playHover();
    set({ selectedEntity: entity, selectedCardInHand: null });
  },
  setHoveredEntity: (entity) => set({ hoveredEntity: entity }),
  setInspectedCard: (card) => {
    if (card) audioService.playHover();
    set({ inspectedCard: card });
  },

  playMana: (cardId) => {
    const { gameState, isAIThinking } = get();
    if (!gameState || gameState.activePlayer !== 'PLAYER' || isAIThinking) return;

    audioService.playHover();
    const nextState = playManaCard(gameState, 'PLAYER', cardId);
    set({ gameState: nextState, selectedCardInHand: null });
  },

  summon: (cardId, pos, battlecryTarget) => {
    const { gameState, isAIThinking } = get();
    if (!gameState || gameState.activePlayer !== 'PLAYER' || isAIThinking) return;

    audioService.playSummonSlam();
    const nextState = summonUnit(gameState, 'PLAYER', cardId, pos, battlecryTarget);
    set({ gameState: nextState, selectedCardInHand: null });
  },

  move: (from, to) => {
    const { gameState, isAIThinking } = get();
    if (!gameState || gameState.activePlayer !== 'PLAYER' || isAIThinking) return;

    audioService.playHover();
    const nextState = moveUnit(gameState, from, to);
    set({ gameState: nextState, selectedEntity: null });
  },

  attack: (attackerPos, targetPos) => {
    const { gameState, isAIThinking } = get();
    if (!gameState || gameState.activePlayer !== 'PLAYER' || isAIThinking) return;

    audioService.playClash();
    const nextState = combatAttack(gameState, attackerPos, targetPos);
    set({ gameState: nextState, selectedEntity: null });
  },

  castSpell: (cardId, targetPos) => {
    const { gameState, isAIThinking } = get();
    if (!gameState || gameState.activePlayer !== 'PLAYER' || isAIThinking) return;

    // Check if the spell is ice/freeze themed
    if (cardId.includes('congelacion') || cardId.includes('prision') || cardId.includes('tormenta') || cardId.includes('escarcha')) {
      audioService.playFreeze();
    } else {
      audioService.playClash();
    }
    const nextState = playSpell(gameState, 'PLAYER', cardId, targetPos);
    set({ gameState: nextState, selectedCardInHand: null });
  },

  endActiveTurn: () => {
    const { gameState, isAIThinking } = get();
    if (!gameState || gameState.activePlayer !== 'PLAYER' || isAIThinking) return;

    // Play chime sound
    audioService.playTurnChange();
    
    // End player's turn
    const nextState = endTurn(gameState);

    // Check if end-of-turn triggers already decided the game
    if (nextState.winner) {
      set({ gameState: nextState, selectedCardInHand: null, selectedEntity: null, isAIThinking: false });
      return;
    }

    // Block player interaction during AI turn
    set({ gameState: nextState, selectedCardInHand: null, selectedEntity: null, isAIThinking: true });

    // Opponent (AI) Turn
    if (nextState.activePlayer === 'OPPONENT') {
      setTimeout(() => {
        const stateAfterAI = executeAITurn(nextState);

        // Sound alert for player turn again
        audioService.playTurnChange();

        // Check for game over after AI turn (e.g., AI kills player commander)
        set({ gameState: stateAfterAI, isAIThinking: false });
      }, 1000); // 1s delay for AI turn simulation
    } else {
      // Shouldn't happen, but safety fallback
      set({ isAIThinking: false });
    }
  }
}));

if (import.meta.env.DEV) {
  const developmentWindow = window as typeof window & {
    __NEXO_GAME_STORE__?: typeof useGameStore;
  };
  developmentWindow.__NEXO_GAME_STORE__ = useGameStore;
}
