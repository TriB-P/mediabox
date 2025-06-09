// app/hooks/useShortcodeFormatter.ts

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

// ==================== TYPES ====================

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
  CC_Shortcode_ID: string;
  CC_Custom_UTM?: string;
  CC_Custom_Code?: string;
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

// ==================== CACHE ====================

// Cache pour éviter les requêtes multiples pour les mêmes shortcodes
const shortcodeCache = new Map<string, ShortcodeData>();
const customCodesCache = new Map<string, CustomCode[]>(); // clé = clientId

// ==================== HOOK PRINCIPAL ====================

export function useShortcodeFormatter(clientId: string): UseShortcodeFormatterReturn {
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // ==================== FONCTIONS DE CHARGEMENT ====================

  /**
   * Charge un shortcode depuis Firestore avec mise en cache
   */
  const loadShortcode = useCallback(async (shortcodeId: string): Promise<ShortcodeData | null> => {
    // Vérifier le cache d'abord
    if (shortcodeCache.has(shortcodeId)) {
      return shortcodeCache.get(shortcodeId)!;
    }

    try {
      const shortcodeRef = doc(db, 'shortcodes', shortcodeId);
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

      // Mettre en cache
      shortcodeCache.set(shortcodeId, shortcodeData);
      return shortcodeData;

    } catch (error) {
      console.error(`Erreur lors du chargement du shortcode ${shortcodeId}:`, error);
      return null;
    }
  }, []);

  /**
   * Charge les custom codes pour un client avec mise en cache
   */
  const loadClientCustomCodes = useCallback(async (clientId: string): Promise<CustomCode[]> => {
    // Vérifier le cache d'abord
    if (customCodesCache.has(clientId)) {
      return customCodesCache.get(clientId)!;
    }

    try {
      const customCodesRef = collection(db, 'clients', clientId, 'customCodes');
      const snapshot = await getDocs(customCodesRef);

      const customCodes: CustomCode[] = snapshot.docs.map(doc => ({
        id: doc.id,
        CC_Shortcode_ID: doc.data().CC_Shortcode_ID,
        CC_Custom_UTM: doc.data().CC_Custom_UTM,
        CC_Custom_Code: doc.data().CC_Custom_Code,
      }));

      // Mettre en cache
      customCodesCache.set(clientId, customCodes);
      return customCodes;

    } catch (error) {
      console.error(`Erreur lors du chargement des custom codes pour le client ${clientId}:`, error);
      return [];
    }
  }, []);

  /**
   * Trouve un custom code pour un shortcode spécifique
   */
  const findCustomCode = useCallback(async (shortcodeId: string): Promise<CustomCode | null> => {
    const customCodes = await loadClientCustomCodes(clientId);
    return customCodes.find(cc => cc.CC_Shortcode_ID === shortcodeId) || null;
  }, [clientId, loadClientCustomCodes]);

  // ==================== FORMATAGE ====================

  /**
   * Formate une valeur selon le format demandé
   */
  const formatValue = useCallback((
    shortcodeId: string, 
    format: ShortcodeFormat, 
    openValue?: string
  ): FormattedValueResult => {
    const cacheKey = `${shortcodeId}_${format}_${openValue || ''}`;

    // Gérer le format 'open' directement
    if (format === 'open') {
      return {
        value: openValue || '',
        loading: false
      };
    }

    // Vérifier si on est en train de charger
    if (loadingStates[cacheKey]) {
      return {
        value: '',
        loading: true
      };
    }

    // Vérifier s'il y a une erreur
    if (errors[cacheKey]) {
      return {
        value: '',
        loading: false,
        error: errors[cacheKey]
      };
    }

    // Fonction asynchrone pour charger et formater
    const loadAndFormat = async () => {
      setLoadingStates(prev => ({ ...prev, [cacheKey]: true }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[cacheKey];
        return newErrors;
      });

      try {
        // Charger le shortcode
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
            // Chercher d'abord dans les custom codes
            const customCodeForUTM = await findCustomCode(shortcodeId);
            formattedValue = customCodeForUTM?.CC_Custom_UTM || shortcodeData.SH_Default_UTM || shortcodeData.SH_Code;
            break;

          case 'custom_code':
            // Chercher d'abord dans les custom codes
            const customCodeForCode = await findCustomCode(shortcodeId);
            formattedValue = customCodeForCode?.CC_Custom_Code || shortcodeData.SH_Code;
            break;

          default:
            formattedValue = shortcodeData.SH_Display_Name_FR;
        }

        console.log(`🎯 Formatage ${shortcodeId} (${format}): "${formattedValue}"`);

      } catch (error) {
        console.error(`Erreur formatage ${shortcodeId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur de formatage';
        setErrors(prev => ({ ...prev, [cacheKey]: errorMessage }));
      } finally {
        setLoadingStates(prev => ({ ...prev, [cacheKey]: false }));
      }
    };

    // Lancer le chargement en arrière-plan
    loadAndFormat();

    // Retourner l'état de chargement pour l'instant
    return {
      value: '',
      loading: true
    };
  }, [loadShortcode, findCustomCode, loadingStates, errors]);

  /**
   * Formate plusieurs valeurs en une fois
   */
  const formatMultipleValues = useCallback((
    values: Array<{id: string, format: ShortcodeFormat, openValue?: string}>
  ): FormattedValueResult[] => {
    return values.map(({ id, format, openValue }) => 
      formatValue(id, format, openValue)
    );
  }, [formatValue]);

  /**
   * Vide le cache (utile pour forcer un rechargement)
   */
  const clearCache = useCallback(() => {
    shortcodeCache.clear();
    customCodesCache.clear();
    setLoadingStates({});
    setErrors({});
    console.log('🧹 Cache shortcode formatter vidé');
  }, []);

  // ==================== RETURN ====================

  return {
    formatValue,
    formatMultipleValues,
    clearCache
  };
}

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Hook simplifié pour formater une seule valeur
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
 * Fonction utilitaire pour nettoyer tous les caches (peut être appelée depuis l'extérieur)
 */
export function clearAllShortcodeFormatCache(): void {
  shortcodeCache.clear();
  customCodesCache.clear();
  console.log('🧹 Cache global shortcode formatter vidé');
}
//