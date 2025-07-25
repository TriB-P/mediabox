// app/lib/cacheService.ts

/**
 * Service de gestion du cache localStorage OPTIMISÉ pour optimiser les performances Firebase.
 * NOUVELLE VERSION : Charge TOUS les shortcodes en une seule fois, puis structure les listes.
 * Conçu pour réduire drastiquement les appels Firebase (de milliers à quelques dizaines).
 */

import { ClientPermission } from './clientService';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
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
  'CA_Division',
  'TC_Publisher', 
  'CA_Custom_Dim_1',
  'CA_Custom_Dim_2',
  'CA_Custom_Dim_3',
  'TC_Custom_Dim_1',
  'TC_Custom_Dim_2',
  'TC_Custom_Dim_3'
];

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
    
    console.log(`[CACHE] Clients stockés pour ${userEmail} (${clients.length} clients, expire dans 48h)`);
    
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
 * ÉTAPE 2: Récupère les IDs des shortcodes pour une liste et un client donnés.
 * Maintenant optimisé pour ne récupérer que les IDs, pas les détails.
 */
async function getShortcodeIdsForList(listType: string, clientId: string): Promise<string[]> {
  try {
    console.log(`FIREBASE: LECTURE - Fichier: cacheService.ts - Fonction: getShortcodeIdsForList - Path: lists/${listType}/clients/${clientId}/shortcodes`);
    
    const shortcodesRef = collection(db, 'lists', listType, 'clients', clientId, 'shortcodes');
    const snapshot = await getDocs(shortcodesRef);
    
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error(`Erreur récupération IDs ${listType}/${clientId}:`, error);
    return [];
  }
}

/**
 * ÉTAPE 3: Construit la structure optimisée des listes pour tous les clients.
 */
async function buildOptimizedListStructure(clientIds: string[]): Promise<OptimizedListStructure> {
  try {
    emitProgress({
      type: 'step-start',
      stepId: 'client-overrides',
      details: 'Construction de la structure des listes...'
    });

    const optimizedStructure: OptimizedListStructure = {};

    // Pour chaque type de liste
    for (let listIndex = 0; listIndex < LIST_TYPES.length; listIndex++) {
      const listType = LIST_TYPES[listIndex];
      
      emitProgress({
        type: 'details-update',
        stepId: 'client-overrides',
        details: `Traitement ${listType} (${listIndex + 1}/${LIST_TYPES.length})...`
      });

      optimizedStructure[listType] = {};

      // Pour chaque client + PlusCo
      const allClientIds = [...clientIds, 'PlusCo'];
      
      for (let clientIndex = 0; clientIndex < allClientIds.length; clientIndex++) {
        const clientId = allClientIds[clientIndex];
        
        emitProgress({
          type: 'details-update',
          stepId: 'client-overrides',
          details: `${listType}: ${clientId} (${clientIndex + 1}/${allClientIds.length})...`
        });

        const shortcodeIds = await getShortcodeIdsForList(listType, clientId);
        
        if (shortcodeIds.length > 0) {
          optimizedStructure[listType][clientId] = shortcodeIds; // Array simple!
          
          console.log(`[CACHE] ${listType}/${clientId}: ${shortcodeIds.length} shortcodes`);
        }
      }
    }

    // Sauvegarder la structure
    const now = Date.now();
    const cacheEntry: CacheEntry<OptimizedListStructure> = {
      data: optimizedStructure,
      timestamp: now,
      expiresAt: now + CACHE_DURATION_MS
    };

    const cacheKey = getOptimizedListsCacheKey();
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

    emitProgress({
      type: 'step-complete',
      stepId: 'client-overrides',
      details: 'Structure des listes construite'
    });

    return optimizedStructure;

  } catch (error) {
    console.error('[CACHE] Erreur construction structure:', error);
    emitProgress({
      type: 'step-error',
      stepId: 'client-overrides',
      error: 'Erreur lors de la construction des listes'
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
      console.log(`[CACHE] Liste ${listType} pour client ${clientId}: ${shortcodeIds.length} items`);
    } else if (listStructure['PlusCo']) {
      shortcodeIds = listStructure['PlusCo']; // Directement l'array!
      console.log(`[CACHE] Liste ${listType} pour client ${clientId} (fallback PlusCo): ${shortcodeIds.length} items`);
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
 * @param currentClients Clients actuels depuis Firebase
 * @param cachedClients Clients en cache
 * @returns true si les clients ont changé
 */
function haveClientsChanged(currentClients: ClientPermission[], cachedClients: ClientPermission[]): boolean {
  if (currentClients.length !== cachedClients.length) {
    return true;
  }

  // Comparer les IDs des clients (version compatible ES5)
  const currentIds = currentClients.map(c => c.clientId).sort();
  const cachedIds = cachedClients.map(c => c.clientId).sort();

  // Comparer les arrays triés
  for (let i = 0; i < currentIds.length; i++) {
    if (currentIds[i] !== cachedIds[i]) {
      return true;
    }
  }

  return false;
}

/**
 * Vérifie si le cache des shortcodes est encore valide (moins de 48h).
 * @returns true si le cache des shortcodes est valide
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
 * @returns true si la structure des listes est valide
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
 * Refresh seulement la structure des listes (rapide - pas les shortcodes).
 * Utilisé quand les clients ont changé mais les shortcodes sont encore frais.
 */
async function refreshListsOnly(clientIds: string[]): Promise<boolean> {
  try {
    console.log('[CACHE] Refresh rapide - seulement les listes...');
    
    emitProgress({
      type: 'step-start',
      stepId: 'client-overrides',
      details: 'Mise à jour des listes client...'
    });

    const optimizedStructure = await buildOptimizedListStructure(clientIds);
    
    emitProgress({
      type: 'step-complete',
      stepId: 'client-overrides',
      details: 'Listes mises à jour'
    });

    console.log('[CACHE] Refresh rapide terminé avec succès');
    return Object.keys(optimizedStructure).length > 0;

  } catch (error) {
    console.error('[CACHE] Erreur refresh rapide:', error);
    emitProgress({
      type: 'step-error',
      stepId: 'client-overrides',
      error: 'Erreur lors de la mise à jour des listes'
    });
    return false;
  }
}

/**
 * FONCTION PRINCIPALE INTELLIGENTE: Décide quoi mettre à jour selon le contexte.
 * @param currentClients Clients actuels depuis Firebase
 * @param userEmail Email de l'utilisateur
 * @returns true si le cache est à jour
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
      // Cache périmé (48h+) ou absent → Refresh complet
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
 * Utile pour un bouton "Actualiser" dans l'interface.
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