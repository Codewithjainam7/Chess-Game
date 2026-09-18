"""
backend/app.py
Flask Web Application serving static frontend assets and
providing full FIDE chess engine REST API endpoints.
"""

import os
from flask import Flask, request, jsonify, send_from_directory
import chess

from backend.chess_engine import ChessAI
from backend.game_service import GameService

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

app = Flask(__name__, static_folder=PROJECT_ROOT)


# ============================================================================
# API Endpoints
# ============================================================================

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "engine": "Python-Chess AI",
        "version": "1.0.0",
        "mode": "hybrid"
    })


@app.route("/api/ai-move", methods=["POST"])
def get_ai_move():
    data = request.get_json() or {}
    fen = data.get("fen")
    difficulty = data.get("difficulty", "medium")

    if not fen:
        return jsonify({"success": False, "error": "Missing 'fen' parameter"}), 400

    try:
        board = chess.Board(fen)
    except Exception as e:
        return jsonify({"success": False, "error": f"Invalid FEN: {str(e)}"}), 400

    if board.is_game_over():
        status = GameService.evaluate_status(board)
        return jsonify({"success": False, "error": "Game is already over", "status": status}), 400

    ai_result = ChessAI.get_best_move(board, difficulty=difficulty)

    if not ai_result or not ai_result.get("move"):
        return jsonify({"success": False, "error": "No legal moves available"}), 400

    # Simulate move on board to get new status & FEN
    move_obj = chess.Move.from_uci(ai_result["move"])
    board.push(move_obj)
    status = GameService.evaluate_status(board)

    return jsonify({
        "success": True,
        "move": {
            "from": ai_result["from"],
            "to": ai_result["to"],
            "promotion": ai_result["promotion"],
            "uci": ai_result["move"]
        },
        "san": ai_result["san"],
        "eval": ai_result["eval"],
        "nodes": ai_result["nodes"],
        "fen": board.fen(),
        "turn": 'w' if board.turn == chess.WHITE else 'b',
        "status": status
    })


@app.route("/api/legal-moves", methods=["POST"])
def legal_moves():
    data = request.get_json() or {}
    fen = data.get("fen", chess.STARTING_FEN)
    square = data.get("square")

    result = GameService.get_legal_moves(fen, square_name=square)
    return jsonify(result), 200 if result.get("success") else 400


@app.route("/api/validate-move", methods=["POST"])
def validate_move():
    data = request.get_json() or {}
    fen = data.get("fen")
    from_sq = data.get("from")
    to_sq = data.get("to")
    promotion = data.get("promotion")

    if not all([fen, from_sq, to_sq]):
        return jsonify({"success": False, "error": "Missing required fields ('fen', 'from', 'to')"}), 400

    result = GameService.validate_and_make_move(fen, from_sq, to_sq, promotion)
    return jsonify(result), 200 if result.get("success") else 400


@app.route("/api/game-status", methods=["POST"])
def game_status():
    data = request.get_json() or {}
    fen = data.get("fen")
    if not fen:
        return jsonify({"success": False, "error": "Missing 'fen' parameter"}), 400

    try:
        board = chess.Board(fen)
    except Exception as e:
        return jsonify({"success": False, "error": f"Invalid FEN: {str(e)}"}), 400

    status = GameService.evaluate_status(board)
    return jsonify({"success": True, "status": status})


@app.route("/api/export-pgn", methods=["POST"])
def export_pgn():
    data = request.get_json() or {}
    moves = data.get("moves", [])
    white = data.get("white", "Player 1")
    black = data.get("black", "Player 2")
    result = data.get("result", "*")

    pgn_str = GameService.export_pgn(moves, white=white, black=black, result=result)
    return jsonify({"success": True, "pgn": pgn_str})


# ============================================================================
# Static Files & PWA Asset Serving
# ============================================================================

@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def serve_static(path):
    full_path = os.path.join(PROJECT_ROOT, path)
    if os.path.isfile(full_path):
        return send_from_directory(PROJECT_ROOT, path)
    return send_from_directory(PROJECT_ROOT, "index.html")


def create_app():
    return app


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5173, debug=False)
