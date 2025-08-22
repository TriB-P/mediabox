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
 * MODIFIÉ : Passage de la langue du template au hook de breakdown pour traduction des noms
 * CORRIGÉ : Gestion optimale des nombres selon la locale pour éviter les formats textuels.
 * - Templates EN : nombres avec points affichés comme nombres
 * - Templates FR : nombres avec virgules affichés comme nombres
 * - Aucun nombre ne sera affiché avec des apostrophes (format textuel)
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
   */
  const handleAuthError = useCallback((error: any): string => {
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';

    if (errorCode === 'auth/popup-blocked' || 
        errorMessage.includes('popup-blocked') ||
        errorMessage.includes('popup_blocked_by_browser')) {
      return t('useCombinedDocExport.error.popupBlocked');
    }

    if (errorCode === 'auth/unauthorized-domain') {
      return t('useCombinedDocExport.error.unauthorizedDomain');
    }

    if (errorCode === 'auth/operation-not-allowed') {
      return t('useCombinedDocExport.error.operationNotAllowed');
    }

    if (errorCode === 'auth/network-request-failed' || errorMessage.includes('network')) {
      return t('useCombinedDocExport.error.networkRequestFailed');
    }

    if (errorCode === 'auth/user-token-expired' || errorMessage.includes('token')) {
      return t('useCombinedDocExport.error.sessionExpired');
    }

    if (errorCode.startsWith('auth/')) {
      return `${t('useCombinedDocExport.error.googleAuthGenericStart')} ${errorMessage}. ${t('useCombinedDocExport.error.googleAuthGenericEnd')}`;
    }

    return errorMessage;
  }, [t]);

  /**
   * NOUVELLE FONCTION : Nettoie et convertit les données en nombres purs.
   * MODIFIÉ : Exclut spécifiquement la colonne 'Value_text' de l'onglet 'MB_Splits'.
   */
  const convertToCleanNumbers = useCallback((data: any[][], sheetName: string): (string | number)[][] => {
    let valueTextIndex = -1;
    // Si nous sommes sur l'onglet MB_Splits et qu'il y a des données, trouver l'index de la colonne 'Value_text'
    if (sheetName === 'MB_Splits' && data.length > 0) {
      const headerRow = data[0];
      valueTextIndex = headerRow.findIndex(header => header === 'Value_text');
    }

    return data.map((row, rowIndex) => 
      row.map((cell, colIndex) => {
        // Condition d'exclusion : si c'est la colonne 'Value_text' dans 'MB_Splits' (et pas l'en-tête)
        if (valueTextIndex !== -1 && colIndex === valueTextIndex && rowIndex > 0) {
          // Retourner la valeur comme chaîne de caractères pour éviter la conversion
          return cell === null || cell === undefined ? cell : String(cell);
        }

        // --- Logique de conversion originale ---
        if (cell === null || cell === undefined || cell === '') {
          return cell;
        }
        
        if (typeof cell === 'object' && cell !== null && 'value' in cell) {
          const value = cell.value;
          if (typeof value === 'string') {
            const cleanValue = value.trim();
            const normalizedValue = cleanValue.replace(/[^\d.,\-+]/g, '').replace(/,/g, '.');
            const numericValue = Number(normalizedValue);
            if (!isNaN(numericValue) && isFinite(numericValue)) {
              return numericValue;
            }
          }
          return typeof value === 'number' ? value : String(value);
        }
        
        if (typeof cell === 'number') {
          return cell;
        }
        
        if (typeof cell === 'string') {
          const cleanValue = cell.trim();
          if (cleanValue === '' || (cleanValue.includes('-') && cleanValue.length > 10) || cleanValue.length > 15 || /[a-zA-Z]/.test(cleanValue)) {
            return cell;
          }
          const normalizedValue = cleanValue.replace(/[^\d.,\-+]/g, '').replace(/,/g, '.');
          const numericValue = Number(normalizedValue);
          if (!isNaN(numericValue) && isFinite(numericValue)) {
            return numericValue;
          }
        }
        
        return String(cell);
      })
    );
  }, []);

  /**
   * Extrait l'ID unique d'un Google Sheet à partir de son URL complète.
   */
  const extractSheetId = useCallback((url: string): string | null => {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }, []);

  /**
   * Obtient un token d'accès Google pour interagir avec les APIs Google Sheets.
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
      console.error('❌ Erreur d\'authentification Google:', authError);
      
      localStorage.removeItem('google_sheets_token');
      localStorage.removeItem('google_sheets_token_time');
      
      const enhancedMessage = handleAuthError(authError);
      const enhancedError = new Error(enhancedMessage);
      enhancedError.name = 'AuthenticationError';
      throw enhancedError;
    }
  }, [user, handleAuthError, t]);

  /**
   * FONCTION CORRIGÉE : Écrit un tableau de données 2D dans un Google Sheet.
   * MODIFIÉ : Passe le nom de l'onglet à convertToCleanNumbers.
   */
  const writeToGoogleSheet = useCallback(async (
    sheetId: string,
    sheetName: string,
    range: string,
    values: (string | number)[][]
  ): Promise<boolean> => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error(t('useCombinedDocExport.error.accessTokenWriteFailed'));
    }

    // Nettoyer les données en passant le nom de l'onglet pour les exclusions
    const cleanValues = convertToCleanNumbers(values, sheetName);
    
    console.log(`[SHEETS API] Écriture de ${cleanValues.length} lignes dans ${sheetName}!${range}`);
    console.log(`[SHEETS API] Échantillon de données:`, cleanValues.slice(0, 2));

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: cleanValues }),
        }
      );

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

      console.log(`✅ Écriture réussie dans ${sheetName}!${range} avec USER_ENTERED`);
      return true;
    } catch (err) {
      console.error(`❌ Erreur lors de l'écriture dans la feuille ${sheetName} à la plage ${range}:`, err);
      throw err;
    }
  }, [getAccessToken, convertToCleanNumbers, t]);

  /**
   * Vide une plage spécifiée dans un Google Sheet.
   */
  const clearSheetRange = useCallback(async (
    sheetId: string,
    sheetName: string,
    range: string
  ): Promise<boolean> => {
    const token = await getAccessToken();
    console.log("NETTOYAGE DU FICHIER", range)

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
   */
  const findTemplateFromDocument = useCallback(async (
    clientId: string,
    campaignId: string,
    versionId: string,
    sheetUrl: string
  ): Promise<any | null> => {
    try {
      const { getDocumentsByVersion } = await import('../../lib/documentService');
      const documents = await getDocumentsByVersion(clientId, campaignId, versionId);
      
      const currentDocument = documents.find(doc => doc.url === sheetUrl);
      if (!currentDocument) {
        console.warn('[EXPORT] Document non trouvé pour cette URL, impossible de vérifier TE_Duplicate');
        return null;
      }

      const { getTemplateById } = await import('../../lib/templateService');
      const template = await getTemplateById(clientId, currentDocument.template.id);
      
      return template;
    } catch (err) {
      console.warn('[EXPORT] Erreur lors de la récupération du template:', err);
      return null;
    }
  }, []);

  /**
   * NOUVEAU: Détermine la langue du template selon sa configuration TE_Language
   */
  const getTemplateLanguage = useCallback((template: any, exportLanguage: 'FR' | 'EN'): 'FR' | 'EN' => {
    if (!template?.TE_Language) {
      console.log('[EXPORT] Template sans TE_Language, utilisation de la langue d\'export:', exportLanguage);
      return exportLanguage;
    }

    const templateLang = template.TE_Language;
    
    if (templateLang === 'FR' || templateLang === 'EN') {
      console.log('[EXPORT] Langue du template détectée:', templateLang);
      return templateLang;
    }
    
    // Pour 'Auto' ou toute autre valeur, utiliser la langue d'export
    console.log('[EXPORT] Template en mode Auto, utilisation de la langue d\'export:', exportLanguage);
    return exportLanguage;
  }, []);

  /**
   * Gère la synchronisation des onglets si le template l'exige.
   */
  const handleTabsRefresh = useCallback(async (
    template: any,
    sheetId: string,
    clientId: string,
    campaignId: string,
    versionId: string
  ) => {
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
   * FONCTION PRINCIPALE MODIFIÉE pour extraire et exporter les données combinées vers Google Sheets.
   * NOUVEAU: Passage de la langue du template au hook de breakdown pour traduction des noms.
   * Les nombres seront automatiquement affichés avec la bonne locale (. pour EN, , pour FR)
   * mais stockés comme des vrais nombres (pas du texte).
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
      // 0.1. Récupérer les informations du template
      const template = await findTemplateFromDocument(clientId, campaignId, versionId, sheetUrl);

      // 0.2. NOUVEAU: Déterminer la langue à utiliser pour les breakdowns
      const breakdownLanguage = getTemplateLanguage(template, exportLanguage);
      console.log(`[EXPORT] Langue pour breakdown: ${breakdownLanguage} (Template: ${template?.TE_Language || 'N/A'}, Export: ${exportLanguage})`);

      // 0.3. Synchroniser les onglets si nécessaire (AVANT de vider les feuilles)
      if (template) {
        const tabsResult = await handleTabsRefresh(template, sheetId, clientId, campaignId, versionId);
        if (!tabsResult.success) {
          console.warn('[EXPORT] Échec synchronisation onglets, poursuite de l\'exportation:', tabsResult.errorMessage);
        }
      }

      // 0.4. Vider les feuilles cibles après synchronisation des onglets
      await clearSheetRange(sheetId, 'MB_Data', 'A:EZ');
      await clearSheetRange(sheetId, 'MB_Splits', 'A:EZ');

      // 1. Extraire les données de campagne
      const campaignDataResult = await extractCampaignData(clientId, campaignId);
      if (campaignError) throw new Error(campaignError);

      // 2. MODIFIÉ: Extraire les données de breakdown avec la langue du template
      const breakdownDataResult = await extractBreakdownData(clientId, campaignId, versionId, breakdownLanguage);
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

      console.log(`[COMBINED EXPORT] Conversion des shortcodes terminée en ${exportLanguage}, écriture vers Google Sheets...`);

      // 6. Écrire les données converties dans Google Sheets
      const writePromises = [];

      writePromises.push(writeToGoogleSheet(sheetId, 'MB_Data', 'A1', convertedCampaignData));
      writePromises.push(writeToGoogleSheet(sheetId, 'MB_Data', 'A4', convertedCleanedData));
      writePromises.push(writeToGoogleSheet(sheetId, 'MB_Splits', 'A1', breakdownDataResult));

      const results = await Promise.all(writePromises);
      const allSuccess = results.every(res => res === true);

      if (!allSuccess) {
        throw new Error(t('useCombinedDocExport.error.multipleWritesFailed'));
      }

      const templateLang = template?.TE_Language || 'Auto';
      console.log(`[COMBINED EXPORT] ✅ Exportation combinée terminée avec succès`);
      console.log(`[COMBINED EXPORT] Template: ${templateLang}, Shortcodes: ${exportLanguage}, Breakdown: ${breakdownLanguage}, Nombres: format automatique selon locale du document`);
      return true;

    } catch (err) {
      let errorMessage: string;
      
      if (err instanceof Error && err.name === 'AuthenticationError') {
        errorMessage = err.message;
      } else {
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
    findTemplateFromDocument, getTemplateLanguage, handleTabsRefresh
  ]);

  const overallLoading = loading || cleanLoading || breakdownLoading || campaignLoading || convertLoading || tabsLoading;
  const overallError = error || cleanError || breakdownError || campaignError || convertError;

  return {
    exportCombinedData,
    loading: overallLoading,
    error: overallError,
  };
}