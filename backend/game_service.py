"""
backend/game_service.py
Service layer for chess game management, move validation,
FEN parsing, legal moves lookup, and PGN export.
"""

from typing import Dict, List, Optional, Any
import chess
import chess.pgn
import io


class GameService:
    @staticmethod
    def get_legal_moves(fen: str, square_name: Optional[str] = None) -> Dict[str, Any]:
        try:
            board = chess.Board(fen)
        except Exception as e:
            return {"success": False, "error": f"Invalid FEN: {str(e)}"}

        legal_moves = []
        target_sq = chess.parse_square(square_name) if square_name else None

        for move in board.legal_moves:
            if target_sq is not None and move.from_square != target_sq:
                continue
            legal_moves.append({
                "from": chess.square_name(move.from_square),
                "to": chess.square_name(move.to_square),
                "promotion": chess.piece_symbol(move.promotion).lower() if move.promotion else None,
                "san": board.san(move),
                "uci": move.uci()
            })

        return {
            "success": True,
            "fen": board.fen(),
            "turn": 'w' if board.turn == chess.WHITE else 'b',
            "is_check": board.is_check(),
            "legal_moves": legal_moves
        }

    @staticmethod
    def validate_and_make_move(fen: str, from_sq: str, to_sq: str, promotion: Optional[str] = None) -> Dict[str, Any]:
        try:
            board = chess.Board(fen)
        except Exception as e:
            return {"success": False, "error": f"Invalid FEN: {str(e)}"}

        prom_piece = None
        if promotion:
            prom_map = {'q': chess.QUEEN, 'r': chess.ROOK, 'b': chess.BISHOP, 'n': chess.KNIGHT}
            prom_piece = prom_map.get(promotion.lower(), chess.QUEEN)

        from_idx = chess.parse_square(from_sq)
        to_idx = chess.parse_square(to_sq)
        move = chess.Move(from_idx, to_idx, promotion=prom_piece)

        if move not in board.legal_moves:
            # Check if promotion was omitted but required
            pawn_move = chess.Move(from_idx, to_idx, promotion=chess.QUEEN)
            if pawn_move in board.legal_moves:
                move = pawn_move
            else:
                return {"success": False, "error": f"Illegal move: {from_sq} to {to_sq}"}

        san = board.san(move)
        is_capture = board.is_capture(move)
        board.push(move)

        status = GameService.evaluate_status(board)

        return {
            "success": True,
            "san": san,
            "uci": move.uci(),
            "is_capture": is_capture,
            "fen": board.fen(),
            "turn": 'w' if board.turn == chess.WHITE else 'b',
            "status": status
        }

    @staticmethod
    def evaluate_status(board: chess.Board) -> Dict[str, Any]:
        is_check = board.is_check()
        is_checkmate = board.is_checkmate()
        is_stalemate = board.is_stalemate()
        is_insufficient = board.is_insufficient_material()
        can_threefold = board.can_claim_threefold_repetition()
        can_fifty = board.can_claim_fifty_moves()

        is_game_over = is_checkmate or is_stalemate or is_insufficient or can_threefold or can_fifty

        winner = None
        reason = None
        title = "In Progress"
        desc = f"{'White' if board.turn == chess.WHITE else 'Black'} to move."

        if is_checkmate:
            winner = 'b' if board.turn == chess.WHITE else 'w'
            reason = "checkmate"
            title = "Checkmate!"
            desc = f"{'White' if winner == 'w' else 'Black'} wins by checkmate."
        elif is_stalemate:
            reason = "stalemate"
            title = "Stalemate!"
            desc = "Draw: No legal moves and king is not in check."
        elif is_insufficient:
            reason = "insufficient_material"
            title = "Draw"
            desc = "Draw: Insufficient material to force checkmate."
        elif can_threefold:
            reason = "threefold_repetition"
            title = "Draw"
            desc = "Draw by threefold repetition."
        elif can_fifty:
            reason = "fifty_move_rule"
            title = "Draw"
            desc = "Draw by fifty-move rule."
        elif is_check:
            title = "Check!"
            desc = f"{'White' if board.turn == chess.WHITE else 'Black'} King is in check!"

        return {
            "is_game_over": is_game_over,
            "is_check": is_check,
            "is_checkmate": is_checkmate,
            "is_stalemate": is_stalemate,
            "is_insufficient": is_insufficient,
            "can_threefold": can_threefold,
            "can_fifty": can_fifty,
            "winner": winner,
            "reason": reason,
            "title": title,
            "description": desc
        }

    @staticmethod
    def export_pgn(moves_san: List[str], white: str = "Player 1", black: str = "Player 2", result: str = "*") -> str:
        game = chess.pgn.Game()
        game.headers["Event"] = "Grandmaster Chess PWA"
        game.headers["White"] = white
        game.headers["Black"] = black
        game.headers["Result"] = result

        board = chess.Board()
        node = game
        for san in moves_san:
            try:
                move = board.parse_san(san)
                node = node.add_variation(move)
                board.push(move)
            except Exception:
                break

        exporter = chess.pgn.StringExporter(headers=True, variations=True, comments=False)
        return game.accept(exporter)
