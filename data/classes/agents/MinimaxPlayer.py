import random
from data.classes.Square import Square
from data.classes.Board import Board
from data.classes.agents.ChessAgent import ChessAgent
import copy
import numpy as np
import random

# Piece weights
PIECE_WEIGHTS = {
    " ": 1,
    "N": 3,
    "B": 3,
    "R": 5,
    "Q": 9,
    # Assign a very high value to the king to avoid losing it
    "K": 1000  
}

class MinimaxPlayer(ChessAgent):
    def choose_action(self, board: Board, depth: int = 3):
        # Start Minimax as the maximizer
        best_move = self.minimax(board, depth, True)[1]
        return best_move

    def minimax(self, board: Board, depth: int, is_maximizing_player: bool):
        print('depth: ', depth)
        if depth == 0 or self.is_game_over(board):
            if self.is_game_over(board):
                if self.get_winner(board) == self.color:  
                    return float('inf'), None 
                else:
                    return float('-inf'), None  
            else:
                return self.evaluate_board(board), None


        possible_moves = self.get_all_possible_moves(board)
        print('possible_moves', len(possible_moves), possible_moves)
        if len(possible_moves) > 2:
            # possible_moves = np.random.choice(possible_moves, 5, replace=False).tolist()
            possible_moves = random.sample(possible_moves, 2)

        print("possible_movies", len(possible_moves), possible_moves)

        if is_maximizing_player:
            # Maximizing player's turn
            max_eval = float('-inf')
            best_move = None
            for move in possible_moves:
                board_copy = copy.deepcopy(board)
                self.make_move(board_copy, move)
                eval = self.minimax(board_copy, depth - 1, False)[0]
                print('eval score 54: ', eval, max_eval)
                if eval > max_eval:
                    max_eval = eval
                    best_move = move
            return max_eval, best_move
        else:
            # Minimizing opponent's turn
            min_eval = float('inf')
            best_move = None
            for move in possible_moves:
                board_copy = copy.deepcopy(board)
                self.make_move(board_copy, move)
                eval = self.minimax(board_copy, depth - 1, True)[0]
                print('eval score 67: ', eval, min_eval)
                if eval < min_eval:
                    min_eval = eval
                    best_move = move
            return min_eval, best_move

    def evaluate_board(self, board: Board):
        """
        Evaluate the board by calculating the difference in the sum of the piece weights
        for the current player and the opponent.
        """
        score = 0
        for square in board.squares:
            piece = square.occupying_piece
            if piece is not None:
                print('piece: ', piece.color, self.color, piece.notation, PIECE_WEIGHTS[piece.notation])
                # print('piece: ', piece)
                if piece.color == self.color:  # Maximizing player's piece
                    score += PIECE_WEIGHTS[piece.notation]
                else:  # Minimizing player's piece
                    score -= PIECE_WEIGHTS[piece.notation]
            print('score: ', score)
        return score

    def get_all_possible_moves(self, board: Board):
        """
        Get all possible moves for the current player.
        """
        possible_moves = []
        for square in board.squares:
            if square.occupying_piece != None \
               and square.occupying_piece.color == self.color:
                for target in square.occupying_piece.get_valid_moves(board):
                    possible_moves.append((square, target))
        return possible_moves

    def make_move(self, board: Board, move: tuple[Square, Square]):
        """
        Make a move on the board by moving a piece from the start square to the target square.
        """
        start_square, target_square = move
        target_square.occupying_piece = start_square.occupying_piece
        start_square.occupying_piece = None

    def is_game_over(self, board: Board):
        return board.is_in_checkmate(board.turn)
