import React from 'react';
import { 
  Trophy, 
  X, 
  Flame, 
  Target, 
  Bot, 
  Users, 
  Award, 
  Percent
} from 'lucide-react';
import { UserStats, PlayerProfile } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats | null;
  currentUser: PlayerProfile | null;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  currentUser
}) => {
  if (!isOpen) return null;

  const total = stats?.totalGames || 0;
  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const draws = stats?.draws || 0;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const streak = stats?.currentStreak || 0;
  const bestStreak = stats?.bestStreak || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1117]/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="stats-modal"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-black/60 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100">Player Statistics</h2>
              <p className="text-xs text-slate-400">{currentUser?.displayName || 'Your Profile'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Highlights Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-2xl font-black text-slate-100">{total}</span>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Played</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center">
              <span className="text-2xl font-black text-emerald-400">{wins}</span>
              <p className="text-[11px] font-medium text-emerald-300 mt-0.5">Victories</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-center">
              <span className="text-2xl font-black text-indigo-400">{winRate}%</span>
              <p className="text-[11px] font-medium text-indigo-300 mt-0.5">Win Rate</p>
            </div>
          </div>

          {/* Streaks & Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Current Streak</p>
                <p className="text-base font-bold text-slate-100">{streak} Games</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Best Streak</p>
                <p className="text-base font-bold text-slate-100">{bestStreak} Games</p>
              </div>
            </div>
          </div>

          {/* Mode Breakdown */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Mode Performance
            </h3>
            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                vs Minimax AI:
              </span>
              <span className="font-semibold text-slate-200">
                {stats?.aiWins || 0}W / {stats?.aiGames || 0} Games
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Users className="w-3.5 h-3.5 text-rose-400" />
                vs Online Friends:
              </span>
              <span className="font-semibold text-slate-200">
                {stats?.pvpWins || 0}W / {stats?.pvpGames || 0} Games
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
