import React from 'react';
import { motion } from 'motion/react';
import { BoardState, PlayerMark } from '../types';

interface BoardProps {
  board: BoardState;
  onCellClick: (index: number) => void;
  disabled: boolean;
  currentTurn: PlayerMark;
  winningLine: number[] | null;
  isPreviewMode?: boolean;
  lastMovePosition?: number | null;
  userPlayerMark?: PlayerMark | null;
}

export const Board: React.FC<BoardProps> = ({
  board,
  onCellClick,
  disabled,
  currentTurn,
  winningLine,
  isPreviewMode = false,
  lastMovePosition = null,
  userPlayerMark
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center w-full">
      {/* Bento Board Container */}
      <div 
        id="tictactoe-board-container"
        className={`bg-slate-950/60 p-4 sm:p-6 md:p-8 rounded-3xl border border-white/5 grid grid-cols-3 gap-3 sm:gap-4 md:gap-5 shadow-2xl transition-all ${
          isPreviewMode ? 'ring-2 ring-amber-500/50' : ''
        }`}
      >
        {board.map((cellValue, index) => {
          const isWinningCell = winningLine ? winningLine.includes(index) : false;
          const isLastMove = lastMovePosition === index;
          const isCellEmpty = cellValue === null;
          const canClick = !disabled && !isPreviewMode && isCellEmpty;

          return (
            <button
              key={index}
              id={`board-cell-${index}`}
              onClick={() => {
                if (canClick) {
                  onCellClick(index);
                }
              }}
              disabled={!canClick}
              aria-label={`Cell ${index + 1}: ${cellValue || 'Empty'}`}
              className={`w-20 h-20 sm:w-26 sm:h-26 md:w-28 md:h-28 rounded-2xl flex items-center justify-center relative select-none transition-all duration-200 overflow-hidden ${
                isWinningCell
                  ? 'bg-amber-500/20 border-2 border-amber-400 shadow-lg shadow-amber-500/20'
                  : isLastMove
                  ? 'bg-indigo-600/20 border-2 border-indigo-500 shadow-lg shadow-indigo-500/10'
                  : cellValue !== null
                  ? 'bg-slate-900 border border-slate-800 shadow-inner'
                  : canClick
                  ? 'bg-slate-900/40 border-2 border-dashed border-slate-700/60 hover:border-indigo-500/60 hover:bg-indigo-500/5 hover:scale-[1.03] active:scale-[0.97] cursor-pointer group shadow-sm'
                  : 'bg-slate-900/40 border border-slate-800/80 shadow-inner cursor-default opacity-80'
              }`}
            >
              {/* Position Coordinate Tag */}
              <span className="absolute top-1.5 left-2 text-[10px] font-mono text-slate-600/80 pointer-events-none group-hover:text-slate-400 transition-colors">
                0{index + 1}
              </span>

              {/* Render Mark with Motion SVG / Bento Typography */}
              {cellValue === 'X' && (
                <motion.div
                  initial={{ scale: 0, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="text-5xl sm:text-6xl font-black text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.4)] flex items-center justify-center"
                >
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.div>
              )}

              {cellValue === 'O' && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="text-5xl sm:text-6xl font-black text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)] flex items-center justify-center"
                >
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8" strokeWidth="3.5" />
                  </svg>
                </motion.div>
              )}

              {/* Empty & Clickable Prompt */}
              {isCellEmpty && canClick && (
                <span className="text-slate-600 group-hover:text-indigo-400 text-xs sm:text-sm font-black uppercase tracking-tighter transition-colors">
                  Play
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
