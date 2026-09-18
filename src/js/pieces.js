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
 * High-End Luxury Chess Pieces.
 * Rendered using precision SVG vectors with gradients, subtle specular highlights,
 * gold-embellished diadems, and chiseled silhouettes.
 */
const DEFS_CACHE = {
  w: `
    <defs>
      <!-- Liquid Crystal White Gradient -->
      <linearGradient id="w-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="30%" stop-color="#f8fafc"/>
        <stop offset="70%" stop-color="#e2e8f0"/>
        <stop offset="100%" stop-color="#cbd5e1"/>
      </linearGradient>
      <!-- Specular Liquid Highlight Flare -->
      <linearGradient id="w-specular" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="45%" stop-color="#ffffff" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
      </linearGradient>
      <!-- Prismatic Gold Jewel Accent -->
      <linearGradient id="gold-jewel" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="40%" stop-color="#fbbf24"/>
        <stop offset="100%" stop-color="#d97706"/>
      </linearGradient>
      <!-- Soft Vitreous Caustic Shadow -->
      <filter id="piece-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="2.5" flood-color="#0f172a" flood-opacity="0.32"/>
        <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#38bdf8" flood-opacity="0.2"/>
      </filter>
    </defs>
  `,
  b: `
    <defs>
      <!-- Smoked Obsidian Vitreous Gradient -->
      <linearGradient id="b-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#475569"/>
        <stop offset="30%" stop-color="#334155"/>
        <stop offset="75%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#090d16"/>
      </linearGradient>
      <!-- Neon Liquid Rim Light -->
      <linearGradient id="b-rim-glow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#c084fc" stop-opacity="0.75"/>
        <stop offset="50%" stop-color="#818cf8" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.25"/>
      </linearGradient>
      <!-- Imperial Obsidian Jewel Accent -->
      <linearGradient id="gold-jewel-dark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="50%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#92400e"/>
      </linearGradient>
      <!-- Liquid Deep Shadow with Sub-surface Violet Glow -->
      <filter id="piece-shadow-dark" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.55"/>
        <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#8b5cf6" flood-opacity="0.25"/>
      </filter>
    </defs>
  `
};

/**
 * High-End SVG Vector Geometry for all 6 piece types.
 * Masterfully sculpted on a 100x100 canvas.
 */
function renderPieceGraphics(type, color) {
  const isW = color === WHITE;
  const bodyGrad = isW ? 'url(#w-body-grad)' : 'url(#b-body-grad)';
  const strokeColor = isW ? '#1e293b' : '#020617';
  const rimStroke = isW ? 'rgba(255, 255, 255, 0.7)' : 'rgba(148, 163, 184, 0.45)';
  const goldFill = isW ? 'url(#gold-jewel)' : 'url(#gold-jewel-dark)';
  const filter = isW ? 'url(#piece-shadow)' : 'url(#piece-shadow-dark)';
  const strokeW = '2.4';

  switch (type) {
    case PAWN:
      return `
        <g filter="${filter}">
          <!-- Base plinth -->
          <path d="M22 88 h56 c-1 -4 -5 -7 -10 -7 H32 c-5 0 -9 3 -10 7 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Lower ring -->
          <path d="M28 81 h44 c-1 -3 -3 -4 -6 -4 H34 c-3 0 -5 1 -6 4 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}"/>
          <!-- Stem torso -->
          <path d="M34 77 c2 -14 7 -22 11 -28 h10 c4 6 9 14 11 28 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Neck collar -->
          <path d="M37 49 h26 c0 -3 -2 -5 -5 -5 H42 c-3 0 -5 2 -5 5 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}"/>
          <!-- Head Sphere -->
          <circle cx="50" cy="27" r="14.5" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}"/>
          <!-- Specular Light Sheen -->
          <path d="M43 18 a 9 9 0 0 1 12 0" fill="none" stroke="${rimStroke}" stroke-width="2.2" stroke-linecap="round"/>
        </g>
      `;

    case KNIGHT:
      return `
        <g filter="${filter}">
          <!-- Base plinth -->
          <path d="M20 88 h60 c-1 -4 -5 -7 -10 -7 H30 c-5 0 -9 3 -10 7 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Lower ring -->
          <path d="M25 81 h50 c-1 -3 -4 -4 -7 -4 H32 c-3 0 -6 1 -7 4 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}"/>
          <!-- Main Stallion Body & Mane Silhouette -->
          <path d="M25 77 C28 62 30 52 35 48 C30 46 25 43 23 37 C21 32 23 27 28 25 C33 23 40 25 46 22 C49 20 53 14 55 10 C57 16 57 20 62 20 C64 16 66 12 69 11 C70 17 68 22 75 28 C79 32 80 40 76 49 C80 54 80 62 76 68 C74 72 73 75 75 77 Z"
            fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Chiseled Cheek & Jaw contour -->
          <path d="M35 48 C38 46 45 42 47 34 C49 27 46 23 42 24" fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round"/>
          <!-- Flowing Mane Grooves -->
          <path d="M62 26 C68 31 72 38 71 44" fill="none" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M67 43 C72 48 74 56 71 63" fill="none" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M69 61 C72 66 73 72 70 77" fill="none" stroke="${strokeColor}" stroke-width="1.6" stroke-linecap="round"/>
          <!-- Muzzle & Nostril -->
          <path d="M24 33 C26 35 29 35 30 33" fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round"/>
          <!-- Expressive Almond Eye with Gold Glint -->
          <ellipse cx="37" cy="27" rx="3" ry="2.2" transform="rotate(-15 37 27)" fill="${strokeColor}"/>
          <circle cx="36" cy="26" r="1.2" fill="${goldFill}"/>
          <!-- Chest Highlight Arc -->
          <path d="M29 65 C32 54 36 49 40 44" fill="none" stroke="${rimStroke}" stroke-width="2" stroke-linecap="round"/>
        </g>
      `;

    case BISHOP:
      return `
        <g filter="${filter}">
          <!-- Base plinth -->
          <path d="M20 88 h60 c-1 -4 -5 -7 -10 -7 H30 c-5 0 -9 3 -10 7 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Lower ring -->
          <path d="M25 81 h50 c-1 -3 -4 -4 -7 -4 H32 c-3 0 -6 1 -7 4 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}"/>
          <!-- Waist stem -->
          <path d="M34 77 c1 -10 4 -16 8 -21 h16 c4 5 7 11 8 21 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Mid collar ring -->
          <path d="M33 56 h34 c0 -3 -3 -5 -6 -5 H39 c-3 0 -6 2 -6 5 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}"/>
          <!-- Mitre Hat Arch -->
          <path d="M50 14 C35 25 30 38 33 51 C38 54 62 54 67 51 C70 38 65 25 50 14 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Mitre Incision Slot -->
          <path d="M55 24 L42 41" fill="none" stroke="${strokeColor}" stroke-width="2.6" stroke-linecap="round"/>
          <!-- Golden Apex Cross & Orb -->
          <circle cx="50" cy="12" r="4.2" fill="${goldFill}" stroke="${strokeColor}" stroke-width="1.6"/>
          <path d="M50 5 v4 M48 7 h4" stroke="${goldFill}" stroke-width="2" stroke-linecap="round"/>
          <!-- Highlights -->
          <path d="M37 28 C34 35 34 43 37 48" fill="none" stroke="${rimStroke}" stroke-width="2" stroke-linecap="round"/>
        </g>
      `;

    case ROOK:
      return `
        <g filter="${filter}">
          <!-- Base plinth -->
          <path d="M18 88 h64 c-1 -4 -6 -7 -11 -7 H29 c-5 0 -10 3 -11 7 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Lower molding -->
          <path d="M23 81 h54 c-1 -3 -3 -4 -6 -4 H29 c-3 0 -5 1 -6 4 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}"/>
          <!-- Fortress Wall Stem -->
          <path d="M29 77 L32 38 h36 L71 77 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Cornice machicolation ledge -->
          <path d="M22 38 h56 v-6 H22 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- 4 Sturdy Battlements (Crenels & Embrasures) -->
          <path d="M23 32 v-12 h10 v6 h7 v-6 h10 v6 h7 v-6 h10 v12 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Masonry Arrow-Slit Window -->
          <path d="M48 48 h4 v14 h-4 Z" fill="${strokeColor}" stroke="${strokeColor}" stroke-width="1.2" stroke-linejoin="round"/>
          <circle cx="50" cy="46" r="2" fill="${strokeColor}"/>
          <!-- Wall Highlight -->
          <path d="M34 44 L32 72" fill="none" stroke="${rimStroke}" stroke-width="2" stroke-linecap="round"/>
        </g>
      `;

    case QUEEN:
      return `
        <g filter="${filter}">
          <!-- Base plinth -->
          <path d="M18 88 h64 c-1 -4 -6 -7 -11 -7 H29 c-5 0 -10 3 -11 7 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Lower ring -->
          <path d="M23 81 h54 c-1 -3 -4 -4 -7 -4 H30 c-3 0 -6 1 -7 4 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}"/>
          <!-- Flowing Royal Gown -->
          <path d="M30 77 C33 66 38 56 40 50 h20 C62 56 67 66 70 77 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Royal Corset Sash -->
          <path d="M37 50 h26 v-6 H37 Z" fill="${goldFill}" stroke="${strokeColor}" stroke-width="1.5"/>
          <!-- Upper Bodice & Neckline -->
          <path d="M37 44 C33 38 29 36 27 34 C36 38 64 38 73 34 C71 36 67 38 63 44 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}"/>
          <!-- Majestic 5-Point Coronet -->
          <path d="M24 34 L18 19 L32 29 L50 14 L68 29 L82 19 L76 34 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- 5 Golden Crown Diadem Pearls -->
          <circle cx="18" cy="18" r="3.2" fill="${goldFill}" stroke="${strokeColor}" stroke-width="1.4"/>
          <circle cx="32" cy="27" r="3" fill="${goldFill}" stroke="${strokeColor}" stroke-width="1.4"/>
          <circle cx="50" cy="13" r="4.2" fill="${goldFill}" stroke="${strokeColor}" stroke-width="1.5"/>
          <circle cx="68" cy="27" r="3" fill="${goldFill}" stroke="${strokeColor}" stroke-width="1.4"/>
          <circle cx="82" cy="18" r="3.2" fill="${goldFill}" stroke="${strokeColor}" stroke-width="1.4"/>
          <!-- Royal Gown Highlight -->
          <path d="M36 74 C38 64 42 56 43 51" fill="none" stroke="${rimStroke}" stroke-width="2.2" stroke-linecap="round"/>
        </g>
      `;

    case KING:
      return `
        <g filter="${filter}">
          <!-- Base plinth -->
          <path d="M18 88 h64 c-1 -4 -6 -7 -11 -7 H29 c-5 0 -10 3 -11 7 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Lower ring -->
          <path d="M23 81 h54 c-1 -3 -4 -4 -7 -4 H30 c-3 0 -6 1 -7 4 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}"/>
          <!-- Stately Mantle Body -->
          <path d="M29 77 C31 64 35 52 38 46 h24 C65 52 69 64 71 77 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Crown Ermine Collar -->
          <path d="M26 46 h48 c0 -4 -3 -6 -8 -6 H34 c-5 0 -8 2 -8 6 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}"/>
          <!-- Imperial Crown Arches -->
          <path d="M27 40 C28 24 38 21 50 21 C62 21 72 24 73 40 Z" fill="${bodyGrad}" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
          <!-- Crown Rib Arch Lines -->
          <path d="M50 21 L50 40 M38 23 C42 30 43 35 44 40 M62 23 C58 30 57 35 56 40" fill="none" stroke="${strokeColor}" stroke-width="1.8"/>
          <!-- Ornate Imperial Maltese Cross Pattée on Top -->
          <path d="M48 6 h4 v14 h-4 Z M43 10 h14 v4 h-14 Z" fill="${goldFill}" stroke="${strokeColor}" stroke-width="1.6" stroke-linejoin="round"/>
          <circle cx="50" cy="12" r="2.2" fill="#ffffff" stroke="${strokeColor}" stroke-width="1"/>
          <!-- Royal Mantle Highlight -->
          <path d="M33 74 C35 64 38 54 40 48" fill="none" stroke="${rimStroke}" stroke-width="2.2" stroke-linecap="round"/>
        </g>
      `;

    default:
      return '';
  }
}

export function getPieceSVG(type, color) {
  const normalizedType = type.toLowerCase();
  const defs = DEFS_CACHE[color] || DEFS_CACHE.w;
  const graphics = renderPieceGraphics(normalizedType, color);
  const key = `${color}_${normalizedType}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" class="chess-piece" data-piece="${key}">${defs}${graphics}</svg>`;
}

