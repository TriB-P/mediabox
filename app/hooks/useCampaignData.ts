// app/hooks/useCampaignData.ts

/**
 * Hook personnalisé pour récupérer et gérer les données de campagne.
 * Charge les informations de la campagne sélectionnée depuis Firestore,
 * notamment la devise (CA_Currency) pour l'affichage des montants.
 * Utilise un cache en mémoire pour éviter les appels répétés à Firestore.
 */

import { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';

interface CampaignData {
  id: string;
  CA_Name?: string;
  CA_Currency?: string;
  CA_Budget_RefCurrency?: number;
  CA_DateDebut?: string;
  CA_DateFin?: string;
  [key: string]: any;
}

interface UseCampaignDataResult {
  campaignData: CampaignData | null;
  currency: string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Cache en mémoire pour éviter les appels répétés
const campaignCache = new Map<string, CampaignData>();

/**
 * Hook pour récupérer les données de la campagne sélectionnée.
 * @returns {UseCampaignDataResult} Les données de la campagne et l'état de chargement.
 */
export const useCampaignData = (): UseCampaignDataResult => {
  const { selectedClient } = useClient();
  const { selectedCampaignId } = useSelection();
  
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Références pour éviter les re-renders inutiles
  const currentClientId = useRef<string | null>(null);
  const currentCampaignId = useRef<string | null>(null);

  /**
   * Récupère les données de la campagne depuis Firestore ou le cache.
   * @returns {Promise<void>}
   */
  const fetchCampaignData = async (): Promise<void> => {
    if (!selectedClient?.clientId || !selectedCampaignId) {
      setCampaignData(null);
      setError(null);
      return;
    }

    const clientId = selectedClient.clientId;
    const campaignId = selectedCampaignId;
    
    // Vérifier si les IDs ont changé
    const idsChanged = 
      currentClientId.current !== clientId || 
      currentCampaignId.current !== campaignId;

    if (!idsChanged && campaignData) {
      return; // Pas besoin de recharger
    }

    const cacheKey = `${clientId}:${campaignId}`;
    
    // Vérifier le cache
    if (campaignCache.has(cacheKey)) {
      const cachedData = campaignCache.get(cacheKey)!;
      setCampaignData(cachedData);
      setError(null);
      currentClientId.current = clientId;
      currentCampaignId.current = campaignId;
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("FIREBASE: LECTURE - Fichier: useCampaignData.ts - Fonction: fetchCampaignData - Path: clients/" + clientId + "/campaigns/" + campaignId);
      
      const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
      const campaignSnap = await getDoc(campaignRef);

      if (campaignSnap.exists()) {
        const data = {
          id: campaignSnap.id,
          ...campaignSnap.data()
        } as CampaignData;

        // Mettre en cache
        campaignCache.set(cacheKey, data);
        setCampaignData(data);
        
        currentClientId.current = clientId;
        currentCampaignId.current = campaignId;
      } else {
        setError('Campagne non trouvée');
        setCampaignData(null);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la campagne:', err);
      setError('Erreur lors du chargement de la campagne');
      setCampaignData(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Force le rechargement des données depuis Firestore.
   * @returns {Promise<void>}
   */
  const refetch = async (): Promise<void> => {
    if (!selectedClient?.clientId || !selectedCampaignId) return;
    
    const cacheKey = `${selectedClient.clientId}:${selectedCampaignId}`;
    campaignCache.delete(cacheKey); // Supprimer du cache
    await fetchCampaignData();
  };

  // Effet pour charger les données quand les dépendances changent
  useEffect(() => {
    fetchCampaignData();
  }, [selectedClient?.clientId, selectedCampaignId]);

  // Déterminer la devise avec fallback
  const currency = campaignData?.CA_Currency || 'USD';

  return {
    campaignData,
    currency,
    loading,
    error,
    refetch
  };
};

/**
 * Utilitaire pour convertir le code de devise en symbole.
 * @param {string} currencyCode - Le code de devise (USD, EUR, CHF, etc.)
 * @returns {string} Le symbole de devise correspondant.
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  const symbols: { [key: string]: string } = {
    'USD': 'USD',
    'EUR': '€',
    'CHF': 'CHF',
    'CAD': '$',
  };

  return symbols[currencyCode?.toUpperCase()] || '$';
};

/**
 * Utilitaire pour formater un montant avec la devise appropriée.
 * @param {number} amount - Le montant à formater.
 * @param {string} currencyCode - Le code de devise.
 * @returns {string} Le montant formaté avec le symbole de devise.
 */
export const formatCurrencyAmount = (amount: number, currencyCode: string): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${getCurrencySymbol(currencyCode)}0`;
  }

  const symbol = getCurrencySymbol(currencyCode);
  
  // Formatage simple avec séparateurs de milliers
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  // Pour CHF, mettre le symbole après le montant
  if (currencyCode?.toUpperCase() === 'CHF') {
    return `${formatted} ${symbol}`;
  }

  // Pour les autres devises, symbole avant le montant
  return `${symbol}${formatted}`;
};