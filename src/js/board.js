/**
 * board.js
 * 8x8 mailbox-style board representation and coordinate utilities.
 * 
 * Index mapping:
 *   square = rank * 8 + file
 *   rank 0..7 maps to chess ranks 1..8
 *   file 0..7 maps to chess files a..h
 * 
 * Examples:
 *   a1 = 0 * 8 + 0 = 0
 *   h1 = 0 * 8 + 7 = 7
 *   a8 = 7 * 8 + 0 = 56
 *   h8 = 7 * 8 + 7 = 63
 */

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const BOARD_SIZE = 64;

export const SQUARES = {
  a1: 0,  b1: 1,  c1: 2,  d1: 3,  e1: 4,  f1: 5,  g1: 6,  h1: 7,
  a2: 8,  b2: 9,  c2: 10, d2: 11, e2: 12, f2: 13, g2: 14, h2: 15,
  a3: 16, b3: 17, c3: 18, d3: 19, e3: 20, f3: 21, g3: 22, h3: 23,
  a4: 24, b4: 25, c4: 26, d4: 27, e4: 28, f4: 29, g4: 30, h4: 31,
  a5: 32, b5: 33, c5: 34, d5: 35, e5: 36, f5: 37, g5: 38, h5: 39,
  a6: 40, b6: 41, c6: 42, d6: 43, e6: 44, f6: 45, g6: 46, h6: 47,
  a7: 48, b7: 49, c7: 50, d7: 51, e7: 52, f7: 53, g7: 54, h7: 55,
  a8: 56, b8: 57, c8: 58, d8: 59, e8: 60, f8: 61, g8: 62, h8: 63
};

/**
 * Creates an empty 64-element board array.
 * @returns {Array<Object|null>}
 */
export function createEmptyBoard() {
  return new Array(BOARD_SIZE).fill(null);
}

/**
 * Clones a board array shallowly copying piece objects.
 * @param {Array<Object|null>} board
 * @returns {Array<Object|null>}
 */
export function cloneBoard(board) {
  const clone = new Array(BOARD_SIZE);
  for (let i = 0; i < BOARD_SIZE; i++) {
    const piece = board[i];
    clone[i] = piece ? { type: piece.type, color: piece.color } : null;
  }
  return clone;
}

/**
 * Checks if coordinates are within the 8x8 board.
 * @param {number} file 0..7
 * @param {number} rank 0..7
 * @returns {boolean}
 */
export function isOnBoard(file, rank) {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}

/**
 * Converts file and rank to square index (0..63).
 * @param {number} file 0..7
 * @param {number} rank 0..7
 * @returns {number}
 */
export function squareFromCoords(file, rank) {
  return rank * 8 + file;
}

/**
 * Converts square index to { file, rank }.
 * @param {number} square 0..63
 * @returns {{ file: number, rank: number }}
 */
export function coordsFromSquare(square) {
  return {
    file: square % 8,
    rank: Math.floor(square / 8)
  };
}

/**
 * Converts square index (0..63) to algebraic notation (e.g. 'e4').
 * @param {number} square 0..63
 * @returns {string}
 */
export function squareToAlgebraic(square) {
  if (square === null || square === undefined || square < 0 || square >= BOARD_SIZE) return '-';
  const file = square % 8;
  const rank = Math.floor(square / 8);
  return `${FILES[file]}${RANKS[rank]}`;
}

/**
 * Converts algebraic notation (e.g. 'e4') to square index (0..63).
 * @param {string} str
 * @returns {number|null}
 */
export function algebraicToSquare(str) {
  if (!str || str.length < 2) return null;
  const file = FILES.indexOf(str[0].toLowerCase());
  const rank = RANKS.indexOf(str[1]);
  if (file === -1 || rank === -1) return null;
  return rank * 8 + file;
}

/**
 * Returns true if square is light-colored.
 * @param {number} square
 * @returns {boolean}
 */
export function isLightSquare(square) {
  const { file, rank } = coordsFromSquare(square);
  return (file + rank) % 2 !== 0;
}
