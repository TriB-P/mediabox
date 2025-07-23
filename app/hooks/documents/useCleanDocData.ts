/**
 * Ce hook gère l'extraction, la transformation et le nettoyage des données
 * de la hiérarchie d'une campagne Firebase (onglets, sections, tactiques, placements, créatifs).
 * Il agrège les données de différentes collections Firebase et les formate
 * en un tableau 2D prêt à être utilisé, par exemple, pour un export.
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getOnglets, getSections, getTactiques } from '../../lib/tactiqueService';
import { getPlacementsForTactique } from '../../lib/placementService';
import { getCreatifsForPlacement } from '../../lib/creatifService';
import { getCampaigns } from '../../lib/campaignService';
import { documentMappingConfig, FieldMapping, SourceLevel } from '../../config/documentMapping';
import type { 
  Onglet, 
  Section, 
  Tactique, 
  Placement, 
  Creatif,
  TaxonomyValues,
  GeneratedTaxonomies 
} from '../../types/tactiques';

interface UseCleanDocDataReturn {
  cleanData: (clientId: string, campaignId: string, versionId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  data: string[][] | null;
}

interface HierarchyData {
  campaign: any;
  onglets: Onglet[];
  sections: { [ongletId: string]: Section[] };
  tactiques: { [sectionId: string]: Tactique[] };
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
}

/**
 * Hook pour nettoyer et structurer les données d'une campagne.
 * @returns {UseCleanDocDataReturn} Un objet contenant la fonction cleanData pour lancer le processus,
 * les états de chargement et d'erreur, et les données nettoyées.
 */
export function useCleanDocData(): UseCleanDocDataReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<string[][] | null>(null);

  /**
   * Récupère toutes les données de la hiérarchie Firebase de manière optimisée.
   * @param {string} clientId L'ID du client.
   * @param {string} campaignId L'ID de la campagne.
   * @param {string} versionId L'ID de la version.
   * @returns {Promise<HierarchyData>} Un objet contenant toutes les données de la hiérarchie.
   */
  const fetchHierarchyData = useCallback(async (
    clientId: string, 
    campaignId: string, 
    versionId: string
  ): Promise<HierarchyData> => {

    const hierarchyData: HierarchyData = {
      campaign: null,
      onglets: [],
      sections: {},
      tactiques: {},
      placements: {},
      creatifs: {}
    };

    try {
      // 1. Récupérer les données de campagne
      console.log("FIREBASE: LECTURE - Fichier: useCleanDocData.ts - Fonction: fetchHierarchyData - Path: campaigns");
      const campaigns = await getCampaigns(clientId);
      hierarchyData.campaign = campaigns.find(c => c.id === campaignId);
      
      if (!hierarchyData.campaign) {
        throw new Error(`Campagne ${campaignId} non trouvée`);
      }
      
      // 2. Récupérer tous les onglets
      console.log("FIREBASE: LECTURE - Fichier: useCleanDocData.ts - Fonction: fetchHierarchyData - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets");
      hierarchyData.onglets = await getOnglets(clientId, campaignId, versionId);

      // 3. Récupérer toutes les sections pour chaque onglet
      for (const onglet of hierarchyData.onglets) {
        console.log("FIREBASE: LECTURE - Fichier: useCleanDocData.ts - Fonction: fetchHierarchyData - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${onglet.id}/sections");
        hierarchyData.sections[onglet.id] = await getSections(
          clientId, campaignId, versionId, onglet.id
        );
      }

      // 4. Récupérer toutes les tactiques pour chaque section
      for (const ongletId in hierarchyData.sections) {
        for (const section of hierarchyData.sections[ongletId]) {
          console.log("FIREBASE: LECTURE - Fichier: useCleanDocData.ts - Fonction: fetchHierarchyData - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${section.id}/tactiques");
          hierarchyData.tactiques[section.id] = await getTactiques(
            clientId, campaignId, versionId, ongletId, section.id
          );
        }
      }

      // 5. Récupérer tous les placements pour chaque tactique
      for (const sectionId in hierarchyData.tactiques) {
        for (const tactique of hierarchyData.tactiques[sectionId]) {
          const ongletId = Object.keys(hierarchyData.sections).find(oId => 
            hierarchyData.sections[oId].some(s => s.id === sectionId)
          );
          
          if (ongletId) {
            console.log("FIREBASE: LECTURE - Fichier: useCleanDocData.ts - Fonction: fetchHierarchyData - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactique.id}/placements");
            hierarchyData.placements[tactique.id] = await getPlacementsForTactique(
              clientId, campaignId, versionId, ongletId, sectionId, tactique.id
            );
          }
        }
      }

      // 6. Récupérer tous les créatifs pour chaque placement
      for (const tactiqueId in hierarchyData.placements) {
        for (const placement of hierarchyData.placements[tactiqueId]) {
          const sectionId = Object.keys(hierarchyData.tactiques).find(sId => 
            hierarchyData.tactiques[sId].some(t => t.id === tactiqueId)
          );
          const ongletId = Object.keys(hierarchyData.sections).find(oId => 
            hierarchyData.sections[oId].some(s => s.id === sectionId)
          );
          
          if (sectionId && ongletId) {
            console.log("FIREBASE: LECTURE - Fichier: useCleanDocData.ts - Fonction: fetchHierarchyData - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placement.id}/creatifs");
            hierarchyData.creatifs[placement.id] = await getCreatifsForPlacement(
              clientId, campaignId, versionId, ongletId, sectionId, tactiqueId, placement.id
            );
          }
        }
      }

      return hierarchyData;

    } catch (err) {
      console.error('❌ Erreur extraction hiérarchie:', err);
      throw err;
    }
  }, []);

  /**
   * Applique le mapping de configuration des documents et transforme les données hiérarchiques en un tableau 2D.
   * @param {HierarchyData} hierarchyData L'objet contenant toutes les données de la hiérarchie.
   * @returns {string[][]} Un tableau de chaînes de caractères représentant les données nettoyées et structurées.
   */
  const transformToTable = useCallback((hierarchyData: HierarchyData): string[][] => {

    const table: string[][] = [];
    
    // 1. Extraire toutes les colonnes uniques de la configuration de mapping
    const allColumns: string[] = [];
    const fieldMappings: Array<{column: string, source: SourceLevel, field: string}> = [];
    
    const sections = [
      documentMappingConfig.identification,
      documentMappingConfig.onglet,
      documentMappingConfig.section,
      documentMappingConfig.tactique,
      documentMappingConfig.placement,
      documentMappingConfig.creatif
    ];
    
    sections.forEach(section => {
      if (section && section.fields) {
        section.fields.forEach(field => {
          if (!allColumns.includes(field.column)) {
            allColumns.push(field.column);
          }
          fieldMappings.push({
            column: field.column,
            source: section.source,
            field: field.field
          });
        });
      }
    });
    
    // 2. Créer les en-têtes du tableau avec les colonnes d'ID parents fixes
    const fixedHeaders = ['Niveau', 'Onglet', 'Section', 'Tactique', 'Placement'];
    const finalHeaders = [...fixedHeaders, ...allColumns.filter(col => col !== 'Niveau')];
    table.push(finalHeaders);

    /**
     * Récupère la valeur d'une colonne spécifique pour un élément donné, en se basant sur la configuration de mapping.
     * @param {string} columnName Le nom de la colonne.
     * @param {string} elementType Le type de l'élément (ex: 'Onglet', 'Section').
     * @param {any} element L'objet de données de l'élément.
     * @param {SourceLevel} sourceLevel Le niveau de source de l'élément (ex: 'onglet', 'section').
     * @returns {string} La valeur de la colonne pour l'élément.
     */
    const getValueForColumn = (columnName: string, elementType: string, element: any, sourceLevel: SourceLevel): string => {
      const columnMappings = fieldMappings.filter(m => m.column === columnName);
      
      for (const mapping of columnMappings) {
        if (mapping.source === sourceLevel) {
          if (mapping.field === 'level_indicator') {
            return elementType;
          } else {
            return element[mapping.field] != null ? String(element[mapping.field]) : 'XXX';
          }
        } else if (mapping.source === 'parent_id' && mapping.field === 'level_indicator') {
          return elementType;
        }
      }
      return '';
    };

    /**
     * Crée une ligne de tableau pour un élément donné, incluant les IDs de ses parents.
     * @param {string} elementType Le type de l'élément (ex: 'Onglet', 'Section').
     * @param {any} element L'objet de données de l'élément.
     * @param {SourceLevel} sourceLevel Le niveau de source de l'élément.
     * @param {{ongletId?: string, sectionId?: string, tactiqueId?: string, placementId?: string}} parentIds Les IDs des éléments parents.
     * @returns {string[]} La ligne de tableau générée.
     */
    const createRow = (
      elementType: string, 
      element: any, 
      sourceLevel: SourceLevel,
      parentIds: {ongletId?: string, sectionId?: string, tactiqueId?: string, placementId?: string}
    ): string[] => {
      const row: string[] = [];
      
      for (const columnName of finalHeaders) {
        let value = '';
        
        if (columnName === 'Niveau') {
          value = elementType;
        } else if (columnName === 'Onglet') {
          if (elementType === 'Onglet') {
            value = element.id;
          } else if (parentIds.ongletId) {
            value = parentIds.ongletId;
          }
        } else if (columnName === 'Section') {
          if (elementType === 'Section') {
            value = element.id;
          } else if (parentIds.sectionId) {
            value = parentIds.sectionId;
          }
        } else if (columnName === 'Tactique') {
          if (elementType === 'Tactique') {
            value = element.id;
          } else if (parentIds.tactiqueId) {
            value = parentIds.tactiqueId;
          }
        } else if (columnName === 'Placement') {
          if (elementType === 'Placement') {
            value = element.id;
          } else if (parentIds.placementId) {
            value = parentIds.placementId;
          }
        } else {
          value = getValueForColumn(columnName, elementType, element, sourceLevel);
        }
        
        row.push(value);
      }
      
      return row;
    };

    // 5. Parcourir toute la hiérarchie et générer les lignes du tableau
    for (const onglet of hierarchyData.onglets) {
      table.push(createRow('Onglet', onglet, 'onglet', {}));
      
      const sections = hierarchyData.sections[onglet.id] || [];
      
      for (const section of sections) {
        table.push(createRow('Section', section, 'section', {
          ongletId: onglet.id
        }));
        
        const tactiques = hierarchyData.tactiques[section.id] || [];
        
        for (const tactique of tactiques) {
          table.push(createRow('Tactique', tactique, 'tactique', {
            ongletId: onglet.id,
            sectionId: section.id
          }));
          
          const placements = hierarchyData.placements[tactique.id] || [];
          
          for (const placement of placements) {
            table.push(createRow('Placement', placement, 'placement', {
              ongletId: onglet.id,
              sectionId: section.id,
              tactiqueId: tactique.id
            }));
            
            const creatifs = hierarchyData.creatifs[placement.id] || [];
            
            for (const creatif of creatifs) {
              table.push(createRow('Créatif', creatif, 'creatif', {
                ongletId: onglet.id,
                sectionId: section.id,
                tactiqueId: tactique.id,
                placementId: placement.id
              }));
            }
          }
        }
      }
    }
    
    return table;
  }, []);

  /**
   * Fonction principale pour lancer le processus de nettoyage et de transformation des données.
   * Elle orchestre la récupération des données de Firebase et leur mise en forme.
   * @param {string} clientId L'ID du client.
   * @param {string} campaignId L'ID de la campagne.
   * @param {string} versionId L'ID de la version.
   * @returns {Promise<void>} Une promesse qui se résout une fois le nettoyage terminé.
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si une erreur survient pendant le processus.
   */
  const cleanData = useCallback(async (
    clientId: string, 
    campaignId: string, 
    versionId: string
  ): Promise<void> => {
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    try {
      setLoading(true);
      setError(null);
      setData(null);

      // 1. Extraire toutes les données de la hiérarchie
      const hierarchyData = await fetchHierarchyData(clientId, campaignId, versionId);

      // 2. Transformer en tableau 2D selon la configuration
      const cleanedTable = transformToTable(hierarchyData);

      // 3. Sauvegarder le résultat
      setData(cleanedTable);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors du nettoyage';
      console.error('❌ Erreur:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, fetchHierarchyData, transformToTable]);

  return {
    cleanData,
    loading,
    error,
    data,
  };
}