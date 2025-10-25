// app/brief-intelligence/types.ts
/**
 * Types TypeScript pour le module Brief Intelligence
 * Définit les structures de données pour le protocole AdCP et la gestion de session
 */

// ============================================================================
// TYPES AdCP - Ad Context Protocol Media Buy
// ============================================================================

/**
 * Structure complète d'un Media Buy selon le protocole AdCP v2.0.0
 * Basé sur la spécification officielle du Ad Context Protocol
 */
export interface AdCPMediaBuy {
  // Identifiants
  buyer_ref: string;                    // Référence unique du buyer/campagne
  campaign_name: string;                // Nom de la campagne

  // Dates et budget
  flight_start_date: string;            // Date de début (format ISO 8601)
  flight_end_date: string;              // Date de fin (format ISO 8601)
  total_budget: number;                 // Budget total en devise spécifiée
  currency: string;                     // Code devise ISO (USD, CAD, EUR, etc.)

  // Inventaire
  product_ids: string[];                // IDs des produits média sélectionnés

  // Packages (au moins 1 requis)
  packages: AdCPPackage[];

  // Objectifs (optionnel)
  objectives?: AdCPObjectives;

  // Pricing (optionnel)
  pricing_model?: 'cpm' | 'auction' | 'fixed';
  max_cpm?: number;                     // CPM maximum si pricing_model = 'cpm'
  
  // Métadonnées additionnelles
  notes?: string;                       // Notes additionnelles
  brand_safety_requirements?: string[]; // Exigences de brand safety
  viewability_requirements?: string;    // Exigences de viewability
}

/**
 * Structure d'un package média dans AdCP
 * Chaque media buy contient un ou plusieurs packages
 */
export interface AdCPPackage {
  package_id: string;                   // Identifiant unique du package
  package_name?: string;                // Nom descriptif du package
  budget: number;                       // Budget alloué à ce package
  creative_formats: CreativeFormat[];   // Formats créatifs supportés
  targeting: AdCPTargeting;             // Configuration de ciblage
  pacing?: 'even' | 'asap' | 'frontloaded'; // Stratégie de pacing
  frequency_cap?: {
    impressions: number;
    time_unit: 'hour' | 'day' | 'week' | 'month';
  };
}

/**
 * Configuration de ciblage pour un package
 * Tous les champs sont optionnels mais au moins un devrait être défini
 */
export interface AdCPTargeting {
  // Géographique
  geo_codes?: string[];                 // Codes géographiques (ex: "US-CA", "CA-QC")
  geo_type?: 'include' | 'exclude';     // Type de ciblage géo
  
  // Démographique
  demographics?: {
    age_ranges?: string[];              // Tranches d'âge (ex: "18-24", "25-34")
    genders?: ('male' | 'female' | 'other' | 'unknown')[];
    income_levels?: string[];           // Niveaux de revenu
    education_levels?: string[];        // Niveaux d'éducation
  };
  
  // Intérêts et comportements
  interests?: string[];                 // Catégories d'intérêts
  behaviors?: string[];                 // Comportements d'achat
  
  // Contexte
  contexts?: string[];                  // Contextes de contenu (ex: "sports", "news")
  content_categories?: string[];        // Catégories de contenu
  keywords?: string[];                  // Mots-clés contextuels
  
  // Temporel
  temporal?: {
    days_of_week?: number[];            // Jours de la semaine (0=dimanche)
    hours_of_day?: number[];            // Heures de la journée (0-23)
    time_zones?: string[];              // Fuseaux horaires
  };
  
  // Appareil et technologie
  devices?: ('mobile' | 'tablet' | 'desktop' | 'ctv' | 'audio')[];
  operating_systems?: string[];         // OS (iOS, Android, Windows, etc.)
  browsers?: string[];                  // Navigateurs
  
  // Données propriétaires
  audience_segments?: string[];         // Segments d'audience propriétaires
  custom_targeting?: Record<string, any>; // Ciblage personnalisé
}

/**
 * Objectifs de campagne
 */
export interface AdCPObjectives {
  primary_kpi: KPIType;                 // KPI principal
  secondary_kpis?: KPIType[];           // KPIs secondaires
  target_metrics?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    reach?: number;
    frequency?: number;
  };
}

/**
 * Types de formats créatifs supportés par AdCP
 */
export type CreativeFormat = 
  | 'video'
  | 'display'
  | 'audio'
  | 'native'
  | 'banner'
  | 'interstitial'
  | 'rewarded'
  | 'ctv';

/**
 * Types de KPI supportés
 */
export type KPIType =
  | 'reach'
  | 'impressions'
  | 'clicks'
  | 'ctr'
  | 'conversions'
  | 'engagement'
  | 'viewability'
  | 'completion_rate'
  | 'brand_lift'
  | 'awareness';

// ============================================================================
// TYPES SESSION & STORAGE
// ============================================================================

/**
 * Session de brief stockée dans localStorage
 * Contient toutes les données d'une session de création de brief
 */
export interface BriefSession {
  id: string;                           // UUID de la session
  
  // Fichier PDF
  pdfBase64?: string;                   // PDF encodé en base64
  pdfName?: string;                     // Nom du fichier PDF
  pdfSize?: number;                     // Taille en bytes
  
  // Données AdCP
  adcpData: Partial<AdCPMediaBuy>;      // Données AdCP partielles ou complètes
  
  // Historique de conversation
  conversation: ChatMessage[];          // Messages du chat
  
  // Statut des champs
  fieldStatuses: Record<string, FieldStatus>; // Statut de chaque champ
  missingFields: string[];              // Liste des champs manquants
  
  // Métriques de complétion
  completeness: number;                 // Pourcentage de complétion (0-100)
  isComplete: boolean;                  // Tous les champs obligatoires sont remplis
  
  // Métadonnées
  createdAt: number;                    // Timestamp de création
  updatedAt: number;                    // Timestamp de dernière mise à jour
  lastAnalysisAt?: number;              // Timestamp de dernière analyse PDF
  
  // État de l'interface
  uiState?: {
    isPdfAnalyzing?: boolean;           // Analyse PDF en cours
    isChatLoading?: boolean;            // Chatbot en train de répondre
    showJsonPreview?: boolean;          // Afficher l'aperçu JSON
    expandedSections?: string[];        // Sections expandues du tracker
  };
}

/**
 * Message dans la conversation du chatbot
 */
export interface ChatMessage {
  id: string;                           // UUID du message
  role: MessageRole;                    // Rôle de l'émetteur
  content: string;                      // Contenu textuel du message
  timestamp: number;                    // Timestamp d'envoi
  metadata?: {
    fieldUpdated?: string;              // Champ AdCP mis à jour par ce message
    extractedData?: Partial<AdCPMediaBuy>; // Données extraites de ce message
    confidence?: number;                // Niveau de confiance (0-1)
  };
}

/**
 * Rôle dans la conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Statut d'un champ AdCP
 */
export interface FieldStatus {
  field: string;                        // Nom du champ
  status: CompletionStatus;             // Statut de complétion
  value?: any;                          // Valeur actuelle
  confidence?: number;                  // Niveau de confiance (0-1)
  source?: 'pdf' | 'chat' | 'manual';   // Source de la donnée
  lastUpdated?: number;                 // Timestamp de dernière mise à jour
}

/**
 * État de complétion d'un champ
 */
export enum CompletionStatus {
  COMPLETE = 'complete',                // Champ complet et validé
  PARTIAL = 'partial',                  // Champ partiellement rempli
  MISSING = 'missing',                  // Champ manquant
  INVALID = 'invalid',                  // Champ invalide
}

// ============================================================================
// TYPES POUR LES APIs
// ============================================================================

/**
 * Requête pour l'API d'analyse de PDF
 */
export interface AnalyzePDFRequest {
  pdfBase64: string;                    // PDF encodé en base64
  existingData?: Partial<AdCPMediaBuy>; // Données existantes à enrichir
}

/**
 * Réponse de l'API d'analyse de PDF
 */
export interface AnalyzePDFResponse {
  success: boolean;
  data?: {
    extractedData: Partial<AdCPMediaBuy>; // Données extraites du PDF
    fieldStatuses: Record<string, FieldStatus>; // Statut des champs
    missingFields: string[];            // Champs manquants
    completeness: number;               // Pourcentage de complétion
    summary: string;                    // Résumé de l'analyse
  };
  error?: string;                       // Message d'erreur si échec
}

/**
 * Requête pour l'API du chatbot
 */
export interface ChatRequest {
  message: string;                      // Message de l'utilisateur
  sessionId: string;                    // ID de la session
  currentData: Partial<AdCPMediaBuy>;   // Données AdCP actuelles
  conversationHistory: ChatMessage[];   // Historique de conversation
}

/**
 * Réponse de l'API du chatbot
 */
export interface ChatResponse {
  success: boolean;
  data?: {
    message: string;                    // Réponse du chatbot
    updatedData?: Partial<AdCPMediaBuy>; // Données mises à jour
    fieldStatuses?: Record<string, FieldStatus>; // Statuts mis à jour
    missingFields?: string[];           // Champs manquants mis à jour
    completeness?: number;              // Nouvelle complétion
    suggestedQuestion?: string;         // Question suggérée pour continuer
  };
  error?: string;                       // Message d'erreur si échec
}

// ============================================================================
// UTILITAIRES & CONSTANTES
// ============================================================================

/**
 * Liste des champs obligatoires pour un Media Buy AdCP valide
 */
export const REQUIRED_FIELDS = [
  'buyer_ref',
  'campaign_name',
  'flight_start_date',
  'flight_end_date',
  'total_budget',
  'currency',
  'product_ids',
  'packages',
] as const;

/**
 * Type pour un champ obligatoire
 */
export type RequiredField = typeof REQUIRED_FIELDS[number];

/**
 * Liste des champs obligatoires dans un package
 */
export const REQUIRED_PACKAGE_FIELDS = [
  'package_id',
  'budget',
  'creative_formats',
  'targeting',
] as const;

/**
 * Devises supportées
 */
export const SUPPORTED_CURRENCIES = [
  'USD',
  'CAD',
  'EUR',
  'GBP',
  'AUD',
] as const;

/**
 * Type pour une devise supportée
 */
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];