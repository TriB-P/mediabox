// app/hooks/documents/useConvertShortcodesDoc.ts
/**
 * Ce hook gère la conversion des IDs de shortcodes en noms d'affichage
 * dans les données extraites des hooks cleanData et campaignData.
 * Il parcourt chaque cellule d'un tableau 2D, vérifie si la valeur
 * correspond à un shortcode dans le cache localStorage, et la remplace
 * par le nom d'affichage approprié selon la langue d'exportation du client.
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCachedAllShortcodes, ShortcodeItem } from '../../lib/cacheService';
import { getClientInfo } from '../../lib/clientService';

interface UseConvertShortcodesDocReturn {
  convertShortcodes: (data: string[][], clientId: string, exportLanguage?: 'FR' | 'EN') => Promise<string[][] | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour convertir les IDs de shortcodes en noms d'affichage dans les données.
 * @returns {UseConvertShortcodesDocReturn} Un objet contenant la fonction convertShortcodes,
 * les états de chargement et d'erreur.
 */
export function useConvertShortcodesDoc(): UseConvertShortcodesDocReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupère la langue d'exportation du client depuis Firebase.
   * @param {string} clientId L'ID du client.
   * @returns {Promise<'FR' | 'EN'>} La langue d'exportation du client.
   */
  const getClientExportLanguage = useCallback(async (clientId: string): Promise<'FR' | 'EN'> => {
    try {
      console.log("FIREBASE: LECTURE - Fichier: useConvertShortcodesDoc.ts - Fonction: getClientExportLanguage - Path: clients/${clientId}");
      const clientInfo = await getClientInfo(clientId);
      return clientInfo.CL_Export_Language || 'FR';
    } catch (err) {
      console.error('❌ Erreur récupération langue client:', err);
      return 'FR'; // Fallback vers français
    }
  }, []);

  /**
   * Vérifie si une valeur donnée correspond à un ID de shortcode.
   * @param {string} value La valeur à vérifier.
   * @param {{[key: string]: ShortcodeItem}} shortcodesMap Le mapping des shortcodes.
   * @returns {ShortcodeItem | null} L'objet shortcode si trouvé, sinon null.
   */
  const findShortcode = useCallback((
    value: string, 
    shortcodesMap: {[key: string]: ShortcodeItem}
  ): ShortcodeItem | null => {
    // Vérification directe par ID
    if (shortcodesMap[value]) {
      return shortcodesMap[value];
    }

    // Vérification par SH_Code (au cas où la valeur serait un code au lieu d'un ID)
    const shortcodeByCode = Object.values(shortcodesMap).find(
      shortcode => shortcode.SH_Code === value
    );

    return shortcodeByCode || null;
  }, []);

  /**
   * Convertit un shortcode en nom d'affichage selon la langue spécifiée.
   * @param {ShortcodeItem} shortcode L'objet shortcode à convertir.
   * @param {'FR' | 'EN'} language La langue d'affichage désirée.
   * @returns {string} Le nom d'affichage du shortcode.
   */
  const getShortcodeDisplayName = useCallback((
    shortcode: ShortcodeItem, 
    language: 'FR' | 'EN'
  ): string => {
    if (language === 'EN' && shortcode.SH_Display_Name_EN) {
      return shortcode.SH_Display_Name_EN;
    }
    
    // Fallback vers français si pas de version anglaise ou si langue est FR
    return shortcode.SH_Display_Name_FR;
  }, []);

  /**
   * Traite une cellule individuelle pour convertir les shortcodes.
   * @param {string} cellValue La valeur de la cellule à traiter.
   * @param {{[key: string]: ShortcodeItem}} shortcodesMap Le mapping des shortcodes.
   * @param {'FR' | 'EN'} language La langue d'exportation.
   * @returns {string} La valeur convertie ou originale.
   */
  const processCellValue = useCallback((
    cellValue: string,
    shortcodesMap: {[key: string]: ShortcodeItem},
    language: 'FR' | 'EN'
  ): string => {
    // Ignorer les cellules vides ou nulles
    if (!cellValue || cellValue.trim() === '') {
      return cellValue;
    }

    // Chercher si cette valeur correspond à un shortcode
    const shortcode = findShortcode(cellValue.trim(), shortcodesMap);
    
    if (shortcode) {
      const displayName = getShortcodeDisplayName(shortcode, language);
      console.log(`[SHORTCODE CONVERSION] ${cellValue} → ${displayName}`);
      return displayName;
    }

    // Retourner la valeur originale si ce n'est pas un shortcode
    return cellValue;
  }, [findShortcode, getShortcodeDisplayName]);

  /**
   * Fonction principale pour convertir les shortcodes dans un tableau 2D de données.
   * @param {string[][]} data Le tableau 2D de données à traiter.
   * @param {string} clientId L'ID du client pour récupérer la langue d'exportation.
   * @param {'FR' | 'EN'} exportLanguage La langue d'exportation (optionnel).
   * @returns {Promise<string[][] | null>} Une promesse qui se résout avec les données converties, ou null en cas d'erreur.
   */
  const convertShortcodes = useCallback(async (
    data: string[][],
    clientId: string,
    exportLanguage?: 'FR' | 'EN'
  ): Promise<string[][] | null> => {
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    if (!data || data.length === 0) {
      console.log('[SHORTCODE CONVERSION] Aucune donnée à traiter');
      return data;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer tous les shortcodes depuis le cache
      const shortcodesMap = getCachedAllShortcodes();
      
      if (!shortcodesMap) {
        console.warn('[SHORTCODE CONVERSION] Aucun shortcode en cache - aucune conversion possible');
        return data; // Retourner les données originales si pas de cache
      }

      console.log(`[SHORTCODE CONVERSION] ${Object.keys(shortcodesMap).length} shortcodes disponibles en cache`);

      // 2. Déterminer la langue d'exportation
      const language = exportLanguage || await getClientExportLanguage(clientId);
      console.log(`[SHORTCODE CONVERSION] Langue d'exportation: ${language}`);

      // 3. Traiter chaque ligne et chaque cellule
      const convertedData: string[][] = [];
      let convertedCount = 0;
      let totalCells = 0;

      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        const convertedRow: string[] = [];

        for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
          const originalValue = row[cellIndex];
          const convertedValue = processCellValue(originalValue, shortcodesMap, language);
          
          convertedRow.push(convertedValue);
          totalCells++;
          
          if (convertedValue !== originalValue) {
            convertedCount++;
          }
        }

        convertedData.push(convertedRow);
      }

      console.log(`[SHORTCODE CONVERSION] Terminé: ${convertedCount} shortcodes convertis sur ${totalCells} cellules`);
      
      return convertedData;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de la conversion des shortcodes';
      console.error('❌ Erreur conversion shortcodes:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, getClientExportLanguage, processCellValue]);

  return {
    convertShortcodes,
    loading,
    error,
  };
}