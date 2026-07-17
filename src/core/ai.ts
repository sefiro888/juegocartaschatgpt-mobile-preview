import type { GameState, Position, BoardEntity } from '../types/card';
import { canAfford, canAttackTarget, playManaCard, summonUnit, moveUnit, combatAttack, playSpell, endTurn, isAdjacent, getDistance } from './engine';
import { CARDS_DB } from './cardsDb';
import { BOARD_SIZE, COMMANDER_COLUMN, OPPONENT_BACK_ROW, PLAYER_BACK_ROW } from './boardConfig';
import { getReachablePositions, isBoardObstacle } from './boardPathfinding';

// Spell IDs that target a single enemy
const ENEMY_TARGET_SPELLS = new Set([
  'lluvia-ceniza', 'chispa-fugaz', 'prision-glacial',
  'cometa-arcano', 'destello-runico', 'congelacion-rapida',
]);

// Buff spells that target a friendly unit
const FRIENDLY_TARGET_SPELLS = new Set([
  'impetu-fuego', 'furia-nexo',
]);

// Spells that target a column (any position in the column)
const COLUMN_TARGET_SPELLS = new Set([
  'tormenta-mana',
]);

// AoE spells that need no target
const NO_TARGET_SPELLS = new Set([
  'erupcion-volcanica',
]);

// Vortice de Maná targets an enemy unit to bounce
const BOUNCE_SPELLS = new Set([
  'vortice-mana',
]);

// Find the player commander entity on the board
function findCommander(state: GameState, controller: 'PLAYER' | 'OPPONENT'): BoardEntity | undefined {
  const cmdId = controller === 'PLAYER' ? 'commander-player' : 'commander-opponent';
  return Object.values(state.board).find(ent => ent.id === cmdId);
}

// Score an attack target: lower health = higher priority, commander = highest priority
function scoreAttackTarget(target: BoardEntity): number {
  // Commander is highest priority with a big bonus
  if (target.id === 'commander-player') return 1000;
  // Prefer low-health enemies (easy kills)
  // Also factor in attack: killing high-attack units is more valuable
  return (target.attack * 2) + (10 - target.health);
}

// Simple heuristic AI for OPPONENT
export function executeAITurn(state: GameState): GameState {
  let currentState = { ...state };
  let actionCount = 0;
  const maxActions = 20; // Loop protection

  // 1. Play a mana card if available
  const opponent = currentState.opponent;
  const manaCard = opponent.hand.find(c => c.type === 'MANA');
  if (manaCard && !opponent.manaPlayedThisTurn) {
    currentState = playManaCard(currentState, 'OPPONENT', manaCard.id);
    actionCount++;
  }

  // AI loop to summon units, cast spells, and execute movements/attacks
  let possibleMoves = true;
  while (possibleMoves && actionCount < maxActions) {
    possibleMoves = false;

    // --- SUMMONING PHASE ---
    const handUnits = currentState.opponent.hand.filter(c => c.type === 'UNIDAD' || c.type === 'ESTRUCTURA');
    let summoned = false;

    for (const card of handUnits) {
      if (canAfford(currentState.opponent, card)) {
        // Find all empty valid spots
        const validSpots: Position[] = [];
        for (let x = 0; x < BOARD_SIZE; x++) {
          for (let y = 0; y < BOARD_SIZE; y++) {
            const pos = { x, y };
            const key = `${x},${y}`;
            if (currentState.board[key]) continue; // occupied

            // Summon criteria: opponent back row OR adjacent to allied entity
            const isBackrow = y === OPPONENT_BACK_ROW;
            let adjacentAlly = false;
            for (const ent of Object.values(currentState.board)) {
              if (!isBoardObstacle(ent) && ent.controller === 'OPPONENT' && isAdjacent(ent.position, pos, false)) {
                adjacentAlly = true;
                break;
              }
            }

            if (isBackrow || adjacentAlly) {
              validSpots.push(pos);
            }
          }
        }

        if (validSpots.length > 0) {
          // Choose a spot (prefer closer to player, meaning lower y value)
          validSpots.sort((a, b) => a.y - b.y);

          // For battlecry cards, try to find optimal target
          let battlecryTarget: Position | undefined;

          // Tejedora de Escarcha: freeze an enemy
          if (card.id === 'tejedora-escarcha') {
            const playerUnits = Object.values(currentState.board).filter(
              ent => ent.controller === 'PLAYER' && ent.frozenTurns === 0
            );
            if (playerUnits.length > 0) {
              // Freeze the highest-attack unfrozen enemy
              playerUnits.sort((a, b) => b.attack - a.attack);
              battlecryTarget = playerUnits[0].position;
            }
          }

          // Tejedora del Tiempo: refresh a friendly unit that already acted
          if (card.id === 'tejedora-tiempo') {
            const friendlyActed = Object.values(currentState.board).filter(
              ent => ent.controller === 'OPPONENT' &&
                !isBoardObstacle(ent) &&
                (ent.hasMovedThisTurn || ent.hasAttackedThisTurn) &&
                CARDS_DB[ent.cardId]?.type !== 'ESTRUCTURA'
            );
            if (friendlyActed.length > 0) {
              // Refresh the highest-attack unit
              friendlyActed.sort((a, b) => b.attack - a.attack);
              battlecryTarget = friendlyActed[0].position;
            }
          }

          const bestSpot = validSpots[0];
          currentState = summonUnit(currentState, 'OPPONENT', card.id, bestSpot, battlecryTarget);
          summoned = true;
          actionCount++;
          possibleMoves = true;
          break; // break loop to update hand/mana state
        }
      }
    }

    if (summoned) continue; // loop again to evaluate other cards or actions

    // --- SPELL CASTING PHASE ---
    const handSpells = currentState.opponent.hand.filter(c => c.type === 'HECHIZO');
    let spellCast = false;

    for (const card of handSpells) {
      if (!canAfford(currentState.opponent, card)) continue;

      // --- AoE spells (no target needed) ---
      if (NO_TARGET_SPELLS.has(card.id)) {
        // Only cast erupcion-volcanica if there are more player units than opponent units on board
        const playerUnits = Object.values(currentState.board).filter(
          ent => ent.controller === 'PLAYER' && ent.id !== 'commander-player'
        );
        const opponentUnits = Object.values(currentState.board).filter(
          ent => ent.controller === 'OPPONENT' && ent.id !== 'commander-opponent' && !isBoardObstacle(ent)
        );
        if (playerUnits.length > opponentUnits.length) {
          currentState = playSpell(currentState, 'OPPONENT', card.id);
          spellCast = true;
          actionCount++;
          possibleMoves = true;
          break;
        }
        continue;
      }

      // --- Buff spells (target own units) ---
      if (FRIENDLY_TARGET_SPELLS.has(card.id)) {
        const friendlyUnits = Object.values(currentState.board).filter(
          ent => ent.controller === 'OPPONENT' &&
            !isBoardObstacle(ent) &&
            CARDS_DB[ent.cardId]?.type !== 'ESTRUCTURA' &&
            ent.id !== 'commander-opponent'
        );
        if (friendlyUnits.length > 0) {
          // Buff the unit with highest attack or the one adjacent to enemies
          friendlyUnits.sort((a, b) => {
            const aAdj = Object.values(currentState.board).some(
              e => e.controller === 'PLAYER' && isAdjacent(a.position, e.position, false)
            ) ? 100 : 0;
            const bAdj = Object.values(currentState.board).some(
              e => e.controller === 'PLAYER' && isAdjacent(b.position, e.position, false)
            ) ? 100 : 0;
            return (bAdj + b.attack) - (aAdj + a.attack);
          });
          const bestTarget = friendlyUnits[0];
          currentState = playSpell(currentState, 'OPPONENT', card.id, bestTarget.position);
          spellCast = true;
          actionCount++;
          possibleMoves = true;
          break;
        }
        continue;
      }

      // --- Column freeze spells ---
      if (COLUMN_TARGET_SPELLS.has(card.id)) {
        // Find the column with most player units
        const columnCounts: Record<number, number> = {};
        for (const ent of Object.values(currentState.board)) {
          if (ent.controller === 'PLAYER') {
            columnCounts[ent.position.x] = (columnCounts[ent.position.x] || 0) + 1;
          }
        }
        let bestCol = -1;
        let bestCount = 0;
        for (const col of Object.keys(columnCounts)) {
          const count = columnCounts[Number(col)];
          if (count > bestCount) {
            bestCount = count;
            bestCol = Number(col);
          }
        }
        if (bestCol >= 0 && bestCount >= 2) {
              currentState = playSpell(currentState, 'OPPONENT', card.id, { x: bestCol, y: PLAYER_BACK_ROW });
          spellCast = true;
          actionCount++;
          possibleMoves = true;
          break;
        }
        continue;
      }

      // --- Bounce spells ---
      if (BOUNCE_SPELLS.has(card.id)) {
        const playerUnits = Object.values(currentState.board).filter(
          ent => ent.controller === 'PLAYER' &&
            ent.id !== 'commander-player' &&
            ent.id !== 'commander-opponent'
        );
        if (playerUnits.length > 0) {
          // Bounce the strongest enemy unit
          playerUnits.sort((a, b) => b.attack - a.attack);
          currentState = playSpell(currentState, 'OPPONENT', card.id, playerUnits[0].position);
          spellCast = true;
          actionCount++;
          possibleMoves = true;
          break;
        }
        continue;
      }

      // --- Enemy-targeted spells ---
      if (ENEMY_TARGET_SPELLS.has(card.id)) {
        const playerEntities = Object.values(currentState.board).filter(
          ent => ent.controller === 'PLAYER'
        );
        if (playerEntities.length > 0) {
          // Scoring: prefer commander when spell can kill it, else prefer lowest-health enemies (easy kills)
          const commander = playerEntities.find(ent => ent.id === 'commander-player');

          // For damage spells, calculate expected damage
          let spellDamage = 0;
          if (card.id === 'lluvia-ceniza') spellDamage = 3;
          if (card.id === 'chispa-fugaz') spellDamage = 2;
          if (card.id === 'cometa-arcano') spellDamage = 4;

          let target: BoardEntity | undefined;

          if (spellDamage > 0) {
            // Check if we can kill a non-commander unit (prefer easy kills)
            const killable = playerEntities
              .filter(ent => ent.id !== 'commander-player' && ent.health <= spellDamage)
              .sort((a, b) => b.attack - a.attack); // Kill highest-attack unit first

            if (killable.length > 0) {
              target = killable[0];
            } else if (commander) {
              // No easy kills, target the commander
              target = commander;
            } else {
              // Target lowest health unit
              target = [...playerEntities].sort((a, b) => a.health - b.health)[0];
            }
          } else {
            // Freeze/control spells: target the most dangerous unfrozen unit
            const unfrozen = playerEntities.filter(ent => ent.frozenTurns === 0);
            if (unfrozen.length > 0) {
              unfrozen.sort((a, b) => b.attack - a.attack);
              target = unfrozen[0];
            }
          }

          if (target) {
            // Special check for destello-runico: target must be adjacent to opponent's commander
            if (card.id === 'destello-runico') {
              const oppCmd = findCommander(currentState, 'OPPONENT');
              if (!oppCmd || !isAdjacent(oppCmd.position, target.position, false)) {
                continue; // Skip this spell
              }
            }

            // Check spell immunity
            const targetCard = CARDS_DB[target.cardId];
            if (targetCard && targetCard.rulesText.includes('Inmune a Hechizos')) {
              continue;
            }

            currentState = playSpell(currentState, 'OPPONENT', card.id, target.position);
            spellCast = true;
            actionCount++;
            possibleMoves = true;
            break;
          }
        }
        continue;
      }
    }

    if (spellCast) continue;

    // --- ATTACK PHASE: prioritize attacks before movement ---
    const attackableUnits = Object.values(currentState.board).filter(
      ent => ent.controller === 'OPPONENT' &&
        !isBoardObstacle(ent) &&
        !ent.hasAttackedThisTurn &&
        ent.frozenTurns === 0 &&
        CARDS_DB[ent.cardId]?.type !== 'ESTRUCTURA'
    );

    let unitActed = false;

    for (const unit of attackableUnits) {
      const adjacentEnemies = Object.values(currentState.board).filter(
        ent => ent.controller === 'PLAYER' && canAttackTarget(currentState, unit.position, ent.position)
      );

      if (adjacentEnemies.length > 0) {
        // Score targets and pick the best one
        adjacentEnemies.sort((a, b) => scoreAttackTarget(b) - scoreAttackTarget(a));
        const bestTarget = adjacentEnemies[0];

        currentState = combatAttack(currentState, unit.position, bestTarget.position);
        unitActed = true;
        actionCount++;
        possibleMoves = true;
        break;
      }
    }

    if (unitActed) continue;

    // --- MOVEMENT PHASE: move remaining unmoved units toward enemy commander ---
    const movableUnits = Object.values(currentState.board).filter(
      ent => ent.controller === 'OPPONENT' &&
        !isBoardObstacle(ent) &&
        !ent.hasMovedThisTurn &&
        ent.frozenTurns === 0 &&
        CARDS_DB[ent.cardId]?.type !== 'ESTRUCTURA'
    );

    let moved = false;

    for (const unit of movableUnits) {
      const currentPos = unit.position;
      const playerCmd = findCommander(currentState, 'PLAYER');
      const targetPos = playerCmd ? playerCmd.position : { x: COMMANDER_COLUMN, y: PLAYER_BACK_ROW };

      const cardRef = CARDS_DB[unit.cardId];
      if (!cardRef) continue;
      const possibleCoords = getReachablePositions(
        currentState.board,
        currentPos,
        cardRef.movement ?? 1,
        {
          allowDiagonal: true,
          canFly: cardRef.rulesText.includes('Vuelo'),
        },
      ).map((candidate) => candidate.position);

      if (possibleCoords.length > 0) {
        // Sort by distance to player commander (prefer moving toward it)
        possibleCoords.sort((a, b) => {
          const distA = getDistance(a, targetPos);
          const distB = getDistance(b, targetPos);
          return distA - distB;
        });

        const bestMove = possibleCoords[0];
        // Only move if it gets us closer
        const currentDist = getDistance(currentPos, targetPos);
        const newDist = getDistance(bestMove, targetPos);
        if (newDist < currentDist) {
          currentState = moveUnit(currentState, currentPos, bestMove);
          moved = true;
          actionCount++;
          possibleMoves = true;
          break;
        }
      }
    }

    if (moved) continue;
  }

  // End turn when finished
  return endTurn(currentState);
}
