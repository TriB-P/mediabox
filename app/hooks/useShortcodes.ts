/**
 * app/hooks/useShortcodes.ts
 * 
 * Hook personnalisé pour la gestion des shortcodes sans pagination.
 * Version optimisée qui utilise le système de cache pour charger tous les shortcodes d'un coup.
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
  deleteCustomList
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
  
  // Actions utilitaires
  refreshShortcodes: () => Promise<void>;
  clearMessages: () => void;
}

// Liste des dimensions disponibles
const AVAILABLE_DIMENSIONS = [
  'CA_Custom_Dim_1', 'CA_Custom_Dim_2', 'CA_Custom_Dim_3', 
  'CA_Division', 'CA_Quarter', 'CA_Year', 
  'TC_Buying_Method', 'TC_Custom_Dim_1', 'TC_Custom_Dim_2', 'TC_Custom_Dim_3', 
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
 * Hook pour la gestion des shortcodes et listes client.
 * Version optimisée sans pagination qui utilise le cache local.
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
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Essayer d'abord la liste client, puis PlusCo en fallback
      const clientList = getListForClient(dimension, selectedClient.clientId);
      
      if (clientList && clientList.length > 0) {
        setShortcodes(clientList);
        setIsCustomList(true);
        console.log(`[SHORTCODES] Liste personnalisée chargée pour ${dimension}: ${clientList.length} shortcodes`);
      } else {
        // Fallback sur PlusCo
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
   * Crée une liste personnalisée pour le client actuel.
   */
  const handleCreateCustomList = useCallback(async () => {
    if (!selectedClient || !selectedDimension) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await createCustomListFromPlusCo(selectedDimension, selectedClient.clientId);
      setSuccess('Liste personnalisée créée avec succès');
      await loadShortcodesForDimension(selectedDimension);
      detectCustomDimensions(); // Re-détecter les dimensions custom
    } catch (err) {
      console.error('Erreur lors de la création de la liste personnalisée:', err);
      setError('Erreur lors de la création de la liste personnalisée');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, loadShortcodesForDimension, detectCustomDimensions]);

  /**
   * Supprime la liste personnalisée du client actuel.
   */
  const handleDeleteCustomList = useCallback(async () => {
    if (!selectedClient || !selectedDimension) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteCustomList(selectedDimension, selectedClient.clientId);
      setSuccess('Liste personnalisée supprimée avec succès');
      await loadShortcodesForDimension(selectedDimension);
      detectCustomDimensions(); // Re-détecter les dimensions custom
    } catch (err) {
      console.error('Erreur lors de la suppression de la liste personnalisée:', err);
      setError('Erreur lors de la suppression de la liste personnalisée');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, loadShortcodesForDimension, detectCustomDimensions]);

  /**
   * Ajoute un shortcode existant à la liste actuelle.
   */
  const handleAddShortcode = useCallback(async (shortcodeId: string) => {
    if (!selectedClient || !selectedDimension) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';
      await addShortcodeToDimension(selectedDimension, targetClientId, shortcodeId);
      setSuccess('Shortcode ajouté avec succès');
      await loadShortcodesForDimension(selectedDimension);
    } catch (err) {
      console.error('Erreur lors de l\'ajout du shortcode:', err);
      setError('Erreur lors de l\'ajout du shortcode');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, isCustomList, loadShortcodesForDimension]);

  /**
   * Retire un shortcode de la liste actuelle.
   */
  const handleRemoveShortcode = useCallback(async (shortcodeId: string) => {
    if (!selectedClient || !selectedDimension) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';
      await removeShortcodeFromDimension(selectedDimension, targetClientId, shortcodeId);
      setSuccess('Shortcode retiré avec succès');
      await loadShortcodesForDimension(selectedDimension);
    } catch (err) {
      console.error('Erreur lors de la suppression du shortcode:', err);
      setError('Erreur lors de la suppression du shortcode');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, isCustomList, loadShortcodesForDimension]);

  /**
   * Crée un nouveau shortcode et l'ajoute à la liste actuelle.
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
      const newShortcodeId = await createShortcode(shortcodeData);
      
      // Ajouter le nouveau shortcode à la liste actuelle
      const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';
      await addShortcodeToDimension(selectedDimension, targetClientId, newShortcodeId);
      
      setSuccess('Shortcode créé et ajouté avec succès');
      
      // Recharger les données
      loadAllShortcodes();
      await loadShortcodesForDimension(selectedDimension);
    } catch (err) {
      console.error('Erreur lors de la création du shortcode:', err);
      setError('Erreur lors de la création du shortcode');
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDimension, isCustomList, loadAllShortcodes, loadShortcodesForDimension]);

  /**
   * Rafraîchit les shortcodes de la dimension actuelle.
   */
  const refreshShortcodes = useCallback(async () => {
    if (selectedDimension) {
      loadAllShortcodes();
      await loadShortcodesForDimension(selectedDimension);
    }
  }, [selectedDimension, loadAllShortcodes, loadShortcodesForDimension]);

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
    
    // Actions utilitaires
    refreshShortcodes,
    clearMessages
  };
}