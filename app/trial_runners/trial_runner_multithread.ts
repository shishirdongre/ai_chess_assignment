import { parentPort, workerData } from 'worker_threads';
import { Chess } from "chess.js";
import _ from "lodash";
import { monteCarlo } from "../montecarlo";

// Constants
const MOVES_LIMIT = 500;

// Function to simulate a single chess game
async function runGame(trialNumber: number) {
    const game = new Chess();
    let moveCount = 0;
    let totalDecisionTime = 0;

    while (game.moveNumber() < MOVES_LIMIT && !game.isGameOver()) {
        // Random White Player
        if (game.turn() === 'w') {
            const whiteMoves = game.moves({ verbose: true });
            const randomWhiteMove = _.sample(whiteMoves); // Random move

            if (randomWhiteMove) {
                game.move(randomWhiteMove.san);
            }
        }

        // Monte Carlo Black Player
        if (game.turn() === 'b' && !game.isGameOver()) {
            const decisionStartTime = performance.now();
            const { move: aiMove } = monteCarlo(game);  // Monte Carlo AI
            const decisionEndTime = performance.now();
            const decisionTime = decisionEndTime - decisionStartTime;

            totalDecisionTime += decisionTime;

            if (aiMove) {
                game.move(aiMove.san);
            }
        }

        moveCount++;
    }

    // Evaluate the winner
    let winner = "Draw";
    if (game.isCheckmate()) {
        winner = game.turn() === 'w' ? 'Black' : 'White';
    }

    // If the game hits the move limit, evaluate based on remaining pieces
    if (game.moveNumber() >= MOVES_LIMIT) {
        const pieceScores = evaluateFinalScore(game);
        winner = pieceScores.blackScore > pieceScores.whiteScore ? "Black" : pieceScores.whiteScore > pieceScores.blackScore ? "White" : "Draw";
    }

    const avgDecisionTime = totalDecisionTime / moveCount;

    return {
        trial: trialNumber,
        winner,
        moveCount,
        avgDecisionTime: avgDecisionTime.toFixed(2),
    };
}

// Function to evaluate the final board score after move limit
function evaluateFinalScore(game) {
    const pieceValues = {
        p: 1,
        n: 3,
        b: 3,
        r: 5,
        q: 9,
    };

    let whiteScore = 0;
    let blackScore = 0;

    const board = game.board();
    board.forEach((row) => {
        row.forEach((piece) => {
            if (piece && piece.type !== 'k') {  // Exclude kings
                if (piece.color === 'w') {
                    whiteScore += pieceValues[piece.type];
                } else if (piece.color === 'b') {
                    blackScore += pieceValues[piece.type];
                }
            }
        });
    });

    return { whiteScore, blackScore };
}

// Run the game and send results back to the parent
(async () => {
    const result = await runGame(workerData.trialNumber);
    parentPort?.postMessage(result);  // Send the result back to the main thread
})();
