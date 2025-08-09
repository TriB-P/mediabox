// app/lib/cm360Service.ts
/**
 * Service CM360 simplifié - sauvegarde directement dans les documents
 * Les tags sont stockés comme des arrays dans les documents placement/créatif/tactique
 */

import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    Timestamp
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  export interface CM360TagData {
    // Métadonnées
    type: 'placement' | 'creative' | 'metrics';
    itemId: string;
    tactiqueId: string;
    
    // Données du tableau
    tableData: {
      [key: string]: any;
    };
    
    // Métriques de la tactique
    tactiqueMetrics?: {
      [key: string]: any;
    };
    
    // Historique
    createdAt: string;
    version: number;
  }
  
  export interface CM360TagHistory {
    itemId: string;
    type: 'placement' | 'creative' | 'metrics';
    tags: CM360TagData[];
    latestTag?: CM360TagData;
    hasChanges?: boolean;
    changedFields?: string[];
  }
  
  export type CM360Filter = 'all' | 'created' | 'changed' | 'none';
  
  /**
   * Crée un nouveau tag CM360 en l'ajoutant directement au document
   */
  export async function createCM360Tag(
    clientId: string,
    tagData: Omit<CM360TagData, 'createdAt' | 'version'>
  ): Promise<string> {
    try {
      const basePath = `clients/${clientId}/campaigns/${tagData.campaignData?.campaignId}/versions/${tagData.campaignData?.versionId}/onglets/${tagData.campaignData?.ongletId}/sections/${tagData.campaignData?.sectionId}/tactiques/${tagData.tactiqueId}`;
      
      let docRef;
      let existingTags: CM360TagData[] = [];
      
      if (tagData.type === 'placement') {
        docRef = doc(db, `${basePath}/placements/${tagData.itemId}`);
      } else if (tagData.type === 'creative') {
        // Trouver le placement parent du créatif
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
        ...tagData,
        createdAt: new Date().toISOString(),
        version: existingTags.length + 1
      };
      
      // Nettoyer les données
      const cleanTag = cleanUndefinedValues(newTag);
      
      // Ajouter le tag à la liste
      await updateDoc(docRef, {
        cm360Tags: arrayUnion(cleanTag)
      });
      
      // Si c'est un placement ou créatif, créer aussi un tag pour les métriques de tactique
      if (tagData.type !== 'metrics' && tagData.tactiqueMetrics) {
        await createTacticsMetricsTag(clientId, tagData);
      }
      
      return `${tagData.type}-${tagData.itemId}-${newTag.version}`;
    } catch (error) {
      console.error('Erreur lors de la création du tag CM360:', error);
      throw error;
    }
  }
  
  /**
   * Crée un tag spécial pour les métriques de tactique
   * NOUVEAU: Ne crée qu'UNE SEULE version au début, puis l'utilisateur décide quand mettre à jour
   */
  async function createTacticsMetricsTag(
    clientId: string,
    tagData: Omit<CM360TagData, 'createdAt' | 'version'>
  ): Promise<void> {
    try {
      const basePath = `clients/${clientId}/campaigns/${tagData.campaignData?.campaignId}/versions/${tagData.campaignData?.versionId}/onglets/${tagData.campaignData?.ongletId}/sections/${tagData.campaignData?.sectionId}/tactiques/${tagData.tactiqueId}`;
      const tactiqueRef = doc(db, basePath);
      
      const tactiqueSnap = await getDoc(tactiqueRef);
      let existingMetricsTags: CM360TagData[] = [];
      
      if (tactiqueSnap.exists()) {
        const data = tactiqueSnap.data();
        existingMetricsTags = data.cm360MetricsTags || [];
      }
      
      // NOUVEAU: Ne créer que si c'est la première fois (aucun tag de métriques existant)
      if (existingMetricsTags.length === 0) {
        const metricsTag: CM360TagData = {
          type: 'metrics',
          itemId: 'tactics',
          tactiqueId: tagData.tactiqueId,
          tableData: {},
          tactiqueMetrics: cleanUndefinedValues(tagData.tactiqueMetrics || {}),
          createdAt: new Date().toISOString(),
          version: 1
        };
        
        await updateDoc(tactiqueRef, {
          cm360MetricsTags: arrayUnion(metricsTag)
        });
        
        console.log('✅ Premier tag de métriques créé pour la tactique');
      } else {
        console.log('⏭️  Tags de métriques existants - pas de nouvelle version automatique');
      }
    } catch (error) {
      console.error('Erreur lors de la création du tag métriques:', error);
    }
  }
  
  /**
   * NOUVELLE FONCTION: Met à jour manuellement les métriques quand l'utilisateur confirme les changements
   */
  export async function updateMetricsTag(
    clientId: string,
    campaignId: string,
    versionId: string,
    ongletId: string,
    sectionId: string,
    tactiqueId: string,
    currentMetrics: any
  ): Promise<void> {
    try {
      const basePath = `clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}`;
      const tactiqueRef = doc(db, basePath);
      
      const tactiqueSnap = await getDoc(tactiqueRef);
      let existingMetricsTags: CM360TagData[] = [];
      
      if (tactiqueSnap.exists()) {
        const data = tactiqueSnap.data();
        existingMetricsTags = data.cm360MetricsTags || [];
      }
      
      const newVersion = existingMetricsTags.length + 1;
      
      const metricsTag: CM360TagData = {
        type: 'metrics',
        itemId: 'tactics',
        tactiqueId: tactiqueId,
        tableData: {},
        tactiqueMetrics: cleanUndefinedValues(currentMetrics),
        createdAt: new Date().toISOString(),
        version: newVersion
      };
      
      await updateDoc(tactiqueRef, {
        cm360MetricsTags: arrayUnion(metricsTag)
      });
      
      console.log(`✅ Nouvelle version de métriques créée: v${newVersion}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des métriques:', error);
      throw error;
    }
  }
  
  /**
   * Récupère tous les tags CM360 pour une tactique
   */
  export async function getCM360TagsForTactique(
    clientId: string,
    campaignId: string,
    versionId: string,
    ongletId: string,
    sectionId: string,
    tactiqueId: string,
    placements: any[],
    creativesData: { [placementId: string]: any[] }
  ): Promise<Map<string, CM360TagHistory>> {
    try {
      const basePath = `clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques/${tactiqueId}`;
      const tagsByItem = new Map<string, CM360TagHistory>();
      
      // 1. Récupérer les tags de métriques de la tactique
      const tactiqueRef = doc(db, basePath);
      const tactiqueSnap = await getDoc(tactiqueRef);
      
      if (tactiqueSnap.exists()) {
        const tactiqueData = tactiqueSnap.data();
        const metricsTags = tactiqueData.cm360MetricsTags || [];
        
        if (metricsTags.length > 0) {
          tagsByItem.set('metrics-tactics', {
            itemId: 'tactics',
            type: 'metrics',
            tags: metricsTags.sort((a: CM360TagData, b: CM360TagData) => b.version - a.version),
            latestTag: metricsTags[metricsTags.length - 1] // Le plus récent
          });
        }
      }
      
      // 2. Récupérer les tags de chaque placement
      for (const placement of placements) {
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
        
        // 3. Récupérer les tags de chaque créatif
        const creatives = creativesData[placement.id] || [];
        for (const creative of creatives) {
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
        }
      }
      
      return tagsByItem;
    } catch (error) {
      console.error('Erreur lors de la récupération des tags CM360:', error);
      return new Map();
    }
  }
  
  /**
   * Supprime TOUS les tags CM360 pour un item
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
      
      // Supprimer tous les tags en remettant un array vide
      await updateDoc(docRef, {
        cm360Tags: []
      });
      
    } catch (error) {
      console.error('Erreur lors de la suppression des tags CM360:', error);
      throw error;
    }
  }
  
  /**
   * Compare les données actuelles avec le dernier tag
   */
  export function detectChanges(
    currentData: any,
    latestTag: CM360TagData,
    type: 'placement' | 'creative'
  ): { hasChanges: boolean; changedFields: string[] } {
    const changedFields: string[] = [];
    const tableData = latestTag.tableData;
    
    if (type === 'placement') {
      const fieldsToCheck = [
        'PL_Label', 'PL_Tag_Type', 'PL_Tag_Start_Date', 'PL_Tag_End_Date',
        'PL_Rotation_Type', 'PL_Floodlight', 'PL_Third_Party_Measurement',
        'PL_VPAID', 'PL_Tag_1', 'PL_Tag_2', 'PL_Tag_3'
      ];
      
      fieldsToCheck.forEach(field => {
        const currentValue = currentData ? currentData[field] : undefined;
        const tagValue = tableData ? tableData[field] : undefined;
        
        if (currentValue !== tagValue) {
          changedFields.push(field);
        }
      });
    } else if (type === 'creative') {
      const fieldsToCheck = [
        'CR_Label', 'CR_Tag_Start_Date', 'CR_Tag_End_Date',
        'CR_Rotation_Weight', 'CR_Tag_5', 'CR_Tag_6'
      ];
      
      fieldsToCheck.forEach(field => {
        const currentValue = currentData ? currentData[field] : undefined;
        const tagValue = tableData ? tableData[field] : undefined;
        
        if (currentValue !== tagValue) {
          changedFields.push(field);
        }
      });
    }
    
    return {
      hasChanges: changedFields.length > 0,
      changedFields
    };
  }
  
  /**
   * Détecte les changements dans les métriques de tactique
   */
  export function detectMetricsChanges(
    currentMetrics: any,
    cm360Tags: Map<string, CM360TagHistory>
  ): { hasChanges: boolean; changedFields: string[] } {
    console.log('🔍 [detectMetricsChanges] Début détection');
    console.log('📊 [detectMetricsChanges] Métriques actuelles:', currentMetrics);
    console.log('📋 [detectMetricsChanges] Tags disponibles:', Array.from(cm360Tags.keys()));
    
    if (!cm360Tags || !currentMetrics) {
      console.log('❌ [detectMetricsChanges] Pas de tags ou métriques');
      return { hasChanges: false, changedFields: [] };
    }
    
    const metricsHistory = cm360Tags.get('metrics-tactics');
    console.log('📈 [detectMetricsChanges] Historique metrics-tactics:', metricsHistory);
    
    if (!metricsHistory?.latestTag?.tactiqueMetrics) {
      console.log('❌ [detectMetricsChanges] Pas de latestTag ou tactiqueMetrics');
      return { hasChanges: false, changedFields: [] };
    }
    
    console.log('💾 [detectMetricsChanges] Métriques sauvegardées:', metricsHistory.latestTag.tactiqueMetrics);
    
    const changedFields: string[] = [];
    const metricsToCheck = [
      'TC_Media_Budget', 'TC_Buy_Currency', 'TC_CM360_Rate',
      'TC_CM360_Volume', 'TC_Buy_Type'
    ];
    
    metricsToCheck.forEach(field => {
      const currentValue = currentMetrics[field];
      const tagValue = metricsHistory.latestTag!.tactiqueMetrics![field];
      
      console.log(`🔍 [detectMetricsChanges] ${field}:`, {
        current: currentValue,
        saved: tagValue,
        different: currentValue !== tagValue
      });
      
      if (currentValue !== tagValue) {
        changedFields.push(field);
        console.log(`⚠️ [detectMetricsChanges] Changement détecté pour ${field}`);
      }
    });
    
    const result = {
      hasChanges: changedFields.length > 0,
      changedFields
    };
    
    console.log('🎯 [detectMetricsChanges] Résultat final:', result);
    return result;
  }
  
  /**
   * Calcule le statut CM360 d'une tactique
   */
  export function calculateTactiqueStatus(
    cm360Tags: Map<string, CM360TagHistory>,
    placements: any[],
    creativesData: { [placementId: string]: any[] }
  ): 'none' | 'created' | 'changed' | 'partial' {
    const allElements: string[] = [];
    
    // Collecter tous les IDs
    placements.forEach(placement => {
      allElements.push(`placement-${placement.id}`);
      const creatives = creativesData[placement.id] || [];
      creatives.forEach(creative => {
        allElements.push(`creative-${creative.id}`);
      });
    });
    
    if (allElements.length === 0) return 'none';
    
    let createdCount = 0;
    let changedCount = 0;
    
    allElements.forEach(itemKey => {
      const history = cm360Tags.get(itemKey);
      if (history?.latestTag) {
        createdCount++;
        if (history.hasChanges) {
          changedCount++;
        }
      }
    });
    
    if (createdCount === 0) return 'none';
    if (changedCount > 0) return 'changed';
    if (createdCount === allElements.length) return 'created';
    return 'partial';
  }
  
  /**
   * Formate l'historique des valeurs pour un champ
   */
  export function getFieldHistory(
    fieldName: string,
    tags: CM360TagData[],
    currentValue: any,
    cm360Tags?: Map<string, CM360TagHistory>
  ): { current: any; history: { value: any; timestamp: string; version: number }[] } {
    let relevantTags = tags;
    
    if (fieldName.startsWith('TC_') && cm360Tags) {
      const metricsHistory = cm360Tags.get('metrics-tactics');
      if (metricsHistory) {
        relevantTags = metricsHistory.tags;
      }
    }
    
    const history = relevantTags
      .filter(tag => {
        const hasInTableData = tag.tableData && tag.tableData[fieldName] !== undefined;
        const hasInMetrics = tag.tactiqueMetrics && tag.tactiqueMetrics[fieldName] !== undefined;
        return hasInTableData || hasInMetrics;
      })
      .map(tag => {
        const tableValue = tag.tableData ? tag.tableData[fieldName] : undefined;
        const metricsValue = tag.tactiqueMetrics ? tag.tactiqueMetrics[fieldName] : undefined;
        
        return {
          value: tableValue !== undefined ? tableValue : metricsValue,
          timestamp: tag.createdAt,
          version: tag.version
        };
      })
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