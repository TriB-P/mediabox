// app/hooks/useShortcodeFormatter.ts

'use client';

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

// CORRIGÉ: Interface alignée avec la structure de données sauvegardée
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

// ==================== CACHE ====================

const shortcodeCache = new Map<string, ShortcodeData>();
const customCodesCache = new Map<string, CustomCode[]>();

// ==================== HOOK PRINCIPAL ====================

export function useShortcodeFormatter(clientId: string): UseShortcodeFormatterReturn {
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // ==================== FONCTIONS DE CHARGEMENT ====================

  /**
   * Charge un shortcode depuis Firestore avec mise en cache
   */
  const loadShortcode = useCallback(async (shortcodeId: string): Promise<ShortcodeData | null> => {
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
    if (customCodesCache.has(clientId)) {
      return customCodesCache.get(clientId)!;
    }

    try {
      const customCodesRef = collection(db, 'clients', clientId, 'customCodes');
      const snapshot = await getDocs(customCodesRef);

      // CORRIGÉ: Mappage avec les bons noms de champs
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
   * Trouve un custom code pour un shortcode spécifique
   */
  const findCustomCode = useCallback(async (shortcodeId: string): Promise<CustomCode | null> => {
    const customCodes = await loadClientCustomCodes(clientId);
    // CORRIGÉ: Recherche avec le bon nom de champ
    return customCodes.find(cc => cc.shortcodeId === shortcodeId) || null;
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
          
          // CORRIGÉ: Logique de formatage pour les codes personnalisés
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

        console.log(`🎯 Formatage ${shortcodeId} (${format}): "${formattedValue}"`);

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

  const formatMultipleValues = useCallback((
    values: Array<{id: string, format: ShortcodeFormat, openValue?: string}>
  ): FormattedValueResult[] => {
    return values.map(({ id, format, openValue }) => 
      formatValue(id, format, openValue)
    );
  }, [formatValue]);

  const clearCache = useCallback(() => {
    shortcodeCache.clear();
    customCodesCache.clear();
    setLoadingStates({});
    setErrors({});
    console.log('🧹 Cache shortcode formatter vidé');
  }, []);

  return {
    formatValue,
    formatMultipleValues,
    clearCache
  };
}

// ==================== FONCTIONS UTILITAIRES ====================

export function useFormattedValue(
  clientId: string,
  shortcodeId: string,
  format: ShortcodeFormat,
  openValue?: string
): FormattedValueResult {
  const { formatValue } = useShortcodeFormatter(clientId);
  return formatValue(shortcodeId, format, openValue);
}

export function clearAllShortcodeFormatCache(): void {
  shortcodeCache.clear();
  customCodesCache.clear();
  console.log('🧹 Cache global shortcode formatter vidé');
}