// app/hooks/documents/useUnlinkDoc.ts

/**
 * Ce hook gère la dissociation des documents Google Sheets.
 * Il duplique le document, supprime les feuilles MediaBox, convertit les formules en valeurs,
 * et crée une copie statique déconnectée du système MediaBox.
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentUnlinkResult, Document } from '../../types/document';
import { createUnlinkedDocument } from '../../lib/documentService';
import { useTranslation } from '../../contexts/LanguageContext';

interface UseUnlinkDocReturn {
  unlinkDocument: (
    originalDocument: Document,
    newName: string,
    clientId: string,
    campaignId: string,
    versionId: string
  ) => Promise<DocumentUnlinkResult>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour dissocier des documents Google Sheets en créant des copies statiques.
 * @returns {UseUnlinkDocReturn} Un objet contenant la fonction unlinkDocument,
 * les états de chargement et d'erreur.
 */
export function useUnlinkDoc(): UseUnlinkDocReturn {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Extrait l'ID du fichier Google depuis son URL.
   * @param url L'URL complète du fichier Google Sheets.
   * @returns L'ID du fichier ou null si non trouvé.
   */
  const extractFileId = useCallback((url: string): string | null => {
    const sheetsRegex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(sheetsRegex);
    return match ? match[1] : null;
  }, []);

  /**
   * Obtient un token d'accès Google avec les permissions Drive et Sheets.
   * Utilise un cache de 50 minutes pour éviter les ré-authentifications fréquentes.
   * @returns Le token d'accès Google ou null si échec.
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!user) {
      throw new Error(t('unlinkDoc.error.notAuthenticated'));
    }

    // Vérifier le cache d'abord
    const cachedToken = localStorage.getItem('google_unlink_token');
    const cachedTime = localStorage.getItem('google_unlink_token_time');

    if (cachedToken && cachedTime) {
      const tokenAge = Date.now() - parseInt(cachedTime);
      // Token valide pendant 50 minutes
      if (tokenAge < 50 * 60 * 1000) {
        console.log('[UNLINK AUTH] Utilisation du token en cache');
        return cachedToken;
      }
      // Nettoyer le cache expiré
      localStorage.removeItem('google_unlink_token');
      localStorage.removeItem('google_unlink_token_time');
    }

    try {
      console.log('[UNLINK AUTH] Demande de nouveau token pour:', user.email);

      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const auth = getAuth();

      const provider = new GoogleAuthProvider();
      // Ajouter les scopes nécessaires pour Drive et Sheets
      provider.addScope('https://www.googleapis.com/auth/drive');
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      
      // Guider vers le compte connecté
      provider.setCustomParameters({
        login_hint: user.email
      });

      console.log("FIREBASE: AUTHENTICATION - Fichier: useUnlinkDoc.ts - Fonction: getAccessToken - Path: N/A");
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        // Logger l'email du compte qui a obtenu le token
        const tokenEmail = result.user?.email || 'inconnu';
        console.log('[UNLINK AUTH] ✅ Token récupéré avec succès');
        console.log('[UNLINK AUTH] 📧 Compte Firebase:', user.email);
        console.log('[UNLINK AUTH] 📧 Compte Google utilisé:', tokenEmail);
        
        if (tokenEmail !== user.email) {
          console.warn('[UNLINK AUTH] ⚠️ ATTENTION: Le compte Google diffère du compte Firebase !');
        }
        
        // Mettre en cache le token
        localStorage.setItem('google_unlink_token', credential.accessToken);
        localStorage.setItem('google_unlink_token_time', Date.now().toString());
        
        return credential.accessToken;
      }

      throw new Error(t('unlinkDoc.error.tokenNotRetrieved'));
    } catch (err) {
      console.error('[UNLINK AUTH] ❌ Erreur lors de l\'authentification Google:', err);
      localStorage.removeItem('google_unlink_token');
      localStorage.removeItem('google_unlink_token_time');
      throw err;
    }
  }, [user, t]);

  /**
   * Valide que le token a accès au fichier source.
   * Support des Shared Drives (Drives partagés).
   * @param fileId L'ID du fichier à vérifier.
   * @param accessToken Le token d'accès Google.
   * @returns true si l'accès est validé, false sinon.
   */
  const validateFileAccess = useCallback(async (
    fileId: string,
    accessToken: string
  ): Promise<{ hasAccess: boolean; email?: string; error?: string }> => {
    console.log(`[UNLINK VALIDATION] Vérification de l'accès au fichier: ${fileId}`);
    
    try {
      // Tenter de récupérer les métadonnées du fichier
      // IMPORTANT: Ajouter supportsAllDrives=true pour les Shared Drives
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,owners,driveId&supportsAllDrives=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const fileData = await response.json();
        console.log('[UNLINK VALIDATION] ✅ Accès au fichier confirmé');
        console.log('[UNLINK VALIDATION] 📄 Nom du fichier:', fileData.name);
        
        if (fileData.driveId) {
          console.log('[UNLINK VALIDATION] 🗂️  Le fichier est dans un Shared Drive:', fileData.driveId);
        }
        
        if (fileData.owners && fileData.owners.length > 0) {
          console.log('[UNLINK VALIDATION] 👤 Propriétaire:', fileData.owners[0].emailAddress);
        }
        
        return { hasAccess: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[UNLINK VALIDATION] ❌ Pas d\'accès au fichier');
        console.error('[UNLINK VALIDATION] Status:', response.status);
        console.error('[UNLINK VALIDATION] Erreur:', errorData);
        
        let errorMessage = '';
        if (response.status === 404) {
          errorMessage = 'Le fichier est introuvable ou vous n\'y avez pas accès. Assurez-vous de sélectionner le bon compte Google.';
        } else if (response.status === 403) {
          errorMessage = 'Permissions insuffisantes pour accéder à ce fichier.';
        } else {
          errorMessage = `Erreur d'accès au fichier (${response.status})`;
        }
        
        return { 
          hasAccess: false, 
          error: errorMessage
        };
      }
    } catch (err) {
      console.error('[UNLINK VALIDATION] ❌ Exception lors de la validation:', err);
      return { 
        hasAccess: false, 
        error: err instanceof Error ? err.message : 'Erreur inconnue'
      };
    }
  }, []);

  /**
   * Duplique un fichier Google Sheets via l'API Drive.
   * Support des Shared Drives (Drives partagés).
   * @param fileId L'ID du fichier à dupliquer.
   * @param newName Le nouveau nom pour le fichier dupliqué.
   * @param accessToken Le token d'accès Google.
   * @returns L'ID du fichier dupliqué.
   */
  const duplicateFile = useCallback(async (
    fileId: string,
    newName: string,
    accessToken: string
  ): Promise<string> => {
    console.log(`[UNLINK] Duplication du fichier ${fileId} vers "${newName}"`);
    
    // IMPORTANT: Ajouter supportsAllDrives=true pour les Shared Drives
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/copy?supportsAllDrives=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[UNLINK] Erreur duplication ${response.status}:`, errorData);
      
      if (response.status === 403) {
        throw new Error(t('unlinkDoc.error.insufficientPermissions'));
      } else if (response.status === 404) {
        throw new Error('Le fichier est introuvable ou vous n\'avez pas accès avec ce compte Google. Veuillez réessayer et sélectionner le bon compte.');
      } else {
        const errorMessage = errorData.error?.message || `Erreur HTTP ${response.status}`;
        throw new Error(`${t('unlinkDoc.error.driveApi')} ${errorMessage}`);
      }
    }

    const result = await response.json();
    console.log(`[UNLINK] ✅ Fichier dupliqué avec succès. Nouvel ID: ${result.id}`);
    return result.id;
  }, [t]);

  /**
   * Récupère la liste des feuilles d'un Google Sheets.
   * @param fileId L'ID du fichier Google Sheets.
   * @param accessToken Le token d'accès Google.
   * @returns La liste des feuilles avec leurs métadonnées.
   */
  const getSheets = useCallback(async (
    fileId: string,
    accessToken: string
  ): Promise<any[]> => {
    console.log(`[UNLINK] Récupération des feuilles pour: ${fileId}`);
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${fileId}?fields=sheets.properties`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`${t('unlinkDoc.error.fetchSheets')} ${errorData.error?.message || response.status}`);
    }

    const result = await response.json();
    return result.sheets || [];
  }, [t]);

  /**
   * Supprime des feuilles spécifiques d'un Google Sheets.
   * @param fileId L'ID du fichier Google Sheets.
   * @param sheetIds Les IDs des feuilles à supprimer.
   * @param accessToken Le token d'accès Google.
   */
  const deleteSheets = useCallback(async (
    fileId: string,
    sheetIds: number[],
    accessToken: string
  ): Promise<void> => {
    if (sheetIds.length === 0) {
      console.log('[UNLINK] Aucune feuille MediaBox à supprimer');
      return;
    }

    console.log(`[UNLINK] Suppression des feuilles: ${sheetIds.join(', ')}`);
    
    const requests = sheetIds.map(sheetId => ({
      deleteSheet: {
        sheetId: sheetId
      }
    }));

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${fileId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: requests
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`${t('unlinkDoc.error.deleteSheets')} ${errorData.error?.message || response.status}`);
    }

    console.log(`[UNLINK] ✅ ${sheetIds.length} feuille(s) supprimée(s) avec succès`);
  }, [t]);

  /**
   * Convertit toutes les formules d'une feuille en valeurs.
   * @param fileId L'ID du fichier Google Sheets.
   * @param sheetId L'ID de la feuille.
   * @param accessToken Le token d'accès Google.
   */
  const convertFormulasToValues = useCallback(async (
    fileId: string,
    sheetId: number,
    accessToken: string
  ): Promise<void> => {
    console.log(`[UNLINK] Conversion des formules en valeurs pour la feuille: ${sheetId}`);
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${fileId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            copyPaste: {
              source: {
                sheetId: sheetId
              },
              destination: {
                sheetId: sheetId
              },
              pasteType: 'PASTE_VALUES'
            }
          }]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`${t('unlinkDoc.error.convertFormulas')} ${errorData.error?.message || response.status}`);
    }

    console.log(`[UNLINK] ✅ Formules converties en valeurs pour la feuille: ${sheetId}`);
  }, [t]);

  /**
   * Génère l'URL d'accès pour un fichier Google Sheets.
   * @param fileId L'ID du fichier.
   * @returns L'URL du fichier.
   */
  const generateSheetsUrl = useCallback((fileId: string): string => {
    return `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
  }, []);

  /**
   * Fonction principale pour dissocier un document.
   * @param originalDocument Le document original à dissocier.
   * @param newName Le nouveau nom pour le document dissocié.
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @param versionId L'ID de la version.
   * @returns Le résultat de la dissociation.
   */
  const unlinkDocument = useCallback(async (
    originalDocument: Document,
    newName: string,
    clientId: string,
    campaignId: string,
    versionId: string
  ): Promise<DocumentUnlinkResult> => {
    if (!user) {
      return {
        success: false,
        errorMessage: t('unlinkDoc.error.notAuthenticated')
      };
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`[UNLINK] 🚀 Début de la dissociation: ${originalDocument.name} → ${newName}`);

      // 1. Extraire l'ID du fichier
      const originalFileId = extractFileId(originalDocument.url);
      if (!originalFileId) {
        return {
          success: false,
          errorMessage: t('unlinkDoc.error.invalidUrl'),
          failedStep: 'validation'
        };
      }
      console.log(`[UNLINK] 📄 ID du fichier source: ${originalFileId}`);

      // 2. Obtenir le token d'accès
      const accessToken = await getAccessToken();
      if (!accessToken) {
        return {
          success: false,
          errorMessage: t('unlinkDoc.error.tokenAccessFailed'),
          failedStep: 'validation'
        };
      }

      // 3. Valider l'accès au fichier avant de tenter la duplication
      const validation = await validateFileAccess(originalFileId, accessToken);
      if (!validation.hasAccess) {
        return {
          success: false,
          errorMessage: validation.error || 'Impossible d\'accéder au fichier source.',
          failedStep: 'validation'
        };
      }

      // 4. Dupliquer le fichier
      const duplicatedFileId = await duplicateFile(
        originalFileId,
        newName,
        accessToken
      );

      // 5. Récupérer toutes les feuilles
      const allSheets = await getSheets(duplicatedFileId, accessToken);
      
      // 6. Convertir TOUTES les formules en valeurs AVANT de supprimer les onglets
      console.log(`[UNLINK] 🔄 Conversion des formules en valeurs pour ${allSheets.length} feuilles`);
      for (const sheet of allSheets) {
        const sheetId = sheet.properties.sheetId;
        await convertFormulasToValues(duplicatedFileId, sheetId, accessToken);
      }

      // 7. Identifier les feuilles MediaBox à supprimer
      const sheetsToDelete = allSheets
        .filter(sheet => {
          const sheetName = sheet.properties?.title;
          return sheetName === 'MB_Data' || sheetName === 'MB_Splits';
        })
        .map(sheet => sheet.properties.sheetId);

      console.log(`[UNLINK] 🗑️  Feuilles MediaBox trouvées à supprimer: ${sheetsToDelete.length}`);

      // 8. Supprimer les feuilles MediaBox APRÈS avoir converti les formules
      if (sheetsToDelete.length > 0) {
        await deleteSheets(duplicatedFileId, sheetsToDelete, accessToken);
      }

      // 9. Générer l'URL du document dissocié
      const unlinkedUrl = generateSheetsUrl(duplicatedFileId);

      // 10. Créer l'entrée en base de données
      const documentId = await createUnlinkedDocument(
        clientId,
        campaignId,
        versionId,
        {
          name: newName,
          url: unlinkedUrl,
          originalDocumentId: originalDocument.id,
          template: originalDocument.template,
          campaign: originalDocument.campaign,
          version: originalDocument.version
        },
        {
          id: user.id,
          email: user.email || '',
          displayName: user.displayName || t('unlinkDoc.common.user')
        }
      );

      // 11. Récupérer le document créé
      const { getDocumentById } = await import('../../lib/documentService');
      const createdDocument = await getDocumentById(clientId, campaignId, versionId, documentId);

      console.log(`✅ Document dissocié avec succès: ${originalDocument.name} → ${unlinkedUrl}`);

      return {
        success: true,
        unlinkedUrl,
        unlinkedFileId: duplicatedFileId,
        document: createdDocument || undefined
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('unlinkDoc.error.unknown');
      console.error(`❌ ${t('unlinkDoc.error.unlinkProcess')}`, errorMessage);
      setError(errorMessage);
      
      return {
        success: false,
        errorMessage,
        failedStep: 'validation'
      };
    } finally {
      setLoading(false);
    }
  }, [
    user,
    extractFileId,
    getAccessToken,
    validateFileAccess,
    duplicateFile,
    getSheets,
    deleteSheets,
    convertFormulasToValues,
    generateSheetsUrl,
    t
  ]);

  return {
    unlinkDocument,
    loading,
    error,
  };
}