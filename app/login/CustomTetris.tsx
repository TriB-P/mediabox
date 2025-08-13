// app/components/CustomTetris.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Couleurs de la brand
const COLORS = {
  0: 'transparent', // vide
  1: '#fdc300', // jaune
  2: '#ed679e', // rose
  3: '#58c1d5', // bleu
  4: '#2da944', // vert
  5: '#5b4c9a', // violet
};

// Formes des Tetrominos
const TETROMINOS = {
  I: {
    shape: [
      [1, 1, 1, 1]
    ],
    color: 1
  },
  O: {
    shape: [
      [2, 2],
      [2, 2]
    ],
    color: 2
  },
  T: {
    shape: [
      [0, 3, 0],
      [3, 3, 3]
    ],
    color: 3
  },
  S: {
    shape: [
      [0, 4, 4],
      [4, 4, 0]
    ],
    color: 4
  },
  Z: {
    shape: [
      [5, 5, 0],
      [0, 5, 5]
    ],
    color: 5
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: 1
  },
  L: {
    shape: [
      [0, 0, 2],
      [2, 2, 2]
    ],
    color: 2
  }
};

// Grille plus grande pour un format horizontal
const BOARD_WIDTH = 32;
const BOARD_HEIGHT = 24;

interface Position {
  x: number;
  y: number;
}

interface Tetromino {
  shape: number[][];
  position: Position;
  color: number;
}

const CustomTetris: React.FC = () => {
  const [board, setBoard] = useState<number[][]>(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
  );
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [piecesPlaced, setPiecesPlaced] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(500); // Vitesse initiale en ms
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Calculer la vitesse basée sur le nombre de pièces placées
  const calculateSpeed = useCallback((pieces: number): number => {
    // Vitesse de base : 500ms
    // Réduction de 5ms par pièce placée
    // Minimum : 50ms (très rapide)
    const baseSpeed = 400;
    const speedReduction = pieces * 5;
    const newSpeed = Math.max(baseSpeed - speedReduction, 100);
    return newSpeed;
  }, []);

  // Générer une configuration initiale fixe avec des tetrominos pré-placés
  const generateInitialBoard = useCallback((): number[][] => {
    const newBoard = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
    
    // Configuration fixe - remplir les 6 dernières lignes (18-23) avec des blocs partiels
    
    // Ligne 23 (tout en bas) - presque pleine avec quelques trous
    const line23 = [1,0,0,0,1,0,2,2,2,0,3,3,3,3,0,4,0,5,0,5,0,1,1,1,0,2,2,2,0,3,0,3];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      newBoard[23][x] = line23[x];
    }
    
    // Ligne 22 - avec plus de trous
    const line22 = [1,0,0,0,1,0,2,0,0,0,0,3,0,3,0,4,0,5,0,5,0,1,0,1,0,2,0,2,0,3,3,3];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      newBoard[22][x] = line22[x];
    }
    
    // Ligne 21 - blocs plus espacés
    const line21 = [1,0,1,0,1,0,2,2,0,0,0,3,0,3,0,4,0,5,5,5,0,1,1,1,0,2,0,2,0,0,3,0];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      newBoard[21][x] = line21[x];
    }
    
    // Ligne 20 - encore plus de trous
    const line20 = [1,1,1,1,1,0,2,0,0,0,0,3,0,3,0,4,0,5,0,5,0,1,0,1,0,2,0,2,0,3,3,3];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      newBoard[20][x] = line20[x];
    }
    
    // Ligne 19 - quelques blocs isolés
    const line19 = [1,1,0,1,1,0,2,2,2,0,3,3,3,3,0,4,0,5,5,5,0,1,1,1,0,2,2,2,0,3,0,3];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      newBoard[19][x] = line19[x];
    }
    
    // Ligne 18 - peu de blocs
    const line18 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      newBoard[18][x] = line18[x];
    }
    
    return newBoard;
  }, []);

  // Créer une nouvelle pièce aléatoire
  const createNewPiece = useCallback((): Tetromino => {
    const tetrominoKeys = Object.keys(TETROMINOS);
    const randomKey = tetrominoKeys[Math.floor(Math.random() * tetrominoKeys.length)] as keyof typeof TETROMINOS;
    const tetromino = TETROMINOS[randomKey];
    
    return {
      shape: tetromino.shape.map(row => row.map(cell => cell ? tetromino.color : 0)),
      position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2), y: 0 },
      color: tetromino.color
    };
  }, []);

  // Vérifier si une position est valide
  const isValidPosition = useCallback((piece: Tetromino, newPosition: Position, newShape?: number[][]): boolean => {
    const shape = newShape || piece.shape;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const newX = newPosition.x + x;
          const newY = newPosition.y + y;
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false;
          }
          
          if (newY >= 0 && board[newY][newX] !== 0) {
            return false;
          }
        }
      }
    }
    return true;
  }, [board]);

  // Faire tourner une pièce
  const rotatePiece = useCallback((shape: number[][]): number[][] => {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotated[j][rows - 1 - i] = shape[i][j];
      }
    }
    return rotated;
  }, []);

  // Placer la pièce sur le plateau
  const placePiece = useCallback((piece: Tetromino): number[][] => {
    const newBoard = board.map(row => [...row]);
    
    piece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== 0) {
          const boardY = piece.position.y + y;
          const boardX = piece.position.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = cell;
          }
        }
      });
    });
    
    return newBoard;
  }, [board]);

  // Supprimer les lignes complètes
  const clearLines = useCallback((boardToClear: number[][]): { newBoard: number[][]; linesCleared: number } => {
    const newBoard = [];
    let linesClearedCount = 0;
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (boardToClear[y].every(cell => cell !== 0)) {
        linesClearedCount++;
      } else {
        newBoard.unshift(boardToClear[y]);
      }
    }
    
    // Ajouter des lignes vides en haut
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }
    
    return { newBoard, linesCleared: linesClearedCount };
  }, []);

  // Déplacer la pièce vers le bas
  const dropPiece = useCallback(() => {
    if (!currentPiece || gameOver) return;
    
    const newPosition = { x: currentPiece.position.x, y: currentPiece.position.y + 1 };
    
    if (isValidPosition(currentPiece, newPosition)) {
      setCurrentPiece({ ...currentPiece, position: newPosition });
    } else {
      // Placer la pièce
      const newBoard = placePiece(currentPiece);
      const { newBoard: clearedBoard, linesCleared: newLinesCleared } = clearLines(newBoard);
      
      setBoard(clearedBoard);
      const newScore = score + newLinesCleared * 100 + 10;
      const totalLines = linesCleared + newLinesCleared;
      const newPiecesPlaced = piecesPlaced + 1;
      
      setScore(newScore);
      setLinesCleared(totalLines);
      setPiecesPlaced(newPiecesPlaced);
      
      // Calculer et mettre à jour la vitesse basée sur les pièces placées
      const newSpeed = calculateSpeed(newPiecesPlaced);
      setGameSpeed(newSpeed);
      
      // Créer une nouvelle pièce
      const nextPiece = createNewPiece();
      if (isValidPosition(nextPiece, nextPiece.position)) {
        setCurrentPiece(nextPiece);
      } else {
        setGameOver(true);
      }
    }
  }, [currentPiece, gameOver, isValidPosition, placePiece, clearLines, createNewPiece, score, linesCleared, piecesPlaced, calculateSpeed]);

  // Gérer les contrôles clavier
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!currentPiece || gameOver) return;
    
    // Seulement empêcher le comportement par défaut pour les flèches
    if (event.key.startsWith('Arrow') || event.key === ' ') {
      event.preventDefault();
    }
    
    switch (event.key) {
      case 'ArrowLeft':
        const leftPosition = { x: currentPiece.position.x - 1, y: currentPiece.position.y };
        if (isValidPosition(currentPiece, leftPosition)) {
          setCurrentPiece({ ...currentPiece, position: leftPosition });
        }
        break;
        
      case 'ArrowRight':
        const rightPosition = { x: currentPiece.position.x + 1, y: currentPiece.position.y };
        if (isValidPosition(currentPiece, rightPosition)) {
          setCurrentPiece({ ...currentPiece, position: rightPosition });
        }
        break;
        
      case 'ArrowDown':
        dropPiece();
        break;
        
      case 'ArrowUp':
      case ' ':
        const rotatedShape = rotatePiece(currentPiece.shape);
        if (isValidPosition(currentPiece, currentPiece.position, rotatedShape)) {
          setCurrentPiece(prev => prev ? { ...prev, shape: rotatedShape } : null);
        }
        break;
    }
  }, [currentPiece, gameOver, isValidPosition, dropPiece, rotatePiece]);

  // Initialiser le jeu avec des blocs pré-placés
  const initializeGame = useCallback(() => {
    const initialBoard = generateInitialBoard();
    setBoard(initialBoard);
    setCurrentPiece(createNewPiece());
    setScore(0);
    setLinesCleared(0);
    setPiecesPlaced(0);
    setGameSpeed(500); // Réinitialiser la vitesse
    setGameStarted(true);
  }, [generateInitialBoard, createNewPiece]);

  // Initialiser le jeu
  useEffect(() => {
    if (!gameStarted) {
      initializeGame();
    }
  }, [gameStarted, initializeGame]);

  // Gestionnaire d'événements clavier
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Timer pour faire tomber les pièces - utilise gameSpeed pour l'accélération
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const interval = setInterval(() => {
      dropPiece();
    }, gameSpeed); // Utilise la vitesse variable
    
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, dropPiece, gameSpeed]);

  // Créer le plateau d'affichage avec la pièce actuelle
  const displayBoard = React.useMemo(() => {
    let display = board.map(row => [...row]);
    
    if (currentPiece) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell !== 0) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              display[boardY][boardX] = cell;
            }
          }
        });
      });
    }
    
    return display;
  }, [board, currentPiece]);

  const restartGame = () => {
    setGameOver(false);
    setGameStarted(false); // Ceci déclenchera une réinitialisation complète
  };

  return (
    <div className="h-full w-full bg-transparent flex flex-col relative">
      
      {/* Interface en haut - compacte avec vitesse */}
      <div className="flex items-center justify-between w-full px-4 py-1 bg-white/80 text-gray-800 text-sm border-b border-gray-200">
        <div className="font-bold">Score: {score}</div>
        <div className="text-xs text-gray-600">
          Rows : {linesCleared} | Blocks: {piecesPlaced} | Speed: {gameSpeed}ms
        </div>
      </div>

      {/* Plateau de jeu prend tout l'espace restant */}
      <div className="flex-1 w-full bg-transparent">
        <div 
          className="grid w-full h-full bg-transparent"
          style={{
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
            gap: '0px'
          }}
        >
          {displayBoard.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className="bg-white border border-gray-100 w-full h-full"
                style={{
                  backgroundColor: cell === 0 ? 'white' : COLORS[cell as keyof typeof COLORS]
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal Game Over */}
      {gameOver && (
        <div className="absolute inset-[-12px] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl border border-gray-300 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Game Over!</h2>
            <p className="text-gray-700 mb-2">Finale score: {score}</p>
            <p className="text-gray-700 mb-2">Full rows: {linesCleared}</p>
            <p className="text-gray-700 mb-4">Blocks: {piecesPlaced}</p>
            <button 
              onClick={restartGame}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Restart Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTetris;