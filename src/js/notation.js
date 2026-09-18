/**
 * notation.js
 * FEN parse/export, SAN move formatting and disambiguation, and PGN export.
 */

import {
  createEmptyBoard,
  squareFromCoords,
  coordsFromSquare,
  squareToAlgebraic,
  algebraicToSquare,
  FILES,
  RANKS
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
  charToPiece,
  pieceToChar
} from './pieces.js';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Parses a FEN string into a game state snapshot.
 * @param {string} fen
 * @returns {Object}
 */
export function parseFEN(fen = START_FEN) {
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 1) {
    throw new Error('Invalid FEN: empty string');
  }

  const piecePlacement = parts[0];
  const turn = (parts[1] && parts[1].toLowerCase() === 'b') ? BLACK : WHITE;
  const castlingStr = parts[2] || '-';
  const epStr = parts[3] || '-';
  const halfmoveClock = parts[4] ? parseInt(parts[4], 10) : 0;
  const fullmoveNumber = parts[5] ? parseInt(parts[5], 10) : 1;

  const board = createEmptyBoard();
  const rows = piecePlacement.split('/');

  if (rows.length !== 8) {
    throw new Error(`Invalid FEN piece placement: expected 8 ranks, got ${rows.length}`);
  }

  // FEN ranks are specified from rank 8 down to rank 1
  for (let r = 0; r < 8; r++) {
    const row = rows[r];
    const rank = 7 - r; // 7 is rank 8, 0 is rank 1
    let file = 0;

    for (let c = 0; c < row.length; c++) {
      const char = row[c];
      const emptyCount = parseInt(char, 10);

      if (!isNaN(emptyCount)) {
        file += emptyCount;
      } else {
        const piece = charToPiece(char);
        if (!piece) {
          throw new Error(`Invalid piece character in FEN: ${char}`);
        }
        if (file > 7) {
          throw new Error(`Invalid FEN: rank ${rank + 1} exceeds 8 squares`);
        }
        const sq = squareFromCoords(file, rank);
        board[sq] = piece;
        file++;
      }
    }
  }

  const castlingRights = {
    wK: castlingStr.includes('K'),
    wQ: castlingStr.includes('Q'),
    bK: castlingStr.includes('k'),
    bQ: castlingStr.includes('q')
  };

  const enPassant = epStr !== '-' ? algebraicToSquare(epStr) : null;

  return {
    board,
    turn,
    castlingRights,
    enPassant,
    halfmoveClock,
    fullmoveNumber
  };
}

/**
 * Converts a game state to a standard 6-field FEN string.
 * @param {Object} state
 * @returns {string}
 */
export function toFEN(state) {
  const { board, turn, castlingRights, enPassant, halfmoveClock, fullmoveNumber } = state;

  const rows = [];
  for (let r = 7; r >= 0; r--) {
    let emptyCount = 0;
    let rowStr = '';

    for (let f = 0; f < 8; f++) {
      const sq = squareFromCoords(f, r);
      const piece = board[sq];

      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        rowStr += pieceToChar(piece);
      }
    }

    if (emptyCount > 0) {
      rowStr += emptyCount;
    }
    rows.push(rowStr);
  }

  const placementStr = rows.join('/');
  const turnStr = turn;

  let castlingStr = '';
  if (castlingRights.wK) castlingStr += 'K';
  if (castlingRights.wQ) castlingStr += 'Q';
  if (castlingRights.bK) castlingStr += 'k';
  if (castlingRights.bQ) castlingStr += 'q';
  if (castlingStr === '') castlingStr = '-';

  const epStr = enPassant !== null && enPassant !== undefined ? squareToAlgebraic(enPassant) : '-';

  return `${placementStr} ${turnStr} ${castlingStr} ${epStr} ${halfmoveClock} ${fullmoveNumber}`;
}

/**
 * Formats a move into Standard Algebraic Notation (SAN).
 * @param {Object} move
 * @param {Object} stateBeforeMove
 * @param {Array<Object>} legalMovesBeforeMove
 * @param {Object} stateAfterMove
 * @param {boolean} isCheckmate
 * @param {boolean} isCheck
 * @returns {string}
 */
export function moveToSAN(move, stateBeforeMove, legalMovesBeforeMove, isCheckmate, isCheck) {
  const { from, to, piece, promotion, isCastleKingside, isCastleQueenside, isEnPassant } = move;

  // 1. Castling
  if (isCastleKingside) {
    return isCheckmate ? 'O-O#' : isCheck ? 'O-O+' : 'O-O';
  }
  if (isCastleQueenside) {
    return isCheckmate ? 'O-O-O#' : isCheck ? 'O-O-O+' : 'O-O-O';
  }

  const targetSquareStr = squareToAlgebraic(to);
  const fromCoords = coordsFromSquare(from);
  const isCapture = move.capturedPiece !== null || isEnPassant;

  let san = '';

  // 2. Pawn moves
  if (piece.type === PAWN) {
    if (isCapture) {
      san += `${FILES[fromCoords.file]}x${targetSquareStr}`;
    } else {
      san += targetSquareStr;
    }

    if (promotion) {
      san += `=${promotion.toUpperCase()}`;
    }
  } else {
    // 3. Piece moves
    const pieceChar = piece.type.toUpperCase();
    san += pieceChar;

    // Disambiguation
    // Find all other legal moves with the same piece type/color to the same destination
    const ambiguousMoves = legalMovesBeforeMove.filter((m) =>
      m.from !== from &&
      m.to === to &&
      m.piece.type === piece.type &&
      m.piece.color === piece.color
    );

    if (ambiguousMoves.length > 0) {
      const sameFile = ambiguousMoves.some((m) => coordsFromSquare(m.from).file === fromCoords.file);
      const sameRank = ambiguousMoves.some((m) => coordsFromSquare(m.from).rank === fromCoords.rank);

      if (!sameFile) {
        // File is unique
        san += FILES[fromCoords.file];
      } else if (!sameRank) {
        // Same file, different ranks -> specify rank
        san += RANKS[fromCoords.rank];
      } else {
        // Both file and rank match another candidate -> specify both
        san += `${FILES[fromCoords.file]}${RANKS[fromCoords.rank]}`;
      }
    }

    if (isCapture) {
      san += 'x';
    }
    san += targetSquareStr;
  }

  // 4. Suffixes
  if (isCheckmate) {
    san += '#';
  } else if (isCheck) {
    san += '+';
  }

  return san;
}

/**
 * Generates PGN file contents from game state.
 * @param {Object} gameState
 * @param {Object} headers Optional PGN headers
 * @returns {string}
 */
export function generatePGN(gameState, headers = {}) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  const result = gameState.getGameResult();

  const standardHeaders = {
    Event: 'Casual Game',
    Site: 'Grandmaster Chess PWA',
    Date: dateStr,
    Round: '1',
    White: 'White',
    Black: 'Black',
    Result: result || '*',
    ...headers
  };

  if (gameState.initialFEN && gameState.initialFEN !== START_FEN) {
    standardHeaders['SetUp'] = '1';
    standardHeaders['FEN'] = gameState.initialFEN;
  }

  let pgn = '';
  for (const [key, value] of Object.entries(standardHeaders)) {
    pgn += `[${key} "${value}"]\n`;
  }
  pgn += '\n';

  // Format move pairs
  const moves = gameState.moveHistory || [];
  let moveLine = '';

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    if (i % 2 === 0) {
      const moveNum = Math.floor(i / 2) + 1;
      moveLine += `${moveNum}. ${move.san} `;
    } else {
      moveLine += `${move.san} `;
    }

    if (moveLine.length > 70) {
      pgn += moveLine.trim() + '\n';
      moveLine = '';
    }
  }

  if (moveLine.length > 0) {
    pgn += moveLine.trim() + ' ';
  }

  pgn += (result || '*') + '\n';
  return pgn;
}
