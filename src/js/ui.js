/**
 * ui.js
 * Board rendering, dual interaction (tap-to-move & drag-and-drop),
 * Web Audio procedural sound synthesis, modals, and responsive views.
 */

import {
  coordsFromSquare,
  squareFromCoords,
  isLightSquare,
  FILES,
  RANKS
} from './board.js';
import {
  WHITE,
  BLACK,
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,
  getPieceSVG
} from './pieces.js';
import { moveToSAN, generatePGN, toFEN } from './notation.js';
import { getAIMove } from './ai.js';
import { VictoryCelebration } from './confetti.js';

// Procedural Web Audio Sound Generator
class SoundManager {
  constructor() {
    this.enabled = localStorage.getItem('chess_sound_enabled') !== 'false';
    this.ctx = null;
  }

  _initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('chess_sound_enabled', this.enabled ? 'true' : 'false');
    return this.enabled;
  }

  playMove() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  playCapture() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    // Wood impact sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  playCheck() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.07); // A5

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playCastle() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    this.playMove();
    setTimeout(() => this.playMove(), 90);
  }

  playGameOver() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25]; // A major chord
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5 + idx * 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + 0.55 + idx * 0.08);
    });
  }

  playVictoryFanfare() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Upbeat celebratory brass fanfare: C4 -> E4 -> G4 -> C5
    const fanfare = [
      { freq: 261.63, delay: 0, dur: 0.13 },    // C4
      { freq: 329.63, delay: 0.12, dur: 0.13 }, // E4
      { freq: 392.00, delay: 0.24, dur: 0.14 }, // G4
      { freq: 523.25, delay: 0.38, dur: 0.75 }  // C5 (triumphant climax)
    ];

    fanfare.forEach(({ freq, delay, dur }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur);
    });

    // Backing major shimmer harmony (E5 + G5)
    [659.25, 783.99].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.38);
      gain.gain.setValueAtTime(0.18, now + 0.38);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38 + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + 0.38);
      osc.stop(now + 1.15);
    });
  }

  playDefeatSound() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Somber descending minor sequence: G3 -> Eb3 -> C3 -> G2
    const sequence = [
      { freq: 196.00, delay: 0, dur: 0.22 },     // G3
      { freq: 155.56, delay: 0.20, dur: 0.24 },  // Eb3
      { freq: 130.81, delay: 0.42, dur: 0.28 },  // C3
      { freq: 98.00, delay: 0.68, dur: 0.95 }    // G2 (deep somber tone)
    ];

    sequence.forEach(({ freq, delay, dur }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0.22, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur);
    });
  }

  playDrawSound() {
    if (!this.enabled) return;
    this._initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Balanced peaceful two-tone chime (A3 -> D4)
    [
      { freq: 220.00, delay: 0, dur: 0.4 },
      { freq: 293.66, delay: 0.2, dur: 0.6 }
    ].forEach(({ freq, delay, dur }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur);
    });
  }
}

export class ChessUI {
  constructor(gameState, options = {}) {
    this.game = gameState;
    this.flipped = false;
    this.selectedSquare = null;
    this.availableMoves = [];
    this.sounds = new SoundManager();

    // DOM Elements
    this.boardEl = document.getElementById('chess-board');
    this.boardWrapperEl = document.getElementById('board-wrapper');
    this.statusTitleEl = document.getElementById('status-title');
    this.statusDescEl = document.getElementById('status-desc');
    this.moveListEl = document.getElementById('move-list');
    this.moveCountLabel = document.getElementById('move-count-label');

    // Player bars
    this.topPlayerAvatar = document.getElementById('top-player-avatar');
    this.topPlayerName = document.getElementById('top-player-name');
    this.topCapturedTray = document.getElementById('top-captured-tray');
    this.topMaterialBadge = document.getElementById('top-material-badge');
    this.topTurnPill = document.getElementById('top-turn-pill');

    this.bottomPlayerAvatar = document.getElementById('bottom-player-avatar');
    this.bottomPlayerName = document.getElementById('bottom-player-name');
    this.bottomCapturedTray = document.getElementById('bottom-captured-tray');
    this.bottomMaterialBadge = document.getElementById('bottom-material-badge');
    this.bottomTurnPill = document.getElementById('bottom-turn-pill');

    // Modals
    this.promModalEl = document.getElementById('promotion-modal');
    this.gameOverModalEl = document.getElementById('game-over-modal');
    this.gameOverTitleEl = document.getElementById('game-over-title');
    this.gameOverDescEl = document.getElementById('game-over-desc');
    this.gameOverTrophyEl = document.getElementById('game-over-trophy');
    this.gameOverBadgeEl = document.getElementById('game-over-badge');
    this.gameOverMovesStatEl = document.getElementById('game-over-moves-stat');
    this.gameOverReasonStatEl = document.getElementById('game-over-reason-stat');
    this.toastEl = document.getElementById('toast');

    // Victory & Confetti Celebration Engine
    this.celebration = new VictoryCelebration();

    // Buttons
    this.btnUndo = document.getElementById('btn-undo');
    this.btnRedo = document.getElementById('btn-redo');
    this.btnFlip = document.getElementById('btn-flip');
    this.btnNew = document.getElementById('btn-new');
    this.btnResign = document.getElementById('btn-resign');
    this.btnPgn = document.getElementById('btn-pgn');
    this.btnFen = document.getElementById('btn-fen');
    this.btnSound = document.getElementById('btn-sound');
    this.btnTheme = document.getElementById('btn-theme');

    // AI & Game Mode Configuration
    this.gameMode = 'ai'; // 'ai' or 'human'
    this.aiDifficulty = 'medium'; // 'easy' | 'medium' | 'hard'
    this.playerColor = WHITE; // Human's color when playing vs AI
    this.isAIThinking = false;
    this.aiThinkingBadge = document.getElementById('ai-thinking-badge');

    // Drag & interaction state
    this.dragState = {
      isDragging: false,
      fromSquare: null,
      startX: 0,
      startY: 0,
      ghostEl: null
    };
    this._lastPointerDownTime = 0;

    this.pendingPromotionMove = null;

    this.init();
  }

  init() {
    this._initTheme();
    this._initSoundUI();
    this._bindControls();
    this._bindBoardEvents();
    this.render();
  }

  _initTheme() {
    const savedTheme = localStorage.getItem('chess_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  _toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('chess_theme', next);
  }

  _initSoundUI() {
    const onIcon = document.getElementById('icon-sound-on');
    const offIcon = document.getElementById('icon-sound-off');
    if (!onIcon || !offIcon) return;
    if (this.sounds.enabled) {
      onIcon.style.display = 'block';
      offIcon.style.display = 'none';
    } else {
      onIcon.style.display = 'none';
      offIcon.style.display = 'block';
    }
  }

  _toggleSound() {
    const enabled = this.sounds.toggle();
    this._initSoundUI();
    this.showToast(enabled ? 'Sound enabled' : 'Sound muted');
  }

  _bindControls() {
    this.btnUndo?.addEventListener('click', () => this.handleUndo());
    this.btnRedo?.addEventListener('click', () => this.handleRedo());
    this.btnFlip?.addEventListener('click', () => this.handleFlip());
    this.btnNew?.addEventListener('click', () => this.handleNewGame());
    this.btnResign?.addEventListener('click', () => this.handleResign());
    this.btnPgn?.addEventListener('click', () => this.handleExportPGN());
    this.btnFen?.addEventListener('click', () => this.handleCopyFEN());
    this.btnSound?.addEventListener('click', () => this._toggleSound());
    this.btnTheme?.addEventListener('click', () => this._toggleTheme());

    // Game Over modal buttons
    document.getElementById('btn-game-over-new')?.addEventListener('click', () => {
      this.closeGameOverModal();
      this.handleNewGame();
    });
    document.getElementById('btn-game-over-close')?.addEventListener('click', () => {
      this.closeGameOverModal();
    });

    // Promotion buttons
    this.promModalEl?.querySelectorAll('.promotion-piece-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const pieceType = btn.getAttribute('data-piece');
        this.selectPromotion(pieceType);
      });
    });

    // Game Mode & AI Controls
    document.getElementById('btn-mode-ai')?.addEventListener('click', () => this.setGameMode('ai'));
    document.getElementById('btn-mode-human')?.addEventListener('click', () => this.setGameMode('human'));

    document.querySelectorAll('.diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.aiDifficulty = btn.getAttribute('data-diff') || 'medium';
        this.showToast(`AI Difficulty: ${this.aiDifficulty.toUpperCase()}`);
      });
    });

    document.querySelectorAll('.color-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const chosenColor = btn.getAttribute('data-color') || WHITE;
        this.setPlayerColor(chosenColor);
      });
    });
  }

  _bindBoardEvents() {
    // Universal pointer events for simultaneous drag-and-drop & tap-to-move
    this.boardEl.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    window.addEventListener('pointermove', (e) => this._onPointerMove(e));
    window.addEventListener('pointerup', (e) => this._onPointerUp(e));
    window.addEventListener('pointercancel', (e) => this._onPointerCancel(e));
    // Click fallback for engines/browsers with suppressed pointerdown
    this.boardEl.addEventListener('click', (e) => this._onClick(e));
  }

  _getSquareFromPoint(clientX, clientY, target = null) {
    if (target && typeof target.closest === 'function') {
      const squareEl = target.closest('.square');
      if (squareEl) {
        const sq = parseInt(squareEl.getAttribute('data-square'), 10);
        if (!isNaN(sq)) return sq;
      }
    }
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const squareEl = el.closest('.square');
    if (!squareEl) return null;
    const sq = parseInt(squareEl.getAttribute('data-square'), 10);
    return isNaN(sq) ? null : sq;
  }

  _onClick(e) {
    if (Date.now() - (this._lastPointerDownTime || 0) < 350) return;
    this._onPointerDown(e);
  }

  _onPointerDown(e) {
    if (this.game.isGameOver()) return;
    if (this.isAIThinking) return;
    if (this.gameMode === 'ai' && this.game.turn !== this.playerColor) return;
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;

    this._lastPointerDownTime = Date.now();
    const square = this._getSquareFromPoint(e.clientX, e.clientY, e.target);
    if (square === null) return;

    const piece = this.game.board[square];

    // Case 1: Clicked on a legal destination square for already selected piece
    if (this.selectedSquare !== null && this.availableMoves.some((m) => m.to === square)) {
      this.executeMove(this.selectedSquare, square);
      return;
    }

    // Case 2: Pressed on own piece -> Start drag & select (or toggle deselect)
    if (piece && piece.color === this.game.turn) {
      if (this.selectedSquare === square) {
        this.clearSelection();
        return;
      }
      this.dragState.isDragging = false; // will become true on move threshold
      this.dragState.fromSquare = square;
      this.dragState.startX = e.clientX;
      this.dragState.startY = e.clientY;

      this.selectSquare(square);
    } else {
      // Pressed on empty square or opponent piece (not a destination)
      this.clearSelection();
    }
  }

  _onPointerMove(e) {
    if (this.dragState.fromSquare === null) return;

    const dx = e.clientX - this.dragState.startX;
    const dy = e.clientY - this.dragState.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 6px drag threshold to differentiate tap from drag
    if (!this.dragState.isDragging && dist > 6) {
      this.dragState.isDragging = true;
      this._createDragGhost(this.dragState.fromSquare, e.clientX, e.clientY);
    }

    if (this.dragState.isDragging && this.dragState.ghostEl) {
      this.dragState.ghostEl.style.left = `${e.clientX}px`;
      this.dragState.ghostEl.style.top = `${e.clientY}px`;
    }
  }

  _onPointerUp(e) {
    if (this.dragState.fromSquare === null) return;

    if (this.dragState.isDragging) {
      // Completed drag gesture
      this._removeDragGhost();
      const targetSquare = this._getSquareFromPoint(e.clientX, e.clientY);

      if (targetSquare !== null && targetSquare !== this.dragState.fromSquare) {
        if (this.availableMoves.some((m) => m.to === targetSquare)) {
          this.executeMove(this.dragState.fromSquare, targetSquare);
        } else {
          this.clearSelection();
        }
      }
    } else {
      // Completed tap gesture — selection is preserved from pointerdown!
    }

    this.dragState.isDragging = false;
    this.dragState.fromSquare = null;
  }

  _onPointerCancel() {
    this._removeDragGhost();
    this.dragState.isDragging = false;
    this.dragState.fromSquare = null;
  }

  _createDragGhost(square, x, y) {
    this._removeDragGhost();
    const piece = this.game.board[square];
    if (!piece) return;

    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = getPieceSVG(piece.type, piece.color);
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y}px`;
    document.body.appendChild(ghost);
    this.dragState.ghostEl = ghost;

    // Dim source piece
    const pieceEl = this.boardEl.querySelector(`[data-square="${square}"] .piece-container`);
    if (pieceEl) {
      pieceEl.classList.add('dragging');
    }
  }

  _removeDragGhost() {
    if (this.dragState.ghostEl) {
      this.dragState.ghostEl.remove();
      this.dragState.ghostEl = null;
    }
    const dimmed = this.boardEl.querySelectorAll('.piece-container.dragging');
    dimmed.forEach((el) => el.classList.remove('dragging'));
  }

  selectSquare(square) {
    this.selectedSquare = square;
    this.availableMoves = this.game.getLegalMoves(square);
    this.renderHighlights();
  }

  clearSelection() {
    this.selectedSquare = null;
    this.availableMoves = [];
    this.renderHighlights();
  }

  executeMove(from, to, promotion = null) {
    let moves = this.availableMoves.filter((m) => m.from === from && m.to === to);
    if (moves.length === 0) {
      // Programmatic / AI move: pull legal moves directly
      moves = this.game.getLegalMoves(from).filter((m) => m.to === to);
    }
    if (moves.length === 0) return;

    // Check if promotion is needed
    const needsPromotion = moves.some((m) => m.promotion !== null);
    if (needsPromotion && !promotion) {
      this.promptPromotion(from, to);
      return;
    }

    const moveRecord = this.game.makeMove({
      from,
      to,
      promotion: promotion || QUEEN
    });

    if (moveRecord) {
      this.clearSelection();
      this.render();

      // Audio feedback
      if (this.game.isCheckmate() || this.game.isGameOver()) {
        this.sounds.playGameOver();
      } else if (moveRecord.isCheck) {
        this.sounds.playCheck();
      } else if (moveRecord.isCastleKingside || moveRecord.isCastleQueenside) {
        this.sounds.playCastle();
      } else if (moveRecord.capturedPiece) {
        this.sounds.playCapture();
      } else {
        this.sounds.playMove();
      }

      // Check for Game Over modal or trigger AI reply
      if (this.game.isGameOver()) {
        setTimeout(() => this.showGameOverModal(), 350);
      } else if (this.gameMode === 'ai' && this.game.turn !== this.playerColor) {
        this.triggerAIMove();
      }
    }
  }

  async triggerAIMove() {
    this.isAIThinking = true;
    if (this.aiThinkingBadge) this.aiThinkingBadge.style.display = 'flex';
    this.renderStatus();

    const currentFen = toFEN(this.game);
    const difficulty = this.aiDifficulty || 'medium';

    try {
      const response = await fetch('/api/ai-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: currentFen, difficulty })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.move) {
          const fromSq = squareFromCoords(data.move.from);
          const toSq = squareFromCoords(data.move.to);
          const prom = data.move.promotion ? data.move.promotion.toLowerCase() : QUEEN;

          this.isAIThinking = false;
          if (this.aiThinkingBadge) this.aiThinkingBadge.style.display = 'none';

          if (!this.game.isGameOver()) {
            this.executeMove(fromSq, toSq, prom);
          }
          return;
        }
      }
    } catch (err) {
      // Python backend offline or standalone client usage; proceed to client AI fallback
    }

    // Client-side fallback (offline PWA)
    setTimeout(() => {
      if (this.game.isGameOver()) {
        this.isAIThinking = false;
        if (this.aiThinkingBadge) this.aiThinkingBadge.style.display = 'none';
        return;
      }

      const aiMove = getAIMove(this.game, this.aiDifficulty);
      this.isAIThinking = false;
      if (this.aiThinkingBadge) this.aiThinkingBadge.style.display = 'none';

      if (aiMove) {
        this.executeMove(aiMove.from, aiMove.to, aiMove.promotion || QUEEN);
      }
    }, 260);
  }

  setGameMode(mode) {
    this.gameMode = mode;
    document.getElementById('btn-mode-ai')?.classList.toggle('active', mode === 'ai');
    document.getElementById('btn-mode-human')?.classList.toggle('active', mode === 'human');
    const settingsPanel = document.getElementById('ai-settings-panel');
    if (settingsPanel) {
      settingsPanel.style.display = mode === 'ai' ? 'flex' : 'none';
    }
    this.showToast(mode === 'ai' ? 'Mode: vs Computer' : 'Mode: 2 Player (Local)');
    this.handleNewGame();
  }

  setPlayerColor(color) {
    this.playerColor = color;
    this.flipped = (color === BLACK);
    this.handleNewGame();
    this.showToast(`Playing as ${color === WHITE ? 'White' : 'Black'}`);
    if (this.gameMode === 'ai' && color === BLACK) {
      setTimeout(() => this.triggerAIMove(), 300);
    }
  }

  promptPromotion(from, to) {
    this.pendingPromotionMove = { from, to };
    const color = this.game.turn;

    // Update promotion modal button pieces
    const pieces = [QUEEN, ROOK, BISHOP, KNIGHT];
    this.promModalEl.querySelectorAll('.promotion-piece-btn').forEach((btn, idx) => {
      const pType = pieces[idx];
      btn.setAttribute('data-piece', pType);
      btn.innerHTML = getPieceSVG(pType, color);
    });

    this.promModalEl.classList.add('open');
  }

  selectPromotion(pieceType) {
    if (!this.pendingPromotionMove) return;
    const { from, to } = this.pendingPromotionMove;
    this.pendingPromotionMove = null;
    this.promModalEl.classList.remove('open');
    this.executeMove(from, to, pieceType);
  }

  showGameOverModal() {
    const status = this.game.getGameStatus();
    const isDraw = !status.winner;
    const isAIMode = this.gameMode === 'ai';

    const card = this.gameOverModalEl.querySelector('.modal-card');
    card.classList.remove('victory-card', 'defeat-card', 'draw-card');

    let badgeText = 'VICTORY';
    let badgeClass = 'victory-banner-badge';
    let titleText = status.title;
    let descText = status.description;

    const reasonMap = {
      checkmate: 'Checkmate',
      resignation: 'Resignation',
      stalemate: 'Stalemate',
      threefold_repetition: 'Threefold Repetition',
      fifty_move_rule: '50-Move Rule',
      insufficient_material: 'Insufficient Material'
    };
    const friendlyReason = reasonMap[status.reason] || 'Game Over';

    if (isDraw) {
      card.classList.add('draw-card');
      badgeText = 'DRAW';
      badgeClass = 'victory-banner-badge draw';
      titleText = 'Game Drawn';
      descText = `The match concluded peacefully in a draw by ${friendlyReason}.`;

      if (this.gameOverTrophyEl) {
        this.gameOverTrophyEl.innerHTML = `
          <svg viewBox="0 0 64 64" width="72" height="72" fill="none" class="trophy-svg-vector">
            <defs>
              <linearGradient id="draw-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#94a3b8"/>
                <stop offset="100%" stop-color="#475569"/>
              </linearGradient>
            </defs>
            <circle cx="32" cy="10" r="4" fill="#38bdf8"/>
            <path d="M32 10v40M18 54h28M10 22l22-6 22 6" stroke="url(#draw-grad)" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M10 22l-6 14h12L10 22zM54 22l-6 14h12l-6-14z" fill="url(#draw-grad)" stroke="url(#draw-grad)" stroke-width="2.5" stroke-linejoin="round"/>
          </svg>
        `;
      }

      this.celebration.stop();
      this.sounds.playDrawSound();
    } else if (isAIMode) {
      const userWon = status.winner === this.playerColor;

      if (userWon) {
        card.classList.add('victory-card');
        badgeText = 'VICTORY';
        badgeClass = 'victory-banner-badge victory';
        titleText = 'Triumphant Victory!';
        descText = `Outstanding game! You defeated the Computer on ${this.aiDifficulty.toUpperCase()} level by ${friendlyReason}!`;

        if (this.gameOverTrophyEl) {
          this.gameOverTrophyEl.innerHTML = `
            <svg viewBox="0 0 64 64" width="72" height="72" fill="none" class="trophy-svg-vector">
              <defs>
                <linearGradient id="trophy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#fef08a"/>
                  <stop offset="35%" stop-color="#fbbf24"/>
                  <stop offset="70%" stop-color="#f59e0b"/>
                  <stop offset="100%" stop-color="#b45309"/>
                </linearGradient>
              </defs>
              <path d="M16 12h32v16c0 8.837-7.163 16-16 16s-16-7.163-16-16V12z" fill="url(#trophy-grad)"/>
              <path d="M16 16H9a4 4 0 0 0-4 4v3a9 9 0 0 0 9 9h2M48 16h7a4 4 0 0 1 4 4v3a9 9 0 0 1-9 9h-2" stroke="url(#trophy-grad)" stroke-width="3.5" stroke-linecap="round"/>
              <path d="M28 44h8v8h-8zM20 52h24v4a2 2 0 0 1-2 2H22a2 2 0 0 1-2-2v-4z" fill="url(#trophy-grad)"/>
              <path d="M32 18l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#ffffff" opacity="0.95"/>
            </svg>
          `;
        }

        this.celebration.start({ isWinner: true });
        this.sounds.playVictoryFanfare();
      } else {
        card.classList.add('defeat-card');
        badgeText = 'DEFEAT';
        badgeClass = 'victory-banner-badge defeat';
        titleText = 'Defeat';
        descText = `The Computer checkmated your King by ${friendlyReason}. Review your positions and launch a rematch!`;

        if (this.gameOverTrophyEl) {
          this.gameOverTrophyEl.innerHTML = `
            <svg viewBox="0 0 64 64" width="72" height="72" fill="none" class="defeat-svg-vector">
              <defs>
                <linearGradient id="defeat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#f43f5e"/>
                  <stop offset="60%" stop-color="#e11d48"/>
                  <stop offset="100%" stop-color="#881337"/>
                </linearGradient>
              </defs>
              <path d="M32 6L10 16v18c0 14 10 22 22 26 12-4 22-12 22-26V16L32 6z" fill="url(#defeat-grad)" opacity="0.25"/>
              <path d="M32 6L10 16v18c0 14 10 22 22 26 12-4 22-12 22-26V16L32 6z" stroke="url(#defeat-grad)" stroke-width="3"/>
              <path d="M32 14l-6 14h8l-6 16" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
        }

        this.celebration.startDefeat();
        this.sounds.playDefeatSound();
      }
    } else {
      // 2-Player Local Mode
      const winnerName = status.winner === WHITE ? 'White' : 'Black';
      const loserName = status.winner === WHITE ? 'Black' : 'White';
      card.classList.add('victory-card');
      badgeText = `${winnerName.toUpperCase()} WINS`;
      badgeClass = `victory-banner-badge ${status.winner === WHITE ? 'white-win' : 'black-win'}`;
      titleText = `${winnerName} is Victorious!`;
      descText = `${winnerName} won the match! ${loserName} has been defeated by ${friendlyReason}.`;

      if (this.gameOverTrophyEl) {
        this.gameOverTrophyEl.innerHTML = `
          <svg viewBox="0 0 64 64" width="72" height="72" fill="none" class="trophy-svg-vector">
            <defs>
              <linearGradient id="champ-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fef08a"/>
                <stop offset="40%" stop-color="#38bdf8"/>
                <stop offset="100%" stop-color="#818cf8"/>
              </linearGradient>
            </defs>
            <path d="M16 12h32v16c0 8.837-7.163 16-16 16s-16-7.163-16-16V12z" fill="url(#champ-grad)"/>
            <path d="M16 16H9a4 4 0 0 0-4 4v3a9 9 0 0 0 9 9h2M48 16h7a4 4 0 0 1 4 4v3a9 9 0 0 1-9 9h-2" stroke="url(#champ-grad)" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M28 44h8v8h-8zM20 52h24v4a2 2 0 0 1-2 2H22a2 2 0 0 1-2-2v-4z" fill="url(#champ-grad)"/>
            <path d="M32 18l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#ffffff" opacity="0.95"/>
          </svg>
        `;
      }

      this.celebration.start({ isWinner: true });
      this.sounds.playVictoryFanfare();
    }

    if (this.gameOverBadgeEl) {
      this.gameOverBadgeEl.textContent = badgeText;
      this.gameOverBadgeEl.className = badgeClass;
    }
    if (this.gameOverTitleEl) {
      this.gameOverTitleEl.textContent = titleText;
    }
    if (this.gameOverDescEl) {
      this.gameOverDescEl.textContent = descText;
    }
    if (this.gameOverMovesStatEl) {
      const fullMoves = Math.floor((this.game.moveHistory.length + 1) / 2);
      this.gameOverMovesStatEl.textContent = `${fullMoves} ${fullMoves === 1 ? 'Move' : 'Moves'}`;
    }
    if (this.gameOverReasonStatEl) {
      this.gameOverReasonStatEl.textContent = friendlyReason;
    }

    this.gameOverModalEl.classList.add('open');
  }

  closeGameOverModal() {
    this.gameOverModalEl.classList.remove('open');
    this.celebration.stop();
  }

  handleUndo() {
    this.celebration.stop();
    const undone = this.game.undoMove();
    if (undone) {
      this.clearSelection();
      this.render();
      this.sounds.playMove();
    }
  }

  handleRedo() {
    const redone = this.game.redoMove();
    if (redone) {
      this.clearSelection();
      this.render();
      this.sounds.playMove();
    }
  }

  handleFlip() {
    this.flipped = !this.flipped;
    this.render();
  }

  handleNewGame() {
    this.celebration.stop();
    this.game.loadFEN();
    this.clearSelection();
    this.render();
    this.showToast('New game started');
  }

  handleResign() {
    if (this.game.isGameOver()) return;
    const color = this.game.turn;
    const confirmed = window.confirm(`Are you sure ${color === WHITE ? 'White' : 'Black'} wants to resign?`);
    if (confirmed) {
      this.game.resign(color);
      this.render();
      this.showGameOverModal();
      this.sounds.playGameOver();
    }
  }

  handleExportPGN() {
    const pgn = generatePGN(this.game);
    navigator.clipboard.writeText(pgn).then(() => {
      this.showToast('PGN copied to clipboard');
    }).catch(() => {
      // Fallback
      prompt('PGN Output:', pgn);
    });
  }

  handleCopyFEN() {
    const fen = toFEN(this.game);
    navigator.clipboard.writeText(fen).then(() => {
      this.showToast('FEN copied to clipboard');
    }).catch(() => {
      prompt('FEN:', fen);
    });
  }

  showToast(msg) {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 2400);
  }

  render() {
    this.renderBoard();
    this.renderPlayerBars();
    this.renderHistory();
    this.renderStatus();
  }

  renderBoard() {
    this.boardEl.innerHTML = '';

    // If flipped: Black perspective (rank 0 to 7, file 7 to 0)
    // If normal: White perspective (rank 7 to 0, file 0 to 7)
    const rankIndices = this.flipped ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
    const fileIndices = this.flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

    const lastMove = this.game.moveHistory[this.game.moveHistory.length - 1];
    const inCheck = this.game.isCheck();

    for (let r = 0; r < 8; r++) {
      const rank = rankIndices[r];
      for (let f = 0; f < 8; f++) {
        const file = fileIndices[f];
        const sq = squareFromCoords(file, rank);
        const piece = this.game.board[sq];
        const isLight = isLightSquare(sq);

        const squareEl = document.createElement('div');
        squareEl.className = `square ${isLight ? 'light' : 'dark'}`;
        squareEl.setAttribute('data-square', sq);
        squareEl.setAttribute('role', 'gridcell');

        // Square coordinates notation
        if (f === 0) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'coord-rank';
          rankLabel.textContent = RANKS[rank];
          squareEl.appendChild(rankLabel);
        }
        if (r === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'coord-file';
          fileLabel.textContent = FILES[file];
          squareEl.appendChild(fileLabel);
        }

        // Highlight last move
        if (lastMove && (lastMove.from === sq || lastMove.to === sq)) {
          squareEl.classList.add('last-move');
        }

        // Highlight king in check
        if (inCheck && piece && piece.type === KING && piece.color === this.game.turn) {
          squareEl.classList.add('in-check');
        }

        // Render piece
        if (piece) {
          const pieceContainer = document.createElement('div');
          pieceContainer.className = 'piece-container';
          pieceContainer.innerHTML = getPieceSVG(piece.type, piece.color);
          squareEl.appendChild(pieceContainer);
        }

        this.boardEl.appendChild(squareEl);
      }
    }

    this.renderHighlights();
  }

  renderHighlights() {
    // Clear previous selection and hint indicators
    this.boardEl.querySelectorAll('.square.selected').forEach((el) => el.classList.remove('selected'));
    this.boardEl.querySelectorAll('.move-hint-dot, .move-hint-capture').forEach((el) => el.remove());

    if (this.selectedSquare !== null) {
      const selSquareEl = this.boardEl.querySelector(`[data-square="${this.selectedSquare}"]`);
      if (selSquareEl) {
        selSquareEl.classList.add('selected');
      }

      // Add hint indicators for all legal destinations
      for (const move of this.availableMoves) {
        const destSquareEl = this.boardEl.querySelector(`[data-square="${move.to}"]`);
        if (!destSquareEl) continue;

        const isCapture = move.capturedPiece !== null || move.isEnPassant;
        if (isCapture) {
          const captureRing = document.createElement('div');
          captureRing.className = 'move-hint-capture';
          destSquareEl.appendChild(captureRing);
        } else {
          const dot = document.createElement('div');
          dot.className = 'move-hint-dot';
          destSquareEl.appendChild(dot);
        }
      }
    }
  }

  renderPlayerBars() {
    const topColor = this.flipped ? WHITE : BLACK;
    const bottomColor = this.flipped ? BLACK : WHITE;

    // Set player labels based on mode
    let topName = topColor === WHITE ? 'White' : 'Black';
    let bottomName = bottomColor === WHITE ? 'White' : 'Black';

    if (this.gameMode === 'ai') {
      const aiDiffLabel = this.aiDifficulty.charAt(0).toUpperCase() + this.aiDifficulty.slice(1);
      if (this.playerColor === topColor) {
        topName = `You (${topColor === WHITE ? 'White' : 'Black'})`;
        bottomName = `Computer (${aiDiffLabel})`;
      } else {
        bottomName = `You (${bottomColor === WHITE ? 'White' : 'Black'})`;
        topName = `Computer (${aiDiffLabel})`;
      }
    }

    // Top player bar
    this.topPlayerAvatar.className = `player-avatar ${topColor === WHITE ? 'white' : 'black'}`;
    this.topPlayerAvatar.innerHTML = getPieceSVG(KING, topColor);
    this.topPlayerName.textContent = topName;
    this.topTurnPill.className = `turn-pill ${this.game.turn === topColor && !this.game.isGameOver() ? 'active' : ''}`;

    // Bottom player bar
    this.bottomPlayerAvatar.className = `player-avatar ${bottomColor === WHITE ? 'white' : 'black'}`;
    this.bottomPlayerAvatar.innerHTML = getPieceSVG(KING, bottomColor);
    this.bottomPlayerName.textContent = bottomName;
    this.bottomTurnPill.className = `turn-pill ${this.game.turn === bottomColor && !this.game.isGameOver() ? 'active' : ''}`;

    // Captured pieces trays
    this._renderTray(this.topCapturedTray, this.game.capturedPieces[topColor]);
    this._renderTray(this.bottomCapturedTray, this.game.capturedPieces[bottomColor]);

    // Material badges
    const mat = this.game.getMaterialBalance();
    this.topMaterialBadge.classList.toggle('visible', mat.advantageColor === topColor && mat.advantageValue > 0);
    this.topMaterialBadge.textContent = `+${mat.advantageValue}`;

    this.bottomMaterialBadge.classList.toggle('visible', mat.advantageColor === bottomColor && mat.advantageValue > 0);
    this.bottomMaterialBadge.textContent = `+${mat.advantageValue}`;

    // Update buttons disabled state
    this.btnUndo.disabled = this.game.moveHistory.length === 0;
    this.btnRedo.disabled = this.game.redoStack.length === 0;
  }

  _renderTray(trayEl, pieces) {
    trayEl.innerHTML = '';
    const sorted = [...pieces].sort((a, b) => (b.type === QUEEN ? 1 : -1));
    for (const p of sorted) {
      const mini = document.createElement('div');
      mini.className = 'captured-piece-mini';
      mini.innerHTML = getPieceSVG(p.type, p.color);
      trayEl.appendChild(mini);
    }
  }

  renderHistory() {
    this.moveListEl.innerHTML = '';
    const moves = this.game.moveHistory;
    this.moveCountLabel.textContent = `${moves.length} moves`;

    for (let i = 0; i < moves.length; i += 2) {
      const row = document.createElement('div');
      row.className = 'move-row';

      const numSpan = document.createElement('span');
      numSpan.className = 'move-num';
      numSpan.textContent = `${Math.floor(i / 2) + 1}.`;
      row.appendChild(numSpan);

      const whiteMove = moves[i];
      const whiteSpan = document.createElement('span');
      whiteSpan.className = `move-item ${i === moves.length - 1 ? 'active' : ''}`;
      whiteSpan.textContent = whiteMove.san;
      row.appendChild(whiteSpan);

      const blackMove = moves[i + 1];
      if (blackMove) {
        const blackSpan = document.createElement('span');
        blackSpan.className = `move-item ${i + 1 === moves.length - 1 ? 'active' : ''}`;
        blackSpan.textContent = blackMove.san;
        row.appendChild(blackSpan);
      }

      this.moveListEl.appendChild(row);
    }

    // Auto-scroll to latest move
    this.moveListEl.scrollTop = this.moveListEl.scrollHeight;
  }

  renderStatus() {
    const status = this.game.getGameStatus();
    this.statusTitleEl.textContent = status.title;
    this.statusDescEl.textContent = status.description;
  }
}
