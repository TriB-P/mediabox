/**
 * Ce fichier définit tous les types de données, interfaces et constantes
 * utilisés pour la fonctionnalité de déplacement d'éléments (sections, tactiques,
 * placements, créatifs) au sein de la structure des campagnes.
 * Il inclut les définitions pour les destinations, les analyses de sélection,
 * les opérations de déplacement, les résultats et l'état du modal de déplacement.
 * Des fonctions utilitaires pour la construction et l'extraction de chemins hiérarchiques
 * y sont également définies.
 */
import { Section, Tactique, Placement, Creatif } from './tactiques';

export interface MoveDestination {
  campaignId: string;
  campaignName: string;
  versionId: string;
  versionName: string;
  ongletId: string;
  ongletName: string;
  sectionId?: string;
  sectionName?: string;
  tactiqueId?: string;
  tactiqueName?: string;
  placementId?: string;
  placementName?: string;
}

export type MoveItemType = 'section' | 'tactique' | 'placement' | 'creatif';

export interface SelectedItemWithSource {
  id: string;
  type: MoveItemType;
  selectionSource: 'direct' | 'automatic';
  parentPath: string[];
  item: Section | Tactique | Placement | Creatif;
}

export interface SelectionAnalysis {
  isValid: boolean;
  canMove: boolean;
  rootElements: SelectedItemWithSource[];
  allElements: SelectedItemWithSource[];
  moveLevel: MoveItemType;
  targetLevel: 'onglet' | 'section' | 'tactique' | 'placement';
  totalItemsToMove: number;
  errorMessage?: string;
  warningMessage?: string;
}

export interface MoveOperation {
  sourceItems: SelectedItemWithSource[];
  destination: MoveDestination;
  operationType: MoveItemType;
  totalItemsAffected: number;
  clientId: string;
}

export interface MoveValidationResult {
  isValid: boolean;
  canProceed: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

export interface MoveResult {
  success: boolean;
  movedItemsCount: number;
  skippedItemsCount: number;
  errors: string[];
  warnings: string[];
  newItemIds?: { [oldId: string]: string };
}

export interface CascadeLevel {
  level: 'campaign' | 'version' | 'onglet' | 'section' | 'tactique' | 'placement';
  isRequired: boolean;
  isVisible: boolean;
  items: CascadeItem[];
  selectedId: string | null;
  loading: boolean;
  searchTerm?: string;
}

export interface CascadeItem {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface MoveModalState {
  isOpen: boolean;
  step: 'destination' | 'confirmation' | 'progress' | 'result';
  selection: SelectionAnalysis | null;
  destination: Partial<MoveDestination>;
  cascadeLevels: {
    campaign: CascadeLevel;
    version: CascadeLevel;
    onglet: CascadeLevel;
    section: CascadeLevel;
    tactique: CascadeLevel;
    placement: CascadeLevel;
  };
  validation: MoveValidationResult | null;
  operation: MoveOperation | null;
  result: MoveResult | null;
  loading: boolean;
  error: string | null;
}

export type MoveServiceFunction = (operation: MoveOperation) => Promise<MoveResult>;

export type ValidationFunction = (
  selection: SelectionAnalysis,
  destination: Partial<MoveDestination>
) => Promise<MoveValidationResult>;

export const MOVE_LEVEL_HIERARCHY: Record<MoveItemType, 'onglet' | 'section' | 'tactique' | 'placement'> = {
  'section': 'onglet',
  'tactique': 'section',
  'placement': 'tactique',
  'creatif': 'placement'
};

export const MOVE_LEVEL_LABELS: Record<MoveItemType, string> = {
  'section': 'sections',
  'tactique': 'tactiques',
  'placement': 'placements',
  'creatif': 'créatifs'
};

export const TARGET_LEVEL_LABELS: Record<string, string> = {
  'onglet': 'un onglet',
  'section': 'une section',
  'tactique': 'une tactique',
  'placement': 'un placement'
};

export const ORDER_FIELDS: Record<MoveItemType, string> = {
  'section': 'SECTION_Order',
  'tactique': 'TC_Order',
  'placement': 'PL_Order',
  'creatif': 'CR_Order'
};

/**
 * Construit le chemin hiérarchique (parentPath) pour un élément donné.
 * Ce chemin est utilisé pour identifier l'emplacement d'un élément dans la structure de la campagne.
 *
 * @param itemType - Le type de l'élément (section, tactique, placement, créatif).
 * @param contextIds - Un objet contenant les IDs des parents de l'élément (campaignId, versionId, ongletId, etc.).
 * @returns Un tableau de chaînes de caractères représentant le parentPath.
 */
export function buildParentPath(
  itemType: MoveItemType,
  contextIds: {
    campaignId: string;
    versionId: string;
    ongletId: string;
    sectionId?: string;
    tactiqueId?: string;
    placementId?: string;
  }
): string[] {
  const { campaignId, versionId, ongletId, sectionId, tactiqueId, placementId } = contextIds;

  switch (itemType) {
    case 'section':
      return [campaignId, versionId, ongletId];
    case 'tactique':
      return [sectionId!, campaignId, versionId, ongletId];
    case 'placement':
      return [tactiqueId!, sectionId!, campaignId, versionId, ongletId];
    case 'creatif':
      return [placementId!, tactiqueId!, sectionId!, campaignId, versionId, ongletId];
    default:
      return [];
  }
}

/**
 * Extrait les IDs des différents niveaux hiérarchiques à partir d'un parentPath donné.
 *
 * @param itemType - Le type de l'élément auquel le parentPath appartient.
 * @param parentPath - Le tableau de chaînes de caractères représentant le parentPath.
 * @returns Un objet contenant les IDs extraits (campaignId, versionId, ongletId, etc.).
 */
export function extractIdsFromParentPath(itemType: MoveItemType, parentPath: string[]): {
  campaignId: string;
  versionId: string;
  ongletId: string;
  sectionId?: string;
  tactiqueId?: string;
  placementId?: string;
} {
  switch (itemType) {
    case 'section':
      return {
        campaignId: parentPath[0],
        versionId: parentPath[1],
        ongletId: parentPath[2]
      };
    case 'tactique':
      return {
        sectionId: parentPath[0],
        campaignId: parentPath[1],
        versionId: parentPath[2],
        ongletId: parentPath[3]
      };
    case 'placement':
      return {
        tactiqueId: parentPath[0],
        sectionId: parentPath[1],
        campaignId: parentPath[2],
        versionId: parentPath[3],
        ongletId: parentPath[4]
      };
    case 'creatif':
      return {
        placementId: parentPath[0],
        tactiqueId: parentPath[1],
        sectionId: parentPath[2],
        campaignId: parentPath[3],
        versionId: parentPath[4],
        ongletId: parentPath[5]
      };
    default:
      return {
        campaignId: '',
        versionId: '',
        ongletId: ''
      };
  }
}

export interface MoveCapableSelectedItem {
  id: string;
  isSelected?: boolean;
  _moveData?: {
    type: MoveItemType;
    selectionSource: 'direct' | 'automatic';
    parentPath: string[];
  };
}

export interface UseMoveOperationReturn {
  modalState: MoveModalState;
  openMoveModal: (selection: SelectionAnalysis) => void;
  closeMoveModal: () => void;
  selectDestination: (level: string, itemId: string) => Promise<void>;
  confirmMove: () => Promise<void>;
  analyzeSelection: (selectedItems: any[]) => SelectionAnalysis;
  validateMove: (destination: Partial<MoveDestination>) => Promise<MoveValidationResult>;
  canMoveSelection: (selectedItems: any[]) => boolean;
  getMoveButtonLabel: (selectedItems: any[]) => string;
}