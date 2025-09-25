// app/hooks/documents/useConvertShortcodesDoc.ts
/**
 * Ce hook gère la conversion des IDs de shortcodes en noms d'affichage
 * et la conversion des chaînes de caractères numériques en nombres (type number).
 * Il parcourt chaque cellule d'un tableau 2D, vérifie si la valeur
 * correspond à un shortcode, la remplace par son nom, ou la convertit en nombre si possible.
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCachedAllShortcodes, ShortcodeItem } from '../../lib/cacheService';
import { getClientInfo } from '../../lib/clientService';

// MODIFICATION: Ajout d'un type pour clarifier que les cellules peuvent contenir des chaînes ou des nombres.
type CellData = string | number;

interface UseConvertShortcodesDocReturn {
  // MODIFICATION: Le type de retour est maintenant un tableau de CellData.
  convertShortcodes: (data: string[][], clientId: string, exportLanguage?: 'FR' | 'EN') => Promise<CellData[][] | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour convertir les IDs de shortcodes en noms d'affichage et les chaînes numériques en nombres.
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
   * CORRIGÉ: Vérifie si une valeur donnée correspond à un ID de shortcode uniquement par recherche directe.
   * @param {string} value La valeur à vérifier.
   * @param {{[key: string]: ShortcodeItem}} shortcodesMap Le mapping des shortcodes.
   * @returns {ShortcodeItem | null} L'objet shortcode si trouvé, sinon null.
   */
  const findShortcode = useCallback((
    value: string, 
    shortcodesMap: {[key: string]: ShortcodeItem}
  ): ShortcodeItem | null => {
    // Vérification directe par ID uniquement
    return shortcodesMap[value] || null;
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
      console.log("TEST", language)

      return shortcode.SH_Display_Name_EN;
    }
    console.log("TEST", language)

    
    
    // Fallback vers français si pas de version anglaise ou si langue est FR
    return shortcode.SH_Display_Name_FR;
  }, []);

  /**
   * MODIFICATION: La fonction traite maintenant la conversion en nombre et son type de retour est `CellData`.
   * Traite une cellule individuelle pour convertir les shortcodes ou les chaînes numériques.
   * @param {string} cellValue La valeur de la cellule à traiter.
   * @param {{[key: string]: ShortcodeItem}} shortcodesMap Le mapping des shortcodes.
   * @param {'FR' | 'EN'} language La langue d'exportation.
   * @returns {CellData} La valeur convertie (string ou number).
   */
  const processCellValue = useCallback((
    cellValue: string,
    shortcodesMap: {[key: string]: ShortcodeItem},
    language: 'FR' | 'EN'
  ): CellData => {
    // Cas 1: La cellule est vide, nulle ou composée d'espaces. On la retourne telle quelle.
    if (!cellValue || cellValue.trim() === '') {
      return cellValue;
    }
    
    const trimmedValue = cellValue.trim();

    // Cas 2: La valeur est un shortcode. On le convertit.
    const shortcode = findShortcode(trimmedValue, shortcodesMap);
    if (shortcode) {
      const displayName = getShortcodeDisplayName(shortcode, language);
      console.log(`[CONVERSION] Shortcode: ${trimmedValue} → ${displayName}`);
      return displayName;
    }

    // Cas 3: Ce n'est pas un shortcode. On essaie de la convertir en nombre.
    // La fonction Number() convertit une chaîne en nombre. Si la chaîne ne
    // ressemble pas à un nombre (ex: "ID-123"), elle renvoie NaN (Not-a-Number).
    const numericValue = Number(trimmedValue);
    if (!isNaN(numericValue) && isFinite(numericValue)) {
      return numericValue;
    }

    // Cas 4: Ce n'est ni un shortcode, ni un nombre. On retourne la valeur originale.
    return cellValue;
  }, [findShortcode, getShortcodeDisplayName]);

  /**
   * MODIFICATION: Le type de retour de la promesse est maintenant `CellData[][]`.
   * Fonction principale pour convertir les shortcodes et les nombres dans un tableau 2D de données.
   * @param {string[][]} data Le tableau 2D de données à traiter.
   * @param {string} clientId L'ID du client pour récupérer la langue d'exportation.
   * @param {'FR' | 'EN'} exportLanguage La langue d'exportation (optionnel).
   * @returns {Promise<CellData[][] | null>} Une promesse qui se résout avec les données converties, ou null en cas d'erreur.
   */
  const convertShortcodes = useCallback(async (
    data: string[][],
    clientId: string,
    exportLanguage?: 'FR' | 'EN'
  ): Promise<CellData[][] | null> => {
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    if (!data || data.length === 0) {
      console.log('[CONVERSION] Aucune donnée à traiter');
      return data;
    }

    try {
      setLoading(true);
      setError(null);

      const shortcodesMap = getCachedAllShortcodes();
      if (!shortcodesMap) {
        console.warn('[CONVERSION] Aucun shortcode en cache - conversion de shortcode impossible');
      }

      console.log(`[CONVERSION] ${shortcodesMap ? Object.keys(shortcodesMap).length : 0} shortcodes disponibles en cache`);

      const language = exportLanguage || await getClientExportLanguage(clientId);
      console.log(`[CONVERSION] Langue d'exportation: ${language}`);

      // MODIFICATION: Les types des tableaux sont mis à jour pour accepter `CellData`.
      const convertedData: CellData[][] = [];
      let convertedCount = 0;
      let totalCells = 0;

      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        const convertedRow: CellData[] = [];

        for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
          const originalValue = row[cellIndex];
          // S'assurer que shortcodesMap n'est pas null avant de le passer
          const convertedValue = processCellValue(originalValue, shortcodesMap || {}, language);
          
          convertedRow.push(convertedValue);
          totalCells++;
          
          if (convertedValue !== originalValue) {
            convertedCount++;
          }
        }

        convertedData.push(convertedRow);
      }

      console.log(`[CONVERSION] Terminé: ${convertedCount} cellules converties sur ${totalCells}`);
      
      return convertedData;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de la conversion';
      console.error('❌ Erreur de conversion:', errorMessage);
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