import { Chess, Move, Square, Piece } from "chess.js";
import _ from "lodash";

// Constants for control
const NUM_PIECES = 3;
const NUM_MOVES = 3;
const MAX_DEPTH = 5;
const CENTER_WEIGHT = 0.4;

export function minimax(game: Chess, maximizingPlayer: boolean, depth = MAX_DEPTH): { move: Move | null, score: number } {
    if (depth === 0 || game.isGameOver()) {
        return { move: null, score: evaluateBoard(game, maximizingPlayer) }; // Only return the score at the leaf node
    }

    const moves = game.moves({ verbose: true }) as Move[];
    let bestEval = maximizingPlayer ? -Infinity : Infinity;
    let bestMove: Move | null = null;

    // Get a subset of moves
    const selectedMoves = getRandomMoves(game, NUM_PIECES, NUM_MOVES, moves);

    for (const move of selectedMoves) {
        game.move(move.san);
        const { score: evalScore } = minimax(game, !maximizingPlayer, depth - 1);
        game.undo();

        if (maximizingPlayer) {
            if (evalScore > bestEval) {
                bestEval = evalScore;
                bestMove = move;
            }
        } else {
            if (evalScore < bestEval) {
                bestEval = evalScore;
                bestMove = move;
            }
        }
    }

    return { move: bestMove, score: bestEval };
}


// Function to get random moves from selected pieces
export function getRandomMoves(game: Chess, numPieces: number, numMoves: number, moves: Move[]): Move[] {
    return getRandomSelection(game.moves({ verbose: true }) as Move[], numMoves);
}

// Function to get pieces on the board
export function getPiecesOnBoard(game: Chess): Piece[] {
    const board = game.board();
    const pieces: Piece[] = [];

    board.forEach((row) => {
        row.forEach((piece) => {
            if (piece) pieces.push(piece); // Collect non-null pieces
        });
    });

    return pieces;
}

export function evaluateBoard(game: Chess, maximizingPlayer: boolean): number {
    let score = 0;
    const pieceValues: { [key: string]: number } = {
        p: 1,
        n: 3,
        b: 3,
        r: 5,
        q: 9,
        k: 1000,
    };

    const centerSquares: Square[] = ['d4', 'e4', 'd5', 'e5'];
    const board = game.board();

    board.forEach((row) => {
        row.forEach((piece) => {
            if (piece) {
                const value = pieceValues[piece.type];
                const pieceColorMultiplier = piece.color === 'w' ? 1 : -1;

                // Base score based on piece values
                score += value * pieceColorMultiplier;

                // Check for center control
                const square = piece.square as Square; // Directly use piece's square property
                if (centerSquares.includes(square)) {
                    score += value * CENTER_WEIGHT * pieceColorMultiplier;
                }

                // Check if this piece is attacking opponent’s pieces
                const opponentColor = piece.color === 'w' ? 'b' : 'w';
                if (game.isAttacked(square, opponentColor)) {
                    score += 2 * pieceColorMultiplier; // Bonus for attacking an opponent’s piece
                }

                // Check if this piece is being attacked by the opponent
                if (game.isAttacked(square, piece.color)) {
                    score -= 2 * pieceColorMultiplier; // Penalty for being attacked
                }
            }
        });
    });

    // Check center squares for opponent attacks
    centerSquares.forEach((square) => {
        if (game.isAttacked(square, 'w')) {
            // If the center square is attacked by black (minimizing player)
            score -= maximizingPlayer ? 5 : 5; // Adjust based on the current player
        }
        if (game.isAttacked(square, 'b')) {
            // If the center square is attacked by white (maximizing player)
            score += maximizingPlayer ? 5 : 5; // Adjust based on the current player
        }
    });

    // Checkmate/Check scenarios
    if (game.isCheckmate()) {
        score += maximizingPlayer ? Infinity : -Infinity; // Checkmate is winning/losing
    } else if (game.inCheck()) {
        score += game.turn() === 'w' ? -5 : 5; // Smaller score for being in check
    }

    return score;
}




// Utility function to randomly select items from an array using Lodash
export function getRandomSelection<T>(array: T[], numItems: number): T[] {
    return _.sampleSize(array, numItems);
}
