import React from 'react';
import { 
  Copy, 
  Check, 
  Share2, 
  RotateCcw, 
  Bot, 
  User, 
  Users, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { GameDocument, PlayerProfile, PlayerMark, GameWinner } from '../types';

interface GameHeaderProps {
  game: GameDocument;
  currentUser: PlayerProfile | null;
  currentTurn: PlayerMark;
  winner: GameWinner;
  winningLine: number[] | null;
  isAIThinking: boolean;
  onShare: () => void;
  onRestart: () => void;
  onLeaveGame: () => void;
  copiedCode: boolean;
  onCopyCode: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  game,
  currentUser,
  currentTurn,
  winner,
  isAIThinking,
  onShare,
  onRestart,
  onLeaveGame,
  copiedCode,
  onCopyCode,
}) => {
  const isPlayerXTurn = currentTurn === 'X' && !winner;
  const isPlayerOTurn = currentTurn === 'O' && !winner;

  const isUserX = currentUser && game.playerX.uid === currentUser.uid;
  const isUserO = currentUser && game.playerO?.uid === currentUser.uid;

  const getStatusMessage = () => {
    if (game.status === 'WAITING_FOR_PLAYER') {
      return (
        <span className="flex items-center gap-2 text-amber-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          Waiting for Player 2 to join...
        </span>
      );
    }

    if (winner === 'DRAW') {
      return <span className="text-slate-300 font-semibold">Game ended in a Draw!</span>;
    }

    if (winner === 'X' || winner === 'O') {
      const winningPlayer = winner === 'X' ? game.playerX : game.playerO;
      const isWinnerMe = (winner === 'X' && isUserX) || (winner === 'O' && isUserO);
      return (
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          {isWinnerMe ? 'You Won!' : `${winningPlayer?.displayName || `Player ${winner}`} Won!`}
        </span>
      );
    }

    if (isAIThinking) {
      return (
        <span className="flex items-center gap-2 text-indigo-400">
          <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
          Minimax AI is calculating move...
        </span>
      );
    }

    const isMyTurn = (currentTurn === 'X' && isUserX) || (currentTurn === 'O' && isUserO);
    if (isMyTurn) {
      return (
        <span className="text-indigo-400 font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Your turn ({currentTurn})
        </span>
      );
    }

    const activePlayerName = currentTurn === 'X' ? game.playerX.displayName : (game.playerO?.displayName || 'Player O');
    return (
      <span className="text-slate-400">
        {activePlayerName}'s turn ({currentTurn})
      </span>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          id="back-to-menu-btn"
          onClick={onLeaveGame}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Game</span>
        </button>

        <div className="flex items-center gap-2">
          {game.mode === 'MULTIPLAYER' && (
            <button
              id="header-copy-code-btn"
              onClick={onCopyCode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono border border-slate-700 transition cursor-pointer"
              title="Click to copy game code"
            >
              <span className="text-slate-400">Code:</span>
              <span className="font-bold text-indigo-400">{game.code}</span>
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          )}

          {game.mode === 'MULTIPLAYER' && (
            <button
              id="header-share-btn"
              onClick={onShare}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs border border-indigo-500/30 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          )}

          {game.mode === 'AI' && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs border border-slate-700">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Minimax AI ({game.aiDifficulty || 'Unbeatable'})</span>
            </span>
          )}
        </div>
      </div>

      {/* Versus Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 relative">
        {/* Player X Card */}
        <div
          id="player-x-card"
          className={`relative p-3.5 sm:p-4 rounded-xl border transition-all ${
            isPlayerXTurn
              ? 'bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-950/40'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center font-bold text-lg text-indigo-400">
              X
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-400 truncate">Player 1</p>
              <p className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1">
                {game.playerX.displayName}
                {isUserX && <span className="text-[10px] text-indigo-400">(You)</span>}
              </p>
            </div>
          </div>
          {isPlayerXTurn && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-semibold tracking-wider uppercase shadow">
              Thinking
            </span>
          )}
        </div>

        {/* Player O Card */}
        <div
          id="player-o-card"
          className={`relative p-3.5 sm:p-4 rounded-xl border transition-all ${
            isPlayerOTurn
              ? 'bg-slate-800/90 border-rose-500 ring-2 ring-rose-500/30 shadow-lg shadow-rose-950/40'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-500/40 flex items-center justify-center font-bold text-lg text-rose-400">
              O
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-400 truncate">
                {game.mode === 'AI' ? 'Opponent AI' : 'Player 2'}
              </p>
              <p className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1">
                {game.playerO ? game.playerO.displayName : 'Waiting...'}
                {isUserO && <span className="text-[10px] text-rose-400">(You)</span>}
              </p>
            </div>
          </div>
          {isPlayerOTurn && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-semibold tracking-wider uppercase shadow">
              Thinking
            </span>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          {getStatusMessage()}
        </div>

        {winner && (
          <button
            id="rematch-btn"
            onClick={onRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Play Again</span>
          </button>
        )}
      </div>
    </div>
  );
};
