import { create } from 'zustand';
import type { GameState, Card, Position, BoardEntity } from '../types/card';
import { initializeGame, playManaCard, summonUnit, moveUnit, combatAttack, playSpell, endTurn } from '../core/engine';
import { getPreconstructedDeck, CARDS_DB } from '../core/cardsDb';
import { executeAITurn, type AIActionStep } from '../core/ai';
import { audioService } from '../core/audio';
import { getObstacleDefinition } from '../core/obstacleConfig';
import { isBoardObstacle } from '../core/boardPathfinding';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createOnlineMatch, getOnlineMatch, joinOnlineMatch, saveOnlineMatchState, subscribeToOnlineMatch, unsubscribeFromOnlineMatch } from '../online/matchService';
import { getOnlinePlayerId, isSupabaseConfigured } from '../online/supabaseClient';
import type { OnlineMatchRecord, OnlineSession } from '../online/types';

export interface GameEvent {
  id: number;
  text: string;
  timestamp: number;
  tone: 'system' | 'move' | 'attack' | 'summon' | 'spell' | 'mana';
}

let gameEventId = 0;
let presentationActionId = 0;
let aiTurnToken = 0;
let onlineChannel: RealtimeChannel | null = null;
let onlineSyncTimer: ReturnType<typeof setInterval> | null = null;

const initialSoundEnabled = typeof window !== 'undefined'
  && window.localStorage.getItem('nexo-sound-enabled') === 'true';
audioService.toggleSound(initialSoundEnabled);

function createGameEvent(text: string, tone: GameEvent['tone']): GameEvent {
  return { id: ++gameEventId, text, tone, timestamp: Date.now() };
}

function appendGameEvent(events: GameEvent[], text: string, tone: GameEvent['tone']): GameEvent[] {
  return [...events.slice(-7), createGameEvent(text, tone)];
}

function getBoardEntityName(entity: BoardEntity | undefined): string {
  if (!entity) return 'su objetivo';
  if (isBoardObstacle(entity)) return getObstacleDefinition(entity.cardId).name;
  return CARDS_DB[entity.cardId]?.name ?? 'Unidad';
}

function createOnlineGameState(playerFaction: 'FURIA' | 'ARCANO', deckTheme?: string): GameState {
  const playerDeck = getPreconstructedDeck(deckTheme || playerFaction);
  const opponentFaction = playerFaction === 'FURIA' ? 'ARCANO' : 'FURIA';
  const opponentDeck = getPreconstructedDeck(opponentFaction);
  const playerCommander = playerFaction === 'FURIA' ? CARDS_DB['comandante-furia'] : CARDS_DB['comandante-arcano'];
  const opponentCommander = opponentFaction === 'FURIA' ? CARDS_DB['comandante-furia'] : CARDS_DB['comandante-arcano'];
  return initializeGame(playerDeck, opponentDeck, playerCommander, opponentCommander, `online-game-${Date.now()}`);
}

function toOnlineSession(match: OnlineMatchRecord, role: 'host' | 'guest'): OnlineSession {
  return {
    matchId: match.id,
    roomCode: match.room_code,
    role,
    localController: role === 'host' ? 'PLAYER' : 'OPPONENT',
    revision: match.revision,
    status: match.status,
  };
}

function applyOnlineMatch(match: OnlineMatchRecord) {
  const session = useGameStore.getState().onlineSession;
  if (!session || session.matchId !== match.id || match.revision < session.revision) return;
  useGameStore.setState({
    gameState: match.game_state,
    onlineSession: { ...session, revision: match.revision, status: match.status },
    selectedCardInHand: null,
    selectedEntity: null,
    hoveredEntity: null,
    isOnlineLoading: false,
    onlineError: null,
  });
}

function stopOnlineSync() {
  if (onlineSyncTimer) window.clearInterval(onlineSyncTimer);
  onlineSyncTimer = null;
}

function startOnlineSync(match: OnlineMatchRecord) {
  stopOnlineSync();
  onlineChannel = subscribeToOnlineMatch(match.id, applyOnlineMatch);
  onlineSyncTimer = window.setInterval(() => {
    void getOnlineMatch(match.room_code)
      .then((updatedMatch) => {
        if (updatedMatch) applyOnlineMatch(updatedMatch);
      })
      .catch(() => undefined);
  }, 1200);
}

async function synchronizeOnlineState(gameState: GameState) {
  const session = useGameStore.getState().onlineSession;
  if (!session) return;
  try {
    applyOnlineMatch(await saveOnlineMatchState(session.matchId, session.revision, gameState));
  } catch (error) {
    useGameStore.setState({
      onlineError: error instanceof Error ? error.message : 'No se pudo sincronizar la partida.',
    });
  }
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
  localController: 'PLAYER' | 'OPPONENT';
  onlineSession: OnlineSession | null;
  onlineError: string | null;
  isOnlineLoading: boolean;
  
  // Game Actions
  startNewGame: (playerFaction: 'FURIA' | 'ARCANO', deckTheme?: string) => void;
  createOnlineGame: (playerFaction: 'FURIA' | 'ARCANO', deckTheme?: string) => Promise<string>;
  joinOnlineGame: (roomCode: string) => Promise<void>;
  leaveOnlineGame: () => Promise<void>;
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
  localController: 'PLAYER',
  onlineSession: null,
  onlineError: null,
  isOnlineLoading: false,

  startNewGame: (playerFaction: 'FURIA' | 'ARCANO', deckTheme?: string) => {
    aiTurnToken++;
    stopOnlineSync();
    void unsubscribeFromOnlineMatch(onlineChannel);
    onlineChannel = null;
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
      localController: 'PLAYER',
      onlineSession: null,
      onlineError: null,
      isOnlineLoading: false,
    });
  },

  createOnlineGame: async (playerFaction, deckTheme) => {
    if (!isSupabaseConfigured) throw new Error('La conexion online no esta configurada.');
    aiTurnToken++;
    set({ isOnlineLoading: true, onlineError: null });
    try {
      const playerId = await getOnlinePlayerId();
      const gameState = createOnlineGameState(playerFaction, deckTheme);
      const match = await createOnlineMatch(playerId, gameState);
      await unsubscribeFromOnlineMatch(onlineChannel);
      set({
        gameState,
        selectedCardInHand: null,
        selectedEntity: null,
        hoveredEntity: null,
        inspectedCard: null,
        gameEvents: [createGameEvent('Sala creada. Comparte el enlace con tu rival.', 'system')],
        activeFaction: playerFaction,
        isAIThinking: false,
        presentationAction: null,
        localController: 'PLAYER',
        onlineSession: toOnlineSession(match, 'host'),
        onlineError: null,
        isOnlineLoading: false,
      });
      startOnlineSync(match);
      return match.room_code;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la sala online.';
      set({ isOnlineLoading: false, onlineError: message });
      throw new Error(message);
    }
  },

  joinOnlineGame: async (roomCode) => {
    if (!isSupabaseConfigured) throw new Error('La conexion online no esta configurada.');
    aiTurnToken++;
    set({ isOnlineLoading: true, onlineError: null });
    try {
      const playerId = await getOnlinePlayerId();
      const foundMatch = await getOnlineMatch(roomCode);
      if (!foundMatch) throw new Error('No existe una sala con ese codigo.');
      const role = foundMatch.host_id === playerId ? 'host' : 'guest';
      const match = role === 'guest' && foundMatch.guest_id !== playerId
        ? await joinOnlineMatch(foundMatch, playerId)
        : foundMatch;

      await unsubscribeFromOnlineMatch(onlineChannel);
      set({
        gameState: match.game_state,
        selectedCardInHand: null,
        selectedEntity: null,
        hoveredEntity: null,
        inspectedCard: null,
        gameEvents: [createGameEvent(role === 'host' ? 'Sala recuperada.' : 'Te has unido a la sala.', 'system')],
        activeFaction: role === 'host' ? 'FURIA' : 'ARCANO',
        isAIThinking: false,
        presentationAction: null,
        localController: role === 'host' ? 'PLAYER' : 'OPPONENT',
        onlineSession: toOnlineSession(match, role),
        onlineError: null,
        isOnlineLoading: false,
      });
      startOnlineSync(match);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo unir a la sala.';
      set({ isOnlineLoading: false, onlineError: message });
      throw new Error(message);
    }
  },

  leaveOnlineGame: async () => {
    stopOnlineSync();
    await unsubscribeFromOnlineMatch(onlineChannel);
    onlineChannel = null;
    set({ onlineSession: null, onlineError: null, isOnlineLoading: false, localController: 'PLAYER' });
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
    const { gameState, isAIThinking, localController, onlineSession } = get();
    if (!gameState || gameState.activePlayer !== localController || isAIThinking) return;

    audioService.playHover();
    const card = CARDS_DB[cardId];
    const nextState = playManaCard(gameState, localController, cardId);
    set((state) => ({
      gameState: nextState,
      selectedCardInHand: null,
      gameEvents: appendGameEvent(state.gameEvents, `Fuente activada: ${card?.name ?? 'Maná'}.`, 'mana'),
    }));
    if (onlineSession) void synchronizeOnlineState(nextState);
  },

  summon: (cardId, pos, battlecryTarget) => {
    const { gameState, isAIThinking, localController, onlineSession } = get();
    if (!gameState || gameState.activePlayer !== localController || isAIThinking) return;

    audioService.playSummonSlam();
    const card = CARDS_DB[cardId];
    const nextState = summonUnit(gameState, localController, cardId, pos, battlecryTarget);
    set((state) => ({
      gameState: nextState,
      selectedCardInHand: null,
      gameEvents: appendGameEvent(state.gameEvents, `${card?.name ?? 'Unidad'} entra en el santuario.`, 'summon'),
    }));
    if (onlineSession) void synchronizeOnlineState(nextState);
  },

  move: (from, to) => {
    const { gameState, isAIThinking, localController, onlineSession } = get();
    if (!gameState || gameState.activePlayer !== localController || isAIThinking) return;

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
    if (onlineSession) void synchronizeOnlineState(nextState);
  },

  attack: (attackerPos, targetPos) => {
    const { gameState, isAIThinking, localController, onlineSession } = get();
    if (!gameState || gameState.activePlayer !== localController || isAIThinking) return;

    audioService.playClash();
    const attacker = gameState.board[`${attackerPos.x},${attackerPos.y}`];
    const target = gameState.board[`${targetPos.x},${targetPos.y}`];
    const nextState = combatAttack(gameState, attackerPos, targetPos);
    const targetKey = `${targetPos.x},${targetPos.y}`;
    const terrainDestroyed = Boolean(target && isBoardObstacle(target) && !nextState.board[targetKey]);
    const attackLog = terrainDestroyed
      ? `${getBoardEntityName(attacker)} derriba ${getBoardEntityName(target)}.`
      : `${getBoardEntityName(attacker)} ataca a ${getBoardEntityName(target)}.`;
    set((state) => ({
      gameState: nextState,
      selectedEntity: null,
      gameEvents: appendGameEvent(
        state.gameEvents,
        attackLog,
        'attack',
      ),
    }));
    if (onlineSession) void synchronizeOnlineState(nextState);
  },

  castSpell: (cardId, targetPos) => {
    const { gameState, isAIThinking, localController, onlineSession } = get();
    if (!gameState || gameState.activePlayer !== localController || isAIThinking) return;

    // Check if the spell is ice/freeze themed
    if (cardId.includes('congelacion') || cardId.includes('prision') || cardId.includes('tormenta') || cardId.includes('escarcha')) {
      audioService.playFreeze();
    } else {
      audioService.playClash();
    }
    const card = CARDS_DB[cardId];
    const targetKey = `${targetPos.x},${targetPos.y}`;
    const target = gameState.board[targetKey];
    const nextState = playSpell(gameState, localController, cardId, targetPos);
    const terrainDestroyed = Boolean(target && isBoardObstacle(target) && !nextState.board[targetKey]);
    const spellLog = terrainDestroyed
      ? `${card?.name ?? 'Hechizo'} derriba ${getBoardEntityName(target)}.`
      : target && isBoardObstacle(target)
        ? `${card?.name ?? 'Hechizo'} impacta ${getBoardEntityName(target)}.`
        : `${card?.name ?? 'Hechizo'} libera su efecto.`;
    set((state) => ({
      gameState: nextState,
      selectedCardInHand: null,
      gameEvents: appendGameEvent(state.gameEvents, spellLog, 'spell'),
    }));
    if (onlineSession) void synchronizeOnlineState(nextState);
  },

  endActiveTurn: () => {
    const { gameState, isAIThinking, localController, onlineSession } = get();
    if (!gameState || gameState.activePlayer !== localController || isAIThinking) return;

    // Play chime sound
    audioService.playTurnChange();
    
    // End player's turn
    const nextState = endTurn(gameState);

    if (onlineSession) {
      set((state) => ({
        gameState: nextState,
        selectedCardInHand: null,
        selectedEntity: null,
        gameEvents: appendGameEvent(state.gameEvents, 'Turno entregado a tu rival.', 'system'),
      }));
      void synchronizeOnlineState(nextState);
      return;
    }

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
