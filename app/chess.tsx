'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Chess, Move, Square } from 'chess.js';
import { monteCarlo } from './montecarlo';
import _ from 'lodash';

// Dynamically import Chessboard without SSR
const ChessboardNoSSR = dynamic(() => import('chessboardjsx'), { ssr: false });
const MOVES_LIMIT = 5000;

export default function ChessBoard() {
    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState('start');
    const [squareStyles, setSquareStyles] = useState({});
    const [dropSquareStyle, setDropSquareStyle] = useState({});
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [turn, setTurn] = useState('w');

    // Function to start the game with random white and Monte Carlo black players
    const startGame = () => {
        setIsGameStarted(true);  // Mark the game as started
        runGameLoop();  // Begin the automated game loop
    };

    // Function to simulate 50 moves or until the game ends
    const runGameLoop = async () => {
        let moveCount = 0;
        while (game.moveNumber() < MOVES_LIMIT && !game.isGameOver()) {
            await new Promise((resolve) => setTimeout(resolve, 10));  // Add a small delay between moves
            console.log('in game loop')
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
                console.log('black to play')

                const { move: aiMove } = monteCarlo(game);  // Black is the Monte Carlo player
                if (aiMove) {
                    game.move({
                        from: aiMove.from as Square,
                        to: aiMove.to as Square,
                        promotion: 'q',  // Always promote to queen
                    });
                    setFen(game.fen());
                    // setSquareStyles(squareStyling(game.history({ verbose: true })));
                }
            }
        }
        if (game.isGameOver()) {
            alert("Game over!");
        } else if (game.moveNumber() >= MOVES_LIMIT) {
            alert("50 moves completed.");
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh' }}>
            <ChessboardNoSSR
                id="chessboard"
                width={600}
                position={fen}
                // onMouseOverSquare={(square: Square) => onMouseOverSquare(square, game, setSquareStyles)}
                // onMouseOutSquare={() => setSquareStyles(squareStyling(game.history({ verbose: true })))}
                // onDragOverSquare={o{(square: Square) => onMouseOverSquare(square, game, setSquareStyles)}
                // onMouseOutSquare={(nDragOverSquare}
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

            {/* <h3>{turn === 'w' ? 'White to play' : 'Black to play'}</h3> */}
        </div>
    );
}

// Function to highlight squares with possible moves
function onMouseOverSquare(square: Square, game: Chess, setSquareStyles: any) {
    const moves = game.moves({
        square,
        verbose: true,
    });

    if (moves.length === 0) return;

    const squaresToHighlight = moves.map((move) => move.to);
    highlightSquare(square, squaresToHighlight, setSquareStyles);
}

// Function to highlight the squares with valid moves
function highlightSquare(sourceSquare: Square, squaresToHighlight: Square[], setSquareStyles: any) {
    const highlightStyles = [sourceSquare, ...squaresToHighlight].reduce(
        (a, c) => ({
            ...a,
            [c]: {
                background: 'radial-gradient(circle, #fffc00 36%, transparent 40%)',
                borderRadius: '50%',
            },
        }),
        {}
    );
    setSquareStyles((prevStyles: any) => ({
        ...prevStyles,
        ...highlightStyles,
    }));
}

// Function to apply square styling (history, last move)
const squareStyling = (history: Move[]) => {
    const sourceSquare = history.length && history[history.length - 1].from;
    const targetSquare = history.length && history[history.length - 1].to;

    return {
        [sourceSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
        [targetSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
    };
};

// Function to handle drag over event for drop square styles
function onDragOverSquare(square: Square, setDropSquareStyle: any) {
    setDropSquareStyle(
        square === 'e4' || square === 'd4' || square === 'e5' || square === 'd5'
            ? { backgroundColor: 'cornFlowerBlue' }
            : { boxShadow: 'inset 0 0 1px 4px rgb(255, 255, 0)' }
    );
}
