"""
tests/test_backend.py
Unit and integration tests for the Python Chess Backend API & AI Engine.
"""

import sys
import os
import unittest
import json
import chess

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app
from backend.chess_engine import ChessAI, evaluate_board
from backend.game_service import GameService


class TestChessBackend(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_health_check(self):
        res = self.app.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data.get("status"), "healthy")

    def test_ai_move_starting_position(self):
        res = self.app.post("/api/ai-move", json={
            "fen": chess.STARTING_FEN,
            "difficulty": "medium"
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data.get("success"))
        self.assertIn("move", data)
        self.assertIn("san", data)
        self.assertIsNotNone(data["move"].get("from"))
        self.assertIsNotNone(data["move"].get("to"))

    def test_ai_finds_mate_in_one(self):
        # Scholar's Mate setup: White to move, Qh7# or Qxf7#
        # FEN with Qxf7# ready: 1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#
        board = chess.Board("r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4")
        result = ChessAI.get_best_move(board, difficulty="hard")
        self.assertEqual(result["san"], "Qxf7#")

    def test_legal_moves_endpoint(self):
        res = self.app.post("/api/legal-moves", json={
            "fen": chess.STARTING_FEN,
            "square": "e2"
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data.get("success"))
        # Pawn on e2 can move to e3 or e4
        targets = [m["to"] for m in data["legal_moves"]]
        self.assertIn("e3", targets)
        self.assertIn("e4", targets)

    def test_validate_and_make_move(self):
        res = self.app.post("/api/validate-move", json={
            "fen": chess.STARTING_FEN,
            "from": "e2",
            "to": "e4"
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("san"), "e4")
        self.assertEqual(data.get("turn"), "b")

    def test_game_status_checkmate(self):
        # Fool's mate position: Black just played Qh4#
        # 1. f3 e5 2. g4 Qh4#
        board = chess.Board("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3")
        status = GameService.evaluate_status(board)
        self.assertTrue(status["is_game_over"])
        self.assertTrue(status["is_checkmate"])
        self.assertEqual(status["winner"], "b")
        self.assertEqual(status["reason"], "checkmate")

    def test_game_status_stalemate(self):
        # Stalemate position
        board = chess.Board("k7/8/1Q6/8/8/8/8/7K b - - 0 1")
        status = GameService.evaluate_status(board)
        self.assertTrue(status["is_game_over"])
        self.assertTrue(status["is_stalemate"])
        self.assertIsNone(status["winner"])
        self.assertEqual(status["reason"], "stalemate")

    def test_export_pgn(self):
        moves = ["e4", "e5", "Nf3", "Nc6", "Bb5"]
        res = self.app.post("/api/export-pgn", json={
            "moves": moves,
            "white": "Magnus",
            "black": "Hikaru",
            "result": "1-0"
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data.get("success"))
        self.assertIn("Magnus", data.get("pgn"))
        self.assertIn("1. e4 e5", data.get("pgn"))


if __name__ == "__main__":
    unittest.main()
