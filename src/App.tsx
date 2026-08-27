import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  firebaseSignOut, 
  onAuthStateChanged,
  type User 
} from './firebase';
import {
  GameDocument,
  GameEvent,
  PlayerProfile,
  AIDifficulty,
  PlayerMark,
  ReplayedGameState,
  UserStats
} from './types';
import {
  createNewGame,
  findGameByCode,
  joinGameMatch,
  recordMoveEvent,
  rollbackGameToTurn,
  restartGameRound,
  subscribeToGame,
  getUserStats,
  updateUserStats
} from './services/gameService';
import { replayEvents } from './utils/eventSourcing';
import { getBestAIMove } from './utils/minimax';
import { 
  playMoveSound, 
  playWinSound, 
  playDrawSound, 
  playRollbackSound, 
  playClickSound, 
  toggleSound, 
  isSoundEnabled 
} from './utils/sound';

import { Navbar } from './components/Navbar';
import { HomeHub } from './components/HomeHub';
import { Board } from './components/Board';
import { GameHeader } from './components/GameHeader';
import { EventTimeline } from './components/EventTimeline';
import { NewGameModal } from './components/NewGameModal';
import { ShareMatchModal } from './components/ShareMatchModal';
import { StatsModal } from './components/StatsModal';
import { Users, Bot, Copy, Check } from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<PlayerProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active Game State
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [gameDoc, setGameDoc] = useState<GameDocument | null>(null);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [replayedState, setReplayedState] = useState<ReplayedGameState>({
    board: Array(9).fill(null),
    currentTurn: 'X',
    status: 'WAITING_FOR_PLAYER',
    winner: null,
    winningLine: null,
    turns: [],
    activeEventsCount: 0,
    historySnapshots: [],
  });

  // Turn Preview & Replay State
  const [previewTurnNumber, setPreviewTurnNumber] = useState<number | null>(null);

  // UI Modals
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(true);
  const [copiedHeaderCode, setCopiedHeaderCode] = useState(false);

  // Interaction Loaders
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Track if game ending was already celebrated/recorded to prevent duplicate stats writes
  const processedGameEndRef = useRef<string | null>(null);
  const aiMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const profile: PlayerProfile = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Player',
          photoURL: user.photoURL,
          email: user.email,
        };
        setCurrentUser(profile);
        const stats = await getUserStats(user.uid);
        setUserStats(stats);
      } else {
        // Create an anonymous guest identity if not logged into Google yet
        let guestId = localStorage.getItem('ttt_guest_id');
        if (!guestId) {
          guestId = 'guest-' + Math.random().toString(36).substring(2, 9);
          localStorage.setItem('ttt_guest_id', guestId);
        }
        setCurrentUser({
          uid: guestId,
          displayName: `Guest-${guestId.substring(6, 10)}`,
          photoURL: null,
        });
      }
      setAuthLoading(false);
    });

    return () => unsubAuth();
  }, []);

  // 2. Refresh stats helper
  const refreshStats = useCallback(async () => {
    if (currentUser && !currentUser.uid.startsWith('guest-')) {
      const stats = await getUserStats(currentUser.uid);
      setUserStats(stats);
    }
  }, [currentUser]);

  // 3. Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      playClickSound();
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const profile: PlayerProfile = {
          uid: result.user.uid,
          displayName: result.user.displayName || 'Player',
          photoURL: result.user.photoURL,
          email: result.user.email,
        };
        setCurrentUser(profile);
        const stats = await getUserStats(result.user.uid);
        setUserStats(stats);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      playClickSound();
      await firebaseSignOut(auth);
      setUserStats(null);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  // 4. Handle Sound Toggle
  const handleToggleSound = () => {
    const nextState = toggleSound();
    setSoundActive(nextState);
  };

  // 5. URL query params detector (for auto-joining shared match links e.g. ?game=CODE)
  useEffect(() => {
    if (!currentUser || authLoading) return;
    const urlParams = new URLSearchParams(window.location.search);
    const gameCodeParam = urlParams.get('game');
    const gameIdParam = urlParams.get('gameId');

    if (gameCodeParam && !activeGameId) {
      handleJoinGameByCode(gameCodeParam);
    } else if (gameIdParam && !activeGameId) {
      setActiveGameId(gameIdParam);
    }
  }, [currentUser, authLoading]);

  // 6. Real-time Game Subscription (Event Sourcing Reader)
  useEffect(() => {
    if (!activeGameId) {
      setGameDoc(null);
      setGameEvents([]);
      setPreviewTurnNumber(null);
      return;
    }

    const unsubscribe = subscribeToGame(
      activeGameId,
      (updatedDoc) => {
        setGameDoc(updatedDoc);
      },
      (events) => {
        setGameEvents(events);
      },
      (err) => {
        console.error('Subscription error:', err);
      }
    );

    return () => {
      unsubscribe();
      if (aiMoveTimeoutRef.current) {
        clearTimeout(aiMoveTimeoutRef.current);
      }
    };
  }, [activeGameId]);

  // 7. Event Sourcing Replay Calculation
  useEffect(() => {
    if (gameEvents.length === 0) return;

    // Deterministically reconstruct game state by replaying events
    const computedState = replayEvents(gameEvents, previewTurnNumber ?? undefined);
    setReplayedState(computedState);
  }, [gameEvents, previewTurnNumber]);

  // 8. Handle Game Completion Celebration and Stats Update
  useEffect(() => {
    if (!replayedState.winner || !gameDoc || previewTurnNumber !== null) return;

    const matchEndKey = `${gameDoc.id}_ev${gameEvents.length}_${replayedState.winner}`;
    if (processedGameEndRef.current === matchEndKey) return;
    processedGameEndRef.current = matchEndKey;

    // Check who won
    const isUserX = currentUser && gameDoc.playerX.uid === currentUser.uid;
    const isUserO = currentUser && gameDoc.playerO?.uid === currentUser.uid;
    const isUserWinner = (replayedState.winner === 'X' && isUserX) || (replayedState.winner === 'O' && isUserO);

    if (replayedState.winner === 'DRAW') {
      playDrawSound();
      if (currentUser) {
        updateUserStats(currentUser.uid, currentUser.displayName, 'DRAW', gameDoc.mode === 'AI').then(refreshStats);
      }
    } else if (isUserWinner) {
      playWinSound();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981'],
        });
      } catch {
        // Ignore confetti errors if any
      }
      if (currentUser) {
        updateUserStats(currentUser.uid, currentUser.displayName, 'WIN', gameDoc.mode === 'AI').then(refreshStats);
      }
    } else {
      // User lost or other player won
      if (currentUser) {
        updateUserStats(currentUser.uid, currentUser.displayName, 'LOSS', gameDoc.mode === 'AI').then(refreshStats);
      }
    }
  }, [replayedState.winner, gameDoc, gameEvents.length, previewTurnNumber, currentUser, refreshStats]);

  // 9. AI Player Auto-Turn Trigger
  useEffect(() => {
    if (!gameDoc || gameDoc.mode !== 'AI' || replayedState.status === 'FINISHED' || previewTurnNumber !== null) {
      setIsAIThinking(false);
      return;
    }

    const isAITurn = (replayedState.currentTurn === 'X' && gameDoc.playerX.isAI) ||
                     (replayedState.currentTurn === 'O' && gameDoc.playerO?.isAI);

    if (isAITurn) {
      setIsAIThinking(true);
      if (aiMoveTimeoutRef.current) {
        clearTimeout(aiMoveTimeoutRef.current);
      }

      // Natural delay for realistic gameplay
      aiMoveTimeoutRef.current = setTimeout(async () => {
        try {
          const aiMark = replayedState.currentTurn;
          const bestMove = getBestAIMove(
            [...replayedState.board],
            aiMark,
            gameDoc.aiDifficulty || 'UNBEATABLE'
          );

          if (bestMove !== null && gameDoc.id) {
            const aiProfile: PlayerProfile = {
              uid: 'ai-player',
              displayName: `AI (${(gameDoc.aiDifficulty || 'unbeatable').toLowerCase()})`,
              isAI: true,
            };

            await recordMoveEvent({
              gameId: gameDoc.id,
              position: bestMove,
              mark: aiMark,
              player: aiProfile,
              turnNumber: replayedState.turns.length + 1,
              currentEventCount: gameDoc.totalEvents || gameEvents.length,
            });

            playMoveSound(aiMark);
          }
        } catch (err) {
          console.error('Error making AI move:', err);
        } finally {
          setIsAIThinking(false);
        }
      }, 500);
    } else {
      setIsAIThinking(false);
    }
  }, [gameDoc, replayedState.currentTurn, replayedState.status, previewTurnNumber, gameEvents.length]);

  // 10. User Action: Make Move
  const handleCellClick = async (position: number) => {
    if (!gameDoc || !currentUser || replayedState.status === 'FINISHED' || previewTurnNumber !== null) {
      return;
    }

    // Verify turn authorization
    const isUserX = gameDoc.playerX.uid === currentUser.uid;
    const isUserO = gameDoc.playerO?.uid === currentUser.uid;

    if (replayedState.currentTurn === 'X' && !isUserX) return;
    if (replayedState.currentTurn === 'O' && !isUserO) return;
    if (replayedState.board[position] !== null) return;

    const mark: PlayerMark = replayedState.currentTurn;
    playMoveSound(mark);

    try {
      await recordMoveEvent({
        gameId: gameDoc.id,
        position,
        mark,
        player: currentUser,
        turnNumber: replayedState.turns.length + 1,
        currentEventCount: gameDoc.totalEvents || gameEvents.length,
      });
    } catch (err) {
      console.error('Failed to record move event:', err);
    }
  };

  // 11. User Action: Start AI Match
  const handleStartAIGame = async (params: {
    difficulty: AIDifficulty;
    playerMark: PlayerMark;
    startingMark: PlayerMark;
  }) => {
    if (!currentUser) return;
    playClickSound();
    setIsNewGameModalOpen(false);

    try {
      const { gameId } = await createNewGame({
        creator: currentUser,
        mode: 'AI',
        aiDifficulty: params.difficulty,
        creatorMark: params.playerMark,
        startingMark: params.startingMark,
      });

      setActiveGameId(gameId);
      setPreviewTurnNumber(null);
    } catch (err) {
      console.error('Failed to create AI game:', err);
    }
  };

  // 12. User Action: Start Multiplayer Match
  const handleStartMultiplayerGame = async (params: { playerMark: PlayerMark }) => {
    if (!currentUser) return;
    playClickSound();
    setIsNewGameModalOpen(false);

    try {
      const { gameId } = await createNewGame({
        creator: currentUser,
        mode: 'MULTIPLAYER',
        creatorMark: params.playerMark,
        startingMark: 'X',
      });

      setActiveGameId(gameId);
      setPreviewTurnNumber(null);
      setIsShareModalOpen(true);
    } catch (err) {
      console.error('Failed to create multiplayer game:', err);
    }
  };

  // 13. User Action: Join Multiplayer Match by Code
  const handleJoinGameByCode = async (code: string) => {
    if (!currentUser) return;
    setIsJoining(true);
    setJoinError(null);
    playClickSound();

    try {
      const foundGame = await findGameByCode(code);
      if (!foundGame) {
        setJoinError('Match not found. Please verify the 6-character code.');
        setIsJoining(false);
        return;
      }

      await joinGameMatch(foundGame.id, currentUser);
      setActiveGameId(foundGame.id);
      setIsNewGameModalOpen(false);
      setPreviewTurnNumber(null);

      // Clean URL if param was used
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err: any) {
      console.error('Error joining match:', err);
      setJoinError(err?.message || 'Could not join match.');
    } finally {
      setIsJoining(false);
    }
  };

  // 14. User Action: Rollback Game State to Prior Turn
  const handleRollbackToTurn = async (targetTurnNumber: number) => {
    if (!gameDoc || !currentUser) return;
    setIsRollingBack(true);
    playRollbackSound();

    try {
      await rollbackGameToTurn({
        gameId: gameDoc.id,
        targetTurnNumber,
        player: currentUser,
        currentEventCount: gameDoc.totalEvents || gameEvents.length,
        reason: `Restored game state to Turn ${targetTurnNumber}`,
      });

      setPreviewTurnNumber(null);
    } catch (err) {
      console.error('Failed to rollback game:', err);
    } finally {
      setIsRollingBack(false);
    }
  };

  // 15. User Action: Restart Game
  const handleRestartMatch = async () => {
    if (!gameDoc || !currentUser) return;
    playClickSound();

    try {
      const nextStartMark: PlayerMark = gameDoc.startingMark === 'X' ? 'O' : 'X';
      await restartGameRound({
        gameId: gameDoc.id,
        player: currentUser,
        currentEventCount: gameDoc.totalEvents || gameEvents.length,
        newStartingMark: nextStartMark,
      });

      setPreviewTurnNumber(null);
    } catch (err) {
      console.error('Failed to restart match:', err);
    }
  };

  // 16. User Action: Copy Game Code from Header
  const handleCopyCodeHeader = async () => {
    if (!gameDoc?.code) return;
    try {
      await navigator.clipboard.writeText(gameDoc.code);
      setCopiedHeaderCode(true);
      setTimeout(() => setCopiedHeaderCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  // 17. User Action: Leave Match
  const handleLeaveGame = () => {
    playClickSound();
    setActiveGameId(null);
    setGameDoc(null);
    setGameEvents([]);
    setPreviewTurnNumber(null);
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Determine user mark in active game
  const isUserX = currentUser && gameDoc ? gameDoc.playerX.uid === currentUser.uid : false;
  const isUserO = currentUser && gameDoc ? gameDoc.playerO?.uid === currentUser.uid : false;
  const userMark: PlayerMark | null = isUserX ? 'X' : (isUserO ? 'O' : null);

  // Is it currently the user's turn
  const isUserTurn = 
    gameDoc?.status === 'IN_PROGRESS' &&
    ((replayedState.currentTurn === 'X' && isUserX) || (replayedState.currentTurn === 'O' && isUserO));

  const isBoardDisabled = !isUserTurn || isAIThinking || !!replayedState.winner;

  // Last move position for visual highlight
  const lastMove = replayedState.turns.length > 0
    ? replayedState.turns[replayedState.turns.length - 1].position
    : null;

  return (
    <div className="min-h-screen bg-[#0F1117] text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        soundEnabled={soundActive}
        onToggleSound={handleToggleSound}
        onOpenStats={() => setIsStatsModalOpen(true)}
        onNewGame={() => setIsNewGameModalOpen(true)}
        stats={userStats}
        isInGame={!!gameDoc}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start">
        {!gameDoc ? (
          /* Hub Screen when not in active game */
          <HomeHub
            currentUser={currentUser}
            onGoogleSignIn={handleGoogleSignIn}
            onStartAIGame={handleStartAIGame}
            onStartMultiplayerGame={handleStartMultiplayerGame}
            onJoinGameCode={handleJoinGameByCode}
            isJoining={isJoining}
            joinError={joinError}
          />
        ) : (
          /* Active Game Bento Grid View */
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            {/* Left Main Game Card (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
              <GameHeader
                game={gameDoc}
                currentUser={currentUser}
                currentTurn={replayedState.currentTurn}
                winner={replayedState.winner}
                winningLine={replayedState.winningLine}
                isAIThinking={isAIThinking}
                onShare={() => setIsShareModalOpen(true)}
                onRestart={handleRestartMatch}
                onLeaveGame={handleLeaveGame}
                copiedCode={copiedHeaderCode}
                onCopyCode={handleCopyCodeHeader}
              />

              <div className="py-6 flex items-center justify-center">
                <Board
                  board={replayedState.board}
                  onCellClick={handleCellClick}
                  disabled={isBoardDisabled}
                  currentTurn={replayedState.currentTurn}
                  winningLine={replayedState.winningLine}
                  isPreviewMode={previewTurnNumber !== null}
                  lastMovePosition={lastMove}
                  userPlayerMark={userMark}
                />
              </div>

              {/* Bottom Matchup Bar */}
              <div className="flex flex-col items-center pt-2">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5">
                  MATCH DETAILS
                </span>
                <div className="bg-slate-950 px-6 py-2.5 rounded-2xl text-xs font-mono border border-slate-800 text-slate-300 flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
                  <span>{gameDoc.mode === 'AI' ? `ENGINE: MINIMAX (${gameDoc.aiDifficulty || 'UNBEATABLE'})` : `ROOM: ${gameDoc.code}`}</span>
                  <span className="text-slate-700 hidden sm:inline">•</span>
                  <span className="text-indigo-400 font-bold">{replayedState.turns.length} TURNS LOGGED</span>
                </div>
              </div>
            </div>

            {/* Right Side Bento Column (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Context Action Bento Card */}
              {gameDoc.mode === 'MULTIPLAYER' ? (
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-7 flex flex-col justify-between shadow-xl shadow-indigo-900/30 text-white min-h-[170px]">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        MULTIPLAYER ROOM
                      </span>
                      <Users className="w-5 h-5 text-white/80" />
                    </div>
                    <h3 className="text-lg font-black">Invite Opponent</h3>
                    <p className="text-xs text-indigo-100/80 mt-0.5">
                      Share the code <strong className="font-mono text-white bg-black/20 px-1.5 py-0.5 rounded">{gameDoc.code}</strong> with a friend to play live.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={handleCopyCodeHeader}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 transition cursor-pointer flex items-center justify-center gap-1.5 shadow active:scale-95"
                    >
                      {copiedHeaderCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedHeaderCode ? 'Copied Code!' : 'Copy Code'}</span>
                    </button>
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="py-2.5 px-4 rounded-xl bg-black/30 text-white font-bold text-xs hover:bg-black/40 transition cursor-pointer border border-white/10 active:scale-95"
                    >
                      Share Link
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-7 flex flex-col justify-between shadow-xl min-h-[170px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                        MINIMAX HEURISTIC ACTIVE
                      </span>
                      <h3 className="text-base font-black text-slate-100 mt-2">Zero-LLM Opponent</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Evaluating recursive branch trees directly in the browser.
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Difficulty</p>
                      <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">{gameDoc.aiDifficulty || 'UNBEATABLE'}</p>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Latency</p>
                      <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">&lt; 1 ms (Local)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Event Sourcing Turn History & Rollback Inspector */}
              <EventTimeline
                events={gameEvents}
                replayedState={replayedState}
                previewTurnNumber={previewTurnNumber}
                onPreviewTurn={(turnNum) => setPreviewTurnNumber(turnNum)}
                onRollbackToTurn={handleRollbackToTurn}
                isRollingBack={isRollingBack}
                disabled={isAIThinking}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <NewGameModal
        isOpen={isNewGameModalOpen}
        onClose={() => {
          setIsNewGameModalOpen(false);
          setJoinError(null);
        }}
        onCreateAIGame={handleStartAIGame}
        onCreateMultiplayerGame={handleStartMultiplayerGame}
        onJoinGameByCode={handleJoinGameByCode}
        isJoining={isJoining}
        joinError={joinError}
      />

      {gameDoc && (
        <ShareMatchModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          game={gameDoc}
        />
      )}

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={userStats}
        currentUser={currentUser}
      />

      {/* Bento Footer */}
      <footer className="w-full border-t border-slate-900/80 py-4 px-6 text-center text-xs text-slate-600">
        <p>
          Bento Grid Tic-Tac-Toe • Firestore Event Sourcing Engine • Minimax Algorithm AI • Google Authentication
        </p>
      </footer>
    </div>
  );
}
