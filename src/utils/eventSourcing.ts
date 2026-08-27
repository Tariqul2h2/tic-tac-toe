import {
  GameEvent,
  ReplayedGameState,
  BoardState,
  PlayerMark,
  GameStatus,
  GameWinner,
  MoveRecord
} from '../types';
import { checkWinner } from './minimax';

export function getPositionLabel(pos: number): string {
  const row = Math.floor(pos / 3) + 1;
  const col = (pos % 3) + 1;
  const names = [
    'Top Left', 'Top Center', 'Top Right',
    'Middle Left', 'Center', 'Middle Right',
    'Bottom Left', 'Bottom Center', 'Bottom Right'
  ];
  return `${names[pos] || `Pos ${pos}`} (R${row}, C${col})`;
}

/**
 * Replays all events in an event-sourcing fashion to calculate the exact current game state.
 * If targetTurnNumber is specified, it calculates the state up to that specific turn number.
 */
export function replayEvents(
  events: GameEvent[],
  targetTurnNumber?: number
): ReplayedGameState {
  // Sort events chronologically by sequence number then timestamp
  const sortedEvents = [...events].sort((a, b) => {
    if (a.sequenceNumber !== b.sequenceNumber) {
      return a.sequenceNumber - b.sequenceNumber;
    }
    return a.createdAt - b.createdAt;
  });

  let board: BoardState = Array(9).fill(null);
  let currentTurn: PlayerMark = 'X';
  let status: GameStatus = 'WAITING_FOR_PLAYER';
  let winner: GameWinner = null;
  let winningLine: number[] | null = null;
  let startingMark: PlayerMark = 'X';
  const turns: MoveRecord[] = [];

  const historySnapshots: ReplayedGameState['historySnapshots'] = [
    {
      turnNumber: 0,
      board: Array(9).fill(null),
      lastMovePosition: null,
      currentTurn: 'X',
      winner: null,
      winningLine: null,
    }
  ];

  for (const event of sortedEvents) {
    switch (event.type) {
      case 'GAME_CREATED': {
        startingMark = event.payload.startingMark || 'X';
        currentTurn = startingMark;
        board = Array(9).fill(null);
        status = event.payload.mode === 'AI' ? 'IN_PROGRESS' : 'WAITING_FOR_PLAYER';
        winner = null;
        winningLine = null;
        turns.length = 0;
        historySnapshots.length = 0;
        historySnapshots.push({
          turnNumber: 0,
          board: [...board],
          lastMovePosition: null,
          currentTurn,
          winner: null,
          winningLine: null,
        });
        break;
      }

      case 'PLAYER_JOINED': {
        if (status === 'WAITING_FOR_PLAYER') {
          status = 'IN_PROGRESS';
        }
        break;
      }

      case 'MOVE_MADE': {
        const { position, mark } = event.payload;
        if (
          typeof position === 'number' &&
          position >= 0 &&
          position < 9 &&
          mark &&
          board[position] === null &&
          status !== 'FINISHED'
        ) {
          board[position] = mark;
          const turnNum = turns.length + 1;
          turns.push({
            turnNumber: turnNum,
            position,
            mark,
            playedBy: {
              uid: event.performedBy.uid,
              displayName: event.performedBy.displayName,
            },
            timestamp: event.createdAt,
            eventId: event.id,
          });

          // Check win / draw
          const winCheck = checkWinner(board);
          if (winCheck.winner) {
            status = 'FINISHED';
            winner = winCheck.winner;
            winningLine = winCheck.winningLine;
          } else {
            currentTurn = mark === 'X' ? 'O' : 'X';
            status = 'IN_PROGRESS';
          }

          // Record snapshot
          historySnapshots.push({
            turnNumber: turnNum,
            board: [...board],
            lastMovePosition: position,
            currentTurn,
            winner,
            winningLine,
          });
        }
        break;
      }

      case 'GAME_ROLLBACK': {
        const target = event.payload.targetTurnNumber ?? 0;
        
        // Rebuild board up to target turn
        const remainingTurns = turns.slice(0, target);
        board = Array(9).fill(null);
        turns.length = 0;
        historySnapshots.length = 1; // Keep initial turn 0

        currentTurn = startingMark;
        status = 'IN_PROGRESS';
        winner = null;
        winningLine = null;

        for (const move of remainingTurns) {
          board[move.position] = move.mark;
          turns.push({
            ...move,
            turnNumber: turns.length + 1,
          });

          const winCheck = checkWinner(board);
          if (winCheck.winner) {
            status = 'FINISHED';
            winner = winCheck.winner;
            winningLine = winCheck.winningLine;
          } else {
            currentTurn = move.mark === 'X' ? 'O' : 'X';
            status = 'IN_PROGRESS';
          }

          historySnapshots.push({
            turnNumber: turns.length,
            board: [...board],
            lastMovePosition: move.position,
            currentTurn,
            winner,
            winningLine,
          });
        }
        break;
      }

      case 'GAME_RESTARTED': {
        const newStart = event.payload.newStartingMark || startingMark;
        startingMark = newStart;
        currentTurn = newStart;
        board = Array(9).fill(null);
        status = 'IN_PROGRESS';
        winner = null;
        winningLine = null;
        turns.length = 0;
        historySnapshots.length = 0;
        historySnapshots.push({
          turnNumber: 0,
          board: [...board],
          lastMovePosition: null,
          currentTurn,
          winner: null,
          winningLine: null,
        });
        break;
      }
    }
  }

  // If a specific preview targetTurnNumber is requested
  if (typeof targetTurnNumber === 'number' && targetTurnNumber >= 0 && targetTurnNumber <= turns.length) {
    const targetSnapshot = historySnapshots[targetTurnNumber] || historySnapshots[historySnapshots.length - 1];
    return {
      board: targetSnapshot.board,
      currentTurn: targetSnapshot.currentTurn,
      status: targetSnapshot.winner ? 'FINISHED' : 'IN_PROGRESS',
      winner: targetSnapshot.winner,
      winningLine: targetSnapshot.winningLine,
      turns: turns.slice(0, targetTurnNumber),
      activeEventsCount: targetTurnNumber,
      historySnapshots,
    };
  }

  return {
    board,
    currentTurn,
    status,
    winner,
    winningLine,
    turns,
    activeEventsCount: turns.length,
    historySnapshots,
  };
}
