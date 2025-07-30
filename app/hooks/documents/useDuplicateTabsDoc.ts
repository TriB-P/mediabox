// app/hooks/documents/useDuplicateTabsDoc.ts

/**
 * Ce hook gère la duplication et la synchronisation des onglets Google Sheets
 * pour les templates ayant TE_Duplicate = TRUE. Il permet de créer dynamiquement
 * des onglets basés sur la structure des onglets Firebase d'une campagne.
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getOnglets } from '../../lib/tactiqueService';
import type { Onglet } from '../../types/tactiques';

interface UseDuplicateTabsDocReturn {
  duplicateAndManageTabs: (
    mode: 'creation' | 'refresh',
    sheetId: string,
    clientId: string,
    campaignId: string,
    versionId: string
  ) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

interface GoogleSheetTab {
  sheetId: number;
  title: string;
  index: number;
}

interface TabSyncResult {
  success: boolean;
  tabsCreated: number;
  tabsRenamed: number;
  tabsDeleted: number;
  errorMessage?: string;
}

/**
 * Hook pour dupliquer et gérer les onglets des templates Google Sheets.
 * @returns {UseDuplicateTabsDocReturn} Un objet contenant la fonction principale,
 * les états de chargement et d'erreur.
 */
export function useDuplicateTabsDoc(): UseDuplicateTabsDocReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtient un token d'accès Google avec les permissions Sheets et Drive.
   * @returns Le token d'accès Google ou null si échec.
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier le cache d'abord
    const cachedToken = localStorage.getItem('google_tabs_token');
    const cachedTime = localStorage.getItem('google_tabs_token_time');

    if (cachedToken && cachedTime) {
      const tokenAge = Date.now() - parseInt(cachedTime);
      // Token valide pendant 50 minutes
      if (tokenAge < 50 * 60 * 1000) {
        console.log('[TABS] Utilisation du token en cache');
        return cachedToken;
      }
      // Nettoyer le cache expiré
      localStorage.removeItem('google_tabs_token');
      localStorage.removeItem('google_tabs_token_time');
    }

    try {
      console.log('[TABS] Demande de nouveau token pour:', user.email);

      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const auth = getAuth();

      const provider = new GoogleAuthProvider();
      // Ajouter les scopes nécessaires pour Sheets et Drive
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.addScope('https://www.googleapis.com/auth/drive');
      
      provider.setCustomParameters({
        login_hint: user.email
      });

      console.log("FIREBASE: AUTHENTICATION - Fichier: useDuplicateTabsDoc.ts - Fonction: getAccessToken - Path: N/A");
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        console.log('[TABS] Token récupéré avec succès');
        
        // Mettre en cache le token
        localStorage.setItem('google_tabs_token', credential.accessToken);
        localStorage.setItem('google_tabs_token_time', Date.now().toString());
        
        return credential.accessToken;
      }

      throw new Error('Token d\'accès non récupéré depuis Firebase Auth');
    } catch (err) {
      console.error('Erreur lors de l\'authentification Google:', err);
      localStorage.removeItem('google_tabs_token');
      localStorage.removeItem('google_tabs_token_time');
      throw err;
    }
  }, [user]);

  /**
   * Récupère la liste des onglets d'un Google Sheets.
   * @param sheetId L'ID du Google Sheet.
   * @param accessToken Le token d'accès Google.
   * @returns La liste des onglets avec leurs métadonnées.
   */
  const getSheetTabs = useCallback(async (
    sheetId: string,
    accessToken: string
  ): Promise<GoogleSheetTab[]> => {
    console.log(`[TABS] Récupération des onglets pour: ${sheetId}`);
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erreur lors de la récupération des onglets: ${errorData.error?.message || response.status}`);
    }

    const result = await response.json();
    const sheets = result.sheets || [];
    
    return sheets.map((sheet: any) => ({
      sheetId: sheet.properties.sheetId,
      title: sheet.properties.title,
      index: sheet.properties.index
    }));
  }, []);

  /**
   * Trouve un onglet par son nom.
   * @param tabs La liste des onglets.
   * @param tabName Le nom de l'onglet à chercher.
   * @returns L'onglet trouvé ou null.
   */
  const findTabByName = useCallback((tabs: GoogleSheetTab[], tabName: string): GoogleSheetTab | null => {
    return tabs.find(tab => tab.title === tabName) || null;
  }, []);

  /**
   * Duplique un onglet dans un Google Sheets.
   * @param sheetId L'ID du Google Sheet.
   * @param sourceTabId L'ID de l'onglet source à dupliquer.
   * @param newTabName Le nom du nouvel onglet.
   * @param insertIndex L'index où insérer le nouvel onglet.
   * @param accessToken Le token d'accès Google.
   * @returns L'ID du nouvel onglet créé.
   */
  const duplicateTab = useCallback(async (
    sheetId: string,
    sourceTabId: number,
    newTabName: string,
    insertIndex: number,
    accessToken: string
  ): Promise<number> => {
    console.log(`[TABS] Duplication onglet ${sourceTabId} → "${newTabName}" à l'index ${insertIndex}`);
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            duplicateSheet: {
              sourceSheetId: sourceTabId,
              insertSheetIndex: insertIndex,
              newSheetName: newTabName
            }
          }]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erreur lors de la duplication de l'onglet: ${errorData.error?.message || response.status}`);
    }

    const result = await response.json();
    const newSheetId = result.replies[0]?.duplicateSheet?.properties?.sheetId;
    
    if (newSheetId === undefined) {
      throw new Error('ID du nouvel onglet non récupéré après duplication');
    }

    console.log(`[TABS] Onglet dupliqué avec succès. Nouvel ID: ${newSheetId}`);
    return newSheetId;
  }, []);

  /**
   * Renomme un onglet dans un Google Sheets.
   * @param sheetId L'ID du Google Sheet.
   * @param tabId L'ID de l'onglet à renommer.
   * @param newName Le nouveau nom de l'onglet.
   * @param accessToken Le token d'accès Google.
   */
  const renameTab = useCallback(async (
    sheetId: string,
    tabId: number,
    newName: string,
    accessToken: string
  ): Promise<void> => {
    console.log(`[TABS] Renommage onglet ${tabId} → "${newName}"`);
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            updateSheetProperties: {
              properties: {
                sheetId: tabId,
                title: newName
              },
              fields: 'title'
            }
          }]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erreur lors du renommage de l'onglet: ${errorData.error?.message || response.status}`);
    }

    console.log(`[TABS] Onglet renommé avec succès: "${newName}"`);
  }, []);

  /**
   * Supprime un onglet dans un Google Sheets.
   * @param sheetId L'ID du Google Sheet.
   * @param tabId L'ID de l'onglet à supprimer.
   * @param accessToken Le token d'accès Google.
   */
  const deleteTab = useCallback(async (
    sheetId: string,
    tabId: number,
    accessToken: string
  ): Promise<void> => {
    console.log(`[TABS] Suppression onglet ${tabId}`);
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            deleteSheet: {
              sheetId: tabId
            }
          }]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erreur lors de la suppression de l'onglet: ${errorData.error?.message || response.status}`);
    }

    console.log(`[TABS] Onglet supprimé avec succès: ${tabId}`);
  }, []);

  /**
   * Écrit une valeur dans une cellule spécifique d'un onglet.
   * @param sheetId L'ID du Google Sheet.
   * @param tabName Le nom de l'onglet.
   * @param cellAddress L'adresse de la cellule (ex: "B1").
   * @param value La valeur à écrire.
   * @param accessToken Le token d'accès Google.
   */
  const writeCellValue = useCallback(async (
    sheetId: string,
    tabName: string,
    cellAddress: string,
    value: string,
    accessToken: string
  ): Promise<void> => {
    console.log(`[TABS] Écriture "${value}" dans ${tabName}!${cellAddress}`);
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!${cellAddress}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[value]]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erreur lors de l'écriture en cellule: ${errorData.error?.message || response.status}`);
    }

    console.log(`[TABS] Valeur écrite avec succès dans ${tabName}!${cellAddress}`);
  }, []);

  /**
   * Lit une valeur dans une cellule spécifique d'un onglet.
   * @param sheetId L'ID du Google Sheet.
   * @param tabName Le nom de l'onglet.
   * @param cellAddress L'adresse de la cellule (ex: "B1").
   * @param accessToken Le token d'accès Google.
   * @returns La valeur de la cellule ou null si vide.
   */
  const readCellValue = useCallback(async (
    sheetId: string,
    tabName: string,
    cellAddress: string,
    accessToken: string
  ): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tabName}!${cellAddress}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.warn(`[TABS] Impossible de lire ${tabName}!${cellAddress}`);
        return null;
      }

      const result = await response.json();
      const value = result.values?.[0]?.[0] || null;
      
      console.log(`[TABS] Lecture ${tabName}!${cellAddress}: "${value}"`);
      return value;
    } catch (err) {
      console.warn(`[TABS] Erreur lecture ${tabName}!${cellAddress}:`, err);
      return null;
    }
  }, []);

  /**
   * Traite la création initiale des onglets (mode 'creation').
   * @param sheetId L'ID du Google Sheet.
   * @param firebaseOnglets La liste des onglets Firebase triés par ordre.
   * @param accessToken Le token d'accès Google.
   * @returns Le résultat de la synchronisation.
   */
  const processTabsCreation = useCallback(async (
    sheetId: string,
    firebaseOnglets: Onglet[],
    accessToken: string
  ): Promise<TabSyncResult> => {
    try {
      console.log(`[TABS] Mode création: traitement de ${firebaseOnglets.length} onglets Firebase`);

      // 1. Récupérer tous les onglets existants
      const existingTabs = await getSheetTabs(sheetId, accessToken);
      
      // 2. Trouver l'onglet "Template"
      const templateTab = findTabByName(existingTabs, 'Template');
      if (!templateTab) {
        throw new Error('Onglet "Template" non trouvé dans le document. Impossible de procéder à la duplication.');
      }

      console.log(`[TABS] Onglet Template trouvé: ID ${templateTab.sheetId}`);

      let tabsCreated = 0;

      // 3. Dupliquer l'onglet Template pour chaque onglet Firebase
      for (let i = 0; i < firebaseOnglets.length; i++) {
        const onglet = firebaseOnglets[i];
        const newTabName = onglet.ONGLET_Name;
        const insertIndex = templateTab.index + 1 + i;

        // Dupliquer l'onglet
        const newTabId = await duplicateTab(
          sheetId,
          templateTab.sheetId,
          newTabName,
          insertIndex,
          accessToken
        );

        // Écrire l'ID Firebase dans la cellule B1
        await writeCellValue(
          sheetId,
          newTabName,
          'B1',
          onglet.id,
          accessToken
        );

        tabsCreated++;
        console.log(`[TABS] Onglet créé: "${newTabName}" (ID Firebase: ${onglet.id})`);
      }

      // 4. Supprimer l'onglet Template original
      await deleteTab(sheetId, templateTab.sheetId, accessToken);
      console.log(`[TABS] Onglet Template original supprimé`);

      return {
        success: true,
        tabsCreated,
        tabsRenamed: 0,
        tabsDeleted: 1
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de la création des onglets';
      console.error('[TABS] Erreur processTabsCreation:', errorMessage);
      
      return {
        success: false,
        tabsCreated: 0,
        tabsRenamed: 0,
        tabsDeleted: 0,
        errorMessage
      };
    }
  }, [getSheetTabs, findTabByName, duplicateTab, writeCellValue, deleteTab]);

  /**
   * Traite la synchronisation des onglets (mode 'refresh').
   * @param sheetId L'ID du Google Sheet.
   * @param firebaseOnglets La liste des onglets Firebase triés par ordre.
   * @param accessToken Le token d'accès Google.
   * @returns Le résultat de la synchronisation.
   */
  const processTabsRefresh = useCallback(async (
    sheetId: string,
    firebaseOnglets: Onglet[],
    accessToken: string
  ): Promise<TabSyncResult> => {
    try {
      console.log(`[TABS] Mode refresh: synchronisation de ${firebaseOnglets.length} onglets Firebase`);

      // 1. Récupérer tous les onglets existants
      const existingTabs = await getSheetTabs(sheetId, accessToken);
      
      // 2. Mapper les IDs Firebase présents dans les onglets existants
      const existingFirebaseIds: Map<string, GoogleSheetTab> = new Map();
      
      for (const tab of existingTabs) {
        const firebaseId = await readCellValue(sheetId, tab.title, 'B1', accessToken);
        if (firebaseId) {
          existingFirebaseIds.set(firebaseId, tab);
        }
      }

      console.log(`[TABS] IDs Firebase trouvés dans le document: ${Array.from(existingFirebaseIds.keys()).join(', ')}`);

      let tabsRenamed = 0;
      let tabsCreated = 0;

      // 3. Pour chaque onglet Firebase, synchroniser ou créer
      for (const onglet of firebaseOnglets) {
        const existingTab = existingFirebaseIds.get(onglet.id);
        
        if (existingTab) {
          // L'onglet existe, vérifier si le nom doit être mis à jour
          if (existingTab.title !== onglet.ONGLET_Name) {
            await renameTab(sheetId, existingTab.sheetId, onglet.ONGLET_Name, accessToken);
            tabsRenamed++;
            console.log(`[TABS] Onglet renommé: "${existingTab.title}" → "${onglet.ONGLET_Name}"`);
          }
        } else {
          // L'onglet n'existe pas, le créer en dupliquant un onglet existant
          if (existingTabs.length > 0) {
            // Prendre le premier onglet comme source de duplication
            const sourceTab = existingTabs[0];
            const newTabName = onglet.ONGLET_Name;
            
            const newTabId = await duplicateTab(
              sheetId,
              sourceTab.sheetId,
              newTabName,
              existingTabs.length,
              accessToken
            );

            // Écrire l'ID Firebase dans la cellule B1
            await writeCellValue(
              sheetId,
              newTabName,
              'B1',
              onglet.id,
              accessToken
            );

            tabsCreated++;
            console.log(`[TABS] Nouvel onglet créé: "${newTabName}" (ID Firebase: ${onglet.id})`);
            
            // Ajouter le nouvel onglet à la liste pour futures duplications
            existingTabs.push({
              sheetId: newTabId,
              title: newTabName,
              index: existingTabs.length
            });
          } else {
            console.warn(`[TABS] Aucun onglet existant pour dupliquer l'onglet "${onglet.ONGLET_Name}"`);
          }
        }
      }

      return {
        success: true,
        tabsCreated,
        tabsRenamed,
        tabsDeleted: 0
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de la synchronisation des onglets';
      console.error('[TABS] Erreur processTabsRefresh:', errorMessage);
      
      return {
        success: false,
        tabsCreated: 0,
        tabsRenamed: 0,
        tabsDeleted: 0,
        errorMessage
      };
    }
  }, [getSheetTabs, readCellValue, renameTab, duplicateTab, writeCellValue]);

  /**
   * Fonction principale pour dupliquer et gérer les onglets selon le mode spécifié.
   * @param mode Le mode de traitement ('creation' ou 'refresh').
   * @param sheetId L'ID du Google Sheet.
   * @param clientId L'ID du client.
   * @param campaignId L'ID de la campagne.
   * @param versionId L'ID de la version.
   * @returns Vrai si le traitement a réussi, faux sinon.
   */
  const duplicateAndManageTabs = useCallback(async (
    mode: 'creation' | 'refresh',
    sheetId: string,
    clientId: string,
    campaignId: string,
    versionId: string
  ): Promise<boolean> => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`[TABS] Début du traitement en mode ${mode} pour le sheet ${sheetId}`);

      // 1. Récupérer les onglets Firebase de la campagne (triés par ordre)
      console.log("FIREBASE: LECTURE - Fichier: useDuplicateTabsDoc.ts - Fonction: duplicateAndManageTabs - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets");
      const firebaseOnglets = await getOnglets(clientId, campaignId, versionId);
      
      // Trier par ordre pour respecter la hiérarchie
      const sortedOnglets = firebaseOnglets.sort((a, b) => (a.ONGLET_Order || 0) - (b.ONGLET_Order || 0));
      
      if (sortedOnglets.length === 0) {
        console.log('[TABS] Aucun onglet Firebase trouvé, aucun traitement nécessaire');
        return true;
      }

      // 2. Obtenir le token d'accès
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Impossible d\'obtenir le token d\'accès Google');
      }

      // 3. Traiter selon le mode
      let result: TabSyncResult;
      
      if (mode === 'creation') {
        result = await processTabsCreation(sheetId, sortedOnglets, accessToken);
      } else {
        result = await processTabsRefresh(sheetId, sortedOnglets, accessToken);
      }

      if (!result.success) {
        throw new Error(result.errorMessage || `Échec du traitement en mode ${mode}`);
      }

      console.log(`[TABS] ✅ Traitement ${mode} terminé avec succès:`, {
        tabsCreated: result.tabsCreated,
        tabsRenamed: result.tabsRenamed,
        tabsDeleted: result.tabsDeleted
      });

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors du traitement des onglets';
      console.error(`[TABS] ❌ Erreur ${mode}:`, errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, getAccessToken, processTabsCreation, processTabsRefresh]);

  return {
    duplicateAndManageTabs,
    loading,
    error,
  };
}