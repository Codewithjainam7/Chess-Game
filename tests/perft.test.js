/**
 * perft.test.js
 * Perft (Performance Test) move generation correctness tests.
 * Validates that legal move counts exactly match established chess engine ground truths.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFEN, START_FEN } from '../src/js/notation.js';
import { perft } from '../src/js/moveGenerator.js';

test('Perft - Initial Position', async (t) => {
  const state = parseFEN(START_FEN);

  await t.test('Depth 1: 20 nodes', () => {
    assert.equal(perft(1, state), 20);
  });

  await t.test('Depth 2: 400 nodes', () => {
    assert.equal(perft(2, state), 400);
  });

  await t.test('Depth 3: 8,902 nodes', () => {
    assert.equal(perft(3, state), 8902);
  });

  await t.test('Depth 4: 197,281 nodes', () => {
    assert.equal(perft(4, state), 197281);
  });
});

test('Perft - Kiwipete Position (Complex Castling, En Passant & Pins)', async (t) => {
  const KIWIPETE_FEN = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
  const state = parseFEN(KIWIPETE_FEN);

  await t.test('Depth 1: 48 nodes', () => {
    assert.equal(perft(1, state), 48);
  });

  await t.test('Depth 2: 2,039 nodes', () => {
    assert.equal(perft(2, state), 2039);
  });

  await t.test('Depth 3: 97,862 nodes', () => {
    assert.equal(perft(3, state), 97862);
  });
});
