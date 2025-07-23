/**
 * Ce hook gère le chargement et la gestion des données de l'application (campagnes, versions, onglets, tactiques, placements, créatifs)
 * en interagissant avec Firebase. Il utilise les contextes ClientContext et SelectionContext
 * pour maintenir l'état des sélections utilisateur (client, campagne, version, onglet) et persiste ces sélections.
 * L'objectif est de charger les données de manière séquentielle et optimisée pour éviter les rechargements inutiles.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { getCampaigns } from '../lib/campaignService';
import { getVersions } from '../lib/versionService';
import { getOnglets, getSections, getTactiques } from '../lib/tactiqueService';
import { getPlacementsForTactique } from '../lib/placementService';
import { getCreatifsForPlacement } from '../lib/creatifService';

interface AppData {
  campaigns: any[];
  versions: any[];
  selectedCampaign: any | null;
  selectedVersion: any | null;
  onglets: any[];
  selectedOnglet: any | null;
  sections: any[];
  tactiques: { [sectionId: string]: any[] };
  placements: { [tactiqueId: string]: any[] };
  creatifs: { [placementId: string]: any[] };
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  stage: string | null;
}

/**
 * Hook principal pour gérer les données de l'application.
 *
 * @returns {object} Un objet contenant les données chargées, l'état de chargement, les fonctions de gestion des changements et une fonction de rafraîchissement.
 * - campaigns: Liste des campagnes disponibles.
 * - versions: Liste des versions pour la campagne sélectionnée.
 * - selectedCampaign: La campagne actuellement sélectionnée.
 * - selectedVersion: La version actuellement sélectionnée.
 * - onglets: Liste des onglets pour la version sélectionnée.
 * - selectedOnglet: L'onglet actuellement sélectionné.
 * - sections: Liste des sections pour l'onglet sélectionné.
 * - tactiques: Objet mapant les ID de section à des listes de tactiques.
 * - placements: Objet mapant les ID de tactique à des listes de placements.
 * - creatifs: Objet mapant les ID de placement à des listes de créatifs.
 * - loading: Indique si des données sont en cours de chargement.
 * - error: Message d'erreur si un problème survient pendant le chargement.
 * - stage: Indique l'étape actuelle du chargement.
 * - handleCampaignChange: Fonction pour changer la campagne sélectionnée.
 * - handleVersionChange: Fonction pour changer la version sélectionnée.
 * - handleOngletChange: Fonction pour changer l'onglet sélectionné.
 * - refresh: Fonction pour forcer un rechargement complet des données.
 */
export function useAppData() {
  const { selectedClient } = useClient();
  const { 
    selectedCampaignId, 
    selectedVersionId, 
    selectedOngletId,
    setSelectedCampaignId,
    setSelectedVersionId,
    setSelectedOngletId 
  } = useSelection();

  const [data, setData] = useState<AppData>({
    campaigns: [],
    versions: [],
    selectedCampaign: null,
    selectedVersion: null,
    onglets: [],
    selectedOnglet: null,
    sections: [],
    tactiques: {},
    placements: {},
    creatifs: {}
  });
  
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    error: null,
    stage: null
  });
  
  const loadedContextRef = useRef<string>('');
  const isLoadingRef = useRef(false);
  
  /**
   * Charge toutes les données de manière séquentielle depuis Firebase en fonction des sélections actuelles.
   * Cette fonction est optimisée pour éviter les chargements redondants.
   * @returns {Promise<void>}
   */
  const loadAllData = useCallback(async () => {
    if (!selectedClient?.clientId) {
      setData({
        campaigns: [],
        versions: [],
        selectedCampaign: null,
        selectedVersion: null,
        onglets: [],
        selectedOnglet: null,
        sections: [],
        tactiques: {},
        placements: {},
        creatifs: {}
      });
      return;
    }

    const contextKey = `${selectedClient.clientId}-${selectedCampaignId || ''}-${selectedVersionId || ''}-${selectedOngletId || ''}`;
    
    if (isLoadingRef.current || loadedContextRef.current === contextKey) {
      return;
    }
    
    isLoadingRef.current = true;
    setLoading({ isLoading: true, error: null, stage: 'Démarrage...' });
    
    try {
      setLoading(prev => ({ ...prev, stage: 'Chargement des campagnes...' }));
      
      console.log("FIREBASE: LECTURE - Fichier: useAppData.ts - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/campaigns");
      const campaigns = await getCampaigns(selectedClient.clientId);
      
      const selectedCampaign = selectedCampaignId 
        ? campaigns.find(c => c.id === selectedCampaignId) || null
        : null;
      
      setData(prev => ({ ...prev, campaigns, selectedCampaign }));
      
      if (selectedCampaignId) {
        setLoading(prev => ({ ...prev, stage: 'Chargement des versions...' }));
        
        console.log("FIREBASE: LECTURE - Fichier: useAppData.ts - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions");
        const versions = await getVersions(selectedClient.clientId, selectedCampaignId);
        
        const selectedVersion = selectedVersionId 
          ? versions.find(v => v.id === selectedVersionId) || null
          : null;
        
        setData(prev => ({ ...prev, versions, selectedVersion }));
        
        if (selectedVersionId) {
          setLoading(prev => ({ ...prev, stage: 'Chargement des onglets...' }));
          
          console.log("FIREBASE: LECTURE - Fichier: useAppData.ts - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets");
          const onglets = await getOnglets(selectedClient.clientId, selectedCampaignId, selectedVersionId);
          
          let currentOngletId = selectedOngletId;
          if (!currentOngletId && onglets.length > 0) {
            currentOngletId = onglets[0].id;
            setSelectedOngletId(currentOngletId);
          }
          
          const selectedOnglet = currentOngletId 
            ? onglets.find(o => o.id === currentOngletId) || null
            : null;
            
          setData(prev => ({ ...prev, onglets, selectedOnglet }));
          
          if (currentOngletId) {
            setLoading(prev => ({ ...prev, stage: 'Chargement des sections...' }));
            
            console.log("FIREBASE: LECTURE - Fichier: useAppData.ts - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${currentOngletId}/sections");
            const sections = await getSections(
              selectedClient.clientId, 
              selectedCampaignId, 
              selectedVersionId, 
              currentOngletId
            );
            
            setData(prev => ({ ...prev, sections }));
            
            setLoading(prev => ({ ...prev, stage: 'Chargement des tactiques...' }));
            
            const tactiques: { [sectionId: string]: any[] } = {};
            for (const section of sections) {
              console.log("FIREBASE: LECTURE - Fichier: useAppData.ts - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${currentOngletId}/sections/${section.id}/tactiques");
              const sectionTactiques = await getTactiques(
                selectedClient.clientId,
                selectedCampaignId,
                selectedVersionId,
                currentOngletId,
                section.id
              );
              tactiques[section.id] = sectionTactiques;
            }
            
            setData(prev => ({ ...prev, tactiques }));
            
            setLoading(prev => ({ ...prev, stage: 'Chargement des placements...' }));
            
            const placements: { [tactiqueId: string]: any[] } = {};
            for (const [sectionId, sectionTactiques] of Object.entries(tactiques)) {
              for (const tactique of sectionTactiques) {
                console.log("FIREBASE: LECTURE - Fichier: useAppData.ts - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${currentOngletId}/sections/${sectionId}/tactiques/${tactique.id}/placements");
                const tactiquePlacements = await getPlacementsForTactique(
                  selectedClient.clientId,
                  selectedCampaignId,
                  selectedVersionId,
                  currentOngletId,
                  sectionId,
                  tactique.id
                );
                placements[tactique.id] = tactiquePlacements;
              }
            }
            
            setData(prev => ({ ...prev, placements }));
            
            setLoading(prev => ({ ...prev, stage: 'Chargement des créatifs...' }));
            
            const creatifs: { [placementId: string]: any[] } = {};
            for (const [tactiqueId, tactiquePlacements] of Object.entries(placements)) {
              for (const placement of tactiquePlacements) {
                const sectionId = Object.keys(tactiques).find(sId => 
                  tactiques[sId].some((t: any) => t.id === tactiqueId)
                );
                
                if (sectionId) {
                  console.log("FIREBASE: LECTURE - Fichier: useAppData.ts - Fonction: loadAllData - Path: clients/${selectedClient.clientId}/campaigns/${selectedCampaignId}/versions/${selectedVersionId}/onglets/${currentOngletId}/sections/${sectionId}/tactiques/${tactiqueId}/placements/${placement.id}/creatifs");
                  const placementCreatifs = await getCreatifsForPlacement(
                    selectedClient.clientId,
                    selectedCampaignId,
                    selectedVersionId,
                    currentOngletId,
                    sectionId,
                    tactiqueId,
                    placement.id
                  );
                  creatifs[placement.id] = placementCreatifs;
                }
              }
            }
            
            setData(prev => ({ ...prev, creatifs }));
          }
        }
      }
      
      loadedContextRef.current = contextKey;
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement:', err);
      setLoading(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Erreur de chargement' 
      }));
    } finally {
      isLoadingRef.current = false;
      setLoading(prev => ({ ...prev, isLoading: false, stage: null }));
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, setSelectedOngletId]);
  
  /**
   * Effet de hook qui déclenche le chargement initial des données lorsque le composant est monté
   * ou lorsque les dépendances de `loadAllData` changent.
   * @returns {void}
   */
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);
  
  /**
   * Gère le changement de la campagne sélectionnée.
   * Met à jour la campagne sélectionnée dans le contexte et réinitialise la version.
   * @param {any} campaign - La campagne nouvellement sélectionnée.
   * @returns {void}
   */
  const handleCampaignChange = useCallback((campaign: any) => {
    setSelectedVersionId(null);
    setSelectedCampaignId(campaign.id);
  }, [setSelectedCampaignId, setSelectedVersionId]);
  
  /**
   * Gère le changement de la version sélectionnée.
   * Met à jour la version sélectionnée dans le contexte.
   * @param {any} version - La version nouvellement sélectionnée.
   * @returns {void}
   */
  const handleVersionChange = useCallback((version: any) => {
    setSelectedVersionId(version.id);
  }, [setSelectedVersionId]);
  
  /**
   * Gère le changement de l'onglet sélectionné.
   * Met à jour l'onglet sélectionné dans le contexte.
   * @param {any} onglet - L'onglet nouvellement sélectionné.
   * @returns {void}
   */
  const handleOngletChange = useCallback((onglet: any) => {
    setSelectedOngletId(onglet.id);
  }, [setSelectedOngletId]);
  
  /**
   * Force un rechargement complet de toutes les données.
   * Réinitialise le référant de contexte pour assurer un nouveau chargement.
   * @returns {void}
   */
  const refresh = useCallback(() => {
    loadedContextRef.current = '';
    loadAllData();
  }, [loadAllData]);
  
  return {
    ...data,
    loading: loading.isLoading,
    error: loading.error,
    stage: loading.stage,
    handleCampaignChange,
    handleVersionChange,
    handleOngletChange,
    refresh
  };
}