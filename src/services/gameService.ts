import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  addDoc,
} from '../firebase';
import {
  GameDocument,
  GameEvent,
  PlayerProfile,
  GameMode,
  AIDifficulty,
  PlayerMark,
  UserStats,
  GameWinner
} from '../types';

export function generateShortGameCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createNewGame(params: {
  creator: PlayerProfile;
  mode: GameMode;
  aiDifficulty?: AIDifficulty;
  creatorMark?: PlayerMark;
  startingMark?: PlayerMark;
}): Promise<{ gameId: string; gameCode: string }> {
  const {
    creator,
    mode,
    aiDifficulty = 'UNBEATABLE',
    creatorMark = 'X',
    startingMark = 'X'
  } = params;

  const gameCode = generateShortGameCode();
  const gameRef = doc(collection(db, 'games'));
  const gameId = gameRef.id;

  const playerX: PlayerProfile = creatorMark === 'X' 
    ? creator 
    : (mode === 'AI' ? { uid: 'ai-player', displayName: `AI (${aiDifficulty.toLowerCase()})`, isAI: true } : { uid: '', displayName: 'Waiting for player...' });

  const playerO: PlayerProfile | null = creatorMark === 'O' 
    ? creator 
    : (mode === 'AI' ? { uid: 'ai-player', displayName: `AI (${aiDifficulty.toLowerCase()})`, isAI: true } : null);

  const now = Date.now();

  const gameDocData: GameDocument = {
    id: gameId,
    code: gameCode,
    mode,
    aiDifficulty: mode === 'AI' ? aiDifficulty : undefined,
    playerX,
    playerO,
    status: mode === 'AI' ? 'IN_PROGRESS' : 'WAITING_FOR_PLAYER',
    startingMark,
    currentTurn: startingMark,
    winner: null,
    winningLine: null,
    totalEvents: 1,
    lastEventAt: now,
    createdAt: now,
    scores: {
      X: 0,
      O: 0,
      draws: 0,
    },
  };

  // 1. Create main Game document
  await setDoc(gameRef, gameDocData);

  // 2. Create first Event in subcollection `games/{gameId}/events` (Event Sourcing Root Event)
  const eventsCol = collection(db, 'games', gameId, 'events');
  const firstEvent: Omit<GameEvent, 'id'> = {
    gameId,
    sequenceNumber: 1,
    type: 'GAME_CREATED',
    payload: {
      mode,
      aiDifficulty,
      startingMark,
      playerX,
      playerO,
    },
    performedBy: {
      uid: creator.uid,
      displayName: creator.displayName,
      mark: creatorMark,
    },
    createdAt: now,
  };

  await addDoc(eventsCol, firstEvent);

  return { gameId, gameCode };
}

export async function findGameByCode(code: string): Promise<GameDocument | null> {
  const cleanCode = code.trim().toUpperCase();
  const q = query(collection(db, 'games'), where('code', '==', cleanCode));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;
  const firstDoc = snapshot.docs[0];
  return { ...firstDoc.data(), id: firstDoc.id } as GameDocument;
}

export async function joinGameMatch(
  gameId: string,
  guestPlayer: PlayerProfile
): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  if (!gameSnap.exists()) {
    throw new Error('Game not found');
  }

  const gameData = gameSnap.data() as GameDocument;
  
  // Check if player is already in this game
  if (gameData.playerX.uid === guestPlayer.uid || (gameData.playerO && gameData.playerO.uid === guestPlayer.uid)) {
    return; // Already joined
  }

  const assignedMark: PlayerMark = gameData.playerO === null ? 'O' : 'X';
  const updatedPlayerO = assignedMark === 'O' ? guestPlayer : gameData.playerO;
  const updatedPlayerX = assignedMark === 'X' ? guestPlayer : gameData.playerX;

  const now = Date.now();
  const nextSeq = (gameData.totalEvents || 1) + 1;

  // Append PLAYER_JOINED event
  const eventsCol = collection(db, 'games', gameId, 'events');
  await addDoc(eventsCol, {
    gameId,
    sequenceNumber: nextSeq,
    type: 'PLAYER_JOINED',
    payload: {
      joinedPlayer: guestPlayer,
      assignedMark,
    },
    performedBy: {
      uid: guestPlayer.uid,
      displayName: guestPlayer.displayName,
      mark: assignedMark,
    },
    createdAt: now,
  });

  // Update game doc
  await setDoc(
    gameRef,
    {
      playerO: updatedPlayerO,
      playerX: updatedPlayerX,
      status: 'IN_PROGRESS',
      totalEvents: nextSeq,
      lastEventAt: now,
    },
    { merge: true }
  );
}

export async function recordMoveEvent(params: {
  gameId: string;
  position: number;
  mark: PlayerMark;
  player: PlayerProfile;
  turnNumber: number;
  currentEventCount: number;
}): Promise<void> {
  const { gameId, position, mark, player, turnNumber, currentEventCount } = params;
  const now = Date.now();
  const nextSeq = currentEventCount + 1;

  const eventsCol = collection(db, 'games', gameId, 'events');
  await addDoc(eventsCol, {
    gameId,
    sequenceNumber: nextSeq,
    type: 'MOVE_MADE',
    payload: {
      position,
      mark,
      turnNumber,
    },
    performedBy: {
      uid: player.uid,
      displayName: player.displayName,
      mark,
    },
    createdAt: now,
  });

  const gameRef = doc(db, 'games', gameId);
  await setDoc(
    gameRef,
    {
      totalEvents: nextSeq,
      lastEventAt: now,
    },
    { merge: true }
  );
}

export async function rollbackGameToTurn(params: {
  gameId: string;
  targetTurnNumber: number;
  player: PlayerProfile;
  currentEventCount: number;
  reason?: string;
}): Promise<void> {
  const { gameId, targetTurnNumber, player, currentEventCount, reason } = params;
  const now = Date.now();
  const nextSeq = currentEventCount + 1;

  const eventsCol = collection(db, 'games', gameId, 'events');
  await addDoc(eventsCol, {
    gameId,
    sequenceNumber: nextSeq,
    type: 'GAME_ROLLBACK',
    payload: {
      targetTurnNumber,
      reason: reason || `Player rolled back game to Turn ${targetTurnNumber}`,
    },
    performedBy: {
      uid: player.uid,
      displayName: player.displayName,
    },
    createdAt: now,
  });

  const gameRef = doc(db, 'games', gameId);
  await setDoc(
    gameRef,
    {
      totalEvents: nextSeq,
      lastEventAt: now,
      status: 'IN_PROGRESS',
      winner: null,
      winningLine: null,
    },
    { merge: true }
  );
}

export async function restartGameRound(params: {
  gameId: string;
  player: PlayerProfile;
  currentEventCount: number;
  newStartingMark?: PlayerMark;
}): Promise<void> {
  const { gameId, player, currentEventCount, newStartingMark = 'X' } = params;
  const now = Date.now();
  const nextSeq = currentEventCount + 1;

  const eventsCol = collection(db, 'games', gameId, 'events');
  await addDoc(eventsCol, {
    gameId,
    sequenceNumber: nextSeq,
    type: 'GAME_RESTARTED',
    payload: {
      newStartingMark,
    },
    performedBy: {
      uid: player.uid,
      displayName: player.displayName,
    },
    createdAt: now,
  });

  const gameRef = doc(db, 'games', gameId);
  await setDoc(
    gameRef,
    {
      totalEvents: nextSeq,
      lastEventAt: now,
      status: 'IN_PROGRESS',
      winner: null,
      winningLine: null,
    },
    { merge: true }
  );
}

export function subscribeToGame(
  gameId: string,
  onGameChange: (game: GameDocument | null) => void,
  onEventsChange: (events: GameEvent[]) => void,
  onError?: (err: Error) => void
): () => void {
  const gameRef = doc(db, 'games', gameId);
  const eventsCol = collection(db, 'games', gameId, 'events');

  const unsubGame = onSnapshot(
    gameRef,
    (snap) => {
      if (snap.exists()) {
        onGameChange({ ...snap.data(), id: snap.id } as GameDocument);
      } else {
        onGameChange(null);
      }
    },
    (err) => {
      console.error('Error listening to game doc:', err);
      onError?.(err);
    }
  );

  const unsubEvents = onSnapshot(
    eventsCol,
    (snapshot) => {
      const events: GameEvent[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as Omit<GameEvent, 'id'>),
        id: docSnap.id,
      }));

      // Sort by sequence number then timestamp
      events.sort((a, b) => {
        if (a.sequenceNumber !== b.sequenceNumber) {
          return a.sequenceNumber - b.sequenceNumber;
        }
        return a.createdAt - b.createdAt;
      });

      onEventsChange(events);
    },
    (err) => {
      console.error('Error listening to game events:', err);
      onError?.(err);
    }
  );

  return () => {
    unsubGame();
    unsubEvents();
  };
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserStats;
    }
    return null;
  } catch (err) {
    console.error('Error getting user stats:', err);
    return null;
  }
}

export async function updateUserStats(
  userId: string,
  displayName: string,
  result: 'WIN' | 'LOSS' | 'DRAW',
  isAI: boolean
): Promise<void> {
  if (!userId || userId.startsWith('guest-') || userId === 'ai-player') return;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    const current = snap.exists()
      ? (snap.data() as UserStats)
      : {
          userId,
          displayName,
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          currentStreak: 0,
          bestStreak: 0,
          aiGames: 0,
          aiWins: 0,
          pvpGames: 0,
          pvpWins: 0,
          updatedAt: Date.now(),
        };

    const newWins = result === 'WIN' ? current.wins + 1 : current.wins;
    const newLosses = result === 'LOSS' ? current.losses + 1 : current.losses;
    const newDraws = result === 'DRAW' ? current.draws + 1 : current.draws;
    const newStreak = result === 'WIN' ? current.currentStreak + 1 : (result === 'LOSS' ? 0 : current.currentStreak);
    const newBestStreak = Math.max(current.bestStreak, newStreak);

    const updated: UserStats = {
      ...current,
      displayName,
      totalGames: current.totalGames + 1,
      wins: newWins,
      losses: newLosses,
      draws: newDraws,
      currentStreak: newStreak,
      bestStreak: newBestStreak,
      aiGames: isAI ? current.aiGames + 1 : current.aiGames,
      aiWins: isAI && result === 'WIN' ? current.aiWins + 1 : current.aiWins,
      pvpGames: !isAI ? current.pvpGames + 1 : current.pvpGames,
      pvpWins: !isAI && result === 'WIN' ? current.pvpWins + 1 : current.pvpWins,
      updatedAt: Date.now(),
    };

    await setDoc(userRef, updated, { merge: true });
  } catch (err) {
    console.error('Error updating user stats:', err);
  }
}
