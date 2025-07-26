// app/types/document.ts

/**
 * Ce fichier définit les interfaces TypeScript pour le système de documents.
 * Il couvre les entités principales : Document, les données de formulaire,
 * les statuts de création, et les métadonnées associées.
 */

/**
 * Énumération des statuts possibles d'un document.
 */
export enum DocumentStatus {
    CREATING = 'creating',
    COMPLETED = 'completed', 
    ERROR = 'error'
  }
  
  /**
   * Interface principale pour un document exporté.
   * Contient toutes les métadonnées nécessaires pour tracer et gérer
   * les documents générés depuis les templates.
   */
  export interface Document {
    /** Identifiant unique du document */
    id: string;
    
    /** Nom du document choisi par l'utilisateur */
    name: string;
    
    /** URL du document dupliqué dans Google Drive */
    url: string;
    
    /** Statut actuel du document */
    status: DocumentStatus;
    
    /** Informations sur le template utilisé */
    template: {
      /** ID du template source */
      id: string;
      /** Nom du template source */
      name: string;
      /** URL du template original */
      originalUrl: string;
    };
    
    /** Informations sur la campagne et version utilisées */
    campaign: {
      /** ID de la campagne */
      id: string;
      /** Nom de la campagne */
      name: string;
    };
    
    version: {
      /** ID de la version */
      id: string;
      /** Nom de la version */
      name: string;
    };
    
    /** Métadonnées de création */
    createdBy: {
      /** ID de l'utilisateur créateur */
      userId: string;
      /** Email de l'utilisateur créateur */
      userEmail: string;
      /** Nom d'affichage de l'utilisateur créateur */
      userDisplayName: string;
    };
    
    /** Date de création du document */
    createdAt: string;
    
    /** Date de dernière mise à jour */
    lastUpdated: string;
    
    /** Message d'erreur en cas d'échec */
    errorMessage?: string;
    
    /** Informations sur la dernière synchronisation des données */
    lastDataSync?: {
      /** Date de la dernière synchronisation */
      syncedAt: string;
      /** Utilisateur qui a effectué la synchronisation */
      syncedBy: string;
      /** Succès ou échec de la synchronisation */
      success: boolean;
      /** Message d'erreur si échec */
      errorMessage?: string;
    };
  }
  
  /**
   * Interface pour les données du formulaire de création de document.
   * Utilisée dans le modal de création avant la génération du document complet.
   */
  export interface DocumentFormData {
    /** Nom du document à créer */
    name: string;
    
    /** ID du template sélectionné */
    templateId: string;
    
    /** ID de la campagne sélectionnée */
    campaignId: string;
    
    /** ID de la version sélectionnée */
    versionId: string;
  }
  
  /**
   * Interface pour les informations minimales d'un document.
   * Utilisée pour les listes et aperçus rapides.
   */
  export interface DocumentSummary {
    /** Identifiant unique du document */
    id: string;
    
    /** Nom du document */
    name: string;
    
    /** URL du document */
    url: string;
    
    /** Statut du document */
    status: DocumentStatus;
    
    /** Nom du template utilisé */
    templateName: string;
    
    /** Date de création */
    createdAt: string;
    
    /** Nom de l'utilisateur créateur */
    createdByName: string;
  }
  
  /**
   * Interface pour les options de création d'un document.
   * Permet de configurer le comportement lors de la génération.
   */
  export interface DocumentCreationOptions {
    /** Forcer la recréation même si un document existe déjà */
    forceRecreate?: boolean;
    
    /** Inclure les données de breakdown dans l'export */
    includeBreakdowns?: boolean;
    
    /** Inclure les données de campagne dans l'export */
    includeCampaignData?: boolean;
    
    /** Inclure les données de hiérarchie nettoyées dans l'export */
    includeHierarchyData?: boolean;
    
    /** Convertir les shortcodes en noms d'affichage */
    convertShortcodes?: boolean;
  }
  
  /**
   * Interface pour le contexte de création d'un document.
   * Contient toutes les informations nécessaires pour orchestrer la création.
   */
  export interface DocumentCreationContext {
    /** ID du client */
    clientId: string;
    
    /** Informations du client */
    client: {
      name: string;
      defaultDriveFolder: string;
      exportLanguage: 'FR' | 'EN';
    };
    
    /** Données du formulaire */
    formData: DocumentFormData;
    
    /** Options de création */
    options: DocumentCreationOptions;
    
    /** Informations sur l'utilisateur créateur */
    user: {
      id: string;
      email: string;
      displayName: string;
    };
  }
  
  /**
   * Interface pour le résultat de la duplication d'un template.
   */
  export interface TemplateDigestionResult {
    /** Succès ou échec de la duplication */
    success: boolean;
    
    /** URL du document dupliqué */
    duplicatedUrl?: string;
    
    /** ID du document dupliqué dans Google Drive */
    duplicatedFileId?: string;
    
    /** Message d'erreur en cas d'échec */
    errorMessage?: string;
  }
  
  /**
   * Interface pour le résultat de l'injection des données.
   */
  export interface DataInjectionResult {
    /** Succès ou échec de l'injection */
    success: boolean;
    
    /** Nombre de lignes injectées */
    rowsInjected?: number;
    
    /** Onglets mis à jour */
    sheetsUpdated?: string[];
    
    /** Message d'erreur en cas d'échec */
    errorMessage?: string;
  }
  
  /**
   * Interface pour le résultat complet de création d'un document.
   */
  export interface DocumentCreationResult {
    /** Succès ou échec global */
    success: boolean;
    
    /** Document créé (si succès) */
    document?: Document;
    
    /** Résultat de la duplication du template */
    duplicationResult?: TemplateDigestionResult;
    
    /** Résultat de l'injection des données */
    injectionResult?: DataInjectionResult;
    
    /** Message d'erreur global en cas d'échec */
    errorMessage?: string;
    
    /** Étape où l'erreur s'est produite */
    failedStep?: 'validation' | 'duplication' | 'injection' | 'saving';
  }