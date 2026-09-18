/**
 * zobrist.js
 * Deterministic 64-bit Zobrist hashing for position tracking and threefold repetition.
 * Uses BigInt and a seeded PRNG for consistent hashes across sessions.
 */

import { PIECE_TYPES, WHITE, BLACK } from './pieces.js';

// Seeded PRNG (SplitMix64) to generate deterministic 64-bit BigInt random numbers
class SplitMix64 {
  constructor(seed = 0x9e3779b97f4a7c15n) {
    this.state = BigInt(seed);
  }

  next() {
    this.state = (this.state + 0x9e3779b97f4a7c15n) & 0xffffffffffffffffn;
    let z = this.state;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & 0xffffffffffffffffn;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & 0xffffffffffffffffn;
    return (z ^ (z >> 31n)) & 0xffffffffffffffffn;
  }
}

const prng = new SplitMix64(0x123456789abcdef0n);

// 64 squares * 2 colors * 6 piece types
export const ZOBRIST_PIECES = {};
for (const color of [WHITE, BLACK]) {
  ZOBRIST_PIECES[color] = {};
  for (const type of PIECE_TYPES) {
    ZOBRIST_PIECES[color][type] = new Array(64);
    for (let sq = 0; sq < 64; sq++) {
      ZOBRIST_PIECES[color][type][sq] = prng.next();
    }
  }
}

// Side to move (XOR if Black to move)
export const ZOBRIST_BLACK_TO_MOVE = prng.next();

// Castling rights (WK, WQ, BK, BQ)
export const ZOBRIST_CASTLING = {
  wK: prng.next(),
  wQ: prng.next(),
  bK: prng.next(),
  bQ: prng.next()
};

// En passant files (0..7)
export const ZOBRIST_EP_FILE = new Array(8);
for (let f = 0; f < 8; f++) {
  ZOBRIST_EP_FILE[f] = prng.next();
}

/**
 * Computes complete 64-bit Zobrist key for a position.
 * @param {Array<Object|null>} board 64-element array
 * @param {string} turn 'w' or 'b'
 * @param {Object} castlingRights { wK: boolean, wQ: boolean, bK: boolean, bQ: boolean }
 * @param {number|null} epSquare 0..63 or null
 * @returns {bigint}
 */
export function computeZobrist(board, turn, castlingRights, epSquare) {
  let hash = 0n;

  // Pieces
  for (let sq = 0; sq < 64; sq++) {
    const piece = board[sq];
    if (piece) {
      hash ^= ZOBRIST_PIECES[piece.color][piece.type][sq];
    }
  }

  // Turn
  if (turn === BLACK) {
    hash ^= ZOBRIST_BLACK_TO_MOVE;
  }

  // Castling
  if (castlingRights.wK) hash ^= ZOBRIST_CASTLING.wK;
  if (castlingRights.wQ) hash ^= ZOBRIST_CASTLING.wQ;
  if (castlingRights.bK) hash ^= ZOBRIST_CASTLING.bK;
  if (castlingRights.bQ) hash ^= ZOBRIST_CASTLING.bQ;

  // En passant (only hashes file if an actual en passant capture is possible in that position)
  if (epSquare !== null && epSquare !== undefined) {
    const file = epSquare % 8;
    hash ^= ZOBRIST_EP_FILE[file];
  }

  return hash;
}
