// app/hooks/useShortcodes.ts - Version avec pagination serveur

import { useState, useEffect, useCallback } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { useClient } from '../contexts/ClientContext';
import {
  getAllDimensions,
  getAllShortcodes,
  getClientDimensionShortcodesPaginated,
  getClientDimensionShortcodesCount,
  hasCustomList,
  addShortcodeToDimension,
  removeShortcodeFromDimension,
  createCustomListFromPlusCo,
  createShortcode,
  deleteCustomList,
  Shortcode,
  PaginatedShortcodeResponse
} from '../lib/shortcodeService';

interface UseShortcodesReturn {
  // Données
  dimensions: string[];
  selectedDimension: string;
  shortcodes: Shortcode[];
  allShortcodes: Shortcode[];
  isCustomList: boolean;
  
  // Pagination
  hasMore: boolean;
  totalCount: number;
  
  // États de chargement
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  success: string | null;
  
  // Actions
  setSelectedDimension: (dimension: string) => void;
  loadMoreShortcodes: () => Promise<void>;
  refreshShortcodes: () => Promise<void>;
  refreshAllShortcodes: () => Promise<void>;
  handleCreateCustomList: () => Promise<void>;
  handleDeleteCustomList: () => Promise<void>;
  handleAddShortcode: (shortcodeId: string) => Promise<void>;
  handleRemoveShortcode: (shortcodeId: string) => Promise<void>;
  handleCreateShortcode: (shortcodeData: {
    SH_Code: string;
    SH_Default_UTM: string;
    SH_Display_Name_FR: string;
    SH_Display_Name_EN: string;
  }) => Promise<void>;
  clearMessages: () => void;
}

export function useShortcodes(): UseShortcodesReturn {
  const { selectedClient } = useClient();
  
  // États principaux
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [shortcodes, setShortcodes] = useState<Shortcode[]>([]);
  const [allShortcodes, setAllShortcodes] = useState<Shortcode[]>([]);
  const [isCustomList, setIsCustomList] = useState(false);
  
  // États de pagination
  const [lastDocument, setLastDocument] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(50); // Taille de page fixe
  
  // États de chargement et messages
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger les dimensions au montage du composant
  useEffect(() => {
    loadDimensions();
  }, []);

  // Charger les shortcodes quand la dimension ou le client change
  useEffect(() => {
    if (selectedClient && selectedDimension) {
      loadClientDimensionShortcodes();
    }
  }, [selectedClient, selectedDimension]);

  const loadDimensions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedDimensions = await getAllDimensions();
      setDimensions(fetchedDimensions);
      
      // Sélectionner la première dimension par défaut
      if (fetchedDimensions.length > 0 && !selectedDimension) {
        setSelectedDimension(fetchedDimensions[0]);
      }
      
      // Charger tous les shortcodes disponibles (pour les modals d'ajout)
      const fetchedAllShortcodes = await getAllShortcodes();
      setAllShortcodes(fetchedAllShortcodes);
      
    } catch (err) {
      console.error('Erreur lors du chargement des dimensions:', err);
      setError('Impossible de charger les dimensions.');
    } finally {
      setLoading(false);
    }
  };

  const loadClientDimensionShortcodes = async (resetPagination = true) => {
    if (!selectedClient || !selectedDimension) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (resetPagination) {
        // Réinitialiser la pagination
        setShortcodes([]);
        setLastDocument(null);
        setHasMore(true);
      }
      
      // Vérifier si le client a une liste personnalisée
      const hasCustom = await hasCustomList(selectedDimension, selectedClient.clientId);
      setIsCustomList(hasCustom);
      
      // Charger le nombre total (optionnel, pour affichage)
      const count = await getClientDimensionShortcodesCount(selectedDimension, selectedClient.clientId);
      setTotalCount(count);
      
      // Charger la première page de shortcodes
      const response = await getClientDimensionShortcodesPaginated(
        selectedDimension,
        selectedClient.clientId,
        pageSize
      );
      
      setShortcodes(response.shortcodes);
      setLastDocument(response.lastDoc);
      setHasMore(response.hasMore);
      
    } catch (err) {
      console.error('Erreur lors du chargement des shortcodes:', err);
      setError('Impossible de charger les shortcodes.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreShortcodes = async () => {
    if (!selectedClient || !selectedDimension || !hasMore || loadingMore || loading) return;
    
    try {
      setLoadingMore(true);
      setError(null);
      
      const response = await getClientDimensionShortcodesPaginated(
        selectedDimension,
        selectedClient.clientId,
        pageSize,
        lastDocument
      );
      
      // Ajouter les nouveaux shortcodes à la liste existante
      setShortcodes(prev => [...prev, ...response.shortcodes]);
      setLastDocument(response.lastDoc);
      setHasMore(response.hasMore);
      
    } catch (err) {
      console.error('Erreur lors du chargement de plus de shortcodes:', err);
      setError('Impossible de charger plus de shortcodes.');
    } finally {
      setLoadingMore(false);
    }
  };

  const refreshShortcodes = useCallback(async () => {
    if (selectedClient && selectedDimension) {
      await loadClientDimensionShortcodes(true);
    }
  }, [selectedClient, selectedDimension]);

  const refreshAllShortcodes = useCallback(async () => {
    try {
      const fetchedAllShortcodes = await getAllShortcodes();
      setAllShortcodes(fetchedAllShortcodes);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des shortcodes:', err);
      setError('Impossible de rafraîchir les shortcodes.');
    }
  }, []);

  const handleCreateCustomList = async () => {
    if (!selectedClient || !selectedDimension) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await createCustomListFromPlusCo(selectedDimension, selectedClient.clientId);
      
      setSuccess('Liste personnalisée créée avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      // Recharger les shortcodes
      await loadClientDimensionShortcodes(true);
      
    } catch (err) {
      console.error('Erreur lors de la création de la liste personnalisée:', err);
      setError('Impossible de créer la liste personnalisée.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomList = async () => {
    if (!selectedClient || !selectedDimension || !isCustomList) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await deleteCustomList(selectedDimension, selectedClient.clientId);
      
      setSuccess('Liste personnalisée supprimée avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      // Recharger les shortcodes (maintenant ce sera la liste PlusCo)
      await loadClientDimensionShortcodes(true);
      
    } catch (err) {
      console.error('Erreur lors de la suppression de la liste personnalisée:', err);
      setError('Impossible de supprimer la liste personnalisée.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddShortcode = async (shortcodeId: string) => {
    if (!selectedClient || !selectedDimension) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Déterminer si on travaille sur une liste PlusCo ou personnalisée
      const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';
      
      // Ajouter le shortcode à la liste appropriée
      await addShortcodeToDimension(
        selectedDimension,
        targetClientId,
        shortcodeId
      );
      
      setSuccess('Shortcode ajouté avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      // Recharger les shortcodes
      await loadClientDimensionShortcodes(true);
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout du shortcode:', err);
      setError('Impossible d\'ajouter le shortcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShortcode = async (shortcodeId: string) => {
    if (!selectedClient || !selectedDimension) return;
    
    try {
      setError(null);
      
      // Déterminer si on travaille sur une liste PlusCo ou personnalisée
      const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';
      
      await removeShortcodeFromDimension(
        selectedDimension,
        targetClientId,
        shortcodeId
      );
      
      // Retirer le shortcode de la liste locale pour un feedback immédiat
      setShortcodes(prev => prev.filter(s => s.id !== shortcodeId));
      setTotalCount(prev => prev - 1);
      
      setSuccess('Shortcode retiré avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Erreur lors du retrait du shortcode:', err);
      setError('Impossible de retirer le shortcode.');
      // Recharger en cas d'erreur pour rétablir l'état correct
      await loadClientDimensionShortcodes(true);
    }
  };

  const handleCreateShortcode = async (shortcodeData: {
    SH_Code: string;
    SH_Default_UTM: string;
    SH_Display_Name_FR: string;
    SH_Display_Name_EN: string;
  }): Promise<void> => {
    if (!shortcodeData.SH_Code || !shortcodeData.SH_Display_Name_FR) {
      setError('Le code et le nom d\'affichage FR sont obligatoires.');
      throw new Error('Champs obligatoires manquants');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const shortcodeId = await createShortcode(shortcodeData);
      
      setSuccess('Shortcode créé avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      // Recharger tous les shortcodes
      await refreshAllShortcodes();
      
      // Si le client a une liste personnalisée, ajouter directement le shortcode
      if (selectedClient && selectedDimension && isCustomList) {
        await addShortcodeToDimension(
          selectedDimension,
          selectedClient.clientId,
          shortcodeId
        );
        
        // Recharger les shortcodes
        await loadClientDimensionShortcodes(true);
      }
      
    } catch (err) {
      console.error('Erreur lors de la création du shortcode:', err);
      setError('Impossible de créer le shortcode.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    // Données
    dimensions,
    selectedDimension,
    shortcodes,
    allShortcodes,
    isCustomList,
    
    // Pagination
    hasMore,
    totalCount,
    
    // États
    loading,
    loadingMore,
    error,
    success,
    
    // Actions
    setSelectedDimension,
    loadMoreShortcodes,
    refreshShortcodes,
    refreshAllShortcodes,
    handleCreateCustomList,
    handleDeleteCustomList,
    handleAddShortcode,
    handleRemoveShortcode,
    handleCreateShortcode,
    clearMessages
  };
}