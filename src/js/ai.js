/**
 * ai.js
 * Intelligent Chess Engine using Negamax with Alpha-Beta Pruning,
 * Piece-Square Tables (PST), Quiescence Search, and Move Ordering.
 */

import {
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,
  WHITE,
  BLACK,
  getOppositeColor
} from './pieces.js';
import { coordsFromSquare } from './board.js';
import { generateLegalMoves, applyMove, isSquareAttacked } from './moveGenerator.js';

// Base piece values in centipawns
export const PIECE_SCORES = {
  [PAWN]: 100,
  [KNIGHT]: 320,
  [BISHOP]: 330,
  [ROOK]: 500,
  [QUEEN]: 900,
  [KING]: 20000
};

// Piece-Square Tables (White perspective: rank 0 is 1st rank, rank 7 is 8th rank)
const PST_PAWN = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const PST_KNIGHT = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const PST_BISHOP = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const PST_ROOK = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0
];

const PST_QUEEN = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const PST_KING = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

const PST_TABLES = {
  [PAWN]: PST_PAWN,
  [KNIGHT]: PST_KNIGHT,
  [BISHOP]: PST_BISHOP,
  [ROOK]: PST_ROOK,
  [QUEEN]: PST_QUEEN,
  [KING]: PST_KING
};

/**
 * Evaluates board position from White's perspective in centipawns.
 * @param {Array<Object|null>} board
 * @returns {number}
 */
export function evaluateBoard(board) {
  let score = 0;

  for (let sq = 0; sq < 64; sq++) {
    const piece = board[sq];
    if (!piece) continue;

    const baseVal = PIECE_SCORES[piece.type] || 0;
    const pst = PST_TABLES[piece.type];

    const { file, rank } = coordsFromSquare(sq);
    const tableIndex = piece.color === WHITE
      ? (7 - rank) * 8 + file
      : rank * 8 + file;

    const positionalVal = pst ? pst[tableIndex] : 0;
    const totalVal = baseVal + positionalVal;

    if (piece.color === WHITE) {
      score += totalVal;
    } else {
      score -= totalVal;
    }
  }

  return score;
}

/**
 * Orders moves to maximize alpha-beta pruning cutoffs.
 */
function orderMoves(moves) {
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (a.promotion) scoreA += 900;
    if (b.promotion) scoreB += 900;

    if (a.capturedPiece) {
      scoreA += (PIECE_SCORES[a.capturedPiece.type] * 10) - PIECE_SCORES[a.piece.type];
    }
    if (b.capturedPiece) {
      scoreB += (PIECE_SCORES[b.capturedPiece.type] * 10) - PIECE_SCORES[b.piece.type];
    }

    return scoreB - scoreA;
  });
}

/**
 * Checks if active side's king is in check.
 */
function isKingInCheck(board, turn) {
  let kingSq = -1;
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (p && p.type === KING && p.color === turn) {
      kingSq = sq;
      break;
    }
  }
  if (kingSq === -1) return false;
  return isSquareAttacked(board, kingSq, getOppositeColor(turn));
}

/**
 * Quiescence search for quiet positions without tactical blunders.
 */
function quiescence(state, alpha, beta, depth = 0) {
  let val = evaluateBoard(state.board) * (state.turn === WHITE ? 1 : -1);

  if (val >= beta) {
    return beta;
  }
  if (val > alpha) {
    alpha = val;
  }
  if (depth >= 4) {
    return val;
  }

  const legalMoves = generateLegalMoves(state);
  const captureMoves = legalMoves.filter((m) => m.capturedPiece !== null || m.isEnPassant || m.promotion !== null);
  orderMoves(captureMoves);

  for (const move of captureMoves) {
    const nextState = applyMove(state, move);
    const score = -quiescence(nextState, -beta, -alpha, depth + 1);

    if (score >= beta) {
      return beta;
    }
    if (score > val) {
      val = score;
    }
    if (score > alpha) {
      alpha = score;
    }
  }

  return val;
}

/**
 * Negamax algorithm with alpha-beta pruning.
 */
function negamax(state, depth, alpha, beta) {
  if (depth <= 0) {
    return quiescence(state, alpha, beta);
  }

  const legalMoves = generateLegalMoves(state);

  if (legalMoves.length === 0) {
    if (isKingInCheck(state.board, state.turn)) {
      return -100000 - depth; // Checkmated
    }
    return 0; // Stalemate
  }

  orderMoves(legalMoves);

  let val = -Infinity;

  for (const move of legalMoves) {
    const nextState = applyMove(state, move);
    const score = -negamax(nextState, depth - 1, -beta, -alpha);

    if (score >= beta) {
      return beta; // Alpha-beta cutoff
    }
    if (score > val) {
      val = score;
    }
    if (score > alpha) {
      alpha = score;
    }
  }

  return val;
}

/**
 * Finds the optimal move for the AI.
 * @param {Object} gameState
 * @param {string} difficulty 'easy' | 'medium' | 'hard'
 * @returns {Object|null}
 */
export function getAIMove(gameState, difficulty = 'medium') {
  const legalMoves = gameState.getLegalMoves();
  if (legalMoves.length === 0) return null;

  // Level 1: Easy (random with preference for free captures)
  if (difficulty === 'easy') {
    orderMoves(legalMoves);
    if (Math.random() < 0.35) {
      const randIdx = Math.floor(Math.random() * legalMoves.length);
      return legalMoves[randIdx];
    }
    return legalMoves[0];
  }

  // Level 2: Medium (depth 2)
  // Level 3: Hard (depth 3)
  const maxDepth = difficulty === 'hard' ? 3 : 2;

  let bestMove = null;
  let bestScore = -Infinity;

  const sortedMoves = orderMoves([...legalMoves]);

  for (const move of sortedMoves) {
    const nextState = applyMove(gameState, move);
    // Search with full window at root level to get true score comparison
    const score = -negamax(nextState, maxDepth - 1, -Infinity, Infinity);

    // Apply tiny jitter only to opening non-tactical moves
    const jitter = Math.abs(score) > 200 ? 0 : (Math.random() * 2 - 1);
    const candidateScore = score + jitter;

    if (candidateScore > bestScore || bestMove === null) {
      bestScore = candidateScore;
      bestMove = move;
    }
  }

  return bestMove || sortedMoves[0];
}
