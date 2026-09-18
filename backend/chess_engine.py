"""
backend/chess_engine.py
Python-powered Chess AI engine utilizing python-chess with
Alpha-Beta pruning, Piece-Square Tables (PST), Move Ordering,
and Quiescence search.
"""

import random
import chess

# Material valuations (centipawns)
PIECE_VALUES = {
    chess.PAWN: 100,
    chess.KNIGHT: 320,
    chess.BISHOP: 330,
    chess.ROOK: 500,
    chess.QUEEN: 900,
    chess.KING: 20000,
}

# Piece-Square Tables (PST) - evaluated from White's perspective (rank 1 to 8)
PST_PAWN = [
    0,   0,   0,   0,   0,   0,   0,   0,
    50,  50,  50,  50,  50,  50,  50,  50,
    10,  10,  20,  30,  30,  20,  10,  10,
     5,   5,  10,  25,  25,  10,   5,   5,
     0,   0,   0,  20,  20,   0,   0,   0,
     5,  -5, -10,   0,   0, -10,  -5,   5,
     5,  10,  10, -20, -20,  10,  10,   5,
     0,   0,   0,   0,   0,   0,   0,   0
]

PST_KNIGHT = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20,   0,   0,   0,   0, -20, -40,
    -30,   0,  10,  15,  15,  10,   0, -30,
    -30,   5,  15,  20,  20,  15,   5, -30,
    -30,   0,  15,  20,  20,  15,   0, -30,
    -30,   5,  10,  15,  15,  10,   5, -30,
    -40, -20,   0,   5,   5,   0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
]

PST_BISHOP = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -10,   0,   5,  10,  10,   5,   0, -10,
    -10,   5,   5,  10,  10,   5,   5, -10,
    -10,   0,  10,  10,  10,  10,   0, -10,
    -10,  10,  10,  10,  10,  10,  10, -10,
    -10,   5,   0,   0,   0,   0,   5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20
]

PST_ROOK = [
      0,   0,   0,   0,   0,   0,   0,   0,
      5,  10,  10,  10,  10,  10,  10,   5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
      0,   0,   0,   5,   5,   0,   0,   0
]

PST_QUEEN = [
    -20, -10, -10,  -5,  -5, -10, -10, -20,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -10,   0,   5,   5,   5,   5,   0, -10,
     -5,   0,   5,   5,   5,   5,   0,  -5,
      0,   0,   5,   5,   5,   5,   0,  -5,
    -10,   5,   5,   5,   5,   5,   0, -10,
    -10,   0,   5,   0,   0,   0,   0, -10,
    -20, -10, -10,  -5,  -5, -10, -10, -20
]

PST_KING_MID = [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
     20,  20,   0,   0,   0,   0,  20,  20,
     20,  30,  10,   0,   0,  10,  30,  20
]

PST_TABLES = {
    chess.PAWN: PST_PAWN,
    chess.KNIGHT: PST_KNIGHT,
    chess.BISHOP: PST_BISHOP,
    chess.ROOK: PST_ROOK,
    chess.QUEEN: PST_QUEEN,
    chess.KING: PST_KING_MID,
}

CHECKMATE_SCORE = 100000


def evaluate_board(board: chess.Board) -> int:
    """Static evaluation function returning score from White's perspective."""
    if board.is_checkmate():
        return -CHECKMATE_SCORE if board.turn == chess.WHITE else CHECKMATE_SCORE
    if board.is_stalemate() or board.is_insufficient_material() or board.can_claim_threefold_repetition():
        return 0

    score = 0
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if not piece:
            continue

        val = PIECE_VALUES.get(piece.piece_type, 0)
        pst = PST_TABLES.get(piece.piece_type, None)

        if pst:
            # Map square to 0..63 for White or flipped for Black
            sq_idx = square if piece.color == chess.WHITE else chess.square_mirror(square)
            pst_val = pst[63 - sq_idx]
        else:
            pst_val = 0

        total_piece_score = val + pst_val
        if piece.color == chess.WHITE:
            score += total_piece_score
        else:
            score -= total_piece_score

    return score


def score_move(board: chess.Board, move: chess.Move) -> int:
    """Move ordering heuristic: MVV-LVA for captures, checks, promotions."""
    score = 0
    if board.is_capture(move):
        victim = board.piece_at(move.to_square)
        attacker = board.piece_at(move.from_square)
        victim_val = PIECE_VALUES.get(victim.piece_type if victim else chess.PAWN, 100)
        attacker_val = PIECE_VALUES.get(attacker.piece_type if attacker else chess.PAWN, 100)
        score += 10000 + (victim_val * 10 - attacker_val)

    if move.promotion:
        score += 8000

    board.push(move)
    if board.is_check():
        score += 5000
    board.pop()

    return score


def quiescence_search(board: chess.Board, alpha: int, beta: int, max_depth: int = 4) -> int:
    """Tactical capture search to prevent the horizon effect."""
    turn_factor = 1 if board.turn == chess.WHITE else -1
    stand_pat = evaluate_board(board) * turn_factor

    if stand_pat >= beta:
        return beta
    if alpha < stand_pat:
        alpha = stand_pat

    if max_depth <= 0:
        return alpha

    capture_moves = [m for m in board.legal_moves if board.is_capture(m)]
    capture_moves.sort(key=lambda m: score_move(board, m), reverse=True)

    for move in capture_moves:
        board.push(move)
        score = -quiescence_search(board, -beta, -alpha, max_depth - 1)
        board.pop()

        if score >= beta:
            return beta
        if score > alpha:
            alpha = score

    return alpha


def negamax(board: chess.Board, depth: int, alpha: int, beta: int, nodes: list) -> int:
    """Negamax search with Alpha-Beta pruning."""
    nodes[0] += 1

    if board.is_checkmate():
        return -CHECKMATE_SCORE + (10 - depth)
    if board.is_stalemate() or board.is_insufficient_material() or board.can_claim_threefold_repetition():
        return 0

    if depth <= 0:
        return quiescence_search(board, alpha, beta)

    legal_moves = list(board.legal_moves)
    if not legal_moves:
        return 0

    legal_moves.sort(key=lambda m: score_move(board, m), reverse=True)

    best_score = -float('inf')
    for move in legal_moves:
        board.push(move)
        score = -negamax(board, depth - 1, -beta, -alpha, nodes)
        board.pop()

        if score > best_score:
            best_score = score
        if score > alpha:
            alpha = score
        if alpha >= beta:
            break

    return best_score


class ChessAI:
    """High-Performance Python Chess AI engine."""

    @staticmethod
    def get_best_move(board: chess.Board, difficulty: str = 'medium') -> dict:
        legal_moves = list(board.legal_moves)
        if not legal_moves:
            return {"move": None, "san": None, "eval": 0, "nodes": 0}

        difficulty = difficulty.lower()

        # EASY: fast moves with 40% random variance and 60% depth 1 best capture/PST
        if difficulty == 'easy':
            if random.random() < 0.4:
                chosen_move = random.choice(legal_moves)
                san = board.san(chosen_move)
                return {
                    "move": chosen_move.uci(),
                    "from": chess.square_name(chosen_move.from_square),
                    "to": chess.square_name(chosen_move.to_square),
                    "promotion": chess.piece_symbol(chosen_move.promotion).lower() if chosen_move.promotion else None,
                    "san": san,
                    "eval": 0,
                    "nodes": 1
                }
            depth = 1

        # MEDIUM: solid tactical depth 2 search with PST and move ordering
        elif difficulty == 'medium':
            depth = 2

        # HARD: deep depth 3-4 alpha-beta search with quiescence search
        else:
            depth = 3

        nodes = [0]
        best_move = None
        best_score = -float('inf')
        alpha = -float('inf')
        beta = float('inf')

        # Sort top-level moves
        legal_moves.sort(key=lambda m: score_move(board, m), reverse=True)

        for move in legal_moves:
            board.push(move)
            score = -negamax(board, depth - 1, -beta, -alpha, nodes)
            board.pop()

            if score > best_score or best_move is None:
                best_score = score
                best_move = move
            if score > alpha:
                alpha = score

        san = board.san(best_move)
        return {
            "move": best_move.uci(),
            "from": chess.square_name(best_move.from_square),
            "to": chess.square_name(best_move.to_square),
            "promotion": chess.piece_symbol(best_move.promotion).lower() if best_move.promotion else None,
            "san": san,
            "eval": int(best_score if board.turn == chess.WHITE else -best_score),
            "nodes": nodes[0]
        }
