// app/lib/documentService.ts

/**
 * Ce fichier contient des fonctions pour interagir avec les documents
 * stockés dans Firebase Firestore. Il permet de créer, récupérer, mettre à jour
 * et supprimer des documents associés à des campagnes et versions spécifiques.
 * Les documents sont organisés dans la hiérarchie :
 * /clients/{clientID}/campaigns/{campaignID}/versions/{versionID}/documents
 * MODIFIÉ: Support du templateType dans la création de documents dissociés
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
          originalUrl: '', // Sera mis à jour par le hook de création
          templateType: 'Other' // Valeur par défaut, sera mis à jour par le hook de création
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
   * Cette fonction supporte automatiquement le nouveau champ templateType via l'interface Document mise à jour.
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
   * Extrait l'ID d'un fichier Google Drive depuis son URL.
   * @param url L'URL du document Google Drive.
   * @returns L'ID du fichier ou null si non trouvé.
   */
  function extractGoogleDriveFileId(url: string): string | null {
    // Pattern pour Google Sheets
    const sheetsRegex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const sheetsMatch = url.match(sheetsRegex);
    if (sheetsMatch) {
      return sheetsMatch[1];
    }

    // Pattern pour Google Docs
    const docsRegex = /\/document\/d\/([a-zA-Z0-9-_]+)/;
    const docsMatch = url.match(docsRegex);
    if (docsMatch) {
      return docsMatch[1];
    }

    // Pattern générique pour /file/d/
    const fileRegex = /\/file\/d\/([a-zA-Z0-9-_]+)/;
    const fileMatch = url.match(fileRegex);
    if (fileMatch) {
      return fileMatch[1];
    }

    return null;
  }

  /**
   * Obtient un token d'accès Google Drive.
   * @returns Le token d'accès ou null si échec.
   */
  async function getDriveAccessToken(): Promise<string | null> {
    // Vérifier le cache d'abord
    const cachedToken = localStorage.getItem('google_drive_token');
    const cachedTime = localStorage.getItem('google_drive_token_time');

    if (cachedToken && cachedTime) {
      const tokenAge = Date.now() - parseInt(cachedTime);
      // Token valide pendant 50 minutes
      if (tokenAge < 50 * 60 * 1000) {
        return cachedToken;
      }
      // Nettoyer le cache expiré
      localStorage.removeItem('google_drive_token');
      localStorage.removeItem('google_drive_token_time');
    }

    try {
      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const auth = getAuth();

      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive');
      
      console.log("FIREBASE: AUTHENTICATION - Fichier: documentService.ts - Fonction: getDriveAccessToken - Path: N/A");
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        // Mettre en cache le token
        localStorage.setItem('google_drive_token', credential.accessToken);
        localStorage.setItem('google_drive_token_time', Date.now().toString());
        
        return credential.accessToken;
      }

      throw new Error('Token d\'accès non récupéré depuis Firebase Auth');
    } catch (err) {
      console.error('Erreur lors de l\'authentification Google Drive:', err);
      localStorage.removeItem('google_drive_token');
      localStorage.removeItem('google_drive_token_time');
      throw err;
    }
  }

  /**
   * Supprime un fichier de Google Drive via l'API.
   * @param fileId L'ID du fichier à supprimer.
   * @param accessToken Le token d'accès Google Drive.
   * @returns Une promesse qui résout une fois le fichier supprimé.
   */
  async function deleteGoogleDriveFile(fileId: string, accessToken: string): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        throw new Error('Permissions insuffisantes pour supprimer le fichier Google Drive.');
      } else if (response.status === 404) {
        console.warn('Fichier Google Drive déjà supprimé ou non trouvé.');
        // Ne pas faire échouer la suppression si le fichier n'existe plus
        return;
      } else {
        const errorMessage = errorData.error?.message || `Erreur HTTP ${response.status}`;
        throw new Error(`Erreur API Drive lors de la suppression: ${errorMessage}`);
      }
    }
  }
  
  /**
   * Supprime un document et son fichier Google Drive associé.
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @param versionId L'ID de la version.
   * @param documentId L'ID du document.
   * @returns Une promesse qui résout une fois la suppression terminée.
   */
  export async function deleteDocumentWithDrive(
    clientId: string,
    campaignId: string,
    versionId: string,
    documentId: string
  ): Promise<void> {
    try {
      // 1. Récupérer le document pour obtenir l'URL Google Drive
      const document = await getDocumentById(clientId, campaignId, versionId, documentId);
      
      if (!document) {
        throw new Error('Document non trouvé');
      }

      // 2. Extraire l'ID du fichier Google Drive
      const driveFileId = extractGoogleDriveFileId(document.url);
      
      if (driveFileId) {
        try {
          // 3. Obtenir le token d'accès Google Drive
          const accessToken = await getDriveAccessToken();
          
          if (accessToken) {
            // 4. Supprimer le fichier de Google Drive
            await deleteGoogleDriveFile(driveFileId, accessToken);
            console.log(`✅ Fichier Google Drive supprimé: ${driveFileId}`);
          } else {
            console.warn('⚠️ Impossible d\'obtenir le token Google Drive, suppression Firebase uniquement');
          }
        } catch (driveError) {
          console.error('❌ Erreur lors de la suppression Google Drive:', driveError);
          // Continuer avec la suppression Firebase même si Google Drive échoue
        }
      } else {
        console.warn('⚠️ ID de fichier Google Drive non trouvé dans l\'URL:', document.url);
      }

      // 5. Supprimer l'entrée Firebase
      const documentRef = doc(
        db, 
        'clients', clientId, 
        'campaigns', campaignId, 
        'versions', versionId, 
        'documents', documentId
      );

      console.log(`FIREBASE: ÉCRITURE - Fichier: documentService.ts - Fonction: deleteDocumentWithDrive - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/documents/${documentId}`);
      await deleteDoc(documentRef);

      console.log(`✅ Document supprimé avec succès: ${document.name}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      throw error;
    }
  }

  /**
   * Supprime un document (version originale, Firebase uniquement).
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
   * Crée un nouveau document dissocié dans Firebase avec toutes ses métadonnées.
   * MODIFIÉ: Support automatique du templateType via l'objet template passé en paramètre.
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @param versionId L'ID de la version.
   * @param documentData Les données du document dissocié.
   * @param user L'utilisateur créateur.
   * @returns Une promesse qui résout en l'ID du document créé.
   */
  export async function createUnlinkedDocument(
    clientId: string,
    campaignId: string,
    versionId: string,
    documentData: {
      name: string;
      url: string;
      originalDocumentId: string;
      template: Document['template']; // Cet objet contient maintenant automatiquement templateType
      campaign: Document['campaign'];
      version: Document['version'];
    },
    user: {
      id: string;
      email: string;
      displayName: string;
    }
  ): Promise<string> {
    try {
      const now = new Date().toISOString();

      const unlinkedDocument: Omit<Document, 'id'> = {
        name: documentData.name,
        url: documentData.url,
        status: DocumentStatus.COMPLETED, // Les documents dissociés sont immédiatement prêts
        isUnlinked: true,
        originalDocumentId: documentData.originalDocumentId,
        template: documentData.template, // Inclut automatiquement templateType
        campaign: documentData.campaign,
        version: documentData.version,
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
        'campaigns', campaignId, 
        'versions', versionId, 
        'documents'
      );

      console.log(`FIREBASE: ÉCRITURE - Fichier: documentService.ts - Fonction: createUnlinkedDocument - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/documents`);
      const docRef = await addDoc(documentsRef, {
        ...unlinkedDocument,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création du document dissocié:', error);
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