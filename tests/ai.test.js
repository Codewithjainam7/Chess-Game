/**
 * ai.test.js
 * Unit tests for the chess AI engine:
 * Validates tactical awareness, mate-in-one execution, free piece captures, and move legality.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../src/js/gameState.js';
import { getAIMove, evaluateBoard } from '../src/js/ai.js';
import { algebraicToSquare, squareToAlgebraic } from '../src/js/board.js';
import { WHITE, BLACK } from '../src/js/pieces.js';

test('Chess AI Engine Tests', async (t) => {
  await t.test('AI returns a valid legal move in starting position', () => {
    const game = new GameState();
    const move = getAIMove(game, 'medium');
    assert.ok(move, 'AI returns a move');
    const legalMoves = game.getLegalMoves();
    const isLegal = legalMoves.some((m) => m.from === move.from && m.to === move.to);
    assert.ok(isLegal, 'Move returned by AI is strictly legal');
  });

  await t.test('AI finds immediate mate-in-one', () => {
    // Scholar's Mate setup: White Queen on h5, Bishop on c4, Black King on e8.
    // Move Qxf7# is checkmate!
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4';
    const game = new GameState(fen);

    const bestMove = getAIMove(game, 'hard');
    assert.ok(bestMove);
    assert.equal(squareToAlgebraic(bestMove.from), 'h5');
    assert.equal(squareToAlgebraic(bestMove.to), 'f7');

    const result = game.makeMove(bestMove);
    assert.ok(result.isCheckmate, 'AI delivers Qxf7# checkmate');
  });

  await t.test('AI captures hanging high-value piece (free Queen)', () => {
    // White knight on f3 can capture unprotected Black Queen on e5
    // Black Queen on e5, White Knight on f3, Black King on e8, White King on e1
    const fen = '4k3/8/8/4q3/8/5N2/8/4K3 w - - 0 1';
    const game = new GameState(fen);

    const bestMove = getAIMove(game, 'medium');
    assert.ok(bestMove);
    assert.equal(squareToAlgebraic(bestMove.from), 'f3');
    assert.equal(squareToAlgebraic(bestMove.to), 'e5');
  });

  await t.test('Board evaluation reflects material disparity', () => {
    // Position where White is up a Queen
    const fenWhiteUp = '4k3/8/8/8/8/8/8/4K2Q w - - 0 1';
    const fenEqual = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
    const fenBlackUp = '4k2q/8/8/8/8/8/8/4K3 w - - 0 1';

    const gameWhite = new GameState(fenWhiteUp);
    const gameEqual = new GameState(fenEqual);
    const gameBlack = new GameState(fenBlackUp);

    assert.ok(evaluateBoard(gameWhite.board) > evaluateBoard(gameEqual.board));
    assert.ok(evaluateBoard(gameBlack.board) < evaluateBoard(gameEqual.board));
  });
});
