// app/hooks/documents/useCombinedDocExport.ts
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCleanDocData } from './useCleanDocData';
import { useBreakdownData } from './useBreakdownData';
import { useCampaignDataDoc } from './useCampaignDataDoc';
import { useConvertShortcodesDoc } from './useConvertShortcodesDoc';

interface UseCombinedDocExportReturn {
  exportCombinedData: (clientId: string, campaignId: string, versionId: string, sheetUrl: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook personnalisé pour extraire diverses données d'une campagne et les exporter vers Google Sheets.
 * Il combine les fonctionnalités de plusieurs hooks d'extraction de données et du hook de génération de document.
 * Les shortcodes sont automatiquement convertis en noms d'affichage selon la langue d'exportation du client.
 * @returns {UseCombinedDocExportReturn} Un objet contenant la fonction exportCombinedData,
 * les états de chargement et d'erreur.
 */
export function useCombinedDocExport(): UseCombinedDocExportReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { cleanData, loading: cleanLoading, error: cleanError } = useCleanDocData();
  const { extractBreakdownData, loading: breakdownLoading, error: breakdownError } = useBreakdownData();
  const { extractCampaignData, loading: campaignLoading, error: campaignError } = useCampaignDataDoc();
  const { convertShortcodes, loading: convertLoading, error: convertError } = useConvertShortcodesDoc();

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
   * @returns {Promise<string | null>} Le token d'accès Google, ou null si l'utilisateur n'est pas authentifié ou si le token ne peut être récupéré.
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si le token d'accès ne peut être récupéré.
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!user) throw new Error('Utilisateur non authentifié');

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

    throw new Error('Token d\'accès non récupéré');
  }, [user]);

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
    values: string[][]
  ): Promise<boolean> => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Impossible d\'obtenir le token d\'accès pour l\'écriture.');
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `Erreur HTTP ${response.status}`;

        if (response.status === 403) {
          throw new Error('Permissions insuffisantes. Vérifiez l\'accès au Google Sheet.');
        } else if (response.status === 404) {
          throw new Error(`Google Sheet ou onglet '${sheetName}' non trouvé.`);
        } else {
          throw new Error(`Erreur API Sheets: ${errorMessage}`);
        }
      }
      return true;
    } catch (err) {
      console.error(`❌ Erreur lors de l'écriture dans la feuille ${sheetName} à la plage ${range}:`, err);
      throw err;
    }
  }, [getAccessToken]);

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
      throw new Error('Impossible d\'obtenir le token d\'accès pour le nettoyage.');
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
          throw new Error('Permissions insuffisantes pour vider le Google Sheet.');
        } else if (response.status === 404) {
          throw new Error(`Google Sheet ou onglet '${sheetName}' non trouvé lors du nettoyage.`);
        } else {
          throw new Error(`Erreur API Sheets lors du nettoyage: ${errorMessage}`);
        }
      }
      console.log(`✅ Plage '${sheetName}!${range}' vidée avec succès.`);
      return true;
    } catch (err) {
      console.error(`❌ Erreur lors du nettoyage de la feuille ${sheetName} à la plage ${range}:`, err);
      throw err;
    }
  }, [getAccessToken]);

  /**
   * Fonction principale pour extraire et exporter les données combinées vers Google Sheets.
   * Les shortcodes sont automatiquement convertis en noms d'affichage selon la langue du client.
   * @param {string} clientId L'ID du client.
   * @param {string} campaignId L'ID de la campagne.
   * @param {string} versionId L'ID de la version.
   * @param {string} sheetUrl L'URL du Google Sheet cible.
   * @returns {Promise<boolean>} Vrai si l'exportation a réussi, faux sinon.
   */
  const exportCombinedData = useCallback(async (
    clientId: string,
    campaignId: string,
    versionId: string,
    sheetUrl: string
  ): Promise<boolean> => {
    if (!user) {
      setError('Utilisateur non authentifié. Veuillez vous connecter.');
      return false;
    }

    setLoading(true);
    setError(null);

    const sheetId = extractSheetId(sheetUrl);
    if (!sheetId) {
      setError('URL Google Sheet invalide.');
      setLoading(false);
      return false;
    }

    try {
      // 0. Vider les feuilles cibles avant d'écrire
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
        throw new Error('Données manquantes après extraction.');
      }

      console.log('[COMBINED EXPORT] Données extraites avec succès, début de la conversion des shortcodes...');

      // 4. Convertir les shortcodes dans les données de campagne
      const convertedCampaignData = await convertShortcodes(campaignDataResult, clientId);
      if (convertError) throw new Error(convertError);
      if (!convertedCampaignData) throw new Error('Erreur lors de la conversion des shortcodes de campagne.');

      // 5. Convertir les shortcodes dans les données de hiérarchie
      const convertedCleanedData = await convertShortcodes(cleanedDataResult, clientId);
      if (convertError) throw new Error(convertError);
      if (!convertedCleanedData) throw new Error('Erreur lors de la conversion des shortcodes de hiérarchie.');

      // Note: Les données de breakdown ne contiennent généralement pas de shortcodes,
      // donc on les garde telles quelles

      console.log('[COMBINED EXPORT] Conversion des shortcodes terminée, écriture vers Google Sheets...');

      // 6. Écrire les données converties dans Google Sheets
      const writePromises = [];

      // Données de campagne converties dans MB_Data, cellule A1
      writePromises.push(writeToGoogleSheet(sheetId, 'MB_Data', 'A1', convertedCampaignData));

      // Données nettoyées converties dans MB_Data, cellule A4
      writePromises.push(writeToGoogleSheet(sheetId, 'MB_Data', 'A4', convertedCleanedData));

      // Données de breakdown dans MB_Splits, cellule A1 (non converties)
      writePromises.push(writeToGoogleSheet(sheetId, 'MB_Splits', 'A1', breakdownDataResult));

      const results = await Promise.all(writePromises);
      const allSuccess = results.every(res => res === true);

      if (!allSuccess) {
        throw new Error('Une ou plusieurs écritures dans Google Sheets ont échoué.');
      }

      console.log('[COMBINED EXPORT] ✅ Exportation combinée terminée avec succès (shortcodes convertis)');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'exportation combinée.';
      console.error('❌ Erreur exportCombinedData:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    user,
    cleanData, cleanError,
    extractBreakdownData, breakdownError,
    extractCampaignData, campaignError,
    convertShortcodes, convertError,
    extractSheetId, writeToGoogleSheet, clearSheetRange
  ]);

  const overallLoading = loading || cleanLoading || breakdownLoading || campaignLoading || convertLoading;
  const overallError = error || cleanError || breakdownError || campaignError || convertError;

  return {
    exportCombinedData,
    loading: overallLoading,
    error: overallError,
  };
}