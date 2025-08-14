/**
 * app/hooks/useShortcodes.ts
 * * Enhanced custom hook with intelligent cache management.
 * Automatically updates the local cache for instantly visible changes.
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
import { useTranslation } from '../contexts/LanguageContext';

// Interface for shortcodes (uses the one from the cache)
export interface Shortcode extends ShortcodeItem {}

interface UseShortcodesReturn {
  // Data state
  dimensions: string[];
  selectedDimension: string;
  shortcodes: Shortcode[];
  allShortcodes: Shortcode[];
  isCustomList: boolean;
  customDimensions: Set<string>;
  
  // Loading states and messages
  loading: boolean;
  error: string | null;
  success: string | null;
  
  // Navigation actions
  setSelectedDimension: (dimension: string) => void;
  
  // List management actions
  handleCreateCustomList: () => Promise<void>;
  handleDeleteCustomList: () => Promise<void>;
  
  // Shortcode management actions
  handleAddShortcode: (shortcodeId: string) => Promise<void>;
  handleRemoveShortcode: (shortcodeId: string) => Promise<void>;
  handleCreateShortcode: (shortcodeData: {
    SH_Code: string;
    SH_Default_UTM: string;
    SH_Display_Name_FR: string;
    SH_Display_Name_EN: string;
  }) => Promise<void>;
  handleUpdateShortcode: (shortcodeId: string, data: Partial<Shortcode>) => Promise<void>;
  
  // Utility actions
  refreshShortcodes: () => Promise<void>;
  clearMessages: () => void;
}

// List of available dimensions
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
 * Hook for intelligent shortcode management with optimized cache.
 * Automatically updates the local cache for instantly visible changes.
 */
export function useShortcodes(): UseShortcodesReturn {
  const { t } = useTranslation();
  const { selectedClient } = useClient();
  
  // Data states
  const [dimensions] = useState<string[]>(AVAILABLE_DIMENSIONS);
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [shortcodes, setShortcodes] = useState<Shortcode[]>([]);
  const [allShortcodes, setAllShortcodes] = useState<Shortcode[]>([]);
  const [isCustomList, setIsCustomList] = useState<boolean>(false);
  const [customDimensions, setCustomDimensions] = useState<Set<string>>(new Set());
  
  // Loading states and messages
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Updates the local shortcode cache after a modification.
   */
  const updateLocalShortcodeCache = useCallback((shortcodeId: string, updatedData: Partial<Shortcode>) => {
    const cachedShortcodes = getCachedAllShortcodes();
    if (cachedShortcodes && cachedShortcodes[shortcodeId]) {
      // Update the shortcode in the cache
      const updatedShortcode = { ...cachedShortcodes[shortcodeId], ...updatedData };
      cachedShortcodes[shortcodeId] = updatedShortcode;
      
      // Save the updated cache
      const now = Date.now();
      const cacheEntry = {
        data: cachedShortcodes,
        timestamp: now,
        expiresAt: now + (168 * 60 * 60 * 1000) // 168h
      };
      localStorage.setItem('mediabox-cache-all-shortcodes', JSON.stringify(cacheEntry));
      
      // Update the local state
      setAllShortcodes(Object.values(cachedShortcodes));
      
      console.log(`[CACHE] Shortcode ${shortcodeId} mis à jour localement`);
    }
  }, []);

  /**
   * Adds a new shortcode to the local cache.
   */
  const addToLocalShortcodeCache = useCallback((shortcode: Shortcode) => {
    const cachedShortcodes = getCachedAllShortcodes();
    if (cachedShortcodes) {
      // Add the new shortcode
      cachedShortcodes[shortcode.id] = shortcode;
      
      // Save the updated cache
      const now = Date.now();
      const cacheEntry = {
        data: cachedShortcodes,
        timestamp: now,
        expiresAt: now + (168 * 60 * 60 * 1000) // 168h
      };
      localStorage.setItem('mediabox-cache-all-shortcodes', JSON.stringify(cacheEntry));
      
      // Update the local state
      setAllShortcodes(Object.values(cachedShortcodes));
      
      console.log(`[CACHE] Nouveau shortcode ${shortcode.id} ajouté au cache local`);
    }
  }, []);

  /**
   * Updates the local list cache after adding/removing a shortcode.
   */
  const updateLocalListCache = useCallback((dimension: string, clientId: string, shortcodeId: string, action: 'add' | 'remove') => {
    const optimizedLists = getCachedOptimizedLists();
    if (optimizedLists && optimizedLists[dimension] && optimizedLists[dimension][clientId]) {
      const currentList = optimizedLists[dimension][clientId];
      
      if (action === 'add' && !currentList.includes(shortcodeId)) {
        // Add the shortcode to the list
        optimizedLists[dimension][clientId] = [...currentList, shortcodeId];
      } else if (action === 'remove') {
        // Remove the shortcode from the list
        optimizedLists[dimension][clientId] = currentList.filter(id => id !== shortcodeId);
      }
      
      // Save the updated cache
      const now = Date.now();
      const cacheEntry = {
        data: optimizedLists,
        timestamp: now,
        expiresAt: now + (168 * 60 * 60 * 1000) // 168h
      };
      localStorage.setItem('mediabox-cache-optimized-lists', JSON.stringify(cacheEntry));
      
      console.log(`[CACHE] Liste ${dimension}/${clientId} mise à jour localement (${action} ${shortcodeId})`);
    }
  }, []);

  /**
   * Updates custom dimensions in the local cache.
   */
  const updateLocalCustomDimensions = useCallback((dimension: string, clientId: string, action: 'add' | 'remove') => {
    const optimizedLists = getCachedOptimizedLists();
    if (optimizedLists) {
      if (action === 'add') {
        // Create the structure for this dimension if it doesn't exist
        if (!optimizedLists[dimension]) {
          optimizedLists[dimension] = {};
        }
        // Ensure the client has an entry (even if empty)
        if (!optimizedLists[dimension][clientId]) {
          optimizedLists[dimension][clientId] = [];
        }
      } else if (action === 'remove') {
        // Delete the client list for this dimension
        if (optimizedLists[dimension] && optimizedLists[dimension][clientId]) {
          delete optimizedLists[dimension][clientId];
        }
      }
      
      // Save the updated cache
      const now = Date.now();
      const cacheEntry = {
        data: optimizedLists,
        timestamp: now,
        expiresAt: now + (168 * 60 * 60 * 1000) // 168h
      };
      localStorage.setItem('mediabox-cache-optimized-lists', JSON.stringify(cacheEntry));
      
      console.log(`[CACHE] Dimension personnalisée ${dimension} ${action} pour client ${clientId}`);
    }
  }, []);

  /**
   * Detects which dimensions have custom lists for the current client.
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
    
    // Iterate through all dimensions and check if the client has a custom list
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
   * Loads all shortcodes from the cache.
   */
  const loadAllShortcodes = useCallback(() => {
    const cachedShortcodes = getCachedAllShortcodes();
    if (cachedShortcodes) {
      const shortcodesArray = Object.values(cachedShortcodes);
      setAllShortcodes(shortcodesArray);
    }
  }, []);

  /**
   * Loads shortcodes for a specific dimension.
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
      // First, check if the client really has a custom list
      const optimizedLists = getCachedOptimizedLists();
      const hasCustom = optimizedLists && 
                       optimizedLists[dimension] && 
                       optimizedLists[dimension][selectedClient.clientId];
      
      if (hasCustom) {
        // The client has a custom list
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
        // Use the PlusCo list
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
      setError(t('useShortcodes.notifications.loadError'));
      setShortcodes([]);
      setIsCustomList(false);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, t]);

  /**
   * Loads initial data when the client changes.
   */
  useEffect(() => {
    loadAllShortcodes();
    detectCustomDimensions();
    if (selectedDimension) {
      loadShortcodesForDimension(selectedDimension);
    }
  }, [selectedClient, loadAllShortcodes, detectCustomDimensions, loadShortcodesForDimension, selectedDimension]);

  /**
   * Changes the selected dimension and loads the corresponding shortcodes.
   */
  const handleSetSelectedDimension = useCallback((dimension: string) => {
    setSelectedDimension(dimension);
    loadShortcodesForDimension(dimension);
  }, [loadShortcodesForDimension]);

  /**
   * Creates a custom list for the current client with optimistic cache update.
   */
  const handleCreateCustomList = useCallback(async () => {
    if (!selectedClient || !selectedDimension) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Optimistic cache update
      updateLocalCustomDimensions(selectedDimension, selectedClient.clientId, 'add');
      
      // Copy the PlusCo list to the local cache
      const plusCoList = getListForClient(selectedDimension, 'PlusCo');
      if (plusCoList) {
        const optimizedLists = getCachedOptimizedLists();
        if (optimizedLists) {
          if (!optimizedLists[selectedDimension]) {
            optimizedLists[selectedDimension] = {};
          }
          optimizedLists[selectedDimension][selectedClient.clientId] = plusCoList.map(s => s.id);
          
          // Save
          const now = Date.now();
          const cacheEntry = {
            data: optimizedLists,
            timestamp: now,
            expiresAt: now + (48 * 60 * 60 * 1000)
          };
          localStorage.setItem('mediabox-cache-optimized-lists', JSON.stringify(cacheEntry));
        }
      }

      // Firebase call
      await createCustomListFromPlusCo(selectedDimension, selectedClient.clientId);
      
      setSuccess(t('useShortcodes.notifications.createCustomListSuccess'));
      
      // Reload from the updated cache
      await loadShortcodesForDimension(selectedDimension);
      detectCustomDimensions();
      
    } catch (err) {
      console.error('Erreur lors de la création de la liste personnalisée:', err);
      setError(t('useShortcodes.notifications.createCustomListError'));
      
      // Optimistic rollback
      updateLocalCustomDimensions(selectedDimension, selectedClient.clientId, 'remove');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, loadShortcodesForDimension, detectCustomDimensions, updateLocalCustomDimensions, t]);

  /**
   * Deletes the custom list for the current client with optimistic cache update.
   */
  const handleDeleteCustomList = useCallback(async () => {
    if (!selectedClient || !selectedDimension) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Optimistic cache update
      updateLocalCustomDimensions(selectedDimension, selectedClient.clientId, 'remove');

      // Firebase call
      await deleteCustomList(selectedDimension, selectedClient.clientId);
      
      setSuccess(t('useShortcodes.notifications.deleteCustomListSuccess'));
      
      // Reload from the updated cache
      await loadShortcodesForDimension(selectedDimension);
      detectCustomDimensions();
      
    } catch (err) {
      console.error('Erreur lors de la suppression de la liste personnalisée:', err);
      setError(t('useShortcodes.notifications.deleteCustomListError'));
      
      // Optimistic rollback
      updateLocalCustomDimensions(selectedDimension, selectedClient.clientId, 'add');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, loadShortcodesForDimension, detectCustomDimensions, updateLocalCustomDimensions, t]);

  /**
   * Adds an existing shortcode to the current list with optimistic update.
   */
  const handleAddShortcode = useCallback(async (shortcodeId: string) => {
    if (!selectedClient || !selectedDimension) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';

    try {
      // Optimistic list cache update
      updateLocalListCache(selectedDimension, targetClientId, shortcodeId, 'add');
      
      // Optimistic UI update
      const shortcodeToAdd = allShortcodes.find(s => s.id === shortcodeId);
      if (shortcodeToAdd) {
        setShortcodes(prev => [...prev, shortcodeToAdd].sort((a, b) => 
          a.SH_Display_Name_FR.localeCompare(b.SH_Display_Name_FR, 'fr', { sensitivity: 'base' })
        ));
      }

      // Firebase call
      await addShortcodeToDimension(selectedDimension, targetClientId, shortcodeId);
      
      setSuccess(t('useShortcodes.notifications.addShortcodeSuccess'));
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout du shortcode:', err);
      setError(t('useShortcodes.notifications.addShortcodeError'));
      
      // Optimistic rollback
      updateLocalListCache(selectedDimension, targetClientId, shortcodeId, 'remove');
      await loadShortcodesForDimension(selectedDimension);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, isCustomList, allShortcodes, loadShortcodesForDimension, updateLocalListCache, t]);

  /**
   * Removes a shortcode from the current list with optimistic update.
   */
  const handleRemoveShortcode = useCallback(async (shortcodeId: string) => {
    if (!selectedClient || !selectedDimension) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';

    try {
      // Optimistic list cache update
      updateLocalListCache(selectedDimension, targetClientId, shortcodeId, 'remove');
      
      // Optimistic UI update
      setShortcodes(prev => prev.filter(s => s.id !== shortcodeId));

      // Firebase call
      await removeShortcodeFromDimension(selectedDimension, targetClientId, shortcodeId);
      
      setSuccess(t('useShortcodes.notifications.removeShortcodeSuccess'));
      
    } catch (err) {
      console.error('Erreur lors de la suppression du shortcode:', err);
      setError(t('useShortcodes.notifications.removeShortcodeError'));
      
      // Optimistic rollback
      updateLocalListCache(selectedDimension, targetClientId, shortcodeId, 'add');
      await loadShortcodesForDimension(selectedDimension);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, isCustomList, loadShortcodesForDimension, updateLocalListCache, t]);

  /**
   * Creates a new shortcode and adds it to the current list with optimistic update.
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
      // Firebase call to create the shortcode
      const newShortcodeId = await createShortcode(shortcodeData);
      
      // Create the complete shortcode object
      const newShortcode: Shortcode = {
        id: newShortcodeId,
        ...shortcodeData
      };
      
      // Update the shortcodes cache
      addToLocalShortcodeCache(newShortcode);
      
      // Add the new shortcode to the current list
      const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';
      await addShortcodeToDimension(selectedDimension, targetClientId, newShortcodeId);
      
      // Update the list cache
      updateLocalListCache(selectedDimension, targetClientId, newShortcodeId, 'add');
      
      // Optimistic UI update
      setShortcodes(prev => [...prev, newShortcode].sort((a, b) => 
        a.SH_Display_Name_FR.localeCompare(b.SH_Display_Name_FR, 'fr', { sensitivity: 'base' })
      ));
      
      setSuccess(t('useShortcodes.notifications.createShortcodeSuccess'));
      
    } catch (err) {
      console.error('Erreur lors de la création du shortcode:', err);
      setError(t('useShortcodes.notifications.createShortcodeError'));
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, isCustomList, addToLocalShortcodeCache, updateLocalListCache, t]);

  /**
   * Updates an existing shortcode with optimistic cache update.
   */
  const handleUpdateShortcode = useCallback(async (shortcodeId: string, data: Partial<Shortcode>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Firebase call
      await updateShortcode(shortcodeId, data);
      
      // Optimistic cache update
      updateLocalShortcodeCache(shortcodeId, data);
      
      // Optimistic local UI update
      setShortcodes(prev => prev.map(s => 
        s.id === shortcodeId ? { ...s, ...data } : s
      ));
      
      setSuccess(t('useShortcodes.notifications.updateShortcodeSuccess'));
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour du shortcode:', err);
      setError(t('useShortcodes.notifications.updateShortcodeError'));
      throw err; // Re-throw so components can handle the error
    } finally {
      setLoading(false);
    }
  }, [updateLocalShortcodeCache, t]);

  /**
   * Refreshes the shortcodes of the current dimension from the cache.
   */
  const refreshShortcodes = useCallback(async () => {
    if (selectedDimension) {
      loadAllShortcodes();
      await loadShortcodesForDimension(selectedDimension);
      detectCustomDimensions();
    }
  }, [selectedDimension, loadAllShortcodes, loadShortcodesForDimension, detectCustomDimensions]);

  /**
   * Clears error and success messages.
   */
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    // Data state
    dimensions,
    selectedDimension,
    shortcodes,
    allShortcodes,
    isCustomList,
    customDimensions,
    
    // Loading states and messages
    loading,
    error,
    success,
    
    // Navigation actions
    setSelectedDimension: handleSetSelectedDimension,
    
    // List management actions
    handleCreateCustomList,
    handleDeleteCustomList,
    
    // Shortcode management actions
    handleAddShortcode,
    handleRemoveShortcode,
    handleCreateShortcode,
    handleUpdateShortcode,
    
    // Utility actions
    refreshShortcodes,
    clearMessages
  };
}