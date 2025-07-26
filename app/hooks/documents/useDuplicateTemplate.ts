// app/hooks/documents/useDuplicateTemplate.ts

/**
 * Ce hook gère la duplication des templates Google Sheets/Docs via l'API Google Drive.
 * Version simplifiée inspirée du hook GenerateDoc qui fonctionne correctement.
 * Il authentifie l'utilisateur avec les permissions Google Drive nécessaires,
 * duplique le template et le renomme selon le choix de l'utilisateur.
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TemplateDigestionResult } from '../../types/document';

interface UseDuplicateTemplateReturn {
  duplicateTemplate: (
    templateUrl: string,
    newName: string,
    targetFolderId?: string
  ) => Promise<TemplateDigestionResult>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour dupliquer des templates Google Drive et les renommer.
 * @returns {UseDuplicateTemplateReturn} Un objet contenant la fonction duplicateTemplate,
 * les états de chargement et d'erreur.
 */
export function useDuplicateTemplate(): UseDuplicateTemplateReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Extrait l'ID du fichier Google depuis son URL.
   * Support des URLs de Google Sheets et Google Docs.
   * @param url L'URL complète du fichier Google.
   * @returns L'ID du fichier ou null si non trouvé.
   */
  const extractFileId = useCallback((url: string): string | null => {
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
  }, []);

  /**
   * Extrait l'ID du dossier depuis l'URL du dossier Google Drive.
   * @param folderUrl L'URL du dossier Google Drive.
   * @returns L'ID du dossier ou undefined si non trouvé.
   */
  const extractFolderId = useCallback((folderUrl: string): string | undefined => {
    const folderRegex = /\/folders\/([a-zA-Z0-9-_]+)/;
    const match = folderUrl.match(folderRegex);
    return match ? match[1] : undefined;
  }, []);

  /**
   * Obtient un token d'accès Google avec les permissions Drive.
   * Utilise la même approche que GenerateDoc mais avec les scopes Drive.
   * @returns Le token d'accès Google ou null si échec.
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier le cache d'abord (comme GenerateDoc)
    const cachedToken = localStorage.getItem('google_drive_token');
    const cachedTime = localStorage.getItem('google_drive_token_time');

    if (cachedToken && cachedTime) {
      const tokenAge = Date.now() - parseInt(cachedTime);
      // Token valide pendant 50 minutes
      if (tokenAge < 50 * 60 * 1000) {
        console.log('[DRIVE AUTH] Utilisation du token en cache');
        return cachedToken;
      }
      // Nettoyer le cache expiré
      localStorage.removeItem('google_drive_token');
      localStorage.removeItem('google_drive_token_time');
    }

    try {
      console.log('[DRIVE AUTH] Demande de nouveau token pour:', user.email);

      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const auth = getAuth();

      const provider = new GoogleAuthProvider();
      // Utiliser le scope drive complet pour accéder aux fichiers existants
      provider.addScope('https://www.googleapis.com/auth/drive');
      
      // Optionnel: suggérer l'email de l'utilisateur actuel
      provider.setCustomParameters({
        login_hint: user.email
      });

      console.log("FIREBASE: AUTHENTICATION - Fichier: useDuplicateTemplate.ts - Fonction: getAccessToken - Path: N/A");
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        console.log('[DRIVE AUTH] Token récupéré avec succès');
        
        // Mettre en cache le token
        localStorage.setItem('google_drive_token', credential.accessToken);
        localStorage.setItem('google_drive_token_time', Date.now().toString());
        
        return credential.accessToken;
      }

      throw new Error('Token d\'accès non récupéré depuis Firebase Auth');
    } catch (err) {
      console.error('Erreur lors de l\'authentification Google Drive:', err);
      // Nettoyer le cache en cas d'erreur
      localStorage.removeItem('google_drive_token');
      localStorage.removeItem('google_drive_token_time');
      throw err;
    }
  }, [user]);

  /**
   * Duplique un fichier Google Drive via l'API.
   * @param fileId L'ID du fichier à dupliquer.
   * @param newName Le nouveau nom pour le fichier dupliqué.
   * @param targetFolderId L'ID du dossier de destination (optionnel).
   * @param accessToken Le token d'accès Google Drive.
   * @returns L'ID du fichier dupliqué.
   */
  const duplicateFile = useCallback(async (
    fileId: string,
    newName: string,
    targetFolderId: string | undefined,
    accessToken: string
  ): Promise<string> => {
    console.log(`[DRIVE API] Duplication du fichier ${fileId} vers "${newName}"`);
    
    const duplicateBody: any = {
      name: newName
    };

    // Ajouter le dossier parent si spécifié
    if (targetFolderId) {
      duplicateBody.parents = [targetFolderId];
      console.log(`[DRIVE API] Dossier de destination: ${targetFolderId}`);
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/copy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[DRIVE API] Erreur ${response.status}:`, errorData);
      
      if (response.status === 403) {
        throw new Error('Permissions insuffisantes pour dupliquer le fichier. Vérifiez que le template est bien partagé avec votre compte Google.');
      } else if (response.status === 404) {
        throw new Error('Template non trouvé. Vérifiez l\'URL du template.');
      } else {
        const errorMessage = errorData.error?.message || `Erreur HTTP ${response.status}`;
        throw new Error(`Erreur API Drive: ${errorMessage}`);
      }
    }

    const result = await response.json();
    console.log(`[DRIVE API] Fichier dupliqué avec succès. Nouvel ID: ${result.id}`);
    return result.id;
  }, []);

  /**
   * Génère l'URL d'accès pour un fichier Google dupliqué.
   * @param fileId L'ID du fichier dupliqué.
   * @param accessToken Le token d'accès Google Drive.
   * @returns L'URL du fichier.
   */
  const generateFileUrl = useCallback(async (
    fileId: string,
    accessToken: string
  ): Promise<string> => {
    try {
      // Récupérer les métadonnées du fichier pour déterminer le type
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const fileData = await response.json();
        const mimeType = fileData.mimeType;

        // Générer l'URL appropriée selon le type de fichier
        if (mimeType === 'application/vnd.google-apps.spreadsheet') {
          return `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
        } else if (mimeType === 'application/vnd.google-apps.document') {
          return `https://docs.google.com/document/d/${fileId}/edit`;
        }
      }
    } catch (err) {
      console.warn('Impossible de récupérer le type de fichier, utilisation de l\'URL générique');
    }

    // Fallback: générer une URL générique
    return `https://drive.google.com/file/d/${fileId}/edit`;
  }, []);

  /**
   * Fonction principale pour dupliquer un template.
   * @param templateUrl L'URL du template à dupliquer.
   * @param newName Le nouveau nom pour le document.
   * @param targetFolderUrl L'URL du dossier de destination (optionnel).
   * @returns Le résultat de la duplication.
   */
  const duplicateTemplate = useCallback(async (
    templateUrl: string,
    newName: string,
    targetFolderUrl?: string
  ): Promise<TemplateDigestionResult> => {
    if (!user) {
      return {
        success: false,
        errorMessage: 'Utilisateur non authentifié'
      };
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`[DUPLICATE] Début de la duplication: ${templateUrl} → ${newName}`);

      // 1. Extraire l'ID du template
      const templateFileId = extractFileId(templateUrl);
      if (!templateFileId) {
        return {
          success: false,
          errorMessage: 'URL de template invalide. Impossible d\'extraire l\'ID du fichier.'
        };
      }

      // 2. Extraire l'ID du dossier de destination si fourni
      let targetFolderId: string | undefined;
      if (targetFolderUrl) {
        targetFolderId = extractFolderId(targetFolderUrl);
        if (!targetFolderId) {
          console.warn('URL de dossier invalide, le fichier sera créé dans le dossier racine');
        }
      }

      // 3. Obtenir le token d'accès
      const accessToken = await getAccessToken();
      if (!accessToken) {
        return {
          success: false,
          errorMessage: 'Impossible d\'obtenir le token d\'accès Google Drive'
        };
      }

      // 4. Dupliquer le fichier
      const duplicatedFileId = await duplicateFile(
        templateFileId,
        newName,
        targetFolderId,
        accessToken
      );

      // 5. Générer l'URL du fichier dupliqué
      const duplicatedUrl = await generateFileUrl(duplicatedFileId, accessToken);

      console.log(`✅ Template dupliqué avec succès: ${templateUrl} → ${duplicatedUrl}`);

      return {
        success: true,
        duplicatedUrl,
        duplicatedFileId
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de la duplication';
      console.error('❌ Erreur duplication template:', errorMessage);
      setError(errorMessage);
      
      return {
        success: false,
        errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [
    user,
    extractFileId,
    extractFolderId,
    getAccessToken,
    duplicateFile,
    generateFileUrl
  ]);

  return {
    duplicateTemplate,
    loading,
    error,
  };
}