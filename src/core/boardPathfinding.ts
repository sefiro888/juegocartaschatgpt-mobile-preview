import type { BoardEntity, Position } from '../types/card';
import { isInsideBoard } from './boardConfig';

export interface MovementTraversalOptions {
  allowDiagonal?: boolean;
  canFly?: boolean;
}

export interface ReachablePosition {
  position: Position;
  distance: number;
  path: Position[];
}

export function positionKey(position: Position): string {
  return `${position.x},${position.y}`;
}

export function isBoardObstacle(entity: BoardEntity | undefined): boolean {
  return entity?.cardId.startsWith('obstaculo-') ?? false;
}

function getNeighborPositions(position: Position, allowDiagonal: boolean): Position[] {
  const directions = allowDiagonal
    ? [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0], [1, 0],
        [-1, 1], [0, 1], [1, 1],
      ]
    : [[0, -1], [-1, 0], [1, 0], [0, 1]];

  return directions
    .map(([deltaX, deltaY]) => ({ x: position.x + deltaX, y: position.y + deltaY }))
    .filter(({ x, y }) => isInsideBoard(x, y));
}

function isDiagonalStep(from: Position, to: Position): boolean {
  return from.x !== to.x && from.y !== to.y;
}

function diagonalCornerIsBlocked(
  board: Record<string, BoardEntity>,
  from: Position,
  to: Position,
): boolean {
  const horizontal = board[positionKey({ x: to.x, y: from.y })];
  const vertical = board[positionKey({ x: from.x, y: to.y })];
  return Boolean(horizontal || vertical);
}

function restorePath(
  predecessors: Map<string, string | null>,
  positions: Map<string, Position>,
  destinationKey: string,
): Position[] {
  const path: Position[] = [];
  let currentKey: string | null = destinationKey;

  while (currentKey) {
    const position = positions.get(currentKey);
    if (!position) break;
    path.unshift(position);
    currentKey = predecessors.get(currentKey) ?? null;
  }

  return path;
}

export function getReachablePositions(
  board: Record<string, BoardEntity>,
  from: Position,
  maxDistance: number,
  options: MovementTraversalOptions = {},
): ReachablePosition[] {
  const distanceLimit = Math.max(0, Math.floor(maxDistance));
  if (distanceLimit === 0 || !isInsideBoard(from.x, from.y)) return [];

  const allowDiagonal = options.allowDiagonal ?? true;
  const canFly = options.canFly ?? false;
  const startKey = positionKey(from);
  const queue: Position[] = [{ ...from }];
  const distances = new Map<string, number>([[startKey, 0]]);
  const predecessors = new Map<string, string | null>([[startKey, null]]);
  const positions = new Map<string, Position>([[startKey, { ...from }]]);

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
    const current = queue[queueIndex];
    const currentKey = positionKey(current);
    const currentDistance = distances.get(currentKey) ?? 0;
    if (currentDistance >= distanceLimit) continue;

    for (const candidate of getNeighborPositions(current, allowDiagonal)) {
      const candidateKey = positionKey(candidate);
      if (distances.has(candidateKey)) continue;
      if (!canFly && isDiagonalStep(current, candidate) && diagonalCornerIsBlocked(board, current, candidate)) {
        continue;
      }

      const occupant = board[candidateKey];
      if (occupant && !canFly) continue;

      distances.set(candidateKey, currentDistance + 1);
      predecessors.set(candidateKey, currentKey);
      positions.set(candidateKey, candidate);
      queue.push(candidate);
    }
  }

  return [...distances.entries()].flatMap(([key, distance]) => {
    if (key === startKey || board[key]) return [];
    const position = positions.get(key);
    if (!position) return [];
    return [{ position, distance, path: restorePath(predecessors, positions, key) }];
  });
}

export function findMovementPath(
  board: Record<string, BoardEntity>,
  from: Position,
  to: Position,
  maxDistance: number,
  options: MovementTraversalOptions = {},
): Position[] | null {
  const targetKey = positionKey(to);
  return getReachablePositions(board, from, maxDistance, options)
    .find((candidate) => positionKey(candidate.position) === targetKey)
    ?.path ?? null;
}

export function getGridLine(from: Position, to: Position): Position[] {
  const points: Position[] = [];
  let x = from.x;
  let y = from.y;
  const deltaX = Math.abs(to.x - from.x);
  const deltaY = Math.abs(to.y - from.y);
  const stepX = from.x < to.x ? 1 : -1;
  const stepY = from.y < to.y ? 1 : -1;
  let error = deltaX - deltaY;

  while (true) {
    points.push({ x, y });
    if (x === to.x && y === to.y) break;
    const doubledError = error * 2;
    if (doubledError > -deltaY) {
      error -= deltaY;
      x += stepX;
    }
    if (doubledError < deltaX) {
      error += deltaX;
      y += stepY;
    }
  }

  return points;
}

export function hasLineOfSight(
  board: Record<string, BoardEntity>,
  from: Position,
  to: Position,
): boolean {
  const intermediatePositions = getGridLine(from, to).slice(1, -1);
  return intermediatePositions.every((position) => !board[positionKey(position)]);
}
