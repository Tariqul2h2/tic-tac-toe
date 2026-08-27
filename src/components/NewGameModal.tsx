import React, { useState } from 'react';
import { 
  Bot, 
  Users, 
  Zap, 
  Brain, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  Sparkles,
  Gamepad2
} from 'lucide-react';
import { GameMode, AIDifficulty, PlayerMark } from '../types';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAIGame: (params: {
    difficulty: AIDifficulty;
    playerMark: PlayerMark;
    startingMark: PlayerMark;
  }) => void;
  onCreateMultiplayerGame: (params: {
    playerMark: PlayerMark;
  }) => void;
  onJoinGameByCode: (code: string) => void;
  isJoining: boolean;
  joinError: string | null;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  onCreateAIGame,
  onCreateMultiplayerGame,
  onJoinGameByCode,
  isJoining,
  joinError
}) => {
  const [activeTab, setActiveTab] = useState<'AI' | 'MULTIPLAYER'>('AI');
  
  // AI Config
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('UNBEATABLE');
  const [aiPlayerMark, setAiPlayerMark] = useState<PlayerMark>('X');
  const [aiStartingMark, setAiStartingMark] = useState<PlayerMark>('X');

  // Multiplayer Config
  const [mpPlayerMark, setMpPlayerMark] = useState<PlayerMark>('X');
  const [joinCodeInput, setJoinCodeInput] = useState('');

  if (!isOpen) return null;

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCodeInput.trim().length >= 4) {
      onJoinGameByCode(joinCodeInput.trim().toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1117]/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="new-game-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-black/60 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100">Start Match</h2>
              <p className="text-xs text-slate-400">Configure parameters & matchmaking</p>
            </div>
          </div>

          <button
            id="close-new-game-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1.5 mx-6 sm:mx-8 my-5 bg-slate-950 rounded-2xl border border-slate-800/80">
          <button
            id="tab-mode-ai"
            onClick={() => setActiveTab('AI')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'AI'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Minimax AI</span>
          </button>

          <button
            id="tab-mode-multiplayer"
            onClick={() => setActiveTab('MULTIPLAYER')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'MULTIPLAYER'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Multiplayer</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 sm:px-8 pb-8 space-y-6">
          {activeTab === 'AI' ? (
            <div className="space-y-4">
              {/* Difficulty Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  AI Algorithm Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiDifficulty('EASY')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      aiDifficulty === 'EASY'
                        ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/40 text-slate-100'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-400 mb-1" />
                    <p className="font-semibold text-xs text-slate-200">Easy</p>
                    <p className="text-[10px] text-slate-500">Casual heuristics</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiDifficulty('MEDIUM')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      aiDifficulty === 'MEDIUM'
                        ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/40 text-slate-100'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Brain className="w-4 h-4 text-indigo-400 mb-1" />
                    <p className="font-semibold text-xs text-slate-200">Medium</p>
                    <p className="text-[10px] text-slate-500">Blocks & scores</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiDifficulty('UNBEATABLE')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      aiDifficulty === 'UNBEATABLE'
                        ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/40 text-slate-100'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
                    <p className="font-semibold text-xs text-slate-200">Unbeatable</p>
                    <p className="text-[10px] text-slate-500">Optimal Minimax</p>
                  </button>
                </div>
              </div>

              {/* Choose Player Mark */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Your Mark
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAiPlayerMark('X')}
                      className={`py-2 rounded-xl border font-bold text-base transition cursor-pointer ${
                        aiPlayerMark === 'X'
                          ? 'bg-indigo-950/80 border-indigo-500 text-indigo-400 ring-1 ring-indigo-500/50'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      X
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiPlayerMark('O')}
                      className={`py-2 rounded-xl border font-bold text-base transition cursor-pointer ${
                        aiPlayerMark === 'O'
                          ? 'bg-rose-950/80 border-rose-500 text-rose-400 ring-1 ring-rose-500/50'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      O
                    </button>
                  </div>
                </div>

                {/* Who Starts */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Who Plays First
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAiStartingMark('X')}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        aiStartingMark === 'X'
                          ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      X Starts
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiStartingMark('O')}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        aiStartingMark === 'O'
                          ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      O Starts
                    </button>
                  </div>
                </div>
              </div>

              {/* Start AI Button */}
              <button
                id="start-ai-game-btn"
                onClick={() =>
                  onCreateAIGame({
                    difficulty: aiDifficulty,
                    playerMark: aiPlayerMark,
                    startingMark: aiStartingMark,
                  })
                }
                className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Match vs AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Option 1: Create New Room */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Option 1: Create New Room
                    </h3>
                    <p className="text-xs text-slate-400">
                      Generate a short code & shareable link for a friend
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Your Mark:</span>
                    <button
                      type="button"
                      onClick={() => setMpPlayerMark('X')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        mpPlayerMark === 'X'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      X (Player 1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMpPlayerMark('O')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        mpPlayerMark === 'O'
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      O (Player 2)
                    </button>
                  </div>

                  <button
                    id="create-mp-room-btn"
                    onClick={() =>
                      onCreateMultiplayerGame({
                        playerMark: mpPlayerMark,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <span>Create Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Option 2: Join Existing Room */}
              <form onSubmit={handleJoinSubmit} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Option 2: Join with Match Code
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enter the 6-character room code from your friend
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="join-game-code-input"
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 7K9M2X"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    id="submit-join-game-btn"
                    disabled={joinCodeInput.trim().length < 4 || isJoining}
                    className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer border border-slate-700 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isJoining ? 'Joining...' : 'Join Match'}
                  </button>
                </div>

                {joinError && (
                  <p className="text-xs text-rose-400">{joinError}</p>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
