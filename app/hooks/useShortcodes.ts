/**
 * app/hooks/useShortcodes.ts
 * 
 * Hook personnalisé amélioré avec gestion intelligente du cache.
 * Met automatiquement à jour le cache local pour des modifications instantanément visibles.
 */

import { useState, useEffect, useCallback } from 'react';
import { useClient } from '../contexts/ClientContext';
import { 
  getCachedAllShortcodes, 
  getListForClient, 
  getCachedOptimizedLists,
  ShortcodeItem 
} from '../lib/cacheService';
import { 
  createShortcode, 
  addShortcodeToDimension, 
  removeShortcodeFromDimension,
  createCustomListFromPlusCo,
  deleteCustomList,
  updateShortcode
} from '../lib/shortcodeService';

// Interface pour les shortcodes (utilise celle du cache)
export interface Shortcode extends ShortcodeItem {}

interface UseShortcodesReturn {
  // État des données
  dimensions: string[];
  selectedDimension: string;
  shortcodes: Shortcode[];
  allShortcodes: Shortcode[];
  isCustomList: boolean;
  customDimensions: Set<string>;
  
  // États de chargement et messages
  loading: boolean;
  error: string | null;
  success: string | null;
  
  // Actions de navigation
  setSelectedDimension: (dimension: string) => void;
  
  // Actions de gestion des listes
  handleCreateCustomList: () => Promise<void>;
  handleDeleteCustomList: () => Promise<void>;
  
  // Actions de gestion des shortcodes
  handleAddShortcode: (shortcodeId: string) => Promise<void>;
  handleRemoveShortcode: (shortcodeId: string) => Promise<void>;
  handleCreateShortcode: (shortcodeData: {
    SH_Code: string;
    SH_Default_UTM: string;
    SH_Display_Name_FR: string;
    SH_Display_Name_EN: string;
  }) => Promise<void>;
  handleUpdateShortcode: (shortcodeId: string, data: Partial<Shortcode>) => Promise<void>;
  
  // Actions utilitaires
  refreshShortcodes: () => Promise<void>;
  clearMessages: () => void;
}

// Liste des dimensions disponibles
const AVAILABLE_DIMENSIONS = [
  'CA_Custom_Dim_1', 'CA_Custom_Dim_2', 'CA_Custom_Dim_3', 
  'CA_Division', 'CA_Quarter', 'CA_Year', 
  'TC_Prog_Buying_Method', 'TC_Custom_Dim_1', 'TC_Custom_Dim_2', 'TC_Custom_Dim_3', 
  'TC_Kpi', 'TC_LOB', 'TC_Market', 'TC_Media_Objective', 'TC_Media_Type', 
  'TC_Unit_Type', 'TC_Inventory', 'TC_Publisher',
  'PL_Audience_Behaviour', 'PL_Audience_Demographics', 'PL_Audience_Engagement', 
  'PL_Audience_Interest', 'PL_Audience_Other', 'PL_Creative_Grouping', 
  'PL_Device', 'PL_Market_Details', 'PL_Product', 'PL_Segment_Open', 
  'PL_Tactic_Category', 'PL_Targeting', 'PL_Custom_Dim_1', 'PL_Custom_Dim_2', 
  'PL_Custom_Dim_3', 'PL_Channel', 'PL_Format', 'PL_Language', 'PL_Placement_Location', 
  'CR_Custom_Dim_1', 'CR_Custom_Dim_2', 'CR_Custom_Dim_3', 'CR_CTA', 
  'CR_Format_Details', 'CR_Offer', 'CR_Plateform_Name', 'CR_Primary_Product', 
  'CR_URL', 'CR_Version'
];

/**
 * Hook pour la gestion intelligente des shortcodes avec cache optimisé.
 * Met automatiquement à jour le cache local pour des modifications instantanément visibles.
 */
export function useShortcodes(): UseShortcodesReturn {
  const { selectedClient } = useClient();
  
  // États des données
  const [dimensions] = useState<string[]>(AVAILABLE_DIMENSIONS);
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [shortcodes, setShortcodes] = useState<Shortcode[]>([]);
  const [allShortcodes, setAllShortcodes] = useState<Shortcode[]>([]);
  const [isCustomList, setIsCustomList] = useState<boolean>(false);
  const [customDimensions, setCustomDimensions] = useState<Set<string>>(new Set());
  
  // États de chargement et messages
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Met à jour le cache local des shortcodes après une modification.
   */
  const updateLocalShortcodeCache = useCallback((shortcodeId: string, updatedData: Partial<Shortcode>) => {
    const cachedShortcodes = getCachedAllShortcodes();
    if (cachedShortcodes && cachedShortcodes[shortcodeId]) {
      // Mettre à jour le shortcode dans le cache
      const updatedShortcode = { ...cachedShortcodes[shortcodeId], ...updatedData };
      cachedShortcodes[shortcodeId] = updatedShortcode;
      
      // Sauvegarder le cache mis à jour
      const now = Date.now();
      const cacheEntry = {
        data: cachedShortcodes,
        timestamp: now,
        expiresAt: now + (48 * 60 * 60 * 1000) // 48h
      };
      localStorage.setItem('mediabox-cache-all-shortcodes', JSON.stringify(cacheEntry));
      
      // Mettre à jour l'état local
      setAllShortcodes(Object.values(cachedShortcodes));
      
      console.log(`[CACHE] Shortcode ${shortcodeId} mis à jour localement`);
    }
  }, []);

  /**
   * Ajoute un nouveau shortcode au cache local.
   */
  const addToLocalShortcodeCache = useCallback((shortcode: Shortcode) => {
    const cachedShortcodes = getCachedAllShortcodes();
    if (cachedShortcodes) {
      // Ajouter le nouveau shortcode
      cachedShortcodes[shortcode.id] = shortcode;
      
      // Sauvegarder le cache mis à jour
      const now = Date.now();
      const cacheEntry = {
        data: cachedShortcodes,
        timestamp: now,
        expiresAt: now + (48 * 60 * 60 * 1000) // 48h
      };
      localStorage.setItem('mediabox-cache-all-shortcodes', JSON.stringify(cacheEntry));
      
      // Mettre à jour l'état local
      setAllShortcodes(Object.values(cachedShortcodes));
      
      console.log(`[CACHE] Nouveau shortcode ${shortcode.id} ajouté au cache local`);
    }
  }, []);

  /**
   * Met à jour le cache local des listes après ajout/suppression de shortcode.
   */
  const updateLocalListCache = useCallback((dimension: string, clientId: string, shortcodeId: string, action: 'add' | 'remove') => {
    const optimizedLists = getCachedOptimizedLists();
    if (optimizedLists && optimizedLists[dimension] && optimizedLists[dimension][clientId]) {
      const currentList = optimizedLists[dimension][clientId];
      
      if (action === 'add' && !currentList.includes(shortcodeId)) {
        // Ajouter le shortcode à la liste
        optimizedLists[dimension][clientId] = [...currentList, shortcodeId];
      } else if (action === 'remove') {
        // Retirer le shortcode de la liste
        optimizedLists[dimension][clientId] = currentList.filter(id => id !== shortcodeId);
      }
      
      // Sauvegarder le cache mis à jour
      const now = Date.now();
      const cacheEntry = {
        data: optimizedLists,
        timestamp: now,
        expiresAt: now + (48 * 60 * 60 * 1000) // 48h
      };
      localStorage.setItem('mediabox-cache-optimized-lists', JSON.stringify(cacheEntry));
      
      console.log(`[CACHE] Liste ${dimension}/${clientId} mise à jour localement (${action} ${shortcodeId})`);
    }
  }, []);

  /**
   * Met à jour les dimensions personnalisées dans le cache local.
   */
  const updateLocalCustomDimensions = useCallback((dimension: string, clientId: string, action: 'add' | 'remove') => {
    const optimizedLists = getCachedOptimizedLists();
    if (optimizedLists) {
      if (action === 'add') {
        // Créer la structure pour cette dimension si elle n'existe pas
        if (!optimizedLists[dimension]) {
          optimizedLists[dimension] = {};
        }
        // S'assurer que le client a une entrée (même vide)
        if (!optimizedLists[dimension][clientId]) {
          optimizedLists[dimension][clientId] = [];
        }
      } else if (action === 'remove') {
        // Supprimer la liste client pour cette dimension
        if (optimizedLists[dimension] && optimizedLists[dimension][clientId]) {
          delete optimizedLists[dimension][clientId];
        }
      }
      
      // Sauvegarder le cache mis à jour
      const now = Date.now();
      const cacheEntry = {
        data: optimizedLists,
        timestamp: now,
        expiresAt: now + (48 * 60 * 60 * 1000) // 48h
      };
      localStorage.setItem('mediabox-cache-optimized-lists', JSON.stringify(cacheEntry));
      
      console.log(`[CACHE] Dimension personnalisée ${dimension} ${action} pour client ${clientId}`);
    }
  }, []);

  /**
   * Détecte quelles dimensions ont des listes personnalisées pour le client actuel.
   */
  const detectCustomDimensions = useCallback(() => {
    if (!selectedClient) {
      setCustomDimensions(new Set());
      return;
    }

    const optimizedLists = getCachedOptimizedLists();
    if (!optimizedLists) {
      setCustomDimensions(new Set());
      return;
    }

    const customDims = new Set<string>();
    
    // Parcourir toutes les dimensions et vérifier si le client a une liste personnalisée
    AVAILABLE_DIMENSIONS.forEach(dimension => {
      const listStructure = optimizedLists[dimension];
      if (listStructure && listStructure[selectedClient.clientId]) {
        customDims.add(dimension);
      }
    });

    setCustomDimensions(customDims);
    console.log(`[SHORTCODES] ${customDims.size} dimensions personnalisées détectées pour ${selectedClient.CL_Name}`);
  }, [selectedClient]);

  /**
   * Charge tous les shortcodes depuis le cache.
   */
  const loadAllShortcodes = useCallback(() => {
    const cachedShortcodes = getCachedAllShortcodes();
    if (cachedShortcodes) {
      const shortcodesArray = Object.values(cachedShortcodes);
      setAllShortcodes(shortcodesArray);
    }
  }, []);

  /**
   * Charge les shortcodes pour une dimension spécifique.
   */
  const loadShortcodesForDimension = useCallback(async (dimension: string) => {
    if (!selectedClient || !dimension) {
      setShortcodes([]);
      setIsCustomList(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Vérifier d'abord si le client a vraiment une liste personnalisée
      const optimizedLists = getCachedOptimizedLists();
      const hasCustom = optimizedLists && 
                       optimizedLists[dimension] && 
                       optimizedLists[dimension][selectedClient.clientId];
      
      if (hasCustom) {
        // Le client a une liste personnalisée
        const clientList = getListForClient(dimension, selectedClient.clientId);
        if (clientList) {
          setShortcodes(clientList);
          setIsCustomList(true);
          console.log(`[SHORTCODES] Liste personnalisée chargée pour ${dimension}: ${clientList.length} shortcodes`);
        } else {
          setShortcodes([]);
          setIsCustomList(false);
        }
      } else {
        // Utiliser la liste PlusCo
        const plusCoList = getListForClient(dimension, 'PlusCo');
        if (plusCoList) {
          setShortcodes(plusCoList);
          setIsCustomList(false);
          console.log(`[SHORTCODES] Liste PlusCo chargée pour ${dimension}: ${plusCoList.length} shortcodes`);
        } else {
          setShortcodes([]);
          setIsCustomList(false);
          console.log(`[SHORTCODES] Aucune liste trouvée pour ${dimension}`);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des shortcodes:', err);
      setError('Erreur lors du chargement des shortcodes');
      setShortcodes([]);
      setIsCustomList(false);
    } finally {
      setLoading(false);
    }
  }, [selectedClient]);

  /**
   * Charge les données initiales quand le client change.
   */
  useEffect(() => {
    loadAllShortcodes();
    detectCustomDimensions();
    if (selectedDimension) {
      loadShortcodesForDimension(selectedDimension);
    }
  }, [selectedClient, loadAllShortcodes, detectCustomDimensions, loadShortcodesForDimension, selectedDimension]);

  /**
   * Change la dimension sélectionnée et charge les shortcodes correspondants.
   */
  const handleSetSelectedDimension = useCallback((dimension: string) => {
    setSelectedDimension(dimension);
    loadShortcodesForDimension(dimension);
  }, [loadShortcodesForDimension]);

  /**
   * Crée une liste personnalisée pour le client actuel avec mise à jour optimiste du cache.
   */
  const handleCreateCustomList = useCallback(async () => {
    if (!selectedClient || !selectedDimension) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Mise à jour optimiste du cache
      updateLocalCustomDimensions(selectedDimension, selectedClient.clientId, 'add');
      
      // Copier la liste PlusCo dans le cache local
      const plusCoList = getListForClient(selectedDimension, 'PlusCo');
      if (plusCoList) {
        const optimizedLists = getCachedOptimizedLists();
        if (optimizedLists) {
          if (!optimizedLists[selectedDimension]) {
            optimizedLists[selectedDimension] = {};
          }
          optimizedLists[selectedDimension][selectedClient.clientId] = plusCoList.map(s => s.id);
          
          // Sauvegarder
          const now = Date.now();
          const cacheEntry = {
            data: optimizedLists,
            timestamp: now,
            expiresAt: now + (48 * 60 * 60 * 1000)
          };
          localStorage.setItem('mediabox-cache-optimized-lists', JSON.stringify(cacheEntry));
        }
      }

      // Appel Firebase
      await createCustomListFromPlusCo(selectedDimension, selectedClient.clientId);
      
      setSuccess('Liste personnalisée créée avec succès');
      
      // Recharger depuis le cache mis à jour
      await loadShortcodesForDimension(selectedDimension);
      detectCustomDimensions();
      
    } catch (err) {
      console.error('Erreur lors de la création de la liste personnalisée:', err);
      setError('Erreur lors de la création de la liste personnalisée');
      
      // Rollback optimiste
      updateLocalCustomDimensions(selectedDimension, selectedClient.clientId, 'remove');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, loadShortcodesForDimension, detectCustomDimensions, updateLocalCustomDimensions]);

  /**
   * Supprime la liste personnalisée du client actuel avec mise à jour optimiste du cache.
   */
  const handleDeleteCustomList = useCallback(async () => {
    if (!selectedClient || !selectedDimension) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Mise à jour optimiste du cache
      updateLocalCustomDimensions(selectedDimension, selectedClient.clientId, 'remove');

      // Appel Firebase
      await deleteCustomList(selectedDimension, selectedClient.clientId);
      
      setSuccess('Liste personnalisée supprimée avec succès');
      
      // Recharger depuis le cache mis à jour
      await loadShortcodesForDimension(selectedDimension);
      detectCustomDimensions();
      
    } catch (err) {
      console.error('Erreur lors de la suppression de la liste personnalisée:', err);
      setError('Erreur lors de la suppression de la liste personnalisée');
      
      // Rollback optimiste
      updateLocalCustomDimensions(selectedDimension, selectedClient.clientId, 'add');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, loadShortcodesForDimension, detectCustomDimensions, updateLocalCustomDimensions]);

  /**
   * Ajoute un shortcode existant à la liste actuelle avec mise à jour optimiste.
   */
  const handleAddShortcode = useCallback(async (shortcodeId: string) => {
    if (!selectedClient || !selectedDimension) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';

    try {
      // Mise à jour optimiste du cache de liste
      updateLocalListCache(selectedDimension, targetClientId, shortcodeId, 'add');
      
      // Mise à jour optimiste de l'interface
      const shortcodeToAdd = allShortcodes.find(s => s.id === shortcodeId);
      if (shortcodeToAdd) {
        setShortcodes(prev => [...prev, shortcodeToAdd].sort((a, b) => 
          a.SH_Display_Name_FR.localeCompare(b.SH_Display_Name_FR, 'fr', { sensitivity: 'base' })
        ));
      }

      // Appel Firebase
      await addShortcodeToDimension(selectedDimension, targetClientId, shortcodeId);
      
      setSuccess('Shortcode ajouté avec succès');
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout du shortcode:', err);
      setError('Erreur lors de l\'ajout du shortcode');
      
      // Rollback optimiste
      updateLocalListCache(selectedDimension, targetClientId, shortcodeId, 'remove');
      await loadShortcodesForDimension(selectedDimension);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, isCustomList, allShortcodes, loadShortcodesForDimension, updateLocalListCache]);

  /**
   * Retire un shortcode de la liste actuelle avec mise à jour optimiste.
   */
  const handleRemoveShortcode = useCallback(async (shortcodeId: string) => {
    if (!selectedClient || !selectedDimension) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';

    try {
      // Mise à jour optimiste du cache de liste
      updateLocalListCache(selectedDimension, targetClientId, shortcodeId, 'remove');
      
      // Mise à jour optimiste de l'interface
      setShortcodes(prev => prev.filter(s => s.id !== shortcodeId));

      // Appel Firebase
      await removeShortcodeFromDimension(selectedDimension, targetClientId, shortcodeId);
      
      setSuccess('Shortcode retiré avec succès');
      
    } catch (err) {
      console.error('Erreur lors de la suppression du shortcode:', err);
      setError('Erreur lors de la suppression du shortcode');
      
      // Rollback optimiste
      updateLocalListCache(selectedDimension, targetClientId, shortcodeId, 'add');
      await loadShortcodesForDimension(selectedDimension);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, isCustomList, loadShortcodesForDimension, updateLocalListCache]);

  /**
   * Crée un nouveau shortcode et l'ajoute à la liste actuelle avec mise à jour optimiste.
   */
  const handleCreateShortcode = useCallback(async (shortcodeData: {
    SH_Code: string;
    SH_Default_UTM: string;
    SH_Display_Name_FR: string;
    SH_Display_Name_EN: string;
  }) => {
    if (!selectedClient || !selectedDimension) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Appel Firebase pour créer le shortcode
      const newShortcodeId = await createShortcode(shortcodeData);
      
      // Créer l'objet shortcode complet
      const newShortcode: Shortcode = {
        id: newShortcodeId,
        ...shortcodeData
      };
      
      // Mettre à jour le cache des shortcodes
      addToLocalShortcodeCache(newShortcode);
      
      // Ajouter le nouveau shortcode à la liste actuelle
      const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';
      await addShortcodeToDimension(selectedDimension, targetClientId, newShortcodeId);
      
      // Mettre à jour le cache de liste
      updateLocalListCache(selectedDimension, targetClientId, newShortcodeId, 'add');
      
      // Mise à jour optimiste de l'interface
      setShortcodes(prev => [...prev, newShortcode].sort((a, b) => 
        a.SH_Display_Name_FR.localeCompare(b.SH_Display_Name_FR, 'fr', { sensitivity: 'base' })
      ));
      
      setSuccess('Shortcode créé et ajouté avec succès');
      
    } catch (err) {
      console.error('Erreur lors de la création du shortcode:', err);
      setError('Erreur lors de la création du shortcode');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, isCustomList, addToLocalShortcodeCache, updateLocalListCache]);

  /**
   * Met à jour un shortcode existant avec mise à jour optimiste du cache.
   */
  const handleUpdateShortcode = useCallback(async (shortcodeId: string, data: Partial<Shortcode>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Appel Firebase
      await updateShortcode(shortcodeId, data);
      
      // Mise à jour optimiste du cache
      updateLocalShortcodeCache(shortcodeId, data);
      
      // Mise à jour optimiste de l'interface locale
      setShortcodes(prev => prev.map(s => 
        s.id === shortcodeId ? { ...s, ...data } : s
      ));
      
      setSuccess('Shortcode mis à jour avec succès');
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour du shortcode:', err);
      setError('Erreur lors de la mise à jour du shortcode');
      throw err; // Re-throw pour que les composants puissent gérer l'erreur
    } finally {
      setLoading(false);
    }
  }, [updateLocalShortcodeCache]);

  /**
   * Rafraîchit les shortcodes de la dimension actuelle depuis le cache.
   */
  const refreshShortcodes = useCallback(async () => {
    if (selectedDimension) {
      loadAllShortcodes();
      await loadShortcodesForDimension(selectedDimension);
      detectCustomDimensions();
    }
  }, [selectedDimension, loadAllShortcodes, loadShortcodesForDimension, detectCustomDimensions]);

  /**
   * Efface les messages d'erreur et de succès.
   */
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    // État des données
    dimensions,
    selectedDimension,
    shortcodes,
    allShortcodes,
    isCustomList,
    customDimensions,
    
    // États de chargement et messages
    loading,
    error,
    success,
    
    // Actions de navigation
    setSelectedDimension: handleSetSelectedDimension,
    
    // Actions de gestion des listes
    handleCreateCustomList,
    handleDeleteCustomList,
    
    // Actions de gestion des shortcodes
    handleAddShortcode,
    handleRemoveShortcode,
    handleCreateShortcode,
    handleUpdateShortcode,
    
    // Actions utilitaires
    refreshShortcodes,
    clearMessages
  };
}