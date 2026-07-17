import { describe, expect, it } from 'vitest';
import type { BoardEntity } from '../../types/card';
import { findMovementPath, getReachablePositions, positionKey } from '../boardPathfinding';

function entity(
  id: string,
  cardId: string,
  x: number,
  y: number,
): BoardEntity {
  return {
    id,
    cardId,
    controller: 'PLAYER',
    position: { x, y },
    health: 3,
    maxHealth: 3,
    attack: 2,
    hasMovedThisTurn: false,
    hasAttackedThisTurn: false,
    frozenTurns: 0,
  };
}

describe('board pathfinding', () => {
  it('exposes every empty destination in all eight directions within movement range', () => {
    const board = { '5,5': entity('unit', 'sabueso-brasa', 5, 5) };
    const reachable = getReachablePositions(board, { x: 5, y: 5 }, 2);
    const keys = new Set(reachable.map(({ position }) => positionKey(position)));

    expect(reachable).toHaveLength(24);
    expect(keys.has('5,3')).toBe(true);
    expect(keys.has('7,5')).toBe(true);
    expect(keys.has('7,6')).toBe(true);
  });

  it('routes around occupied cells and rejects destinations beyond the allowance', () => {
    const board = {
      '5,5': entity('unit', 'sabueso-brasa', 5, 5),
      '5,4': entity('ridge', 'obstaculo-risco', 5, 4),
    };

    expect(findMovementPath(board, { x: 5, y: 5 }, { x: 5, y: 3 }, 2)).toBeNull();
    expect(findMovementPath(board, { x: 5, y: 5 }, { x: 4, y: 4 }, 2)).toEqual([
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 4, y: 4 },
    ]);
  });

  it('allows flying units to cross an occupied node without landing on it', () => {
    const board = {
      '5,5': entity('dragon', 'dragon-caldera', 5, 5),
      '5,4': entity('ridge', 'obstaculo-risco', 5, 4),
    };

    expect(findMovementPath(
      board,
      { x: 5, y: 5 },
      { x: 5, y: 3 },
      2,
      { allowDiagonal: false, canFly: true },
    )).toEqual([
      { x: 5, y: 5 },
      { x: 5, y: 4 },
      { x: 5, y: 3 },
    ]);
    expect(findMovementPath(
      board,
      { x: 5, y: 5 },
      { x: 5, y: 4 },
      2,
      { allowDiagonal: false, canFly: true },
    )).toBeNull();
  });
});
