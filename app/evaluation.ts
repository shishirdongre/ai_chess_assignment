import { Chess, Move, Square, Piece } from "chess.js";

const pieceValues: { [key: string]: number } = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 10,
};

const CENTER_WEIGHT = 0.2;
const OFFENSE_WEIGHT = 0.5;
const PIECE_WEIGHT = 0.8;

const centerSquares: Square[] = ['d4', 'e4', 'd5', 'e5'];

// Piece weight score (40% weight)
function evaluatePieceWeight(game: Chess): number {
    let blackPieceValue = 0;
    let whitePieceValue = 0;

    const board = game.board();

    board.forEach((row) => {
        row.forEach((piece) => {
            if (piece) {
                const value = pieceValues[piece.type];
                if (piece.color === 'b') {
                    blackPieceValue += value;
                } else {
                    whitePieceValue += value;
                }
            }
        });
    });

    // Compute score: more black pieces than white is better for black
    const score = (blackPieceValue / (blackPieceValue + whitePieceValue)) * 100;
    return score; // Return a score out of 100
}

// Center control score (30% weight)
function evaluateCenterControl(game: Chess): number {
    let blackControl = 0;

    const board = game.board();

    board.forEach((row) => {
        row.forEach((piece) => {
            if (piece && piece.color === 'b') {
                // Check if black pieces are in center squares
                const square = piece.square as Square;
                if (centerSquares.includes(square)) {
                    blackControl += pieceValues[piece.type]; // Give weight to black pieces in center
                }

                // Check if black is attacking center squares
                centerSquares.forEach((centerSquare) => {
                    if (game.isAttacked(centerSquare, 'b')) {
                        blackControl += 1; // Add some control score for attacking the center
                    }
                });
            }
        });
    });

    return Math.min((blackControl / 10) * 100, 100); // Scale to a score of 100
}

// Offense vs. defense score
function evaluateOffenseDefense(game: Chess): number {
    let blackOffense = 0;
    let blackDefensePenalty = 0;

    const board = game.board();
    const pieceValues: { [key: string]: number } = {
        p: 1,
        n: 3,
        b: 3,
        r: 5,
        q: 9,
        k: 1000,
    };

    board.forEach((row) => {
        row.forEach((piece) => {
            if (piece && piece.color === 'b') {
                const square = piece.square as Square;
                const opponentColor = 'w';
                const pieceValue = pieceValues[piece.type];

                // Reward black for attacking white pieces
                if (game.isAttacked(square, opponentColor)) {
                    blackOffense += pieceValue * 6; // Reward more for stronger attacks
                }

                // Penalize black for being attacked by white
                if (game.isAttacked(square, 'b')) {
                    blackDefensePenalty += pieceValue * 3; // Higher penalty for being attacked
                }
            }
        });
    });

    // Total offense minus defense penalty
    const totalScore = blackOffense - blackDefensePenalty;
    const offenseDefenseScore = (totalScore + 50) / 100 * 100; // Normalize to scale of 0-100
    return Math.min(Math.max(offenseDefenseScore, 0), 100); // Clamp within [0, 100]
}


// Overall evaluation function
export function evaluateBoard(game: Chess): number {
    const pieceWeightScore = evaluatePieceWeight(game) * PIECE_WEIGHT;
    const centerControlScore = evaluateCenterControl(game) * CENTER_WEIGHT;
    const offenseDefenseScore = evaluateOffenseDefense(game) * OFFENSE_WEIGHT;

    const finalScore = pieceWeightScore + centerControlScore + offenseDefenseScore;
    return finalScore; // Scaled final score between 0 and 100
}


