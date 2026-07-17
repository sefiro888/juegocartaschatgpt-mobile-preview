import type { Card, GameState, Position, BoardEntity, PlayerState } from '../types/card';
import { CARDS_DB } from './cardsDb';
import { COMMANDER_COLUMN, OPPONENT_BACK_ROW, PLAYER_BACK_ROW, isInsideBoard } from './boardConfig';
import { findMovementPath, hasLineOfSight, isBoardObstacle } from './boardPathfinding';

// Seedable PRNG (SplitMix32)
export function createRandom(seedStr: string) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = (Math.imul(31, h) + seedStr.charCodeAt(i)) | 0;
  }
  return function() {
    h = (h + 0x9e3779b9) | 0;
    let z = h;
    z ^= z >>> 16;
    z = Math.imul(z, 0x21f0aa7b);
    z ^= z >>> 15;
    z = Math.imul(z, 0x735a2d97);
    z ^= z >>> 16;
    return (z >>> 0) / 4294967296;
  };
}

// Helper to shuffle deck with a PRNG
export function shuffleDeck(deck: Card[], random: () => number): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper to check Manhattan distance
export function getDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

// Helper to check if positions are adjacent (includes diagonal if specified)
export function isAdjacent(pos1: Position, pos2: Position, allowDiagonal = false): boolean {
  const dx = Math.abs(pos1.x - pos2.x);
  const dy = Math.abs(pos1.y - pos2.y);
  if (allowDiagonal) {
    return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
  }
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

function isInCardAttackGeometry(
  board: Record<string, BoardEntity>,
  attackerPosition: Position,
  targetPosition: Position,
  card: Card,
): boolean {
  const range = card.range ?? 1;
  if (range <= 1) {
    return isAdjacent(
      attackerPosition,
      targetPosition,
      card.rulesText.includes('Movimiento Diagonal'),
    );
  }
  return getDistance(attackerPosition, targetPosition) <= range &&
    hasLineOfSight(board, attackerPosition, targetPosition);
}

export function canAttackTarget(
  state: GameState,
  attackerPosition: Position,
  targetPosition: Position,
): boolean {
  const attacker = state.board[`${attackerPosition.x},${attackerPosition.y}`];
  const target = state.board[`${targetPosition.x},${targetPosition.y}`];
  if (!attacker || !target) return false;
  if (attacker.controller !== state.activePlayer) return false;
  if (attacker.hasAttackedThisTurn || attacker.frozenTurns > 0) return false;

  const card = CARDS_DB[attacker.cardId];
  if (!card || card.type === 'ESTRUCTURA') return false;
  // Terrain is neutral: either player can clear it, but it never retaliates.
  if (isBoardObstacle(target)) {
    return isInCardAttackGeometry(state.board, attackerPosition, targetPosition, card);
  }
  if (attacker.controller === target.controller) return false;
  return isInCardAttackGeometry(state.board, attackerPosition, targetPosition, card);
}

export function canSpellTargetObstacle(cardId: string): boolean {
  return cardId === 'lluvia-ceniza' || cardId === 'chispa-fugaz' || cardId === 'cometa-arcano';
}

export interface CombatPreview {
  damageToTarget: number;
  damageToAttacker: number;
  targetCanRetaliate: boolean;
  targetWillFall: boolean;
  attackerWillFall: boolean;
  notes: string[];
}

export function getCombatPreview(
  state: GameState,
  attackerPosition: Position,
  targetPosition: Position,
): CombatPreview | null {
  const attacker = state.board[`${attackerPosition.x},${attackerPosition.y}`];
  const target = state.board[`${targetPosition.x},${targetPosition.y}`];
  if (!attacker || !target || !canAttackTarget(state, attackerPosition, targetPosition)) return null;

  const attackerCard = CARDS_DB[attacker.cardId];
  const targetCard = CARDS_DB[target.cardId];
  if (!attackerCard || (!targetCard && !isBoardObstacle(target))) return null;

  const notes: string[] = [];
  let damageToTarget = attacker.attack;
  if (targetCard?.rulesText.includes('Resistencia')) {
    damageToTarget = Math.max(0, damageToTarget - 1);
    notes.push('El objetivo reduce 1 de daño.');
  }
  if ((target.id === 'commander-player' || target.id === 'commander-opponent') && hasTemploRunico(state.board, target.controller)) {
    damageToTarget = Math.max(0, damageToTarget - 1);
    notes.push('El templo rúnico protege al comandante.');
  }

  const targetCanRetaliate = !isBoardObstacle(target) && targetCard?.type !== 'ESTRUCTURA' &&
    isInCardAttackGeometry(state.board, target.position, attacker.position, targetCard);
  let damageToAttacker = targetCanRetaliate ? target.attack : 0;
  if (attackerCard.rulesText.includes('Resistencia')) {
    damageToAttacker = Math.max(0, damageToAttacker - 1);
    notes.push('Tu unidad reduce 1 de daño.');
  }
  if ((attacker.id === 'commander-player' || attacker.id === 'commander-opponent') && hasTemploRunico(state.board, attacker.controller)) {
    damageToAttacker = Math.max(0, damageToAttacker - 1);
    notes.push('El templo rúnico protege a tu comandante.');
  }
  if (!targetCanRetaliate) notes.push('El objetivo no puede contraatacar.');
  if (attackerCard.id === 'berserker-ignivoro') {
    damageToAttacker += 1;
    notes.push('Furia: tu berserker se hiere por atacar.');
  }

  return {
    damageToTarget,
    damageToAttacker,
    targetCanRetaliate,
    targetWillFall: target.health - damageToTarget <= 0,
    attackerWillFall: attacker.health - damageToAttacker <= 0,
    notes,
  };
}

// Deep-clone a PlayerState to avoid shared-reference mutation
function clonePlayer(p: PlayerState): PlayerState {
  return {
    ...p,
    hand: [...p.hand],
    deck: [...p.deck],
    graveyard: [...p.graveyard],
    manaSources: {
      furia: { ...p.manaSources.furia },
      arcano: { ...p.manaSources.arcano },
    },
  };
}

// Deep-clone the board, producing fresh BoardEntity objects
function cloneBoard(board: Record<string, BoardEntity>): Record<string, BoardEntity> {
  const result: Record<string, BoardEntity> = {};
  for (const key of Object.keys(board)) {
    result[key] = { ...board[key], position: { ...board[key].position } };
  }
  return result;
}

// Resolve a single entity death: removes from board, adds to graveyard, returns winner if commander dies.
// Also triggers Fénix Renacido last breath and Elemental de Lava death trigger.
function resolveEntityDeath(
  board: Record<string, BoardEntity>,
  key: string,
  entity: BoardEntity,
  player: PlayerState,
  opponent: PlayerState,
): 'PLAYER' | 'OPPONENT' | null {
  delete board[key];
  const ownerState = entity.controller === 'PLAYER' ? player : opponent;
  const refCard = CARDS_DB[entity.cardId];
  if (refCard) ownerState.graveyard.push(refCard);

  // Commander death -> game over
  if (entity.id === 'commander-player') return 'OPPONENT';
  if (entity.id === 'commander-opponent') return 'PLAYER';

  // Fénix Renacido last breath: return card to owner's hand
  if (entity.cardId === 'fenix-renacido' && refCard && ownerState.hand.length < 10) {
    ownerState.hand.push(refCard);
  }

  return null;
}

// Apply AoE death damage (Elemental de Lava) after an entity dies.
// Returns winner if a commander dies from the chain.
function resolveDeathTrigger(
  board: Record<string, BoardEntity>,
  deadCardId: string,
  deathPos: Position,
  player: PlayerState,
  opponent: PlayerState,
): 'PLAYER' | 'OPPONENT' | null {
  if (deadCardId !== 'elemental-lava') return null;

  // Elemental de Lava: deal 2 damage to all adjacent units
  for (const key of Object.keys(board)) {
    const ent = board[key];
    if (!isBoardObstacle(ent) && isAdjacent(ent.position, deathPos, false)) {
      ent.health -= 2;
      if (ent.health <= 0) {
        const w = resolveEntityDeath(board, key, ent, player, opponent);
        if (w) return w;
      }
    }
  }
  return null;
}

// Check if a controller has a Templo Rúnico on the board
function hasTemploRunico(board: Record<string, BoardEntity>, controller: 'PLAYER' | 'OPPONENT'): boolean {
  for (const entity of Object.values(board)) {
    if (entity.cardId === 'templo-runico' && entity.controller === controller) {
      return true;
    }
  }
  return false;
}

// Initial Game Setup
export function initializeGame(
  deck1: Card[],
  deck2: Card[],
  commander1: Card,
  commander2: Card,
  seed: string
): GameState {
  const random = createRandom(seed);
  const shuffledDeck1 = shuffleDeck(deck1, random);
  const shuffledDeck2 = shuffleDeck(deck2, random);

  // Draw 5 starting cards
  const hand1 = shuffledDeck1.splice(0, 5);
  const hand2 = shuffledDeck2.splice(0, 5);

  const playerState1: PlayerState = {
    id: 'PLAYER',
    nexusHealth: 25,
    hand: hand1,
    deck: shuffledDeck1,
    graveyard: [],
    manaSources: {
      furia: { total: 0, spent: 0 },
      arcano: { total: 0, spent: 0 }
    },
    manaPlayedThisTurn: false,
    commander: commander1,
    commanderInPlay: true,
  };

  const playerState2: PlayerState = {
    id: 'OPPONENT',
    nexusHealth: 25,
    hand: hand2,
    deck: shuffledDeck2,
    graveyard: [],
    manaSources: {
      furia: { total: 0, spent: 0 },
      arcano: { total: 0, spent: 0 }
    },
    manaPlayedThisTurn: false,
    commander: commander2,
    commanderInPlay: true,
  };

  const playerCommanderPos: Position = { x: COMMANDER_COLUMN, y: PLAYER_BACK_ROW };
  const opponentCommanderPos: Position = { x: COMMANDER_COLUMN, y: OPPONENT_BACK_ROW };

  // Position commanders on the center column of each back row.
  const board: Record<string, BoardEntity> = {};
  
  board[`${playerCommanderPos.x},${playerCommanderPos.y}`] = {
    id: "commander-player",
    cardId: commander1.id,
    controller: 'PLAYER',
    position: playerCommanderPos,
    health: 25,
    maxHealth: 25,
    attack: commander1.attack || 2,
    hasMovedThisTurn: false,
    hasAttackedThisTurn: false,
    frozenTurns: 0,
  };

  board[`${opponentCommanderPos.x},${opponentCommanderPos.y}`] = {
    id: "commander-opponent",
    cardId: commander2.id,
    controller: 'OPPONENT',
    position: opponentCommanderPos,
    health: 25,
    maxHealth: 25,
    attack: commander2.attack || 2,
    hasMovedThisTurn: false,
    hasAttackedThisTurn: false,
    frozenTurns: 0,
  };

  // Alternating terrain obstacles create several viable lanes through the middle.
  const obstacles: Array<{ id: string; cardId: string; position: Position }> = [
    { id: 'obstacle-ridge-west', cardId: 'obstaculo-risco', position: { x: 2, y: 4 } },
    { id: 'obstacle-crystal-center', cardId: 'obstaculo-pilar', position: { x: 5, y: 4 } },
    { id: 'obstacle-current-west', cardId: 'obstaculo-corriente', position: { x: 3, y: 5 } },
    { id: 'obstacle-ridge-east', cardId: 'obstaculo-risco', position: { x: 7, y: 5 } },
    { id: 'obstacle-current-east', cardId: 'obstaculo-corriente', position: { x: 8, y: 4 } },
  ];

  for (const obstacle of obstacles) {
    board[`${obstacle.position.x},${obstacle.position.y}`] = {
      ...obstacle,
      controller: 'OPPONENT',
      health: CARDS_DB[obstacle.cardId]?.maxHealth ?? 4,
      maxHealth: CARDS_DB[obstacle.cardId]?.maxHealth ?? 4,
      attack: 0,
      hasMovedThisTurn: true,
      hasAttackedThisTurn: true,
      frozenTurns: 0,
    };
  }

  return {
    board,
    player: playerState1,
    opponent: playerState2,
    turn: 1,
    activePlayer: 'PLAYER',
    phase: 'MAIN',
    winner: null,
    seed,
  };
}

// Can player afford card?
export function canAfford(player: PlayerState, card: Card): boolean {
  if (card.type === 'MANA') return true;

  const cost = card.cost;
  const genCost = cost.generic;
  const furiaCost = cost.furia || 0;
  const arcanoCost = cost.arcano || 0;

  const fAvail = player.manaSources.furia.total - player.manaSources.furia.spent;
  const aAvail = player.manaSources.arcano.total - player.manaSources.arcano.spent;

  if (fAvail < furiaCost || aAvail < arcanoCost) return false;

  const remainingFuria = fAvail - furiaCost;
  const remainingArcano = aAvail - arcanoCost;
  const totalRemaining = remainingFuria + remainingArcano;

  return totalRemaining >= genCost;
}

// Deduct mana cost
export function deductMana(player: PlayerState, card: Card): PlayerState {
  const cost = card.cost;
  let genCost = cost.generic;
  const furiaCost = cost.furia || 0;
  const arcanoCost = cost.arcano || 0;

  const manaSources = {
    furia: { ...player.manaSources.furia },
    arcano: { ...player.manaSources.arcano }
  };

  manaSources.furia.spent += furiaCost;
  manaSources.arcano.spent += arcanoCost;

  // Deduct generic mana from remaining sources
  const fAvail = manaSources.furia.total - manaSources.furia.spent;

  if (fAvail >= genCost) {
    manaSources.furia.spent += genCost;
  } else {
    manaSources.furia.spent += fAvail;
    genCost -= fAvail;
    manaSources.arcano.spent += genCost;
  }

  return { ...player, manaSources };
}

// Play Mana Card (BUG FIX: deep-clone manaSources before mutating)
export function playManaCard(state: GameState, playerId: 'PLAYER' | 'OPPONENT', cardId: string): GameState {
  const player = playerId === 'PLAYER' ? state.player : state.opponent;
  if (player.manaPlayedThisTurn) return state;

  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand[cardIndex];
  if (card.type !== 'MANA') return state;

  const newHand = [...player.hand];
  newHand.splice(cardIndex, 1);

  // Deep-clone player including manaSources to avoid shared-reference mutation
  const updatedPlayer = clonePlayer(player);
  updatedPlayer.hand = newHand;
  updatedPlayer.manaPlayedThisTurn = true;

  if (card.faction === 'FURIA') {
    updatedPlayer.manaSources.furia.total += 1;
  } else if (card.faction === 'ARCANO') {
    updatedPlayer.manaSources.arcano.total += 1;
  }

  return {
    ...state,
    player: playerId === 'PLAYER' ? updatedPlayer : state.player,
    opponent: playerId === 'OPPONENT' ? updatedPlayer : state.opponent
  };
}

// Draw a card
export function drawCard(player: PlayerState): PlayerState {
  if (player.deck.length === 0) return player;
  const deck = [...player.deck];
  const card = deck.shift()!;
  return {
    ...player,
    deck,
    hand: [...player.hand, card]
  };
}

// Summon unit/structure
export function summonUnit(
  state: GameState,
  playerId: 'PLAYER' | 'OPPONENT',
  cardId: string,
  pos: Position,
  battlecryTargetPos?: Position
): GameState {
  const player = playerId === 'PLAYER' ? state.player : state.opponent;
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand[cardIndex];
  if (card.type !== 'UNIDAD' && card.type !== 'ESTRUCTURA') return state;

  if (!canAfford(player, card)) return state;

  // Check if position is empty and on board
  if (!isInsideBoard(pos.x, pos.y)) return state;
  const posKey = `${pos.x},${pos.y}`;
  if (state.board[posKey]) return state;

  // Must be in the back row, OR adjacent to an allied entity
  const isBackRow = playerId === 'PLAYER' ? pos.y === PLAYER_BACK_ROW : pos.y === OPPONENT_BACK_ROW;
  let hasAdjacentAlly = false;
  for (const entity of Object.values(state.board)) {
    if (entity.controller === playerId && isAdjacent(entity.position, pos, false)) {
      hasAdjacentAlly = true;
      break;
    }
  }

  if (!isBackRow && !hasAdjacentAlly) return state;

  // Summon is valid!
  let nextPlayerState = deductMana(player, card);
  nextPlayerState = {
    ...nextPlayerState,
    hand: nextPlayerState.hand.filter((_, idx) => idx !== cardIndex),
  };

  const instanceId = `${card.id}_${Date.now()}`;
  const newEntity: BoardEntity = {
    id: instanceId,
    cardId: card.id,
    controller: playerId,
    position: pos,
    health: card.maxHealth || 1,
    maxHealth: card.maxHealth || 1,
    attack: card.attack || 0,
    hasMovedThisTurn: true, // Summon sickness by default
    hasAttackedThisTurn: true, // Summon sickness by default
    frozenTurns: 0,
  };

  // Special Summon Keywords: "Carga" (Sabueso de Brasa, Draco de Magma, Trasgo Piroclástico can move and attack immediately)
  if (card.rulesText.includes('Carga')) {
    newEntity.hasMovedThisTurn = false;
    newEntity.hasAttackedThisTurn = false;
  }

  let nextBoard = cloneBoard(state.board);
  nextBoard[posKey] = newEntity;

  let pState1 = playerId === 'PLAYER' ? nextPlayerState : clonePlayer(state.player);
  let pState2 = playerId === 'OPPONENT' ? nextPlayerState : clonePlayer(state.opponent);
  let winner = state.winner;

  // --- Grito de Batalla triggers ---

  // Dragón de la Caldera: Deal 2 damage to all adjacent enemy units
  if (card.id === 'dragon-caldera') {
    for (const key of Object.keys(nextBoard)) {
      const ent = nextBoard[key];
      if (!isBoardObstacle(ent) && ent.controller !== playerId && isAdjacent(ent.position, pos, false)) {
        ent.health -= 2;
        if (ent.health <= 0) {
          const w = resolveEntityDeath(nextBoard, key, ent, pState1, pState2);
          if (w) winner = w;
          const wt = resolveDeathTrigger(nextBoard, ent.cardId, ent.position, pState1, pState2);
          if (wt) winner = wt;
        }
      }
    }
  }

  // Tejedora de Escarcha: Freeze 1 enemy unit
  if (card.id === 'tejedora-escarcha' && battlecryTargetPos) {
    const targetKey = `${battlecryTargetPos.x},${battlecryTargetPos.y}`;
    const targetEnt = nextBoard[targetKey];
    if (targetEnt && !isBoardObstacle(targetEnt) && targetEnt.controller !== playerId) {
      targetEnt.frozenTurns = 1;
    }
  }

  // Guerrero de Ceniza: Deal 1 damage to a random adjacent enemy
  if (card.id === 'guerrero-ceniza') {
    const adjacentEnemies: { key: string; ent: BoardEntity }[] = [];
    for (const key of Object.keys(nextBoard)) {
      const ent = nextBoard[key];
      if (!isBoardObstacle(ent) && ent.controller !== playerId && isAdjacent(ent.position, pos, false)) {
        adjacentEnemies.push({ key, ent });
      }
    }
    if (adjacentEnemies.length > 0) {
      const random = createRandom(state.seed + Date.now());
      const idx = Math.floor(random() * adjacentEnemies.length);
      const target = adjacentEnemies[idx];
      target.ent.health -= 1;
      if (target.ent.health <= 0) {
        const w = resolveEntityDeath(nextBoard, target.key, target.ent, pState1, pState2);
        if (w) winner = w;
        const wt = resolveDeathTrigger(nextBoard, target.ent.cardId, target.ent.position, pState1, pState2);
        if (wt) winner = wt;
      }
    }
  }

  // Trasgo Piroclástico: Discard a random card from own hand
  if (card.id === 'trasgo-piroclastico') {
    const ownerState = playerId === 'PLAYER' ? pState1 : pState2;
    if (ownerState.hand.length > 0) {
      const random = createRandom(state.seed + Date.now());
      const discardIdx = Math.floor(random() * ownerState.hand.length);
      const discarded = ownerState.hand[discardIdx];
      ownerState.hand = ownerState.hand.filter((_, idx) => idx !== discardIdx);
      ownerState.graveyard = [...ownerState.graveyard, discarded];
    }
  }

  // Elemental de Tormenta: Freeze 2 random enemy units
  if (card.id === 'elemental-tormenta') {
    const enemyUnits = Object.values(nextBoard).filter(
      ent => !isBoardObstacle(ent) && ent.controller !== playerId && ent.id !== 'commander-player' && ent.id !== 'commander-opponent'
    );
    if (enemyUnits.length > 0) {
      const random = createRandom(state.seed + Date.now());
      const shuffled = [...enemyUnits].sort(() => random() - 0.5);
      const toFreeze = shuffled.slice(0, 2);
      for (const ent of toFreeze) {
        ent.frozenTurns = Math.max(ent.frozenTurns, 1);
      }
    }
  }

  // Tejedora del Tiempo: Refresh movement/attack on a target friendly unit
  if (card.id === 'tejedora-tiempo' && battlecryTargetPos) {
    const targetKey = `${battlecryTargetPos.x},${battlecryTargetPos.y}`;
    const targetEnt = nextBoard[targetKey];
    if (targetEnt && targetEnt.controller === playerId) {
      targetEnt.hasMovedThisTurn = false;
      targetEnt.hasAttackedThisTurn = false;
    }
  }

  // Support Crimson Forge effect (+1/+0 to units summoned adjacent to it)
  if (card.type === 'UNIDAD') {
    let adjacentForge = false;
    for (const entity of Object.values(nextBoard)) {
      if (entity.cardId === 'forja-carmesi' && entity.controller === playerId && isAdjacent(entity.position, pos, false)) {
        adjacentForge = true;
        break;
      }
    }
    if (adjacentForge) {
      newEntity.attack += 1;
    }
  }

  return {
    ...state,
    board: nextBoard,
    player: pState1,
    opponent: pState2,
    winner,
  };
}

// Move Unit
export function moveUnit(state: GameState, from: Position, to: Position): GameState {
  const fromKey = `${from.x},${from.y}`;
  const toKey = `${to.x},${to.y}`;

  if (!isInsideBoard(from.x, from.y) || !isInsideBoard(to.x, to.y)) return state;

  const entity = state.board[fromKey];
  if (!entity || entity.controller !== state.activePlayer) return state;
  if (entity.hasMovedThisTurn || entity.frozenTurns > 0) return state;

  const card = CARDS_DB[entity.cardId];
  if (!card || card.type === 'ESTRUCTURA') return state;

  const movementAllowance = card.movement ?? 1;
  const path = findMovementPath(state.board, from, to, movementAllowance, {
    allowDiagonal: true,
    canFly: card.rulesText.includes('Vuelo'),
  });
  if (!path) return state;

  const updatedEntity = {
    ...entity,
    position: to,
    hasMovedThisTurn: true
  };

  const newBoard = { ...state.board };
  delete newBoard[fromKey];
  newBoard[toKey] = updatedEntity;

  return {
    ...state,
    board: newBoard
  };
}

// Attack / Combat Action
export function combatAttack(state: GameState, attackerPos: Position, targetPos: Position): GameState {
  const attKey = `${attackerPos.x},${attackerPos.y}`;
  const tarKey = `${targetPos.x},${targetPos.y}`;

  const origAttacker = state.board[attKey];
  const origTarget = state.board[tarKey];

  if (!origAttacker || !origTarget || !canAttackTarget(state, attackerPos, targetPos)) return state;

  const attCard = CARDS_DB[origAttacker.cardId];
  if (!attCard) return state;

  // Deep-clone board and entities for immutable update
  const newBoard = cloneBoard(state.board);
  const attacker = newBoard[attKey];
  const target = newBoard[tarKey];
  let player1 = clonePlayer(state.player);
  let player2 = clonePlayer(state.opponent);
  let winner = state.winner;

  // Execute combat
  attacker.hasAttackedThisTurn = true;
  attacker.hasMovedThisTurn = true; // Attacking locks movement

  // Resolve damage
  // Centinela de Cristal has Resistencia (ignores 1st damage)
  // Let's implement this: "ignores the first damage received each turn". To keep it simple, we can reduce incoming damage by 1.
  let damageToTarget = attacker.attack;
  const tarCard = CARDS_DB[target.cardId];
  if (tarCard && tarCard.rulesText.includes('Resistencia')) {
    damageToTarget = Math.max(0, damageToTarget - 1);
  }

  const targetCanRetaliate = Boolean(
    tarCard &&
    tarCard.type !== 'ESTRUCTURA' &&
    isInCardAttackGeometry(newBoard, target.position, attacker.position, tarCard),
  );
  let damageToAttacker = targetCanRetaliate ? target.attack : 0;
  if (attCard && attCard.rulesText.includes('Resistencia')) {
    damageToAttacker = Math.max(0, damageToAttacker - 1);
  }

  // Templo Rúnico: commander gets Resistencia
  if ((target.id === 'commander-player' || target.id === 'commander-opponent') &&
      hasTemploRunico(newBoard, target.controller)) {
    damageToTarget = Math.max(0, damageToTarget - 1);
  }
  if ((attacker.id === 'commander-player' || attacker.id === 'commander-opponent') &&
      hasTemploRunico(newBoard, attacker.controller)) {
    damageToAttacker = Math.max(0, damageToAttacker - 1);
  }

  // Apply damage. Neutral terrain is removed instead of entering a player's graveyard.
  target.health -= damageToTarget;
  if (tarCard && tarCard.type !== 'ESTRUCTURA') {
    // Structures don't strike back
    attacker.health -= damageToAttacker;
  }

  // Handle Berserker Ignívoro self-damage (Furia: deals 1 damage to itself when attacking)
  if (attCard.id === 'berserker-ignivoro') {
    attacker.health -= 1;
  }

  // Handle Draco de Magma: on attack, deal 1 damage to enemy commander
  if (attCard.id === 'draco-magma') {
    const enemyCmdId = attacker.controller === 'PLAYER' ? 'commander-opponent' : 'commander-player';
    for (const key of Object.keys(newBoard)) {
      const ent = newBoard[key];
      if (ent.id === enemyCmdId) {
        ent.health -= 1;
        if (ent.health <= 0) {
          const w = resolveEntityDeath(newBoard, key, ent, player1, player2);
          if (w) winner = w;
        }
        break;
      }
    }
  }

  // Handle Mago de Runa Helada: on combat damage to a unit, freeze it for 1 turn
  if (attCard.id === 'mago-runa-helada' && damageToTarget > 0 && target.health > 0) {
    target.frozenTurns = Math.max(target.frozenTurns, 1);
  }

  // Handle Barrera de Hielo freeze trigger (When attacked, freezes attacker for 1 turn)
  if (tarCard && tarCard.id === 'barrera-hielo') {
    attacker.frozenTurns = Math.max(attacker.frozenTurns, 1);
  }

  // Resolve deaths
  if (target.health <= 0 && isBoardObstacle(target)) {
    delete newBoard[tarKey];
  } else if (target.health <= 0) {
    const savedCardId = target.cardId;
    const savedPos = { ...target.position };
    const w = resolveEntityDeath(newBoard, tarKey, target, player1, player2);
    if (w) winner = w;
    const wt = resolveDeathTrigger(newBoard, savedCardId, savedPos, player1, player2);
    if (wt) winner = wt;
  }

  if (attacker.health <= 0) {
    const savedCardId = attacker.cardId;
    const savedPos = { ...attacker.position };
    const w = resolveEntityDeath(newBoard, attKey, attacker, player1, player2);
    if (w) winner = w;
    const wt = resolveDeathTrigger(newBoard, savedCardId, savedPos, player1, player2);
    if (wt) winner = wt;
  }

  return {
    ...state,
    board: newBoard,
    player: player1,
    opponent: player2,
    winner,
  };
}

// Play Spell Card
export function playSpell(
  state: GameState,
  playerId: 'PLAYER' | 'OPPONENT',
  cardId: string,
  targetPos?: Position
): GameState {
  const player = playerId === 'PLAYER' ? state.player : state.opponent;
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand[cardIndex];
  if (card.type !== 'HECHIZO') return state;

  if (!canAfford(player, card)) return state;

  // Spell-Immunity Check: Golem de Glaciar / Avatar del Cosmos are immune to spells.
  if (targetPos) {
    const targetKey = `${targetPos.x},${targetPos.y}`;
    const targetEnt = state.board[targetKey];
    if (isBoardObstacle(targetEnt) && !canSpellTargetObstacle(cardId)) return state;
    if (targetEnt && CARDS_DB[targetEnt.cardId]?.rulesText.includes('Inmune a Hechizos')) {
      return state; // Cast is blocked / invalid
    }
  }

  let nextPlayerState = deductMana(player, card);
  nextPlayerState = {
    ...nextPlayerState,
    hand: nextPlayerState.hand.filter((_, idx) => idx !== cardIndex),
    graveyard: [...nextPlayerState.graveyard, card],
  };

  let nextBoard = cloneBoard(state.board);
  let pState1 = playerId === 'PLAYER' ? nextPlayerState : clonePlayer(state.player);
  let pState2 = playerId === 'OPPONENT' ? nextPlayerState : clonePlayer(state.opponent);
  let winner = state.winner;

  // --- Helper to deal damage to an entity by position key ---
  const dealDamageAtKey = (key: string, damage: number) => {
    const ent = nextBoard[key];
    if (!ent) return;
    ent.health -= damage;
    if (ent.health <= 0) {
      if (isBoardObstacle(ent)) {
        delete nextBoard[key];
        return;
      }
      const savedCardId = ent.cardId;
      const savedPos = { ...ent.position };
      const w = resolveEntityDeath(nextBoard, key, ent, pState1, pState2);
      if (w) winner = w;
      const wt = resolveDeathTrigger(nextBoard, savedCardId, savedPos, pState1, pState2);
      if (wt) winner = wt;
    }
  };

  // Resolve Spell Effects
  if (card.id === 'lluvia-ceniza' && targetPos) {
    const key = `${targetPos.x},${targetPos.y}`;
    dealDamageAtKey(key, 3);
  }

  if (card.id === 'chispa-fugaz' && targetPos) {
    const key = `${targetPos.x},${targetPos.y}`;
    dealDamageAtKey(key, 2);
    // Discard random card
    const casterState = playerId === 'PLAYER' ? pState1 : pState2;
    if (casterState.hand.length > 0) {
      const random = createRandom(state.seed + Date.now());
      const discardIdx = Math.floor(random() * casterState.hand.length);
      const discarded = casterState.hand[discardIdx];
      casterState.hand = casterState.hand.filter((_, idx) => idx !== discardIdx);
      casterState.graveyard = [...casterState.graveyard, discarded];
    }
  }

  if (card.id === 'prision-glacial' && targetPos) {
    const key = `${targetPos.x},${targetPos.y}`;
    const targetEnt = nextBoard[key];
    if (targetEnt) {
      targetEnt.frozenTurns = Math.max(targetEnt.frozenTurns, 2);
    }
  }

  if (card.id === 'cometa-arcano' && targetPos) {
    const key = `${targetPos.x},${targetPos.y}`;
    dealDamageAtKey(key, 4);
    // Draw a card
    const casterState = playerId === 'PLAYER' ? pState1 : pState2;
    const drawn = drawCard(casterState);
    if (playerId === 'PLAYER') pState1 = drawn;
    else pState2 = drawn;
  }

  if (card.id === 'destello-runico' && targetPos) {
    // Find commander of player
    const cmdId = playerId === 'PLAYER' ? 'commander-player' : 'commander-opponent';
    const cmdEnt = Object.values(state.board).find(ent => ent.id === cmdId);
    if (cmdEnt && isAdjacent(cmdEnt.position, targetPos, false)) {
      const key = `${targetPos.x},${targetPos.y}`;
      const targetEnt = nextBoard[key];
      if (targetEnt) {
        targetEnt.frozenTurns = Math.max(targetEnt.frozenTurns, 1);
      }
      const casterState = playerId === 'PLAYER' ? pState1 : pState2;
      const drawn = drawCard(casterState);
      if (playerId === 'PLAYER') pState1 = drawn;
      else pState2 = drawn;
    }
  }

  if (card.id === 'vortice-mana' && targetPos) {
    const key = `${targetPos.x},${targetPos.y}`;
    const targetEnt = nextBoard[key];
    if (targetEnt && targetEnt.id !== 'commander-player' && targetEnt.id !== 'commander-opponent') {
      delete nextBoard[key];
      const targetOwnerState = targetEnt.controller === 'PLAYER' ? pState1 : pState2;
      const baseCard = CARDS_DB[targetEnt.cardId];
      if (baseCard && targetOwnerState.hand.length < 10) {
        targetOwnerState.hand = [...targetOwnerState.hand, baseCard];
      }
    }
  }

  if (card.id === 'impetu-fuego' && targetPos) {
    const key = `${targetPos.x},${targetPos.y}`;
    const targetEnt = nextBoard[key];
    if (targetEnt && targetEnt.controller === playerId) {
      targetEnt.attack += 2;
      // Allow moving again
      targetEnt.hasMovedThisTurn = false;
    }
  }

  // --- NEW SPELL EFFECTS ---

  // Furia del Nexo: +3/+0 and remove summon sickness (Carga) to a target friendly unit
  if (card.id === 'furia-nexo' && targetPos) {
    const key = `${targetPos.x},${targetPos.y}`;
    const targetEnt = nextBoard[key];
    if (targetEnt && targetEnt.controller === playerId) {
      targetEnt.attack += 3;
      targetEnt.hasMovedThisTurn = false;
      targetEnt.hasAttackedThisTurn = false;
    }
  }

  // Erupción Volcánica: Deal 2 damage to ALL units on the board (not commanders, but actually all units per card text)
  if (card.id === 'erupcion-volcanica') {
    // Work from a snapshot: a previous target may remove another entity via a death trigger.
    const entityKeys = Object.keys(nextBoard);
    for (const key of entityKeys) {
      if (!nextBoard[key]) continue;
      const ent = nextBoard[key];
      if (ent.id === 'commander-player' || ent.id === 'commander-opponent') continue;
      dealDamageAtKey(key, 2);
    }
  }

  // Congelación Rápida: Freeze 1 enemy unit, draw 1 card
  if (card.id === 'congelacion-rapida' && targetPos) {
    const key = `${targetPos.x},${targetPos.y}`;
    const targetEnt = nextBoard[key];
    if (targetEnt && !isBoardObstacle(targetEnt) && targetEnt.controller !== playerId) {
      targetEnt.frozenTurns = Math.max(targetEnt.frozenTurns, 1);
    }
    const casterState = playerId === 'PLAYER' ? pState1 : pState2;
    const drawn = drawCard(casterState);
    if (playerId === 'PLAYER') pState1 = drawn;
    else pState2 = drawn;
  }

  // Tormenta de Maná: Freeze all enemies in a column (same X coordinate as targetPos)
  if (card.id === 'tormenta-mana' && targetPos) {
    const targetX = targetPos.x;
    for (const key of Object.keys(nextBoard)) {
      const ent = nextBoard[key];
      if (!isBoardObstacle(ent) && ent.controller !== playerId && ent.position.x === targetX) {
        // Respect spell immunity
        const entCard = CARDS_DB[ent.cardId];
        if (entCard && entCard.rulesText.includes('Inmune a Hechizos')) continue;
        ent.frozenTurns = Math.max(ent.frozenTurns, 1);
      }
    }
  }

  return {
    ...state,
    board: nextBoard,
    player: pState1,
    opponent: pState2,
    winner
  };
}

// End Turn (BUG FIX: deep-clone nested objects before mutating)
export function endTurn(state: GameState): GameState {
  const nextActive = state.activePlayer === 'PLAYER' ? 'OPPONENT' : 'PLAYER';
  
  // Deep-clone all mutable state
  const nextBoard = cloneBoard(state.board);
  let playerState = clonePlayer(state.player);
  let opponentState = clonePlayer(state.opponent);
  let winner = state.winner;

  // --- End-of-turn triggers for the OUTGOING player ---
  const outgoing = state.activePlayer;

  // Golem de la Fundición: deal 1 damage to all adjacent units at end of owner's turn
  for (const key of Object.keys(nextBoard)) {
    const ent = nextBoard[key];
    if (ent.cardId === 'golem-fundicion' && ent.controller === outgoing) {
      const golemPos = ent.position;
      for (const adjKey of Object.keys(nextBoard)) {
        if (adjKey === key) continue; // Skip self
        const adjEnt = nextBoard[adjKey];
        if (!adjEnt) continue;
        if (!isBoardObstacle(adjEnt) && isAdjacent(adjEnt.position, golemPos, false)) {
          adjEnt.health -= 1;
          if (adjEnt.health <= 0) {
            const savedCardId = adjEnt.cardId;
            const savedPos = { ...adjEnt.position };
            const w = resolveEntityDeath(nextBoard, adjKey, adjEnt, playerState, opponentState);
            if (w) winner = w;
            const wt = resolveDeathTrigger(nextBoard, savedCardId, savedPos, playerState, opponentState);
            if (wt) winner = wt;
          }
        }
      }
    }
  }

  // Restore and increment mana for the incoming player
  if (nextActive === 'PLAYER') {
    playerState.manaSources.furia.spent = 0;
    playerState.manaSources.arcano.spent = 0;
    playerState.manaPlayedThisTurn = false;
    playerState = drawCard(playerState);

    // Resolve start-of-turn structure effects

    // Torre del Horizonte: draw 1 card at start of turn
    for (const entity of Object.values(nextBoard)) {
      if (entity.cardId === 'torre-horizonte' && entity.controller === 'PLAYER') {
        playerState = drawCard(playerState);
      }
    }

    // Pilar de Fuego: deal 2 damage to a random enemy unit in same row
    for (const key of Object.keys(nextBoard)) {
      const entity = nextBoard[key];
      if (entity.cardId === 'pilar-fuego' && entity.controller === 'PLAYER') {
        const pilarY = entity.position.y;
        const enemiesInRow: { key: string; ent: BoardEntity }[] = [];
        for (const eKey of Object.keys(nextBoard)) {
          const e = nextBoard[eKey];
          if (!isBoardObstacle(e) && e.controller !== 'PLAYER' && e.position.y === pilarY &&
              e.id !== 'commander-player' && e.id !== 'commander-opponent') {
            enemiesInRow.push({ key: eKey, ent: e });
          }
        }
        if (enemiesInRow.length > 0) {
          const random = createRandom(state.seed + state.turn + key);
          const idx = Math.floor(random() * enemiesInRow.length);
          const target = enemiesInRow[idx];
          target.ent.health -= 2;
          if (target.ent.health <= 0) {
            const w = resolveEntityDeath(nextBoard, target.key, target.ent, playerState, opponentState);
            if (w) winner = w;
          }
        }
      }
    }

    // Búho Rúnico: draw 1, discard 1 random
    for (const entity of Object.values(nextBoard)) {
      if (entity.cardId === 'buho-runico' && entity.controller === 'PLAYER') {
        playerState = drawCard(playerState);
        if (playerState.hand.length > 0) {
          const random = createRandom(state.seed + state.turn + entity.id);
          const discardIdx = Math.floor(random() * playerState.hand.length);
          const discarded = playerState.hand[discardIdx];
          playerState.hand = playerState.hand.filter((_, idx) => idx !== discardIdx);
          playerState.graveyard = [...playerState.graveyard, discarded];
        }
      }
    }

    // Templo Rúnico: commander gets +1 attack (apply as passive aura at start of turn)
    // We track aura by checking board presence each turn-start and adjusting commander attack
    const playerCmd = Object.values(nextBoard).find(e => e.id === 'commander-player');
    if (playerCmd && hasTemploRunico(nextBoard, 'PLAYER')) {
      // Apply aura: ensure commander has base attack + 1
      const baseAttack = playerState.commander.attack || 2;
      playerCmd.attack = baseAttack + 1;
    } else if (playerCmd) {
      // Reset to base if no temple
      const baseAttack = playerState.commander.attack || 2;
      playerCmd.attack = baseAttack;
    }

  } else {
    // Restore opponent mana
    opponentState.manaSources.furia.spent = 0;
    opponentState.manaSources.arcano.spent = 0;
    opponentState.manaPlayedThisTurn = false;
    opponentState = drawCard(opponentState);

    // Resolve start-of-turn structure effects

    // Torre del Horizonte
    for (const entity of Object.values(nextBoard)) {
      if (entity.cardId === 'torre-horizonte' && entity.controller === 'OPPONENT') {
        opponentState = drawCard(opponentState);
      }
    }

    // Pilar de Fuego for opponent
    for (const key of Object.keys(nextBoard)) {
      const entity = nextBoard[key];
      if (entity.cardId === 'pilar-fuego' && entity.controller === 'OPPONENT') {
        const pilarY = entity.position.y;
        const enemiesInRow: { key: string; ent: BoardEntity }[] = [];
        for (const eKey of Object.keys(nextBoard)) {
          const e = nextBoard[eKey];
          if (!isBoardObstacle(e) && e.controller !== 'OPPONENT' && e.position.y === pilarY &&
              e.id !== 'commander-player' && e.id !== 'commander-opponent') {
            enemiesInRow.push({ key: eKey, ent: e });
          }
        }
        if (enemiesInRow.length > 0) {
          const random = createRandom(state.seed + state.turn + key);
          const idx = Math.floor(random() * enemiesInRow.length);
          const target = enemiesInRow[idx];
          target.ent.health -= 2;
          if (target.ent.health <= 0) {
            const w = resolveEntityDeath(nextBoard, target.key, target.ent, playerState, opponentState);
            if (w) winner = w;
          }
        }
      }
    }

    // Búho Rúnico for opponent
    for (const entity of Object.values(nextBoard)) {
      if (entity.cardId === 'buho-runico' && entity.controller === 'OPPONENT') {
        opponentState = drawCard(opponentState);
        if (opponentState.hand.length > 0) {
          const random = createRandom(state.seed + state.turn + entity.id);
          const discardIdx = Math.floor(random() * opponentState.hand.length);
          const discarded = opponentState.hand[discardIdx];
          opponentState.hand = opponentState.hand.filter((_, idx) => idx !== discardIdx);
          opponentState.graveyard = [...opponentState.graveyard, discarded];
        }
      }
    }

    // Templo Rúnico for opponent commander
    const oppCmd = Object.values(nextBoard).find(e => e.id === 'commander-opponent');
    if (oppCmd && hasTemploRunico(nextBoard, 'OPPONENT')) {
      const baseAttack = opponentState.commander.attack || 2;
      oppCmd.attack = baseAttack + 1;
    } else if (oppCmd) {
      const baseAttack = opponentState.commander.attack || 2;
      oppCmd.attack = baseAttack;
    }
  }

  // Refresh units on board belonging to incoming player
  for (const key of Object.keys(nextBoard)) {
    const entity = nextBoard[key];
    if (entity.controller === nextActive) {
      entity.hasMovedThisTurn = false;
      entity.hasAttackedThisTurn = false;
      if (entity.frozenTurns > 0) {
        entity.frozenTurns -= 1;
        // Frozen units miss their turn
        entity.hasMovedThisTurn = true;
        entity.hasAttackedThisTurn = true;
      }
    }
  }

  return {
    ...state,
    board: nextBoard,
    player: playerState,
    opponent: opponentState,
    activePlayer: nextActive,
    phase: 'MAIN',
    turn: nextActive === 'PLAYER' ? state.turn + 1 : state.turn,
    winner,
  };
}
