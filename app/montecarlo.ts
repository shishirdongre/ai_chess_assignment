import { Chess, Move, Square, Piece } from "chess.js";
import _ from "lodash";
import { evaluateBoard } from "./evaluation";

// Constants for control
export const MAX_DEPTH = 10;
const TRIALS_PER_MOVE = 20;
const NUM_MOVES_TO_TEST = 20;

// Monte Carlo Tree Search
export function monteCarlo(game: Chess, depth = MAX_DEPTH): { move: Move | null, score: number } {
    if (depth === 0 || game.isGameOver()) {
        return { move: null, score: evaluateBoard(game) };  // Return the evaluation score at the leaf node
    }

    const moves = game.moves({ verbose: true }) as Move[];
    const selectedMoves = getRandomSelection(moves, NUM_MOVES_TO_TEST);
    let bestMove: Move | null = null;
    let bestAvgScore = Infinity;  // Always minimize since black is the Monte Carlo player

    // Simulate trials for each move
    for (let i = 0; i < selectedMoves.length; i++) {
        const move = selectedMoves[i];
        let totalScore = 0;

        // Run multiple trials for each move
        for (let j = 0; j < TRIALS_PER_MOVE; j++) {
            game.move(move.san);
            const trialScore = runRandomTrial(game, MAX_DEPTH);  // Run a trial with random moves
            game.undo();  // Undo the move

            totalScore += trialScore;  // Accumulate the trial score
        }

        const avgScore = totalScore / TRIALS_PER_MOVE;  // Calculate average score for this move

        // Update the best move based on the minimizing player's strategy
        if (avgScore < bestAvgScore) {
            bestAvgScore = avgScore;
            bestMove = move;
        }
    }

    return { move: bestMove, score: bestAvgScore };
}

// Run a random trial for a given game state
function runRandomTrial(game: Chess, depth: number): number {
    let currentDepth = 0;

    while (currentDepth < depth && !game.isGameOver()) {
        const possibleMoves = game.moves({ verbose: true }) as Move[];

        // Select a random move
        const randomMove = getRandomSelection(possibleMoves, 1)[0];
        game.move(randomMove.san);

        currentDepth++;
    }

    const score = evaluateBoard(game);  // Evaluate the board at the final position
    // Undo all moves made in this trial
    for (let i = 0; i < currentDepth; i++) {
        game.undo();
    }

    return score;  // Return the final score of the trial
}

// Utility function to randomly select items from an array using Lodash
export function getRandomSelection<T>(array: T[], numItems: number): T[] {
    return _.sampleSize(array, numItems);
}
