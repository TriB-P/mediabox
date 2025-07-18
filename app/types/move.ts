// app/types/move.ts

// ==================== TYPES POUR LA FONCTIONNALITÉ DE DÉPLACEMENT ====================

import { Section, Tactique, Placement, Creatif } from './tactiques';

// ==================== DESTINATION DE DÉPLACEMENT ====================

export interface MoveDestination {
  campaignId: string;
  campaignName: string;      // Pour l'affichage dans l'UI
  versionId: string;
  versionName: string;       // Pour l'affichage dans l'UI
  ongletId: string;
  ongletName: string;        // Pour l'affichage dans l'UI
  sectionId: string;
  sectionName: string;       // Pour l'affichage dans l'UI
  tactiqueId?: string;       // Requis pour déplacer placements/créatifs
  tactiqueName?: string;     // Pour l'affichage dans l'UI
  placementId?: string;      // Requis pour déplacer créatifs
  placementName?: string;    // Pour l'affichage dans l'UI
}

// ==================== ANALYSE DE SÉLECTION ====================

export type MoveItemType = 'section' | 'tactique' | 'placement' | 'creatif';

export interface SelectedItemWithSource {
  id: string;
  type: MoveItemType;
  selectionSource: 'direct' | 'automatic';
  parentPath: string[];     // Chemin hiérarchique complet [sectionId, tactiqueId?, placementId?]
  item: Section | Tactique | Placement | Creatif; // Référence à l'objet complet
}

export interface SelectionAnalysis {
  isValid: boolean;
  canMove: boolean;
  rootElements: SelectedItemWithSource[];    // Éléments sélectionnés directement par l'utilisateur
  allElements: SelectedItemWithSource[];     // Tous les éléments (racines + enfants automatiques)
  moveLevel: MoveItemType;                   // Type d'élément à déplacer (basé sur les racines)
  targetLevel: 'onglet' | 'section' | 'tactique' | 'placement'; // Niveau de destination requis
  totalItemsToMove: number;                  // Nombre total d'éléments qui seront déplacés
  errorMessage?: string;                     // Message d'erreur si la sélection est invalide
  warningMessage?: string;                   // Message d'avertissement (optionnel)
}

// ==================== OPÉRATION DE DÉPLACEMENT ====================

export interface MoveOperation {
  sourceItems: SelectedItemWithSource[];
  destination: MoveDestination;
  operationType: MoveItemType;
  totalItemsAffected: number;
  clientId: string;                          // Client source (pour validation)
}

// ==================== VALIDATION DE DÉPLACEMENT ====================

export interface MoveValidationResult {
  isValid: boolean;
  canProceed: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];                    // Suggestions pour résoudre les problèmes
}

// ==================== RÉSULTAT DE DÉPLACEMENT ====================

export interface MoveResult {
  success: boolean;
  movedItemsCount: number;
  skippedItemsCount: number;
  errors: string[];
  warnings: string[];
  newItemIds?: { [oldId: string]: string }; // Mapping ancien ID → nouvel ID si nécessaire
}

// ==================== OPTIONS DE CASCADE POUR LE MODAL ====================

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
  metadata?: Record<string, any>;           // Données supplémentaires (budget, dates, etc.)
}

// ==================== ÉTAT DU MODAL DE DÉPLACEMENT ====================

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

// ==================== FONCTIONS UTILITAIRES TYPES ====================

export type MoveServiceFunction = (operation: MoveOperation) => Promise<MoveResult>;

export type ValidationFunction = (
  selection: SelectionAnalysis,
  destination: Partial<MoveDestination>
) => Promise<MoveValidationResult>;

// ==================== CONSTANTES ====================

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

// ==================== TYPES POUR L'INTÉGRATION ====================

// Type pour étendre les composants existants sans les casser
export interface MoveCapableSelectedItem {
  // Propriétés existantes conservées pour compatibilité
  id: string;
  isSelected?: boolean;
  
  // Nouvelles propriétés pour le déplacement
  _moveData?: {
    type: MoveItemType;
    selectionSource: 'direct' | 'automatic';
    parentPath: string[];
  };
}

// Hook type pour l'intégration dans les composants existants
export interface UseMoveOperationReturn {
  // État du modal
  modalState: MoveModalState;
  
  // Actions principales
  openMoveModal: (selection: SelectionAnalysis) => void;
  closeMoveModal: () => void;
  
  // Navigation dans le modal
  selectDestination: (level: string, itemId: string) => Promise<void>; // 🔥 CORRECTION: Promise<void>
  confirmMove: () => Promise<void>;
  
  // Validation
  analyzeSelection: (selectedItems: any[]) => SelectionAnalysis;
  validateMove: (destination: Partial<MoveDestination>) => Promise<MoveValidationResult>;
  
  // Utilitaires
  canMoveSelection: (selectedItems: any[]) => boolean;
  getMoveButtonLabel: (selectedItems: any[]) => string;
}
