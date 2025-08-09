// app/components/AdOps/AdOpsTacticInfo.tsx
/**
 * Composant AdOpsTacticInfo avec support CM360 amélioré
 * Affiche les métriques avec détection de changements et bouton de confirmation
 * MODIFIÉ : Filtrage hierarchique des tags CM360 par tactique
 */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  CheckIcon,
  CloudArrowUpIcon 
} from '@heroicons/react/24/outline';
import CM360HistoryModal from './CM360HistoryModal';
import { 
  CM360TagHistory, 
  CM360TagData, 
  detectMetricsChanges,
  updateMetricsTag 
} from '../../lib/cm360Service';
import { useClient } from '../../contexts/ClientContext';

interface AdOpsTactique {
  id: string;
  TC_Label?: string;
  TC_Media_Budget?: number;
  TC_BuyCurrency?: string;
  TC_CM360_Rate?: number;
  TC_CM360_Volume?: number;
  TC_Buy_Type?: string;
  ongletId?: string;
  sectionId?: string;
}

interface AdOpsTacticInfoProps {
  selectedTactique: AdOpsTactique | null;
  selectedCampaign: any;
  selectedVersion: any;
  // Props CM360 depuis AdOpsPage - MODIFIÉ : Structure hierarchique
  cm360Tags?: Map<string, CM360TagHistory>;
  onMetricsUpdated?: () => void; // Callback pour recharger les données
}

/**
 * Composant principal pour afficher les informations de la tactique avec CM360
 */
export default function AdOpsTacticInfo({ 
  selectedTactique, 
  selectedCampaign,
  selectedVersion,
  cm360Tags,
  onMetricsUpdated
}: AdOpsTacticInfoProps) {
  const { selectedClient } = useClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    fieldName: string;
    fieldLabel: string;
  }>({
    isOpen: false,
    fieldName: '',
    fieldLabel: ''
  });

  /**
   * NOUVELLE FONCTION : Filtre les tags CM360 pour la tactique sélectionnée
   * Retire le préfixe "tactique-${id}-" et retourne une Map compatible
   */
  const getFilteredCM360Tags = (): Map<string, CM360TagHistory> => {
    if (!cm360Tags || !selectedTactique) return new Map();
    
    const filtered = new Map<string, CM360TagHistory>();
    const prefix = `tactique-${selectedTactique.id}-`;
    
    cm360Tags.forEach((history, key) => {
      if (key.startsWith(prefix)) {
        const localKey = key.substring(prefix.length); // Retire le préfixe
        filtered.set(localKey, history);
      }
    });
    
    console.log(`🔍 [TacticInfo] Filtrage pour tactique ${selectedTactique.id}:`, {
      'tags totaux': cm360Tags.size,
      'tags filtrés': filtered.size,
      'clés filtrées': Array.from(filtered.keys()),
      'metrics-tactics exists': filtered.has('metrics-tactics')
    });
    
    return filtered;
  };

  /**
   * MODIFIÉE : Vérifie si les métriques ont changé en utilisant les tags filtrés
   */
  const getMetricsChanges = (): { hasChanges: boolean; changedFields: string[] } => {
    console.log('🔍 [AdOpsTacticInfo] getMetricsChanges - Début');
    
    if (!selectedTactique) {
      console.log('❌ [AdOpsTacticInfo] Pas de selectedTactique');
      return { hasChanges: false, changedFields: [] };
    }

    const filteredTags = getFilteredCM360Tags();
    console.log('📊 [AdOpsTacticInfo] Tags filtrés disponibles:', filteredTags.size);
    console.log('📊 [AdOpsTacticInfo] Clés filtrées:', Array.from(filteredTags.keys()));

    // Utiliser la fonction de détection de changements pour les métriques
    const currentMetrics = {
      TC_Media_Budget: selectedTactique.TC_Media_Budget,
      TC_BuyCurrency: selectedTactique.TC_BuyCurrency,
      TC_CM360_Rate: selectedTactique.TC_CM360_Rate,
      TC_CM360_Volume: selectedTactique.TC_CM360_Volume,
      TC_Buy_Type: selectedTactique.TC_Buy_Type
    };

    console.log('📈 [AdOpsTacticInfo] Métriques actuelles:', currentMetrics);

    const metricsHistory = filteredTags.get('metrics-tactics');
    console.log('📋 [AdOpsTacticInfo] Historique métriques:', metricsHistory);
    
    if (metricsHistory?.latestTag?.tactiqueMetrics) {
      console.log('📊 [AdOpsTacticInfo] Dernières métriques sauvegardées:', metricsHistory.latestTag.tactiqueMetrics);
    }

    const result = detectMetricsChanges(currentMetrics, filteredTags);
    console.log('🎯 [AdOpsTacticInfo] Résultat détection changements:', result);

    return result;
  };

  /**
   * MODIFIÉE : Vérifie si un champ spécifique a changé en utilisant les tags filtrés
   */
  const isFieldChanged = (fieldName: string): boolean => {
    console.log(`🔍 [isFieldChanged] Vérification pour ${fieldName}`);
    
    const metricsChanges = getMetricsChanges();
    console.log(`📊 [isFieldChanged] Résultat getMetricsChanges:`, metricsChanges);
    
    const isChanged = metricsChanges.changedFields.includes(fieldName);
    
    console.log(`🎯 [isFieldChanged] ${fieldName}:`, {
      isChanged,
      changedFields: metricsChanges.changedFields,
      hasChanges: metricsChanges.hasChanges,
      'fieldName in changedFields': metricsChanges.changedFields.includes(fieldName)
    });
    
    return isChanged;
  };

  /**
   * MODIFIÉE : Récupère tous les tags qui contiennent le champ spécifié en utilisant les tags filtrés
   */
  const getTagsForField = (fieldName: string): CM360TagData[] => {
    const filteredTags = getFilteredCM360Tags();
    
    // Si c'est un champ de métrique, utiliser les tags de métriques spéciaux
    if (fieldName.startsWith('TC_')) {
      const metricsHistory = filteredTags.get('metrics-tactics');
      return metricsHistory ? metricsHistory.tags : [];
    }
    
    return [];
  };

  /**
   * Ouvre le modal d'historique pour un champ de métrique
   */
  const openHistoryModal = (fieldName: string, fieldLabel: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setModalState({
      isOpen: true,
      fieldName,
      fieldLabel
    });
  };

  /**
   * Ferme le modal d'historique
   */
  const closeHistoryModal = () => {
    setModalState({
      isOpen: false,
      fieldName: '',
      fieldLabel: ''
    });
  };

  /**
   * Met à jour les métriques dans CM360
   */
  const handleMetricsUpdate = async () => {
    if (!selectedClient || !selectedTactique || !selectedCampaign || !selectedVersion) return;
    
    setUpdating(true);
    const clientId = selectedClient.clientId;
    
    try {
      const currentMetrics = {
        TC_Media_Budget: selectedTactique.TC_Media_Budget,
        TC_BuyCurrency: selectedTactique.TC_BuyCurrency,
        TC_CM360_Rate: selectedTactique.TC_CM360_Rate,
        TC_CM360_Volume: selectedTactique.TC_CM360_Volume,
        TC_Buy_Type: selectedTactique.TC_Buy_Type
      };
      
      await updateMetricsTag(
        clientId,
        selectedCampaign.id,
        selectedVersion.id,
        selectedTactique.ongletId!,
        selectedTactique.sectionId!,
        selectedTactique.id,
        currentMetrics
      );
      
      // Notifier le parent pour recharger les données
      if (onMetricsUpdated) {
        onMetricsUpdated();
      }
      
    } catch (error) {
      console.error('Erreur mise à jour métriques:', error);
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Copie une valeur dans le presse-papiers avec feedback visuel
   */
  const copyToClipboard = async (value: string | number | undefined, fieldName: string) => {
    if (value === undefined || value === null) return;
    
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(fieldName);
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  /**
   * Formate un nombre avec séparateurs
   */
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return 'N/A';
    return new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 2 }).format(num);
  };

  /**
   * Formate un montant avec devise
   */
  const formatCurrency = (amount: number | undefined, currency: string | undefined): string => {
    if (amount === undefined || amount === null) {
        return 'N/A';
    }

    // On assume que formatNumber est une fonction qui formate le nombre correctement
    const formattedAmount = formatNumber(amount); 
    
    // On utilise 'CAD' comme devise par défaut si aucune n'est fournie
    const effectiveCurrency = currency || 'CAD';

    // Si la devise est 'CAD', on place le symbole '$' après le montant
    if (effectiveCurrency === 'CAD') {
        return `${formattedAmount} $`;
    }

    // Pour toutes les autres devises, on garde le format original
    return `${formattedAmount} ${effectiveCurrency}`;
};

  /**
   * Composant carte métrique réutilisable avec support CM360
   */
  const MetricCard = ({ 
    title, 
    value, 
    rawValue, 
    fieldName, 
    color = 'gray'
  }: { 
    title: string; 
    value: string; 
    rawValue: string | number | undefined;
    fieldName: string;
    color?: 'blue' | 'green' | 'purple' | 'gray';
  }) => {
    const isCopied = copiedField === fieldName;
    const hasValue = rawValue !== undefined && rawValue !== null && rawValue !== '';
    const isChanged = isFieldChanged(fieldName);



    const colorClasses = {
      blue: 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100',
      green: 'border-l-green-500 bg-gradient-to-r from-green-50 to-white hover:from-green-100', 
      purple: 'border-l-purple-500 bg-gradient-to-r from-purple-50 to-white hover:from-purple-100',
      gray: 'border-l-gray-500 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100'
    };

    return (
      <div 
        className={`
          p-2 rounded border-l-4 border-gray-200 shadow-sm transition-all duration-200
          ${colorClasses[color]}
          ${!hasValue ? 'cursor-not-allowed opacity-50' : ''}
          ${isChanged ? 'ring-2 ring-red-300' : ''}
        `}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-medium text-gray-700">{title}</div>
          {(() => {

            return isChanged;
          })() && (
            <button
              onClick={(e) => openHistoryModal(fieldName, title, e)}
              className="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50"
              title={`${title} a été modifié depuis le dernier tag - Cliquer pour voir l'historique`}
            >
              <ExclamationTriangleIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div 
          className={`text-lg font-bold cursor-pointer hover:bg-white hover:bg-opacity-50 px-1 py-1 rounded transition-colors flex items-center gap-1 ${
            hasValue ? 'text-gray-900' : 'text-gray-400'
          }`}
          onClick={() => hasValue && copyToClipboard(rawValue, fieldName)}
          title={hasValue ? `Cliquer pour copier ${title.toLowerCase()}` : 'Valeur non disponible'}
        >
          <span>{value}</span>
         
        </div>
        
        {isCopied && (
          <div className="text-xs text-green-600 font-medium mt-1">
            ✓ Copié
          </div>
        )}
      </div>
    );
  };

  if (!selectedTactique) {
    return (
      <div className="bg-white p-3 rounded-lg shadow">
        <div className="flex items-center justify-center h-16 text-gray-500 text-center">
          <p className="text-sm">Aucune tactique sélectionnée</p>
        </div>
      </div>
    );
  }

  const metricsChanges = getMetricsChanges();
  const filteredTags = getFilteredCM360Tags();
  const hasMetricsTags = filteredTags.has('metrics-tactics');

  console.log('🎯 [AdOpsTacticInfo] Rendu principal:', {
    selectedTactique: selectedTactique?.TC_Label,
    hasMetricsTags,
    metricsChanges,
    filteredTagsSize: filteredTags.size
  });

  return (
    <>
      <div className="bg-white p-3 rounded-lg shadow">
        {/* En-tête compact avec badges et indicateur de changement global */}
        <div className="flex items-center justify-between gap-2 mb-3">
   
          
          <div className="flex items-center gap-2">
            {selectedTactique.TC_BuyCurrency && (
              <div className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                {selectedTactique.TC_BuyCurrency}
              </div>
            )}
            
            {selectedTactique.TC_Buy_Type && (
              <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                selectedTactique.TC_Buy_Type === 'CPM' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : selectedTactique.TC_Buy_Type === 'CPC'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                {selectedTactique.TC_Buy_Type}
              </div>
            )}

          </div>
        </div>
        
        {/* Trois cartes métriques avec support CM360 */}
        <div className="grid grid-cols-3 gap-2">
          <MetricCard
            title="Budget Média"
            value={formatCurrency(selectedTactique.TC_Media_Budget, selectedTactique.TC_BuyCurrency)}
            rawValue={selectedTactique.TC_Media_Budget}
            fieldName="TC_Media_Budget"
            color="blue"
          />
          
          <MetricCard
            title="Taux CM360"
            value={formatCurrency(selectedTactique.TC_CM360_Rate, selectedTactique.TC_BuyCurrency)}
            rawValue={selectedTactique.TC_CM360_Rate}
            fieldName="TC_CM360_Rate"
            color="green"
          />
          
          <MetricCard
            title="Volume CM360"
            value={formatNumber(selectedTactique.TC_CM360_Volume)}
            rawValue={selectedTactique.TC_CM360_Volume}
            fieldName="TC_CM360_Volume"
            color="purple"
          />
        </div>
        
        {/* Bouton de mise à jour si des changements sont détectés */}
        {metricsChanges.hasChanges && hasMetricsTags && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={handleMetricsUpdate}
              disabled={updating}
              className="w-full px-3 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {updating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Mise à jour...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>Changements effectués dans CM360</span>
                </>
              )}
            </button>

          </div>
        )}
      </div>

      {/* Modal d'historique pour les métriques */}
      {modalState.isOpen && selectedTactique && (
        <CM360HistoryModal
          isOpen={modalState.isOpen}
          onClose={closeHistoryModal}
          fieldName={modalState.fieldName}
          fieldLabel={modalState.fieldLabel}
          currentValue={selectedTactique[modalState.fieldName as keyof AdOpsTactique]}
          tags={getTagsForField(modalState.fieldName)}
          itemType="metrics"
          itemLabel={selectedTactique.TC_Label || 'Tactique'}
          cm360Tags={filteredTags}
        />
      )}
    </>
  );
}