import { describe, expect, it } from 'vitest';
import { BOARD_SIZE } from '../boardConfig';
import {
  BOARD_CELL_SIZE,
  BOARD_SURFACE_Y,
  BOARD_VISUAL_NODES,
  BOARD_WORLD_SIZE,
  SANCTUARY_BRIDGES,
  SANCTUARY_PLATFORMS,
  getBoardVisualNode,
  getMovementPath,
} from '../boardVisualLayout';

describe('floating sanctuary visual layout', () => {
  it('maps every logical cell to one unique point on a uniform tactical plane', () => {
    expect(BOARD_VISUAL_NODES).toHaveLength(BOARD_SIZE * BOARD_SIZE);
    expect(SANCTUARY_PLATFORMS).toHaveLength(25);

    const logicalKeys = new Set(
      BOARD_VISUAL_NODES.map(({ logicalPosition }) => `${logicalPosition.x},${logicalPosition.y}`),
    );
    const worldKeys = new Set(
      BOARD_VISUAL_NODES.map(({ worldPosition }) => worldPosition.map((value) => value.toFixed(3)).join(',')),
    );

    expect(logicalKeys.size).toBe(BOARD_SIZE * BOARD_SIZE);
    expect(worldKeys.size).toBe(BOARD_SIZE * BOARD_SIZE);
    expect(BOARD_VISUAL_NODES.every((node) => node.worldPosition[1] === BOARD_SURFACE_Y)).toBe(true);
    expect(SANCTUARY_PLATFORMS.every((platform) => platform.nodeIds.length === 4)).toBe(true);

    const origin = getBoardVisualNode({ x: 0, y: 0 }).worldPosition;
    const right = getBoardVisualNode({ x: 1, y: 0 }).worldPosition;
    const forward = getBoardVisualNode({ x: 0, y: 1 }).worldPosition;
    expect(right[0] - origin[0]).toBeCloseTo(BOARD_CELL_SIZE);
    expect(forward[2] - origin[2]).toBeCloseTo(-BOARD_CELL_SIZE);
  });

  it('keeps neighbors inside the board and connects all platform lanes', () => {
    for (const node of BOARD_VISUAL_NODES) {
      expect(node.neighbors.length).toBeGreaterThanOrEqual(2);
      expect(node.neighbors.length).toBeLessThanOrEqual(8);
      for (const neighborId of node.neighbors) {
        expect(BOARD_VISUAL_NODES.some((candidate) => candidate.id === neighborId)).toBe(true);
      }
    }

    expect(SANCTUARY_BRIDGES).toHaveLength(40);
  });

  it('uses the complete 10x10 footprint and produces elevated movement paths', () => {
    expect(BOARD_WORLD_SIZE).toBeCloseTo(BOARD_CELL_SIZE * BOARD_SIZE);

    const start = getBoardVisualNode({ x: 1, y: 1 }).worldPosition;
    const end = getBoardVisualNode({ x: 2, y: 1 }).worldPosition;
    const path = getMovementPath({ x: 1, y: 1 }, { x: 2, y: 1 });

    expect(path[0]).toEqual(start);
    expect(path.at(-1)).toEqual(end);
    expect(path.some((point) => point[1] > Math.max(start[1], end[1]))).toBe(true);
  });
});
