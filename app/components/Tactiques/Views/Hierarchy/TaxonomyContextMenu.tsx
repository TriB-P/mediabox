// app/components/Tactiques/Views/Hierarchy/TaxonomyContextMenu.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, CheckIcon, DocumentDuplicateIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getTaxonomyById } from '../../../../lib/taxonomyService';
import { generateFinalTaxonomyString } from '../../../../lib/taxonomyParser';
import { Taxonomy } from '../../../../types/taxonomy';
import { Placement, Creatif, TaxonomyValues, TaxonomyFormat } from '../../../../types/tactiques';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

// ==================== TYPES ====================

interface TaxonomyContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  item: Placement | Creatif;
  itemType: 'placement' | 'creatif';
  taxonomyType: 'tags' | 'platform' | 'mediaocean';
  clientId: string;
  // 🔥 NOUVEAU: Props pour les IDs nécessaires au refresh
  campaignId?: string;
  versionId?: string;
  ongletId?: string;
  sectionId?: string;
  tactiqueId?: string;
  placementId?: string; // Pour les créatifs
}

interface TaxonomyLevel {
  level: number;
  title: string;
  structure: string;
}

interface LoadedTaxonomy {
  taxonomy?: Taxonomy;
  fieldPrefix?: string; // Ex: "PL_Tag_", "PL_Plateforme_", "PL_MO_", "CR_Tag_", etc.
}

// ==================== COMPOSANT PRINCIPAL ====================

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
  // 🔥 NOUVEAU: État pour les données fraîches
  const [freshItem, setFreshItem] = useState<Placement | Creatif>(item);
  const [refreshing, setRefreshing] = useState(false);

  // ==================== EFFET DE CHARGEMENT AVEC REFRESH AUTOMATIQUE ====================

  useEffect(() => {
    if (isOpen && item) {
      setFreshItem(item); // Initialiser avec l'item passé en props
      loadTaxonomy();
      
      // 🔥 NOUVEAU: Refresh automatique à l'ouverture
      // Délai court pour laisser le menu s'afficher d'abord
      const autoRefreshTimer = setTimeout(() => {
        refreshItemData();
      }, 100);
      
      return () => clearTimeout(autoRefreshTimer);
    }
  }, [isOpen, item, taxonomyType, clientId]);

  // ==================== EFFET DE CLIC EXTÉRIEUR ====================

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

  // ==================== 🔥 NOUVEAU: FONCTION DE REFRESH ====================

  const refreshItemData = async () => {
    if (!campaignId || !versionId || !ongletId || !sectionId || !tactiqueId) {
      console.warn('IDs manquants pour le refresh');
      return;
    }

    setRefreshing(true);
    try {
      let freshData: any = null;

      if (itemType === 'placement') {
        // Récupérer les données fraîches du placement
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
        // Récupérer les données fraîches du créatif
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
        console.log('🔄 Données rafraîchies:', freshData);
        setFreshItem(freshData);
        
        // Régénérer les niveaux disponibles avec les nouvelles données
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

  // ==================== FONCTIONS DE CHARGEMENT ====================

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

  const getFieldPrefix = (): string => {
    const typePrefix = itemType === 'placement' ? 'PL_' : 'CR_';
    
    switch (taxonomyType) {
      case 'tags': return `${typePrefix}Tag_`;
      case 'platform': return `${typePrefix}Plateforme_`;
      case 'mediaocean': return `${typePrefix}MO_`;
      default: return '';
    }
  };

  // ==================== GÉNÉRATION DES NIVEAUX DISPONIBLES ====================

  const generateAvailableLevels = (loadedData: LoadedTaxonomy) => {
    const levels: TaxonomyLevel[] = [];
    const { taxonomy } = loadedData;
    
    if (!taxonomy) return;
    
    // Déterminer les niveaux à afficher selon le type d'item
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

  // ==================== GÉNÉRATION DES VALEURS (MODIFIÉE POUR UTILISER freshItem) ====================

  const createValueResolver = () => {
    const { fieldPrefix = '' } = loadedTaxonomy;
    
    return (variableName: string, format: TaxonomyFormat): string => {
      // 🔥 CORRECTION: Utiliser freshItem au lieu de item
      // Essayer de récupérer depuis les champs spécifiques (PL_Tag_1, PL_Plateforme_1, etc.)
      if (fieldPrefix) {
        for (let level = 1; level <= 6; level++) {
          const fieldName = `${fieldPrefix}${level}`;
          const fieldValue = getDirectFieldValue(fieldName);
          if (fieldValue) {
            console.log(`Valeur trouvée pour ${variableName}: ${fieldValue} (depuis ${fieldName})`);
            return fieldValue;
          }
        }
      }

      // Fallback: vérifier dans les valeurs de taxonomie stockées
      const taxonomyValues = getTaxonomyValues();
      if (taxonomyValues && taxonomyValues[variableName]) {
        const taxonomyValue = taxonomyValues[variableName];
        
        if (format === 'open' && taxonomyValue.openValue) {
          return taxonomyValue.openValue;
        }
        
        return taxonomyValue.value || `[${variableName}:${format}]`;
      }

      // Sinon, essayer de récupérer depuis les champs directs de l'item
      const directValue = getDirectFieldValue(variableName);
      if (directValue) {
        return directValue;
      }

      // Retourner la variable non résolue si aucune valeur trouvée
      console.log(`Aucune valeur trouvée pour ${variableName}, recherche effectuée avec préfixe: ${fieldPrefix}`);
      return `[${variableName}:${format}]`;
    };
  };

  const getTaxonomyValues = (): TaxonomyValues | undefined => {
    if (itemType === 'placement') {
      return (freshItem as Placement).PL_Taxonomy_Values; // 🔥 Utiliser freshItem
    } else {
      return (freshItem as Creatif).CR_Taxonomy_Values; // 🔥 Utiliser freshItem
    }
  };

  const getDirectFieldValue = (variableName: string): string | undefined => {
    // 🔥 CORRECTION: Récupérer les valeurs depuis freshItem
    const value = (freshItem as any)[variableName];
    return typeof value === 'string' ? value : undefined;
  };

  // ==================== COPIE DANS LE PRESSE-PAPIER ====================

  const handleCopyLevel = async (level: TaxonomyLevel) => {
    try {
      // Au lieu de parser la structure, copier directement la valeur du champ
      const { fieldPrefix = '' } = loadedTaxonomy;
      const fieldName = `${fieldPrefix}${level.level}`;
      const fieldValue = getDirectFieldValue(fieldName);
      
      let valueToCopy = '';
      
      if (fieldValue) {
        valueToCopy = fieldValue;
        console.log(`Copie directe du champ ${fieldName}: ${fieldValue}`);
      } else {
        // Fallback : utiliser la structure si pas de valeur directe
        const valueResolver = createValueResolver();
        valueToCopy = generateFinalTaxonomyString(level.structure, valueResolver);
        console.log(`Copie de la structure parsée pour niveau ${level.level}: ${valueToCopy}`);
      }
      
      await navigator.clipboard.writeText(valueToCopy);
      
      // Afficher la notification de succès
      const levelKey = `level-${level.level}`;
      setCopiedLevel(levelKey);
      
      // Masquer la notification après 2 secondes
      setTimeout(() => {
        setCopiedLevel(null);
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      // Fallback pour les navigateurs qui ne supportent pas l'API clipboard
      fallbackCopyToClipboard(level);
    }
  };

  const fallbackCopyToClipboard = (level: TaxonomyLevel) => {
    // Au lieu de parser la structure, copier directement la valeur du champ
    const { fieldPrefix = '' } = loadedTaxonomy;
    const fieldName = `${fieldPrefix}${level.level}`;
    const fieldValue = getDirectFieldValue(fieldName);
    
    let valueToCopy = '';
    
    if (fieldValue) {
      valueToCopy = fieldValue;
    } else {
      // Fallback : utiliser la structure si pas de valeur directe
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

  // ==================== RENDU ====================

  if (!isOpen) return null;

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    zIndex: 1000,
  };

  return (
    <>
      {/* Overlay transparent pour fermer le menu */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Menu contextuel */}
      <div
        ref={menuRef}
        style={menuStyle}
        className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-64 max-w-80"
      >
        {/* En-tête */}
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            {taxonomyType === 'tags' ? 'Tags' : taxonomyType === 'platform' ? 'Plateforme' : 'MediaOcean'}
            {/* 🔥 NOUVEAU: Indicateur de refresh automatique */}
            {refreshing && (
              <span className="ml-2 text-xs text-blue-600">• Auto-refresh</span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            {/* 🔥 MODIFIÉ: Bouton refresh plus discret (manuel optionnel) */}
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

        {/* Contenu */}
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
              
              // Prévisualiser la valeur qui sera copiée
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

                    {/* Aperçu de la valeur */}
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

        {/* 🔥 NOUVEAU: Indicateur de refresh en bas */}
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