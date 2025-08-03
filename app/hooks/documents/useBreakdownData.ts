// app/hooks/documents/useBreakdownData.ts
/**
 * Ce hook gère l'extraction et l'aplatissement des données de breakdown
 * depuis les tactiques d'une campagne Firebase. Il transforme la structure
 * complexe des breakdowns stockés sur chaque tactique en un tableau 2D
 * simple où chaque ligne représente une période d'un breakdown.
 * NOUVEAU: Support de la colonne "Date" avec les dates de début des périodes
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getOnglets, getSections, getTactiques } from '../../lib/tactiqueService';
import { getBreakdowns } from '../../lib/breakdownService';

interface UseBreakdownDataReturn {
  extractBreakdownData: (clientId: string, campaignId: string, versionId: string) => Promise<string[][] | null>; // Modifié ici
  loading: boolean;
  error: string | null;
  data: string[][] | null;
}

interface BreakdownDataRow {
  tactiqueId: string;
  breakdownId: string;
  breakdownName: string;
  breakdownType: string;
  periodId: string;
  periodName: string;
  value: string;
  unitCost: string;    
  total: string;       
  isToggled: boolean;
  order: number;
  breakdownOrder: number;
  periodOrder: number;
  startDate: Date | null; // NOUVEAU: Date de début de la période
}

/**
 * Hook pour extraire et aplatir les données de breakdown des tactiques.
 * @returns {UseBreakdownDataReturn} Un objet contenant la fonction extractBreakdownData,
 * les états de chargement et d'erreur, et les données aplaties.
 */
export function useBreakdownData(): UseBreakdownDataReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<string[][] | null>(null);

  /**
   * Récupère toutes les tactiques de la campagne avec leurs données de breakdown.
   * @param {string} clientId L'ID du client.
   * @param {string} campaignId L'ID de la campagne.
   * @param {string} versionId L'ID de la version.
   * @returns {Promise<any[]>} Un tableau de toutes les tactiques avec leurs breakdowns.
   */
  const fetchAllTactiques = useCallback(async (
    clientId: string, 
    campaignId: string, 
    versionId: string
  ): Promise<any[]> => {
    const allTactiques: any[] = [];

    try {
      // 1. Récupérer tous les onglets
      console.log("FIREBASE: LECTURE - Fichier: useBreakdownData.ts - Fonction: fetchAllTactiques - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets");
      const onglets = await getOnglets(clientId, campaignId, versionId);

      // 2. Pour chaque onglet, récupérer toutes les sections
      for (const onglet of onglets) {
        console.log("FIREBASE: LECTURE - Fichier: useBreakdownData.ts - Fonction: fetchAllTactiques - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${onglet.id}/sections");
        const sections = await getSections(clientId, campaignId, versionId, onglet.id);

        // 3. Pour chaque section, récupérer toutes les tactiques
        for (const section of sections) {
          console.log("FIREBASE: LECTURE - Fichier: useBreakdownData.ts - Fonction: fetchAllTactiques - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${onglet.id}/sections/${section.id}/tactiques");
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
   * @param {string} clientId L'ID du client.
   * @param {string} campaignId L'ID de la campagne.
   * @returns {Promise<{[key: string]: any}>} Un objet mappant les IDs de breakdown à leurs informations.
   */
  const fetchBreakdownsInfo = useCallback(async (
    clientId: string, 
    campaignId: string
  ): Promise<{[key: string]: any}> => {
    try {
      console.log("FIREBASE: LECTURE - Fichier: useBreakdownData.ts - Fonction: fetchBreakdownsInfo - Path: clients/${clientId}/campaigns/${campaignId}/breakdowns");
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
   * NOUVEAU: Calcule la date de début d'une période selon le type de breakdown et l'ID de période.
   * @param {string} periodId L'ID de la période
   * @param {any} breakdownInfo Les informations du breakdown
   * @returns {Date | null} La date de début ou null si ne peut pas être calculée
   */
  const calculatePeriodStartDate = useCallback((
    periodId: string,
    breakdownInfo: any
  ): Date | null => {
    if (!breakdownInfo) return null;

    try {
      if (breakdownInfo.type === 'Custom' && breakdownInfo.customPeriods) {
        // Pour les breakdowns Custom, chercher la date stockée dans customPeriods
        const customPeriod = breakdownInfo.customPeriods.find((p: any) => p.id === periodId);
        if (customPeriod && customPeriod.startDate) {
          return new Date(customPeriod.startDate);
        }
        return null; // Pas de date pour les Custom sans date stockée
      } else if (breakdownInfo.type === 'Mensuel') {
        // Pour les breakdowns mensuels, extraire année/mois de l'ID
        const match = periodId.match(/^(\d{4})_(\d{2})$/);
        if (match) {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]);
          return new Date(year, month - 1, 1); // 1er du mois
        }
      } else if (breakdownInfo.type === 'Hebdomadaire' || breakdownInfo.type === 'PEBs') {
        // Pour les breakdowns hebdomadaires/PEBs, extraire la date de l'ID
        const match = periodId.match(/^week_(\d{4})_(\d{2})_(\d{2})$/);
        if (match) {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]);
          const day = parseInt(match[3]);
          return new Date(year, month - 1, day);
        }
      }
    } catch (error) {
      console.warn('Erreur lors du calcul de la date de début pour la période:', periodId, error);
    }

    return null;
  }, []);

  /**
   * Applatit les données de breakdown des tactiques en un tableau 2D.
   * @param {any[]} tactiques Un tableau de tactiques avec leurs données de breakdown.
   * @param {{[key: string]: any}} breakdownsInfo Les informations des breakdowns de la campagne.
   * @returns {BreakdownDataRow[]} Un tableau de lignes de données aplaties.
   */
  const flattenBreakdownData = useCallback((
    tactiques: any[], 
    breakdownsInfo: {[key: string]: any}
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
        const breakdownName = breakdownInfo?.name || 'Breakdown inconnu';
        const breakdownType = breakdownInfo?.type || 'Type inconnu';
        const breakdownOrder = breakdownInfo?.order || 0;

        // Ignorer si pas de périodes
        if (!breakdownData.periods || typeof breakdownData.periods !== 'object') {
          return;
        }

        // Parcourir chaque période du breakdown et ajouter l'ordre des périodes
        Object.entries(breakdownData.periods).forEach(([periodId, periodData]: [string, any]) => {
          // NOUVEAU: Utiliser l'ordre stocké sur Firebase ou calculer un ordre de fallback
          let periodOrder = periodData.order || 0;
          
          // Si pas d'ordre stocké, utiliser la logique de fallback pour compatibilité
          if (periodOrder === 0) {
            if (breakdownInfo?.type === 'Custom' && breakdownInfo?.customPeriods) {
              // Pour les breakdowns personnalisés, utiliser l'ordre des customPeriods
              const customPeriod = breakdownInfo.customPeriods.find((p: any) => p.id === periodId);
              periodOrder = customPeriod ? customPeriod.order : 0;
            } else if (breakdownInfo?.type === 'Mensuel') {
              // Pour les breakdowns mensuels, extraire l'année/mois de l'ID pour trier chronologiquement
              const match = periodId.match(/^(\d{4})_(\d{2})$/);
              if (match) {
                const year = parseInt(match[1]);
                const month = parseInt(match[2]);
                periodOrder = year * 100 + month; // Format YYYYMM pour tri chronologique
              }
            } else if (breakdownInfo?.type === 'Hebdomadaire') {
              // Pour les breakdowns hebdomadaires, extraire la date de début de semaine
              const match = periodId.match(/^week_(\d{4})_(\d{2})_(\d{2})$/);
              if (match) {
                const year = parseInt(match[1]);
                const month = parseInt(match[2]);
                const day = parseInt(match[3]);
                periodOrder = year * 10000 + month * 100 + day; // Format YYYYMMDD pour tri chronologique
              }
            }
          }

          // NOUVEAU: Calculer la date de début de la période
          const startDate = calculatePeriodStartDate(periodId, breakdownInfo);

          flattenedData.push({
            tactiqueId: tactique.id,
            breakdownId: breakdownId,
            breakdownName: breakdownName,
            breakdownType: breakdownType,
            periodId: periodId,
            periodName: periodData.name || periodId,
            value: periodData.value || '',
            unitCost: periodData.unitCost || '',     // NOUVEAU: Extraire unitCost
            total: periodData.total || '',           // NOUVEAU: Extraire total
            isToggled: periodData.isToggled !== undefined ? periodData.isToggled : true,
            order: periodData.order || 0,
            breakdownOrder: breakdownOrder,
            periodOrder: periodOrder,
            startDate: startDate // NOUVEAU: Date de début de la période
          });
        });
      });
    });

    // NOUVEAU: Trier les données par breakdown name puis par ordre de période stocké sur Firebase
    flattenedData.sort((a, b) => {
      // D'abord par nom de breakdown (alphabétique)
      const nameComparison = a.breakdownName.localeCompare(b.breakdownName);
      if (nameComparison !== 0) {
        return nameComparison;
      }
      
      // Puis par ordre de breakdown (pour les breakdowns avec le même nom)
      const orderComparison = a.breakdownOrder - b.breakdownOrder;
      if (orderComparison !== 0) {
        return orderComparison;
      }
      
      // Finalement par ordre de période stockée sur Firebase (priorité) ou calcul de fallback
      const aPeriodOrder = a.order > 0 ? a.order : a.periodOrder;
      const bPeriodOrder = b.order > 0 ? b.order : b.periodOrder;
      return aPeriodOrder - bPeriodOrder;
    });

    return flattenedData;
  }, [calculatePeriodStartDate]);

  /**
   * Transforme les données aplaties en un tableau 2D avec en-têtes.
   * NOUVEAU: Inclut la colonne "Date" dans l'output
   * @param {BreakdownDataRow[]} flattenedData Les données aplaties.
   * @returns {string[][]} Un tableau 2D prêt pour l'affichage ou l'export.
   */
  const transformToTable = useCallback((flattenedData: BreakdownDataRow[]): string[][] => {
    const table: string[][] = [];
    
    // 1. Créer les en-têtes avec la nouvelle colonne Date
    const headers = [
      'Tactique ID',
      'Breakdown Name', 
      'Type',
      'Period Name',
      'Date', // NOUVEAU: Colonne Date
      'Order',
      'Value',
      'Unit Cost',   
      'Total',        
      'isToggled'
    ];
    table.push(headers);

    // 2. Ajouter chaque ligne de données (déjà triées dans flattenBreakdownData)
    flattenedData.forEach(row => {
      // NOUVEAU: Formater la date en string ISO ou vide si null
      const dateString = row.startDate ? row.startDate.toISOString().split('T')[0] : '';

      table.push([
        row.tactiqueId,
        row.breakdownName,
        row.breakdownType,
        row.periodName,
        dateString, // NOUVEAU: Date formatée
        row.order.toString(),
        row.value,
        row.unitCost,       
        row.total,   
        row.isToggled.toString()
      ]);
    });

    return table;
  }, []);

  /**
   * Fonction principale pour extraire et aplatir les données de breakdown.
   * Elle orchestre la récupération des tactiques, des informations de breakdown,
   * et leur transformation en tableau 2D.
   * @param {string} clientId L'ID du client.
   * @param {string} campaignId L'ID de la campagne.
   * @param {string} versionId L'ID de la version.
   * @returns {Promise<string[][] | null>} Une promesse qui se résout avec le tableau de données, ou null en cas d'erreur. // Modifié ici
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si une erreur survient.
   */
  const extractBreakdownData = useCallback(async (
    clientId: string, 
    campaignId: string, 
    versionId: string
  ): Promise<string[][] | null> => { // Modifié ici
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    try {
      setLoading(true);
      setError(null);
      setData(null);

      // 1. Récupérer toutes les tactiques avec leurs breakdowns
      const tactiques = await fetchAllTactiques(clientId, campaignId, versionId);

      // 2. Récupérer les informations des breakdowns de la campagne
      const breakdownsInfo = await fetchBreakdownsInfo(clientId, campaignId);

      // 3. Aplatir les données de breakdown
      const flattenedData = flattenBreakdownData(tactiques, breakdownsInfo);

      // 4. Transformer en tableau 2D
      const table = transformToTable(flattenedData);

      // 5. Sauvegarder le résultat (pour le hook local)
      setData(table);
      return table; // Retourne les données extraites
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'extraction des breakdowns';
      console.error('❌ Erreur:', errorMessage);
      setError(errorMessage);
      return null; // Retourne null en cas d'erreur
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