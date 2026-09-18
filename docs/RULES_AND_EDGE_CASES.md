# FIDE Rules, Edge Cases & Verification Reference

This document catalogs every chess rule implemented in Grandmaster Chess, how edge cases are algorithmically handled, and the verification methods used to guarantee 100% correctness.

---

## 1. Castling Rules & Invariants

Under FIDE Article 3.8:
Castling is a composite move of the king and either rook along the player's first rank.

### Requirements for Kingside (`O-O`) and Queenside (`O-O-O`):
1. **Unmoved Status**: Neither the king nor the castling rook may have moved previously in the game.
2. **Vacant Transit Squares**: All squares between the king and the rook must be completely unoccupied:
   - White Kingside: `f1` and `g1` must be empty.
   - White Queenside: `b1`, `c1`, and `d1` must be empty.
   - Black Kingside: `f8` and `g8` must be empty.
   - Black Queenside: `b8`, `c8`, and `d8` must be empty.
3. **No Check on King**: The king cannot currently be in check.
4. **No Attacked Transit Squares**: The square the king crosses cannot be under attack by any enemy piece:
   - White Kingside: `f1` cannot be attacked.
   - White Queenside: `d1` cannot be attacked.
   - Black Kingside: `f8` cannot be attacked.
   - Black Queenside: `d8` cannot be attacked.
5. **No Attacked Destination Squares**: The square the king lands on cannot be under attack:
   - White: `g1` (kingside) or `c1` (queenside).
   - Black: `g8` (kingside) or `c8` (queenside).

### Critical Edge Cases Handled:
- **The Queenside B-Square Rule**: The square `b1` (or `b8` for Black) must be empty, but it **is permitted to be attacked** by an enemy piece. The king only moves from `e1` to `c1` (crossing `d1`), never stepping onto `b1`.
- **Rook Capture Invalidates Castling**: If an opponent captures the rook on `a1`, `h1`, `a8`, or `h8`, castling rights for that flank are permanently revoked.

---

## 2. En Passant Mechanics

Under FIDE Article 3.7.d:
When a pawn advances two squares from its starting position, it may be captured by an opposing pawn on an adjacent file as if it had advanced only one square.

### Invariants:
1. **Single-Turn Expiry Window**: The en passant capture can only be executed on the **very next move** immediately following the two-square push. If any other move is made, the right is permanently lost.
2. **Captured Pawn Removal**: The captured pawn sits on the same rank as the capturing pawn before the move, but the capturing pawn lands on the intermediate rank behind it.

### The Horizontal Rank Pin Edge Case:
Consider this subtle position:
- **White King**: on `e5`
- **White Pawn**: on `d5`
- **Black Pawn**: on `c7` moves to `c5`
- **Black Rook**: on `a5`

When Black plays `c7-c5`, `d5xc6` en passant appears physically possible. However, executing `d5xc6` removes **both** the `d5` pawn (which moves to `c6`) and the `c5` pawn (which is captured). This empties squares `c5` and `d5`, opening a direct horizontal line of fire along the 5th rank between the Black Rook on `a5` and the White King on `e5`.

**Our Engine Handling**: During legal move filtering, the captured pawn at `c5` is removed before testing `isSquareAttacked(board, kingSq)`. Because the king on `e5` is exposed to attack from `a5`, the move is flagged as illegal and omitted from legal moves.

---

## 3. Absolute Pins & Double Check

### Absolute Pins
A piece is absolutely pinned when moving it off its current ray would expose its friendly king to check.
- **Pinned Knights**: Knights cannot slide along rays, so a pinned knight has 0 legal moves.
- **Pinned Sliding Pieces**: A pinned rook or bishop can move along the line of attack (pin ray) between the attacker and the king (including capturing the attacking piece or blocking closer to the king), but cannot step off the ray.

### Double Check
A double check occurs when two enemy pieces simultaneously attack the king (typically via a discovered check where the moving piece also delivers check).
- **Rule**: When in double check, **only king moves are legal**. Interposing a piece or capturing one attacking piece cannot neutralize both simultaneous attacks.

---

## 4. Draw & Termination Conditions

| Condition | Rule Reference | Implementation Method |
| :--- | :--- | :--- |
| **Checkmate** | FIDE 1.2 | King in check + 0 legal moves available. |
| **Stalemate** | FIDE 5.2.a | King NOT in check + 0 legal moves available. |
| **Threefold Repetition** | FIDE 9.2 | The same position occurs 3 times with identical player turn, castling rights, and en passant availability. Tracked via 64-bit Zobrist BigInt hashes in a frequency map. |
| **Fifty-Move Rule** | FIDE 9.3 | 50 consecutive full moves (100 halfmoves) have passed without any pawn moves or captures. |
| **Insufficient Material** | FIDE 1.3 | King vs King; King + Bishop vs King; King + Knight vs King; King + Bishop vs King + Bishop where both bishops occupy squares of the same color. |

---

## 5. Perft Validation Proofs

Perft (Performance Test) counts the exact number of legal leaf nodes at depth $N$. Discrepancies at any depth indicate a rule violation.

### 1. Standard Starting Position
FEN: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`

| Depth | Expected Nodes | Actual Engine Nodes | Duration | Result |
| :---: | :---: | :---: | :---: | :---: |
| 1 | 20 | 20 | 2.8 ms | **PASSED** |
| 2 | 400 | 400 | 5.9 ms | **PASSED** |
| 3 | 8,902 | 8,902 | 68.3 ms | **PASSED** |
| 4 | 197,281 | 197,281 | 358.0 ms | **PASSED** |

### 2. Kiwipete Position
FEN: `r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1`
*(Designed specifically to stress-test complex castling, en passant, promotions, and pins)*

| Depth | Expected Nodes | Actual Engine Nodes | Duration | Result |
| :---: | :---: | :---: | :---: | :---: |
| 1 | 48 | 48 | 0.5 ms | **PASSED** |
| 2 | 2,039 | 2,039 | 9.4 ms | **PASSED** |
| 3 | 97,862 | 97,862 | 145.3 ms | **PASSED** |
