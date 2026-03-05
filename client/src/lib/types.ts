export type Size = 'S' | 'M' | 'L';
export type Player = 'Red' | 'Yellow';
export type Piece = `${Size}-${Player}`;
export type CellStack = Piece[];
export type Board = CellStack[];

export interface Selection {
  source: 'reserve' | number;
  piece: Piece;
}

export interface GameState {
  board: Board;
  reserves: { Red: Piece[]; Yellow: Piece[] };
  currentPlayer: Player;
  selected: Selection | null;
  validMoves: number[];
  phase: 'place' | 'move';
  winner: Player | 'draw' | null;
  boardHistory: string[];
}
