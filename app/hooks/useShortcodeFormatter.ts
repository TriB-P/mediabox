/**
 * Ce fichier contient un hook personnalisé `useShortcodeFormatter` qui permet de formater
 * des identifiants de shortcodes en différentes valeurs (code, nom d'affichage, UTM, etc.).
 * Il gère la récupération des données depuis Firebase (Firestore) et intègre un système de cache
 * pour optimiser les performances. Il inclut également des fonctions utilitaires
 * pour vider ce cache.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type ShortcodeFormat = 'code' | 'display_fr' | 'display_en' | 'utm' | 'custom_utm' | 'custom_code' | 'open';

interface ShortcodeData {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
  SH_Display_Name_EN?: string;
  SH_Default_UTM?: string;
}

interface CustomCode {
  id: string;
  shortcodeId: string;
  customCode: string;
}

interface FormattedValueResult {
  value: string;
  loading: boolean;
  error?: string;
}

interface UseShortcodeFormatterReturn {
  formatValue: (shortcodeId: string, format: ShortcodeFormat, openValue?: string) => FormattedValueResult;
  formatMultipleValues: (values: Array<{id: string, format: ShortcodeFormat, openValue?: string}>) => FormattedValueResult[];
  clearCache: () => void;
}

const shortcodeCache = new Map<string, ShortcodeData>();
const customCodesCache = new Map<string, CustomCode[]>();

/**
 * Hook principal pour formater les shortcodes.
 *
 * @param {string} clientId - L'identifiant du client pour lequel récupérer les custom codes.
 * @returns {UseShortcodeFormatterReturn} Un objet contenant les fonctions de formatage et de gestion du cache.
 */
export function useShortcodeFormatter(clientId: string): UseShortcodeFormatterReturn {
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  /**
   * Charge un shortcode depuis Firestore, en utilisant un cache si disponible.
   *
   * @param {string} shortcodeId - L'identifiant du shortcode à charger.
   * @returns {Promise<ShortcodeData | null>} Les données du shortcode ou null si non trouvé ou une erreur survient.
   */
  const loadShortcode = useCallback(async (shortcodeId: string): Promise<ShortcodeData | null> => {
    if (shortcodeCache.has(shortcodeId)) {
      return shortcodeCache.get(shortcodeId)!;
    }

    try {
      const shortcodeRef = doc(db, 'shortcodes', shortcodeId);
      console.log("FIREBASE: LECTURE - Fichier: useShortcodeFormatter.ts - Fonction: loadShortcode - Path: shortcodes/${shortcodeId}");
      const shortcodeSnap = await getDoc(shortcodeRef);

      if (!shortcodeSnap.exists()) {
        console.warn(`Shortcode ${shortcodeId} non trouvé`);
        return null;
      }

      const data = shortcodeSnap.data();
      const shortcodeData: ShortcodeData = {
        id: shortcodeSnap.id,
        SH_Code: data.SH_Code || shortcodeSnap.id,
        SH_Display_Name_FR: data.SH_Display_Name_FR || data.SH_Code || shortcodeSnap.id,
        SH_Display_Name_EN: data.SH_Display_Name_EN,
        SH_Default_UTM: data.SH_Default_UTM,
      };

      shortcodeCache.set(shortcodeId, shortcodeData);
      return shortcodeData;

    } catch (error) {
      console.error(`Erreur lors du chargement du shortcode ${shortcodeId}:`, error);
      return null;
    }
  }, []);

  /**
   * Charge les custom codes associés à un client depuis Firestore, avec mise en cache.
   *
   * @param {string} clientId - L'identifiant du client.
   * @returns {Promise<CustomCode[]>} Un tableau des custom codes pour le client.
   */
  const loadClientCustomCodes = useCallback(async (clientId: string): Promise<CustomCode[]> => {
    if (customCodesCache.has(clientId)) {
      return customCodesCache.get(clientId)!;
    }

    try {
      const customCodesRef = collection(db, 'clients', clientId, 'customCodes');
      console.log("FIREBASE: LECTURE - Fichier: useShortcodeFormatter.ts - Fonction: loadClientCustomCodes - Path: clients/${clientId}/customCodes");
      const snapshot = await getDocs(customCodesRef);

      const customCodes: CustomCode[] = snapshot.docs.map(doc => ({
        id: doc.id,
        shortcodeId: doc.data().shortcodeId,
        customCode: doc.data().customCode,
      }));

      customCodesCache.set(clientId, customCodes);
      return customCodes;

    } catch (error) {
      console.error(`Erreur lors du chargement des custom codes pour le client ${clientId}:`, error);
      return [];
    }
  }, []);

  /**
   * Trouve un custom code spécifique pour un shortcode donné parmi les custom codes du client.
   *
   * @param {string} shortcodeId - L'identifiant du shortcode pour lequel trouver le custom code.
   * @returns {Promise<CustomCode | null>} Le custom code trouvé ou null.
   */
  const findCustomCode = useCallback(async (shortcodeId: string): Promise<CustomCode | null> => {
    const customCodes = await loadClientCustomCodes(clientId);
    return customCodes.find(cc => cc.shortcodeId === shortcodeId) || null;
  }, [clientId, loadClientCustomCodes]);

  /**
   * Formate une valeur de shortcode selon le format demandé.
   * Gère les états de chargement et les erreurs.
   *
   * @param {string} shortcodeId - L'identifiant du shortcode à formater.
   * @param {ShortcodeFormat} format - Le format de sortie désiré.
   * @param {string} [openValue] - Une valeur optionnelle utilisée pour le format 'open'.
   * @returns {FormattedValueResult} L'objet résultat contenant la valeur formatée, l'état de chargement et une éventuelle erreur.
   */
  const formatValue = useCallback((
    shortcodeId: string, 
    format: ShortcodeFormat, 
    openValue?: string
  ): FormattedValueResult => {
    const cacheKey = `${shortcodeId}_${format}_${openValue || ''}`;

    if (format === 'open') {
      return { value: openValue || '', loading: false };
    }

    if (loadingStates[cacheKey]) {
      return { value: '', loading: true };
    }

    if (errors[cacheKey]) {
      return { value: '', loading: false, error: errors[cacheKey] };
    }

    const loadAndFormat = async () => {
      setLoadingStates(prev => ({ ...prev, [cacheKey]: true }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[cacheKey];
        return newErrors;
      });

      try {
        const shortcodeData = await loadShortcode(shortcodeId);
        
        if (!shortcodeData) {
          throw new Error(`Shortcode ${shortcodeId} non trouvé`);
        }

        let formattedValue = '';

        switch (format) {
          case 'code':
            formattedValue = shortcodeData.SH_Code;
            break;
          case 'display_fr':
            formattedValue = shortcodeData.SH_Display_Name_FR;
            break;
          case 'display_en':
            formattedValue = shortcodeData.SH_Display_Name_EN || shortcodeData.SH_Display_Name_FR;
            break;
          case 'utm':
            formattedValue = shortcodeData.SH_Default_UTM || shortcodeData.SH_Code;
            break;
          
          case 'custom_utm':
            const customCodeForUTM = await findCustomCode(shortcodeId);
            formattedValue = customCodeForUTM?.customCode || shortcodeData.SH_Default_UTM || shortcodeData.SH_Code;
            break;

          case 'custom_code':
            const customCodeForCode = await findCustomCode(shortcodeId);
            formattedValue = customCodeForCode?.customCode || shortcodeData.SH_Code;
            break;

          default:
            formattedValue = shortcodeData.SH_Display_Name_FR;
        }

      } catch (error) {
        console.error(`Erreur formatage ${shortcodeId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur de formatage';
        setErrors(prev => ({ ...prev, [cacheKey]: errorMessage }));
      } finally {
        setLoadingStates(prev => ({ ...prev, [cacheKey]: false }));
      }
    };

    loadAndFormat();

    return { value: '', loading: true };
  }, [loadShortcode, findCustomCode, loadingStates, errors]);

  /**
   * Formate plusieurs valeurs de shortcode en une seule opération.
   *
   * @param {Array<{id: string, format: ShortcodeFormat, openValue?: string}>} values - Un tableau d'objets, chacun contenant l'ID du shortcode, le format et une valeur optionnelle.
   * @returns {FormattedValueResult[]} Un tableau des résultats formatés.
   */
  const formatMultipleValues = useCallback((
    values: Array<{id: string, format: ShortcodeFormat, openValue?: string}>
  ): FormattedValueResult[] => {
    return values.map(({ id, format, openValue }) => 
      formatValue(id, format, openValue)
    );
  }, [formatValue]);

  /**
   * Vide les caches de shortcodes et de custom codes, et réinitialise les états de chargement et d'erreurs.
   */
  const clearCache = useCallback(() => {
    shortcodeCache.clear();
    customCodesCache.clear();
    setLoadingStates({});
    setErrors({});
  }, []);

  return {
    formatValue,
    formatMultipleValues,
    clearCache
  };
}

/**
 * Hook utilitaire pour formater une seule valeur de shortcode.
 *
 * @param {string} clientId - L'identifiant du client.
 * @param {string} shortcodeId - L'identifiant du shortcode à formater.
 * @param {ShortcodeFormat} format - Le format de sortie désiré.
 * @param {string} [openValue] - Une valeur optionnelle pour le format 'open'.
 * @returns {FormattedValueResult} L'objet résultat du formatage.
 */
export function useFormattedValue(
  clientId: string,
  shortcodeId: string,
  format: ShortcodeFormat,
  openValue?: string
): FormattedValueResult {
  const { formatValue } = useShortcodeFormatter(clientId);
  return formatValue(shortcodeId, format, openValue);
}

/**
 * Vide globalement tous les caches de formatage de shortcodes.
 */
export function clearAllShortcodeFormatCache(): void {
  shortcodeCache.clear();
  customCodesCache.clear();
}