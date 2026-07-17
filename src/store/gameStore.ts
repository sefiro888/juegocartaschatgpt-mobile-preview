import { create } from 'zustand';
import type { GameState, Card, Position, BoardEntity } from '../types/card';
import { initializeGame, playManaCard, summonUnit, moveUnit, combatAttack, playSpell, endTurn } from '../core/engine';
import { getPreconstructedDeck, CARDS_DB } from '../core/cardsDb';
import { executeAITurn, type AIActionStep } from '../core/ai';
import { audioService } from '../core/audio';

export interface GameEvent {
  id: number;
  text: string;
  timestamp: number;
  tone: 'system' | 'move' | 'attack' | 'summon' | 'spell' | 'mana';
}

let gameEventId = 0;
let presentationActionId = 0;
let aiTurnToken = 0;

const initialSoundEnabled = typeof window !== 'undefined'
  && window.localStorage.getItem('nexo-sound-enabled') === 'true';
audioService.toggleSound(initialSoundEnabled);

function createGameEvent(text: string, tone: GameEvent['tone']): GameEvent {
  return { id: ++gameEventId, text, tone, timestamp: Date.now() };
}

function appendGameEvent(events: GameEvent[], text: string, tone: GameEvent['tone']): GameEvent[] {
  return [...events.slice(-7), createGameEvent(text, tone)];
}

export interface PresentationAction extends Omit<AIActionStep, 'state'> {
  id: number;
}

function describeAIAction(step: AIActionStep): { text: string; tone: GameEvent['tone'] } {
  const cardName = step.cardId ? CARDS_DB[step.cardId]?.name : undefined;
  const destination = step.to
    ? `${String.fromCharCode(65 + step.to.x)}${step.to.y + 1}`
    : undefined;

  switch (step.kind) {
    case 'mana':
      return { text: `El rival activa ${cardName ?? 'una fuente de maná'}.`, tone: 'mana' };
    case 'summon':
      return { text: `${cardName ?? 'Una unidad rival'} entra en ${destination ?? 'el santuario'}.`, tone: 'summon' };
    case 'spell':
      return { text: `${cardName ?? 'Un hechizo rival'} altera el campo de batalla.`, tone: 'spell' };
    case 'attack':
      return { text: `${cardName ?? 'Una unidad rival'} lanza un ataque.`, tone: 'attack' };
    case 'move':
      return { text: `${cardName ?? 'Una unidad rival'} avanza a ${destination ?? 'otra posición'}.`, tone: 'move' };
  }
}

function playAIActionSound(step: AIActionStep) {
  if (step.kind === 'summon') audioService.playSummonSlam();
  else if (step.kind === 'attack') audioService.playClash();
  else if (step.kind === 'spell') {
    const cardId = step.cardId ?? '';
    if (cardId.includes('congelacion') || cardId.includes('prision') || cardId.includes('tormenta') || cardId.includes('escarcha')) {
      audioService.playFreeze();
    } else {
      audioService.playClash();
    }
  } else {
    audioService.playHover();
  }
}

interface GameStore {
  gameState: GameState | null;
  selectedCardInHand: Card | null;
  selectedEntity: BoardEntity | null;
  hoveredEntity: BoardEntity | null;
  inspectedCard: Card | null;
  gameEvents: GameEvent[];
  activeFaction: 'FURIA' | 'ARCANO' | null;
  isAIThinking: boolean;
  soundEnabled: boolean;
  presentationAction: PresentationAction | null;
  
  // Game Actions
  startNewGame: (playerFaction: 'FURIA' | 'ARCANO', deckTheme?: string) => void;
  selectCardInHand: (card: Card | null) => void;
  selectEntity: (entity: BoardEntity | null) => void;
  setHoveredEntity: (entity: BoardEntity | null) => void;
  setInspectedCard: (card: Card | null) => void;
  toggleSound: () => void;
  
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
  gameEvents: [],
  activeFaction: null,
  isAIThinking: false,
  soundEnabled: initialSoundEnabled,
  presentationAction: null,

  startNewGame: (playerFaction: 'FURIA' | 'ARCANO', deckTheme?: string) => {
    aiTurnToken++;
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
      gameEvents: [createGameEvent('La batalla comienza. Controla el santuario.', 'system')],
      activeFaction: playerFaction,
      isAIThinking: false,
      presentationAction: null,
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
  toggleSound: () => {
    const enabled = !get().soundEnabled;
    window.localStorage.setItem('nexo-sound-enabled', String(enabled));
    audioService.toggleSound(enabled);
    if (enabled) audioService.playTurnChange();
    set({ soundEnabled: enabled });
  },

  playMana: (cardId) => {
    const { gameState, isAIThinking } = get();
    if (!gameState || gameState.activePlayer !== 'PLAYER' || isAIThinking) return;

    audioService.playHover();
    const card = CARDS_DB[cardId];
    const nextState = playManaCard(gameState, 'PLAYER', cardId);
    set((state) => ({
      gameState: nextState,
      selectedCardInHand: null,
      gameEvents: appendGameEvent(state.gameEvents, `Fuente activada: ${card?.name ?? 'Maná'}.`, 'mana'),
    }));
  },

  summon: (cardId, pos, battlecryTarget) => {
    const { gameState, isAIThinking } = get();
    if (!gameState || gameState.activePlayer !== 'PLAYER' || isAIThinking) return;

    audioService.playSummonSlam();
    const card = CARDS_DB[cardId];
    const nextState = summonUnit(gameState, 'PLAYER', cardId, pos, battlecryTarget);
    set((state) => ({
      gameState: nextState,
      selectedCardInHand: null,
      gameEvents: appendGameEvent(state.gameEvents, `${card?.name ?? 'Unidad'} entra en el santuario.`, 'summon'),
    }));
  },

  move: (from, to) => {
    const { gameState, isAIThinking } = get();
    if (!gameState || gameState.activePlayer !== 'PLAYER' || isAIThinking) return;

    audioService.playHover();
    const movedEntity = gameState.board[`${from.x},${from.y}`];
    const nextState = moveUnit(gameState, from, to);
    set((state) => ({
      gameState: nextState,
      selectedEntity: null,
      gameEvents: appendGameEvent(
        state.gameEvents,
        `${movedEntity ? CARDS_DB[movedEntity.cardId]?.name : 'Unidad'} se mueve a ${String.fromCharCode(65 + to.x)}${to.y + 1}.`,
        'move',
      ),
    }));
  },

  attack: (attackerPos, targetPos) => {
    const { gameState, isAIThinking } = get();
    if (!gameState || gameState.activePlayer !== 'PLAYER' || isAIThinking) return;

    audioService.playClash();
    const attacker = gameState.board[`${attackerPos.x},${attackerPos.y}`];
    const target = gameState.board[`${targetPos.x},${targetPos.y}`];
    const nextState = combatAttack(gameState, attackerPos, targetPos);
    set((state) => ({
      gameState: nextState,
      selectedEntity: null,
      gameEvents: appendGameEvent(
        state.gameEvents,
        `${attacker ? CARDS_DB[attacker.cardId]?.name : 'Unidad'} ataca a ${target ? CARDS_DB[target.cardId]?.name : 'su objetivo'}.`,
        'attack',
      ),
    }));
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
    const card = CARDS_DB[cardId];
    const nextState = playSpell(gameState, 'PLAYER', cardId, targetPos);
    set((state) => ({
      gameState: nextState,
      selectedCardInHand: null,
      gameEvents: appendGameEvent(state.gameEvents, `${card?.name ?? 'Hechizo'} libera su efecto.`, 'spell'),
    }));
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
    set((state) => ({
      gameState: nextState,
      selectedCardInHand: null,
      selectedEntity: null,
      isAIThinking: true,
      gameEvents: appendGameEvent(state.gameEvents, 'Turno entregado al rival.', 'system'),
    }));

    // Opponent (AI) Turn
    if (nextState.activePlayer === 'OPPONENT') {
      const turnToken = ++aiTurnToken;
      setTimeout(() => {
        if (turnToken !== aiTurnToken) return;

        const steps: AIActionStep[] = [];
        const stateAfterAI = executeAITurn(nextState, (step) => steps.push(step));

        const playStep = (index: number) => {
          if (turnToken !== aiTurnToken) return;
          const step = steps[index];

          if (!step) {
            audioService.playTurnChange();
            set((state) => ({
              gameState: stateAfterAI,
              isAIThinking: false,
              presentationAction: null,
              gameEvents: appendGameEvent(state.gameEvents, 'El rival completa su turno.', 'system'),
            }));
            return;
          }

          const event = describeAIAction(step);
          playAIActionSound(step);
          set((state) => ({
            gameState: step.state,
            presentationAction: {
              id: ++presentationActionId,
              kind: step.kind,
              cardId: step.cardId,
              actorId: step.actorId,
              targetId: step.targetId,
              from: step.from,
              to: step.to,
            },
            gameEvents: appendGameEvent(state.gameEvents, event.text, event.tone),
          }));

          setTimeout(() => playStep(index + 1), step.kind === 'attack' || step.kind === 'spell' ? 820 : 620);
        };

        playStep(0);
      }, 700);
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
