// app/hooks/useThemeImage.ts
/**
 * Hook personnalisé pour récupérer l'image de thème depuis un GitHub Gist
 * Gère la hiérarchie : override utilisateur → thème par date → fond blanc
 */

import { useState, useEffect } from 'react';

// Types pour la structure du Gist
interface Theme {
  name: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
}

interface ThemeData {
  themes: Theme[];
  userOverrides: Record<string, string>;
}

interface UseThemeImageResult {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
}

const GIST_RAW_URL = 'https://gist.githubusercontent.com/TriB-P/0536ac33dd23cc5bad7ed7e67d65836e/raw';
const CACHE_KEY = 'theme_data_cache';
const CACHE_DURATION = 2 * 60 * 1000; // 1 heure en millisecondes

/**
 * Hook pour récupérer l'URL de l'image de thème selon l'utilisateur et la date
 * @param userEmail - Email de l'utilisateur connecté
 * @returns Object avec imageUrl, loading, et error
 */
export function useThemeImage(userEmail: string | undefined): UseThemeImageResult {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Vérifie si un thème est actif selon la date actuelle
   */
  const isThemeActive = (theme: Theme): boolean => {
    const now = new Date();
    const startDate = new Date(theme.startDate);
    const endDate = new Date(theme.endDate);
    
    // Ajuster les heures pour inclure toute la journée
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return now >= startDate && now <= endDate;
  };

  /**
   * Trouve l'image appropriée selon la hiérarchie de priorité
   */
  const findThemeImage = (data: ThemeData): string | null => {
    // 1. Priorité max : Override utilisateur
    if (userEmail && data.userOverrides[userEmail]) {
      return data.userOverrides[userEmail];
    }

    // 2. Thème par défaut selon la date
    const activeTheme = data.themes.find(isThemeActive);
    if (activeTheme) {
      return activeTheme.imageUrl;
    }

    // 3. Fond blanc par défaut
    return null;
  };

  /**
   * Récupère les données depuis le cache si valides
   */
  const getCachedData = (): ThemeData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      // Vérifier si le cache est encore valide
      if (now - timestamp < CACHE_DURATION) {
        return data;
      }
    } catch (e) {
      console.warn('Erreur lecture cache thème:', e);
    }
    return null;
  };

  /**
   * Sauvegarde les données dans le cache
   */
  const setCachedData = (data: ThemeData): void => {
    try {
      const cacheObject = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
    } catch (e) {
      console.warn('Erreur sauvegarde cache thème:', e);
    }
  };

  /**
   * Récupère les données depuis le Gist
   */
  const fetchThemeData = async (): Promise<ThemeData> => {
    const response = await fetch(GIST_RAW_URL);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // Validation basique de la structure
    if (!data.themes || !Array.isArray(data.themes)) {
      throw new Error('Structure de données invalide');
    }

    return data;
  };

  /**
   * Effet principal pour charger et traiter les données de thème
   */
  useEffect(() => {
    const loadThemeImage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Essayer le cache d'abord
        let themeData = getCachedData();

        // Si pas de cache valide, récupérer depuis le Gist
        if (!themeData) {
          themeData = await fetchThemeData();
          setCachedData(themeData);
        }

        // Déterminer quelle image utiliser
        const resolvedImageUrl = findThemeImage(themeData);
        setImageUrl(resolvedImageUrl);

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