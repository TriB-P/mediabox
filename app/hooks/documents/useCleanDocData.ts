// app/hooks/documents/useCleanDocData.ts

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

export function useCleanDocData(): UseCleanDocDataReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<string[][] | null>(null);

  /**
   * Récupère toutes les données de la hiérarchie de façon optimisée
   */
  const fetchHierarchyData = useCallback(async (
    clientId: string, 
    campaignId: string, 
    versionId: string
  ): Promise<HierarchyData> => {
    console.log('🔍 [CleanDocData] === DÉBUT EXTRACTION HIÉRARCHIE ===');
    console.log('📍 Paramètres:', { clientId, campaignId, versionId });

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
      console.log('🏛️ [CleanDocData] Récupération campagne...');
      const campaigns = await getCampaigns(clientId);
      hierarchyData.campaign = campaigns.find(c => c.id === campaignId);
      
      if (!hierarchyData.campaign) {
        throw new Error(`Campagne ${campaignId} non trouvée`);
      }
      
      console.log('✅ [CleanDocData] Campagne récupérée:', hierarchyData.campaign?.CA_Name || 'Sans nom');

      // 2. Récupérer tous les onglets
      console.log('📂 [CleanDocData] Récupération onglets...');
      hierarchyData.onglets = await getOnglets(clientId, campaignId, versionId);
      console.log('✅ [CleanDocData] Onglets récupérés:', hierarchyData.onglets.length);

      // 3. Récupérer toutes les sections pour chaque onglet
      console.log('📄 [CleanDocData] Récupération sections...');
      for (const onglet of hierarchyData.onglets) {
        hierarchyData.sections[onglet.id] = await getSections(
          clientId, campaignId, versionId, onglet.id
        );
        console.log(`  - Onglet "${onglet.ONGLET_Name}": ${hierarchyData.sections[onglet.id].length} sections`);
      }

      // 4. Récupérer toutes les tactiques pour chaque section
      console.log('🎯 [CleanDocData] Récupération tactiques...');
      for (const ongletId in hierarchyData.sections) {
        for (const section of hierarchyData.sections[ongletId]) {
          hierarchyData.tactiques[section.id] = await getTactiques(
            clientId, campaignId, versionId, ongletId, section.id
          );
          console.log(`  - Section "${section.SECTION_Name}": ${hierarchyData.tactiques[section.id].length} tactiques`);
        }
      }

      // 5. Récupérer tous les placements pour chaque tactique
      console.log('🏢 [CleanDocData] Récupération placements...');
      for (const sectionId in hierarchyData.tactiques) {
        for (const tactique of hierarchyData.tactiques[sectionId]) {
          // Trouver l'ongletId parent pour cette tactique
          const ongletId = Object.keys(hierarchyData.sections).find(oId => 
            hierarchyData.sections[oId].some(s => s.id === sectionId)
          );
          
          if (ongletId) {
            hierarchyData.placements[tactique.id] = await getPlacementsForTactique(
              clientId, campaignId, versionId, ongletId, sectionId, tactique.id
            );
            console.log(`  - Tactique "${tactique.TC_Label}": ${hierarchyData.placements[tactique.id].length} placements`);
          }
        }
      }

      // 6. Récupérer tous les créatifs pour chaque placement
      console.log('🎨 [CleanDocData] Récupération créatifs...');
      let totalCreatifs = 0;
      for (const tactiqueId in hierarchyData.placements) {
        for (const placement of hierarchyData.placements[tactiqueId]) {
          // Trouver les IDs parents pour ce placement
          const sectionId = Object.keys(hierarchyData.tactiques).find(sId => 
            hierarchyData.tactiques[sId].some(t => t.id === tactiqueId)
          );
          const ongletId = Object.keys(hierarchyData.sections).find(oId => 
            hierarchyData.sections[oId].some(s => s.id === sectionId)
          );
          
          if (sectionId && ongletId) {
            hierarchyData.creatifs[placement.id] = await getCreatifsForPlacement(
              clientId, campaignId, versionId, ongletId, sectionId, tactiqueId, placement.id
            );
            totalCreatifs += hierarchyData.creatifs[placement.id].length;
            console.log(`  - Placement "${placement.PL_Label}": ${hierarchyData.creatifs[placement.id].length} créatifs`);
          }
        }
      }

      console.log('🎯 [CleanDocData] RÉSUMÉ EXTRACTION:');
      console.log(`  - ${hierarchyData.onglets.length} onglets`);
      console.log(`  - ${Object.values(hierarchyData.sections).flat().length} sections`);
      console.log(`  - ${Object.values(hierarchyData.tactiques).flat().length} tactiques`);
      console.log(`  - ${Object.values(hierarchyData.placements).flat().length} placements`);
      console.log(`  - ${totalCreatifs} créatifs`);
      console.log('✅ [CleanDocData] === FIN EXTRACTION HIÉRARCHIE ===');

      return hierarchyData;

    } catch (err) {
      console.error('❌ [CleanDocData] Erreur extraction hiérarchie:', err);
      throw err;
    }
  }, []);

  /**
   * Applique le mapping de configuration et transforme en tableau 2D
   */
  const transformToTable = useCallback((hierarchyData: HierarchyData): string[][] => {
    console.log('🔄 [CleanDocData] === DÉBUT TRANSFORMATION TABLEAU ===');

    const table: string[][] = [];
    
    // 1. Extraire toutes les colonnes uniques de façon simple
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
          // Ajouter la colonne si pas déjà présente
          if (!allColumns.includes(field.column)) {
            allColumns.push(field.column);
          }
          
          // Ajouter le mapping
          fieldMappings.push({
            column: field.column,
            source: section.source,
            field: field.field
          });
        });
      }
    });
    
    // 2. Créer les headers avec les colonnes ID parents fixes
    const fixedHeaders = ['Niveau', 'Onglet', 'Section', 'Tactique', 'Placement'];
    const finalHeaders = [...fixedHeaders, ...allColumns.filter(col => col !== 'Niveau')];
    table.push(finalHeaders);
    console.log('📊 [CleanDocData] Headers créés:', finalHeaders.join(', '));

    // 3. Fonction pour obtenir la valeur d'une colonne pour un élément
    const getValueForColumn = (columnName: string, elementType: string, element: any, sourceLevel: SourceLevel): string => {
      // Chercher tous les mappings pour cette colonne
      const columnMappings = fieldMappings.filter(m => m.column === columnName);
      
      for (const mapping of columnMappings) {
        if (mapping.source === sourceLevel) {
          if (mapping.field === 'level_indicator') {
            return elementType;
          } else {
            return element[mapping.field] != null ? String(element[mapping.field]) : 'XXX';
          }
        } else if (mapping.source === 'parent_id' && mapping.field === 'level_indicator') {
          // Cas spécial pour la colonne Niveau
          return elementType;
        }
      }
      
      return ''; // Colonne vide si pas de mapping pour ce niveau
    };

    // 4. Fonction pour créer une ligne avec les IDs parents
    const createRow = (
      elementType: string, 
      element: any, 
      sourceLevel: SourceLevel,
      parentIds: {ongletId?: string, sectionId?: string, tactiqueId?: string, placementId?: string}
    ): string[] => {
      const row: string[] = [];
      
      for (const columnName of finalHeaders) {
        let value = '';
        
        // Gestion des colonnes ID parents fixes
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
          // Colonnes configurées normalement
          value = getValueForColumn(columnName, elementType, element, sourceLevel);
        }
        
        row.push(value);
      }
      
      return row;
    };

    // 5. Parcourir TOUTE la hiérarchie avec les IDs parents
    let rowCount = 0;
    
    for (const onglet of hierarchyData.onglets) {
      // Ligne pour l'onglet
      table.push(createRow('Onglet', onglet, 'onglet', {}));
      rowCount++;
      
      const sections = hierarchyData.sections[onglet.id] || [];
      
      for (const section of sections) {
        // Ligne pour la section
        table.push(createRow('Section', section, 'section', {
          ongletId: onglet.id
        }));
        rowCount++;
        
        const tactiques = hierarchyData.tactiques[section.id] || [];
        
        for (const tactique of tactiques) {
          // Ligne pour la tactique
          table.push(createRow('Tactique', tactique, 'tactique', {
            ongletId: onglet.id,
            sectionId: section.id
          }));
          rowCount++;
          
          const placements = hierarchyData.placements[tactique.id] || [];
          
          for (const placement of placements) {
            // Ligne pour le placement
            table.push(createRow('Placement', placement, 'placement', {
              ongletId: onglet.id,
              sectionId: section.id,
              tactiqueId: tactique.id
            }));
            rowCount++;
            
            const creatifs = hierarchyData.creatifs[placement.id] || [];
            
            for (const creatif of creatifs) {
              // Ligne pour le créatif
              table.push(createRow('Créatif', creatif, 'creatif', {
                ongletId: onglet.id,
                sectionId: section.id,
                tactiqueId: tactique.id,
                placementId: placement.id
              }));
              rowCount++;
            }
          }
        }
      }
    }

    console.log(`✅ [CleanDocData] Tableau créé: ${rowCount} lignes de données + 1 header`);
    console.log('🔄 [CleanDocData] === FIN TRANSFORMATION TABLEAU ===');
    
    return table;
  }, []);

  /**
   * Fonction principale de nettoyage des données
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

      console.log('🧹 [CleanDocData] === DÉBUT NETTOYAGE DONNÉES ===');
      console.log('📍 Paramètres:', { clientId, campaignId, versionId });

      // 1. Extraire toutes les données de la hiérarchie
      const hierarchyData = await fetchHierarchyData(clientId, campaignId, versionId);

      // 2. Transformer en tableau 2D selon la configuration
      const cleanedTable = transformToTable(hierarchyData);

      // 3. Sauvegarder le résultat
      setData(cleanedTable);

      console.log('✅ [CleanDocData] === NETTOYAGE TERMINÉ AVEC SUCCÈS ===');
      console.log(`📊 Résultat: ${cleanedTable.length - 1} lignes de données`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors du nettoyage';
      console.error('❌ [CleanDocData] Erreur:', errorMessage);
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