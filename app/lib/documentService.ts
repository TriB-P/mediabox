// app/lib/documentService.ts

/**
 * Ce fichier contient des fonctions pour interagir avec les documents
 * stockés dans Firebase Firestore. Il permet de créer, récupérer, mettre à jour
 * et supprimer des documents associés à des campagnes et versions spécifiques.
 * Les documents sont organisés dans la hiérarchie :
 * /clients/{clientID}/campaigns/{campaignID}/versions/{versionID}/documents
 */

import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    serverTimestamp,
    Timestamp
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { 
    Document, 
    DocumentFormData, 
    DocumentSummary, 
    DocumentStatus,
    DocumentCreationContext
  } from '../types/document';
  
  /**
   * Crée un nouveau document dans Firebase avec toutes ses métadonnées.
   * @param context Le contexte de création contenant toutes les informations nécessaires.
   * @param duplicatedUrl L'URL du document dupliqué dans Google Drive.
   * @returns Une promesse qui résout en l'ID du document créé.
   */
  export async function createDocument(
    context: DocumentCreationContext,
    duplicatedUrl: string
  ): Promise<string> {
    try {
      const { clientId, formData, user } = context;
      const now = new Date().toISOString();
  
      const documentData: Omit<Document, 'id'> = {
        name: formData.name,
        url: duplicatedUrl,
        status: DocumentStatus.CREATING,
        template: {
          id: formData.templateId,
          name: '', // Sera mis à jour par le hook de création
          originalUrl: '' // Sera mis à jour par le hook de création
        },
        campaign: {
          id: formData.campaignId,
          name: '' // Sera mis à jour par le hook de création
        },
        version: {
          id: formData.versionId,
          name: '' // Sera mis à jour par le hook de création
        },
        createdBy: {
          userId: user.id,
          userEmail: user.email,
          userDisplayName: user.displayName
        },
        createdAt: now,
        lastUpdated: now
      };
  
      const documentsRef = collection(
        db, 
        'clients', clientId, 
        'campaigns', formData.campaignId, 
        'versions', formData.versionId, 
        'documents'
      );
  
      console.log(`FIREBASE: ÉCRITURE - Fichier: documentService.ts - Fonction: createDocument - Path: clients/${clientId}/campaigns/${formData.campaignId}/versions/${formData.versionId}/documents`);
      const docRef = await addDoc(documentsRef, {
        ...documentData,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
  
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création du document:', error);
      throw error;
    }
  }
  
  /**
   * Récupère tous les documents pour une version spécifique d'une campagne.
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @param versionId L'ID de la version.
   * @returns Une promesse qui résout en un tableau de documents.
   */
  export async function getDocumentsByVersion(
    clientId: string,
    campaignId: string,
    versionId: string
  ): Promise<Document[]> {
    try {
      const documentsRef = collection(
        db, 
        'clients', clientId, 
        'campaigns', campaignId, 
        'versions', versionId, 
        'documents'
      );
  
      const q = query(documentsRef, orderBy('createdAt', 'desc'));
      
      console.log(`FIREBASE: LECTURE - Fichier: documentService.ts - Fonction: getDocumentsByVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/documents`);
      const querySnapshot = await getDocs(q);
  
      const documents: Document[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Convertir les Timestamps Firebase en strings
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate().toISOString()
          : data.createdAt;
        const lastUpdated = data.lastUpdated instanceof Timestamp 
          ? data.lastUpdated.toDate().toISOString()
          : data.lastUpdated;
  
        documents.push({
          id: doc.id,
          ...data,
          createdAt,
          lastUpdated
        } as Document);
      });
  
      return documents;
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      throw error;
    }
  }
  
  /**
   * Récupère un document spécifique par son ID.
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @param versionId L'ID de la version.
   * @param documentId L'ID du document.
   * @returns Une promesse qui résout en le document trouvé ou null.
   */
  export async function getDocumentById(
    clientId: string,
    campaignId: string,
    versionId: string,
    documentId: string
  ): Promise<Document | null> {
    try {
      const documentRef = doc(
        db, 
        'clients', clientId, 
        'campaigns', campaignId, 
        'versions', versionId, 
        'documents', documentId
      );
  
      console.log(`FIREBASE: LECTURE - Fichier: documentService.ts - Fonction: getDocumentById - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/documents/${documentId}`);
      const documentDoc = await getDoc(documentRef);
  
      if (!documentDoc.exists()) {
        return null;
      }
  
      const data = documentDoc.data();
      
      // Convertir les Timestamps Firebase en strings
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate().toISOString()
        : data.createdAt;
      const lastUpdated = data.lastUpdated instanceof Timestamp 
        ? data.lastUpdated.toDate().toISOString()
        : data.lastUpdated;
  
      return {
        id: documentDoc.id,
        ...data,
        createdAt,
        lastUpdated
      } as Document;
    } catch (error) {
      console.error('Erreur lors de la récupération du document:', error);
      throw error;
    }
  }
  
  /**
   * Met à jour le statut d'un document.
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @param versionId L'ID de la version.
   * @param documentId L'ID du document.
   * @param status Le nouveau statut.
   * @param errorMessage Message d'erreur optionnel si le statut est ERROR.
   * @returns Une promesse qui résout une fois la mise à jour terminée.
   */
  export async function updateDocumentStatus(
    clientId: string,
    campaignId: string,
    versionId: string,
    documentId: string,
    status: DocumentStatus,
    errorMessage?: string
  ): Promise<void> {
    try {
      const documentRef = doc(
        db, 
        'clients', clientId, 
        'campaigns', campaignId, 
        'versions', versionId, 
        'documents', documentId
      );
  
      const updateData: any = {
        status,
        lastUpdated: serverTimestamp()
      };
  
      if (errorMessage) {
        updateData.errorMessage = errorMessage;
      }
  
      console.log(`FIREBASE: ÉCRITURE - Fichier: documentService.ts - Fonction: updateDocumentStatus - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/documents/${documentId}`);
      await updateDoc(documentRef, updateData);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du document:', error);
      throw error;
    }
  }
  
  /**
   * Met à jour les métadonnées complètes d'un document (template, campagne, version).
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @param versionId L'ID de la version.
   * @param documentId L'ID du document.
   * @param updates Les champs à mettre à jour.
   * @returns Une promesse qui résout une fois la mise à jour terminée.
   */
  export async function updateDocumentMetadata(
    clientId: string,
    campaignId: string,
    versionId: string,
    documentId: string,
    updates: Partial<Pick<Document, 'template' | 'campaign' | 'version'>>
  ): Promise<void> {
    try {
      const documentRef = doc(
        db, 
        'clients', clientId, 
        'campaigns', campaignId, 
        'versions', versionId, 
        'documents', documentId
      );
  
      console.log(`FIREBASE: ÉCRITURE - Fichier: documentService.ts - Fonction: updateDocumentMetadata - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/documents/${documentId}`);
      await updateDoc(documentRef, {
        ...updates,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des métadonnées du document:', error);
      throw error;
    }
  }
  
  /**
   * Enregistre les informations de synchronisation des données.
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @param versionId L'ID de la version.
   * @param documentId L'ID du document.
   * @param syncedBy L'utilisateur qui a effectué la synchronisation.
   * @param success Succès ou échec de la synchronisation.
   * @param errorMessage Message d'erreur optionnel si échec.
   * @returns Une promesse qui résout une fois la mise à jour terminée.
   */
  export async function updateDocumentDataSync(
    clientId: string,
    campaignId: string,
    versionId: string,
    documentId: string,
    syncedBy: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      const documentRef = doc(
        db, 
        'clients', clientId, 
        'campaigns', campaignId, 
        'versions', versionId, 
        'documents', documentId
      );
  
      const lastDataSync: any = {
        syncedAt: new Date().toISOString(),
        syncedBy,
        success
      };
  
      if (errorMessage) {
        lastDataSync.errorMessage = errorMessage;
      }
  
      console.log(`FIREBASE: ÉCRITURE - Fichier: documentService.ts - Fonction: updateDocumentDataSync - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/documents/${documentId}`);
      await updateDoc(documentRef, {
        lastDataSync,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la synchronisation des données:', error);
      throw error;
    }
  }
  
  /**
   * Supprime un document.
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @param versionId L'ID de la version.
   * @param documentId L'ID du document.
   * @returns Une promesse qui résout une fois la suppression terminée.
   */
  export async function deleteDocument(
    clientId: string,
    campaignId: string,
    versionId: string,
    documentId: string
  ): Promise<void> {
    try {
      const documentRef = doc(
        db, 
        'clients', clientId, 
        'campaigns', campaignId, 
        'versions', versionId, 
        'documents', documentId
      );
  
      console.log(`FIREBASE: ÉCRITURE - Fichier: documentService.ts - Fonction: deleteDocument - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/documents/${documentId}`);
      await deleteDoc(documentRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      throw error;
    }
  }
  
  /**
   * Récupère un résumé de tous les documents d'une campagne (toutes versions confondues).
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @returns Une promesse qui résout en un tableau de résumés de documents.
   */
  export async function getDocumentsSummaryByCampaign(
    clientId: string,
    campaignId: string
  ): Promise<DocumentSummary[]> {
    try {
      // Note: Cette fonction nécessite de parcourir toutes les versions
      // Dans un vrai environnement, on pourrait optimiser avec un index ou une structure différente
      
      const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
      console.log(`FIREBASE: LECTURE - Fichier: documentService.ts - Fonction: getDocumentsSummaryByCampaign - Path: clients/${clientId}/campaigns/${campaignId}`);
      const campaignDoc = await getDoc(campaignRef);
      
      if (!campaignDoc.exists()) {
        return [];
      }
  
      // Pour l'instant, retourner un tableau vide
      // Cette fonction pourrait être étendue pour parcourir toutes les versions
      console.warn('getDocumentsSummaryByCampaign: Fonction à implémenter selon les besoins spécifiques');
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé des documents:', error);
      throw error;
    }
  }
  
  /**
   * Vérifie si un document avec le même nom existe déjà pour cette version.
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @param versionId L'ID de la version.
   * @param documentName Le nom du document à vérifier.
   * @returns Une promesse qui résout en true si le document existe déjà.
   */
  export async function documentNameExists(
    clientId: string,
    campaignId: string,
    versionId: string,
    documentName: string
  ): Promise<boolean> {
    try {
      const documentsRef = collection(
        db, 
        'clients', clientId, 
        'campaigns', campaignId, 
        'versions', versionId, 
        'documents'
      );
  
      const q = query(documentsRef, where('name', '==', documentName));
      
      console.log(`FIREBASE: LECTURE - Fichier: documentService.ts - Fonction: documentNameExists - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/documents`);
      const querySnapshot = await getDocs(q);
  
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Erreur lors de la vérification du nom du document:', error);
      throw error;
    }
  }