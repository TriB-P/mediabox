// app/adops/page.tsx
/**
 * Ce fichier définit la page "AdOps" de l'application.
 * Elle permet de visualiser et de gérer les opérations publicitaires
 * pour une campagne et une version de campagne sélectionnées.
 * La page affiche 4 composants principaux organisés en grille.
 * MODIFIÉ : État centralisé pour synchroniser les composants + gestion CM360 centralisée
 * AMÉLIORÉ : Regroupement visuel des composants dans des conteneurs blancs
 * CORRIGÉ : Rechargement des données après modification des couleurs
 */
'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import { useTranslation } from '../contexts/LanguageContext';
import CampaignVersionSelector from '../components/Others/CampaignVersionSelector';
import { useClient } from '../contexts/ClientContext';
import { useCampaignSelection } from '../hooks/useCampaignSelection';
import { useAdOpsData } from '../hooks/useAdOpsData';
import { getCM360TagsForTactique, detectChanges, detectMetricsChanges } from '../lib/cm360Service';
import type { CM360TagHistory } from '../lib/cm360Service';

// Import des composants AdOps
import AdOpsDropdowns from '../components/AdOps/AdOpsDropdowns';
import AdOpsTacticInfo from '../components/AdOps/AdOpsTacticInfo';
import AdOpsTacticList from '../components/AdOps/AdOpsTacticList';
import AdOpsTable from '../components/AdOps/AdOpsTacticTable';
import AdOpsProgressBar from '../components/AdOps/AdOpsProgressBar';

// Interface pour une tactique sélectionnée - MODIFIÉE : Compatible avec useAdOpsData
interface SelectedTactique {
  id: string;
  TC_Label?: string;
  TC_Publisher?: string;
  TC_Media_Type?: string;
  TC_Prog_Buying_Method?: string;
  TC_Media_Budget?: number;
  TC_BuyCurrency?: string;
  TC_CM360_Rate?: number;
  TC_CM360_Volume?: number;
  TC_Buy_Type?: string;
  ongletName: string;
  sectionName: string;
  ongletId: string;
  sectionId: string;
  placementsWithTags: any[];
}

interface Creative {
  id: string;
  CR_Label?: string;
  CR_Tag_Start_Date?: string;
  CR_Tag_End_Date?: string;
  CR_Rotation_Weight?: number;
  CR_Tag_5?: string;
  CR_Tag_6?: string;
  CR_Adops_Color?: string;
  CR_Order?: number;
}

/**
 * Composant principal de la page AdOps.
 * Permet de gérer les opérations publicitaires pour les campagnes.
 *
 * @returns {JSX.Element} Le composant React de la page AdOps.
 */
export default function AdOpsPage() {
  const { selectedClient } = useClient();
  const { t } = useTranslation();
  const [selectedTactique, setSelectedTactique] = useState<SelectedTactique | null>(null);
  
  // States centralisés pour CM360 - MODIFIÉ : Structure hierarchique par tactique
  const [cm360Tags, setCm360Tags] = useState<Map<string, CM360TagHistory>>(new Map());
  const [cm360Loading, setCm360Loading] = useState(false);
  const [creativesData, setCreativesData] = useState<{ [tactiqueId: string]: { [placementId: string]: Creative[] } }>({});
  
  // NOUVEAU : État pour le rafraîchissement manuel
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    campaigns,
    versions,
    selectedCampaign,
    selectedVersion,
    loading: campaignLoading,
    error: campaignError,
    handleCampaignChange,
    handleVersionChange,
  } = useCampaignSelection();

  // Hook centralisé pour les données AdOps
  const {
    tactiques,
    publishers,
    loading: adOpsLoading,
    error: adOpsError,
    togglePublisher,
    selectAllPublishers,
    deselectAllPublishers,
    selectedPublishers,
    filteredTactiques,
    reloadData: reloadAdOpsData // NOUVEAU : Fonction de rechargement
  } = useAdOpsData(selectedCampaign, selectedVersion);

  /**
   * NOUVELLE FONCTION CENTRALISÉE : Charge les créatifs ET les tags CM360 pour TOUTES les tactiques
   * MODIFIÉ : Chargement multiple pour afficher les indicateurs avant sélection
   */
  const loadCM360TagsForAllTactiques = async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !filteredTactiques.length) {
      setCm360Tags(new Map());
      setCreativesData({});
      return;
    }
    
    setCm360Loading(true);
    const clientId = selectedClient.clientId;
    const allTagsByTactique = new Map<string, CM360TagHistory>();
    const allCreativesByTactique: { [tactiqueId: string]: { [placementId: string]: Creative[] } } = {};

    try {
      console.log('🔄 [AdOpsPage] Chargement CM360 pour', filteredTactiques.length, 'tactiques');
      
      // Charger les données pour chaque tactique en parallèle
      const tactiquePromises = filteredTactiques.map(async (tactique) => {
        const basePath = `clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${tactique.ongletId}/sections/${tactique.sectionId}/tactiques/${tactique.id}`;
        const updatedPlacements: any[] = [];
        const tactiqueCreatives: { [placementId: string]: Creative[] } = {};
        
        // 1. Charger les placements et créatifs pour cette tactique
        for (const placement of tactique.placementsWithTags) {
          try {
            const placementRef = doc(db, `${basePath}/placements/${placement.id}`);
            const placementSnapshot = await getDoc(placementRef);
            
            if (placementSnapshot.exists()) {
              const placementData = placementSnapshot.data();
              const updatedPlacement = { ...placement, ...placementData, id: placement.id };
              updatedPlacements.push(updatedPlacement);
            } else {
              updatedPlacements.push(placement);
            }
          } catch (error) {
            console.warn(`Erreur chargement placement ${placement.id}:`, error);
            updatedPlacements.push(placement);
          }

          const creativesPath = `${basePath}/placements/${placement.id}/creatifs`;
          const creativesRef = collection(db, creativesPath);
          
          const creativesSnapshot = await getDocs(query(creativesRef, orderBy('CR_Order', 'asc')));
          const creatives: Creative[] = creativesSnapshot.docs.map(doc => ({
            ...doc.data() as Creative,
            id: doc.id
          }));
          
          tactiqueCreatives[placement.id] = creatives;
        }
        
        allCreativesByTactique[tactique.id] = tactiqueCreatives;
        
        // 2. Charger les tags CM360 pour cette tactique
        const tags = await getCM360TagsForTactique(
          clientId,
          selectedCampaign.id,
          selectedVersion.id,
          tactique.ongletId,
          tactique.sectionId,
          tactique.id,
          updatedPlacements,
          tactiqueCreatives
        );
        
        // 3. Détecter les changements et ajouter avec des clés hierarchiques
        tags.forEach((history, key) => {
          const hierarchicalKey = `tactique-${tactique.id}-${key}`;
          
          if (history.latestTag) {
            const [type, itemId] = key.split('-');
            
            if (type === 'metrics') {
              // Pour les métriques, utiliser les données de la tactique
              const tactiqueMetrics = {

                TC_CM360_Rate: tactique.TC_CM360_Rate,
                TC_CM360_Volume: tactique.TC_CM360_Volume,
                TC_Buy_Type: tactique.TC_Buy_Type
              };
              
              const changes = detectMetricsChanges(tactiqueMetrics, new Map([['metrics-tactics', history]]));
              history.hasChanges = changes.hasChanges;
              history.changedFields = changes.changedFields;
            } else {
              // Pour les placements et créatifs
              let currentData: any = null;
              
              if (type === 'placement') {
                currentData = updatedPlacements.find(p => p.id === itemId);
              } else if (type === 'creative') {
                // Trouver le créatif dans tous les placements de cette tactique
                for (const creatives of Object.values(tactiqueCreatives)) {
                  const creative = creatives.find(c => c.id === itemId);
                  if (creative) {
                    currentData = creative;
                    break;
                  }
                }
              }
              
              if (currentData) {
                const changes = detectChanges(currentData, history.latestTag, type as 'placement' | 'creative');
                history.hasChanges = changes.hasChanges;
                history.changedFields = changes.changedFields;
              }
            }
          }
          
          allTagsByTactique.set(hierarchicalKey, history);
        });
        
        console.log(`✅ [AdOpsPage] Tactique ${tactique.TC_Label} - Tags chargés:`, Array.from(tags.keys()));
      });
      
      // Attendre que toutes les tactiques soient chargées
      await Promise.all(tactiquePromises);
      
      console.log('🔍 [AdOpsPage] Tous les tags CM360 chargés:', {
        'allTagsByTactique.size': allTagsByTactique.size,
        'keys examples': Array.from(allTagsByTactique.keys()).slice(0, 5),
        'tactiques processed': Object.keys(allCreativesByTactique).length
      });
      
      setCreativesData(allCreativesByTactique);
      setCm360Tags(allTagsByTactique);
      
    } catch (error) {
      console.error('Erreur chargement données CM360 multiples:', error);
      setCreativesData({});
      setCm360Tags(new Map());
    } finally {
      setCm360Loading(false);
    }
  };

  /**
   * NOUVEAU CALLBACK : Recharge les métriques après mise à jour des métriques
   */
  const handleMetricsUpdated = async () => {
    console.log('🔄 [AdOpsPage] Rechargement tags CM360 après mise à jour métriques');
    await loadCM360TagsForAllTactiques();
  };

  /**
   * NOUVEAU CALLBACK : Recharge les tags CM360 depuis le tableau
   */
  const handleCM360TagsReload = async () => {
    console.log('🔄 [AdOpsPage] Rechargement tags CM360 depuis tableau');
    await loadCM360TagsForAllTactiques();
  };

  /**
   * NOUVEAU CALLBACK : Recharge toutes les données (tactiques + créatifs + tags CM360)
   * Utilisé après modification des couleurs pour voir les changements
   */
  const handleDataReload = async () => {
    console.log('🔄 [AdOpsPage] Rechargement complet des données après modification couleurs');
    
    try {
      // 1. D'abord recharger les données de base (tactiques avec placements/créatifs mis à jour)
      await reloadAdOpsData();
      
      // 2. Puis recharger les tags CM360 avec les nouvelles données
      await loadCM360TagsForAllTactiques();
      
      console.log('✅ [AdOpsPage] Rechargement complet terminé');
    } catch (error) {
      console.error('❌ [AdOpsPage] Erreur lors du rechargement complet:', error);
    }
  };

  /**
   * NOUVELLE FONCTION : Rafraîchissement manuel complet
   * Recharge les tags CM360 et créatifs pour voir les dernières modifications
   */
  const handleManualRefresh = async () => {
    if (!selectedCampaign || !selectedVersion || filteredTactiques.length === 0) return;
    
    setIsRefreshing(true);
    console.log('🔄 [AdOpsPage] Rafraîchissement manuel démarré');
    
    try {
      // Forcer le rechargement des tags CM360 et créatifs
      // Cette fonction va recharger toutes les données depuis Firestore
      await loadCM360TagsForAllTactiques();
      
      console.log('✅ [AdOpsPage] Rafraîchissement manuel terminé');
    } catch (error) {
      console.error('❌ [AdOpsPage] Erreur lors du rafraîchissement:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Gère le changement de campagne sélectionnée.
   */
  const handleCampaignChangeLocal = (campaign: any) => {
    handleCampaignChange(campaign);
    setSelectedTactique(null);
    setCm360Tags(new Map());
    setCreativesData({});
  };

  /**
   * Gère le changement de version de campagne sélectionnée.
   */
  const handleVersionChangeLocal = (version: any) => {
    handleVersionChange(version);
    setSelectedTactique(null);
    setCm360Tags(new Map());
    setCreativesData({});
  };

  /**
   * Gère la sélection d'une tactique
   */
  const handleTactiqueSelect = (tactique: SelectedTactique | null) => {
    setSelectedTactique(tactique);
  };

  // EFFET CORRIGÉ : Charger les tags CM360 pour toutes les tactiques filtrées
  // Utilise les IDs des tactiques pour éviter la boucle infinie
  useEffect(() => {
    const tactiqueIds = filteredTactiques.map(t => t.id).sort().join(',');
    
    if (filteredTactiques.length > 0) {
      console.log('🎯 [AdOpsPage] Tactiques filtrées changées, chargement tags CM360 pour', filteredTactiques.length, 'tactiques');
      loadCM360TagsForAllTactiques();
    } else {
      setCm360Tags(new Map());
      setCreativesData({});
    }
  }, [
    // Dépendances stables pour éviter la boucle infinie
    filteredTactiques.map(t => t.id).sort().join(','),
    selectedClient?.clientId,
    selectedCampaign?.id, 
    selectedVersion?.id
  ]);

  const isLoading = campaignLoading;
  const hasError = campaignError;

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <div className="space-y-4">
          
          {/* En-tête avec titre et informations de campagne */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">AdOps</h1>
          </div>
          
         {/* Sélecteur de campagne et version avec bouton de rafraîchissement */}
         <div className="flex items-center gap-4">
            {/* CampaignVersionSelector qui prend toute la largeur disponible */}
            <div className="flex-1">
              <CampaignVersionSelector
                campaigns={campaigns}
                versions={versions}
                selectedCampaign={selectedCampaign}
                selectedVersion={selectedVersion}
                loading={campaignLoading}
                error={campaignError}
                onCampaignChange={handleCampaignChangeLocal}
                onVersionChange={handleVersionChangeLocal}
                className="mb-0"
              />
            </div>
            
            {/* NOUVEAU : Bouton de rafraîchissement */}
            {selectedCampaign && selectedVersion && (
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing || campaignLoading || adOpsLoading || cm360Loading}
                className={`
                  flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium
                  hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap
                `}
                title="Rafraîchir toutes les données AdOps pour voir les dernières modifications"
              >
                <ArrowPathIcon 
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                />
                <span>{isRefreshing ? 'Rafraîchissement...' : 'Rafraîchir'}</span>
              </button>
            )}
          </div>
          
          {/* Barre de progression CM360 */}
          <AdOpsProgressBar 
            filteredTactiques={filteredTactiques}
            cm360Tags={cm360Tags}
            creativesData={creativesData}
            loading={campaignLoading || cm360Loading || isRefreshing}
          />
          
          {/* États de chargement et d'erreur */}
          {isLoading && (
            <div className="bg-white p-8 rounded-lg shadow flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <div className="text-sm text-gray-500">Chargement...</div>
              </div>
            </div>
          )}
          
          {hasError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {hasError}
            </div>
          )}
          
          {/* Contenu principal - AMÉLIORÉ : Regroupement visuel */}
          {!isLoading && !hasError && (
            <>
              {!selectedCampaign && (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500">
                    Veuillez sélectionner une campagne et une version pour commencer.
                  </p>
                </div>
              )}
              
              {selectedCampaign && !selectedVersion && (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500">
                    Veuillez sélectionner une version pour continuer.
                  </p>
                </div>
              )}
              
              {selectedCampaign && selectedVersion && (
                <div className="grid grid-cols-12 gap-6">
                  
                  {/* CONTENEUR GAUCHE - Dropdowns + TacticList dans un seul fond blanc */}
                  <div className="col-span-4">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      {/* Dropdowns dans la partie haute */}
                      <div className="border-b border-gray-200">
                        <AdOpsDropdowns 
                          publishers={publishers}
                          loading={adOpsLoading}
                          error={adOpsError}
                          togglePublisher={togglePublisher}
                          selectAllPublishers={selectAllPublishers}
                          deselectAllPublishers={deselectAllPublishers}
                          selectedPublishers={selectedPublishers}
                        />
                      </div>
                      
                      {/* TacticList dans la partie basse */}
                      <div className="min-h-[400px]">
                        <AdOpsTacticList 
                          filteredTactiques={filteredTactiques}
                          loading={adOpsLoading || cm360Loading || isRefreshing}
                          error={adOpsError}
                          onTactiqueSelect={handleTactiqueSelect}
                          selectedTactique={selectedTactique}
                          cm360Tags={cm360Tags}
                          creativesData={creativesData}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* CONTENEUR DROITE - TacticInfo + TacticTable dans un seul fond blanc */}
                  <div className="col-span-8">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      {/* TacticInfo dans la partie haute */}
                      <div className="border-b border-gray-200">
                        <AdOpsTacticInfo 
                          selectedTactique={selectedTactique}
                          selectedCampaign={selectedCampaign}
                          selectedVersion={selectedVersion}
                          cm360Tags={cm360Tags}
                          onMetricsUpdated={handleMetricsUpdated}
                        />
                      </div>
                      
                      {/* TacticTable dans la partie basse */}
                      <div className="min-h-[400px]">
                        <AdOpsTable 
                          selectedTactique={selectedTactique}
                          selectedCampaign={selectedCampaign}
                          selectedVersion={selectedVersion}
                          cm360Tags={cm360Tags}
                          creativesData={creativesData}
                          onCM360TagsReload={handleCM360TagsReload}
                          onDataReload={handleDataReload}
                        />
                      </div>
                    </div>
                  </div>
                  
                </div>
              )}
            </>
          )}
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}