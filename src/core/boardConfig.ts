export const BOARD_SIZE = 10;
export const PLAYER_BACK_ROW = 0;
export const OPPONENT_BACK_ROW = BOARD_SIZE - 1;
export const COMMANDER_COLUMN = Math.floor(BOARD_SIZE / 2);

export function isInsideBoard(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

