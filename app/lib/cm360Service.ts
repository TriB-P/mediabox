// app/lib/cm360Service.ts
/**
 * Service CM360 unifié et nettoyé
 * Gestion centralisée des tags CM360 avec interfaces unifiées
 * CORRIGÉ : Gestion cohérente des métriques et optimisations
 */

import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  deleteField,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  AdOpsTactique, 
  AdOpsPlacement, 
  AdOpsCreative,
  AdOpsCreativesData,
  CM360Status,
  CM360Filter,
  TACTIQUE_METRICS_FIELDS,
  PLACEMENT_FIELDS,
  CREATIVE_FIELDS
} from '../types/adops';

// ================================
// INTERFACES CM360
// ================================

export interface CM360TagData {
  // Métadonnées
  type: 'placement' | 'creative' | 'metrics';
  itemId: string;
  tactiqueId: string;
  
  // Données du tableau
  tableData: {
    [key: string]: any;
  };
  
  // Historique
  createdAt: string;
  version: number;
}

export interface CM360TagCreateInput {
  type: 'placement' | 'creative' | 'metrics';
  itemId: string;
  tactiqueId: string;
  tableData: {
    [key: string]: any;
  };
  campaignData: {
    campaignId: string;
    versionId: string;
    ongletId: string;
    sectionId: string;
  };
}

export interface CM360TagHistory {
  itemId: string;
  type: 'placement' | 'creative' | 'metrics';
  tags: CM360TagData[];
  latestTag?: CM360TagData;
  hasChanges?: boolean;
  changedFields?: string[];
}

// ================================
// FONCTIONS DE GESTION DES TAGS
// ================================

/**
 * Crée un nouveau tag CM360 en l'ajoutant directement au document
 */
export async function createCM360Tag(
  clientId: string,
  tagData: CM360TagCreateInput
): Promise<string> {
  try {
    const basePath = `clients/${clientId}/campaigns/${tagData.campaignData?.campaignId}/versions/${tagData.campaignData?.versionId}/onglets/${tagData.campaignData?.ongletId}/sections/${tagData.campaignData?.sectionId}/tactiques/${tagData.tactiqueId}`;
    
    let docRef;
    let existingTags: CM360TagData[] = [];
    
    if (tagData.type === 'placement') {
      docRef = doc(db, `${basePath}/placements/${tagData.itemId}`);
    } else if (tagData.type === 'creative') {
      const placementId = tagData.tableData.placementId;
      docRef = doc(db, `${basePath}/placements/${placementId}/creatifs/${tagData.itemId}`);
    } else {
      // Métriques de tactique
      docRef = doc(db, `${basePath}`);
    }
    
    // Lire le document existant
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      existingTags = data.cm360Tags || [];
    }
    
    // Créer le nouveau tag
    const newTag: CM360TagData = {
      type: tagData.type,
      itemId: tagData.itemId,
      tactiqueId: tagData.tactiqueId,
      tableData: cleanUndefinedValues(tagData.tableData),
      createdAt: new Date().toISOString(),
      version: existingTags.length + 1
    };
    
    // Ajouter le tag à la liste
    await updateDoc(docRef, {
      cm360Tags: arrayUnion(newTag)
    });
    
    console.log(`✅ Tag CM360 créé: ${tagData.type}-${tagData.itemId}-v${newTag.version}`);
    return `${tagData.type}-${tagData.itemId}-${newTag.version}`;
    
  } catch (error) {
    console.error('❌ Erreur création tag CM360:', error);
    throw error;
  }
}

/**
 * CORRIGÉE : Crée un tag pour les métriques de tactique de manière cohérente
 */
export async function createTactiqueMetricsTag(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string,
  tactiqueData: AdOpsTactique
): Promise<void> {
  try {
    const basePath = `clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueData.id}`;
    const tactiqueRef = doc(db, basePath);
    
    const tactiqueSnap = await getDoc(tactiqueRef);
    let existingTags: CM360TagData[] = [];
    
    if (tactiqueSnap.exists()) {
      const data = tactiqueSnap.data();
      existingTags = data.cm360Tags || [];
    }
    
    // Construire les données de métriques selon l'interface CM360TagData
    const metricsTableData: { [key: string]: any } = {};
    TACTIQUE_METRICS_FIELDS.forEach(field => {
      metricsTableData[field] = tactiqueData[field];
    });
    
    const metricsTag: CM360TagData = {
      type: 'metrics',
      itemId: 'tactics',
      tactiqueId: tactiqueData.id,
      tableData: cleanUndefinedValues(metricsTableData),
      createdAt: new Date().toISOString(),
      version: existingTags.length + 1
    };
    
    await updateDoc(tactiqueRef, {
      cm360Tags: arrayUnion(metricsTag)
    });
    
    console.log(`✅ Tag métriques créé pour tactique: ${tactiqueData.TC_Label} (v${metricsTag.version})`);
    
  } catch (error) {
    console.error(`❌ Erreur création tag métriques ${tactiqueData.TC_Label}:`, error);
    throw error;
  }
}

/**
 * Supprime tous les tags CM360 pour un élément spécifique
 */
export async function deleteAllCM360TagsForItem(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string,
  tactiqueId: string,
  itemId: string,
  type: 'placement' | 'creative',
  placementId?: string
): Promise<void> {
  try {
    const basePath = `clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}`;
    
    let docRef;
    if (type === 'placement') {
      docRef = doc(db, `${basePath}/placements/${itemId}`);
    } else {
      docRef = doc(db, `${basePath}/placements/${placementId}/creatifs/${itemId}`);
    }
    
    await updateDoc(docRef, {
      cm360Tags: []
    });
    
    console.log(`✅ Tags supprimés pour ${type}: ${itemId}`);
    
  } catch (error) {
    console.error(`❌ Erreur suppression tags ${type}:`, error);
    throw error;
  }
}

/**
 * Supprime tous les tags de métriques pour une tactique
 */
export async function deleteTactiqueMetricsTags(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string,
  tactiqueId: string
): Promise<void> {
  try {
    const basePath = `clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}`;
    const tactiqueRef = doc(db, basePath);
    
    await updateDoc(tactiqueRef, {
      cm360Tags: deleteField()
    });
    
    console.log(`✅ Tags métriques supprimés pour tactique: ${tactiqueId}`);
    
  } catch (error) {
    console.error(`❌ Erreur suppression métriques tactique: ${tactiqueId}`, error);
    throw error;
  }
}

// ================================
// FONCTIONS DE RÉCUPÉRATION
// ================================

/**
 * OPTIMISÉE : Récupère tous les tags CM360 pour une tactique
 */
export async function getCM360TagsForTactique(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string,
  tactiqueId: string,
  placements: AdOpsPlacement[],
  creativesData: { [placementId: string]: AdOpsCreative[] }
): Promise<Map<string, CM360TagHistory>> {
  try {
    const basePath = `clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}`;
    const tagsByItem = new Map<string, CM360TagHistory>();
    
    // 1. Récupérer les tags de métriques de la tactique
    const tactiqueRef = doc(db, basePath);
    const tactiqueSnap = await getDoc(tactiqueRef);
    
    if (tactiqueSnap.exists()) {
      const tactiqueData = tactiqueSnap.data();
      const metricsTags = tactiqueData.cm360Tags || [];
      
      if (metricsTags.length > 0) {
        const sortedTags = metricsTags.sort((a: CM360TagData, b: CM360TagData) => b.version - a.version);
        tagsByItem.set('metrics-tactics', {
          itemId: 'tactics',
          type: 'metrics',
          tags: sortedTags,
          latestTag: sortedTags[0]
        });
      }
    }
    
    // 2. Récupérer les tags des placements en parallèle
    const placementPromises = placements.map(async (placement) => {
      const placementRef = doc(db, `${basePath}/placements/${placement.id}`);
      const placementSnap = await getDoc(placementRef);
      
      if (placementSnap.exists()) {
        const placementData = placementSnap.data();
        const placementTags = placementData.cm360Tags || [];
        
        if (placementTags.length > 0) {
          const sortedTags = placementTags.sort((a: CM360TagData, b: CM360TagData) => b.version - a.version);
          tagsByItem.set(`placement-${placement.id}`, {
            itemId: placement.id,
            type: 'placement',
            tags: sortedTags,
            latestTag: sortedTags[0]
          });
        }
      }
      
      // 3. Récupérer les tags des créatifs de ce placement
      const creatives = creativesData[placement.id] || [];
      const creativePromises = creatives.map(async (creative) => {
        const creativeRef = doc(db, `${basePath}/placements/${placement.id}/creatifs/${creative.id}`);
        const creativeSnap = await getDoc(creativeRef);
        
        if (creativeSnap.exists()) {
          const creativeData = creativeSnap.data();
          const creativeTags = creativeData.cm360Tags || [];
          
          if (creativeTags.length > 0) {
            const sortedTags = creativeTags.sort((a: CM360TagData, b: CM360TagData) => b.version - a.version);
            tagsByItem.set(`creative-${creative.id}`, {
              itemId: creative.id,
              type: 'creative',
              tags: sortedTags,
              latestTag: sortedTags[0]
            });
          }
        }
      });
      
      await Promise.all(creativePromises);
    });
    
    await Promise.all(placementPromises);
    
    console.log(`✅ Tags CM360 récupérés pour tactique: ${tactiqueId} (${tagsByItem.size} éléments)`);
    return tagsByItem;
    
  } catch (error) {
    console.error(`❌ Erreur récupération tags CM360:`, error);
    return new Map();
  }
}

// ================================
// FONCTIONS DE DÉTECTION DES CHANGEMENTS
// ================================

/**
 * AMÉLIORÉE : Compare les données actuelles avec le dernier tag
 */
export function detectChanges(
  currentData: any,
  latestTag: CM360TagData,
  type: 'placement' | 'creative'
): { hasChanges: boolean; changedFields: string[] } {
  const changedFields: string[] = [];
  const tableData = latestTag.tableData;
  
  const fieldsToCheck = type === 'placement' ? PLACEMENT_FIELDS : CREATIVE_FIELDS;
  
  fieldsToCheck.forEach(field => {
    const currentValue = currentData ? currentData[field] : undefined;
    const tagValue = tableData ? tableData[field] : undefined;
    
    if (!compareValues(currentValue, tagValue)) {
      changedFields.push(field);
    }
  });
  
  return {
    hasChanges: changedFields.length > 0,
    changedFields
  };
}

/**
 * CORRIGÉE : Détecte les changements dans les métriques de tactique
 */
export function detectMetricsChanges(
  currentTactique: AdOpsTactique,
  metricsHistory?: CM360TagHistory
): { hasChanges: boolean; changedFields: string[] } {
  if (!metricsHistory?.latestTag) {
    return { hasChanges: false, changedFields: [] };
  }
  
  const changedFields: string[] = [];
  const savedData = metricsHistory.latestTag.tableData;
  
  TACTIQUE_METRICS_FIELDS.forEach(field => {
    const currentValue = currentTactique[field];
    const savedValue = savedData[field];
    
    if (!compareValues(currentValue, savedValue)) {
      changedFields.push(field);
    }
  });
  
  return {
    hasChanges: changedFields.length > 0,
    changedFields
  };
}

/**
 * OPTIMISÉE : Compare deux valeurs de manière robuste
 */
function compareValues(value1: any, value2: any): boolean {
  // Strictement égaux
  if (value1 === value2) return true;
  
  // Tous deux null/undefined
  if ((value1 == null) && (value2 == null)) return true;
  
  // Un seul null/undefined
  if ((value1 == null) !== (value2 == null)) return false;
  
  // Comparaison en string
  return String(value1).trim() === String(value2).trim();
}

// ================================
// FONCTIONS DE CALCUL DU STATUT
// ================================

/**
 * SIMPLIFIÉE : Calcule le statut CM360 d'une tactique (métriques uniquement)
 */
export function calculateTactiqueMetricsStatus(
  currentTactique: AdOpsTactique,
  metricsHistory?: CM360TagHistory
): CM360Status {
  if (!metricsHistory?.latestTag) return 'none';
  
  const changes = detectMetricsChanges(currentTactique, metricsHistory);
  return changes.hasChanges ? 'changed' : 'created';
}

/**
 * OPTIMISÉE : Calcule le statut CM360 complet d'une tactique
 */
export function calculateTactiqueFullStatus(
  cm360Tags: Map<string, CM360TagHistory>,
  placements: AdOpsPlacement[],
  creativesData: { [placementId: string]: AdOpsCreative[] }
): CM360Status {
  const allElements: string[] = [];
  
  // Collecter tous les éléments
  placements.forEach(placement => {
    allElements.push(`placement-${placement.id}`);
    const creatives = creativesData[placement.id] || [];
    creatives.forEach(creative => {
      allElements.push(`creative-${creative.id}`);
    });
  });
  
  if (allElements.length === 0) return 'none';
  
  let elementsWithTags = 0;
  let elementsWithChanges = 0;
  
  allElements.forEach(itemKey => {
    const history = cm360Tags.get(itemKey);
    if (history?.latestTag) {
      elementsWithTags++;
      if (history.hasChanges) {
        elementsWithChanges++;
      }
    }
  });
  
  // Logique de statut
  if (elementsWithTags === 0) return 'none';
  if (elementsWithChanges > 0) return 'changed';
  if (elementsWithTags === allElements.length) return 'created';
  return 'partial';
}

// ================================
// FONCTIONS UTILITAIRES
// ================================

/**
 * Obtient l'historique formaté d'un champ
 */
export function getFieldHistory(
  fieldName: string,
  tags: CM360TagData[],
  currentValue: any,
  cm360Tags?: Map<string, CM360TagHistory>
): { current: any; history: { value: any; timestamp: string; version: number }[] } {
  let relevantTags = tags;
  
  // Pour les métriques, utiliser les tags spécialisés
  if (fieldName.startsWith('TC_') && cm360Tags) {
    const metricsHistory = cm360Tags.get('metrics-tactics');
    if (metricsHistory) {
      relevantTags = metricsHistory.tags;
    }
  }
  
  const history = relevantTags
    .filter(tag => tag.tableData && tag.tableData[fieldName] !== undefined)
    .map(tag => ({
      value: tag.tableData[fieldName],
      timestamp: tag.createdAt,
      version: tag.version
    }))
    .sort((a, b) => b.version - a.version);
  
  return {
    current: currentValue,
    history
  };
}

/**
 * Nettoie un objet en supprimant les valeurs undefined
 */
function cleanUndefinedValues(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null) {
        const cleanedNested = cleanUndefinedValues(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });
  
  return cleaned;
}

// ================================
// FONCTIONS DE COMPATIBILITÉ
// ================================

/**
 * LEGACY : Maintient la compatibilité avec l'ancien format des métriques
 * À supprimer après migration complète
 */
export async function migrateOldMetricsFormat(
  clientId: string,
  campaignId: string,
  versionId: string,
  ongletId: string,
  sectionId: string,
  tactiqueId: string
): Promise<boolean> {
  try {
    const basePath = `clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}`;
    const tactiqueRef = doc(db, basePath);
    
    const tactiqueSnap = await getDoc(tactiqueRef);
    if (!tactiqueSnap.exists()) return false;
    
    const data = tactiqueSnap.data();
    
    // Vérifier s'il y a un ancien format de métriques à migrer
    const oldMetrics = data.cm360Tags;
    if (oldMetrics && typeof oldMetrics === 'object' && !Array.isArray(oldMetrics)) {
      console.log(`🔄 Migration ancien format métriques pour: ${tactiqueId}`);
      
      // Convertir en nouveau format
      const newTags: CM360TagData[] = [];
      Object.entries(oldMetrics).forEach(([index, metricData]: [string, any]) => {
        if (metricData.tactiqueMetrics) {
          newTags.push({
            type: 'metrics',
            itemId: 'tactics',
            tactiqueId: tactiqueId,
            tableData: metricData.tactiqueMetrics,
            createdAt: metricData.timestamp || new Date().toISOString(),
            version: parseInt(index) + 1
          });
        }
      });
      
      if (newTags.length > 0) {
        await updateDoc(tactiqueRef, {
          cm360Tags: newTags
        });
        console.log(`✅ Migration terminée: ${newTags.length} tags migrés`);
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error(`❌ Erreur migration métriques:`, error);
    return false;
  }
}