/**
 * rules.test.js
 * Comprehensive unit tests for special chess rules and edge cases:
 * Castling, En Passant, Promotion, Pins, Double Check,
 * Checkmate, Stalemate, Threefold Repetition, 50-move rule, Insufficient Material, and Undo/Redo.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../src/js/gameState.js';
import { parseFEN, START_FEN } from '../src/js/notation.js';
import { generateLegalMoves } from '../src/js/moveGenerator.js';
import { squareToAlgebraic, algebraicToSquare } from '../src/js/board.js';
import { WHITE, BLACK, QUEEN, ROOK, BISHOP, KNIGHT } from '../src/js/pieces.js';

test('Castling Rules and Edge Cases', async (t) => {
  await t.test('Cannot castle while in check', () => {
    // White king on e1, rooks on a1 and h1, black rook on e8 checking e1
    const fen = '4r3/8/8/8/8/8/8/R3K2R w KQ - 0 1';
    const game = new GameState(fen);
    const moves = game.getLegalMoves();
    const castles = moves.filter((m) => m.isCastleKingside || m.isCastleQueenside);
    assert.equal(castles.length, 0, 'Cannot castle when king is under check');
  });

  await t.test('Cannot castle through an attacked square', () => {
    // White king on e1, black rook on f8 attacking f1 (passing square)
    const fen = '5r2/8/8/8/8/8/8/R3K2R w KQ - 0 1';
    const game = new GameState(fen);
    const moves = game.getLegalMoves();
    const kingsideCastle = moves.find((m) => m.isCastleKingside);
    assert.equal(kingsideCastle, undefined, 'Cannot castle through attacked square f1');
    // Queenside castle should still be legal
    const queensideCastle = moves.find((m) => m.isCastleQueenside);
    assert.ok(queensideCastle, 'Queenside castling is legal when path is safe');
  });

  await t.test('Cannot castle into check', () => {
    // White king on e1, black rook on g8 attacking g1 (destination square)
    const fen = '6r1/8/8/8/8/8/8/R3K2R w KQ - 0 1';
    const game = new GameState(fen);
    const moves = game.getLegalMoves();
    const kingsideCastle = moves.find((m) => m.isCastleKingside);
    assert.equal(kingsideCastle, undefined, 'Cannot castle into check on g1');
  });

  await t.test('Can castle queenside even if b1 is attacked (b1 is not crossed by king)', () => {
    // Black rook on b8 attacking b1. King moves e1 -> c1, crossing d1. b1 is attacked, but king never steps on b1!
    const fen = '1r6/8/8/8/8/8/8/R3K2R w KQ - 0 1';
    const game = new GameState(fen);
    const moves = game.getLegalMoves();
    const queensideCastle = moves.find((m) => m.isCastleQueenside);
    assert.ok(queensideCastle, 'Queenside castling is legal even when b1 is attacked');
  });

  await t.test('Cannot castle if pieces are between king and rook', () => {
    // Bishop on f1 blocks kingside castling
    const fen = 'r3k2r/8/8/8/8/8/8/R3KB1R w KQkq - 0 1';
    const game = new GameState(fen);
    const moves = game.getLegalMoves();
    const kingsideCastle = moves.find((m) => m.isCastleKingside);
    assert.equal(kingsideCastle, undefined, 'Cannot castle when pieces block the path');
  });
});

test('En Passant Rules and Edge Cases', async (t) => {
  await t.test('Valid en passant capture immediately following double push', () => {
    // White pawn on e5, Black pawn on d7 moves d7-d5
    const game = new GameState('rnbqkbnr/pppp1ppp/8/4P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2');
    const moveResult = game.makeMove({
      from: algebraicToSquare('d7'),
      to: algebraicToSquare('d5')
    });
    assert.ok(moveResult, 'Black plays d5');
    assert.equal(squareToAlgebraic(game.enPassant), 'd6', 'En passant target square is d6');

    // White captures en passant exd6
    const whiteMoves = game.getLegalMoves();
    const epMove = whiteMoves.find((m) => m.isEnPassant);
    assert.ok(epMove, 'En passant move is available');
    assert.equal(squareToAlgebraic(epMove.to), 'd6');

    const epResult = game.makeMove(epMove);
    assert.ok(epResult);
    assert.equal(epResult.san, 'exd6');
    assert.equal(game.board[algebraicToSquare('d5')], null, 'Captured black pawn at d5 is removed from board');
  });

  await t.test('En passant expires after one turn', () => {
    const game = new GameState('rnbqkbnr/pppp1ppp/8/4P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2');
    // Black plays d5
    game.makeMove({ from: algebraicToSquare('d7'), to: algebraicToSquare('d5') });
    assert.equal(squareToAlgebraic(game.enPassant), 'd6');

    // White plays a waiting move a2-a3 instead of capturing en passant
    game.makeMove({ from: algebraicToSquare('a2'), to: algebraicToSquare('a3') });
    assert.equal(game.enPassant, null, 'En passant target expired');

    // Black plays a waiting move h7-h6
    game.makeMove({ from: algebraicToSquare('h7'), to: algebraicToSquare('h6') });

    // White can no longer capture exd6
    const epMove = game.getLegalMoves().find((m) => m.isEnPassant);
    assert.equal(epMove, undefined, 'En passant no longer legal on subsequent turn');
  });

  await t.test('En passant horizontal pin edge case', () => {
    // Classic rank pin: White King on e5, White pawn on d5, Black pawn on c5, Black Rook on a5
    // FEN: Black just played c7-c5. If White pawn captures cxd6 e.p., both d5 and c5 disappear, leaving White King on e5 in check from Ra5!
    const fen = '8/8/8/r1pKP3/8/8/8/8 w - c6 0 1';
    // White king at d5? Wait, let's place:
    // White King at e5, White Pawn at f5, Black Pawn at g5, Black Rook at h5?
    // Let's verify: White King on e5, White Pawn on d5, Black Pawn on c5, Black Rook on a5:
    // Board rank 5: a5:r, b5:empty, c5:p, d5:P, e5:K
    // If White pawn on d5 takes dxc6 e.p.:
    // pawn at d5 moves to c6 (rank 6). Pawn at c5 is captured.
    // Rank 5 now has: a5:r, b5:empty, c5:empty, d5:empty, e5:K!
    // The black rook at a5 has a completely unobstructed ray to the white king at e5!
    // Therefore, dxc6 e.p. leaves the white king in check and MUST be illegal!
    const pinFen = '8/8/8/r1PpK3/8/8/8/8 w - c6 0 1';
    const game = new GameState(pinFen);
    const legalMoves = game.getLegalMoves();
    const epMove = legalMoves.find((m) => m.isEnPassant);
    assert.equal(epMove, undefined, 'En passant capture is illegal due to horizontal rank pin');
  });
});

test('Pawn Promotion', async (t) => {
  await t.test('Pawn can promote to Queen, Rook, Bishop, Knight', () => {
    // White pawn on a7
    const fen = '8/P7/8/8/8/8/8/4K2k w - - 0 1';
    const game = new GameState(fen);
    const moves = game.getLegalMoves();
    const promotions = moves.filter((m) => m.promotion !== null);
    assert.equal(promotions.length, 4, 'Should have 4 promotion options (Q, R, B, N)');

    const queenProm = promotions.find((m) => m.promotion === QUEEN);
    assert.ok(queenProm);
    const result = game.makeMove(queenProm);
    assert.equal(result.san, 'a8=Q+');
    assert.equal(game.board[algebraicToSquare('a8')].type, QUEEN);
  });
});

test('Absolute Pins and Double Check', async (t) => {
  await t.test('Absolute pin prevents pinned knight from moving', () => {
    // White King on e1, White Knight on e2, Black Rook on e8
    const fen = '4r3/8/8/8/8/8/4N3/4K3 w - - 0 1';
    const game = new GameState(fen);
    const knightMoves = game.getLegalMoves(algebraicToSquare('e2'));
    assert.equal(knightMoves.length, 0, 'Pinned knight cannot move and expose king');
  });

  await t.test('Pinned rook can only move along the pin ray', () => {
    // White King on e1, White Rook on e4, Black Rook on e8
    const fen = '4r3/8/8/8/4R3/8/8/4K3 w - - 0 1';
    const game = new GameState(fen);
    const rookMoves = game.getLegalMoves(algebraicToSquare('e4'));
    // Can move to e2, e3, e5, e6, e7, e8 (all on e-file)
    for (const m of rookMoves) {
      assert.equal(m.to % 8, 4, 'Rook can only move along e-file (pin ray)');
    }
    assert.ok(rookMoves.length > 0);
  });

  await t.test('Double check requires king move', () => {
    // White king on e1 in double check by Black Knight on d3 and Black Rook on e8
    const fen = '4r3/8/8/8/8/3n4/8/4K3 w - - 0 1';
    const game = new GameState(fen);
    assert.ok(game.isCheck());
    const moves = game.getLegalMoves();
    for (const m of moves) {
      assert.equal(m.piece.type, 'k', 'Only king moves are legal under double check');
    }
  });
});

test('Game Termination Detection', async (t) => {
  await t.test("Fool's Mate checkmate detection", () => {
    const game = new GameState();
    // 1. f3 e5 2. g4 Qh4#
    game.makeMove({ from: algebraicToSquare('f2'), to: algebraicToSquare('f3') });
    game.makeMove({ from: algebraicToSquare('e7'), to: algebraicToSquare('e5') });
    game.makeMove({ from: algebraicToSquare('g2'), to: algebraicToSquare('g4') });
    const lastMove = game.makeMove({ from: algebraicToSquare('d8'), to: algebraicToSquare('h4') });

    assert.equal(lastMove.san, 'Qh4#');
    assert.ok(game.isCheckmate());
    assert.ok(game.isGameOver());
    assert.equal(game.getGameResult(), '0-1');
    assert.equal(game.getGameStatus().winner, BLACK);
  });

  await t.test('Stalemate detection', () => {
    // Famous stalemate position: White King on h1, Black King on f2, Black Queen on g3
    // Black just played, White King on h1 has no legal moves and is not in check
    const fen = '7k/8/8/8/8/6q1/5K2/8 w - - 0 1'; // Wait, let's use exact stalemate:
    // White King on a8, Black King on c7, Black Queen on b6 -> White to move has 0 moves and not in check
    const stalemateFen = 'k7/2K5/1Q6/8/8/8/8/8 b - - 0 1';
    const game = new GameState(stalemateFen);
    assert.ok(!game.isCheck(), 'Not in check');
    assert.equal(game.getLegalMoves().length, 0, 'No legal moves');
    assert.ok(game.isStalemate());
    assert.ok(game.isGameOver());
    assert.equal(game.getGameResult(), '1/2-1/2');
    assert.equal(game.getGameStatus().reason, 'stalemate');
  });

  await t.test('Threefold repetition with Zobrist hashing', () => {
    const game = new GameState();
    // Knights shuffle: 1. Nf3 Nf6 2. Ng1 Ng8 3. Nf3 Nf6 4. Ng1 Ng8
    const moves = [
      ['g1', 'f3'], ['g8', 'f6'],
      ['f3', 'g1'], ['f6', 'g8'], // 2nd occurrence of initial position
      ['g1', 'f3'], ['g8', 'f6'],
      ['f3', 'g1'], ['f6', 'g8']  // 3rd occurrence of initial position
    ];

    for (const [from, to] of moves) {
      game.makeMove({ from: algebraicToSquare(from), to: algebraicToSquare(to) });
    }

    assert.ok(game.isThreefoldRepetition(), 'Game ends in draw by threefold repetition');
    assert.ok(game.isGameOver());
    assert.equal(game.getGameResult(), '1/2-1/2');
    assert.equal(game.getGameStatus().reason, 'threefold_repetition');
  });

  await t.test('Fifty-move rule detection', () => {
    // 99 halfmoves without capture or pawn advance
    const fen = '4k3/8/8/8/8/8/8/4K2R w - - 99 50';
    const game = new GameState(fen);
    assert.ok(!game.isFiftyMoveRule());

    // King move increments to 100
    game.makeMove({ from: algebraicToSquare('e1'), to: algebraicToSquare('e2') });
    assert.equal(game.halfmoveClock, 100);
    assert.ok(game.isFiftyMoveRule());
    assert.ok(game.isGameOver());
    assert.equal(game.getGameResult(), '1/2-1/2');
  });

  await t.test('Insufficient material scenarios', () => {
    // King vs King
    assert.ok(new GameState('4k3/8/8/8/8/8/8/4K3 w - - 0 1').isInsufficientMaterial());

    // King + Knight vs King
    assert.ok(new GameState('4k3/8/8/8/8/8/4N3/4K3 w - - 0 1').isInsufficientMaterial());

    // King + Bishop vs King
    assert.ok(new GameState('4k3/8/8/8/8/8/4B3/4K3 w - - 0 1').isInsufficientMaterial());

    // King + Bishop vs King + Bishop (same color square bishops: c1 dark, e7 dark)
    assert.ok(new GameState('4k3/4b3/8/8/8/8/8/2B1K3 w - - 0 1').isInsufficientMaterial(), 'Same color bishops is insufficient');

    // King + Bishop vs King + Bishop (opposite color: c1 dark, f7 light -> NOT insufficient)
    assert.ok(!new GameState('4k3/5b2/8/8/8/8/8/2B1K3 w - - 0 1').isInsufficientMaterial(), 'Opposite color bishops is not insufficient');

    // King + Pawn vs King (sufficient material)
    assert.ok(!new GameState('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1').isInsufficientMaterial(), 'Pawn is sufficient material');

    // King + Rook vs King (sufficient material)
    assert.ok(!new GameState('4k3/8/8/8/8/8/8/R3K3 w - - 0 1').isInsufficientMaterial(), 'Rook is sufficient material');
  });
});

test('Undo and Redo Functionality', async (t) => {
  await t.test('Undo restores board state, turn, and redo re-applies', () => {
    const game = new GameState();
    const m1 = game.makeMove({ from: algebraicToSquare('e2'), to: algebraicToSquare('e4') });
    assert.equal(m1.san, 'e4');
    assert.equal(game.turn, BLACK);

    const m2 = game.makeMove({ from: algebraicToSquare('e7'), to: algebraicToSquare('e5') });
    assert.equal(m2.san, 'e5');
    assert.equal(game.turn, WHITE);

    // Undo Black move
    const undone2 = game.undoMove();
    assert.equal(undone2.san, 'e5');
    assert.equal(game.turn, BLACK);
    assert.equal(game.board[algebraicToSquare('e5')], null);
    assert.ok(game.board[algebraicToSquare('e7')]);

    // Redo Black move
    const redone2 = game.redoMove();
    assert.equal(redone2.san, 'e5');
    assert.equal(game.turn, WHITE);
    assert.ok(game.board[algebraicToSquare('e5')]);
  });
});
