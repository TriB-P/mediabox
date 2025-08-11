// app/hooks/documents/useCampaignDataDoc.ts
/**
 * Ce hook gère l'extraction et la transformation des données d'une campagne
 * en un tableau 2D simple. Il récupère toutes les informations d'une campagne
 * spécifique depuis Firebase et les formate en un tableau avec une ligne d'en-têtes
 * et une ligne de données correspondantes.
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCampaigns } from '../../lib/campaignService';
import type { Campaign } from '../../types/campaign';

interface UseCampaignDataDocReturn {
  extractCampaignData: (clientId: string, campaignId: string) => Promise<string[][] | null>; // Modifié ici
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
   * Transforme les données de campagne en tableau 2D avec en-têtes et valeurs.
   * @param {Campaign} campaign Les données de la campagne.
   * @returns {string[][]} Un tableau 2D avec en-têtes et données.
   */
  const transformCampaignToTable = useCallback((campaign: Campaign): string[][] => {
    const table: string[][] = [];
    
    // Définir l'ordre des colonnes et les en-têtes lisibles
    const fieldMapping: Array<{key: keyof Campaign, header: string}> = [
      { key: 'id', header: 'ID' },
      { key: 'CA_Name', header: 'Nom' },
      { key: 'CA_Campaign_Identifier', header: 'Identifiant' },
      { key: 'CA_Division', header: 'Division' },
      { key: 'CA_Status', header: 'Statut' },
      { key: 'CA_Quarter', header: 'Trimestre' },
      { key: 'CA_Year', header: 'Année' },
      { key: 'CA_Creative_Folder', header: 'Dossier Créatif' },
      { key: 'CA_Custom_Dim_1', header: 'Dimension 1' },
      { key: 'CA_Custom_Dim_2', header: 'Dimension 2' },
      { key: 'CA_Custom_Dim_3', header: 'Dimension 3' },
      { key: 'CA_Start_Date', header: 'Date Début' },
      { key: 'CA_End_Date', header: 'Date Fin' },
      { key: 'CA_Sprint_Dates', header: 'Dates Sprint' },
      { key: 'CA_Budget', header: 'Budget' },
      { key: 'CA_Currency', header: 'Devise' },
      { key: 'CA_Custom_Fee_1', header: 'Frais 1' },
      { key: 'CA_Custom_Fee_2', header: 'Frais 2' },
      { key: 'CA_Custom_Fee_3', header: 'Frais 3' },
      { key: 'CA_Client_Ext_Id', header: 'ID Client Externe' },
      { key: 'CA_PO', header: 'PO' },
      { key: 'CA_Billing_ID', header: 'ID Facturation' },
      { key: 'CA_Last_Edit', header: 'Dernière Modification' },
      { key: 'createdAt', header: 'Créé le' },
      { key: 'updatedAt', header: 'Mis à jour le' },
      { key: 'officialVersionId', header: 'Version Officielle ID' }
    ];

    // 1. Créer la ligne d'en-têtes
    const headers = fieldMapping.map(field => field.header);
    table.push(headers);

    // 2. Créer la ligne de données
    const values = fieldMapping.map(field => {
      const value = campaign[field.key];
      
      // Gérer les différents types de données
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'boolean') {
        return value;
      } else if (typeof value === 'number') {
        return value.toString();
      } else if (typeof value === 'string') {
        return value;
      } else {
        // Pour les objets complexes, les convertir en JSON
        return JSON.stringify(value);
      }
    });
    
    table.push(values);

    return table;
  }, []);

  /**
   * Fonction principale pour extraire et formater les données de campagne.
   * Elle orchestre la récupération de la campagne et sa transformation en tableau 2D.
   * @param {string} clientId L'ID du client.
   * @param {string} campaignId L'ID de la campagne.
   * @returns {Promise<string[][] | null>} Une promesse qui se résout avec le tableau de données, ou null en cas d'erreur. // Modifié ici
   * @throws {Error} Si l'utilisateur n'est pas authentifié ou si une erreur survient.
   */
  const extractCampaignData = useCallback(async (
    clientId: string, 
    campaignId: string
  ): Promise<string[][] | null> => { // Modifié ici
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
        setError('Campagne non trouvée'); // Ajouté pour gérer l'erreur interne
        return null; // Retourne null si la campagne n'est pas trouvée
      }

      // 2. Transformer en tableau 2D
      const table = transformCampaignToTable(campaign);

      // 3. Sauvegarder le résultat (pour le hook local)
      setData(table);
      return table; // Retourne les données extraites
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'extraction de la campagne';
      console.error('❌ Erreur:', errorMessage);
      setError(errorMessage);
      return null; // Retourne null en cas d'erreur
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