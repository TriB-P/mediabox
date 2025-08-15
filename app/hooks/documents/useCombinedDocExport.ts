// app/hooks/documents/useCombinedDocExport.ts
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCleanDocData } from './useCleanDocData';
import { useBreakdownData } from './useBreakdownData';
import { useCampaignDataDoc } from './useCampaignDataDoc';
import { useConvertShortcodesDoc } from './useConvertShortcodesDoc';
import { useDuplicateTabsDoc } from './useDuplicateTabsDoc';
import { getDocumentById } from '../../lib/documentService';
import { useTranslation } from '../../contexts/LanguageContext';

interface UseCombinedDocExportReturn {
  exportCombinedData: (clientId: string, campaignId: string, versionId: string, sheetUrl: string, exportLanguage?: 'FR' | 'EN') => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook personnalisé pour extraire diverses données d'une campagne et les exporter vers Google Sheets.
 * Il combine les fonctionnalités de plusieurs hooks d'extraction de données et du hook de génération de document.
 * Les shortcodes sont automatiquement convertis en noms d'affichage selon la langue spécifiée.
 * Les onglets sont synchronisés si le template original a TE_Duplicate = TRUE.
 * @returns {UseCombinedDocExportReturn} Un objet contenant la fonction exportCombinedData,
 * les états de chargement et d'erreur.
 */
export function useCombinedDocExport(): UseCombinedDocExportReturn {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { cleanData, loading: cleanLoading, error: cleanError } = useCleanDocData();
  const { extractBreakdownData, loading: breakdownLoading, error: breakdownError } = useBreakdownData();
  const { extractCampaignData, loading: campaignLoading, error: campaignError } = useCampaignDataDoc();
  const { convertShortcodes, loading: convertLoading, error: convertError } = useConvertShortcodesDoc();
  const { duplicateAndManageTabs, loading: tabsLoading } = useDuplicateTabsDoc();

  /**
   * Détecte si une erreur est due à un blocage de pop-up et retourne un message approprié.
   * @param {any} error L'erreur capturée.
   * @returns {string} Le message d'erreur formaté pour l'utilisateur.
   */
  const handleAuthError = useCallback((error: any): string => {
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';

    // Détecter les erreurs de pop-up bloquée
    if (errorCode === 'auth/popup-blocked' || 
        errorMessage.includes('popup-blocked') ||
        errorMessage.includes('popup_blocked_by_browser')) {
      return t('useCombinedDocExport.error.popupBlocked');
    }

    // Détecter les erreurs d'autorisation
    if (errorCode === 'auth/unauthorized-domain') {
      return t('useCombinedDocExport.error.unauthorizedDomain');
    }

    if (errorCode === 'auth/operation-not-allowed') {
      return t('useCombinedDocExport.error.operationNotAllowed');
    }

    // Détecter les erreurs de réseau
    if (errorCode === 'auth/network-request-failed' || errorMessage.includes('network')) {
      return t('useCombinedDocExport.error.networkRequestFailed');
    }

    // Détecter les erreurs de session expirée
    if (errorCode === 'auth/user-token-expired' || errorMessage.includes('token')) {
      return t('useCombinedDocExport.error.sessionExpired');
    }

    // Message générique pour les autres erreurs d'authentification
    if (errorCode.startsWith('auth/')) {
      return `${t('useCombinedDocExport.error.googleAuthGenericStart')} ${errorMessage}. ${t('useCombinedDocExport.error.googleAuthGenericEnd')}`;
    }

    // Retourner le message original si ce n'est pas une erreur d'authentification spécifique
    return errorMessage;
  }, [t]);

  /**
   * Convertit un tableau de données en string[][] pour Google Sheets.
   * Gère différents types de données (primitives, objets avec propriété value, etc.)
   * @param {any[][]} data - Les données à convertir.
   * @returns {string[][]} Les données converties en chaînes de caractères.
   */
  const convertDataToStrings = useCallback((data: any[][]): string[][] => {
    return data.map(row => 
      row.map(cell => {
        if (cell === null || cell === undefined) return '';
        
        // Si c'est un objet avec une propriété value
        if (typeof cell === 'object' && cell !== null && 'value' in cell) {
          return String(cell.value);
        }
        
        // Si c'est déjà une valeur primitive
        return String(cell);
      })
    );
  }, []);

  /**
   * Extrait l'ID unique d'un Google Sheet à partir de son URL complète.
   * Cette fonction est dupliquée de useGenerateDoc pour éviter les dépendances circulaires
   * et permettre une utilisation autonome dans ce hook.
   * @param {string} url - L'URL complète du Google Sheet.
   * @returns {string | null} L'ID du Google Sheet si trouvé, sinon null.
   */
  const extractSheetId = useCallback((url: string): string | null => {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }, []);

  /**
   * Obtient un token d'accès Google pour interagir avec les APIs Google Sheets.
   * Le token est mis en cache localement pour une durée limitée afin d'éviter des demandes répétées.
   * Cette fonction est dupliquée de useGenerateDoc pour les mêmes raisons que extractSheetId.
   * AMÉLIORÉ : Gestion spécifique des erreurs de pop-up bloquée.
   * @returns {Promise<string | null>} Le token d'accès Google, ou null si l'utilisateur n'est pas authentifié ou si le token ne peut être récupéré.
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si le token d'accès ne peut être récupéré.
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!user) throw new Error(t('useCombinedDocExport.error.unauthenticated'));

    const cachedToken = localStorage.getItem('google_sheets_token');
    const cachedTime = localStorage.getItem('google_sheets_token_time');

    if (cachedToken && cachedTime) {
      const tokenAge = Date.now() - parseInt(cachedTime);
      if (tokenAge < 50 * 60 * 1000) {
        return cachedToken;
      }
      localStorage.removeItem('google_sheets_token');
      localStorage.removeItem('google_sheets_token_time');
    }

    try {
      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const auth = getAuth();

      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      console.log("FIREBASE: LECTURE - Fichier: useCombinedDocExport.ts - Fonction: getAccessToken - Path: N/A");
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        localStorage.setItem('google_sheets_token', credential.accessToken);
        localStorage.setItem('google_sheets_token_time', Date.now().toString());
        return credential.accessToken;
      }

      throw new Error(t('useCombinedDocExport.error.accessTokenNotRetrieved'));
    } catch (authError) {
      // NOUVEAU : Gestion spécifique des erreurs d'authentification
      console.error('❌ Erreur d\'authentification Google:', authError);
      
      // Nettoyer le cache en cas d'erreur
      localStorage.removeItem('google_sheets_token');
      localStorage.removeItem('google_sheets_token_time');
      
      // Relancer l'erreur avec un message amélioré
      const enhancedMessage = handleAuthError(authError);
      const enhancedError = new Error(enhancedMessage);
      enhancedError.name = 'AuthenticationError';
      throw enhancedError;
    }
  }, [user, handleAuthError, t]);

  /**
   * Écrit un tableau de données 2D dans un Google Sheet spécifié à une plage donnée.
   * @param {string} sheetId - L'ID du Google Sheet cible.
   * @param {string} sheetName - Le nom de l'onglet dans lequel écrire.
   * @param {string} range - La plage de cellules où écrire les données (ex: "A1").
   * @param {string[][]} values - Le tableau 2D de chaînes de caractères à écrire.
   * @returns {Promise<boolean>} Vrai si l'écriture a réussi, faux sinon.
   * @throws {Error} Si le token d'accès ne peut être obtenu, ou en cas d'erreur API.
   */
  const writeToGoogleSheet = useCallback(async (
    sheetId: string,
    sheetName: string,
    range: string,
    values: (string | number)[][], // MODIFIÉ: Accepte maintenant les nombres
    useRawFallback: boolean = true
  ): Promise<boolean> => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error(t('useCombinedDocExport.error.accessTokenWriteFailed'));
    }
  
    // NOUVEAU: Fonction pour tenter l'écriture avec un mode spécifique
    const attemptWrite = async (valueInputOption: 'USER_ENTERED' | 'RAW'): Promise<Response> => {
      console.log(`[SHEETS API] Tentative d'écriture avec ${valueInputOption} dans ${sheetName}!${range}`);
      
      return await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${range}?valueInputOption=${valueInputOption}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        }
      );
    };
  
    try {
      // MODIFIÉ: Essayer d'abord avec USER_ENTERED pour préserver les types
      let response = await attemptWrite('USER_ENTERED');
  
      // Si échec et fallback activé, essayer avec RAW
      if (!response.ok && useRawFallback) {
        console.warn(`[SHEETS API] Échec avec USER_ENTERED (${response.status}), tentative avec RAW...`);
        
        // Convertir toutes les valeurs en string pour RAW
        const stringValues = values.map(row => 
          row.map(cell => String(cell))
        );
        
        response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${range}?valueInputOption=RAW`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: stringValues }),
          }
        );
      }
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `Erreur HTTP ${response.status}`;
  
        if (response.status === 403) {
          throw new Error(t('useCombinedDocExport.error.insufficientPermissions'));
        } else if (response.status === 404) {
          throw new Error(`${t('useCombinedDocExport.error.sheetOrTabNotFoundStart')} '${sheetName}' ${t('useCombinedDocExport.error.sheetOrTabNotFoundEnd')}`);
        } else {
          throw new Error(`${t('useCombinedDocExport.error.apiError')} ${errorMessage}`);
        }
      }
  
      // NOUVEAU: Log du succès avec information sur le mode utilisé
      const modeUsed = useRawFallback && !response.headers.get('X-First-Attempt') ? 'RAW (fallback)' : 'USER_ENTERED';
      console.log(`✅ Écriture réussie avec ${modeUsed} dans ${sheetName}!${range}`);
      
      return true;
    } catch (err) {
      console.error(`❌ Erreur lors de l'écriture dans la feuille ${sheetName} à la plage ${range}:`, err);
      throw err;
    }
  }, [getAccessToken, t]);

/**
 * NOUVELLE FONCTION: Convertit un tableau de données en (string | number)[][] 
 * pour préserver les types numériques lors de l'écriture Google Sheets.
 * Remplace l'ancienne fonction convertDataToStrings.
 * @param {any[][]} data - Les données à convertir.
 * @returns {(string | number)[][]} Les données converties avec préservation des types.
 */
const convertDataWithTypes = useCallback((data: any[][]): (string | number)[][] => {
  return data.map(row => 
    row.map(cell => {
      if (cell === null || cell === undefined) return '';
      
      // Si c'est un objet avec une propriété value
      if (typeof cell === 'object' && cell !== null && 'value' in cell) {
        const value = cell.value;
        
        // Essayer de convertir en nombre si c'est une chaîne numérique
        if (typeof value === 'string') {
          const numericValue = Number(value);
          if (!isNaN(numericValue) && isFinite(numericValue)) {
            return numericValue;
          }
        }
        
        return typeof value === 'number' ? value : String(value);
      }
      
      // Si c'est déjà un nombre, le garder comme tel
      if (typeof cell === 'number') {
        return cell;
      }
      
      // Si c'est une chaîne, essayer de la convertir en nombre
      if (typeof cell === 'string') {
        const trimmedValue = cell.trim();
        
        // Éviter de convertir les chaînes vides ou les IDs
        if (trimmedValue === '' || trimmedValue.includes('-') || trimmedValue.length > 15) {
          return cell;
        }
        
        const numericValue = Number(trimmedValue);
        if (!isNaN(numericValue) && isFinite(numericValue)) {
          return numericValue;
        }
      }
      
      // Pour tout autre type, convertir en string
      return String(cell);
    })
  );
}, []);


  /**
   * Vide une plage spécifiée dans un Google Sheet.
   * @param {string} sheetId - L'ID du Google Sheet cible.
   * @param {string} sheetName - Le nom de l'onglet à vider.
   * @param {string} range - La plage à vider (ex: "A1:Z1000" ou "A:Z" pour toute la feuille).
   * @returns {Promise<boolean>} Vrai si le nettoyage a réussi, faux sinon.
   * @throws {Error} Si le token d'accès ne peut être obtenu, ou en cas d'erreur API.
   */
  const clearSheetRange = useCallback(async (
    sheetId: string,
    sheetName: string,
    range: string
  ): Promise<boolean> => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error(t('useCombinedDocExport.error.accessTokenClearFailed'));
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${range}:clear`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `Erreur HTTP ${response.status}`;

        if (response.status === 403) {
          throw new Error(t('useCombinedDocExport.error.insufficientClearPermissions'));
        } else if (response.status === 404) {
          throw new Error(`${t('useCombinedDocExport.error.sheetOrTabNotFoundStart')} '${sheetName}' ${t('useCombinedDocExport.error.sheetOrTabNotFoundCleaningEnd')}`);
        } else {
          throw new Error(`${t('useCombinedDocExport.error.apiClearError')} ${errorMessage}`);
        }
      }
      console.log(`✅ Plage '${sheetName}!${range}' vidée avec succès.`);
      return true;
    } catch (err) {
      console.error(`❌ Erreur lors du nettoyage de la feuille ${sheetName} à la plage ${range}:`, err);
      throw err;
    }
  }, [getAccessToken, t]);

  /**
   * Recherche et récupère les informations du template depuis un document existant.
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @param versionId L'ID de la version.
   * @param sheetUrl L'URL du Google Sheet pour trouver le document correspondant.
   * @returns Les informations du template ou null si non trouvé.
   */
  const findTemplateFromDocument = useCallback(async (
    clientId: string,
    campaignId: string,
    versionId: string,
    sheetUrl: string
  ): Promise<any | null> => {
    try {
      // Récupérer tous les documents de la version
      const { getDocumentsByVersion } = await import('../../lib/documentService');
      const documents = await getDocumentsByVersion(clientId, campaignId, versionId);
      
      // Trouver le document qui correspond à cette URL
      const currentDocument = documents.find(doc => doc.url === sheetUrl);
      if (!currentDocument) {
        console.warn('[EXPORT] Document non trouvé pour cette URL, impossible de vérifier TE_Duplicate');
        return null;
      }

      // Récupérer les informations du template
      const { getTemplateById } = await import('../../lib/templateService');
      const template = await getTemplateById(clientId, currentDocument.template.id);
      
      return template;
    } catch (err) {
      console.warn('[EXPORT] Erreur lors de la récupération du template:', err);
      return null;
    }
  }, []);

  /**
   * Gère la synchronisation des onglets si le template l'exige.
   * @param template Le template avec ses propriétés.
   * @param sheetId L'ID du Google Sheet.
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @param versionId L'ID de la version.
   * @returns Le résultat de la synchronisation des onglets.
   */
  const handleTabsRefresh = useCallback(async (
    template: any,
    sheetId: string,
    clientId: string,
    campaignId: string,
    versionId: string
  ) => {
    // Vérifier si le template nécessite la synchronisation d'onglets
    if (!template || !template.TE_Duplicate) {
      console.log('[EXPORT] Template ne nécessite pas de synchronisation d\'onglets');
      return { success: true };
    }

    console.log('[EXPORT] Synchronisation des onglets selon la structure de campagne...');

    try {
      const success = await duplicateAndManageTabs(
        'refresh',
        sheetId,
        clientId,
        campaignId,
        versionId
      );

      if (!success) {
        return {
          success: false,
          errorMessage: t('useCombinedDocExport.error.tabSyncFailed')
        };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('useCombinedDocExport.error.tabSyncError');
      return {
        success: false,
        errorMessage
      };
    }
  }, [duplicateAndManageTabs, t]);

  /**
   * Fonction principale pour extraire et exporter les données combinées vers Google Sheets.
   * Les shortcodes sont automatiquement convertis en noms d'affichage selon la langue spécifiée.
   * Les onglets sont synchronisés si le template original a TE_Duplicate = TRUE.
   * AMÉLIORÉ : Gestion des erreurs de pop-up bloquée avec messages explicites.
   * @param {string} clientId L'ID du client.
   * @param {string} campaignId L'ID de la campagne.
   * @param {string} versionId L'ID de la version.
   * @param {string} sheetUrl L'URL du Google Sheet cible.
   * @param {'FR' | 'EN'} exportLanguage La langue pour la conversion des shortcodes (optionnel, par défaut FR).
   * @returns {Promise<boolean>} Vrai si l'exportation a réussi, faux sinon.
   */
  const exportCombinedData = useCallback(async (
    clientId: string,
    campaignId: string,
    versionId: string,
    sheetUrl: string,
    exportLanguage: 'FR' | 'EN' = 'FR'
  ): Promise<boolean> => {
    if (!user) {
      setError(t('useCombinedDocExport.error.unauthenticatedConnect'));
      return false;
    }

    setLoading(true);
    setError(null);

    const sheetId = extractSheetId(sheetUrl);
    if (!sheetId) {
      setError(t('useCombinedDocExport.error.invalidSheetUrl'));
      setLoading(false);
      return false;
    }

    try {
      // 0.1. Récupérer les informations du template pour vérifier TE_Duplicate
      const template = await findTemplateFromDocument(clientId, campaignId, versionId, sheetUrl);

      // 0.2. Synchroniser les onglets si nécessaire (AVANT de vider les feuilles)
      if (template) {
        const tabsResult = await handleTabsRefresh(template, sheetId, clientId, campaignId, versionId);
        if (!tabsResult.success) {
          console.warn('[EXPORT] Échec synchronisation onglets, poursuite de l\'exportation:', tabsResult.errorMessage);
          // Ne pas faire échouer l'export entier, juste logger l'avertissement
        }
      }

      // 0.3. Vider les feuilles cibles après synchronisation des onglets
      await clearSheetRange(sheetId, 'MB_Data', 'A:Z'); // Vide toutes les colonnes de A à Z dans MB_Data
      await clearSheetRange(sheetId, 'MB_Splits', 'A:Z'); // Vide toutes les colonnes de A à Z dans MB_Splits

      // 1. Extraire les données de campagne
      const campaignDataResult = await extractCampaignData(clientId, campaignId);
      if (campaignError) throw new Error(campaignError);

      // 2. Extraire les données de breakdown
      const breakdownDataResult = await extractBreakdownData(clientId, campaignId, versionId);
      if (breakdownError) throw new Error(breakdownError);

      // 3. Extraire les données de hiérarchie nettoyées
      const cleanedDataResult = await cleanData(clientId, campaignId, versionId);
      if (cleanError) throw new Error(cleanError);

      // Vérifier si toutes les données ont été extraites avec succès
      if (!campaignDataResult || !breakdownDataResult || !cleanedDataResult) {
        throw new Error(t('useCombinedDocExport.error.missingDataAfterExtraction'));
      }

      console.log(`[COMBINED EXPORT] Données extraites avec succès, début de la conversion des shortcodes en ${exportLanguage}...`);

      // 4. Convertir les shortcodes dans les données de campagne avec la langue spécifiée
      const convertedCampaignData = await convertShortcodes(campaignDataResult, clientId, exportLanguage);
      if (convertError) throw new Error(convertError);
      if (!convertedCampaignData) throw new Error(t('useCombinedDocExport.error.campaignShortcodeConversion'));

      // 5. Convertir les shortcodes dans les données de hiérarchie avec la langue spécifiée
      const convertedCleanedData = await convertShortcodes(cleanedDataResult, clientId, exportLanguage);
      if (convertError) throw new Error(convertError);
      if (!convertedCleanedData) throw new Error(t('useCombinedDocExport.error.hierarchyShortcodeConversion'));

      // Note: Les données de breakdown ne contiennent généralement pas de shortcodes,
      // donc on les garde telles quelles

      console.log(`[COMBINED EXPORT] Conversion des shortcodes terminée en ${exportLanguage}, écriture vers Google Sheets...`);

      // 6. Convertir les données en string[][] pour Google Sheets
      const campaignDataAsStrings = convertDataToStrings(convertedCampaignData);
      const cleanedDataAsStrings = convertDataToStrings(convertedCleanedData);

      // 7. Écrire les données converties dans Google Sheets
      const writePromises = [];

      // Données de campagne converties dans MB_Data, cellule A1
      writePromises.push(writeToGoogleSheet(sheetId, 'MB_Data', 'A1', campaignDataAsStrings));

      // Données nettoyées converties dans MB_Data, cellule A4
      writePromises.push(writeToGoogleSheet(sheetId, 'MB_Data', 'A4', cleanedDataAsStrings));

      // Données de breakdown dans MB_Splits, cellule A1 (déjà en string[][])
      writePromises.push(writeToGoogleSheet(sheetId, 'MB_Splits', 'A1', breakdownDataResult));

      const results = await Promise.all(writePromises);
      const allSuccess = results.every(res => res === true);

      if (!allSuccess) {
        throw new Error(t('useCombinedDocExport.error.multipleWritesFailed'));
      }

      console.log(`[COMBINED EXPORT] ✅ Exportation combinée terminée avec succès (shortcodes convertis en ${exportLanguage})`);
      return true;

    } catch (err) {
      // AMÉLIORÉ : Gestion spécifique des erreurs d'authentification
      let errorMessage: string;
      
      if (err instanceof Error && err.name === 'AuthenticationError') {
        // Erreur d'authentification déjà formatée par handleAuthError
        errorMessage = err.message;
      } else {
        // Autres erreurs
        errorMessage = err instanceof Error ? err.message : t('useCombinedDocExport.error.unknownExportError');
      }
      
      console.error('❌ Erreur exportCombinedData:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    user, t,
    cleanData, cleanError,
    extractBreakdownData, breakdownError,
    extractCampaignData, campaignError,
    convertShortcodes, convertError,
    extractSheetId, writeToGoogleSheet, clearSheetRange,
    findTemplateFromDocument, handleTabsRefresh, convertDataToStrings
  ]);

  const overallLoading = loading || cleanLoading || breakdownLoading || campaignLoading || convertLoading || tabsLoading;
  const overallError = error || cleanError || breakdownError || campaignError || convertError;

  return {
    exportCombinedData,
    loading: overallLoading,
    error: overallError,
  };
}