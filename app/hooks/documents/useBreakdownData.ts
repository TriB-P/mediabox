// app/hooks/documents/useBreakdownData.ts
/**
 * MODIFIÉ: Hook pour l'extraction et l'aplatissement des données de breakdown avec:
 * - Support des IDs uniques pour les périodes
 * - Distinction entre champs date (automatiques) et name (custom)
 * - Structure de données cohérente avec les améliorations
 * - Tri amélioré par date chronologique pour tous les types
 * - Support de la langue pour traduction des noms de breakdown
 * - Suppression de Period ID
 * - Séparation de Value en Value_text et Value_number avec forçage de format
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getOnglets, getSections, getTactiques } from '../../lib/tactiqueService';
import { getBreakdowns } from '../../lib/breakdownService';

interface UseBreakdownDataReturn {
  extractBreakdownData: (clientId: string, campaignId: string, versionId: string, language?: 'FR' | 'EN') => Promise<string[][] | null>;
  loading: boolean;
  error: string | null;
  data: string[][] | null;
}

interface BreakdownDataRow {
  tactiqueId: string;
  breakdownId: string;
  breakdownName: string;
  breakdownType: string;
  valueText: string;          // NOUVEAU: Valeur forcée en texte
  valueNumber: number | null; // NOUVEAU: Valeur forcée en nombre
  unitCost: string;    
  total: string;       
  isToggled: boolean;
  order: number;
  breakdownOrder: number;
  periodOrder: number;
  startDate: Date | null;     // Date de début calculée selon le type (pour tri seulement)
  customName: string;         // Nom custom pour type Custom uniquement
  storedDate: string;         // Date stockée pour types automatiques
}

/**
 * Hook pour extraire et aplatir les données de breakdown des tactiques.
 */
export function useBreakdownData(): UseBreakdownDataReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<string[][] | null>(null);

  /**
   * Récupère toutes les tactiques de la campagne avec leurs données de breakdown.
   */
  const fetchAllTactiques = useCallback(async (
    clientId: string, 
    campaignId: string, 
    versionId: string
  ): Promise<any[]> => {
    const allTactiques: any[] = [];

    try {
      // 1. Récupérer tous les onglets
      console.log("FIREBASE: LECTURE - Fichier: useBreakdownData.ts - Fonction: fetchAllTactiques - Path: onglets");
      const onglets = await getOnglets(clientId, campaignId, versionId);

      // 2. Pour chaque onglet, récupérer toutes les sections
      for (const onglet of onglets) {
        console.log("FIREBASE: LECTURE - Fichier: useBreakdownData.ts - Fonction: fetchAllTactiques - Path: sections");
        const sections = await getSections(clientId, campaignId, versionId, onglet.id);

        // 3. Pour chaque section, récupérer toutes les tactiques
        for (const section of sections) {
          console.log("FIREBASE: LECTURE - Fichier: useBreakdownData.ts - Fonction: fetchAllTactiques - Path: tactiques");
          const tactiques = await getTactiques(clientId, campaignId, versionId, onglet.id, section.id);
          
          allTactiques.push(...tactiques);
        }
      }

      return allTactiques;

    } catch (err) {
      console.error('❌ Erreur extraction tactiques:', err);
      throw err;
    }
  }, []);

  /**
   * Récupère les informations des breakdowns de la campagne pour enrichir les données.
   */
  const fetchBreakdownsInfo = useCallback(async (
    clientId: string, 
    campaignId: string
  ): Promise<{[key: string]: any}> => {
    try {
      console.log("FIREBASE: LECTURE - Fichier: useBreakdownData.ts - Fonction: fetchBreakdownsInfo - Path: breakdowns");
      const breakdowns = await getBreakdowns(clientId, campaignId);
      
      const breakdownsMap: {[key: string]: any} = {};
      breakdowns.forEach(breakdown => {
        breakdownsMap[breakdown.id] = breakdown;
      });

      return breakdownsMap;

    } catch (err) {
      console.error('❌ Erreur récupération breakdowns:', err);
      throw err;
    }
  }, []);

  /**
   * NOUVEAU: Traduit le nom du breakdown selon la langue spécifiée
   */
  const translateBreakdownName = useCallback((
    breakdownName: string,
    language: 'FR' | 'EN' = 'FR'
  ): string => {
    if (language === 'EN' && breakdownName === 'Calendrier') {
      return 'Calendar';
    }
    return breakdownName;
  }, []);

  /**
   * MODIFIÉ: Force une valeur vers le format texte et numérique.
   * Si la valeur est un nombre entier, elle n'aura pas de décimales.
   * @param {any} value - La valeur à forcer
   * @returns {{text: string, number: number | null}} Valeurs forcées
   */
  const forceValueFormats = useCallback((value: any): { text: string; number: number | null } => {
    // Si la valeur est null, undefined ou une chaîne vide, on retourne des valeurs vides
    if (value === null || value === undefined || value === '') {
      return { text: '', number: null };
    }
  
    let numericValue: number | null = null;
    let textValue: string = '';

    // Si la valeur est déjà un nombre valide
    if (typeof value === 'number' && isFinite(value)) {
      numericValue = value;
    } else if (typeof value === 'string') {
      const trimmedValue = value.trim();
  
      if (trimmedValue === '') {
        return { text: '', number: null };
      }
      
      const parsedValue = Number(trimmedValue);
      if (!isNaN(parsedValue) && isFinite(parsedValue)) {
        numericValue = parsedValue;
      } else {
        // La chaîne n'est pas un nombre, on la retourne telle quelle
        return {
          text: String(value),
          number: null,
        };
      }
    } else {
      // Si le type n'est ni nombre ni string, on le retourne tel quel
      return {
        text: String(value),
        number: null,
      };
    }
    
    // Si on a une valeur numérique valide
    if (numericValue !== null) {
      // Vérifie si le nombre est un entier
      if (numericValue % 1 === 0) {
        // C'est un entier, pas de décimales
        textValue = `'${numericValue}`;
      } else {
        // Le nombre a des décimales, on le formate en 2 décimales
        textValue = `'${numericValue.toFixed(2)}`;
      }

      return {
        text: textValue,
        number: numericValue,
      };
    }

    // Cas de secours, ne devrait pas être atteint
    return {
      text: String(value),
      number: null,
    };
  }, []);

  /**
   * Calcule la date de début d'une période selon le breakdown (pour tri uniquement)
   */
  const calculatePeriodMetadata = useCallback((
    periodId: string,
    periodData: any,
    breakdownInfo: any
  ): { startDate: Date | null; customName: string; storedDate: string } => {
    if (!breakdownInfo) {
      return { 
        startDate: null, 
        customName: '',
        storedDate: ''
      };
    }

    try {
      if (breakdownInfo.type === 'Custom') {
        // Pour Custom, utiliser le nom stocké
        const customName = periodData.name || '';
        return {
          startDate: null, // Pas de date automatique pour Custom
          customName: customName,
          storedDate: ''
        };
      } else {
        // Pour les types automatiques, utiliser la date stockée
        const storedDate = periodData.date || '';
        let startDate: Date | null = null;

        if (storedDate) {
          startDate = new Date(storedDate);
        }

        return {
          startDate,
          customName: '',
          storedDate
        };
      }
    } catch (error) {
      console.warn('Erreur lors du calcul des métadonnées de période:', periodId, error);
      return { 
        startDate: null, 
        customName: '',
        storedDate: ''
      };
    }
  }, []);

  /**
   * MODIFIÉ: Applatit les données de breakdown avec traduction et colonnes simplifiées
   */
  const flattenBreakdownData = useCallback((
    tactiques: any[], 
    breakdownsInfo: {[key: string]: any},
    language: 'FR' | 'EN' = 'FR'
  ): BreakdownDataRow[] => {
    const flattenedData: BreakdownDataRow[] = [];

    tactiques.forEach(tactique => {
      // Ignorer les tactiques qui n'ont pas de données de breakdown
      if (!tactique.breakdowns || typeof tactique.breakdowns !== 'object') {
        return;
      }

      // Parcourir chaque breakdown de la tactique
      Object.entries(tactique.breakdowns).forEach(([breakdownId, breakdownData]: [string, any]) => {
        // Récupérer les infos du breakdown depuis la campagne
        const breakdownInfo = breakdownsInfo[breakdownId];
        const originalBreakdownName = breakdownInfo?.name || 'Breakdown inconnu';
        // NOUVEAU: Appliquer la traduction
        const breakdownName = translateBreakdownName(originalBreakdownName, language);
        const breakdownType = breakdownInfo?.type || 'Type inconnu';
        const breakdownOrder = breakdownInfo?.order || 0;

        // Ignorer si pas de périodes
        if (!breakdownData.periods || typeof breakdownData.periods !== 'object') {
          return;
        }

        // Parcourir chaque période avec ID unique
        Object.entries(breakdownData.periods).forEach(([periodId, periodData]: [string, any]) => {
          // Calculer les métadonnées de la période
          const { startDate, customName, storedDate } = calculatePeriodMetadata(
            periodId, 
            periodData, 
            breakdownInfo
          );

          // NOUVEAU: Forcer les formats de valeur
          const { text: valueText, number: valueNumber } = forceValueFormats(periodData.value);

          // Utiliser l'ordre stocké sur Firebase ou calculer un ordre de fallback
          let periodOrder = periodData.order || 0;
          
          // Pour les types automatiques, utiliser la date pour l'ordre
          if (startDate && periodOrder === 0) {
            // Convertir la date en nombre pour tri chronologique
            periodOrder = startDate.getTime();
          }

          flattenedData.push({
            tactiqueId: tactique.id,
            breakdownId: breakdownId,
            breakdownName: breakdownName, // Nom traduit
            breakdownType: breakdownType,
            valueText: valueText,         // NOUVEAU: Valeur en texte
            valueNumber: valueNumber,     // NOUVEAU: Valeur en nombre
            unitCost: periodData.unitCost || '',
            total: periodData.total || '',
            isToggled: periodData.isToggled !== undefined ? periodData.isToggled : true,
            order: periodData.order || 0,
            breakdownOrder: breakdownOrder,
            periodOrder: periodOrder,
            startDate: startDate, // Utilisé uniquement pour le tri
            customName: customName,
            storedDate: storedDate
          });
        });
      });
    });

    // Tri par date chronologique puis par ordre
    flattenedData.sort((a, b) => {
      // 1. Tri primaire : date chronologique (null à la fin)
      if (a.startDate && b.startDate) {
        // Les deux ont des dates : tri chronologique
        const dateComparison = a.startDate.getTime() - b.startDate.getTime();
        if (dateComparison !== 0) {
          return dateComparison;
        }
      } else if (a.startDate && !b.startDate) {
        // A a une date, B n'en a pas : A avant B
        return -1;
      } else if (!a.startDate && b.startDate) {
        // A n'a pas de date, B en a une : B avant A
        return 1;
      }
      
      // 2. Tri secondaire : breakdown puis order
      const breakdownComparison = a.breakdownOrder - b.breakdownOrder;
      if (breakdownComparison !== 0) {
        return breakdownComparison;
      }
      
      return a.order - b.order;
    });

    return flattenedData;
  }, [calculatePeriodMetadata, translateBreakdownName, forceValueFormats]);

  /**
   * MODIFIÉ: Transforme les données aplaties en tableau 2D avec nouvelles colonnes
   */
  const transformToTable = useCallback((flattenedData: BreakdownDataRow[]): string[][] => {
    const table: string[][] = [];
    
    // 1. MODIFIÉ: En-têtes avec nouvelles colonnes (suppression Period ID, ajout Value_text/Value_number)
    const headers = [
      'Tactique ID',
      'Breakdown Name', 
      'Type',
      'Value_text',       // NOUVEAU: Valeur forcée en texte
      'Value_number',     // NOUVEAU: Valeur forcée en nombre
      'Custom Name',      // Nom custom (Custom uniquement) ou vide
      'Stored Date',      // Date stockée en Firebase
      'Order',
      'Unit Cost',   
      'Total',        
      'isToggled'
    ];
    table.push(headers);

    // 2. Ajouter chaque ligne de données
    flattenedData.forEach(row => {
      table.push([
        row.tactiqueId,
        row.breakdownName,
        row.breakdownType,
        row.valueText,              // Valeur forcée en texte
        row.valueNumber !== null ? row.valueNumber.toString() : '', // Valeur en nombre convertie en string (ou vide si null)
        row.customName,             // Nom custom
        row.storedDate,             // Date stockée
        row.order.toString(),
        row.unitCost,       
        row.total,   
        row.isToggled.toString()
      ]);
    });

    return table;
  }, []);

  /**
   * MODIFIÉ: Fonction principale pour extraire et aplatir les données de breakdown avec support de la langue
   */
  const extractBreakdownData = useCallback(async (
    clientId: string, 
    campaignId: string, 
    versionId: string,
    language: 'FR' | 'EN' = 'FR'
  ): Promise<string[][] | null> => {
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    try {
      setLoading(true);
      setError(null);
      setData(null);

      console.log(`[BREAKDOWN] Extraction avec langue: ${language} - Nouvelles colonnes: Value_text, Value_number`);

      // 1. Récupérer toutes les tactiques avec leurs breakdowns
      const tactiques = await fetchAllTactiques(clientId, campaignId, versionId);

      // 2. Récupérer les informations des breakdowns de la campagne
      const breakdownsInfo = await fetchBreakdownsInfo(clientId, campaignId);

      // 3. Aplatir les données de breakdown avec traduction
      const flattenedData = flattenBreakdownData(tactiques, breakdownsInfo, language);

      // 4. Transformer en tableau 2D
      const table = transformToTable(flattenedData);

      // 5. Sauvegarder le résultat
      setData(table);
      return table;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'extraction des breakdowns';
      console.error('❌ Erreur:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchAllTactiques, fetchBreakdownsInfo, flattenBreakdownData, transformToTable]);

  return {
    extractBreakdownData,
    loading,
    error,
    data,
  };
}