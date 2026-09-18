/**
 * pieces.js
 * Piece definitions, colors, values, and crisp SVG renders.
 */

export const WHITE = 'w';
export const BLACK = 'b';

export const PAWN = 'p';
export const KNIGHT = 'n';
export const BISHOP = 'b';
export const ROOK = 'r';
export const QUEEN = 'q';
export const KING = 'k';

export const PIECE_TYPES = [PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING];
export const COLORS = [WHITE, BLACK];

export const PIECE_VALUES = {
  [PAWN]: 1,
  [KNIGHT]: 3,
  [BISHOP]: 3,
  [ROOK]: 5,
  [QUEEN]: 9,
  [KING]: 0
};

export const PIECE_NAMES = {
  [PAWN]: 'Pawn',
  [KNIGHT]: 'Knight',
  [BISHOP]: 'Bishop',
  [ROOK]: 'Rook',
  [QUEEN]: 'Queen',
  [KING]: 'King'
};

export function createPiece(type, color) {
  return { type, color };
}

export function pieceToChar(piece) {
  if (!piece) return null;
  return piece.color === WHITE ? piece.type.toUpperCase() : piece.type.toLowerCase();
}

export function charToPiece(char) {
  if (!char) return null;
  const isWhite = char === char.toUpperCase();
  const type = char.toLowerCase();
  if (!PIECE_TYPES.includes(type)) return null;
  return { type, color: isWhite ? WHITE : BLACK };
}

export function isWhite(color) {
  return color === WHITE;
}

export function isBlack(color) {
  return color === BLACK;
}

export function getOppositeColor(color) {
  return color === WHITE ? BLACK : WHITE;
}

/**
 * Standard, crisp vector paths for all 12 chess pieces (Staunton style).
 * Rendered using inline SVGs for resolution-independent scaling.
 */
const SVG_PATHS = {
  // White Pieces
  'w_k': `
    <path d="M22.5 11.63V6M20 8h5" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7z" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" fill="none" stroke="#1e293b" stroke-width="1.5"/>
  `,
  'w_q': `
    <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-6-15-5 15-7-11 2 12" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M11.5 30c3.5-1 18.5-1 22 0m-21.5 3.5c3.5-1 17.5-1 21 0m-20 3.5c3.5-1 15.5-1 19 0" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="6" cy="12" r="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="14" cy="9" r="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="22.5" cy="8" r="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="31" cy="9" r="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="39" cy="12" r="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
  `,
  'w_r': `
    <path d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm1-4.5h19l-1.5-15h-16L13 31.5zM11 14h23l2-6H9l2 6z" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M12 11.5h4v3h-4v-3zm6.5 0h4v3h-4v-3zm6.5 0h4v3h-4v-3z" fill="#1e293b"/>
    <path d="M14 29.5c5-1 12-1 17 0m-16-4c4-.8 10-.8 15 0" fill="none" stroke="#1e293b" stroke-width="1.5"/>
  `,
  'w_b': `
    <g fill="#f8fafc" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z"/>
      <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
      <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/>
    </g>
    <path d="M17.5 26h10M15 30h15m-7.5-14.5v5m-3-2.5h6" fill="none" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  `,
  'w_n': `
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-4.04 2-5 1.57-2.55 3.15-5.91 3-9 0-4-3-4-3-4s6.24-2.51 11 1z" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0" fill="#1e293b" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M15 15.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0" fill="#1e293b" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M24.55 10.4s2.25 1.7 1.8 4.2M29.5 13s2.1 1.9 1.5 4.6M34 16.5s1.8 2 1 4.5" fill="none" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
  `,
  'w_p': `
    <path d="M22 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.21-3.28 5.62 0 2.03.93 3.84 2.38 5.03-3.15 1.63-5.38 4.9-5.38 8.72V36h21v-1.25c0-3.82-2.23-7.09-5.38-8.72 1.45-1.19 2.38-3 2.38-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M14 36c4.5-1 11.5-1 16 0m-14-4c3.5-.8 9.5-.8 13 0" fill="none" stroke="#1e293b" stroke-width="1.5"/>
  `,

  // Black Pieces
  'b_k': `
    <path d="M22.5 11.63V6M20 8h5" stroke="#f8fafc" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7z" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
    <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
    <circle cx="22.5" cy="21" r="1.5" fill="#cbd5e1"/>
  `,
  'b_q': `
    <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-6-15-5 15-7-11 2 12" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
    <path d="M11.5 30c3.5-1 18.5-1 22 0m-21.5 3.5c3.5-1 17.5-1 21 0m-20 3.5c3.5-1 15.5-1 19 0" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
    <circle cx="6" cy="12" r="2" fill="#1e293b" stroke="#f8fafc" stroke-width="1"/>
    <circle cx="14" cy="9" r="2" fill="#1e293b" stroke="#f8fafc" stroke-width="1"/>
    <circle cx="22.5" cy="8" r="2" fill="#1e293b" stroke="#f8fafc" stroke-width="1"/>
    <circle cx="31" cy="9" r="2" fill="#1e293b" stroke="#f8fafc" stroke-width="1"/>
    <circle cx="39" cy="12" r="2" fill="#1e293b" stroke="#f8fafc" stroke-width="1"/>
  `,
  'b_r': `
    <path d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm1-4.5h19l-1.5-15h-16L13 31.5zM11 14h23l2-6H9l2 6z" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M12 11.5h4v3h-4v-3zm6.5 0h4v3h-4v-3zm6.5 0h4v3h-4v-3z" fill="#cbd5e1"/>
    <path d="M14 29.5c5-1 12-1 17 0m-16-4c4-.8 10-.8 15 0" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
  `,
  'b_b': `
    <g fill="#1e293b" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z"/>
      <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
      <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/>
    </g>
    <path d="M17.5 26h10M15 30h15m-7.5-14.5v5m-3-2.5h6" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
  `,
  'b_n': `
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
    <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-4.04 2-5 1.57-2.55 3.15-5.91 3-9 0-4-3-4-3-4s6.24-2.51 11 1z" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/>
    <circle cx="9.5" cy="25.5" r="1" fill="#f8fafc"/>
    <circle cx="15" cy="15.5" r="1" fill="#f8fafc"/>
    <path d="M24.55 10.4s2.25 1.7 1.8 4.2M29.5 13s2.1 1.9 1.5 4.6M34 16.5s1.8 2 1 4.5" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
  `,
  'b_p': `
    <path d="M22 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38-1.95 1.12-3.28 3.21-3.28 5.62 0 2.03.93 3.84 2.38 5.03-3.15 1.63-5.38 4.9-5.38 8.72V36h21v-1.25c0-3.82-2.23-7.09-5.38-8.72 1.45-1.19 2.38-3 2.38-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M14 36c4.5-1 11.5-1 16 0m-14-4c3.5-.8 9.5-.8 13 0" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
  `
};

export function getPieceSVG(type, color) {
  const key = `${color}_${type.toLowerCase()}`;
  const path = SVG_PATHS[key] || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="100%" height="100%" class="chess-piece" data-piece="${key}">${path}</svg>`;
}
