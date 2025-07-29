// app/types/costGuide.ts
/**
 * Ce fichier contient les définitions de types TypeScript pour le module de guide de coûts.
 * Il inclut les interfaces pour les guides de coûts, les entrées de guide de coûts,
 * ainsi que les types de données utilisés dans les formulaires associés.
 */
export interface CostGuide {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Définit les unités d'achat possibles pour une entrée de guide de coûts.
 * @type {'PEB' | 'CPM' | 'Unitaire'}
 */
export type PurchaseUnit = 'PEB' | 'CPM' | 'Unitaire';

export interface CostGuideEntry {
  id: string;
  guideId: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  purchaseUnit: PurchaseUnit;
  unitPrice: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostGuideFormData {
  name: string;
  description: string;
}

export interface CostGuideEntryFormData {
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  purchaseUnit: PurchaseUnit;
  unitPrice: number | string;
  comment: string;
}