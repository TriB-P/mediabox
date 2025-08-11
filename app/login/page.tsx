// app/login/page.tsx
/**
 * Ce fichier définit la page de connexion de l'application.
 * Il affiche un jeu de Tetris personnalisé avec un ratio fixe sur la gauche 
 * et le module d'authentification sur la droite.
 */
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import CustomTetris from './CustomTetris';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [gameDimensions, setGameDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (user && !loading) {
      router.push('/campaigns');
    }
  }, [user, loading, router]);

  // Ratio de la grille Tetris : 32 colonnes × 24 lignes = 4:3
  const TETRIS_RATIO = 32 / 24; // 1.333...

  // Calculer les dimensions optimales du jeu
  useEffect(() => {
    const calculateGameSize = () => {
      if (!gameContainerRef.current) return;

      const container = gameContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const availableWidth = containerRect.width - 32; // padding
      const availableHeight = containerRect.height - 32; // padding

      // Calculer la taille en fonction du ratio
      let gameWidth, gameHeight;

      if (availableWidth / availableHeight > TETRIS_RATIO) {
        // Limité par la hauteur
        gameHeight = availableHeight;
        gameWidth = gameHeight * TETRIS_RATIO;
      } else {
        // Limité par la largeur
        gameWidth = availableWidth;
        gameHeight = gameWidth / TETRIS_RATIO;
      }

      setGameDimensions({ width: gameWidth, height: gameHeight });
    };

    calculateGameSize();
    window.addEventListener('resize', calculateGameSize);
    return () => window.removeEventListener('resize', calculateGameSize);
  }, [TETRIS_RATIO]);

  return (
    <div className="flex h-screen w-full bg-gray-100">
      
      {/* Colonne de gauche pour le jeu Tetris */}
      <div className="flex-1 bg-white flex items-center justify-center p-4" ref={gameContainerRef}>
        {/* Conteneur avec dimensions calculées pour maintenir les blocs carrés */}
        {gameDimensions.width > 0 && gameDimensions.height > 0 && (
          <div 
            className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200"
            style={{
              width: `${gameDimensions.width}px`,
              height: `${gameDimensions.height}px`
            }}
          >
            <CustomTetris />
          </div>
        )}
      </div>

      {/* Colonne de droite pour l'authentification - 1/2 sur petit écran, 1/3 sur grand écran */}
      <div className="w-1/2 lg:w-1/3 min-w-1/2 lg:min-w-1/3 flex flex-col bg-gray-50">
        {/* Contenu principal centré */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-lg">
            {loading ? ( 
              <div className="text-center">
                <p className="text-gray-500">Loading...</p>
              </div> 
            ) : (
              <>
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900">MediaBox</h2>
                  <p className="mt-2 text-sm text-gray-600">Login to access your campaigns</p>
                </div>
                <button 
                  onClick={() => { 
                    signInWithGoogle().catch((error) => 
                      console.error('Erreur de connexion:', error)
                    ); 
                  }} 
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Login with Google
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Image en bas */}
        <div className="p-4 flex justify-center">
          <img 
            src="/images/Login Footer.png" 
            alt="Login Footer"
            className="w-2/3 min-w-1/2 lg:min-w-1/3 flex flex-col"
          />
        </div>
      </div>
    </div>
  );
}