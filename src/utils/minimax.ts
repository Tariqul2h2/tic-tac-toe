import { BoardState, PlayerMark, AIDifficulty } from '../types';

export const WINNING_COMBINATIONS = [
  [0, 1, 2], // Row 0
  [3, 4, 5], // Row 1
  [6, 7, 8], // Row 2
  [0, 3, 6], // Col 0
  [1, 4, 7], // Col 1
  [2, 5, 8], // Col 2
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6], // Diagonal top-right to bottom-left
];

export function checkWinner(board: BoardState): {
  winner: 'X' | 'O' | 'DRAW' | null;
  winningLine: number[] | null;
} {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a] as 'X' | 'O',
        winningLine: combo,
      };
    }
  }

  // Check for draw (all cells filled, no winner)
  const isFull = board.every((cell) => cell !== null);
  if (isFull) {
    return {
      winner: 'DRAW',
      winningLine: null,
    };
  }

  return {
    winner: null,
    winningLine: null,
  };
}

export function getAvailableMoves(board: BoardState): number[] {
  const moves: number[] = [];
  board.forEach((cell, idx) => {
    if (cell === null) {
      moves.push(idx);
    }
  });
  return moves;
}

interface MinimaxResult {
  score: number;
  position: number;
}

function runMinimax(
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  aiMark: PlayerMark,
  humanMark: PlayerMark,
  alpha = -Infinity,
  beta = Infinity
): MinimaxResult {
  const { winner } = checkWinner(board);

  if (winner === aiMark) {
    return { score: 10 - depth, position: -1 };
  }
  if (winner === humanMark) {
    return { score: depth - 10, position: -1 };
  }
  if (winner === 'DRAW') {
    return { score: 0, position: -1 };
  }

  const availableMoves = getAvailableMoves(board);

  if (isMaximizing) {
    let maxScore = -Infinity;
    let bestMoves: number[] = [];

    for (const move of availableMoves) {
      board[move] = aiMark;
      const result = runMinimax(board, depth + 1, false, aiMark, humanMark, alpha, beta);
      board[move] = null;

      if (result.score > maxScore) {
        maxScore = result.score;
        bestMoves = [move];
      } else if (result.score === maxScore) {
        bestMoves.push(move);
      }

      alpha = Math.max(alpha, maxScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }

    // Randomize among best moves to make AI feel natural
    const chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    return { score: maxScore, position: chosenMove };
  } else {
    let minScore = Infinity;
    let bestMoves: number[] = [];

    for (const move of availableMoves) {
      board[move] = humanMark;
      const result = runMinimax(board, depth + 1, true, aiMark, humanMark, alpha, beta);
      board[move] = null;

      if (result.score < minScore) {
        minScore = result.score;
        bestMoves = [move];
      } else if (result.score === minScore) {
        bestMoves.push(move);
      }

      beta = Math.min(beta, minScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }

    const chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    return { score: minScore, position: chosenMove };
  }
}

/**
 * Calculates the best move for the AI opponent using Minimax
 */
export function getBestAIMove(
  board: BoardState,
  aiMark: PlayerMark,
  difficulty: AIDifficulty = 'UNBEATABLE'
): number | null {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return null;

  const humanMark: PlayerMark = aiMark === 'X' ? 'O' : 'X';

  // If first move of the entire game and AI starts, take center or corner
  if (availableMoves.length === 9) {
    const openingMoves = [0, 2, 4, 6, 8];
    return openingMoves[Math.floor(Math.random() * openingMoves.length)];
  }

  // EASY DIFFICULTY: 75% random, 25% minimax
  if (difficulty === 'EASY') {
    if (Math.random() < 0.75) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
  }

  // MEDIUM DIFFICULTY: 40% heuristic/random, 60% minimax
  if (difficulty === 'MEDIUM') {
    // Check if immediate win exists
    for (const move of availableMoves) {
      board[move] = aiMark;
      if (checkWinner(board).winner === aiMark) {
        board[move] = null;
        return move;
      }
      board[move] = null;
    }

    // Check if immediate block is needed
    for (const move of availableMoves) {
      board[move] = humanMark;
      if (checkWinner(board).winner === humanMark) {
        board[move] = null;
        return move;
      }
      board[move] = null;
    }

    // 35% chance to make a suboptimal move
    if (Math.random() < 0.35) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
  }

  // UNBEATABLE (or falling through from Medium/Easy) -> Full Minimax
  const result = runMinimax(
    [...board],
    0,
    true,
    aiMark,
    humanMark
  );

  return result.position !== -1 ? result.position : availableMoves[0];
}
