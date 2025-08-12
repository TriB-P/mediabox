/**
 * Ce hook gère l'extraction et la transformation des données d'une campagne
 * en un tableau 2D simple. Il récupère toutes les informations d'une campagne
 * spécifique depuis Firebase et les formate en un tableau avec une ligne d'en-têtes
 * (les clés de l'objet) et une ligne de données correspondantes.
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCampaigns } from '../../lib/campaignService';
import type { Campaign } from '../../types/campaign';

interface UseCampaignDataDocReturn {
  extractCampaignData: (clientId: string, campaignId: string) => Promise<string[][] | null>;
  loading: boolean;
  error: string | null;
  data: string[][] | null;
}

/**
 * Hook pour extraire et formater les données d'une campagne en tableau 2D.
 * @returns {UseCampaignDataDocReturn} Un objet contenant la fonction extractCampaignData,
 * les états de chargement et d'erreur, et les données formatées.
 */
export function useCampaignDataDoc(): UseCampaignDataDocReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<string[][] | null>(null);

  /**
   * Récupère les données d'une campagne spécifique.
   * @param {string} clientId L'ID du client.
   * @param {string} campaignId L'ID de la campagne.
   * @returns {Promise<Campaign | null>} La campagne trouvée ou null si non trouvée.
   */
  const fetchCampaignData = useCallback(async (
    clientId: string, 
    campaignId: string
  ): Promise<Campaign | null> => {
    try {
      console.log("FIREBASE: LECTURE - Fichier: useCampaignDataDoc.ts - Fonction: fetchCampaignData - Path: clients/${clientId}/campaigns/${campaignId}");
      const campaigns = await getCampaigns(clientId);
      
      const campaign = campaigns.find(c => c.id === campaignId);
      
      if (!campaign) {
        throw new Error(`Campagne avec l'ID ${campaignId} non trouvée`);
      }

      return campaign;

    } catch (err) {
      console.error('❌ Erreur récupération campagne:', err);
      throw err;
    }
  }, []);

  /**
   * Transforme les données de campagne en tableau 2D avec les clés comme en-têtes.
   * @param {Campaign} campaign Les données de la campagne.
   * @returns {string[][]} Un tableau 2D avec en-têtes et données.
   */
  const transformCampaignToTable = useCallback((campaign: Campaign): string[][] => {
    // 1. Obtenir les clés de l'objet campaign pour les utiliser comme en-têtes.
    const headers = Object.keys(campaign);

    // 2. Créer la ligne de données en mappant sur les clés pour garantir l'ordre.
    const values = headers.map(header => {
      const value = campaign[header as keyof Campaign];
      
      // Gérer les différents types de données pour les convertir en chaîne de caractères.
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'boolean') {
        return value; // Convertit true en "true"
      } else if (typeof value === 'number') {
        return value.toString();
      } else if (typeof value === 'string') {
        return value;
      } else {
        // Pour les objets complexes (comme les dates ou autres), les convertir en JSON.
        return JSON.stringify(value);
      }
    });
    
    // 3. Retourner le tableau contenant la ligne d'en-têtes et la ligne de valeurs.
    return [headers, values];
  }, []);

  /**
   * Fonction principale pour extraire et formater les données de campagne.
   * Elle orchestre la récupération de la campagne et sa transformation en tableau 2D.
   * @param {string} clientId L'ID du client.
   * @param {string} campaignId L'ID de la campagne.
   * @returns {Promise<string[][] | null>} Une promesse qui se résout avec le tableau de données, ou null en cas d'erreur.
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si une erreur survient.
   */
  const extractCampaignData = useCallback(async (
    clientId: string, 
    campaignId: string
  ): Promise<string[][] | null> => {
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    try {
      setLoading(true);
      setError(null);
      setData(null);

      // 1. Récupérer les données de la campagne
      const campaign = await fetchCampaignData(clientId, campaignId);

      if (!campaign) {
        setError('Campagne non trouvée');
        return null;
      }

      // 2. Transformer en tableau 2D
      const table = transformCampaignToTable(campaign);

      // 3. Sauvegarder le résultat
      setData(table);
      return table;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'extraction de la campagne';
      console.error('❌ Erreur:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchCampaignData, transformCampaignToTable]);

  return {
    extractCampaignData,
    loading,
    error,
    data,
  };
}