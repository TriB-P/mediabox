// app/hooks/useGenerateDoc.ts

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface UseGenerateDocReturn {
  generateDocument: (sheetUrl: string, sheetName: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useGenerateDoc(): UseGenerateDocReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Extrait l'ID du Google Sheet depuis une URL
   */
  const extractSheetId = useCallback((url: string): string | null => {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }, []);

  /**
   * Obtient le token d'accès Google avec cache
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!user) throw new Error('Utilisateur non authentifié');

    // Vérifier le cache (token valide < 50 minutes)
    const cachedToken = localStorage.getItem('google_sheets_token');
    const cachedTime = localStorage.getItem('google_sheets_token_time');
    
    if (cachedToken && cachedTime) {
      const tokenAge = Date.now() - parseInt(cachedTime);
      if (tokenAge < 50 * 60 * 1000) {
        return cachedToken;
      }
      // Nettoyer le cache expiré
      localStorage.removeItem('google_sheets_token');
      localStorage.removeItem('google_sheets_token_time');
    }

    // Demander nouveau token OAuth
    const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    const auth = getAuth();
    
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (credential?.accessToken) {
      // Sauvegarder en cache
      localStorage.setItem('google_sheets_token', credential.accessToken);
      localStorage.setItem('google_sheets_token_time', Date.now().toString());
      return credential.accessToken;
    }
    
    throw new Error('Token d\'accès non récupéré');
  }, [user]);

  /**
   * Écrit "TEST" dans la cellule A1 du Google Sheet
   */
  const generateDocument = useCallback(async (
    sheetUrl: string, 
    sheetName: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const sheetId = extractSheetId(sheetUrl);
      if (!sheetId) {
        throw new Error('URL Google Sheet invalide');
      }

      const token = await getAccessToken();
      if (!token) {
        throw new Error('Impossible d\'obtenir le token d\'accès');
      }

      const range = `${sheetName}!A1`;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [["ALLO"]],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `Erreur HTTP ${response.status}`;
        
        if (response.status === 403) {
          throw new Error('Permissions insuffisantes. Vérifiez l\'accès au Google Sheet.');
        } else if (response.status === 404) {
          throw new Error('Google Sheet ou onglet non trouvé.');
        } else {
          throw new Error(`Erreur API: ${errorMessage}`);
        }
      }

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [extractSheetId, getAccessToken]);

  return {
    generateDocument,
    loading,
    error,
  };
}