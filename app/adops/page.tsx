// app/adops/page.tsx
/**
 * CORRIGÉ : Lecture des métriques tactiques depuis cm360Tags
 * CORRIGÉ : Erreurs TypeScript pour CM360TagData
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
import { motion, Variants } from 'framer-motion';

// Import des composants AdOps
import AdOpsDropdowns from '../components/AdOps/AdOpsDropdowns';
import AdOpsProgressBar from '../components/AdOps/AdOpsProgressBar';
import AdOpsTacticTable from '../components/AdOps/AdOpsTacticTable';

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

// CORRIGÉ : Interface pour les métriques avec indexation
interface TactiqueMetrics {
  TC_Media_Budget: any;
  TC_BuyCurrency: any;
  TC_CM360_Rate: any;
  TC_CM360_Volume: any;
  TC_Buy_Type: any;
  TC_Label: any;
  TC_Publisher: any;
  [key: string]: any; // Index signature pour permettre l'accès dynamique
}

/**
 * CORRIGÉE : Charge les métriques tactiques depuis cm360Tags
 * Fix des erreurs TypeScript pour CM360TagData
 */
const loadTactiqueMetrics = async (
  clientId: string,
  campaignId: string,
  versionId: string,
  tactique: any
): Promise<CM360TagHistory | null> => {
  try {
    const tactiquePath = `clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${tactique.ongletId}/sections/${tactique.sectionId}/tactiques/${tactique.id}`;
    
    console.log(`🔍 [LoadMetrics] Chargement métriques pour: ${tactique.TC_Label}`);
    console.log(`🔍 [LoadMetrics] Chemin: ${tactiquePath}`);
    
    const tactiqueRef = doc(db, tactiquePath);
    const tactiqueSnapshot = await getDoc(tactiqueRef);
    
    if (!tactiqueSnapshot.exists()) {
      console.log(`❌ [LoadMetrics] Document tactique non trouvé: ${tactique.id}`);
      return null;
    }
    
    const tactiqueData = tactiqueSnapshot.data();
    const metricsData = tactiqueData.cm360Tags;
    
    console.log(`🔍 [LoadMetrics] Données brutes cm360Tags:`, metricsData);
    
    if (!metricsData || Object.keys(metricsData).length === 0) {
      console.log(`ℹ️ [LoadMetrics] Aucune métrique trouvée pour: ${tactique.TC_Label}`);
      return null;
    }
    
    // Convertir la structure { 0: {...}, 1: {...} } en array et trier par version
    const metricsArray = Object.entries(metricsData)
      .map(([index, data]: [string, any]) => ({
        index: parseInt(index),
        ...data
      }))
      .sort((a, b) => b.index - a.index); // Plus récent en premier
    
    console.log(`🔍 [LoadMetrics] Métriques triées:`, metricsArray);
    
    if (metricsArray.length === 0) {
      return null;
    }
    
    // Le tag le plus récent
    const latestMetrics = metricsArray[0];
    
    // CORRIGÉ : Créer l'historique CM360 avec les propriétés requises
    const history: CM360TagHistory = {
      itemId: 'tactics',
      type: 'metrics',
      latestTag: {
        type: 'metrics',
        itemId: 'tactics',
        tactiqueId: tactique.id,
        tableData: latestMetrics.tactiqueMetrics,
        createdAt: latestMetrics.timestamp,
        version: latestMetrics.version || latestMetrics.index
      },
      tags: metricsArray.map(metrics => ({
        type: 'metrics',
        itemId: 'tactics',
        tactiqueId: tactique.id,
        tableData: metrics.tactiqueMetrics,
        createdAt: metrics.timestamp,
        version: metrics.version || metrics.index
      })),
      hasChanges: false, // Sera calculé après
      changedFields: []
    };
    
    // Comparer avec les données actuelles de la tactique
    const currentMetrics: TactiqueMetrics = {
      TC_Media_Budget: tactique.TC_Media_Budget,
      TC_BuyCurrency: tactique.TC_BuyCurrency,
      TC_CM360_Rate: tactique.TC_CM360_Rate,
      TC_CM360_Volume: tactique.TC_CM360_Volume,
      TC_Buy_Type: tactique.TC_Buy_Type,
      TC_Label: tactique.TC_Label,
      TC_Publisher: tactique.TC_Publisher
    };
    
    const savedMetrics = latestMetrics.tactiqueMetrics;
    
    console.log(`🔍 [LoadMetrics] Comparaison pour ${tactique.TC_Label}:`, {
      currentMetrics,
      savedMetrics
    });
    
    // Détecter les changements
    const fieldsToCompare = ['TC_Media_Budget', 'TC_BuyCurrency', 'TC_CM360_Rate', 'TC_CM360_Volume', 'TC_Buy_Type', 'TC_Label', 'TC_Publisher'];
    const changedFields: string[] = [];
    
    console.log(`🔍 [LoadMetrics] Comparaison détaillée pour ${tactique.TC_Label}:`);
    
    fieldsToCompare.forEach(field => {
      // CORRIGÉ : Utilisation de l'index signature
      const currentValue = currentMetrics[field];
      const savedValue = savedMetrics[field];
      
      // Logs détaillés pour chaque champ
      console.log(`🔍 [LoadMetrics] Champ ${field}:`, {
        current: currentValue,
        saved: savedValue,
        currentType: typeof currentValue,
        savedType: typeof savedValue,
        currentString: String(currentValue),
        savedString: String(savedValue),
        areEqual: String(currentValue) === String(savedValue)
      });
      
      if (String(currentValue) !== String(savedValue)) {
        changedFields.push(field);
        console.log(`❌ [LoadMetrics] CHANGEMENT DÉTECTÉ ${field}:`, {
          current: currentValue,
          saved: savedValue
        });
      } else {
        console.log(`✅ [LoadMetrics] Champ ${field} identique`);
      }
    });
    
    history.hasChanges = changedFields.length > 0;
    history.changedFields = changedFields;
    
    console.log(`✅ [LoadMetrics] Historique créé pour ${tactique.TC_Label}:`, {
      hasChanges: history.hasChanges,
      changedFields: history.changedFields,
      tagsCount: history.tags.length
    });
    
    return history;
    
  } catch (error) {
    console.error(`❌ [LoadMetrics] Erreur chargement métriques ${tactique.TC_Label}:`, error);
    return null;
  }
};

/**
 * Composant principal de la page AdOps
 */
export default function AdOpsPage() {
  const { selectedClient } = useClient();
  const { t } = useTranslation();
  
  // États centralisés pour CM360
  const [cm360Tags, setCm360Tags] = useState<Map<string, CM360TagHistory>>(new Map());
  const [cm360Loading, setCm360Loading] = useState(false);
  const [creativesData, setCreativesData] = useState<{ [tactiqueId: string]: { [placementId: string]: Creative[] } }>({});
  
  // État pour le rafraîchissement manuel
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

  // Hook centralisé pour les données AdOps avec gestion tactiques
  const {
    tactiques,
    publishers,
    tactiqueOptions,
    selectedTactiques,
    toggleTactique,
    selectAllTactiques,
    deselectAllTactiques,
    loading: adOpsLoading,
    error: adOpsError,
    togglePublisher,
    selectAllPublishers,
    deselectAllPublishers,
    selectedPublishers,
    filteredTactiques,
    reloadData: reloadAdOpsData
  } = useAdOpsData(selectedCampaign, selectedVersion);

  /**
   * CORRIGÉE : Charge les créatifs ET les tags CM360 pour les tactiques filtrées
   */
  const loadCM360TagsForFilteredTactiques = async () => {
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
      // Charger les données pour chaque tactique filtrée en parallèle
      const tactiquePromises = filteredTactiques
        .filter(tactique => tactique && tactique.id) // Filtrer les tactiques invalides
        .map(async (tactique) => {
        
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
        
        // 2. Charger les tags CM360 pour les placements, créatifs ET métriques
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
            
            // Pour les placements et créatifs, détecter les changements
            if (type === 'placement' || type === 'creative') {
              let currentData: any = null;
              
              if (type === 'placement') {
                currentData = updatedPlacements.find(p => p.id === itemId);
              } else if (type === 'creative') {
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
            
            // Pour les métriques, détecter les changements avec les données actuelles de la tactique
            if (type === 'metrics') {
              const changes = detectMetricsChanges(tactique, history);
              history.hasChanges = changes.hasChanges;
              history.changedFields = changes.changedFields;
            }
          }
          
          allTagsByTactique.set(hierarchicalKey, history);
        });
        
        console.log(`✅ [AdOpsPage] Tactique ${tactique.TC_Label} - Tags chargés:`, Array.from(tags.keys()));
      });
      
      // Attendre que toutes les tactiques soient chargées
      await Promise.all(tactiquePromises);
      
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
   * Callback : Recharge les tags CM360 depuis le tableau
   */
  const handleCM360TagsReload = async () => {
    await loadCM360TagsForFilteredTactiques();
  };

  /**
   * Callback : Recharge toutes les données après modification couleurs
   */
  const handleDataReload = async () => {
    console.log('🔄 [AdOpsPage] Rechargement complet des données après modification couleurs');
    
    try {
      await reloadAdOpsData();
      console.log('✅ [AdOpsPage] Rechargement complet terminé');
    } catch (error) {
      console.error('❌ [AdOpsPage] Erreur lors du rechargement complet:', error);
    }
  };

  /**
   * Rafraîchissement manuel complet
   */
  const handleManualRefresh = async () => {
    if (!selectedCampaign || !selectedVersion || filteredTactiques.length === 0) return;
    
    setIsRefreshing(true);
    console.log('🔄 [AdOpsPage] Rafraîchissement manuel démarré');
    
    try {
      await loadCM360TagsForFilteredTactiques();
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
    setCm360Tags(new Map());
    setCreativesData({});
  };

  /**
   * Gère le changement de version de campagne sélectionnée.
   */
  const handleVersionChangeLocal = (version: any) => {
    handleVersionChange(version);
    setCm360Tags(new Map());
    setCreativesData({});
  };

  // EFFET : Charger les tags CM360 pour les tactiques filtrées
  useEffect(() => {
    const tactiqueIds = filteredTactiques.map(t => t.id).sort().join(',');
    
    if (filteredTactiques.length > 0) {
      console.log('🎯 [AdOpsPage] Tactiques filtrées changées, chargement tags CM360 pour', filteredTactiques.length, 'tactiques');
      loadCM360TagsForFilteredTactiques();
    } else {
      setCm360Tags(new Map());
      setCreativesData({});
    }
  }, [
    filteredTactiques.map(t => t.id).sort().join(','),
    selectedClient?.clientId,
    selectedCampaign?.id, 
    selectedVersion?.id
  ]);

  const isLoading = campaignLoading;
  const hasError = campaignError;

  const containerVariants: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
    },
  };

  const cardVariants: Variants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
    },
  };

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <motion.div 
          className="space-y-4"
          initial="initial"
          animate="animate"
          variants={containerVariants}
        >
          
          {/* En-tête avec titre */}
          <motion.div className="flex justify-between items-center" variants={itemVariants}>
            <h1 className="text-2xl font-bold text-gray-900">{t('adOpsPage.header.title')}</h1>
          </motion.div>
          
          {/* Sélecteur de campagne et version avec bouton de rafraîchissement */}
          <motion.div className="flex items-center gap-4" variants={itemVariants}>
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
            
            {/* Bouton de rafraîchissement */}
            {selectedCampaign && selectedVersion && (
              <motion.button
                onClick={handleManualRefresh}
                disabled={isRefreshing || campaignLoading || adOpsLoading || cm360Loading}
                className={`
                  flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium
                  hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap
                `}
                title={t('adOpsPage.header.refreshTooltip')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowPathIcon 
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                />
                <span>{isRefreshing ? t('adOpsPage.header.refreshing') : t('adOpsPage.header.refresh')}</span>
              </motion.button>
            )}
          </motion.div>
          
          {/* Barre de progression CM360 */}
          <motion.div variants={itemVariants}>
            <AdOpsProgressBar 
              filteredTactiques={filteredTactiques}
              cm360Tags={cm360Tags}
              creativesData={creativesData}
              loading={campaignLoading || cm360Loading || isRefreshing}
            />
          </motion.div>
          
          {/* États de chargement et d'erreur */}
          {isLoading && (
            <motion.div 
              className="bg-white p-8 rounded-lg shadow flex items-center justify-center"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <div className="text-sm text-gray-500">{t('common.loading')}</div>
              </div>
            </motion.div>
          )}
          
          {hasError && (
            <motion.div 
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
              variants={itemVariants}
            >
              {hasError}
            </motion.div>
          )}
          
          {/* Contenu principal - LAYOUT SIMPLIFIÉ */}
          {!isLoading && !hasError && (
            <>
              {!selectedCampaign && (
                <motion.div 
                  className="bg-white p-8 rounded-lg shadow text-center"
                  variants={itemVariants}
                >
                  <p className="text-gray-500">
                    {t('adOpsPage.placeholder.selectCampaignAndVersion')}
                  </p>
                </motion.div>
              )}
              
              {selectedCampaign && !selectedVersion && (
                <motion.div 
                  className="bg-white p-8 rounded-lg shadow text-center"
                  variants={itemVariants}
                >
                  <p className="text-gray-500">
                    {t('adOpsPage.placeholder.selectVersion')}
                  </p>
                </motion.div>
              )}
              
              {selectedCampaign && selectedVersion && (
                <motion.div 
                  className="space-y-6"
                  initial="initial"
                  animate="animate"
                  variants={containerVariants}
                >
                  
                  {/* Dropdowns en cascade dans un conteneur blanc */}
                  <motion.div className="bg-white rounded-lg shadow" variants={cardVariants}>
                    <AdOpsDropdowns 
                      publishers={publishers}
                      tactiqueOptions={tactiqueOptions}
                      selectedPublishers={selectedPublishers}
                      selectedTactiques={selectedTactiques}
                      loading={adOpsLoading}
                      error={adOpsError}
                      togglePublisher={togglePublisher}
                      selectAllPublishers={selectAllPublishers}
                      deselectAllPublishers={deselectAllPublishers}
                      toggleTactique={toggleTactique}
                      selectAllTactiques={selectAllTactiques}
                      deselectAllTactiques={deselectAllTactiques}
                    />
                  </motion.div>
                  
                  {/* Tableau pleine largeur avec niveau tactiques */}
                  <motion.div className="bg-white rounded-lg shadow" variants={cardVariants}>
                    <AdOpsTacticTable 
                      selectedTactiques={filteredTactiques}
                      selectedCampaign={selectedCampaign}
                      selectedVersion={selectedVersion}
                      cm360Tags={cm360Tags}
                      creativesData={creativesData}
                      onCM360TagsReload={handleCM360TagsReload}
                      onDataReload={handleDataReload}
                    />
                  </motion.div>
                  
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}