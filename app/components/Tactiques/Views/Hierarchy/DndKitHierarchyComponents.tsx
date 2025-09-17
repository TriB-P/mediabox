// app/components/Tactiques/Views/Hierarchy/DndKitHierarchyComponents.tsx

/**
 * ✅ MISE À JOUR : Composants avec zones de drop cross-parent
 * Ajoute useDroppable pour accepter des éléments d'autres types
 */
'use client';

import React, { useState, useEffect } from 'react';
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  Bars3Icon,
  KeyIcon,
  ArrowRightIcon,
  ChatBubbleLeftIcon,
  ClockIcon,

} from '@heroicons/react/24/outline';
import { Tactique, Placement, Creatif } from '../../../../types/tactiques';
import { useClient } from '../../../../contexts/ClientContext';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { getCachedAllShortcodes, ShortcodeItem } from '../../../../lib/cacheService';
import { useTranslation } from '../../../../contexts/LanguageContext';

interface BaseItemProps {
  formatCurrency: (amount: number) => string;
  onCopyId?: (id: string, type: string, context?: {
    sectionId?: string;
    tactiqueId?: string;
    placementId?: string;
  }) => void;
}

interface DndKitCreatifItemProps extends BaseItemProps {
  creatif: Creatif;
  index: number;
  sectionId: string;
  tactiqueId: string;
  placementId: string;
  copiedId?: string | null;
  onCopyId?: (id: string, type: string, context?: {
    sectionId?: string;
    tactiqueId?: string;
    placementId?: string;
  }) => void;
  hoveredCreatif: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null;
  onHover: (hover: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null) => void;
  onEdit: (placementId: string, creatif: Creatif) => void;
  onSelectCreatif: (creatifId: string, isSelected: boolean) => void;
  onOpenTaxonomyMenu: (item: Creatif, itemType: 'creatif', taxonomyType: 'tags' | 'platform' | 'mediaocean', position: { x: number; y: number }) => void;
}

/**
 * ✅ Créatif : Sortable seulement (pas de drop zone - niveau le plus bas)
 */
export const DndKitCreatifItem: React.FC<DndKitCreatifItemProps> = ({
  creatif,
  index,
  sectionId,
  tactiqueId,
  placementId,
  hoveredCreatif,
  copiedId,
  onCopyId,
  onHover,
  onEdit,
  onSelectCreatif,
  onOpenTaxonomyMenu
}) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `creatif-${creatif.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
    <div
      ref={setNodeRef}
      style={style}
      className={`flex justify-between items-center pl-3 pr-4 py-1.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
        isDragging ? 'bg-white shadow-lg rounded opacity-50' : ''
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
        <span 
          {...attributes}
          {...listeners}
          className="pr-2 cursor-grab"
        >
          <Bars3Icon className="h-3 w-3 text-gray-300" />
        </span>
        <div className="text-xs text-gray-600 truncate">
          {creatif.CR_Label}
        </div>
      </div>

      {/* Contenu de droite : Actions et Indicateurs de taxonomie */}
      <div className="flex items-center space-x-4">
        {/* Actions */}
        <div className="w-12 h-6 flex items-center justify-center space-x-1">
          {isHovered && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCopyId) onCopyId(creatif.id, t('dndKit.creatifItem.type'), {
                    sectionId,
                    tactiqueId,
                    placementId
                  })
                }}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title={copiedId === creatif.id ? t('dndKit.common.idCopied') : t('dndKit.common.copyId')}
              >
                <KeyIcon className={`h-3 w-3 ${copiedId === creatif.id ? 'text-green-500' : 'text-gray-300'}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(placementId, creatif);
                }}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title={t('dndKit.creatifItem.editTitle')}
              >
                <PencilIcon className="h-4 w-4 text-gray-400" />
              </button>
            </>
          )}
        </div>

        {/* Indicateurs de taxonomie */}
        <div className="flex items-center space-x-2 -ml-8">
          <span
            className={`w-3 h-3 rounded-full transition-colors ${
              hasTagsTaxonomy
                ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                : 'bg-gray-300'
            }`}
            title={t('dndKit.common.taxonomy.tags')}
            onClick={handleTagsClick}
          ></span>
          <span
            className={`w-3 h-3 rounded-full transition-colors ${
              hasPlatformTaxonomy
                ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                : 'bg-gray-300'
            }`}
            title={t('dndKit.common.taxonomy.platform')}
            onClick={handlePlatformClick}
          ></span>
          <span
            className={`w-3 h-3 rounded-full transition-colors ${
              hasMediaOceanTaxonomy
                ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                : 'bg-gray-300'
            }`}
            title={t('dndKit.common.taxonomy.mediaOcean')}
            onClick={handleMediaOceanClick}
          ></span>
        </div>
      </div>
    </div>
  );
};

interface DndKitPlacementItemProps extends BaseItemProps {
  placement: Placement;
  index: number;
  sectionId: string;
  tactiqueId: string;
  creatifs: Creatif[];
  copiedId?: string | null;
  expandedPlacements: {[placementId: string]: boolean};
  hoveredPlacement: {sectionId: string, tactiqueId: string, placementId: string} | null;
  hoveredCreatif: {sectionId: string, tactiqueId: string, placementId: string, creatifId: string} | null;
  onCopyId?: (id: string, type: string, context?: {
    sectionId?: string;
    tactiqueId?: string;
    placementId?: string;
  }) => void;
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
 * ✅ NOUVEAU : Placement avec zone de drop pour créatifs
 */
export const DndKitPlacementItem: React.FC<DndKitPlacementItemProps> = ({
  placement,
  index,
  sectionId,
  tactiqueId,
  creatifs,
  expandedPlacements,
  hoveredPlacement,
  hoveredCreatif,
  copiedId,
  onCopyId,
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
  const { t } = useTranslation();
  
  // ✅ Sortable pour réorganiser avec autres placements
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `placement-${placement.id}` });

  // ✅ NOUVEAU : Droppable pour accepter des créatifs
  const {
    setNodeRef: setDroppableRef,
    isOver
  } = useDroppable({
    id: `placement-${placement.id}`,
    data: {
      type: 'placement',
      accepts: ['creatif'], // ✅ Accepte les créatifs
      placementId: placement.id,
      tactiqueId,
      sectionId
    }
  });

  // ✅ Combiner les deux refs
  const setNodeRef = (node: HTMLElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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

  // Créer les IDs des créatifs pour le SortableContext
  const creatifIds = creatifs.map(creatif => `creatif-${creatif.id}`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-200 last:border-b-0 ${
        isDragging ? 'bg-white shadow-lg rounded opacity-50' : ''
      } ${placement.isSelected ? 'bg-indigo-50' : ''} ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-300' : '' // ✅ Style de survol pour drop
      }`}
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
          <span 
            {...attributes}
            {...listeners}
            className="pr-2 cursor-grab"
          >
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
            title={t('dndKit.placementItem.addCreative')}
          >
            <PlusIcon className="h-3 w-3" />
          </button>
        </div>

        {/* Contenu de droite : Actions et Indicateurs de taxonomie */}
        <div className="flex items-center space-x-4">
          {/* Actions */}
          <div className="w-12 h-6 flex items-center justify-center space-x-1">
            {isHovered && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCopyId) onCopyId(placement.id, t('dndKit.placementItem.type'), {
                      sectionId,
                      tactiqueId
                    })
                  }}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title={copiedId === placement.id ? t('dndKit.common.idCopied') : t('dndKit.common.copyId')}
                >
                  <KeyIcon className={`h-3 w-3 ${copiedId === placement.id ? 'text-green-500' : 'text-gray-300'}`} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(tactiqueId, placement);
                  }}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title={t('dndKit.placementItem.editTitle')}
                >
                  <PencilIcon className="h-4 w-4 text-gray-400" />
                </button>
              </>
            )}
          </div>

          {/* Indicateurs de taxonomie */}
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full transition-colors ${
                hasTagsTaxonomy
                  ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                  : 'bg-gray-300'
              }`}
              title={t('dndKit.common.taxonomy.tags')}
              onClick={handleTagsClick}
            ></span>
            <span
              className={`w-3 h-3 rounded-full transition-colors ${
                hasPlatformTaxonomy
                  ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                  : 'bg-gray-300'
              }`}
              title={t('dndKit.common.taxonomy.platform')}
              onClick={handlePlatformClick}
            ></span>
            <span
              className={`w-3 h-3 rounded-full transition-colors ${
                hasMediaOceanTaxonomy
                  ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                  : 'bg-gray-300'
              }`}
              title={t('dndKit.common.taxonomy.mediaOcean')}
              onClick={handleMediaOceanClick}
            ></span>
          </div>
        </div>
      </div>

      {/* Créatifs avec SortableContext simple */}
      {isExpanded && (
        <div className="pl-8 bg-white py-1">
          {creatifs.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500 italic">
              {t('dndKit.placementItem.noCreative')}
            </div>
          ) : (
            <div 
              id={`creatifs-${placement.id}`}
              className="min-h-[20px]"
            >
              <SortableContext items={creatifIds} strategy={verticalListSortingStrategy}>
                {creatifs.map((creatif, creatifIndex) => (
                  <DndKitCreatifItem
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
                    onCopyId={onCopyId}
                    copiedId={copiedId}
                  />
                ))}
              </SortableContext>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface DndKitTactiqueItemProps extends BaseItemProps {
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
  copiedId?: string | null;
  onCopyId?: (id: string, type: string, context?: {
    sectionId?: string;
    tactiqueId?: string;
    placementId?: string;
  }) => void;
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
  onSaveComment?: (sectionId: string, tactiqueId: string, comment: string) => Promise<void>;
  onViewHistory?: (sectionId: string, tactique: Tactique) => void;

}

/**
 * ✅ NOUVEAU : Tactique avec zone de drop pour placements
 */
export const DndKitTactiqueItem: React.FC<DndKitTactiqueItemProps> = ({
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
  copiedId,
  onCopyId,
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
  onOpenTaxonomyMenu,
  onSaveComment,
  onViewHistory

}) => {
  const { t } = useTranslation();
  
  // ✅ Sortable pour réorganiser avec autres tactiques
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `tactique-${tactique.id}` });

  // ✅ NOUVEAU : Droppable pour accepter des placements
  const {
    setNodeRef: setDroppableRef,
    isOver
  } = useDroppable({
    id: `tactique-${tactique.id}`,
    data: {
      type: 'tactique',
      accepts: ['placement'], // ✅ Accepte les placements
      tactiqueId: tactique.id,
      sectionId
    }
  });

  // ✅ Combiner les deux refs
  const setNodeRef = (node: HTMLElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isExpanded = expandedTactiques[tactique.id];
  const isHovered = hoveredTactique?.tactiqueId === tactique.id && hoveredTactique?.sectionId === sectionId;

  const [partnerImageUrl, setPartnerImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [inventoryImageUrl, setInventoryImageUrl] = useState<string | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentText, setCommentText] = useState(tactique.TC_Comment || '');

  useEffect(() => {
    setCommentText(tactique.TC_Comment || '');
  }, [tactique.TC_Comment]);

  const handleCommentSave = async () => {
    try {
      if (onSaveComment) {
        await onSaveComment(sectionId, tactique.id, commentText);
        setCommentModalOpen(false);
      } else {
        console.error('onSaveComment function not provided');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du commentaire:', error);
      setCommentText(tactique.TC_Comment || '');
    }
  };
  
  const handleCommentCancel = () => {
    setCommentText(tactique.TC_Comment || '');
    setCommentModalOpen(false);
  };

  useEffect(() => {
    const loadPartnerAndInventoryImages = async () => {
      if (!tactique.TC_Publisher) return;
  
      const allShortcodes = getCachedAllShortcodes();
      if (!allShortcodes) {
        console.warn('[CACHE] Aucun shortcode en cache pour charger les logos');
        return;
      }
  
      const partner = allShortcodes[tactique.TC_Publisher];
      if (partner?.SH_Logo) {
        setImageLoading(true);
        setImageError(false);
  
        try {
          const storage = getStorage();
  
          if (partner.SH_Logo.startsWith('gs://')) {
            const storageRef = ref(storage, partner.SH_Logo);
            const url = await getDownloadURL(storageRef);
            setPartnerImageUrl(url);
          } else {
            setPartnerImageUrl(partner.SH_Logo);
          }
        } catch (error) {
          console.error('[CACHE] Erreur chargement logo partenaire:', error);
          setImageError(true);
        } finally {
          setImageLoading(false);
        }
      }
  
      if (tactique.TC_Inventory) {
        const inventory = allShortcodes[tactique.TC_Inventory];
        if (inventory?.SH_Logo) {
          setInventoryLoading(true);
          setInventoryError(false);
  
          try {
            const storage = getStorage();
  
            if (inventory.SH_Logo.startsWith('gs://')) {
              const storageRef = ref(storage, inventory.SH_Logo);
              const url = await getDownloadURL(storageRef);
              setInventoryImageUrl(url);
            } else {
              setInventoryImageUrl(inventory.SH_Logo);
            }
          } catch (error) {
            console.error('[CACHE] Erreur chargement logo inventaire:', error);
            setInventoryError(true);
          } finally {
            setInventoryLoading(false);
          }
        }
      }
    };
  
    loadPartnerAndInventoryImages();
  }, [tactique.TC_Publisher, tactique.TC_Inventory]);

  const getInventoryFromCache = (): ShortcodeItem | null => {
    if (!tactique.TC_Inventory) return null;
    
    const allShortcodes = getCachedAllShortcodes();
    if (!allShortcodes) return null;
    
    return allShortcodes[tactique.TC_Inventory] || null;
  };

  const getPartnerFromCache = (): ShortcodeItem | null => {
    if (!tactique.TC_Publisher) return null;
    
    const allShortcodes = getCachedAllShortcodes();
    if (!allShortcodes) return null;
    
    return allShortcodes[tactique.TC_Publisher] || null;
  };

  const partner = getPartnerFromCache();

  // Créer les IDs des placements pour le SortableContext
  const placementIds = placements.map(placement => `placement-${placement.id}`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-100 last:border-b-0 pl-8 ${
        isDragging ? 'bg-white shadow-lg rounded opacity-50' : ''
      } ${tactique.isSelected ? 'bg-indigo-50' : ''} ${
        isOver ? 'bg-green-50 ring-2 ring-green-300' : '' // ✅ Style de survol pour drop
      }`}
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
          <span 
            {...attributes}
            {...listeners}
            className="pr-2 cursor-grab"
          >
            <Bars3Icon className="h-4 w-4 text-gray-400" />
          </span>

          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
          )}

          {/* Logo partenaire + inventaire */}
          <div className="flex items-center mr-3">
            {tactique.TC_Inventory ? (
              <div className="flex items-center space-x-1">
                <div className="flex items-center">
                  {imageLoading ? (
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : partnerImageUrl && !imageError ? (
                    <img
                      src={partnerImageUrl}
                      alt={t('dndKit.tactiqueItem.partnerLogoAlt')}
                      className="w-8 h-8 object-contain rounded"
                      onError={() => setImageError(true)}
                    />
                  ) : tactique.TC_Publisher && partner ? (
                    <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center text-xs text-gray-600 font-semibold">
                      {partner.SH_Display_Name_FR?.charAt(0) || '?'}
                    </div>
                  ) : null}
                </div>

                <ArrowRightIcon className="h-3 w-3 text-gray-400" />

                <div className="flex items-center">
                  {inventoryLoading ? (
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : inventoryImageUrl && !inventoryError ? (
                    <img
                      src={inventoryImageUrl}
                      alt={t('dndKit.tactiqueItem.inventoryLogoAlt')}
                      className="w-8 h-8 object-contain rounded"
                      onError={() => setInventoryError(true)}
                    />
                  ) : tactique.TC_Inventory && getInventoryFromCache() ? (
                    <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center text-xs text-gray-600 font-semibold">
                      {getInventoryFromCache()?.SH_Display_Name_FR?.charAt(0) || '?'}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                {imageLoading ? (
                  <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                ) : partnerImageUrl && !imageError ? (
                  <img
                    src={partnerImageUrl}
                    alt={t('dndKit.tactiqueItem.partnerLogoAlt')}
                    className="w-10 h-10 object-contain rounded"
                    onError={() => setImageError(true)}
                  />
                ) : tactique.TC_Publisher && partner ? (
                  <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-sm text-gray-600 font-semibold">
                    {partner.SH_Display_Name_FR?.charAt(0) || '?'}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="text-sm text-gray-800 font-medium truncate">
            {tactique.TC_Label}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setCommentModalOpen(true);
            }}
            className={`ml-2 p-1 rounded hover:bg-gray-200 transition-colors ${
              tactique.TC_Comment ? 'text-blue-600' : 'text-gray-300'
            }`}
            title={tactique.TC_Comment || t('dndKit.tactiqueItem.addComment')}
          >
            <ChatBubbleLeftIcon className={`h-4 w-4 ${tactique.TC_Comment ? 'fill-blue-100' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewHistory?.(sectionId, tactique);
            }}
            className={`ml-1 p-1 rounded hover:bg-gray-200 transition-colors ${
              tactique.TC_History ? 'text-gray-300' : 'text-gray-300'
            }`}
          >
            <ClockIcon className={`h-4 w-4`} />
          </button>

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
            title={t('dndKit.tactiqueItem.addPlacement')}
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Contenu de droite : Actions et budget */}
        <div className="flex items-center space-x-4">
          {/* Actions */}
          <div className="w-12 h-6 flex items-center justify-center space-x-1">
            {isHovered && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCopyId)onCopyId(tactique.id, t('dndKit.tactiqueItem.type'), {
                      sectionId
                    })
                  }}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title={copiedId === tactique.id ? t('dndKit.common.idCopied') : t('dndKit.common.copyId')}
                >
                  <KeyIcon className={`h-3 w-3 ${copiedId === tactique.id ? 'text-green-500' : 'text-gray-300'}`} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(sectionId, tactique);
                  }}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title={t('dndKit.tactiqueItem.editTitle')}
                >
                  <PencilIcon className="h-4 w-4 text-gray-500" />
                </button>
              </>
            )}
          </div>

          <div className="text-sm font-medium">
            {formatCurrency(tactique.TC_Client_Budget_RefCurrency)}
          </div>
        </div>
      </div>

      {/* Placements avec SortableContext simple */}
      {isExpanded && (
        <div className="pl-8 pb-2 bg-white">
          {placements.length === 0 ? (
            <div className="px-4 py-2 text-xs text-gray-500 italic">
              {t('dndKit.tactiqueItem.noPlacement')}
            </div>
          ) : (
            <div 
              id={`placements-${tactique.id}`}
              className="min-h-[20px]"
            >
              <SortableContext items={placementIds} strategy={verticalListSortingStrategy}>
                {placements.map((placement, placementIndex) => (
                  <DndKitPlacementItem
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
                    onCopyId={onCopyId}
                    copiedId={copiedId}
                  />
                ))}
              </SortableContext>
            </div>
          )}
        </div>
      )}

      {/* Modal de commentaire */}
      {commentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('dndKit.tactiqueItem.commentModal.title')}
            </h3>
            <div className="mb-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={4}
                placeholder={t('dndKit.tactiqueItem.commentModal.placeholder')}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCommentCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCommentSave}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};