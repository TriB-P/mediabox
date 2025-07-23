/**
 * Ce hook gère la logique de récupération, de création et de modification des shortcodes.
 * Il interagit avec les services Firebase pour gérer les dimensions, les shortcodes
 * spécifiques aux clients et les listes personnalisées de shortcodes, incluant la pagination.
 * Il fournit également des états de chargement, d'erreur et de succès.
 */
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

/**
 * Hook personnalisé pour gérer les shortcodes, les dimensions et les interactions Firebase.
 *
 * @returns {UseShortcodesReturn} Un objet contenant les données, les états et les fonctions de manipulation des shortcodes.
 */
export function useShortcodes(): UseShortcodesReturn {
  const { selectedClient } = useClient();
  
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [shortcodes, setShortcodes] = useState<Shortcode[]>([]);
  const [allShortcodes, setAllShortcodes] = useState<Shortcode[]>([]);
  const [isCustomList, setIsCustomList] = useState(false);
  
  const [lastDocument, setLastDocument] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(50);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Effet de bord pour charger les dimensions au montage initial du composant.
   */
  useEffect(() => {
    loadDimensions();
  }, []);

  /**
   * Effet de bord pour charger les shortcodes clients lorsque le client ou la dimension sélectionnée change.
   */
  useEffect(() => {
    if (selectedClient && selectedDimension) {
      loadClientDimensionShortcodes();
    }
  }, [selectedClient, selectedDimension]);

  /**
   * Charge toutes les dimensions disponibles et initialise la dimension sélectionnée.
   * Récupère également tous les shortcodes pour les modals d'ajout.
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois les dimensions et tous les shortcodes chargés.
   */
  const loadDimensions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("FIREBASE: LECTURE - Fichier: useShortcodes.ts - Fonction: loadDimensions - Path: dimensions");
      const fetchedDimensions = await getAllDimensions();
      setDimensions(fetchedDimensions);
      
      if (fetchedDimensions.length > 0 && !selectedDimension) {
        setSelectedDimension(fetchedDimensions[0]);
      }
      
      console.log("FIREBASE: LECTURE - Fichier: useShortcodes.ts - Fonction: loadDimensions - Path: shortcodes");
      const fetchedAllShortcodes = await getAllShortcodes();
      setAllShortcodes(fetchedAllShortcodes);
      
    } catch (err) {
      console.error('Erreur lors du chargement des dimensions:', err);
      setError('Impossible de charger les dimensions.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charge les shortcodes pour la dimension et le client sélectionnés, avec gestion de la pagination.
   * Vérifie également si le client a une liste personnalisée.
   *
   * @param {boolean} [resetPagination=true] Indique si la pagination doit être réinitialisée.
   * @returns {Promise<void>} Une promesse qui se résout une fois les shortcodes chargés.
   */
  const loadClientDimensionShortcodes = async (resetPagination = true) => {
    if (!selectedClient || !selectedDimension) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (resetPagination) {
        setShortcodes([]);
        setLastDocument(null);
        setHasMore(true);
      }
      
      console.log(`FIREBASE: LECTURE - Fichier: useShortcodes.ts - Fonction: loadClientDimensionShortcodes - Path: dimensions/${selectedDimension}/clients/${selectedClient.clientId}`);
      const hasCustom = await hasCustomList(selectedDimension, selectedClient.clientId);
      setIsCustomList(hasCustom);
      
      console.log(`FIREBASE: LECTURE - Fichier: useShortcodes.ts - Fonction: loadClientDimensionShortcodes - Path: dimensions/${selectedDimension}/clients/${selectedClient.clientId}`);
      const count = await getClientDimensionShortcodesCount(selectedDimension, selectedClient.clientId);
      setTotalCount(count);
      
      console.log(`FIREBASE: LECTURE - Fichier: useShortcodes.ts - Fonction: loadClientDimensionShortcodes - Path: dimensions/${selectedDimension}/clients/${selectedClient.clientId}/shortcodes`);
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

  /**
   * Charge la page suivante de shortcodes en utilisant la pagination.
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois les shortcodes supplémentaires chargés.
   */
  const loadMoreShortcodes = async () => {
    if (!selectedClient || !selectedDimension || !hasMore || loadingMore || loading) return;
    
    try {
      setLoadingMore(true);
      setError(null);
      
      console.log(`FIREBASE: LECTURE - Fichier: useShortcodes.ts - Fonction: loadMoreShortcodes - Path: dimensions/${selectedDimension}/clients/${selectedClient.clientId}/shortcodes`);
      const response = await getClientDimensionShortcodesPaginated(
        selectedDimension,
        selectedClient.clientId,
        pageSize,
        lastDocument
      );
      
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

  /**
   * Rafraîchit la liste des shortcodes du client et de la dimension sélectionnée.
   * Utilise useCallback pour mémoriser la fonction.
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois les shortcodes rafraîchis.
   */
  const refreshShortcodes = useCallback(async () => {
    if (selectedClient && selectedDimension) {
      await loadClientDimensionShortcodes(true);
    }
  }, [selectedClient, selectedDimension]);

  /**
   * Rafraîchit tous les shortcodes disponibles.
   * Utilise useCallback pour mémoriser la fonction.
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois tous les shortcodes rafraîchis.
   */
  const refreshAllShortcodes = useCallback(async () => {
    try {
      console.log("FIREBASE: LECTURE - Fichier: useShortcodes.ts - Fonction: refreshAllShortcodes - Path: shortcodes");
      const fetchedAllShortcodes = await getAllShortcodes();
      setAllShortcodes(fetchedAllShortcodes);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des shortcodes:', err);
      setError('Impossible de rafraîchir les shortcodes.');
    }
  }, []);

  /**
   * Crée une liste personnalisée de shortcodes pour le client et la dimension sélectionnés.
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois la liste créée.
   */
  const handleCreateCustomList = async () => {
    if (!selectedClient || !selectedDimension) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`FIREBASE: ÉCRITURE - Fichier: useShortcodes.ts - Fonction: handleCreateCustomList - Path: dimensions/${selectedDimension}/clients/${selectedClient.clientId}`);
      await createCustomListFromPlusCo(selectedDimension, selectedClient.clientId);
      
      setSuccess('Liste personnalisée créée avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      await loadClientDimensionShortcodes(true);
      
    } catch (err) {
      console.error('Erreur lors de la création de la liste personnalisée:', err);
      setError('Impossible de créer la liste personnalisée.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprime la liste personnalisée de shortcodes pour le client et la dimension sélectionnés.
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois la liste supprimée.
   */
  const handleDeleteCustomList = async () => {
    if (!selectedClient || !selectedDimension || !isCustomList) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`FIREBASE: ÉCRITURE - Fichier: useShortcodes.ts - Fonction: handleDeleteCustomList - Path: dimensions/${selectedDimension}/clients/${selectedClient.clientId}`);
      await deleteCustomList(selectedDimension, selectedClient.clientId);
      
      setSuccess('Liste personnalisée supprimée avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      await loadClientDimensionShortcodes(true);
      
    } catch (err) {
      console.error('Erreur lors de la suppression de la liste personnalisée:', err);
      setError('Impossible de supprimer la liste personnalisée.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ajoute un shortcode à la dimension pour le client spécifié (liste personnalisée ou PlusCo).
   *
   * @param {string} shortcodeId L'ID du shortcode à ajouter.
   * @returns {Promise<void>} Une promesse qui se résout une fois le shortcode ajouté.
   */
  const handleAddShortcode = async (shortcodeId: string) => {
    if (!selectedClient || !selectedDimension) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';
      
      console.log(`FIREBASE: ÉCRITURE - Fichier: useShortcodes.ts - Fonction: handleAddShortcode - Path: dimensions/${selectedDimension}/clients/${targetClientId}/shortcodes/${shortcodeId}`);
      await addShortcodeToDimension(
        selectedDimension,
        targetClientId,
        shortcodeId
      );
      
      setSuccess('Shortcode ajouté avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      await loadClientDimensionShortcodes(true);
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout du shortcode:', err);
      setError('Impossible d\'ajouter le shortcode.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprime un shortcode de la dimension pour le client spécifié (liste personnalisée ou PlusCo).
   *
   * @param {string} shortcodeId L'ID du shortcode à supprimer.
   * @returns {Promise<void>} Une promesse qui se résout une fois le shortcode supprimé.
   */
  const handleRemoveShortcode = async (shortcodeId: string) => {
    if (!selectedClient || !selectedDimension) return;
    
    try {
      setError(null);
      
      const targetClientId = isCustomList ? selectedClient.clientId : 'PlusCo';
      
      console.log(`FIREBASE: ÉCRITURE - Fichier: useShortcodes.ts - Fonction: handleRemoveShortcode - Path: dimensions/${selectedDimension}/clients/${targetClientId}/shortcodes/${shortcodeId}`);
      await removeShortcodeFromDimension(
        selectedDimension,
        targetClientId,
        shortcodeId
      );
      
      setShortcodes(prev => prev.filter(s => s.id !== shortcodeId));
      setTotalCount(prev => prev - 1);
      
      setSuccess('Shortcode retiré avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Erreur lors du retrait du shortcode:', err);
      setError('Impossible de retirer le shortcode.');
      await loadClientDimensionShortcodes(true);
    }
  };

  /**
   * Crée un nouveau shortcode avec les données fournies.
   * Si une liste personnalisée est active pour le client, le shortcode est également ajouté à cette liste.
   *
   * @param {object} shortcodeData Les données du nouveau shortcode (SH_Code, SH_Default_UTM, SH_Display_Name_FR, SH_Display_Name_EN).
   * @returns {Promise<void>} Une promesse qui se résout une fois le shortcode créé.
   * @throws {Error} Si le code ou le nom d'affichage FR sont manquants.
   */
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
      
      console.log("FIREBASE: ÉCRITURE - Fichier: useShortcodes.ts - Fonction: handleCreateShortcode - Path: shortcodes");
      const shortcodeId = await createShortcode(shortcodeData);
      
      setSuccess('Shortcode créé avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      await refreshAllShortcodes();
      
      if (selectedClient && selectedDimension && isCustomList) {
        console.log(`FIREBASE: ÉCRITURE - Fichier: useShortcodes.ts - Fonction: handleCreateShortcode - Path: dimensions/${selectedDimension}/clients/${selectedClient.clientId}/shortcodes/${shortcodeId}`);
        await addShortcodeToDimension(
          selectedDimension,
          selectedClient.clientId,
          shortcodeId
        );
        
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

  /**
   * Efface les messages d'erreur et de succès.
   */
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    dimensions,
    selectedDimension,
    shortcodes,
    allShortcodes,
    isCustomList,
    
    hasMore,
    totalCount,
    
    loading,
    loadingMore,
    error,
    success,
    
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