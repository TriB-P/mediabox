// app/hooks/useThemeImage.ts
/**
 * Hook personnalisé pour récupérer l'image de thème depuis Firestore
 * Gère la hiérarchie : override utilisateur → thème default → fond blanc
 */

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UseThemeImageResult {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
}

const CACHE_KEY = 'theme_data_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes en millisecondes

interface CachedThemeData {
  userUrl?: string;
  defaultUrl?: string;
  timestamp: number;
}

/**
 * Hook pour récupérer l'URL de l'image de thème selon l'utilisateur et Firestore
 * @param userEmail - Email de l'utilisateur connecté
 * @returns Object avec imageUrl, loading, et error
 */
export function useThemeImage(userEmail: string | undefined): UseThemeImageResult {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupère les données depuis le cache si valides
   */
  const getCachedData = (userEmail: string): CachedThemeData | null => {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${userEmail}`);
      if (!cached) return null;

      const cachedData: CachedThemeData = JSON.parse(cached);
      const now = Date.now();

      // Vérifier si le cache est encore valide
      if (now - cachedData.timestamp < CACHE_DURATION) {
        return cachedData;
      }
    } catch (e) {
      console.warn('Erreur lecture cache thème:', e);
    }
    return null;
  };

  /**
   * Sauvegarde les données dans le cache
   */
  const setCachedData = (userEmail: string, userUrl?: string, defaultUrl?: string): void => {
    try {
      const cacheObject: CachedThemeData = {
        userUrl,
        defaultUrl,
        timestamp: Date.now()
      };
      localStorage.setItem(`${CACHE_KEY}_${userEmail}`, JSON.stringify(cacheObject));
    } catch (e) {
      console.warn('Erreur sauvegarde cache thème:', e);
    }
  };

  /**
   * Récupère l'URL de thème pour un utilisateur spécifique
   */
  const getUserThemeUrl = async (email: string): Promise<string | null> => {
    try {
      console.log(`FIREBASE: [LECTURE] - Fichier: useThemeImage.ts - Fonction: getUserThemeUrl - Path: themes/${email}`);
      const userThemeDoc = await getDoc(doc(db, 'themes', email));
      
      if (userThemeDoc.exists()) {
        const data = userThemeDoc.data();
        return data.URL || null;
      }
      return null;
    } catch (err) {
      console.warn(`Impossible de récupérer le thème pour l'utilisateur ${email}:`, err);
      return null;
    }
  };

  /**
   * Récupère l'URL de thème par défaut
   */
  const getDefaultThemeUrl = async (): Promise<string | null> => {
    try {
      console.log("FIREBASE: [LECTURE] - Fichier: useThemeImage.ts - Fonction: getDefaultThemeUrl - Path: themes/default");
      const defaultThemeDoc = await getDoc(doc(db, 'themes', 'default'));
      
      if (defaultThemeDoc.exists()) {
        const data = defaultThemeDoc.data();
        return data.URL || null;
      }
      return null;
    } catch (err) {
      console.warn('Impossible de récupérer le thème par défaut:', err);
      return null;
    }
  };

  /**
   * Détermine quelle URL utiliser selon la hiérarchie de priorité
   */
  const resolveThemeUrl = (userUrl?: string, defaultUrl?: string): string | null => {
    // 1. Priorité max : Override utilisateur
    if (userUrl) {
      return userUrl;
    }

    // 2. Thème par défaut
    if (defaultUrl) {
      return defaultUrl;
    }

    // 3. Fond blanc par défaut
    return null;
  };

  /**
   * Effet principal pour charger et traiter les données de thème
   */
  useEffect(() => {
    const loadThemeImage = async () => {
      // Si pas d'email utilisateur, utiliser seulement le thème par défaut
      if (!userEmail) {
        try {
          setLoading(true);
          setError(null);

          const defaultUrl = await getDefaultThemeUrl();
          setImageUrl(defaultUrl);
        } catch (err) {
          console.error('Erreur chargement thème par défaut:', err);
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
          setImageUrl(null);
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Essayer le cache d'abord
        const cachedData = getCachedData(userEmail);
        
        if (cachedData) {
          // Utiliser les données en cache
          const resolvedUrl = resolveThemeUrl(cachedData.userUrl, cachedData.defaultUrl);
          setImageUrl(resolvedUrl);
          setLoading(false);
          return;
        }

        // Si pas de cache valide, récupérer depuis Firestore
        const [userUrl, defaultUrl] = await Promise.all([
          getUserThemeUrl(userEmail),
          getDefaultThemeUrl()
        ]);

        // Sauvegarder en cache
        setCachedData(userEmail, userUrl || undefined, defaultUrl || undefined);

        // Déterminer quelle image utiliser
        const resolvedUrl = resolveThemeUrl(userUrl || undefined, defaultUrl || undefined);
        setImageUrl(resolvedUrl);

      } catch (err) {
        console.error('Erreur chargement thème:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setImageUrl(null); // Fallback vers fond blanc
      } finally {
        setLoading(false);
      }
    };

    loadThemeImage();
  }, [userEmail]); // Recharger si l'email utilisateur change

  return { imageUrl, loading, error };
}