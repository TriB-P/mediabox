/**
 * Ce fichier contient des hooks React pour gérer le rafraîchissement manuel des données
 * et la gestion des modales dans l'application Tactiques.
 *
 * Le hook `useTactiquesRefresh` permet de déclencher un rafraîchissement des données,
 * d'afficher des notifications et de charger les frais associés à un client sélectionné.
 *
 * Le hook `useTactiquesModals` fournit des fonctionnalités pour contrôler l'état
 * d'ouverture/fermeture des modales de section et la gestion de l'expansion
 * des sections.
 */
import { useState, useCallback, useEffect } from 'react';
import { getClientFees } from '../lib/feeService';
import { ClientFee } from '../lib/budgetService';
interface UseTactiquesRefreshProps {
  selectedClientId?: string;
  loading: boolean;
  onRefresh: (() => Promise<void>) | (() => void);
}
interface UseTactiquesRefreshReturn {
  isRefreshing: boolean;
  clientFees: ClientFee[];
  clientFeesLoading: boolean;
  handleManualRefresh: () => Promise<void>;
}
/**
 * Hook pour gérer le rafraîchissement manuel des données et le chargement des frais client.
 *
 * @param {UseTactiquesRefreshProps} props - Les propriétés du hook.
 * @param {string} props.selectedClientId - L'ID du client sélectionné, si applicable.
 * @param {boolean} props.loading - Indique si un chargement général est en cours.
 * @param {(() => Promise<void>) | (() => void)} props.onRefresh - La fonction à appeler pour rafraîchir les données.
 * @returns {UseTactiquesRefreshReturn} Un objet contenant l'état de rafraîchissement, les frais client, l'état de chargement des frais client et la fonction de rafraîchissement manuel.
 */
export function useTactiquesRefresh({
  selectedClientId,
  loading,
  onRefresh
}: UseTactiquesRefreshProps): UseTactiquesRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clientFees, setClientFees] = useState<ClientFee[]>([]);
  const [clientFeesLoading, setClientFeesLoading] = useState(false);
  /**
   * Affiche une notification temporaire à l'écran.
   *
   * @param {string} message - Le message à afficher dans la notification.
   * @param {'success' | 'error'} type - Le type de notification (succès ou erreur), par défaut 'success'.
   * @returns {void}
   */
  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white px-4 py-2 rounded shadow-lg z-50 text-sm`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, type === 'success' ? 2000 : 3000);
  }, []);
  /**
   * Gère le déclenchement d'un rafraîchissement manuel des données.
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois le rafraîchissement terminé.
   */
  const handleManualRefresh = useCallback(async () => {
    if (isRefreshing || loading) {
      return;
    }
    setIsRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
    } catch (error) {
      console.error('❌ Erreur refresh manuel:', error);
      showNotification('❌ Erreur lors de l\'actualisation', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, loading, onRefresh, showNotification]);
  /**
   * Effet de chargement des frais client lorsque `selectedClientId` change.
   *
   * @returns {void}
   */
  useEffect(() => {
    const loadClientFees = async () => {
      if (!selectedClientId) {
        setClientFees([]);
        return;
      }
      try {
        setClientFeesLoading(true);
        console.log("FIREBASE: LECTURE - Fichier: useTactiquesRefresh.ts - Fonction: loadClientFees - Path: N/A");
        const fees = await getClientFees(selectedClientId);
        const adaptedFees: ClientFee[] = fees.map(fee => ({
          ...fee,
          options: []
        }));
        setClientFees(adaptedFees);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des frais du client:', error);
        setClientFees([]);
      } finally {
        setClientFeesLoading(false);
      }
    };
    loadClientFees();
  }, [selectedClientId]);
  return {
    isRefreshing,
    clientFees,
    clientFeesLoading,
    handleManualRefresh
  };
}
/**
 * Hook utilitaire pour gérer l'état des modales de section et leur expansion.
 *
 * @returns {object} Un objet contenant l'état de la modale de section, l'état d'expansion des sections,
 * et les fonctions pour ouvrir/fermer la modale et gérer l'expansion.
 */
export function useTactiquesModals() {
  const [sectionModal, setSectionModal] = useState({
    isOpen: false,
    section: null as any,
    mode: 'create' as 'create' | 'edit'
  });
  const [sectionExpansions, setSectionExpansions] = useState<{[key: string]: boolean}>({});
  /**
   * Ouvre la modale de section avec la section et le mode spécifiés.
   *
   * @param {any} section - La section à éditer ou null pour la création.
   * @param {'create' | 'edit'} mode - Le mode de la modale ('create' ou 'edit').
   * @returns {void}
   */
  const openSectionModal = useCallback((section = null, mode: 'create' | 'edit' = 'create') => {
    setSectionModal({ isOpen: true, section, mode });
  }, []);
  /**
   * Ferme la modale de section.
   *
   * @returns {void}
   */
  const closeSectionModal = useCallback(() => {
    setSectionModal({ isOpen: false, section: null, mode: 'create' });
  }, []);
  /**
   * Gère l'expansion ou la réduction d'une section spécifique.
   *
   * @param {string} sectionId - L'ID de la section à basculer.
   * @returns {void}
   */
  const handleSectionExpand = useCallback((sectionId: string) => {
    setSectionExpansions(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);
  return {
    sectionModal,
    sectionExpansions,
    openSectionModal,
    closeSectionModal,
    handleSectionExpand
  };
}