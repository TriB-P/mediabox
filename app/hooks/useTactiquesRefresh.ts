// app/hooks/useTactiquesRefresh.ts - Hook pour la gestion du refresh manuel

import { useState, useCallback, useEffect } from 'react';
import { getClientFees } from '../lib/feeService';
import { ClientFee } from '../lib/budgetService';

// ==================== TYPES ====================

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

// ==================== HOOK PRINCIPAL ====================

export function useTactiquesRefresh({
  selectedClientId,
  loading,
  onRefresh
}: UseTactiquesRefreshProps): UseTactiquesRefreshReturn {

  // ==================== ÉTATS ====================
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clientFees, setClientFees] = useState<ClientFee[]>([]);
  const [clientFeesLoading, setClientFeesLoading] = useState(false);

  // ==================== FONCTION DE NOTIFICATION ====================

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

  // ==================== REFRESH MANUEL ====================

  const handleManualRefresh = useCallback(async () => {
    if (isRefreshing || loading) {
      console.log('⚠️ Refresh déjà en cours, skip');
      return;
    }

    console.log('🔄 Refresh manuel déclenché');
    setIsRefreshing(true);

    try {
      await Promise.resolve(onRefresh());
      showNotification('✅ Données actualisées');
      
    } catch (error) {
      console.error('❌ Erreur refresh manuel:', error);
      showNotification('❌ Erreur lors de l\'actualisation', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, loading, onRefresh, showNotification]);

  // ==================== CHARGEMENT DES FRAIS CLIENT ====================

  useEffect(() => {
    const loadClientFees = async () => {
      if (!selectedClientId) {
        setClientFees([]);
        return;
      }

      try {
        setClientFeesLoading(true);
        console.log('🔄 Chargement des frais pour le client:', selectedClientId);
        
        const fees = await getClientFees(selectedClientId);
        
        const adaptedFees: ClientFee[] = fees.map(fee => ({
          ...fee,
          options: []
        }));
        
        setClientFees(adaptedFees);
        
        console.log('✅ Frais du client chargés:', fees.length, 'frais');
      } catch (error) {
        console.error('❌ Erreur lors du chargement des frais du client:', error);
        setClientFees([]);
      } finally {
        setClientFeesLoading(false);
      }
    };

    loadClientFees();
  }, [selectedClientId]);

  // ==================== RETURN ====================

  return {
    isRefreshing,
    clientFees,
    clientFeesLoading,
    handleManualRefresh
  };
}

// ==================== HOOK UTILITAIRE POUR LES MODALS ====================

export function useTactiquesModals() {
  const [sectionModal, setSectionModal] = useState({
    isOpen: false,
    section: null as any,
    mode: 'create' as 'create' | 'edit'
  });
  
  const [sectionExpansions, setSectionExpansions] = useState<{[key: string]: boolean}>({});

  const openSectionModal = useCallback((section = null, mode: 'create' | 'edit' = 'create') => {
    setSectionModal({ isOpen: true, section, mode });
  }, []);

  const closeSectionModal = useCallback(() => {
    setSectionModal({ isOpen: false, section: null, mode: 'create' });
  }, []);

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