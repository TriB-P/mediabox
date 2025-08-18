// app/components/Tactiques/Views/Taxonomy/TactiquesAdvancedTaxonomyView.tsx

/**
 * Vue avancée des taxonomies - Affiche un tableau avec 3 colonnes :
 * 1. Labels hiérarchiques (sections > tactiques > placements > créatifs)
 * 2. Titre du niveau de taxonomie (NA_Name_Level_X_Title)
 * 3. Valeur de taxonomie avec copie 1-clic
 * 
 * Comprend 3 sélecteurs : Type taxonomie / Type de ligne / Niveau
 */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DocumentDuplicateIcon, 
  CheckIcon,
  QuestionMarkCircleIcon,
  TagIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Section, Tactique, Placement, Creatif } from '../../../../types/tactiques';
import { getClientTaxonomies, getTaxonomyById } from '../../../../lib/taxonomyService';
import { Taxonomy } from '../../../../types/taxonomy';
import { useClient } from '../../../../contexts/ClientContext';
import { useTranslation } from '../../../../contexts/LanguageContext';

interface TactiquesAdvancedTaxonomyViewProps {
  sections: Section[];
  tactiques: { [sectionId: string]: Tactique[] };
  placements: { [tactiqueId: string]: Placement[] };
  creatifs: { [placementId: string]: Creatif[] };
}

type TaxonomyType = 'tags' | 'platform' | 'mediaocean';
type LineType = 'all' | 'placements' | 'creatifs';
type TaxonomyLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface TaxonomyRow {
  id: string;
  type: 'section' | 'tactique' | 'placement' | 'creatif';
  label: string;
  level: number;
  sectionId?: string;
  tactiqueId?: string;
  placementId?: string;
  taxonomyValue?: string;
  data: Section | Tactique | Placement | Creatif;
  sectionColor?: string; // Couleur de la section
}

/**
 * Composant principal de la vue taxonomy
 */
export default function TactiquesAdvancedTaxonomyView({
  sections,
  tactiques,
  placements,
  creatifs
}: TactiquesAdvancedTaxonomyViewProps) {
  const { selectedClient } = useClient();
  const { t } = useTranslation();

  // États des sélecteurs
  const [taxonomyType, setTaxonomyType] = useState<TaxonomyType>('tags');
  const [lineType, setLineType] = useState<LineType>('all');
  const [taxonomyLevel, setTaxonomyLevel] = useState<TaxonomyLevel>(1);

  // États des données
  const [clientTaxonomies, setClientTaxonomies] = useState<Taxonomy[]>([]);
  const [loadedTaxonomies, setLoadedTaxonomies] = useState<Map<string, Taxonomy>>(new Map());
  const [loading, setLoading] = useState(false);
  const [copiedCells, setCopiedCells] = useState<Set<string>>(new Set());

  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Charge les taxonomies du client
   */
  useEffect(() => {
    const loadTaxonomies = async () => {
      if (!selectedClient?.clientId) return;
      
      setLoading(true);
      try {
        const taxonomies = await getClientTaxonomies(selectedClient.clientId);
        setClientTaxonomies(taxonomies);
      } catch (error) {
        console.error('Erreur chargement taxonomies:', error);
        setClientTaxonomies([]);
      } finally {
        setLoading(false);
      }
    };

    loadTaxonomies();
  }, [selectedClient?.clientId]);

  /**
   * Récupère le préfixe de champ selon le type de taxonomie et l'entité
   */
  const getFieldPrefix = useCallback((entityType: 'placement' | 'creatif', taxType: TaxonomyType): string => {
    const entityPrefix = entityType === 'placement' ? 'PL_' : 'CR_';
    
    switch (taxType) {
      case 'tags': return `${entityPrefix}Tag_`;
      case 'platform': return `${entityPrefix}Plateforme_`;
      case 'mediaocean': return `${entityPrefix}MO_`;
      default: return '';
    }
  }, []);

  /**
   * Récupère la valeur de taxonomie pour une entité donnée
   */
  const getTaxonomyValue = useCallback((
    entity: Placement | Creatif, 
    entityType: 'placement' | 'creatif'
  ): string => {
    const fieldName = `${getFieldPrefix(entityType, taxonomyType)}${taxonomyLevel}`;
    const value = (entity as any)[fieldName];
    return typeof value === 'string' ? value : '';
  }, [getFieldPrefix, taxonomyType, taxonomyLevel]);

  /**
   * Récupère l'ID de taxonomie assignée à une entité
   */
  const getTaxonomyId = useCallback((entity: Placement | Creatif): string | undefined => {
    const fieldMap = {
      placement: {
        tags: 'PL_Taxonomy_Tags',
        platform: 'PL_Taxonomy_Platform', 
        mediaocean: 'PL_Taxonomy_MediaOcean'
      },
      creatif: {
        tags: 'CR_Taxonomy_Tags',
        platform: 'CR_Taxonomy_Platform',
        mediaocean: 'CR_Taxonomy_MediaOcean'
      }
    };

    const entityType = 'PL_Label' in entity ? 'placement' : 'creatif';
    const fieldName = fieldMap[entityType][taxonomyType];
    return (entity as any)[fieldName];
  }, [taxonomyType]);

  /**
   * Charge une taxonomie spécifique si pas encore chargée
   */
  const loadTaxonomyIfNeeded = useCallback(async (taxonomyId: string): Promise<Taxonomy | null> => {
    if (!selectedClient?.clientId) return null;
    
    if (loadedTaxonomies.has(taxonomyId)) {
      return loadedTaxonomies.get(taxonomyId) || null;
    }

    try {
      const taxonomy = await getTaxonomyById(selectedClient.clientId, taxonomyId);
      if (taxonomy) {
        setLoadedTaxonomies(prev => new Map(prev).set(taxonomyId, taxonomy));
        return taxonomy;
      }
    } catch (error) {
      console.error(`Erreur chargement taxonomie ${taxonomyId}:`, error);
    }
    
    return null;
  }, [selectedClient?.clientId, loadedTaxonomies]);

  /**
   * Récupère le titre du niveau de taxonomie
   */
  const getLevelTitle = useCallback(async (entity: Placement | Creatif): Promise<string> => {
    const taxonomyId = getTaxonomyId(entity);
    if (!taxonomyId) return t('taxonomy.noTaxonomyAssigned');

    const taxonomy = await loadTaxonomyIfNeeded(taxonomyId);
    if (!taxonomy) return t('taxonomy.taxonomyNotFound');

    const titleField = `NA_Name_Level_${taxonomyLevel}_Title` as keyof Taxonomy;
    const title = taxonomy[titleField] as string;
    return title || t('taxonomy.noTitleConfigured');
  }, [getTaxonomyId, loadTaxonomyIfNeeded, taxonomyLevel, t]);

  /**
   * Génère les lignes du tableau selon les filtres sélectionnés
   */
  const tableRows = useMemo((): TaxonomyRow[] => {
    const rows: TaxonomyRow[] = [];

    sections.forEach(section => {
      const sectionTactiques = tactiques[section.id] || [];
      
      // Ajouter la section si mode "all"
      if (lineType === 'all') {
        rows.push({
          id: `section-${section.id}`,
          type: 'section',
          label: section.SECTION_Name,
          level: 0,
          sectionId: section.id,
          data: section,
          sectionColor: section.SECTION_Color
        });
      }

      sectionTactiques.forEach(tactique => {
        const tactiquePlacements = placements[tactique.id] || [];
        
        // Ajouter la tactique si mode "all"
        if (lineType === 'all') {
          rows.push({
            id: `tactique-${tactique.id}`,
            type: 'tactique',
            label: tactique.TC_Label,
            level: 1,
            sectionId: section.id,
            tactiqueId: tactique.id,
            data: tactique,
            sectionColor: section.SECTION_Color
          });
        }

        tactiquePlacements.forEach(placement => {
          const placementCreatifs = creatifs[placement.id] || [];
          
          // Ajouter le placement si mode "all" ou "placements"
          if (lineType === 'all' || lineType === 'placements') {
            const taxonomyValue = getTaxonomyValue(placement, 'placement');
            rows.push({
              id: `placement-${placement.id}`,
              type: 'placement',
              label: placement.PL_Label,
              level: lineType === 'all' ? 2 : 0,
              sectionId: section.id,
              tactiqueId: tactique.id,
              placementId: placement.id,
              taxonomyValue,
              data: placement,
              sectionColor: section.SECTION_Color
            });
          }

          // Ajouter les créatifs si mode "all" ou "creatifs"
          if (lineType === 'all' || lineType === 'creatifs') {
            placementCreatifs.forEach(creatif => {
              const taxonomyValue = getTaxonomyValue(creatif, 'creatif');
              rows.push({
                id: `creatif-${creatif.id}`,
                type: 'creatif',
                label: creatif.CR_Label,
                level: lineType === 'all' ? 3 : 0,
                sectionId: section.id,
                tactiqueId: tactique.id,
                placementId: placement.id,
                taxonomyValue,
                data: creatif,
                sectionColor: section.SECTION_Color
              });
            });
          }
        });
      });
    });

    return rows;
  }, [sections, tactiques, placements, creatifs, lineType, getTaxonomyValue]);

  /**
   * Lignes filtrées par la recherche
   */
  const filteredRows = useMemo((): TaxonomyRow[] => {
    if (!searchTerm.trim()) return tableRows;
    
    const searchLower = searchTerm.toLowerCase();
    return tableRows.filter(row => 
      row.label.toLowerCase().includes(searchLower) ||
      (row.taxonomyValue && row.taxonomyValue.toLowerCase().includes(searchLower))
    );
  }, [tableRows, searchTerm]);

  /**
   * Filtrage des niveaux disponibles selon le type de ligne
   */
  const availableLevels = useMemo((): TaxonomyLevel[] => {
    if (lineType === 'placements') {
      return [1, 2, 3, 4];
    } else if (lineType === 'creatifs') {
      return [5, 6];
    } else {
      return [1, 2, 3, 4, 5, 6];
    }
  }, [lineType]);

  /**
   * Ajuste le niveau si nécessaire quand le type de ligne change
   */
  useEffect(() => {
    if (!availableLevels.includes(taxonomyLevel)) {
      setTaxonomyLevel(availableLevels[0]);
    }
  }, [lineType, taxonomyLevel, availableLevels]);

  /**
   * Copie la valeur dans le presse-papiers
   */
  const handleCopyValue = useCallback(async (rowId: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedCells(prev => new Set(prev).add(rowId));
      
      setTimeout(() => {
        setCopiedCells(prev => {
          const newSet = new Set(prev);
          newSet.delete(rowId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
    }
  }, []);

  /**
   * Rendu d'une cellule de titre avec chargement async
   */
  const TitleCell: React.FC<{ row: TaxonomyRow }> = ({ row }) => {
    const [title, setTitle] = useState<string>(t('common.loading'));
    
    useEffect(() => {
      if (row.type === 'placement' || row.type === 'creatif') {
        getLevelTitle(row.data as Placement | Creatif).then(setTitle);
      } else {
        setTitle('-');
      }
    }, [row]);
    
    return (
      <div className="px-3 py-3 text-sm text-gray-700 break-words">
        {title}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* En-tête avec sélecteurs */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-6">


          <div className="flex-1 grid grid-cols-4 gap-4">
            {/* Sélecteur Type de taxonomie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('taxonomy.taxonomyType')}
              </label>
              <select
                value={taxonomyType}
                onChange={(e) => setTaxonomyType(e.target.value as TaxonomyType)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="tags">{t('taxonomy.types.tags')}</option>
                <option value="platform">{t('taxonomy.types.platform')}</option>
                <option value="mediaocean">{t('taxonomy.types.mediaocean')}</option>
              </select>
            </div>

            {/* Sélecteur Type de ligne */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('taxonomy.lineType')}
              </label>
              <select
                value={lineType}
                onChange={(e) => setLineType(e.target.value as LineType)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">{t('taxonomy.lineTypes.all')}</option>
                <option value="placements">{t('taxonomy.lineTypes.placements')}</option>
                <option value="creatifs">{t('taxonomy.lineTypes.creatifs')}</option>
              </select>
            </div>

            {/* Sélecteur Niveau */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('taxonomy.level')}
              </label>
              <select
                value={taxonomyLevel}
                onChange={(e) => setTaxonomyLevel(parseInt(e.target.value) as TaxonomyLevel)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableLevels.map(level => (
                  <option key={level} value={level}>
                    {t('taxonomy.levelLabel', { level })}
                  </option>
                ))}
              </select>
            </div>

            {/* Champ de recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('taxonomy.search')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('taxonomy.searchPlaceholder')}
                  className="w-full border border-gray-300 rounded-md pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau principal */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: '75vh', maxWidth: '100vw' }}>
          <table className="w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '25%' }}>
                  {t('taxonomy.columns.label')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '25%' }}>
                  {t('taxonomy.columns.levelTitle')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '50%' }}>
                  {t('taxonomy.columns.value')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      <span>{t('common.loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-gray-500">
                    {searchTerm ? t('taxonomy.noSearchResults') : t('taxonomy.noData')}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  // Déterminer la couleur de fond selon le type
                  let bgColor = '';
                  let borderLeft = '';
                  
                  if (row.type === 'section') {
                    bgColor = 'hover:bg-gray-50';
                    borderLeft = `4px solid ${row.sectionColor || '#6366f1'}`;
                  } else if (row.type === 'tactique') {
                    bgColor = 'bg-gray-100 hover:bg-gray-200';
                  } else {
                    bgColor = 'hover:bg-gray-50';
                  }

                  return (
                    <tr 
                      key={row.id} 
                      className={bgColor}
                      style={row.type === 'section' ? { borderLeft } : undefined}
                    >
                      {/* Colonne Label avec chevrons */}
                      <td className="px-3 py-3" style={{ width: '25%' }}>
                        <div 
                          className="flex items-center"
                          style={{ paddingLeft: `${row.level * 15}px` }}
                        >
                          {row.level > 0 && (
                            <ChevronRightIcon className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                          )}
                          
                          <span className={`text-sm break-words ${
                            row.type === 'section' ? 'font-semibold text-gray-900' : 
                            row.type === 'tactique' ? 'font-medium text-gray-800' :
                            'text-gray-700'
                          }`}>
                            {row.label}
                          </span>
                        </div>
                      </td>

                      {/* Colonne Titre du niveau */}
                      <td style={{ width: '25%' }}>
                        <TitleCell row={row} />
                      </td>

                      {/* Colonne Valeur */}
                      <td className="px-3 py-3" style={{ width: '50%' }}>
                        {(row.type === 'placement' || row.type === 'creatif') && row.taxonomyValue ? (
                          <div className="flex items-start justify-between group">
                            <span className="text-sm text-gray-900 mr-2 font-mono break-words flex-1">
                              {row.taxonomyValue}
                            </span>
                            <button
                              onClick={() => handleCopyValue(row.id, row.taxonomyValue!)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-all flex-shrink-0 ml-2"
                              title={t('taxonomy.copyValue')}
                            >
                              {copiedCells.has(row.id) ? (
                                <CheckIcon className="h-4 w-4 text-green-600" />
                              ) : (
                                <DocumentDuplicateIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}