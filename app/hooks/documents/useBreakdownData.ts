// app/hooks/documents/useBreakdownData.ts
/**
 * AMÉLIORÉ: Hook pour l'extraction et l'aplatissement des données de breakdown avec:
 * - Support des IDs uniques pour les périodes
 * - Distinction entre champs date (automatiques) et name (custom)
 * - Structure de données cohérente avec les améliorations
 * - Tri amélioré par date chronologique pour tous les types
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getOnglets, getSections, getTactiques } from '../../lib/tactiqueService';
import { getBreakdowns } from '../../lib/breakdownService';

interface UseBreakdownDataReturn {
  extractBreakdownData: (clientId: string, campaignId: string, versionId: string) => Promise<string[][] | null>;
  loading: boolean;
  error: string | null;
  data: string[][] | null;
}

interface BreakdownDataRow {
  tactiqueId: string;
  breakdownId: string;
  breakdownName: string;
  breakdownType: string;
  periodId: string;           // NOUVEAU: ID unique
  periodName: string;         // Nom d'affichage (calculé ou custom)
  value: string;
  unitCost: string;    
  total: string;       
  isToggled: boolean;
  order: number;
  breakdownOrder: number;
  periodOrder: number;
  startDate: Date | null;     // NOUVEAU: Date de début calculée selon le type
  customName: string;         // NOUVEAU: Nom custom pour type Custom uniquement
  storedDate: string;         // NOUVEAU: Date stockée pour types automatiques
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
   * AMÉLIORÉ: Calcule la date de début et le nom d'affichage d'une période selon le breakdown
   */
  const calculatePeriodMetadata = useCallback((
    periodId: string,
    periodData: any,
    breakdownInfo: any
  ): { startDate: Date | null; displayName: string; customName: string; storedDate: string } => {
    if (!breakdownInfo) {
      return { 
        startDate: null, 
        displayName: periodId, 
        customName: '',
        storedDate: ''
      };
    }

    try {
      if (breakdownInfo.type === 'Custom') {
        // NOUVEAU: Pour Custom, utiliser le nom stocké
        const customName = periodData.name || '';
        return {
          startDate: null, // Pas de date automatique pour Custom
          displayName: customName || periodId,
          customName: customName,
          storedDate: ''
        };
      } else {
        // NOUVEAU: Pour les types automatiques, utiliser la date stockée
        const storedDate = periodData.date || '';
        let startDate: Date | null = null;
        let displayName = periodId;

        if (storedDate) {
          startDate = new Date(storedDate);
          
          // Générer le nom d'affichage selon le type
          if (breakdownInfo.type === 'Mensuel') {
            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 
                              'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
            const month = monthNames[startDate.getMonth()];
            const year = startDate.getFullYear().toString().slice(-2);
            displayName = `${month} ${year}`;
          } else if (breakdownInfo.type === 'Hebdomadaire' || breakdownInfo.type === 'PEBs') {
            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 
                              'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
            const day = startDate.getDate().toString().padStart(2, '0');
            const month = monthNames[startDate.getMonth()];
            displayName = `${day} ${month}`;
          }
        }

        return {
          startDate,
          displayName,
          customName: '',
          storedDate
        };
      }
    } catch (error) {
      console.warn('Erreur lors du calcul des métadonnées de période:', periodId, error);
      return { 
        startDate: null, 
        displayName: periodId, 
        customName: '',
        storedDate: ''
      };
    }
  }, []);

  /**
   * AMÉLIORÉ: Applatit les données de breakdown avec nouvelle structure
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

        // NOUVEAU: Parcourir chaque période avec ID unique
        Object.entries(breakdownData.periods).forEach(([periodId, periodData]: [string, any]) => {
          // NOUVEAU: Calculer les métadonnées de la période
          const { startDate, displayName, customName, storedDate } = calculatePeriodMetadata(
            periodId, 
            periodData, 
            breakdownInfo
          );

          // Utiliser l'ordre stocké sur Firebase ou calculer un ordre de fallback
          let periodOrder = periodData.order || 0;
          
          // NOUVEAU: Pour les types automatiques, utiliser la date pour l'ordre
          if (startDate && periodOrder === 0) {
            // Convertir la date en nombre pour tri chronologique
            periodOrder = startDate.getTime();
          }

          flattenedData.push({
            tactiqueId: tactique.id,
            breakdownId: breakdownId,
            breakdownName: breakdownName,
            breakdownType: breakdownType,
            periodId: periodId, // NOUVEAU: ID unique
            periodName: displayName, // NOUVEAU: Nom d'affichage calculé
            value: periodData.value || '',
            unitCost: periodData.unitCost || '',
            total: periodData.total || '',
            isToggled: periodData.isToggled !== undefined ? periodData.isToggled : true,
            order: periodData.order || 0,
            breakdownOrder: breakdownOrder,
            periodOrder: periodOrder,
            startDate: startDate, // NOUVEAU: Date calculée
            customName: customName, // NOUVEAU: Nom custom
            storedDate: storedDate // NOUVEAU: Date stockée
          });
        });
      });
    });

    // AMÉLIORÉ: Tri par date chronologique puis par ordre
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
  }, [calculatePeriodMetadata]);

  /**
   * AMÉLIORÉ: Transforme les données aplaties en tableau 2D avec nouvelles colonnes
   */
  const transformToTable = useCallback((flattenedData: BreakdownDataRow[]): string[][] => {
    const table: string[][] = [];
    
    // 1. NOUVEAU: En-têtes avec colonnes améliorées
    const headers = [
      'Tactique ID',
      'Breakdown Name', 
      'Type',
      'Period ID',        // NOUVEAU: ID unique
      'Period Name',      // NOUVEAU: Nom d'affichage
      'Date',            // Date de début (automatiques) ou vide (custom)
      'Custom Name',     // NOUVEAU: Nom custom (Custom uniquement) ou vide
      'Stored Date',     // NOUVEAU: Date stockée en Firebase
      'Order',
      'Value',
      'Unit Cost',   
      'Total',        
      'isToggled'
    ];
    table.push(headers);

    // 2. Ajouter chaque ligne de données
    flattenedData.forEach(row => {
      // Formater la date en string ISO ou vide si null
      const dateString = row.startDate ? row.startDate.toISOString().split('T')[0] : '';

      table.push([
        row.tactiqueId,
        row.breakdownName,
        row.breakdownType,
        row.periodId,               // NOUVEAU: ID unique
        row.periodName,             // NOUVEAU: Nom d'affichage
        dateString,                 // Date de début calculée
        row.customName,             // NOUVEAU: Nom custom
        row.storedDate,             // NOUVEAU: Date stockée
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
   * AMÉLIORÉ: Fonction principale pour extraire et aplatir les données de breakdown
   */
  const extractBreakdownData = useCallback(async (
    clientId: string, 
    campaignId: string, 
    versionId: string
  ): Promise<string[][] | null> => {
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