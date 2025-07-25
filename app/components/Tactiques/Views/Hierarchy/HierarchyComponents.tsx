// app/components/Tactiques/Views/Hierarchy/HierarchyComponents.tsx

/**
 * Ce fichier contient les composants React pour afficher la hiérarchie des tactiques, placements et créatifs.
 * Il gère l'affichage des éléments glissables et déposables (Draggable, Droppable) pour permettre la réorganisation.
 * Les composants affichent les informations pertinentes pour chaque niveau (nom, budget, nombre d'éléments enfants, logos de partenaires)
 * et gèrent les interactions utilisateur comme l'édition, l'expansion/réduction et la sélection.
 * Il inclut également la logique pour afficher les indicateurs de taxonomie et les menus contextuels associés.
 * 
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { Tactique, Placement, Creatif } from '../../../../types/tactiques';
import { useClient } from '../../../../contexts/ClientContext';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import TaxonomyContextMenu from './TaxonomyContextMenu';

// NOUVEAU : Import des fonctions de cache
import { getCachedAllShortcodes, ShortcodeItem } from '../../../../lib/cacheService';

interface BaseItemProps {
  formatCurrency: (amount: number) => string;
}

interface TaxonomyMenuState {
  isOpen: boolean;
  item: Placement | Creatif | null;
  itemType: 'placement' | 'creatif' | null;
  position: { x: number; y: number };
}

interface CreatifItemProps extends BaseItemProps {
  creatif: Creatif;
  index: number;
  sectionId: string;
  tactiqueId: string;
  placementId: string;
  hoveredCreatif: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null;
  onHover: (hover: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null) => void;
  onEdit: (placementId: string, creatif: Creatif) => void;
  onSelectCreatif: (creatifId: string, isSelected: boolean) => void;
  onOpenTaxonomyMenu: (item: Creatif, itemType: 'creatif', taxonomyType: 'tags' | 'platform' | 'mediaocean', position: { x: number; y: number }) => void;
}

/**
 * Composant pour afficher un élément créatif dans la hiérarchie.
 * Permet le glisser-déposer, l'édition et la sélection, ainsi que l'affichage des taxonomies.
 * @param {CreatifItemProps} props - Les propriétés du composant.
 * @returns {React.FC<CreatifItemProps>} Le composant CreatifItem.
 */
export const CreatifItem: React.FC<CreatifItemProps> = ({
  creatif,
  index,
  sectionId,
  tactiqueId,
  placementId,
  hoveredCreatif,
  onHover,
  onEdit,
  onSelectCreatif,
  onOpenTaxonomyMenu
}) => {
  const isHovered = hoveredCreatif?.creatifId === creatif.id;

  const hasTagsTaxonomy = !!creatif.CR_Taxonomy_Tags;
  const hasPlatformTaxonomy = !!creatif.CR_Taxonomy_Platform;
  const hasMediaOceanTaxonomy = !!creatif.CR_Taxonomy_MediaOcean;

  const handleTagsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (hasTagsTaxonomy) {
      const rect = event.currentTarget.getBoundingClientRect();
      onOpenTaxonomyMenu(creatif, 'creatif', 'tags', {
        x: rect.right + 8,
        y: rect.top
      });
    }
  };

  const handlePlatformClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (hasPlatformTaxonomy) {
      const rect = event.currentTarget.getBoundingClientRect();
      onOpenTaxonomyMenu(creatif, 'creatif', 'platform', {
        x: rect.right + 8,
        y: rect.top
      });
    }
  };

  const handleMediaOceanClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (hasMediaOceanTaxonomy) {
      const rect = event.currentTarget.getBoundingClientRect();
      onOpenTaxonomyMenu(creatif, 'creatif', 'mediaocean', {
        x: rect.right + 8,
        y: rect.top
      });
    }
  };

  return (
    <Draggable
      key={`creatif-${creatif.id}`}
      draggableId={`creatif-${creatif.id}`}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex justify-between items-center pl-3 pr-4 py-1.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
            snapshot.isDragging ? 'bg-white shadow-lg rounded' : ''
          } ${creatif.isSelected ? 'bg-indigo-50' : ''}`}
          onMouseEnter={() => onHover({sectionId, tactiqueId, placementId, creatifId: creatif.id})}
          onMouseLeave={() => onHover(null)}
        >
          {/* Contenu de gauche */}
          <div className="flex items-center flex-1 min-w-0">
            <input
              type="checkbox"
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
              checked={creatif.isSelected || false}
              onChange={(e) => onSelectCreatif(creatif.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
              <Bars3Icon className="h-3 w-3 text-gray-300" />
            </span>
            <div className="text-xs text-gray-600 truncate">
              {creatif.CR_Label}
            </div>
            {creatif.CR_Version && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                v{creatif.CR_Version}
              </span>
            )}
          </div>

          {/* Contenu de droite : Actions et Indicateurs de taxonomie */}
          <div className="flex items-center space-x-4">
            {/* Actions (crayon d'édition) - Standardisé */}
            <div className="w-6 h-6 flex items-center justify-center">
              {isHovered && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(placementId, creatif);
                  }}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Modifier le créatif"
                >
                  <PencilIcon className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Indicateurs de taxonomie - Cliquables individuellement */}
            <div className="flex items-center space-x-2 -ml-8">
              <span
                className={`w-3 h-3 rounded-full transition-colors ${
                  hasTagsTaxonomy
                    ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                    : 'bg-gray-300'
                }`}
                title={hasTagsTaxonomy ? "Tags" : "Tags"}
                onClick={handleTagsClick}
              ></span>
              <span
                className={`w-3 h-3 rounded-full transition-colors ${
                  hasPlatformTaxonomy
                    ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                    : 'bg-gray-300'
                }`}
                title={hasPlatformTaxonomy ? "Plateforme" : "Plateforme"}
                onClick={handlePlatformClick}
              ></span>
              <span
                className={`w-3 h-3 rounded-full transition-colors ${
                  hasMediaOceanTaxonomy
                    ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                    : 'bg-gray-300'
                }`}
                title={hasMediaOceanTaxonomy ? "MediaOcean" : "MediaOcean"}
                onClick={handleMediaOceanClick}
              ></span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

interface PlacementItemProps extends BaseItemProps {
  placement: Placement;
  index: number;
  sectionId: string;
  tactiqueId: string;
  creatifs: Creatif[];
  expandedPlacements: {[placementId: string]: boolean};
  hoveredPlacement: {sectionId: string, tactiqueId: string, placementId: string} | null;
  hoveredCreatif: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null;
  onHoverPlacement: (hover: {sectionId: string, tactiqueId: string, placementId: string} | null) => void;
  onHoverCreatif: (hover: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null) => void;
  onExpand: (placementId: string) => void;
  onEdit: (tactiqueId: string, placement: Placement) => void;
  onCreateCreatif?: (placementId: string) => void;
  onEditCreatif: (placementId: string, creatif: Creatif) => void;
  onSelectPlacement: (placementId: string, isSelected: boolean) => void;
  onSelectCreatif: (creatifId: string, isSelected: boolean) => void;
  onOpenTaxonomyMenu: (item: Placement | Creatif, itemType: 'placement' | 'creatif', taxonomyType: 'tags' | 'platform' | 'mediaocean', position: { x: number; y: number }) => void;
}

/**
 * Composant pour afficher un élément de placement dans la hiérarchie.
 * Permet le glisser-déposer, l'expansion/réduction pour afficher les créatifs enfants, l'édition et la sélection.
 * Gère également l'ajout de nouveaux créatifs et l'affichage des taxonomies.
 * @param {PlacementItemProps} props - Les propriétés du composant.
 * @returns {React.FC<PlacementItemProps>} Le composant PlacementItem.
 */
export const PlacementItem: React.FC<PlacementItemProps> = ({
  placement,
  index,
  sectionId,
  tactiqueId,
  creatifs,
  expandedPlacements,
  hoveredPlacement,
  hoveredCreatif,
  onHoverPlacement,
  onHoverCreatif,
  onExpand,
  onEdit,
  onCreateCreatif,
  onEditCreatif,
  onSelectPlacement,
  onSelectCreatif,
  onOpenTaxonomyMenu
}) => {
  const isExpanded = expandedPlacements[placement.id];
  const isHovered = hoveredPlacement?.placementId === placement.id;

  const hasTagsTaxonomy = !!placement.PL_Taxonomy_Tags;
  const hasPlatformTaxonomy = !!placement.PL_Taxonomy_Platform;
  const hasMediaOceanTaxonomy = !!placement.PL_Taxonomy_MediaOcean;

  const handleTagsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (hasTagsTaxonomy) {
      const rect = event.currentTarget.getBoundingClientRect();
      onOpenTaxonomyMenu(placement, 'placement', 'tags', {
        x: rect.right + 8,
        y: rect.top
      });
    }
  };

  const handlePlatformClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (hasPlatformTaxonomy) {
      const rect = event.currentTarget.getBoundingClientRect();
      onOpenTaxonomyMenu(placement, 'placement', 'platform', {
        x: rect.right + 8,
        y: rect.top
      });
    }
  };

  const handleMediaOceanClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (hasMediaOceanTaxonomy) {
      const rect = event.currentTarget.getBoundingClientRect();
      onOpenTaxonomyMenu(placement, 'placement', 'mediaocean', {
        x: rect.right + 8,
        y: rect.top
      });
    }
  };

  return (
    <Draggable
      key={`placement-${placement.id}`}
      draggableId={`placement-${placement.id}`}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`border-b border-gray-200 last:border-b-0 ${
            snapshot.isDragging ? 'bg-white shadow-lg rounded' : ''
          } ${placement.isSelected ? 'bg-indigo-50' : ''}`}
          onMouseEnter={() => onHoverPlacement({sectionId, tactiqueId, placementId: placement.id})}
          onMouseLeave={() => onHoverPlacement(null)}
        >
          <div
            className="flex justify-between items-center px-4 py-2 cursor-pointer bg-white"
            onClick={() => onExpand(placement.id)}
          >
            {/* Contenu de gauche */}
            <div className="flex items-center flex-1 min-w-0">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
                checked={placement.isSelected || false}
                onChange={(e) => onSelectPlacement(placement.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                <Bars3Icon className="h-3 w-3 text-gray-400" />
              </span>

              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3 text-gray-500 mr-2" />
              ) : (
                <ChevronRightIcon className="h-3 w-3 text-gray-500 mr-2" />
              )}

              <div className="text-xs text-gray-700 font-medium truncate">
                 {placement.PL_Label}
              </div>

              {/* Badge créatifs plus discret */}
              {creatifs.length > 0 && (
                <span className="ml-5 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
                  {creatifs.length}
                </span>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateCreatif?.(placement.id);
                }}
                className={`ml-2 p-1 rounded hover:bg-gray-200 transition-colors ${
                  isHovered ? 'text-indigo-600' : 'text-indigo-400'
                }`}
                title="Ajouter un créatif"
              >
                <PlusIcon className="h-3 w-3" />
              </button>
            </div>

            {/* Contenu de droite : Actions et Indicateurs de taxonomie */}
            <div className="flex items-center space-x-4">
              {/* Actions (crayon d'édition) - Standardisé */}
              <div className="w-6 h-6 flex items-center justify-center">
                {isHovered && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(tactiqueId, placement);
                    }}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                    title="Modifier le placement"
                  >
                    <PencilIcon className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Indicateurs de taxonomie - Cliquables individuellement */}
              <div className="flex items-center space-x-2">
                <span
                  className={`w-3 h-3 rounded-full transition-colors ${
                    hasTagsTaxonomy
                      ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                      : 'bg-gray-300'
                  }`}
                  title={hasTagsTaxonomy ? "Tags" : "Tags"}
                  onClick={handleTagsClick}
                ></span>
                <span
                  className={`w-3 h-3 rounded-full transition-colors ${
                    hasPlatformTaxonomy
                      ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                      : 'bg-gray-300'
                  }`}
                  title={hasPlatformTaxonomy ? "Plateforme" : "Plateforme"}
                  onClick={handlePlatformClick}
                ></span>
                <span
                  className={`w-3 h-3 rounded-full transition-colors ${
                    hasMediaOceanTaxonomy
                      ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                      : 'bg-gray-300'
                  }`}
                  title={hasMediaOceanTaxonomy ? "MediaOcean" : "MediaOcean"}
                  onClick={handleMediaOceanClick}
                ></span>
              </div>
            </div>
          </div>

          {/* Créatifs - fond blanc uniforme */}
          {isExpanded && (
            <div className="pl-8 bg-white py-1">
              {creatifs.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-500 italic">
                  Aucun créatif pour ce placement
                </div>
              ) : (
                <Droppable droppableId={`creatifs-${placement.id}`} type="CREATIF">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {creatifs.map((creatif, creatifIndex) => (
                        <CreatifItem
                          key={creatif.id}
                          creatif={creatif}
                          index={creatifIndex}
                          sectionId={sectionId}
                          tactiqueId={tactiqueId}
                          placementId={placement.id}
                          hoveredCreatif={hoveredCreatif}
                          onHover={onHoverCreatif}
                          onEdit={onEditCreatif}
                          formatCurrency={() => ''}
                          onSelectCreatif={onSelectCreatif}
                          onOpenTaxonomyMenu={onOpenTaxonomyMenu}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

interface TactiqueItemProps extends BaseItemProps {
  tactique: Tactique;
  index: number;
  sectionId: string;
  placements: Placement[];
  creatifs: { [placementId: string]: Creatif[] };
  expandedTactiques: {[tactiqueId: string]: boolean};
  expandedPlacements: {[placementId: string]: boolean};
  hoveredTactique: {sectionId: string, tactiqueId: string} | null;
  hoveredPlacement: {sectionId: string, tactiqueId: string, placementId: string} | null;
  hoveredCreatif: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null;
  onHoverTactique: (hover: {sectionId: string, tactiqueId: string} | null) => void;
  onHoverPlacement: (hover: {sectionId: string, tactiqueId: string, placementId: string} | null) => void;
  onHoverCreatif: (hover: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null) => void;
  onExpandTactique: (tactiqueId: string) => void;
  onExpandPlacement: (placementId: string) => void;
  onEdit: (sectionId: string, tactique: Tactique) => void;
  onCreatePlacement?: (tactiqueId: string) => void;
  onEditPlacement: (tactiqueId: string, placement: Placement) => void;
  onCreateCreatif?: (placementId: string) => void;
  onEditCreatif: (placementId: string, creatif: Creatif) => void;
  onSelect: (tactiqueId: string, isSelected: boolean) => void;
  onSelectPlacement: (placementId: string, isSelected: boolean) => void;
  onSelectCreatif: (creatifId: string, isSelected: boolean) => void;
  onOpenTaxonomyMenu: (item: Placement | Creatif, itemType: 'placement' | 'creatif', taxonomyType: 'tags' | 'platform' | 'mediaocean', position: { x: number; y: number }) => void;
}

/**
 * Composant pour afficher un élément de tactique dans la hiérarchie.
 * Permet le glisser-déposer, l'expansion/réduction pour afficher les placements enfants, l'édition et la sélection.
 * Gère également l'affichage du logo partenaire, l'ajout de nouveaux placements et le budget.
 * VERSION 2024 : Utilise le cache localStorage pour les logos partenaires
 * @param {TactiqueItemProps} props - Les propriétés du composant.
 * @returns {React.FC<TactiqueItemProps>} Le composant TactiqueItem.
 */
export const TactiqueItem: React.FC<TactiqueItemProps> = ({
  tactique,
  index,
  sectionId,
  placements,
  creatifs,
  expandedTactiques,
  expandedPlacements,
  hoveredTactique,
  hoveredPlacement,
  hoveredCreatif,
  onHoverTactique,
  onHoverPlacement,
  onHoverCreatif,
  onExpandTactique,
  onExpandPlacement,
  onEdit,
  onCreatePlacement,
  onEditPlacement,
  onCreateCreatif,
  onEditCreatif,
  formatCurrency,
  onSelect,
  onSelectPlacement,
  onSelectCreatif,
  onOpenTaxonomyMenu
}) => {
  const isExpanded = expandedTactiques[tactique.id];
  const isHovered = hoveredTactique?.tactiqueId === tactique.id && hoveredTactique?.sectionId === sectionId;

  const [partnerImageUrl, setPartnerImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  /**
   * MODIFIÉ : Charge l'image du partenaire depuis le cache localStorage.
   * Récupère d'abord les shortcodes du cache, trouve le partenaire correspondant,
   * puis charge son logo depuis Firebase Storage ou URL directe.
   * @returns {Promise<void>}
   */
  useEffect(() => {
    const loadPartnerImageFromCache = async () => {
      if (!tactique.TC_Publisher) return;

      // 1. Récupérer tous les shortcodes depuis le cache
      const allShortcodes = getCachedAllShortcodes();
      if (!allShortcodes) {
        console.warn('[CACHE] Aucun shortcode en cache pour charger le logo partenaire');
        return;
      }

      // 2. Chercher le partenaire dans les shortcodes
      const partner = allShortcodes[tactique.TC_Publisher];
      if (!partner?.SH_Logo) {
        console.log(`[CACHE] Aucun logo trouvé pour le partenaire ${tactique.TC_Publisher}`);
        return;
      }

      setImageLoading(true);
      setImageError(false);

      try {
        const storage = getStorage();

        if (partner.SH_Logo.startsWith('gs://')) {
          console.log("FIREBASE: LECTURE - Fichier: HierarchyComponents.tsx - Fonction: loadPartnerImageFromCache - Path: partners/${partner.id}/logo");
          const storageRef = ref(storage, partner.SH_Logo);
          const url = await getDownloadURL(storageRef);
          setPartnerImageUrl(url);
        } else {
          setPartnerImageUrl(partner.SH_Logo);
        }
        
        console.log(`[CACHE] ✅ Logo chargé pour partenaire ${partner.SH_Display_Name_FR}`);
      } catch (error) {
        console.error('[CACHE] Erreur chargement logo partenaire:', error);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    loadPartnerImageFromCache();
  }, [tactique.TC_Publisher]);

  /**
   * MODIFIÉ : Récupère les informations du partenaire depuis le cache pour l'affichage de fallback
   * @returns {ShortcodeItem | null} Le partenaire trouvé ou null
   */
  const getPartnerFromCache = (): ShortcodeItem | null => {
    if (!tactique.TC_Publisher) return null;
    
    const allShortcodes = getCachedAllShortcodes();
    if (!allShortcodes) return null;
    
    return allShortcodes[tactique.TC_Publisher] || null;
  };

  const partner = getPartnerFromCache();

  return (
    <Draggable
      key={`tactique-${tactique.id}`}
      draggableId={`tactique-${tactique.id}`}
      index={index}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`border-b border-gray-100 last:border-b-0 pl-8 ${
            snapshot.isDragging ? 'bg-white shadow-lg rounded' : ''
          } ${tactique.isSelected ? 'bg-indigo-50' : ''}`}
          onMouseEnter={() => onHoverTactique({sectionId, tactiqueId: tactique.id})}
          onMouseLeave={() => onHoverTactique(null)}
        >
          <div
            className="flex justify-between items-center px-4 py-3 cursor-pointer bg-white"
            onClick={() => onExpandTactique(tactique.id)}
          >
            {/* Contenu de gauche */}
            <div className="flex items-center flex-1 min-w-0">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
                checked={tactique.isSelected || false}
                onChange={(e) => onSelect(tactique.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <span {...provided.dragHandleProps} className="pr-2 cursor-grab">
                <Bars3Icon className="h-4 w-4 text-gray-400" />
              </span>

              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
              )}

              {/* Logo partenaire - carré plus gros - MODIFIÉ pour utiliser le cache */}
              <div className="flex items-center mr-3">
                {imageLoading ? (
                  <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                ) : partnerImageUrl && !imageError ? (
                  <img
                    src={partnerImageUrl}
                    alt="Logo partenaire"
                    className="w-10 h-10 object-contain rounded"
                    onError={() => setImageError(true)}
                  />
                ) : tactique.TC_Publisher && partner ? (
                  <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-sm text-gray-600 font-semibold">
                    {partner.SH_Display_Name_FR?.charAt(0) || '?'}
                  </div>
                ) : null}
              </div>

              <div className="text-sm text-gray-800 font-medium truncate">
                {tactique.TC_Label}
              </div>

              {/* Badge placements seulement - niveau en dessous */}
              {placements.length > 0 && (
                <span className="ml-5 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
                  {placements.length}
                </span>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreatePlacement?.(tactique.id);
                }}
                className={`ml-2 p-1 rounded hover:bg-gray-200 transition-colors ${
                  isHovered ? 'text-indigo-600' : 'text-indigo-400'
                }`}
                title="Ajouter un placement"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Contenu de droite : Actions et budget */}
            <div className="flex items-center space-x-4">
              {/* Actions fixes - Standardisé */}
              <div className="w-6 h-6 flex items-center justify-center">
                {isHovered && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(sectionId, tactique);
                    }}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                    title="Modifier la tactique"
                  >
                    <PencilIcon className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>

              <div className="text-sm font-medium">
                {formatCurrency(tactique.TC_Budget)}
              </div>
            </div>
          </div>

          {/* Placements - fond blanc uniforme */}
          {isExpanded && (
            <div className="pl-8 pb-2 bg-white">
              {placements.length === 0 ? (
                <div className="px-4 py-2 text-xs text-gray-500 italic">
                  Aucun placement dans cette tactique
                </div>
              ) : (
                <Droppable droppableId={`placements-${tactique.id}`} type="PLACEMENT">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {placements.map((placement, placementIndex) => (
                        <PlacementItem
                          key={placement.id}
                          placement={placement}
                          index={placementIndex}
                          sectionId={sectionId}
                          tactiqueId={tactique.id}
                          creatifs={creatifs[placement.id] || []}
                          expandedPlacements={expandedPlacements}
                          hoveredPlacement={hoveredPlacement}
                          hoveredCreatif={hoveredCreatif}
                          onHoverPlacement={onHoverPlacement}
                          onHoverCreatif={onHoverCreatif}
                          onExpand={onExpandPlacement}
                          onEdit={onEditPlacement}
                          onCreateCreatif={onCreateCreatif}
                          onEditCreatif={onEditCreatif}
                          formatCurrency={formatCurrency}
                          onSelectPlacement={onSelectPlacement}
                          onSelectCreatif={onSelectCreatif}
                          onOpenTaxonomyMenu={onOpenTaxonomyMenu}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};