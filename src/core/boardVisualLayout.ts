import { BOARD_SIZE, COMMANDER_COLUMN, OPPONENT_BACK_ROW, PLAYER_BACK_ROW } from './boardConfig';
import type { Position } from '../types/card';

export type WorldPoint = [number, number, number];

export type BoardVisualNodeType =
  | 'spawn'
  | 'platform'
  | 'bridge'
  | 'altar'
  | 'high-ground'
  | 'portal'
  | 'neutral';

export type SanctuaryPlatformVariant = 'court' | 'altar' | 'bastion' | 'terrace';

export interface BoardVisualNode {
  id: string;
  logicalPosition: Position;
  worldPosition: WorldPoint;
  worldRotation?: WorldPoint;
  cardRotation?: WorldPoint;
  nodeType: BoardVisualNodeType;
  heightLevel: number;
  visualRadius: number;
  neighbors: string[];
  pathControlPoints?: WorldPoint[];
  platformId: string;
}

export interface SanctuaryPlatform {
  id: string;
  gridPosition: Position;
  center: WorldPoint;
  size: [number, number];
  rotation: WorldPoint;
  heightLevel: number;
  variant: SanctuaryPlatformVariant;
  nodeIds: string[];
}

export interface SanctuaryBridge {
  id: string;
  fromPlatformId: string;
  toPlatformId: string;
  start: WorldPoint;
  end: WorldPoint;
  width: number;
  isSideRoute: boolean;
}

const PLATFORM_GRID_SIZE = BOARD_SIZE / 2;
const PLATFORM_HEIGHT_STEP = 0.34;
const PLATFORM_ROW_DEPTHS = [7.3, 3.75, 0, -3.75, -7.3];
const PLATFORM_ROW_SPACING = [3.65, 4, 4.25, 4, 3.65];
const PLATFORM_HEIGHTS = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1],
  [0, 0, 0, 0, 1],
  [1, 0, 0, 1, 1],
  [1, 1, 2, 2, 2],
];
export const BOARD_CELL_SIZE = 1.34;
export const BOARD_WORLD_SIZE = BOARD_CELL_SIZE * BOARD_SIZE;
export const BOARD_SURFACE_Y = 1.35;
const BOARD_GRID_OFFSET = (BOARD_SIZE - 1) / 2;
const TACTICAL_BOARD_PLATFORM_ID = 'tactical-grid';

if (BOARD_SIZE % 2 !== 0) {
  throw new Error('The floating sanctuary visual layout requires an even BOARD_SIZE.');
}

function nodeId(position: Position): string {
  return `node-${position.x}-${position.y}`;
}

function platformId(column: number, row: number): string {
  return `platform-${column}-${row}`;
}

function clonePoint(point: WorldPoint): WorldPoint {
  return [point[0], point[1], point[2]];
}

function getPlatformVariant(column: number, row: number): SanctuaryPlatformVariant {
  if (column === 2 && (row === 0 || row === PLATFORM_GRID_SIZE - 1)) return 'altar';
  if ((column === 0 || column === PLATFORM_GRID_SIZE - 1) && row === 2) return 'bastion';
  if (PLATFORM_HEIGHTS[row][column] >= 2) return 'terrace';
  return 'court';
}

function getNodeType(position: Position, heightLevel: number): BoardVisualNodeType {
  const isCommanderAltar =
    position.x === COMMANDER_COLUMN &&
    (position.y === PLAYER_BACK_ROW || position.y === OPPONENT_BACK_ROW);

  if (isCommanderAltar) return 'altar';
  if (position.y === PLAYER_BACK_ROW || position.y === OPPONENT_BACK_ROW) return 'spawn';
  if ((position.x === 0 || position.x === BOARD_SIZE - 1) && (position.y === 4 || position.y === 5)) {
    return 'portal';
  }
  if (heightLevel >= 2) return 'high-ground';
  if (position.x % 2 !== position.y % 2) return 'bridge';
  if (position.y === 4 || position.y === 5) return 'neutral';
  return 'platform';
}

function getLogicalNeighbors(position: Position): string[] {
  const candidates: Position[] = [
    { x: position.x - 1, y: position.y - 1 },
    { x: position.x, y: position.y - 1 },
    { x: position.x + 1, y: position.y - 1 },
    { x: position.x - 1, y: position.y },
    { x: position.x + 1, y: position.y },
    { x: position.x - 1, y: position.y + 1 },
    { x: position.x, y: position.y + 1 },
    { x: position.x + 1, y: position.y + 1 },
  ];

  return candidates
    .filter(({ x, y }) => x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE)
    .map(nodeId);
}

export const SANCTUARY_PLATFORMS: SanctuaryPlatform[] = Array.from(
  { length: PLATFORM_GRID_SIZE * PLATFORM_GRID_SIZE },
  (_, index) => {
    const row = Math.floor(index / PLATFORM_GRID_SIZE);
    const column = index % PLATFORM_GRID_SIZE;
    const heightLevel = PLATFORM_HEIGHTS[row][column];
    const center: WorldPoint = [
      (column - 2) * PLATFORM_ROW_SPACING[row],
      heightLevel * PLATFORM_HEIGHT_STEP,
      PLATFORM_ROW_DEPTHS[row],
    ];
    const nodeIds: string[] = [];

    for (let localY = 0; localY < 2; localY += 1) {
      for (let localX = 0; localX < 2; localX += 1) {
        nodeIds.push(nodeId({ x: column * 2 + localX, y: row * 2 + localY }));
      }
    }

    return {
      id: platformId(column, row),
      gridPosition: { x: column, y: row },
      center,
      size: [3.02, 2.62],
      rotation: [0, (column + row) % 2 === 0 ? 0.012 : -0.012, 0],
      heightLevel,
      variant: getPlatformVariant(column, row),
      nodeIds,
    };
  },
);

const PLATFORM_BY_ID = new Map(SANCTUARY_PLATFORMS.map((platform) => [platform.id, platform]));

export const BOARD_VISUAL_NODES: BoardVisualNode[] = Array.from(
  { length: BOARD_SIZE * BOARD_SIZE },
  (_, index) => {
    const logicalPosition: Position = {
      x: index % BOARD_SIZE,
      y: Math.floor(index / BOARD_SIZE),
    };
    const worldPosition: WorldPoint = [
      (logicalPosition.x - BOARD_GRID_OFFSET) * BOARD_CELL_SIZE,
      BOARD_SURFACE_Y,
      (BOARD_GRID_OFFSET - logicalPosition.y) * BOARD_CELL_SIZE,
    ];
    const heightLevel = 0;

    return {
      id: nodeId(logicalPosition),
      logicalPosition,
      worldPosition,
      worldRotation: [0, 0, 0],
      cardRotation: [-0.12, 0.24, 0],
      nodeType: getNodeType(logicalPosition, heightLevel),
      heightLevel,
      visualRadius: BOARD_CELL_SIZE * 0.42,
      neighbors: getLogicalNeighbors(logicalPosition),
      pathControlPoints: [[worldPosition[0], worldPosition[1] + 0.34, worldPosition[2]]],
      platformId: TACTICAL_BOARD_PLATFORM_ID,
    };
  },
);

const NODE_BY_LOGICAL_KEY = new Map(
  BOARD_VISUAL_NODES.map((node) => [`${node.logicalPosition.x},${node.logicalPosition.y}`, node]),
);

function bridgeEndpoint(from: SanctuaryPlatform, to: SanctuaryPlatform, fromAmount: number): WorldPoint {
  const amount = fromAmount;
  return [
    from.center[0] + (to.center[0] - from.center[0]) * amount,
    Math.max(from.center[1], to.center[1]) + 0.16,
    from.center[2] + (to.center[2] - from.center[2]) * amount,
  ];
}

export const SANCTUARY_BRIDGES: SanctuaryBridge[] = SANCTUARY_PLATFORMS.flatMap((platform) => {
  const { x: column, y: row } = platform.gridPosition;
  const connections: SanctuaryBridge[] = [];
  const right = column < PLATFORM_GRID_SIZE - 1 ? PLATFORM_BY_ID.get(platformId(column + 1, row)) : undefined;
  const away = row < PLATFORM_GRID_SIZE - 1 ? PLATFORM_BY_ID.get(platformId(column, row + 1)) : undefined;

  for (const target of [right, away]) {
    if (!target) continue;
    const horizontal = target.gridPosition.y === row;
    connections.push({
      id: `bridge-${platform.id}-${target.id}`,
      fromPlatformId: platform.id,
      toPlatformId: target.id,
      start: bridgeEndpoint(platform, target, horizontal ? 0.34 : 0.36),
      end: bridgeEndpoint(platform, target, horizontal ? 0.66 : 0.64),
      width: horizontal ? 1.12 : 1.02,
      isSideRoute: column === 0 || column === PLATFORM_GRID_SIZE - 1,
    });
  }

  return connections;
});

export function getBoardVisualNode(position: Position): BoardVisualNode {
  const node = NODE_BY_LOGICAL_KEY.get(`${position.x},${position.y}`);
  if (!node) {
    throw new Error(`No visual node for logical position ${position.x},${position.y}.`);
  }
  return node;
}

export function getSanctuaryPlatform(id: string): SanctuaryPlatform {
  const platform = PLATFORM_BY_ID.get(id);
  if (!platform) throw new Error(`Unknown sanctuary platform ${id}.`);
  return platform;
}

export function getMovementPath(from: Position, to: Position): WorldPoint[] {
  const fromNode = getBoardVisualNode(from);
  const toNode = getBoardVisualNode(to);
  const start = clonePoint(fromNode.worldPosition);
  const end = clonePoint(toNode.worldPosition);
  const maxSurface = Math.max(start[1], end[1]);

  if (fromNode.platformId === toNode.platformId) {
    return [
      start,
      [(start[0] + end[0]) / 2, maxSurface + 0.48, (start[2] + end[2]) / 2],
      end,
    ];
  }

  const bridge = SANCTUARY_BRIDGES.find(
    (candidate) =>
      (candidate.fromPlatformId === fromNode.platformId && candidate.toPlatformId === toNode.platformId) ||
      (candidate.toPlatformId === fromNode.platformId && candidate.fromPlatformId === toNode.platformId),
  );

  if (bridge) {
    const forward = bridge.fromPlatformId === fromNode.platformId;
    const first = forward ? bridge.start : bridge.end;
    const second = forward ? bridge.end : bridge.start;
    return [
      start,
      [first[0], Math.max(first[1], maxSurface) + 0.26, first[2]],
      [second[0], Math.max(second[1], maxSurface) + 0.26, second[2]],
      end,
    ];
  }

  return [
    start,
    [(start[0] + end[0]) / 2, maxSurface + 0.72, (start[2] + end[2]) / 2],
    end,
  ];
}

export function getMovementPathThroughNodes(route: Position[]): WorldPoint[] {
  if (route.length === 0) return [];
  if (route.length === 1) return [clonePoint(getBoardVisualNode(route[0]).worldPosition)];

  const points: WorldPoint[] = [];
  for (let index = 0; index < route.length - 1; index += 1) {
    const segment = getMovementPath(route[index], route[index + 1]);
    points.push(...(index === 0 ? segment : segment.slice(1)));
  }
  return points;
}

export const SANCTUARY_VISUAL_BOUNDS = SANCTUARY_PLATFORMS.reduce(
  (bounds, platform) => ({
    minX: Math.min(bounds.minX, platform.center[0] - platform.size[0] / 2),
    maxX: Math.max(bounds.maxX, platform.center[0] + platform.size[0] / 2),
    minZ: Math.min(bounds.minZ, platform.center[2] - platform.size[1] / 2),
    maxZ: Math.max(bounds.maxZ, platform.center[2] + platform.size[1] / 2),
  }),
  { minX: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY, minZ: Number.POSITIVE_INFINITY, maxZ: Number.NEGATIVE_INFINITY },
);
