// app/brief-intelligence/utils/storageHelper.ts
/**
 * Helpers pour gérer le stockage des sessions Brief Intelligence dans localStorage
 * Gère la sérialisation, désérialisation, et les opérations CRUD sur les sessions
 */

import { BriefSession, ChatMessage, FieldStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONSTANTES
// ============================================================================

const STORAGE_KEY = 'mediabox-brief-sessions';
const MAX_SESSIONS = 10; // Limite du nombre de sessions stockées
const SESSION_EXPIRY_DAYS = 30; // Sessions expirées après 30 jours
const MAX_STORAGE_SIZE = 4.5 * 1024 * 1024; // 4.5 MB (localStorage limit ~5MB)

// ============================================================================
// TYPES HELPERS
// ============================================================================

interface StorageData {
  sessions: Record<string, BriefSession>;
  lastCleanup: number;
}

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Crée une nouvelle session vide
 * @returns Nouvelle session initialisée
 */
export function createNewSession(): BriefSession {
  const now = Date.now();
  
  return {
    id: uuidv4(),
    adcpData: {},
    conversation: [],
    fieldStatuses: {},
    missingFields: [],
    completeness: 0,
    isComplete: false,
    createdAt: now,
    updatedAt: now,
    uiState: {
      isPdfAnalyzing: false,
      isChatLoading: false,
      showJsonPreview: false,
      expandedSections: [],
    },
  };
}

/**
 * Sauvegarde une session dans localStorage
 * @param session - Session à sauvegarder
 * @returns true si succès, false si échec
 */
export function saveSession(session: BriefSession): boolean {
  try {
    // Mettre à jour le timestamp
    session.updatedAt = Date.now();
    
    // Charger les données existantes
    const storageData = loadStorageData();
    
    // Ajouter/mettre à jour la session
    storageData.sessions[session.id] = session;
    
    // Nettoyer si nécessaire (limite de sessions)
    if (Object.keys(storageData.sessions).length > MAX_SESSIONS) {
      cleanupOldestSessions(storageData);
    }
    
    // Vérifier la taille avant de sauvegarder
    const serialized = JSON.stringify(storageData);
    if (serialized.length > MAX_STORAGE_SIZE) {
      console.warn('Storage size exceeded, compressing session data');
      compressSessionData(session);
    }
    
    // Sauvegarder
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    
    return true;
  } catch (error) {
    console.error('Error saving session:', error);
    return false;
  }
}

/**
 * Charge une session depuis localStorage
 * @param sessionId - ID de la session à charger
 * @returns Session trouvée ou null
 */
export function loadSession(sessionId: string): BriefSession | null {
  try {
    const storageData = loadStorageData();
    const session = storageData.sessions[sessionId];
    
    if (!session) {
      return null;
    }
    
    // Vérifier si la session n'est pas expirée
    if (isSessionExpired(session)) {
      deleteSession(sessionId);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
}

/**
 * Charge la dernière session active (la plus récemment modifiée)
 * @returns Dernière session ou null
 */
export function loadLastSession(): BriefSession | null {
  try {
    const sessions = listSessions();
    
    if (sessions.length === 0) {
      return null;
    }
    
    // Trier par updatedAt décroissant et prendre la première
    const lastSession = sessions.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    
    return lastSession;
  } catch (error) {
    console.error('Error loading last session:', error);
    return null;
  }
}

/**
 * Supprime une session du localStorage
 * @param sessionId - ID de la session à supprimer
 * @returns true si succès, false si échec
 */
export function deleteSession(sessionId: string): boolean {
  try {
    const storageData = loadStorageData();
    delete storageData.sessions[sessionId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

/**
 * Liste toutes les sessions non expirées
 * @returns Array de sessions triées par date de modification décroissante
 */
export function listSessions(): BriefSession[] {
  try {
    const storageData = loadStorageData();
    const sessions = Object.values(storageData.sessions);
    
    // Filtrer les sessions expirées
    const validSessions = sessions.filter(session => !isSessionExpired(session));
    
    // Trier par date de modification décroissante
    return validSessions.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Error listing sessions:', error);
    return [];
  }
}

/**
 * Supprime toutes les sessions
 * @returns true si succès, false si échec
 */
export function clearAllSessions(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing sessions:', error);
    return false;
  }
}

// ============================================================================
// HELPERS POUR MESSAGES
// ============================================================================

/**
 * Ajoute un message à la conversation d'une session
 * @param session - Session à modifier
 * @param message - Message à ajouter
 */
export function addMessage(
  session: BriefSession,
  message: Omit<ChatMessage, 'id' | 'timestamp'>
): ChatMessage {
  const newMessage: ChatMessage = {
    ...message,
    id: uuidv4(),
    timestamp: Date.now(),
  };
  
  session.conversation.push(newMessage);
  session.updatedAt = Date.now();
  
  return newMessage;
}

/**
 * Récupère les N derniers messages de la conversation
 * @param session - Session
 * @param count - Nombre de messages à récupérer
 * @returns Array des derniers messages
 */
export function getLastMessages(session: BriefSession, count: number): ChatMessage[] {
  return session.conversation.slice(-count);
}

// ============================================================================
// HELPERS POUR PDF
// ============================================================================

/**
 * Sauvegarde un PDF dans la session
 * @param session - Session à modifier
 * @param pdfBase64 - PDF encodé en base64
 * @param fileName - Nom du fichier
 * @param fileSize - Taille en bytes
 */
export function savePdfToSession(
  session: BriefSession,
  pdfBase64: string,
  fileName: string,
  fileSize: number
): void {
  session.pdfBase64 = pdfBase64;
  session.pdfName = fileName;
  session.pdfSize = fileSize;
  session.lastAnalysisAt = Date.now();
  session.updatedAt = Date.now();
}

/**
 * Supprime le PDF de la session (pour réduire la taille de stockage)
 * @param session - Session à modifier
 */
export function removePdfFromSession(session: BriefSession): void {
  delete session.pdfBase64;
  session.updatedAt = Date.now();
}

// ============================================================================
// HELPERS POUR STATUTS DE CHAMPS
// ============================================================================

/**
 * Met à jour le statut d'un champ
 * @param session - Session à modifier
 * @param fieldStatus - Nouveau statut du champ
 */
export function updateFieldStatus(
  session: BriefSession,
  fieldStatus: FieldStatus
): void {
  session.fieldStatuses[fieldStatus.field] = fieldStatus;
  session.updatedAt = Date.now();
  
  // Recalculer la complétion
  recalculateCompleteness(session);
}

/**
 * Met à jour plusieurs statuts de champs
 * @param session - Session à modifier
 * @param fieldStatuses - Record de statuts à mettre à jour
 */
export function updateFieldStatuses(
  session: BriefSession,
  fieldStatuses: Record<string, FieldStatus>
): void {
  session.fieldStatuses = {
    ...session.fieldStatuses,
    ...fieldStatuses,
  };
  session.updatedAt = Date.now();
  
  // Recalculer la complétion
  recalculateCompleteness(session);
}

/**
 * Recalcule le pourcentage de complétion d'une session
 * @param session - Session à analyser
 */
function recalculateCompleteness(session: BriefSession): void {
  const statuses = Object.values(session.fieldStatuses);
  
  if (statuses.length === 0) {
    session.completeness = 0;
    session.isComplete = false;
    return;
  }
  
  const completeCount = statuses.filter(s => s.status === 'complete').length;
  session.completeness = Math.round((completeCount / statuses.length) * 100);
  
  // Vérifier si tous les champs obligatoires sont complets
  const requiredFields = ['buyer_ref', 'campaign_name', 'flight_start_date', 
                         'flight_end_date', 'total_budget', 'currency', 
                         'product_ids', 'packages'];
  
  const allRequiredComplete = requiredFields.every(field => 
    session.fieldStatuses[field]?.status === 'complete'
  );
  
  session.isComplete = allRequiredComplete;
}

// ============================================================================
// FONCTIONS INTERNES
// ============================================================================

/**
 * Charge les données de storage ou initialise si vide
 * @returns StorageData
 */
function loadStorageData(): StorageData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    
    if (!data) {
      return {
        sessions: {},
        lastCleanup: Date.now(),
      };
    }
    
    const parsed: StorageData = JSON.parse(data);
    
    // Nettoyer les sessions expirées périodiquement
    const daysSinceCleanup = (Date.now() - parsed.lastCleanup) / (1000 * 60 * 60 * 24);
    if (daysSinceCleanup > 7) {
      cleanupExpiredSessions(parsed);
      parsed.lastCleanup = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    
    return parsed;
  } catch (error) {
    console.error('Error loading storage data:', error);
    return {
      sessions: {},
      lastCleanup: Date.now(),
    };
  }
}

/**
 * Vérifie si une session est expirée
 * @param session - Session à vérifier
 * @returns true si expirée
 */
function isSessionExpired(session: BriefSession): boolean {
  const expiryTime = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return (Date.now() - session.updatedAt) > expiryTime;
}

/**
 * Nettoie les sessions expirées
 * @param storageData - Données de storage
 */
function cleanupExpiredSessions(storageData: StorageData): void {
  Object.keys(storageData.sessions).forEach(sessionId => {
    if (isSessionExpired(storageData.sessions[sessionId])) {
      delete storageData.sessions[sessionId];
    }
  });
}

/**
 * Supprime les sessions les plus anciennes pour respecter la limite MAX_SESSIONS
 * @param storageData - Données de storage
 */
function cleanupOldestSessions(storageData: StorageData): void {
  const sessions = Object.values(storageData.sessions);
  
  // Trier par date de modification croissante
  sessions.sort((a, b) => a.updatedAt - b.updatedAt);
  
  // Supprimer les plus anciennes jusqu'à atteindre la limite
  const toRemove = sessions.length - MAX_SESSIONS;
  for (let i = 0; i < toRemove; i++) {
    delete storageData.sessions[sessions[i].id];
  }
}

/**
 * Compresse les données d'une session pour réduire la taille de stockage
 * @param session - Session à comprimer
 */
function compressSessionData(session: BriefSession): void {
  // Supprimer le PDF si présent (plus gros consommateur d'espace)
  if (session.pdfBase64) {
    delete session.pdfBase64;
    console.log(`PDF removed from session ${session.id} to save space`);
  }
  
  // Limiter l'historique de conversation aux 50 derniers messages
  if (session.conversation.length > 50) {
    session.conversation = session.conversation.slice(-50);
    console.log(`Conversation history trimmed for session ${session.id}`);
  }
}

// ============================================================================
// EXPORTS UTILITAIRES
// ============================================================================

/**
 * Obtient la taille actuelle du storage en bytes
 * @returns Taille en bytes
 */
export function getStorageSize(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? new Blob([data]).size : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Obtient le pourcentage d'utilisation du storage
 * @returns Pourcentage (0-100)
 */
export function getStorageUsagePercent(): number {
  return Math.round((getStorageSize() / MAX_STORAGE_SIZE) * 100);
}