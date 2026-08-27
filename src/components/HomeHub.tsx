import React, { useState } from 'react';
import { 
  Bot, 
  Users, 
  Zap, 
  Brain, 
  ShieldCheck, 
  ArrowRight, 
  LogIn, 
  Sparkles, 
  Layers, 
  RotateCcw,
  Trophy,
  History
} from 'lucide-react';
import { PlayerProfile, AIDifficulty, PlayerMark } from '../types';

interface HomeHubProps {
  currentUser: PlayerProfile | null;
  onGoogleSignIn: () => void;
  onStartAIGame: (params: { difficulty: AIDifficulty; playerMark: PlayerMark; startingMark: PlayerMark }) => void;
  onStartMultiplayerGame: (params: { playerMark: PlayerMark }) => void;
  onJoinGameCode: (code: string) => void;
  isJoining: boolean;
  joinError: string | null;
}

export const HomeHub: React.FC<HomeHubProps> = ({
  currentUser,
  onGoogleSignIn,
  onStartAIGame,
  onStartMultiplayerGame,
  onJoinGameCode,
  isJoining,
  joinError
}) => {
  const [quickCode, setQuickCode] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('UNBEATABLE');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCode.trim()) {
      onJoinGameCode(quickCode.trim().toUpperCase());
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Bento Top Row: Hero Card (8 cols) + Instant Action Card (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero Card */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Event-Sourced Game Engine</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight leading-[1.1]">
              Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Tic-Tac-Toe</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
              Every turn is an immutable event stored in Firestore subcollections. Reconstruct board state in real time, scrub historic turns, and execute instant rollbacks.
            </p>

            {!currentUser ? (
              <div className="pt-3">
                <button
                  id="hero-google-signin-btn"
                  onClick={onGoogleSignIn}
                  className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 text-xs sm:text-sm font-bold transition-all shadow-xl shadow-white/10 cursor-pointer active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Authenticated as {currentUser.displayName}
                </span>
              </div>
            )}
          </div>

          {/* Decorative Grid Preview */}
          <div className="hidden sm:grid grid-cols-3 gap-2 absolute -right-6 -bottom-6 opacity-10 pointer-events-none w-48 h-48">
            <div className="bg-indigo-500/30 rounded-2xl flex items-center justify-center font-black text-3xl text-indigo-400">X</div>
            <div className="bg-slate-800 rounded-2xl"></div>
            <div className="bg-rose-500/30 rounded-2xl flex items-center justify-center font-black text-3xl text-rose-400">O</div>
            <div className="bg-slate-800 rounded-2xl"></div>
            <div className="bg-indigo-500/30 rounded-2xl flex items-center justify-center font-black text-3xl text-indigo-400">X</div>
            <div className="bg-slate-800 rounded-2xl"></div>
            <div className="bg-rose-500/30 rounded-2xl flex items-center justify-center font-black text-3xl text-rose-400">O</div>
            <div className="bg-slate-800 rounded-2xl"></div>
            <div className="bg-indigo-500/30 rounded-2xl flex items-center justify-center font-black text-3xl text-indigo-400">X</div>
          </div>
        </div>

        {/* Join Multiplayer Bento Card */}
        <div className="lg:col-span-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-indigo-900/30 text-white min-h-[260px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                Multiplayer Room
              </span>
              <Users className="w-5 h-5 text-white/80" />
            </div>
            <h3 className="text-xl font-black">Join via Room Code</h3>
            <p className="text-xs text-indigo-100/80 mt-1">
              Enter a 6-character code to jump straight into an active match.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-3 mt-4">
            <div className="flex items-center gap-2 bg-black/25 p-1.5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <input
                id="home-join-code-input"
                type="text"
                maxLength={6}
                placeholder="ABC123"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                className="flex-1 bg-transparent px-3 py-2 text-white placeholder-white/40 text-sm font-mono tracking-widest uppercase focus:outline-none"
              />
              <button
                type="submit"
                id="home-join-room-btn"
                disabled={quickCode.trim().length < 4 || isJoining}
                className="px-4 py-2 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow"
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
            {joinError && <p className="text-xs text-rose-200 font-medium px-1">{joinError}</p>}
          </form>
        </div>
      </div>

      {/* Bento Bottom Row: AI Game Setup (6 cols) + Multiplayer Host (6 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Minimax AI */}
        <div className="p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                0% LLM • 100% Deterministic
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-100">Play Against Minimax AI</h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero API calls or latency. Direct recursive depth evaluation with optimal heuristics.
              </p>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Select Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['EASY', 'MEDIUM', 'UNBEATABLE'] as AIDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer capitalize ${
                      selectedDifficulty === diff
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {diff.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            id="home-start-ai-btn"
            onClick={() =>
              onStartAIGame({
                difficulty: selectedDifficulty,
                playerMark: 'X',
                startingMark: 'X',
              })
            }
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Start Game vs {selectedDifficulty.toLowerCase()} AI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: Create Multiplayer Room */}
        <div className="p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                Peer-To-Peer Realtime
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-100">Host Multiplayer Room</h3>
              <p className="text-xs text-slate-400 mt-1">
                Generates a shareable URL and 6-letter room code with instant matchmaking sync.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Share Link</p>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">1-Click Join</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <p className="text-[10px] font-bold text-rose-400 uppercase">Sync State</p>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">Subcollection Log</p>
              </div>
            </div>
          </div>

          <button
            id="home-create-room-btn"
            onClick={() => onStartMultiplayerGame({ playerMark: 'X' })}
            className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold transition-all shadow-xl shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Create New Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
