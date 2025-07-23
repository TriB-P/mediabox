/**
 * Ce hook personnalisé gère la génération de documents via l'API Google Sheets.
 * Il permet d'interagir avec une feuille de calcul Google spécifique pour y écrire des données.
 * Il s'occupe de l'authentification Google OAuth, de l'extraction de l'ID de la feuille
 * à partir d'une URL, et de la gestion des états de chargement et d'erreur.
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface UseGenerateDocReturn {
  generateDocument: (sheetUrl: string, sheetName: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook personnalisé pour générer des documents en interagissant avec Google Sheets.
 * @returns {UseGenerateDocReturn} Un objet contenant la fonction generateDocument, l'état de chargement et l'état d'erreur.
 */
export function useGenerateDoc(): UseGenerateDocReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Extrait l'ID unique d'un Google Sheet à partir de son URL complète.
   * @param {string} url - L'URL complète du Google Sheet.
   * @returns {string | null} L'ID du Google Sheet si trouvé, sinon null.
   */
  const extractSheetId = useCallback((url: string): string | null => {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }, []);

  /**
   * Obtient un token d'accès Google pour interagir avec les APIs Google Sheets.
   * Le token est mis en cache localement pour une durée limitée afin d'éviter des demandes répétées.
   * @returns {Promise<string | null>} Le token d'accès Google, ou null si l'utilisateur n'est pas authentifié ou si le token ne peut être récupéré.
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si le token d'accès ne peut être récupéré.
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!user) throw new Error('Utilisateur non authentifié');

    const cachedToken = localStorage.getItem('google_sheets_token');
    const cachedTime = localStorage.getItem('google_sheets_token_time');

    if (cachedToken && cachedTime) {
      const tokenAge = Date.now() - parseInt(cachedTime);
      if (tokenAge < 50 * 60 * 1000) {
        return cachedToken;
      }
      localStorage.removeItem('google_sheets_token');
      localStorage.removeItem('google_sheets_token_time');
    }

    const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    const auth = getAuth();

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    console.log("FIREBASE: LECTURE - Fichier: useGenerateDoc.ts - Fonction: getAccessToken - Path: N/A");
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (credential?.accessToken) {
      localStorage.setItem('google_sheets_token', credential.accessToken);
      localStorage.setItem('google_sheets_token_time', Date.now().toString());
      return credential.accessToken;
    }

    throw new Error('Token d\'accès non récupéré');
  }, [user]);

  /**
   * Écrit la valeur "ALLO" dans la cellule A1 d'un onglet spécifié d'un Google Sheet.
   * @param {string} sheetUrl - L'URL du Google Sheet cible.
   * @param {string} sheetName - Le nom de l'onglet dans lequel écrire.
   * @returns {Promise<boolean>} Vrai si l'écriture a réussi, faux sinon.
   * @throws {Error} Si l'URL du Google Sheet est invalide, si le token d'accès ne peut être obtenu, ou en cas d'erreur API.
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