// app/lib/cacheService.ts

/**
 * Service de gestion du cache localStorage OPTIMISÉ pour optimiser les performances Firebase.
 * VERSION OPTIMISÉE : Découverte intelligente + Tracking complet des appels Firebase
 * Conçu pour réduire drastiquement les appels Firebase (de milliers à quelques dizaines).
 */

import { ClientPermission } from './clientService';
import { collection, getDocs, doc, getDoc, limit, query } from 'firebase/firestore';
import { db } from './firebase';

// ========================================
// TYPES ET INTERFACES OPTIMISÉS
// ========================================

// Types pour les shortcodes
export interface ShortcodeItem {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
  SH_Display_Name_EN?: string;
  SH_Default_UTM?: string;
  SH_Logo?: string;
  SH_Type?: string;
  SH_Tags?: string[];
}

// Structure optimisée pour les listes par client
export interface OptimizedListStructure {
  [listType: string]: {
    [clientId: string]: string[]; // Array simple des IDs de shortcodes
  };
}

// Cache entry avec expiration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Configuration du cache
const CACHE_PREFIX = 'mediabox-cache-';
const CACHE_DURATION_MS = 48 * 60 * 60 * 1000; // 48 heures

// Liste des types de listes à cacher
const LIST_TYPES = [
'CA_Custom_Dim_1', 
'CA_Custom_Dim_2', 
'CA_Custom_Dim_3', 
'CA_Division', 
'CA_Quarter', 
'CA_Year', 
'TC_Prog_Buying_Method_1', 
'TC_Prog_Buying_Method_2', 
'TC_Custom_Dim_1', 
'TC_Custom_Dim_2', 
'TC_Custom_Dim_3', 
'TC_Kpi', 
'TC_LOB', 
'TC_Market', 
'TC_Media_Objective', 
'TC_Media_Type', 
'TC_Unit_Type', 
'TC_Inventory', 
'TC_Publisher',
'PL_Audience_Behaviour', 
'PL_Audience_Demographics', 
'PL_Audience_Engagement', 
'PL_Audience_Interest', 
'PL_Audience_Other', 
'PL_Creative_Grouping', 
'PL_Device', 
'PL_Market_Details', 
'PL_Product', 
'PL_Segment_Open', 
'PL_Tactic_Category', 
'PL_Targeting', 
'PL_Custom_Dim_1', 
'PL_Custom_Dim_2', 
'PL_Custom_Dim_3', 
'PL_Channel', 
'PL_Format', 
'PL_Language', 
'PL_Placement_Location', 
'CR_Custom_Dim_1', 
'CR_Custom_Dim_2', 
'CR_Custom_Dim_3', 
'CR_CTA', 
'CR_Format_Details', 
'CR_Offer', 
'CR_Plateform_Name', 
'CR_Primary_Product', 
'CR_URL', 
'CR_Version'
];

// ========================================
// SYSTÈME DE TRACKING DES APPELS FIREBASE
// ========================================

interface FirebaseCallTracker {
  totalCalls: number;
  callDetails: Array<{
    callNumber: number;
    type: 'test' | 'load';
    client: string;
    listType: string;
    path: string;
    resultCount: number;
    success: boolean;
    duration: number;
  }>;
}

let firebaseTracker: FirebaseCallTracker = {
  totalCalls: 0,
  callDetails: []
};

/**
 * Reset le tracker au début de chaque opération
 */
function resetFirebaseTracker(): void {
  firebaseTracker = {
    totalCalls: 0,
    callDetails: []
  };
  console.log('🔥 [FIREBASE TRACKER] Tracker réinitialisé');
}

/**
 * Enregistre un appel Firebase avec tous les détails
 */
function trackFirebaseCall(
  type: 'test' | 'load',
  client: string,
  listType: string,
  resultCount: number,
  success: boolean,
  duration: number
): void {
  firebaseTracker.totalCalls++;
  
  const callDetail = {
    callNumber: firebaseTracker.totalCalls,
    type,
    client,
    listType,
    path: `lists/${listType}/clients/${client}/shortcodes`,
    resultCount,
    success,
    duration
  };
  
  firebaseTracker.callDetails.push(callDetail);
  
  // Log détaillé pour chaque appel
  

}

/**
 * Affiche le rapport final des appels Firebase
 */
function showFirebaseReport(): void {
  console.log('\n📊 [RAPPORT FIREBASE] ===================================');
  console.log(`🔥 TOTAL D'APPELS FIREBASE: ${firebaseTracker.totalCalls}`);
  
  // Grouper par type
  const testCalls = firebaseTracker.callDetails.filter(c => c.type === 'test');
  const loadCalls = firebaseTracker.callDetails.filter(c => c.type === 'load');
  
  
  
  // Grouper par client
  const clientStats: { [client: string]: { tests: number, loads: number, totalItems: number } } = {};
  
  firebaseTracker.callDetails.forEach(call => {
    if (!clientStats[call.client]) {
      clientStats[call.client] = { tests: 0, loads: 0, totalItems: 0 };
    }
    
    if (call.type === 'test') {
      clientStats[call.client].tests++;
    } else {
      clientStats[call.client].loads++;
      clientStats[call.client].totalItems += call.resultCount;
    }
  });
  
  console.log('\n👥 [DÉTAIL PAR CLIENT] ===================================');
  Object.entries(clientStats).forEach(([client, stats]) => {
    console.log(
      `${client}: ${stats.tests} tests + ${stats.loads} chargements = ` +
      `${stats.tests + stats.loads} appels (${stats.totalItems} items)`
    );
  });
  
  // Calcul des économies
  const uniqueClients = Object.keys(clientStats).filter(c => c !== 'PlusCo');
  const estimatedOldWay = uniqueClients.length * LIST_TYPES.length + LIST_TYPES.length; // Clients * listes + PlusCo
  const actualCalls = firebaseTracker.totalCalls;
  const savedCalls = estimatedOldWay - actualCalls;
  const savingPercent = Math.round((savedCalls / estimatedOldWay) * 100);
  
  console.log('\n💰 [ÉCONOMIES] ===================================');
  console.log(`Ancienne méthode aurait fait: ${estimatedOldWay} appels`);
  console.log(`Nouvelle méthode a fait: ${actualCalls} appels`);
  console.log(`🎉 ÉCONOMIE: ${savedCalls} appels (${savingPercent}%)`);
  console.log('================================================\n');
}

// ========================================
// FONCTION HELPER POUR ÉVÉNEMENTS DE PROGRÈS
// ========================================

function emitProgress(event: {
  type: 'step-start' | 'step-complete' | 'step-error' | 'details-update' | 'cache-complete' | 'cache-error';
  stepId: string;
  stepLabel?: string;
  details?: string;
  progress?: number;
  error?: string;
}) {
  try {
    const customEvent = new CustomEvent('cache-progress', { detail: event });
    window.dispatchEvent(customEvent);
  } catch (error) {
    // Silencieusement ignorer si window n'est pas disponible (SSR)
  }
}

// ========================================
// CLÉS DE CACHE
// ========================================

function getClientCacheKey(userEmail: string): string {
  return `${CACHE_PREFIX}clients-${userEmail}`;
}

function getAllShortcodesCacheKey(): string {
  return `${CACHE_PREFIX}all-shortcodes`;
}

function getOptimizedListsCacheKey(): string {
  return `${CACHE_PREFIX}optimized-lists`;
}

// ========================================
// FONCTION UTILITAIRE POUR VALIDATION CACHE
// ========================================

function isCacheEntryValid<T>(cacheEntry: CacheEntry<T>): boolean {
  const now = Date.now();
  return now < cacheEntry.expiresAt;
}

// ========================================
// FONCTIONS DE CACHE CLIENTS (INCHANGÉES)
// ========================================

export function cacheUserClients(clients: ClientPermission[], userEmail: string): boolean {
  try {
    emitProgress({
      type: 'step-start',
      stepId: 'clients',
      details: `Sauvegarde de ${clients.length} clients...`
    });

    const now = Date.now();
    const cacheEntry: CacheEntry<ClientPermission[]> = {
      data: clients,
      timestamp: now,
      expiresAt: now + CACHE_DURATION_MS
    };

    const cacheKey = getClientCacheKey(userEmail);
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    
    console.log(`[CACHE] Clients stockés pour ${userEmail} (${clients.length} clients, expire dans 168h)`);
    
    emitProgress({
      type: 'step-complete',
      stepId: 'clients',
      details: `${clients.length} clients sauvegardés`
    });

    return true;
  } catch (error) {
    console.error('[CACHE] Erreur lors du stockage des clients:', error);
    
    emitProgress({
      type: 'step-error',
      stepId: 'clients',
      error: 'Erreur lors de la sauvegarde des clients'
    });

    return false;
  }
}

export function getCachedUserClients(userEmail: string): ClientPermission[] | null {
  try {
    const cacheKey = getClientCacheKey(userEmail);
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) {
      console.log(`[CACHE] Aucun cache trouvé pour ${userEmail}`);
      return null;
    }

    const cacheEntry: CacheEntry<ClientPermission[]> = JSON.parse(cachedData);
    
    if (!isCacheEntryValid(cacheEntry)) {
      console.log(`[CACHE] Cache expiré pour ${userEmail}, suppression`);
      localStorage.removeItem(cacheKey);
      return null;
    }

    console.log(`[CACHE] Clients récupérés du cache pour ${userEmail} (${cacheEntry.data.length} clients)`);
    return cacheEntry.data;
  } catch (error) {
    console.error('[CACHE] Erreur lors de la lecture du cache clients:', error);
    const cacheKey = getClientCacheKey(userEmail);
    localStorage.removeItem(cacheKey);
    return null;
  }
}

// ========================================
// FONCTIONS FIREBASE AVEC TRACKING
// ========================================

/**
 * Test rapide pour voir si un client a des personnalisations pour un type de liste.
 * AVEC TRACKING COMPLET.
 */
async function hasCustomListForClient(listType: string, clientId: string): Promise<boolean> {
  const startTime = Date.now();
  
  try {
    const shortcodesRef = collection(db, 'lists', listType, 'clients', clientId, 'shortcodes');
    const testQuery = query(shortcodesRef, limit(1));
    const snapshot = await getDocs(testQuery);
    
    const duration = Date.now() - startTime;
    const hasData = !snapshot.empty;
    const resultCount = hasData ? 1 : 0;
    
    trackFirebaseCall('test', clientId, listType, resultCount, true, duration);
    
    return hasData;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    trackFirebaseCall('test', clientId, listType, 0, false, duration);
    
    console.error(`❌ [ERREUR TEST] ${clientId}/${listType}:`, error);
    return false;
  }
}

/**
 * Récupère les IDs des shortcodes pour une liste et un client donnés.
 * AVEC TRACKING COMPLET.
 */
async function getShortcodeIdsForList(listType: string, clientId: string): Promise<string[]> {
  const startTime = Date.now();
  
  try {
    const shortcodesRef = collection(db, 'lists', listType, 'clients', clientId, 'shortcodes');
    const snapshot = await getDocs(shortcodesRef);
    
    const duration = Date.now() - startTime;
    const resultIds = snapshot.docs.map(doc => doc.id);
    
    trackFirebaseCall('load', clientId, listType, resultIds.length, true, duration);
    
    return resultIds;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    trackFirebaseCall('load', clientId, listType, 0, false, duration);
    
    console.error(`❌ [ERREUR LOAD] ${clientId}/${listType}:`, error);
    return [];
  }
}

/**
 * Découvre toutes les personnalisations d'un client de manière optimisée.
 * AVEC LOGS DÉTAILLÉS.
 */
async function discoverClientCustomizations(clientId: string): Promise<string[]> {
  try {
    

    
    // ÉTAPE 2: Si des personnalisations trouvées, tester toutes les autres listes
    const remainingListTypes = LIST_TYPES;
    
    
    const remainingTests = await Promise.all(
      remainingListTypes.map(async (listType) => ({
        listType,
        hasCustom: await hasCustomListForClient(listType, clientId)
      }))
    );
    
    const remainingCustomizations = remainingTests
      .filter(test => test.hasCustom)
      .map(test => test.listType);
    
    const allCustomizations = [ ...remainingCustomizations];

    return allCustomizations;
    
  } catch (error) {
    console.error(`❌ [DÉCOUVERTE ${clientId}] ERREUR:`, error);
    return [];
  }
}

// ========================================
// NOUVELLES FONCTIONS OPTIMISÉES
// ========================================

/**
 * ÉTAPE 1: Charge TOUS les shortcodes en une seule fois depuis Firebase.
 * C'est l'optimisation clé : 1 seul appel au lieu de milliers.
 */
async function loadAllShortcodes(): Promise<{ [shortcodeId: string]: ShortcodeItem }> {
  try {
    emitProgress({
      type: 'step-start',
      stepId: 'global-lists',
      details: 'Chargement de tous les shortcodes...'
    });

    console.log('[CACHE] Chargement de TOUS les shortcodes en une fois...');
    
    const shortcodesRef = collection(db, 'shortcodes');
    console.log("FIREBASE: LECTURE - Fichier: cacheService.ts - Fonction: loadAllShortcodes - Path: shortcodes (COLLECTION COMPLÈTE)");
    const snapshot = await getDocs(shortcodesRef);
    
    const allShortcodes: { [shortcodeId: string]: ShortcodeItem } = {};
    let processedCount = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      allShortcodes[doc.id] = {
        id: doc.id,
        SH_Code: data.SH_Code || doc.id,
        SH_Display_Name_FR: data.SH_Display_Name_FR || data.SH_Code || doc.id,
        SH_Display_Name_EN: data.SH_Display_Name_EN,
        SH_Default_UTM: data.SH_Default_UTM,
        SH_Logo: data.SH_Logo,
        SH_Type: data.SH_Type,
        SH_Tags: data.SH_Tags || [],
      };
      
      processedCount++;
      if (processedCount % 500 === 0) {
        emitProgress({
          type: 'details-update',
          stepId: 'global-lists',
          details: `${processedCount} shortcodes traités...`
        });
      }
    });

    console.log(`[CACHE] ${Object.keys(allShortcodes).length} shortcodes chargés en une seule fois!`);
    
    // Sauvegarder dans le cache
    const now = Date.now();
    const cacheEntry: CacheEntry<{ [shortcodeId: string]: ShortcodeItem }> = {
      data: allShortcodes,
      timestamp: now,
      expiresAt: now + CACHE_DURATION_MS
    };

    const cacheKey = getAllShortcodesCacheKey();
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

    emitProgress({
      type: 'step-complete',
      stepId: 'global-lists',
      details: `${Object.keys(allShortcodes).length} shortcodes chargés`
    });

    return allShortcodes;

  } catch (error) {
    console.error('[CACHE] Erreur lors du chargement des shortcodes:', error);
    emitProgress({
      type: 'step-error',
      stepId: 'global-lists',
      error: 'Erreur lors du chargement des shortcodes'
    });
    return {};
  }
}

/**
 * NOUVELLE VERSION OPTIMISÉE: Construit la structure des listes pour tous les clients.
 * AVEC TRACKING COMPLET ET LOGS DÉTAILLÉS.
 */
async function buildOptimizedListStructure(clientIds: string[]): Promise<OptimizedListStructure> {
  try {
    console.log(`👥 Clients à analyser: ${clientIds.join(', ')}`);
    console.log(`📋 Types de listes totaux: ${LIST_TYPES.length}`);
    
    // Réinitialiser le tracker
    resetFirebaseTracker();
    
    emitProgress({
      type: 'step-start',
      stepId: 'client-overrides',
    });

    const optimizedStructure: OptimizedListStructure = {};
    
    // ÉTAPE 1: Découvrir les personnalisations de chaque client
    
    const clientCustomizations: { [clientId: string]: string[] } = {};
    
    for (let i = 0; i < clientIds.length; i++) {
      const clientId = clientIds[i];
      
      emitProgress({
        type: 'details-update',
        stepId: 'client-overrides',
        details: `Découverte ${clientId} (${i + 1}/${clientIds.length})...`
      });
      
      clientCustomizations[clientId] = await discoverClientCustomizations(clientId);
    }
    
    // ÉTAPE 2: Charger les listes PlusCo
    
    emitProgress({
      type: 'details-update',
      stepId: 'client-overrides',
      details: 'Chargement des listes PlusCo...'
    });
    
    for (let i = 0; i < LIST_TYPES.length; i++) {
      const listType = LIST_TYPES[i];
      
      if (!optimizedStructure[listType]) {
        optimizedStructure[listType] = {};
      }
      
      const shortcodeIds = await getShortcodeIdsForList(listType, 'PlusCo');
      if (shortcodeIds.length > 0) {
        optimizedStructure[listType]['PlusCo'] = shortcodeIds;
      }
    }
    
    // ÉTAPE 3: Charger seulement les listes personnalisées trouvées
    
    let totalPersonalizedLists = 0;
    Object.values(clientCustomizations).forEach(lists => totalPersonalizedLists += lists.length);
    
    
    let processedLists = 0;
    
    for (const [clientId, customizedListTypes] of Object.entries(clientCustomizations)) {
      if (customizedListTypes.length === 0) {
        continue;
      }
      
      
      emitProgress({
        type: 'details-update',
        stepId: 'client-overrides',
        details: `Chargement ${clientId}: ${customizedListTypes.length} listes personnalisées...`
      });
      
      // Charger les listes personnalisées en séquentiel pour voir les logs
      for (const listType of customizedListTypes) {
        const shortcodeIds = await getShortcodeIdsForList(listType, clientId);
        
        if (!optimizedStructure[listType]) {
          optimizedStructure[listType] = {};
        }
        
        if (shortcodeIds.length > 0) {
          optimizedStructure[listType][clientId] = shortcodeIds;
        }
        
        processedLists++;
      }
      
      emitProgress({
        type: 'details-update',
        stepId: 'client-overrides',
        details: `Progression: ${processedLists}/${totalPersonalizedLists} listes chargées...`
      });
    }

    // ÉTAPE 4: Sauvegarder la structure
    const now = Date.now();
    const cacheEntry: CacheEntry<OptimizedListStructure> = {
      data: optimizedStructure,
      timestamp: now,
      expiresAt: now + CACHE_DURATION_MS
    };

    const cacheKey = getOptimizedListsCacheKey();
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

    // RAPPORT FINAL DÉTAILLÉ
    showFirebaseReport();

    emitProgress({
      type: 'step-complete',
      stepId: 'client-overrides',
      details: `Structure optimisée construite (${firebaseTracker.totalCalls} appels Firebase)`
    });

    return optimizedStructure;

  } catch (error) {
    console.error('❌ [CACHE OPTIMISÉ] Erreur construction structure:', error);
    showFirebaseReport();
    emitProgress({
      type: 'step-error',
      stepId: 'client-overrides',
      error: 'Erreur lors de la construction optimisée'
    });
    return {};
  }
}

/**
 * FONCTION PRINCIPALE OPTIMISÉE: Cache tous les shortcodes et listes pour les clients.
 */
export async function cacheAllListsForClients(clientIds: string[]): Promise<boolean> {
  try {
    console.log(`[CACHE] NOUVELLE VERSION OPTIMISÉE - Début cache pour ${clientIds.length} clients`);
    
    // ÉTAPE 1: Charger TOUS les shortcodes en une fois
    const allShortcodes = await loadAllShortcodes();
    if (Object.keys(allShortcodes).length === 0) {
      console.error('[CACHE] Aucun shortcode chargé - arrêt');
      return false;
    }

    // ÉTAPE 2: Construire la structure optimisée des listes
    const optimizedStructure = await buildOptimizedListStructure(clientIds);

    // ÉTAPE 3: Finalisation
    emitProgress({
      type: 'step-start',
      stepId: 'cache-save',
      details: 'Finalisation de la sauvegarde...'
    });

    emitProgress({
      type: 'step-complete',
      stepId: 'cache-save',
      details: 'Cache optimisé sauvegardé avec succès'
    });

    console.log(`[CACHE] OPTIMISÉ - Terminé avec succès!`);
    console.log(`[CACHE] - ${Object.keys(allShortcodes).length} shortcodes`);
    console.log(`[CACHE] - ${Object.keys(optimizedStructure).length} types de listes`);
    
    emitProgress({
      type: 'cache-complete',
      stepId: 'cache-save',
      details: 'Initialisation terminée avec succès!'
    });

    return true;

  } catch (error) {
    console.error('[CACHE] Erreur cache optimisé:', error);
    
    emitProgress({
      type: 'cache-error',
      stepId: 'global-lists',
      error: `Erreur lors de l'initialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    });

    return false;
  }
}

// ========================================
// FONCTIONS DE RÉCUPÉRATION OPTIMISÉES
// ========================================

/**
 * Récupère tous les détails des shortcodes depuis le cache.
 */
export function getCachedAllShortcodes(): { [shortcodeId: string]: ShortcodeItem } | null {
  try {
    const cacheKey = getAllShortcodesCacheKey();
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;

    const cacheEntry: CacheEntry<{ [shortcodeId: string]: ShortcodeItem }> = JSON.parse(cachedData);
    
    if (!isCacheEntryValid(cacheEntry)) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return cacheEntry.data;
  } catch (error) {
    console.error('[CACHE] Erreur lecture shortcodes:', error);
    return null;
  }
}

/**
 * Récupère la structure optimisée des listes depuis le cache.
 */
export function getCachedOptimizedLists(): OptimizedListStructure | null {
  try {
    const cacheKey = getOptimizedListsCacheKey();
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;

    const cacheEntry: CacheEntry<OptimizedListStructure> = JSON.parse(cachedData);
    if (!isCacheEntryValid(cacheEntry)) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return cacheEntry.data;
  } catch (error) {
    console.error('[CACHE] Erreur lecture listes optimisées:', error);
    return null;
  }
}

/**
 * Récupère une liste spécifique pour un client (avec fallback sur PlusCo).
 */
export function getListForClient(listType: string, clientId: string): ShortcodeItem[] | null {
  try {
    const allShortcodes = getCachedAllShortcodes();
    const optimizedLists = getCachedOptimizedLists();
    
    if (!allShortcodes || !optimizedLists) return null;

    const listStructure = optimizedLists[listType];
    if (!listStructure) return null;

    // Essayer d'abord la version client
    let shortcodeIds: string[] = [];
    
    if (listStructure[clientId]) {
      shortcodeIds = listStructure[clientId]; // Directement l'array!
    } else if (listStructure['PlusCo']) {
      shortcodeIds = listStructure['PlusCo']; // Directement l'array!
    }

    if (shortcodeIds.length === 0) return null;

    // Construire la liste avec les détails complets
    const result: ShortcodeItem[] = [];
    shortcodeIds.forEach(id => {
      if (allShortcodes[id]) {
        result.push(allShortcodes[id]);
      }
    });

    return result.sort((a, b) =>
      a.SH_Display_Name_FR.localeCompare(b.SH_Display_Name_FR, 'fr', { sensitivity: 'base' })
    );

  } catch (error) {
    console.error(`[CACHE] Erreur récupération liste ${listType} pour client ${clientId}:`, error);
    return null;
  }
}

// ========================================
// FONCTIONS DE GESTION INTELLIGENTE DU CACHE
// ========================================

/**
 * Compare deux listes de clients pour détecter les changements.
 */
function haveClientsChanged(currentClients: ClientPermission[], cachedClients: ClientPermission[]): boolean {
  if (currentClients.length !== cachedClients.length) {
    return true;
  }

  const currentIds = currentClients.map(c => c.clientId).sort();
  const cachedIds = cachedClients.map(c => c.clientId).sort();

  for (let i = 0; i < currentIds.length; i++) {
    if (currentIds[i] !== cachedIds[i]) {
      return true;
    }
  }

  return false;
}

/**
 * Vérifie si le cache des shortcodes est encore valide.
 */
function areShortcodesStillFresh(): boolean {
  try {
    const cacheKey = getAllShortcodesCacheKey();
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return false;

    const cacheEntry: CacheEntry<{ [shortcodeId: string]: ShortcodeItem }> = JSON.parse(cachedData);
    return isCacheEntryValid(cacheEntry);
  } catch (error) {
    console.error('[CACHE] Erreur vérification fraîcheur shortcodes:', error);
    return false;
  }
}

/**
 * Vérifie si la structure des listes est encore valide.
 */
function areListsStillFresh(): boolean {
  try {
    const cacheKey = getOptimizedListsCacheKey();
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return false;

    const cacheEntry: CacheEntry<OptimizedListStructure> = JSON.parse(cachedData);
    return isCacheEntryValid(cacheEntry);
  } catch (error) {
    console.error('[CACHE] Erreur vérification fraîcheur listes:', error);
    return false;
  }
}

/**
 * NOUVELLE VERSION du refresh rapide optimisé.
 * AVEC TRACKING COMPLET.
 */
async function refreshListsOnly(clientIds: string[]): Promise<boolean> {
  try {
    console.log('\n🔄 [REFRESH RAPIDE] Début avec découverte intelligente...');
    
    emitProgress({
      type: 'step-start',
      stepId: 'client-overrides',
      details: 'Mise à jour optimisée des listes client...'
    });

    const optimizedStructure = await buildOptimizedListStructure(clientIds);
    
    emitProgress({
      type: 'step-complete',
      stepId: 'client-overrides',
      details: 'Listes mises à jour avec optimisation'
    });

    console.log('✅ [REFRESH RAPIDE] Terminé avec succès');
    return Object.keys(optimizedStructure).length > 0;

  } catch (error) {
    console.error('❌ [REFRESH RAPIDE] Erreur:', error);
    emitProgress({
      type: 'step-error',
      stepId: 'client-overrides',
      error: 'Erreur lors de la mise à jour optimisée'
    });
    return false;
  }
}

/**
 * FONCTION PRINCIPALE INTELLIGENTE: Décide quoi mettre à jour selon le contexte.
 */
export async function smartCacheUpdate(currentClients: ClientPermission[], userEmail: string): Promise<boolean> {
  try {
    const clientIds = currentClients.map(c => c.clientId);
    
    // 1. Vérifier le cache des clients existants
    const cachedClients = getCachedUserClients(userEmail);
    
    // 2. Vérifier la fraîcheur des caches
    const shortcodesFresh = areShortcodesStillFresh();
    const listsFresh = areListsStillFresh();
    
    console.log(`[CACHE] État actuel - Shortcodes: ${shortcodesFresh ? 'frais' : 'périmés'}, Listes: ${listsFresh ? 'fraîches' : 'périmées'}`);

    // 3. Décider de la stratégie
    if (!shortcodesFresh || !listsFresh) {
      // Cache périmé (168h+) ou absent → Refresh complet
      console.log('[CACHE] Refresh complet nécessaire (cache périmé ou absent)');
      
      emitProgress({
        type: 'step-start',
        stepId: 'global-lists',
        details: 'Mise à jour complète du cache...'
      });

      return await cacheAllListsForClients(clientIds);
      
    } else if (!cachedClients || haveClientsChanged(currentClients, cachedClients)) {
      // Clients ont changé mais caches encore frais → Refresh seulement les listes
      console.log('[CACHE] Clients modifiés - refresh rapide des listes');
      
      // Mettre à jour le cache des clients
      cacheUserClients(currentClients, userEmail);
      
      // Refresh seulement les listes
      const success = await refreshListsOnly(clientIds);
      
      if (success) {
        emitProgress({
          type: 'cache-complete',
          stepId: 'client-overrides',
          details: 'Mise à jour rapide terminée!'
        });
      }
      
      return success;
      
    } else {
      // Tout est à jour → Aucun refresh nécessaire!
      console.log('[CACHE] Cache à jour - aucun refresh nécessaire 🚀');
      
      emitProgress({
        type: 'step-start',
        stepId: 'auth',
        details: 'Vérification du cache...'
      });
      
      emitProgress({
        type: 'step-complete',
        stepId: 'auth',
        details: 'Cache valide'
      });
      
      emitProgress({
        type: 'cache-complete',
        stepId: 'auth',
        details: 'Données chargées depuis le cache!'
      });
      
      return true;
    }

  } catch (error) {
    console.error('[CACHE] Erreur smart cache update:', error);
    emitProgress({
      type: 'cache-error',
      stepId: 'global-lists',
      error: 'Erreur lors de la mise à jour intelligente'
    });
    return false;
  }
}

// ========================================
// FONCTIONS DE NETTOYAGE
// ========================================

export function clearAllCache(): number {
  try {
    let removedCount = 0;
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      removedCount++;
    });
    
    console.log(`[CACHE] ${removedCount} entrées de cache supprimées`);
    return removedCount;
  } catch (error) {
    console.error('[CACHE] Erreur lors de la suppression complète du cache:', error);
    return 0;
  }
}

/**
 * Force un refresh complet du cache (supprime tout et recharge).
 */
export async function forceRefreshCache(currentClients: ClientPermission[], userEmail: string): Promise<boolean> {
  try {
    console.log('[CACHE] Force refresh - suppression de tout le cache...');
    
    // Supprimer tout le cache
    clearAllCache();
    
    // Recharger complètement
    const clientIds = currentClients.map(c => c.clientId);
    
    // Cacher les clients
    cacheUserClients(currentClients, userEmail);
    
    // Charger tout depuis Firebase
    return await cacheAllListsForClients(clientIds);
    
  } catch (error) {
    console.error('[CACHE] Erreur force refresh:', error);
    return false;
  }
}