/**
 * Ce composant affiche un menu contextuel pour la gestion des taxonomies (tags, plateforme, MediaOcean)
 * d'un élément (Placement ou Creatif). Il permet de visualiser les différents niveaux de taxonomie
 * configurés et de copier la valeur finale de chaque niveau dans le presse-papiers.
 * Il inclut également une fonctionnalité de rafraîchissement des données de l'élément pour s'assurer
 * que les valeurs affichées sont toujours à jour.
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, CheckIcon, DocumentDuplicateIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getTaxonomyById } from '../../../../lib/taxonomyService';
import { generateFinalTaxonomyString } from '../../../../lib/taxonomyParser';
import { Taxonomy } from '../../../../types/taxonomy';
import { Placement, Creatif, TaxonomyValues, TaxonomyFormat } from '../../../../types/tactiques';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

interface TaxonomyContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  item: Placement | Creatif;
  itemType: 'placement' | 'creatif';
  taxonomyType: 'tags' | 'platform' | 'mediaocean';
  clientId: string;
  campaignId?: string;
  versionId?: string;
  ongletId?: string;
  sectionId?: string;
  tactiqueId?: string;
  placementId?: string;
}

interface TaxonomyLevel {
  level: number;
  title: string;
  structure: string;
}

interface LoadedTaxonomy {
  taxonomy?: Taxonomy;
  fieldPrefix?: string;
}

/**
 * Composant principal du menu contextuel de taxonomie.
 * @param {TaxonomyContextMenuProps} props - Les props du composant.
 * @returns {React.FC} Le composant de menu contextuel.
 */
const TaxonomyContextMenu: React.FC<TaxonomyContextMenuProps> = ({
  isOpen,
  onClose,
  position,
  item,
  itemType,
  taxonomyType,
  clientId,
  campaignId,
  versionId,
  ongletId,
  sectionId,
  tactiqueId,
  placementId
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [loadedTaxonomy, setLoadedTaxonomy] = useState<LoadedTaxonomy>({});
  const [loading, setLoading] = useState(false);
  const [availableLevels, setAvailableLevels] = useState<TaxonomyLevel[]>([]);
  const [copiedLevel, setCopiedLevel] = useState<string | null>(null);
  const [freshItem, setFreshItem] = useState<Placement | Creatif>(item);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Effet de chargement initial de la taxonomie et de rafraîchissement automatique des données de l'item.
   * Déclenche le chargement de la taxonomie et un rafraîchissement des données de l'item
   * lorsque le menu s'ouvre ou que les props `item`, `taxonomyType` ou `clientId` changent.
   * @returns {void | (() => void)} Une fonction de nettoyage pour annuler le timer si le composant est démonté.
   */
  useEffect(() => {
    if (isOpen && item) {
      setFreshItem(item);
      loadTaxonomy();
      
      const autoRefreshTimer = setTimeout(() => {
        refreshItemData();
      }, 100);
      
      return () => clearTimeout(autoRefreshTimer);
    }
  }, [isOpen, item, taxonomyType, clientId]);

  /**
   * Effet pour détecter les clics en dehors du menu et le fermer.
   * Ajoute un écouteur d'événements 'mousedown' sur le document lorsque le menu est ouvert,
   * et le retire lorsque le menu est fermé ou le composant démonté.
   * @returns {void | (() => void)} Une fonction de nettoyage pour retirer l'écouteur d'événements.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  /**
   * Rafraîchit les données de l'élément (placement ou créatif) depuis Firebase.
   * Met à jour l'état `freshItem` avec les données les plus récentes et
   * régénère les niveaux de taxonomie disponibles.
   * @returns {Promise<void>} Une promesse qui se résout une fois les données rafraîchies.
   */
  const refreshItemData = async () => {
    if (!campaignId || !versionId || !ongletId || !sectionId || !tactiqueId) {
      console.warn('IDs manquants pour le refresh');
      return;
    }

    setRefreshing(true);
    try {
      let freshData: any = null;

      if (itemType === 'placement') {
        console.log("FIREBASE: LECTURE - Fichier: TaxonomyContextMenu.tsx - Fonction: refreshItemData - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${item.id}");
        const placementRef = doc(
          db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId,
          'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId,
          'placements', item.id
        );
        const placementSnap = await getDoc(placementRef);
        if (placementSnap.exists()) {
          freshData = { id: placementSnap.id, ...placementSnap.data() };
        }
      } else if (itemType === 'creatif' && placementId) {
        console.log("FIREBASE: LECTURE - Fichier: TaxonomyContextMenu.tsx - Fonction: refreshItemData - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placementId}/creatifs/${item.id}");
        const creatifRef = doc(
          db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId,
          'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId,
          'placements', placementId, 'creatifs', item.id
        );
        const creatifSnap = await getDoc(creatifRef);
        if (creatifSnap.exists()) {
          freshData = { id: creatifSnap.id, ...creatifSnap.data() };
        }
      }

      if (freshData) {
        setFreshItem(freshData);
        
        if (loadedTaxonomy.taxonomy) {
          generateAvailableLevels(loadedTaxonomy);
        }
      }
    } catch (error) {
      console.error('Erreur lors du refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Charge la taxonomie associée à l'élément actuel.
   * Récupère la taxonomie via `getTaxonomyById` et met à jour les états `loadedTaxonomy` et `availableLevels`.
   * @returns {Promise<void>} Une promesse qui se résout une fois la taxonomie chargée.
   */
  const loadTaxonomy = async () => {
    setLoading(true);
    try {
      const taxonomyId = getTaxonomyId();
      const fieldPrefix = getFieldPrefix();
      
      if (taxonomyId) {
        const taxonomy = await getTaxonomyById(clientId, taxonomyId);
        if (taxonomy) {
          const loadedData: LoadedTaxonomy = {
            taxonomy,
            fieldPrefix
          };
          setLoadedTaxonomy(loadedData);
          generateAvailableLevels(loadedData);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la taxonomie:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Détermine l'ID de la taxonomie à charger en fonction du type d'élément et du type de taxonomie.
   * @returns {string | undefined} L'ID de la taxonomie ou `undefined` si non trouvé.
   */
  const getTaxonomyId = (): string | undefined => {
    if (itemType === 'placement') {
      const placement = freshItem as Placement;
      switch (taxonomyType) {
        case 'tags': return placement.PL_Taxonomy_Tags;
        case 'platform': return placement.PL_Taxonomy_Platform;
        case 'mediaocean': return placement.PL_Taxonomy_MediaOcean;
        default: return undefined;
      }
    } else {
      const creatif = freshItem as Creatif;
      switch (taxonomyType) {
        case 'tags': return creatif.CR_Taxonomy_Tags;
        case 'platform': return creatif.CR_Taxonomy_Platform;
        case 'mediaocean': return creatif.CR_Taxonomy_MediaOcean;
        default: return undefined;
      }
    }
  };

  /**
   * Détermine le préfixe de champ à utiliser pour accéder aux valeurs de taxonomie dans l'élément.
   * @returns {string} Le préfixe de champ (ex: "PL_Tag_", "CR_Plateforme_").
   */
  const getFieldPrefix = (): string => {
    const typePrefix = itemType === 'placement' ? 'PL_' : 'CR_';
    
    switch (taxonomyType) {
      case 'tags': return `${typePrefix}Tag_`;
      case 'platform': return `${typePrefix}Plateforme_`;
      case 'mediaocean': return `${typePrefix}MO_`;
      default: return '';
    }
  };

  /**
   * Génère la liste des niveaux de taxonomie disponibles à afficher dans le menu.
   * Utilise la taxonomie chargée pour identifier les titres et structures de chaque niveau pertinent.
   * @param {LoadedTaxonomy} loadedData - Les données de taxonomie chargées.
   * @returns {void}
   */
  const generateAvailableLevels = (loadedData: LoadedTaxonomy) => {
    const levels: TaxonomyLevel[] = [];
    const { taxonomy } = loadedData;
    
    if (!taxonomy) return;
    
    const levelRange = itemType === 'placement' ? [1, 2, 3, 4] : [5, 6];

    levelRange.forEach(levelNum => {
      const title = taxonomy[`NA_Name_Level_${levelNum}_Title` as keyof Taxonomy] as string;
      const structure = taxonomy[`NA_Name_Level_${levelNum}` as keyof Taxonomy] as string;

      if (title && structure) {
        levels.push({
          level: levelNum,
          title,
          structure
        });
      }
    });

    setAvailableLevels(levels);
  };

  /**
   * Crée une fonction de résolution de valeurs pour la génération de chaînes de taxonomie.
   * Cette fonction tente de récupérer la valeur d'une variable d'abord à partir des champs directs
   * préfixés de l'élément (`PL_Tag_1`, etc.), puis des valeurs de taxonomie stockées,
   * et enfin des champs directs non préfixés de l'élément.
   * @returns {(variableName: string, format: TaxonomyFormat) => string} La fonction de résolution.
   */
  const createValueResolver = () => {
    const { fieldPrefix = '' } = loadedTaxonomy;
    
    return (variableName: string, format: TaxonomyFormat): string => {
      if (fieldPrefix) {
        for (let level = 1; level <= 6; level++) {
          const fieldName = `${fieldPrefix}${level}`;
          const fieldValue = getDirectFieldValue(fieldName);
          if (fieldValue) {
            return fieldValue;
          }
        }
      }

      const taxonomyValues = getTaxonomyValues();
      if (taxonomyValues && taxonomyValues[variableName]) {
        const taxonomyValue = taxonomyValues[variableName];
        
        if (format === 'open' && taxonomyValue.openValue) {
          return taxonomyValue.openValue;
        }
        
        return taxonomyValue.value || `[${variableName}:${format}]`;
      }

      const directValue = getDirectFieldValue(variableName);
      if (directValue) {
        return directValue;
      }

      return `[${variableName}:${format}]`;
    };
  };

  /**
   * Récupère les valeurs de taxonomie spécifiques (PL_Taxonomy_Values ou CR_Taxonomy_Values) de l'élément frais.
   * @returns {TaxonomyValues | undefined} Les valeurs de taxonomie ou `undefined`.
   */
  const getTaxonomyValues = (): TaxonomyValues | undefined => {
    if (itemType === 'placement') {
      return (freshItem as Placement).PL_Taxonomy_Values;
    } else {
      return (freshItem as Creatif).CR_Taxonomy_Values;
    }
  };

  /**
   * Récupère la valeur d'un champ directement depuis l'objet `freshItem`.
   * @param {string} variableName - Le nom du champ à récupérer.
   * @returns {string | undefined} La valeur du champ sous forme de chaîne ou `undefined` si non trouvé ou non une chaîne.
   */
  const getDirectFieldValue = (variableName: string): string | undefined => {
    const value = (freshItem as any)[variableName];
    return typeof value === 'string' ? value : undefined;
  };

  /**
   * Gère l'action de copier la valeur d'un niveau de taxonomie dans le presse-papiers.
   * Tente de copier la valeur directe du champ s'il existe, sinon génère la chaîne à partir de la structure.
   * Affiche une notification de succès temporaire.
   * @param {TaxonomyLevel} level - Le niveau de taxonomie à copier.
   * @returns {Promise<void>} Une promesse qui se résout une fois la copie effectuée.
   */
  const handleCopyLevel = async (level: TaxonomyLevel) => {
    try {
      const { fieldPrefix = '' } = loadedTaxonomy;
      const fieldName = `${fieldPrefix}${level.level}`;
      const fieldValue = getDirectFieldValue(fieldName);
      
      let valueToCopy = '';
      
      if (fieldValue) {
        valueToCopy = fieldValue;
      } else {
        const valueResolver = createValueResolver();
        valueToCopy = generateFinalTaxonomyString(level.structure, valueResolver);
      }
      
      await navigator.clipboard.writeText(valueToCopy);
      
      const levelKey = `level-${level.level}`;
      setCopiedLevel(levelKey);
      
      setTimeout(() => {
        setCopiedLevel(null);
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      fallbackCopyToClipboard(level);
    }
  };

  /**
   * Fournit une méthode de secours pour copier du texte dans le presse-papiers pour les navigateurs
   * qui ne supportent pas l'API `navigator.clipboard`.
   * @param {TaxonomyLevel} level - Le niveau de taxonomie à copier.
   * @returns {void}
   */
  const fallbackCopyToClipboard = (level: TaxonomyLevel) => {
    const { fieldPrefix = '' } = loadedTaxonomy;
    const fieldName = `${fieldPrefix}${level.level}`;
    const fieldValue = getDirectFieldValue(fieldName);
    
    let valueToCopy = '';
    
    if (fieldValue) {
      valueToCopy = fieldValue;
    } else {
      const valueResolver = createValueResolver();
      valueToCopy = generateFinalTaxonomyString(level.structure, valueResolver);
    }
    
    const textArea = document.createElement('textarea');
    textArea.value = valueToCopy;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      const levelKey = `level-${level.level}`;
      setCopiedLevel(levelKey);
      setTimeout(() => setCopiedLevel(null), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie fallback:', err);
    }
    
    document.body.removeChild(textArea);
  };

  if (!isOpen) return null;

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    zIndex: 1000,
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <div
        ref={menuRef}
        style={menuStyle}
        className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-64 max-w-80"
      >
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            {taxonomyType === 'tags' ? 'Tags' : taxonomyType === 'platform' ? 'Plateforme' : 'MediaOcean'}
            {refreshing && (
              <span className="ml-2 text-xs text-blue-600">• Auto-refresh</span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshItemData}
              disabled={refreshing}
              className="text-gray-300 hover:text-gray-500 disabled:opacity-50 transition-colors"
              title="Actualiser manuellement"
            >
              <ArrowPathIcon className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="py-2">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
              Chargement...
            </div>
          ) : availableLevels.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Aucune taxonomie configurée pour {taxonomyType === 'tags' ? 'les tags' : taxonomyType === 'platform' ? 'la plateforme' : 'MediaOcean'}
            </div>
          ) : (
            availableLevels.map((level) => {
              const levelKey = `level-${level.level}`;
              const isCopied = copiedLevel === levelKey;
              
              const { fieldPrefix = '' } = loadedTaxonomy;
              const fieldName = `${fieldPrefix}${level.level}`;
              const fieldValue = getDirectFieldValue(fieldName);
              const previewValue = fieldValue || 'Aucune valeur configurée';
              
              return (
                <button
                  key={levelKey}
                  onClick={() => handleCopyLevel(level)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
                  title={`Copier: ${previewValue}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {level.title}
                    </div>

                    {fieldValue && (
                      <div className="text-xs text-gray-400 truncate mt-1 font-mono">
                        {fieldValue.length > 40 ? `${fieldValue.substring(0, 40)}...` : fieldValue}
                      </div>
                    )}
                  </div>
                  
                  {isCopied ? (
                    <div className="flex items-center text-green-600 ml-2">
                      <CheckIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">Copié !</span>
                    </div>
                  ) : (
                    <div className="text-gray-400 group-hover:text-gray-600 ml-2" title="Copier dans le presse-papier">
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        
        </div>

        {refreshing && (
          <div className="px-4 py-2 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 mr-2"></div>
              Actualisation des données...
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TaxonomyContextMenu;