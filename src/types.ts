export type PlayerMark = 'X' | 'O';
export type CellValue = PlayerMark | null;
export type BoardState = CellValue[]; // 9 elements: indices 0..8

export type GameMode = 'AI' | 'MULTIPLAYER';
export type AIDifficulty = 'EASY' | 'MEDIUM' | 'UNBEATABLE';

export type GameStatus = 'WAITING_FOR_PLAYER' | 'IN_PROGRESS' | 'FINISHED';
export type GameWinner = 'X' | 'O' | 'DRAW' | null;

export interface PlayerProfile {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  email?: string | null;
  isAI?: boolean;
}

export type GameEventType = 
  | 'GAME_CREATED'
  | 'PLAYER_JOINED'
  | 'MOVE_MADE'
  | 'GAME_ROLLBACK'
  | 'GAME_RESTARTED';

export interface GameEventPayload {
  // For GAME_CREATED
  startingMark?: PlayerMark;
  mode?: GameMode;
  aiDifficulty?: AIDifficulty;
  playerX?: PlayerProfile;
  playerO?: PlayerProfile | null;

  // For PLAYER_JOINED
  joinedPlayer?: PlayerProfile;
  assignedMark?: PlayerMark;

  // For MOVE_MADE
  position?: number; // 0..8
  mark?: PlayerMark;
  turnNumber?: number; // 1, 2, 3...

  // For GAME_ROLLBACK
  targetTurnNumber?: number; // The turn number to rollback to (0 = starting state)
  previousTurnNumber?: number;
  reason?: string;

  // For GAME_RESTARTED
  newStartingMark?: PlayerMark;
}

export interface GameEvent {
  id: string;
  gameId: string;
  sequenceNumber: number;
  type: GameEventType;
  payload: GameEventPayload;
  performedBy: {
    uid: string;
    displayName: string;
    mark?: PlayerMark;
  };
  createdAt: number; // Milliseconds timestamp
}

export interface GameDocument {
  id: string;
  code: string;
  mode: GameMode;
  aiDifficulty?: AIDifficulty;
  playerX: PlayerProfile;
  playerO: PlayerProfile | null;
  status: GameStatus;
  startingMark: PlayerMark;
  currentTurn: PlayerMark;
  winner: GameWinner;
  winningLine: number[] | null;
  totalEvents: number;
  lastEventAt: number;
  createdAt: number;
  scores: {
    X: number;
    O: number;
    draws: number;
  };
}

export interface MoveRecord {
  turnNumber: number;
  position: number;
  mark: PlayerMark;
  playedBy: PlayerProfile;
  timestamp: number;
  eventId: string;
}

export interface ReplayedGameState {
  board: BoardState;
  currentTurn: PlayerMark;
  status: GameStatus;
  winner: GameWinner;
  winningLine: number[] | null;
  turns: MoveRecord[];
  activeEventsCount: number;
  historySnapshots: {
    turnNumber: number;
    board: BoardState;
    lastMovePosition: number | null;
    currentTurn: PlayerMark;
    winner: GameWinner;
    winningLine: number[] | null;
  }[];
}

export interface UserStats {
  userId: string;
  displayName: string;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  aiGames: number;
  aiWins: number;
  pvpGames: number;
  pvpWins: number;
  updatedAt: number;
}
