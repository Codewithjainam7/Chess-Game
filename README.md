# ♟️ Grandmaster Chess PWA

[![CI](https://github.com/Codewithjainam7/Chess-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/Codewithjainam7/Chess-Game/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/Codewithjainam7/Chess-Game/actions/workflows/deploy.yml/badge.svg)](https://github.com/Codewithjainam7/Chess-Game/actions/workflows/deploy.yml)

A high-performance, mobile-first, offline-capable Progressive Web App (PWA) chess game built from scratch using pure HTML5, CSS3, and vanilla JavaScript (ES modules). Zero dependencies, zero external frameworks, and 100% compliant with official FIDE chess rules.

---

## 🌟 Key Highlights

- **100% FIDE Rule Correctness**: Verified with official Perft tests (Start Position depths 1–4 and Kiwipete depths 1–3).
- **Special Moves Fully Implemented**: Castling (with check/through-check/blocker validation), En Passant (with 1-turn expiry and rank pin detection), and Pawn Promotion (interactive modal with Queen, Rook, Bishop, Knight choices).
- **Full Draw & End-Game Detection**: Checkmate, Stalemate, Threefold Repetition (via 64-bit BigInt Zobrist Hashing), Fifty-Move Rule, and Insufficient Material (K vs K, K+N vs K, K+B vs K, and K+B vs K+B on same-colored squares).
- **Mobile-First & App-Ready**: Built from the ground up for touch devices with CSS Grid, fluid `clamp()` sizing, `aspect-ratio: 1 / 1`, safe-area insets, and `>= 44x44px` touch targets.
- **Dual Input Modes**: Seamlessly switch between tap-to-select / tap-to-move and drag-and-drop on any device.
- **Synthesized Audio Engine**: Procedural sound effects generated natively in-browser via the Web Audio API (move, capture, check, castle, game over) with zero external audio assets required.
- **Intelligent AI Opponent**: Play against a chess engine powered by Minimax with Alpha-Beta Pruning, Piece-Square Tables (PST), Quiescence search, and 3 selectable difficulty levels (Easy, Medium, Hard). Supports playing as White or Black, or switching to 2-Player Pass & Play mode.
- **PWA & Offline First**: Cache-first Service Worker and Web App Manifest allow instant installation on iOS, Android, and Desktop with full offline playability.
- **App-Conversion Ready**: Zero browser-specific window calls, making it instantly wrap-ready into native Android and iOS apps with Capacitor or Cordova.

---

## 📚 Deep-Dive Documentation

For detailed technical specifications and guides, consult the dedicated documentation in `/docs`:

- **[System Architecture & Design Patterns](docs/ARCHITECTURE.md)**: Component dependency diagrams, engine decoupling rationale, two-tier move pipeline, state lifecycle, and procedural Web Audio synthesis mechanics.
- **[FIDE Rules, Edge Cases & Verification Reference](docs/RULES_AND_EDGE_CASES.md)**: Castling validation invariants, the en passant horizontal rank-pin proof, threefold repetition hashing, and official Perft test results.
- **[Native Mobile App Conversion Guide](docs/NATIVE_APP_WRAPPER_GUIDE.md)**: Step-by-step Capacitor setup, iOS Xcode configuration, Android Studio APK/AAB signing, and WebView performance rules.
- **[Contributing Guidelines](docs/CONTRIBUTING.md)**: Development setup, local testing instructions, code style, and test suite requirements.

---

## 🏗️ Architecture Overview

The codebase is organized into focused, modular ES modules with single responsibilities:

```
/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Automated lint and Perft/Rules test suite
│       └── deploy.yml          # GitHub Pages automated static deployment
├── src/
│   ├── assets/
│   │   └── icons/              # PWA icons (192x192, 512x512, maskable, SVG)
│   ├── css/
│   │   ├── styles.css          # Design system, CSS variables, board grid, components
│   │   └── responsive.css      # Mobile, tablet, desktop, and landscape media queries
│   └── js/
│       ├── board.js            # 8x8 mailbox board state, coordinates, conversions
│       ├── pieces.js           # Piece constants, valuations, Staunton vector SVGs
│       ├── moveGenerator.js    # Pseudo-legal move gen, check tests, legal move filtering
│       ├── gameState.js        # Game loop, turn management, draw conditions, history
│       ├── notation.js         # FEN parse/export, SAN formatting, PGN generation
│       ├── zobrist.js          # Deterministic 64-bit Zobrist position hashing
│       ├── ui.js               # Board rendering, dual drag/tap input, Web Audio, modals
│       └── main.js             # Bootstrap, lifecycle wiring, Service Worker registration
├── tests/
│   ├── perft.test.js           # Perft move generation correctness tests
│   └── rules.test.js           # Special rules, pins, double check, end-games, undo/redo
├── scripts/
│   ├── generate-icons.js       # Standalone PNG generator for PWA assets
│   ├── lint.js                 # Syntax validation script
│   └── serve.js                # Zero-dependency local dev server
├── manifest.json               # Progressive Web App manifest
├── service-worker.js           # Cache-first offline service worker
├── index.html                  # Accessible app shell and dialog templates
├── package.json                # Project scripts and configuration
└── README.md                   # Comprehensive technical documentation
```

### Module Separation Rationale
1. **Engine vs. UI Decoupling**: `moveGenerator.js`, `board.js`, and `gameState.js` have zero dependencies on the DOM or browser APIs. They can run headlessly in Node.js, Web Workers, or CI test runners without modification.
2. **Deterministic State Hashing**: `zobrist.js` is isolated so that any board position can be quickly fingerprinted to enforce the threefold repetition rule without serializing entire game trees.
3. **Dedicated Notation Module**: `notation.js` handles FEN and SAN independently so game recording, serialization, and clipboard sharing remain clean and testable.
4. **Resilient Presentation Layer**: `ui.js` handles rendering and pointer gestures without modifying core game logic directly.

---

## 🧠 Algorithms & Design Tradeoffs

### 1. 8x8 Mailbox Board vs. Bitboards
- **Chosen Representation**: A 64-element 1D mailbox array (`0..63`), where `square = rank * 8 + file`.
- **Tradeoff Analysis**: Bitboards (`BigUint64Array`) are exceptional for chess engines computing millions of nodes per second in search trees. However, for a 2-player client-side game where move evaluation happens per human turn, a 64-element array offers:
  - Extreme readability and zero bitwise complexity.
  - Direct object/null inspection (`board[sq]?.color === turn`).
  - Native JSON and FEN serialization.
  - Microsecond-level legal move calculation well under 1ms, far exceeding 60fps requirements.

### 2. Pseudo-Legal vs. Legal Move Generation
Move generation uses a two-stage pipeline:
1. **Pseudo-Legal Generation**: Generates all physically possible moves for sliding pieces, knights, pawns, and kings according to piece geometry and board bounds, without considering whether the mover's king is left in check.
2. **Legal Move Filtering**: For each pseudo-legal move, the move is simulated on the board. The opponent's attack map is checked against the friendly king's square (`isSquareAttacked`). If the king is under attack, the move is pruned.
- **In-Place Board Simulation**: During simulation, moves are applied and unmade in-place on the array, eliminating garbage collection overhead during deep recursive Perft tests.

### 3. Zobrist Hashing for Threefold Repetition
- Standard FIDE threefold repetition specifies that a position is a draw if the exact same board configuration occurs three times with the same active player, the same castling rights, and the same en passant opportunity.
- **Algorithm**: A table of 64-bit random integers is generated deterministically using a SplitMix64 PRNG. Each piece-square pair, side-to-move, castling flag, and en passant file is mapped to a 64-bit `BigInt`.
- Combining these components via bitwise XOR (`^`) yields a unique 64-bit fingerprint of the state. These hashes are tracked in a frequency map (`positionCounts`) in $O(1)$ time per move.

### 4. Perft (Performance Test) Correctness Proof
Perft is the gold standard for validating chess move generation correctness. It recursively traverses the game tree to a specified depth and counts all leaf nodes. A single rule error (such as failing an en passant rank pin or incorrectly permitting castling through check) cascades exponentially into node count discrepancies.

Our engine passes all canonical test points:
- **Standard Starting Position**:
  - Depth 1: `20`
  - Depth 2: `400`
  - Depth 3: `8,902`
  - Depth 4: `197,281`
- **Kiwipete Complex Position** (`r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1`):
  - Depth 1: `48`
  - Depth 2: `2,039`
  - Depth 3: `97,862`

---

## 📊 Data Structures

### 1. Board Array
- `Array<Piece | null>` of length 64.
- `Piece`: `{ type: 'p'|'n'|'b'|'r'|'q'|'k', color: 'w'|'b' }`
- Coordinates: `square = rank * 8 + file` (where file 0 = `a`, file 7 = `h`, rank 0 = `1`, rank 7 = `8`).

### 2. Move Object
```javascript
{
  from: 12,                  // square index 0..63 (e.g. e2)
  to: 28,                    // square index 0..63 (e.g. e4)
  piece: { type: 'p', color: 'w' },
  capturedPiece: null,       // Piece object or null
  promotion: null,           // 'q' | 'r' | 'b' | 'n' | null
  isEnPassant: false,        // boolean
  isCastleKingside: false,   // boolean
  isCastleQueenside: false,  // boolean
  san: "e4"                  // generated SAN string (e.g., "Nbd7", "O-O", "Qh4#")
}
```

### 3. Game State Snapshot
```javascript
{
  board: Array(64),
  turn: 'w' | 'b',
  castlingRights: { wK: true, wQ: true, bK: true, bQ: true },
  enPassant: number | null,  // square index of target or null
  halfmoveClock: 0,          // 50-move rule counter
  fullmoveNumber: 1,         // increments after Black's move
  capturedPieces: { w: [], b: [] },
  zobristKey: "1234567890..."
}
```

---

## ⚡ Special Rules Implementation

### 1. Castling
- **Prerequisites**: Neither king nor target rook has moved.
- **Path Clearance**: All squares between king and rook must be empty.
- **Safety**: King cannot castle out of check, cannot pass through any square attacked by enemy pieces, and cannot land on an attacked square.
- **Queenside B-square Rule**: On queenside castling (`O-O-O`), the `b1`/`b8` square must be empty, but it *is* allowed to be attacked because the king never steps on or crosses the b-file.

### 2. En Passant
- When a pawn advances two squares from its starting rank, `enPassant` is set to the square it skipped over.
- On the very next halfmove only, an opposing pawn on an adjacent file on the same rank can capture diagonally to that target square.
- If not captured immediately, the opportunity expires and `enPassant` resets to `null`.
- **Rank Pin Edge Case**: When en passant is simulated, both the capturing pawn and the captured pawn leave the rank simultaneously. If this opens a line of sight between an enemy rook/queen and the friendly king on that same rank, the capture is strictly illegal.

### 3. Pawn Promotion
- When a pawn reaches the 8th rank (rank index 7 for White) or 1st rank (rank index 0 for Black), pseudo-legal move generation creates 4 distinct legal options: Queen, Rook, Bishop, Knight.
- The UI intercepts pawn promotion before execution and displays an accessible modal with large tap targets (>= 56px) for instantaneous choice.

---

## 📱 Mobile-First Design & PWA Architecture

### Mobile Touch & Responsive Grid
- The board layout is defined via CSS Grid with `aspect-ratio: 1 / 1` and fluid viewport-based dimensions (`clamp(280px, 94vw, 560px)`).
- **Touch Targets**: All interactive elements (buttons, squares, promotion options) meet or exceed the mobile accessibility standard of `44x44px`.
- **Gesture Protection**: `touch-action: none` on the board container and draggable pieces prevents accidental scroll gestures or pull-to-refresh conflicts during play.
- **Reflow Layout**:
  - **Mobile Portrait (< 768px)**: Stacked layout with top player bar, board, bottom player bar, and controls/history below.
  - **Tablet & Desktop (>= 768px)**: Side-by-side arrangement with board on the left and full-height move history/controls on the right.
  - **Landscape Mobile**: Ultra-compact landscape view maximizing board height (`80vh`).

### Offline PWA & Service Worker
- `manifest.json`: Configured with `display: "standalone"`, `theme_color: "#0f172a"`, and vector/raster icons (192, 512, maskable).
- `service-worker.js`: Employs a **Cache-First** strategy for all static assets (`.html`, `.css`, `.js`, icons). Once visited, the game works 100% offline without any network connectivity.

---

## 🚀 Native App Conversion Guide (Capacitor)

This codebase was intentionally designed with zero browser-dependent APIs (`window.open`, browser chrome assumptions, or external CDNs). Wrapping this project into a native Android APK or iOS app requires **zero code rewrites**.

### Conversion Steps (Using Capacitor)
1. In the project root, initialize Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init "Grandmaster Chess" "com.grandmaster.chess" --web-dir "."
   ```
2. Add the desired mobile platforms:
   ```bash
   npm install @capacitor/android @capacitor/ios
   npx cap add android
   npx cap add ios
   ```
3. Sync web assets:
   ```bash
   npx cap sync
   ```
4. Open the native projects in Android Studio or Xcode:
   ```bash
   npx cap open android
   npx cap open ios
   ```

> [!IMPORTANT]
> **Wrap Compatibility Rules**:
> - Keep asset paths relative (`./src/...` instead of `/src/...`).
> - Do not introduce external CDN dependencies (keep all fonts, scripts, and SVGs local).
> - Do not call `window.open()` or `window.close()`. Use in-app modals.

---

## 🔄 CI/CD Automation

### 1. Continuous Integration (`ci.yml`)
- **Trigger**: Every `push` and `pull_request` to `main`.
- **Actions**:
  1. Installs Node.js 22.
  2. Executes `npm run lint` (cross-platform syntax check on all JS files).
  3. Executes `npm test` running the full Perft and rules test suites.
  4. Fails the build immediately if any test fails or unexpected node count occurs.

### 2. Continuous Deployment (`deploy.yml`)
- **Trigger**: Push/merge to `main`.
- **Actions**:
  1. Deploys static files directly to GitHub Pages using official GitHub Actions (`actions/deploy-pages@v4`).
  2. Runs with minimal least-privilege token permissions (`pages: write`, `id-token: write`).

---

## 📖 Technologies & Concepts Glossary

- **FEN (Forsyth–Edwards Notation)**: A standard single-line notation string describing a complete chess board position and game status.
- **SAN (Standard Algebraic Notation)**: The human-readable format used by FIDE to record moves (e.g., `e4`, `Nf3`, `O-O`, `exd5`, `Qxf7#`).
- **PGN (Portable Game Notation)**: A standardized text file format for saving chess games, complete with metadata headers and move history.
- **Zobrist Hashing**: A fast, deterministic hashing algorithm that fingerprints chess positions using bitwise XOR operations to identify threefold repetition.
- **Perft Testing**: A debugging algorithm that counts all legal move trajectories to a given depth to systematically verify move generation correctness.
- **Mailbox Representation**: An array-based data structure where each board square is represented by an index in memory.
- **Service Worker**: A script that runs in the background of a web browser to cache assets and provide offline functionality.
- **CSS Grid**: A two-dimensional layout system in CSS used here to render the 8x8 chessboard with pixel-perfect responsive scaling.
- **`touch-action: none`**: A CSS property that prevents default touch gestures (such as scrolling and pinch-zooming) on interactive board elements.
- **Web Audio API**: A browser API used to procedurally synthesize sound effects in real time without external audio files.
