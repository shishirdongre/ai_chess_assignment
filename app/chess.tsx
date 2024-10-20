'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Chess, Move, Square } from 'chess.js';
import { minimax } from './minimax';

// Dynamically import Chessboard without SSR
const ChessboardNoSSR = dynamic(() => import('chessboardjsx'), { ssr: false });

export default function ChessBoard() {
    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState('start');
    const [squareStyles, setSquareStyles] = useState({});
    const [dropSquareStyle, setDropSquareStyle] = useState({});

    // Handles piece dropping (only drag-and-drop, no click-to-move)
    const onDrop = ({ sourceSquare, targetSquare }: { sourceSquare: Square, targetSquare: Square }) => {
        try {
            const move = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q'
            });

            // Illegal move
            if (move === null) return;

            // Update the board state
            setFen(game.fen());
            setSquareStyles(squareStyling(game.history({ verbose: true })));



            // Add this to trigger minimax for AI's move
            const { move: aiMove } = minimax(game, false); // assuming AI is minimizing player
            if (aiMove === null) {
                console.log('No move found');
                return; // If no move is found, return
            }
            
            game.move({
                from: aiMove.from,
                to: aiMove.to,
            });  // Move the AI's best move
            setFen(game.fen()); // Update the board state

        } catch (error) {
            console.error(error);
        }
    };

    // Highlight the squares with valid moves
    const onMouseOverSquare = (square: Square) => {
        const moves = game.moves({
            square,
            verbose: true,
        });

        if (moves.length === 0) return;

        const squaresToHighlight = moves.map((move) => move.to);
        highlightSquare(square, squaresToHighlight);
    };

    // Remove the highlight from squares
    const onMouseOutSquare = () => {
        setSquareStyles(squareStyling(game.history({ verbose: true })));
    };

    // Drag over event for customizing drop square styles
    const onDragOverSquare = (square: Square) => {
        setDropSquareStyle(
            square === 'e4' || square === 'd4' || square === 'e5' || square === 'd5'
                ? { backgroundColor: 'cornFlowerBlue' }
                : { boxShadow: 'inset 0 0 1px 4px rgb(255, 255, 0)' }
        );
    };

    // Highlight squares with possible moves
    const highlightSquare = (sourceSquare: Square, squaresToHighlight: Square[]) => {
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
        setSquareStyles((prevStyles) => ({
            ...prevStyles,
            ...highlightStyles,
        }));
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <ChessboardNoSSR
                id="chessboard"
                width={600}
                position={fen}
                onDrop={onDrop}
                onMouseOverSquare={onMouseOverSquare}
                onMouseOutSquare={onMouseOutSquare}
                onDragOverSquare={onDragOverSquare}
                boardStyle={{
                    borderRadius: '5px',
                    boxShadow: `0 5px 15px rgba(0, 0, 0, 0.5)`,
                }}
                squareStyles={squareStyles}
                dropSquareStyle={dropSquareStyle}
            />
        </div>
    );
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
