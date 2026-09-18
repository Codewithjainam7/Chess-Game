/**
 * gameState.js
 * Turn management, check/checkmate/stalemate/draw detection,
 * move history, undo/redo, and material tracking.
 */

import {
  createEmptyBoard,
  cloneBoard,
  coordsFromSquare,
  isLightSquare
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
  PIECE_VALUES,
  getOppositeColor
} from './pieces.js';
import {
  parseFEN,
  toFEN,
  START_FEN,
  moveToSAN
} from './notation.js';
import {
  generateLegalMoves,
  applyMove,
  isSquareAttacked
} from './moveGenerator.js';
import {
  computeZobrist
} from './zobrist.js';

export class GameState {
  constructor(fen = START_FEN) {
    this.loadFEN(fen);
  }

  loadFEN(fen = START_FEN) {
    const parsed = parseFEN(fen);
    this.initialFEN = fen;
    this.board = parsed.board;
    this.turn = parsed.turn;
    this.castlingRights = parsed.castlingRights;
    this.enPassant = parsed.enPassant;
    this.halfmoveClock = parsed.halfmoveClock;
    this.fullmoveNumber = parsed.fullmoveNumber;

    this.moveHistory = [];
    this.redoStack = [];
    this.capturedPieces = {
      [WHITE]: [],
      [BLACK]: []
    };

    // Calculate initial captured pieces if loading custom position
    this._recomputeCapturedPiecesFromFEN();

    // Repetition tracking via Zobrist keys (BigInt string keys -> frequency count)
    this.positionCounts = new Map();
    const currentHash = this.getZobristKey();
    this.positionCounts.set(currentHash, 1);

    this.resignedColor = null;
    this._cachedLegalMoves = null;
  }

  getZobristKey() {
    return computeZobrist(this.board, this.turn, this.castlingRights, this.enPassant).toString();
  }

  getLegalMoves(fromSquare = null) {
    if (!this._cachedLegalMoves) {
      this._cachedLegalMoves = generateLegalMoves(this);
    }
    if (fromSquare !== null && fromSquare !== undefined) {
      return this._cachedLegalMoves.filter((m) => m.from === fromSquare);
    }
    return this._cachedLegalMoves;
  }

  isCheck() {
    const kingColor = this.turn;
    const opponentColor = getOppositeColor(kingColor);
    let kingSq = -1;
    for (let sq = 0; sq < 64; sq++) {
      const p = this.board[sq];
      if (p && p.type === KING && p.color === kingColor) {
        kingSq = sq;
        break;
      }
    }
    if (kingSq === -1) return false;
    return isSquareAttacked(this.board, kingSq, opponentColor);
  }

  isCheckmate() {
    if (this.resignedColor) return false;
    return this.isCheck() && this.getLegalMoves().length === 0;
  }

  isStalemate() {
    if (this.resignedColor) return false;
    return !this.isCheck() && this.getLegalMoves().length === 0;
  }

  isThreefoldRepetition() {
    const currentHash = this.getZobristKey();
    const count = this.positionCounts.get(currentHash) || 0;
    return count >= 3;
  }

  isFiftyMoveRule() {
    return this.halfmoveClock >= 100;
  }

  isInsufficientMaterial() {
    // Collect all pieces on the board
    const pieces = [];
    for (let sq = 0; sq < 64; sq++) {
      const piece = this.board[sq];
      if (piece) {
        pieces.push({ ...piece, square: sq });
      }
    }

    // Any pawn, rook, or queen means sufficient material
    const majorPieces = pieces.filter((p) => p.type === PAWN || p.type === ROOK || p.type === QUEEN);
    if (majorPieces.length > 0) return false;

    // King vs King
    if (pieces.length === 2) return true;

    // King + Bishop vs King OR King + Knight vs King
    if (pieces.length === 3) {
      const nonKings = pieces.filter((p) => p.type !== KING);
      if (nonKings.length === 1 && (nonKings[0].type === BISHOP || nonKings[0].type === KNIGHT)) {
        return true;
      }
    }

    // King + Bishop vs King + Bishop
    if (pieces.length === 4) {
      const whiteBishops = pieces.filter((p) => p.color === WHITE && p.type === BISHOP);
      const blackBishops = pieces.filter((p) => p.color === BLACK && p.type === BISHOP);

      if (whiteBishops.length === 1 && blackBishops.length === 1) {
        // Draw if both bishops are on squares of the same color
        const whiteBishopSquareColor = isLightSquare(whiteBishops[0].square);
        const blackBishopSquareColor = isLightSquare(blackBishops[0].square);
        return whiteBishopSquareColor === blackBishopSquareColor;
      }
    }

    return false;
  }

  isGameOver() {
    return (
      this.resignedColor !== null ||
      this.isCheckmate() ||
      this.isStalemate() ||
      this.isThreefoldRepetition() ||
      this.isFiftyMoveRule() ||
      this.isInsufficientMaterial()
    );
  }

  getGameResult() {
    if (this.resignedColor) {
      return this.resignedColor === WHITE ? '0-1' : '1-0';
    }
    if (this.isCheckmate()) {
      return this.turn === WHITE ? '0-1' : '1-0';
    }
    if (
      this.isStalemate() ||
      this.isThreefoldRepetition() ||
      this.isFiftyMoveRule() ||
      this.isInsufficientMaterial()
    ) {
      return '1/2-1/2';
    }
    return '*';
  }

  getGameStatus() {
    if (this.resignedColor) {
      const winner = getOppositeColor(this.resignedColor);
      return {
        isOver: true,
        winner,
        reason: 'resignation',
        title: `${winner === WHITE ? 'White' : 'Black'} Wins!`,
        description: `${this.resignedColor === WHITE ? 'White' : 'Black'} resigned.`
      };
    }
    if (this.isCheckmate()) {
      const winner = getOppositeColor(this.turn);
      return {
        isOver: true,
        winner,
        reason: 'checkmate',
        title: `${winner === WHITE ? 'White' : 'Black'} Wins!`,
        description: `Checkmate against ${this.turn === WHITE ? 'White' : 'Black'}.`
      };
    }
    if (this.isStalemate()) {
      return {
        isOver: true,
        winner: null,
        reason: 'stalemate',
        title: 'Draw by Stalemate',
        description: `${this.turn === WHITE ? 'White' : 'Black'} has no legal moves and is not in check.`
      };
    }
    if (this.isThreefoldRepetition()) {
      return {
        isOver: true,
        winner: null,
        reason: 'threefold_repetition',
        title: 'Draw by Repetition',
        description: 'The exact same board position has occurred three times.'
      };
    }
    if (this.isFiftyMoveRule()) {
      return {
        isOver: true,
        winner: null,
        reason: 'fifty_move_rule',
        title: 'Draw by Fifty-Move Rule',
        description: '50 consecutive moves have occurred without a capture or pawn advance.'
      };
    }
    if (this.isInsufficientMaterial()) {
      return {
        isOver: true,
        winner: null,
        reason: 'insufficient_material',
        title: 'Draw by Insufficient Material',
        description: 'Neither player has enough pieces left to force checkmate.'
      };
    }
    return {
      isOver: false,
      winner: null,
      reason: null,
      title: `${this.turn === WHITE ? 'White' : 'Black'} to Move`,
      description: this.isCheck() ? 'Check!' : 'Game in progress.'
    };
  }

  resign(color) {
    if (this.isGameOver()) return;
    this.resignedColor = color;
  }

  /**
   * Executes a move on the game state.
   * @param {Object} move Move object or { from, to, promotion }
   * @returns {Object|null} Move record with SAN, or null if move was illegal
   */
  makeMove(moveInput) {
    if (this.isGameOver()) return null;

    const legalMoves = this.getLegalMoves();
    const matchedMove = legalMoves.find((m) => {
      const matchesFromTo = m.from === moveInput.from && m.to === moveInput.to;
      if (!matchesFromTo) return false;
      if (m.promotion) {
        return m.promotion === (moveInput.promotion || QUEEN);
      }
      return true;
    });

    if (!matchedMove) {
      return null;
    }

    // Save snapshot for undo
    const snapshot = {
      board: cloneBoard(this.board),
      turn: this.turn,
      castlingRights: { ...this.castlingRights },
      enPassant: this.enPassant,
      halfmoveClock: this.halfmoveClock,
      fullmoveNumber: this.fullmoveNumber,
      capturedPieces: {
        [WHITE]: [...this.capturedPieces[WHITE]],
        [BLACK]: [...this.capturedPieces[BLACK]]
      },
      zobristKey: this.getZobristKey()
    };

    // Track captured piece
    if (matchedMove.capturedPiece) {
      this.capturedPieces[this.turn].push(matchedMove.capturedPiece);
    }

    // Apply move
    const nextState = applyMove(this, matchedMove);
    this.board = nextState.board;
    this.turn = nextState.turn;
    this.castlingRights = nextState.castlingRights;
    this.enPassant = nextState.enPassant;
    this.halfmoveClock = nextState.halfmoveClock;
    this.fullmoveNumber = nextState.fullmoveNumber;

    // Invalidate cached legal moves for the new turn
    this._cachedLegalMoves = null;

    // Calculate checkmate / check status for SAN
    const isCheckmateNow = this.isCheckmate();
    const isCheckNow = !isCheckmateNow && this.isCheck();

    const san = moveToSAN(matchedMove, snapshot, legalMoves, isCheckmateNow, isCheckNow);

    // Update Zobrist repetition counts
    const newHash = this.getZobristKey();
    const currentCount = this.positionCounts.get(newHash) || 0;
    this.positionCounts.set(newHash, currentCount + 1);

    const moveRecord = {
      ...matchedMove,
      san,
      snapshot,
      fenAfter: toFEN(this),
      isCheck: isCheckNow,
      isCheckmate: isCheckmateNow
    };

    this.moveHistory.push(moveRecord);
    this.redoStack = []; // New move invalidates redo history

    return moveRecord;
  }

  /**
   * Undoes the last move.
   * @returns {Object|null} The undone move record
   */
  undoMove() {
    if (this.moveHistory.length === 0) return null;

    const lastMove = this.moveHistory.pop();
    const currentHash = this.getZobristKey();

    // Decrement current Zobrist count
    const count = this.positionCounts.get(currentHash) || 1;
    if (count <= 1) {
      this.positionCounts.delete(currentHash);
    } else {
      this.positionCounts.set(currentHash, count - 1);
    }

    // Restore snapshot
    const snap = lastMove.snapshot;
    this.board = snap.board;
    this.turn = snap.turn;
    this.castlingRights = snap.castlingRights;
    this.enPassant = snap.enPassant;
    this.halfmoveClock = snap.halfmoveClock;
    this.fullmoveNumber = snap.fullmoveNumber;
    this.capturedPieces = snap.capturedPieces;
    this.resignedColor = null;

    this._cachedLegalMoves = null;
    this.redoStack.push(lastMove);

    return lastMove;
  }

  /**
   * Redoes the last undone move.
   * @returns {Object|null}
   */
  redoMove() {
    if (this.redoStack.length === 0) return null;

    const move = this.redoStack.pop();
    return this.makeMove({
      from: move.from,
      to: move.to,
      promotion: move.promotion
    });
  }

  /**
   * Computes captured pieces and material score difference.
   * @returns {{ whiteScore: number, blackScore: number, advantageColor: string|null, advantageValue: number }}
   */
  getMaterialBalance() {
    let whiteTotal = 0;
    let blackTotal = 0;

    for (let sq = 0; sq < 64; sq++) {
      const piece = this.board[sq];
      if (piece) {
        const val = PIECE_VALUES[piece.type] || 0;
        if (piece.color === WHITE) {
          whiteTotal += val;
        } else {
          blackTotal += val;
        }
      }
    }

    const diff = whiteTotal - blackTotal;
    return {
      whiteScore: whiteTotal,
      blackScore: blackTotal,
      advantageColor: diff > 0 ? WHITE : diff < 0 ? BLACK : null,
      advantageValue: Math.abs(diff)
    };
  }

  _recomputeCapturedPiecesFromFEN() {
    const fullSet = {
      [WHITE]: { [PAWN]: 8, [KNIGHT]: 2, [BISHOP]: 2, [ROOK]: 2, [QUEEN]: 1 },
      [BLACK]: { [PAWN]: 8, [KNIGHT]: 2, [BISHOP]: 2, [ROOK]: 2, [QUEEN]: 1 }
    };

    for (let sq = 0; sq < 64; sq++) {
      const piece = this.board[sq];
      if (piece && piece.type !== KING) {
        if (fullSet[piece.color][piece.type] > 0) {
          fullSet[piece.color][piece.type]--;
        }
      }
    }

    // What's missing for Black were captured by White
    for (const [type, count] of Object.entries(fullSet[BLACK])) {
      for (let i = 0; i < count; i++) {
        this.capturedPieces[WHITE].push({ type, color: BLACK });
      }
    }

    // What's missing for White were captured by Black
    for (const [type, count] of Object.entries(fullSet[WHITE])) {
      for (let i = 0; i < count; i++) {
        this.capturedPieces[BLACK].push({ type, color: WHITE });
      }
    }
  }
}
