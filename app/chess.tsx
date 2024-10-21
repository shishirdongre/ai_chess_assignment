'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Chess, Move, Square } from 'chess.js';
import { monteCarlo } from './montecarlo';
import _ from 'lodash';

// Dynamically import Chessboard without SSR
const ChessboardNoSSR = dynamic(() => import('chessboardjsx'), { ssr: false });
const MOVES_LIMIT = 500;
const performance = typeof window !== 'undefined' ? window.performance : null;

export default function ChessBoard() {
    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState('start');
    const [squareStyles, setSquareStyles] = useState({});
    const [dropSquareStyle, setDropSquareStyle] = useState({});
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [turn, setTurn] = useState('w');
    const [totalMoves, setTotalMoves] = useState(0); // Count the total number of moves
    const [totalTime, setTotalTime] = useState(0); // Track total time for decision making
    const [gameOverMessage, setGameOverMessage] = useState('');

    // Function to start the game with random white and Monte Carlo black players
    const startGame = () => {
        setIsGameStarted(true);  // Mark the game as started
        runGameLoop();  // Begin the automated game loop
    };

    // Function to evaluate the board score after 500 moves
    const evaluateFinalScore = (game: Chess) => {
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
    };

    // Function to simulate moves or until the game ends
    const runGameLoop = async () => {
        let moveCount = 0;
        let startTime = performance?.now() ?? 0;

        while (game.moveNumber() < MOVES_LIMIT && !game.isGameOver()) {
            await new Promise((resolve) => setTimeout(resolve, 50));  // Add a small delay between moves

            // White player (random move)
            if (game.turn() === 'w') {
                console.log('white to play');
                let retryCount = 0;
                let moveSuccess = false;

                while (retryCount < 3 && !moveSuccess) {
                    try {
                        const whiteMoves = game.moves({ verbose: true }) as Move[];
                        const randomWhiteMove = _.sample(whiteMoves);  // Get a random move

                        if (randomWhiteMove) {
                            game.move({
                                from: randomWhiteMove.from as Square,
                                to: randomWhiteMove.to as Square,
                            });
                            setFen(game.fen());
                            moveSuccess = true;  // Mark as success if the move was successful
                        }
                    } catch (error) {
                        console.error('Error executing random white move:', error);
                        retryCount++;  // Increment retry count
                    }
                }

                if (!moveSuccess) {
                    console.error('Failed to make a valid white move after 3 retries.');
                }
            }

            // Black player (Monte Carlo)
            if (game.turn() === 'b' && !game.isGameOver()) {
                console.log('black to play');

                // Measure time for Monte Carlo decision
                const decisionStartTime = performance?.now() ?? 0;

                const { move: aiMove } = monteCarlo(game);  // Black is the Monte Carlo player

                const decisionEndTime = performance?.now() ?? 0;
                const decisionTime = decisionEndTime - decisionStartTime;
                setTotalTime(prevTime => prevTime + decisionTime);  // Add decision time to the total

                if (aiMove) {
                    game.move({
                        from: aiMove.from as Square,
                        to: aiMove.to as Square,
                        promotion: 'q',  // Always promote to queen
                    });
                    setFen(game.fen());
                }
            }

            moveCount++;
            setTotalMoves(moveCount);
        }

        const totalGameTime = (performance?.now() ?? 0 - startTime) / 1000;  // Total time in seconds
        setTotalTime(totalGameTime);

        if (game.isGameOver()) {
            const result = game.isDraw() ? 'Draw' : game.turn() === 'w' ? 'Black wins' : 'White wins';
            setGameOverMessage(`Game over! Result: ${result}`);
        } else if (game.moveNumber() >= MOVES_LIMIT) {
            const { whiteScore, blackScore } = evaluateFinalScore(game);
            const result = blackScore > whiteScore ? 'Black wins' : whiteScore > blackScore ? 'White wins' : 'Draw';
            setGameOverMessage(`50 moves completed. Result: ${result}`);
        }

        console.log(`Total moves: ${moveCount}`);
        console.log(`Average decision time per move: ${(totalTime / moveCount).toFixed(2)} seconds`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh' }}>
            <ChessboardNoSSR
                id="chessboard"
                width={600}
                position={fen}
                boardStyle={{
                    borderRadius: '5px',
                    boxShadow: `0 5px 15px rgba(0, 0, 0, 0.5)`,
                }}
                squareStyles={squareStyles}
                dropSquareStyle={dropSquareStyle}
            />

            {!isGameStarted && (
                <button onClick={startGame} style={{ marginTop: '20px' }}>
                    Start Game
                </button>
            )}

            {isGameStarted && (
                <div style={{ marginTop: '20px' }}>
                    <p>Total Moves: {totalMoves}</p>
                    {/* <p>Average Decision Time: {(totalTime / totalMoves).toFixed(2)} seconds</p> */}
                    <p>{gameOverMessage}</p>
                </div>
            )}
        </div>
    );
}
