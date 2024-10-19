import argparse

from data.classes.ChessMatch import chess_match
from data.classes.agents.RandomPlayer import RandomPlayer
from data.classes.agents.HumanPlayer import HumanPlayer
from data.classes.agents.MinimaxPlayer import MinimaxPlayer
from data.classes.agents.ChessAgent import ChessAgent

import os 
# Set SDL environment variables
os.environ['SDL_VIDEO_MINIMIZE_ON_FOCUS_LOSS'] = '0'
os.environ['SDL_VIDEO_X11_NET_WM_BYPASS_COMPOSITOR'] = '0'

def main():
    parser = argparse.ArgumentParser(description="Initialize players for the game.")
    parser.add_argument('white', type=str, help="Type of the white player")
    parser.add_argument('black', type=str, help="type of the black player")
    args = parser.parse_args()
    if args.white not in globals().keys():
        print(f'White player {args.white} not found!')
        return
    if args.black not in globals().keys():
        print(f'Black player {args.black} not found!')
        return
    white_player: ChessAgent = globals()[args.white]('white')
    black_player: ChessAgent = globals()[args.black]('black')
    chess_match(white_player, black_player)

if __name__ == '__main__':
    main()