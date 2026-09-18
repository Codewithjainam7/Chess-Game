/**
 * moveGenerator.js
 * Move generation, attack checking, legal move filtering, and perft testing.
 */

import {
  isOnBoard,
  squareFromCoords,
  coordsFromSquare,
  cloneBoard,
  createEmptyBoard
} from './board.js';
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

// Knight offsets: (dFile, dRank)
const KNIGHT_OFFSETS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1]
];

// King offsets: (dFile, dRank)
const KING_OFFSETS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

// Sliding ray directions
const BISHOP_DIRECTIONS = [
  [-1, -1], [-1, 1], [1, -1], [1, 1]
];

const ROOK_DIRECTIONS = [
  [-1, 0], [1, 0], [0, -1], [0, 1]
];

const QUEEN_DIRECTIONS = [
  ...BISHOP_DIRECTIONS,
  ...ROOK_DIRECTIONS
];

const PROMOTION_PIECES = [QUEEN, ROOK, BISHOP, KNIGHT];

/**
 * Checks if a square is attacked by pieces of `byColor`.
 * @param {Array<Object|null>} board
 * @param {number} targetSquare 0..63
 * @param {string} byColor 'w' or 'b'
 * @returns {boolean}
 */
export function isSquareAttacked(board, targetSquare, byColor) {
  const { file: tFile, rank: tRank } = coordsFromSquare(targetSquare);

  // 1. Attacked by Knights
  for (const [df, dr] of KNIGHT_OFFSETS) {
    const f = tFile + df;
    const r = tRank + dr;
    if (isOnBoard(f, r)) {
      const piece = board[squareFromCoords(f, r)];
      if (piece && piece.color === byColor && piece.type === KNIGHT) {
        return true;
      }
    }
  }

  // 2. Attacked by Pawns
  // If byColor is White, attacking pawns are coming from rank - 1 (from below)
  // If byColor is Black, attacking pawns are coming from rank + 1 (from above)
  const pawnRank = byColor === WHITE ? tRank - 1 : tRank + 1;
  for (const df of [-1, 1]) {
    const f = tFile + df;
    if (isOnBoard(f, pawnRank)) {
      const piece = board[squareFromCoords(f, pawnRank)];
      if (piece && piece.color === byColor && piece.type === PAWN) {
        return true;
      }
    }
  }

  // 3. Attacked by King
  for (const [df, dr] of KING_OFFSETS) {
    const f = tFile + df;
    const r = tRank + dr;
    if (isOnBoard(f, r)) {
      const piece = board[squareFromCoords(f, r)];
      if (piece && piece.color === byColor && piece.type === KING) {
        return true;
      }
    }
  }

  // 4. Attacked by Bishops or Queens (diagonal rays)
  for (const [df, dr] of BISHOP_DIRECTIONS) {
    let f = tFile + df;
    let r = tRank + dr;
    while (isOnBoard(f, r)) {
      const sq = squareFromCoords(f, r);
      const piece = board[sq];
      if (piece) {
        if (piece.color === byColor && (piece.type === BISHOP || piece.type === QUEEN)) {
          return true;
        }
        break; // Ray blocked by piece
      }
      f += df;
      r += dr;
    }
  }

  // 5. Attacked by Rooks or Queens (orthogonal rays)
  for (const [df, dr] of ROOK_DIRECTIONS) {
    let f = tFile + df;
    let r = tRank + dr;
    while (isOnBoard(f, r)) {
      const sq = squareFromCoords(f, r);
      const piece = board[sq];
      if (piece) {
        if (piece.color === byColor && (piece.type === ROOK || piece.type === QUEEN)) {
          return true;
        }
        break; // Ray blocked by piece
      }
      f += df;
      r += dr;
    }
  }

  return false;
}

/**
 * Generates all pseudo-legal moves for the active player.
 * @param {Object} state
 * @returns {Array<Object>}
 */
export function generatePseudoLegalMoves(state) {
  const { board, turn, castlingRights, enPassant } = state;
  const moves = [];
  const opponentColor = getOppositeColor(turn);

  for (let sq = 0; sq < 64; sq++) {
    const piece = board[sq];
    if (!piece || piece.color !== turn) continue;

    const { file, rank } = coordsFromSquare(sq);

    switch (piece.type) {
      case PAWN: {
        const forwardDirection = turn === WHITE ? 1 : -1;
        const startRank = turn === WHITE ? 1 : 6;
        const promotionRank = turn === WHITE ? 7 : 0;

        // 1. Single forward push
        const nextRank = rank + forwardDirection;
        if (isOnBoard(file, nextRank)) {
          const forwardSq = squareFromCoords(file, nextRank);
          if (!board[forwardSq]) {
            if (nextRank === promotionRank) {
              for (const prom of PROMOTION_PIECES) {
                moves.push({
                  from: sq,
                  to: forwardSq,
                  piece,
                  capturedPiece: null,
                  promotion: prom,
                  isEnPassant: false,
                  isCastleKingside: false,
                  isCastleQueenside: false
                });
              }
            } else {
              moves.push({
                from: sq,
                to: forwardSq,
                piece,
                capturedPiece: null,
                promotion: null,
                isEnPassant: false,
                isCastleKingside: false,
                isCastleQueenside: false
              });

              // 2. Double forward push from starting rank
              if (rank === startRank) {
                const doubleRank = rank + forwardDirection * 2;
                const doubleSq = squareFromCoords(file, doubleRank);
                if (!board[doubleSq]) {
                  moves.push({
                    from: sq,
                    to: doubleSq,
                    piece,
                    capturedPiece: null,
                    promotion: null,
                    isEnPassant: false,
                    isCastleKingside: false,
                    isCastleQueenside: false
                  });
                }
              }
            }
          }
        }

        // 3. Diagonal captures & En Passant
        for (const df of [-1, 1]) {
          const capFile = file + df;
          if (isOnBoard(capFile, nextRank)) {
            const capSq = squareFromCoords(capFile, nextRank);
            const targetPiece = board[capSq];

            // Standard capture
            if (targetPiece && targetPiece.color === opponentColor) {
              if (nextRank === promotionRank) {
                for (const prom of PROMOTION_PIECES) {
                  moves.push({
                    from: sq,
                    to: capSq,
                    piece,
                    capturedPiece: targetPiece,
                    promotion: prom,
                    isEnPassant: false,
                    isCastleKingside: false,
                    isCastleQueenside: false
                  });
                }
              } else {
                moves.push({
                  from: sq,
                  to: capSq,
                  piece,
                  capturedPiece: targetPiece,
                  promotion: null,
                  isEnPassant: false,
                  isCastleKingside: false,
                  isCastleQueenside: false
                });
              }
            }
            // En Passant capture
            else if (enPassant !== null && capSq === enPassant) {
              const epCapturedSquare = squareFromCoords(capFile, rank);
              const epCapturedPiece = board[epCapturedSquare];
              if (epCapturedPiece && epCapturedPiece.color === opponentColor && epCapturedPiece.type === PAWN) {
                moves.push({
                  from: sq,
                  to: capSq,
                  piece,
                  capturedPiece: epCapturedPiece,
                  promotion: null,
                  isEnPassant: true,
                  isCastleKingside: false,
                  isCastleQueenside: false
                });
              }
            }
          }
        }
        break;
      }

      case KNIGHT: {
        for (const [df, dr] of KNIGHT_OFFSETS) {
          const f = file + df;
          const r = rank + dr;
          if (isOnBoard(f, r)) {
            const toSq = squareFromCoords(f, r);
            const destPiece = board[toSq];
            if (!destPiece || destPiece.color === opponentColor) {
              moves.push({
                from: sq,
                to: toSq,
                piece,
                capturedPiece: destPiece,
                promotion: null,
                isEnPassant: false,
                isCastleKingside: false,
                isCastleQueenside: false
              });
            }
          }
        }
        break;
      }

      case BISHOP: {
        generateRayMoves(board, sq, file, rank, piece, opponentColor, BISHOP_DIRECTIONS, moves);
        break;
      }

      case ROOK: {
        generateRayMoves(board, sq, file, rank, piece, opponentColor, ROOK_DIRECTIONS, moves);
        break;
      }

      case QUEEN: {
        generateRayMoves(board, sq, file, rank, piece, opponentColor, QUEEN_DIRECTIONS, moves);
        break;
      }

      case KING: {
        // Normal king steps
        for (const [df, dr] of KING_OFFSETS) {
          const f = file + df;
          const r = rank + dr;
          if (isOnBoard(f, r)) {
            const toSq = squareFromCoords(f, r);
            const destPiece = board[toSq];
            if (!destPiece || destPiece.color === opponentColor) {
              moves.push({
                from: sq,
                to: toSq,
                piece,
                capturedPiece: destPiece,
                promotion: null,
                isEnPassant: false,
                isCastleKingside: false,
                isCastleQueenside: false
              });
            }
          }
        }

        // Castling (checks squares empty and safe)
        if (turn === WHITE && sq === 4) { // e1
          // White Kingside: e1 -> g1 (squares 4 -> 6)
          if (
            castlingRights.wK &&
            board[7]?.type === ROOK && board[7]?.color === WHITE &&
            !board[5] && !board[6] &&
            !isSquareAttacked(board, 4, BLACK) &&
            !isSquareAttacked(board, 5, BLACK) &&
            !isSquareAttacked(board, 6, BLACK)
          ) {
            moves.push({
              from: 4,
              to: 6,
              piece,
              capturedPiece: null,
              promotion: null,
              isEnPassant: false,
              isCastleKingside: true,
              isCastleQueenside: false
            });
          }

          // White Queenside: e1 -> c1 (squares 4 -> 2)
          if (
            castlingRights.wQ &&
            board[0]?.type === ROOK && board[0]?.color === WHITE &&
            !board[3] && !board[2] && !board[1] &&
            !isSquareAttacked(board, 4, BLACK) &&
            !isSquareAttacked(board, 3, BLACK) &&
            !isSquareAttacked(board, 2, BLACK)
          ) {
            moves.push({
              from: 4,
              to: 2,
              piece,
              capturedPiece: null,
              promotion: null,
              isEnPassant: false,
              isCastleKingside: false,
              isCastleQueenside: true
            });
          }
        } else if (turn === BLACK && sq === 60) { // e8
          // Black Kingside: e8 -> g8 (squares 60 -> 62)
          if (
            castlingRights.bK &&
            board[63]?.type === ROOK && board[63]?.color === BLACK &&
            !board[61] && !board[62] &&
            !isSquareAttacked(board, 60, WHITE) &&
            !isSquareAttacked(board, 61, WHITE) &&
            !isSquareAttacked(board, 62, WHITE)
          ) {
            moves.push({
              from: 60,
              to: 62,
              piece,
              capturedPiece: null,
              promotion: null,
              isEnPassant: false,
              isCastleKingside: true,
              isCastleQueenside: false
            });
          }

          // Black Queenside: e8 -> c8 (squares 60 -> 58)
          if (
            castlingRights.bQ &&
            board[56]?.type === ROOK && board[56]?.color === BLACK &&
            !board[59] && !board[58] && !board[57] &&
            !isSquareAttacked(board, 60, WHITE) &&
            !isSquareAttacked(board, 59, WHITE) &&
            !isSquareAttacked(board, 58, WHITE)
          ) {
            moves.push({
              from: 60,
              to: 58,
              piece,
              capturedPiece: null,
              promotion: null,
              isEnPassant: false,
              isCastleKingside: false,
              isCastleQueenside: true
            });
          }
        }
        break;
      }
    }
  }

  return moves;
}

function generateRayMoves(board, sq, file, rank, piece, opponentColor, directions, moves) {
  for (const [df, dr] of directions) {
    let f = file + df;
    let r = rank + dr;
    while (isOnBoard(f, r)) {
      const toSq = squareFromCoords(f, r);
      const destPiece = board[toSq];

      if (!destPiece) {
        moves.push({
          from: sq,
          to: toSq,
          piece,
          capturedPiece: null,
          promotion: null,
          isEnPassant: false,
          isCastleKingside: false,
          isCastleQueenside: false
        });
      } else {
        if (destPiece.color === opponentColor) {
          moves.push({
            from: sq,
            to: toSq,
            piece,
            capturedPiece: destPiece,
            promotion: null,
            isEnPassant: false,
            isCastleKingside: false,
            isCastleQueenside: false
          });
        }
        break; // Stop at first obstruction
      }

      f += df;
      r += dr;
    }
  }
}

/**
 * Simulates a move on the board and checks if king of `turn` is in check.
 * @param {Array<Object|null>} board
 * @param {Object} move
 * @param {string} turn
 * @returns {boolean} True if move is illegal (leaves king in check)
 */
export function leavesKingInCheck(board, move, turn) {
  const opponentColor = getOppositeColor(turn);
  const { from, to, piece, promotion, isEnPassant, isCastleKingside, isCastleQueenside } = move;

  // We can do an in-place board modification and unmake to be ultra fast and avoid allocations during Perft
  const originalToPiece = board[to];
  const originalFromPiece = board[from];

  let epCapturedPiece = null;
  let epSquare = null;

  if (isEnPassant) {
    const toCoords = coordsFromSquare(to);
    const fromCoords = coordsFromSquare(from);
    epSquare = squareFromCoords(toCoords.file, fromCoords.rank);
    epCapturedPiece = board[epSquare];
    board[epSquare] = null;
  }

  if (isCastleKingside) {
    const rookFrom = turn === WHITE ? 7 : 63;
    const rookTo = turn === WHITE ? 5 : 61;
    board[rookTo] = board[rookFrom];
    board[rookFrom] = null;
  } else if (isCastleQueenside) {
    const rookFrom = turn === WHITE ? 0 : 56;
    const rookTo = turn === WHITE ? 3 : 59;
    board[rookTo] = board[rookFrom];
    board[rookFrom] = null;
  }

  board[to] = promotion ? { type: promotion, color: turn } : piece;
  board[from] = null;

  // Find King square
  let kingSq = -1;
  if (piece.type === KING) {
    kingSq = to;
  } else {
    for (let sq = 0; sq < 64; sq++) {
      const p = board[sq];
      if (p && p.type === KING && p.color === turn) {
        kingSq = sq;
        break;
      }
    }
  }

  const inCheck = isSquareAttacked(board, kingSq, opponentColor);

  // Unmake board modifications
  board[from] = originalFromPiece;
  board[to] = originalToPiece;

  if (isEnPassant) {
    board[epSquare] = epCapturedPiece;
  }

  if (isCastleKingside) {
    const rookFrom = turn === WHITE ? 7 : 63;
    const rookTo = turn === WHITE ? 5 : 61;
    board[rookFrom] = board[rookTo];
    board[rookTo] = null;
  } else if (isCastleQueenside) {
    const rookFrom = turn === WHITE ? 0 : 56;
    const rookTo = turn === WHITE ? 3 : 59;
    board[rookFrom] = board[rookTo];
    board[rookTo] = null;
  }

  return inCheck;
}

/**
 * Returns all fully legal moves for the current game state.
 * @param {Object} state
 * @returns {Array<Object>}
 */
export function generateLegalMoves(state) {
  const pseudoMoves = generatePseudoLegalMoves(state);
  const legalMoves = [];

  for (const move of pseudoMoves) {
    if (!leavesKingInCheck(state.board, move, state.turn)) {
      legalMoves.push(move);
    }
  }

  return legalMoves;
}

/**
 * Applies a move to the game state, producing a new state object.
 * @param {Object} state
 * @param {Object} move
 * @returns {Object}
 */
export function applyMove(state, move) {
  const { board, turn, castlingRights, halfmoveClock, fullmoveNumber } = state;
  const nextBoard = cloneBoard(board);
  const nextCastlingRights = { ...castlingRights };
  const opponentColor = getOppositeColor(turn);

  const { from, to, piece, promotion, isEnPassant, isCastleKingside, isCastleQueenside } = move;

  // 1. Move piece
  nextBoard[to] = promotion ? { type: promotion, color: turn } : { type: piece.type, color: piece.color };
  nextBoard[from] = null;

  // 2. Handle En Passant capture
  if (isEnPassant) {
    const fromCoords = coordsFromSquare(from);
    const toCoords = coordsFromSquare(to);
    const capturedPawnSq = squareFromCoords(toCoords.file, fromCoords.rank);
    nextBoard[capturedPawnSq] = null;
  }

  // 3. Handle Castling rook move
  if (isCastleKingside) {
    if (turn === WHITE) {
      nextBoard[5] = nextBoard[7];
      nextBoard[7] = null;
    } else {
      nextBoard[61] = nextBoard[63];
      nextBoard[63] = null;
    }
  } else if (isCastleQueenside) {
    if (turn === WHITE) {
      nextBoard[3] = nextBoard[0];
      nextBoard[0] = null;
    } else {
      nextBoard[59] = nextBoard[56];
      nextBoard[56] = null;
    }
  }

  // 4. Update Castling Rights
  // If King moves
  if (piece.type === KING) {
    if (turn === WHITE) {
      nextCastlingRights.wK = false;
      nextCastlingRights.wQ = false;
    } else {
      nextCastlingRights.bK = false;
      nextCastlingRights.bQ = false;
    }
  }

  // If Rook moves
  if (piece.type === ROOK) {
    if (from === 0) nextCastlingRights.wQ = false;
    if (from === 7) nextCastlingRights.wK = false;
    if (from === 56) nextCastlingRights.bQ = false;
    if (from === 63) nextCastlingRights.bK = false;
  }

  // If Rook is captured
  if (to === 0) nextCastlingRights.wQ = false;
  if (to === 7) nextCastlingRights.wK = false;
  if (to === 56) nextCastlingRights.bQ = false;
  if (to === 63) nextCastlingRights.bK = false;

  // 5. Update En Passant square
  let nextEnPassant = null;
  if (piece.type === PAWN && Math.abs(to - from) === 16) {
    nextEnPassant = (from + to) / 2;
  }

  // 6. Update Halfmove clock
  let nextHalfmoveClock = halfmoveClock + 1;
  if (piece.type === PAWN || move.capturedPiece !== null || isEnPassant) {
    nextHalfmoveClock = 0;
  }

  // 7. Update Fullmove number
  const nextFullmoveNumber = turn === BLACK ? fullmoveNumber + 1 : fullmoveNumber;

  return {
    board: nextBoard,
    turn: opponentColor,
    castlingRights: nextCastlingRights,
    enPassant: nextEnPassant,
    halfmoveClock: nextHalfmoveClock,
    fullmoveNumber: nextFullmoveNumber
  };
}

/**
 * Recursive perft function for node counting validation.
 * @param {number} depth
 * @param {Object} state
 * @returns {number}
 */
export function perft(depth, state) {
  if (depth === 0) return 1;

  const legalMoves = generateLegalMoves(state);
  if (depth === 1) return legalMoves.length;

  let totalNodes = 0;
  for (const move of legalMoves) {
    const nextState = applyMove(state, move);
    totalNodes += perft(depth - 1, nextState);
  }

  return totalNodes;
}
