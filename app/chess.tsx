'use client'

import dynamic from 'next/dynamic';

// Dynamically import Chessboard without SSR
const ChessboardNoSSR = dynamic(() => import('chessboardjsx'), { ssr: false });

export default function Chess() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <ChessboardNoSSR position="start" />
    </div>
  );
}
