# Contributing to Grandmaster Chess

Thank you for your interest in contributing! This project is maintained as a pure vanilla JavaScript, zero-dependency, mobile-first PWA chess game adhering to official FIDE standards.

---

## 1. Development Setup

The project requires **no build tools** and **no bundlers**. All you need is Node.js v18 or newer:

```bash
# Clone the repository
git clone https://github.com/Codewithjainam7/Chess-Game.git
cd Chess-Game

# Install any optional tooling (if applicable)
npm install
```

---

## 2. Running the Local Development Server

Start the zero-dependency local dev server:
```bash
npm start
# Server starts at http://localhost:3000/
```

Alternatively, open `index.html` via any static HTTP server (e.g., Python's `python -m http.server 3000` or VS Code Live Server).

---

## 3. Running the Test Suite

Before submitting any code changes, ensure all tests pass cleanly:

```bash
# Run syntax checks
npm run lint

# Run the complete test suite (Perft + Rules)
npm test
```

### Important Verification Rules:
- **Never bypass Perft tests**: If move generation is modified, both the Starting Position and Kiwipete Perft suites must match exact node counts down to depth 4 and depth 3 respectively.
- **Maintain Engine Decoupling**: Code in `src/js/moveGenerator.js`, `src/js/board.js`, and `src/js/gameState.js` must never reference `document`, `window`, or DOM elements.

---

## 4. Coding Conventions

- **Module Format**: Standard ES modules (`import`/`export`).
- **Styling**: Vanilla CSS utilizing CSS Custom Properties (`var(--...)`) defined in `styles.css`.
- **Accessibility**: All touch targets must maintain a minimum bounding box of 44x44px.
- **PWA & Offline**: Keep all asset references relative (`./`) so they work offline and in native WebView wrappers.
