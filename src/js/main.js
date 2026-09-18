/**
 * main.js
 * Application bootstrap, Service Worker registration, and lifecycle wiring.
 */

import { GameState } from './gameState.js';
import { ChessUI } from './ui.js';

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Game State & UI
  const game = new GameState();
  const ui = new ChessUI(game);

  // Expose to window for debugging or testing if needed
  window.__chessGame = game;
  window.__chessUI = ui;

  // 2. Register Service Worker for offline PWA support
  if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
    navigator.serviceWorker.register('./service-worker.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error);
      });
  }

  // 3. Prevent pull-to-refresh on mobile browsers specifically on the board
  document.body.addEventListener('touchmove', (e) => {
    if (e.target.closest('#board-wrapper')) {
      e.preventDefault();
    }
  }, { passive: false });
});
