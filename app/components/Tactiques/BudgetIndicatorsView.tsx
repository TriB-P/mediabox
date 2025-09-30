// Fichier: app/components/Tactiques/BudgetIndicatorsView.tsx
// Chemin: app/components/Tactiques/BudgetIndicatorsView.tsx

/**
 * Composant d'affichage des indicateurs de performance budgétaire.
 * VERSION CORRIGÉE : Utilise le cache optimisé au lieu des appels Firebase directs
 * 
 * CORRECTIONS APPORTÉES :
 * - Remplacement de getShortcodes() par getCachedAllShortcodes()
 * - Amélioration vérification tags LMI_Local (string ET array)
 * - Debugging détaillé pour identifier les problèmes
 * - Suppression complète des appels Firebase directs
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionMarkCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Campaign } from '../../types/campaign';
import { Section, Tactique } from '../../types/tactiques';
import { getClientIndicators, ClientIndicators } from '../../lib/clientService';
import { useClient } from '../../contexts/ClientContext';
import { useTranslation } from '../../contexts/LanguageContext';
// NOUVELLE IMPORT : Utilisation du cache optimisé
import { getCachedAllShortcodes, ShortcodeItem } from '../../lib/cacheService';

interface BudgetIndicatorsViewProps {
  selectedCampaign: Campaign;
  allSections: Section[];
  allTactiques: { [sectionId: string]: Tactique[] };
  formatCurrency: (amount: number) => string;
}

interface IndicatorConfig {
  key: keyof ClientIndicators;
  nameKey: string;
  descriptionKey: string;
  calculate: (tactiques: Tactique[]) => Promise<number>;
  threshold1Key: keyof ClientIndicators;
  threshold2Key: keyof ClientIndicators;
  status: 'active' | 'coming-soon';
}

// Animations subtiles cohérentes
const subtleEase: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const containerVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: subtleEase,
      staggerChildren: 0.1
    }
  }
};

const indicatorVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: subtleEase }
  }
};

const barVariants = {
  initial: { scaleX: 0 },
  animate: { 
    scaleX: 1,
    transition: { duration: 0.5, ease: subtleEase }
  }
};

const triangleVariants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: subtleEase, delay: 0.3 }
  }
};

/**
 * Composant IndicatorBar - Affiche une barre colorée avec triangle indicateur
 */
interface IndicatorBarProps {
  value: number;
  threshold1: number | null;
  threshold2: number | null;
  showTriangle?: boolean;
}

const IndicatorBar: React.FC<IndicatorBarProps> = ({ 
  value, 
  threshold1, 
  threshold2, 
  showTriangle = true 
}) => {
  const position = Math.min(Math.max(value, 0), 100)-2;
  
  // Déterminer les zones de couleur basées sur les seuils
  const zones = useMemo(() => {
    const t1 = threshold1 || 33;
    const t2 = threshold2 || 66;
    
    return {
      redWidth: Math.min(t1, 100),
      yellowWidth: Math.min(t2 - t1, 100 - t1),
      greenWidth: Math.max(0, 100 - t2)
    };
  }, [threshold1, threshold2]);

  return (
    <div className="relative w-full">
      {/* Triangle indicateur au dessus */}
      {showTriangle && (
        <motion.div
          variants={triangleVariants}
          className="absolute -top-3 transform -translate-x-1/2 z-10"
          style={{ left: `${position}%` }}
        >
          <div className="w-3 h-3 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-gray-800" />
        </motion.div>
      )}
      
      {/* Barre de couleur plus étroite */}
      <div className="relative w-full h-3 bg-gray-100 overflow-hidden">
        {/* Zone rouge */}
        <motion.div
          variants={barVariants}
          className="absolute left-0 top-0 h-full bg-red-500"
          style={{ width: `${zones.redWidth}%`, transformOrigin: 'left' }}
        />
        
        {/* Zone jaune */}
        <motion.div
          variants={barVariants}
          className="absolute top-0 h-full bg-yellow-500"
          style={{ 
            left: `${zones.redWidth}%`, 
            width: `${zones.yellowWidth}%`,
            transformOrigin: 'left'
          }}
        />
        
        {/* Zone verte */}
        <motion.div
          variants={barVariants}
          className="absolute top-0 h-full bg-green-500"
          style={{ 
            left: `${zones.redWidth + zones.yellowWidth}%`, 
            width: `${zones.greenWidth}%`,
            transformOrigin: 'left'
          }}
        />
      </div>
    </div>
  );
};

/**
 * Composant IndicatorItem - Gère un indicateur individuel avec calcul asynchrone
 */
interface IndicatorItemProps {
  config: IndicatorConfig;
  allCampaignTactiques: Tactique[];
  threshold1: number | null;
  threshold2: number | null;
  showDescription: boolean;
  onToggleDescription: () => void;
  t: (key: string) => string;
}

const IndicatorItem: React.FC<IndicatorItemProps> = ({
  config,
  allCampaignTactiques,
  threshold1,
  threshold2,
  showDescription,
  onToggleDescription,
  t
}) => {
  const [value, setValue] = useState<number>(0);
  const [calculating, setCalculating] = useState<boolean>(false);

  // Calculer la valeur de l'indicateur
  useEffect(() => {
    if (config.status === 'active') {
      setCalculating(true);
      config.calculate(allCampaignTactiques)
        .then(result => setValue(result))
        .catch(error => {
          console.error(`Erreur calcul indicateur ${config.key}:`, error);
          setValue(0);
        })
        .finally(() => setCalculating(false));
    } else {
      setValue(0);
    }
  }, [config, allCampaignTactiques]);

  return (
    <motion.div
      variants={indicatorVariants}
      className="space-y-3"
    >
      {/* Header avec nom et icône info */}
      <div className="flex items-center space-x-2">
        <h5 className="text-sm font-medium text-gray-800">
          {t(config.nameKey)}
        </h5>
        <button
          onClick={onToggleDescription}
          className="hover:bg-gray-100 rounded-full p-1 transition-colors"
        >
          <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
      
      {/* Boite de description (seulement si visible) */}
      <AnimatePresence>
        {showDescription && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: subtleEase }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-hidden"
          >
            <p className="text-xs text-gray-600">
              {t(config.descriptionKey)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Barre d'indicateur ou texte "À venir" */}
      {config.status === 'active' ? (
        <div className="relative pb-6 pt-2">
          {calculating ? (
            <div className="flex items-center justify-center py-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block rounded-full h-4 w-4 border-b-2 border-indigo-600"
              />
              <span className="ml-2 text-sm text-gray-500">
                {t('budgetIndicators.calculating')}
              </span>
            </div>
          ) : (
            <IndicatorBar
              value={value}
              threshold1={threshold1}
              threshold2={threshold2}
              showTriangle={true}
            />
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <span className="text-sm text-gray-500 font-medium">
            {t('budgetIndicators.comingSoon')}
          </span>
        </div>
      )}
    </motion.div>
  );
};

/**
 * Composant principal BudgetIndicatorsView
 */
const BudgetIndicatorsView: React.FC<BudgetIndicatorsViewProps> = ({
  selectedCampaign,
  allSections,
  allTactiques,
  formatCurrency
}) => {
  const { t } = useTranslation();
  const { selectedClient } = useClient();
  const [indicators, setIndicators] = useState<ClientIndicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDescriptions, setShowDescriptions] = useState<{ [key: string]: boolean }>({});

  // Charger les seuils des indicateurs depuis Firebase
  const loadIndicators = useCallback(async () => {
    if (!selectedClient?.clientId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`FIREBASE: LECTURE - Fichier: BudgetIndicatorsView.tsx - Fonction: loadIndicators - Path: clients/${selectedClient.clientId}/indicators/thresholds`);
      const indicatorsData = await getClientIndicators(selectedClient.clientId);
      setIndicators(indicatorsData);
    } catch (err) {
      console.error('Erreur lors du chargement des indicateurs:', err);
      setError(t('budgetIndicators.error.loadingIndicators'));
    } finally {
      setLoading(false);
    }
  }, [selectedClient?.clientId, t]);

  useEffect(() => {
    loadIndicators();
  }, [loadIndicators]);

  // Récupération de toutes les tactiques de la campagne
  const allCampaignTactiques = useMemo(() => {
    const tactiques: Tactique[] = [];
    allSections.forEach(section => {
      const sectionTactiques = allTactiques[section.id] || [];
      tactiques.push(...sectionTactiques);
    });
    return tactiques;
  }, [allSections, allTactiques]);

  // Toggle description visibility
  const toggleDescription = useCallback((key: string) => {
    setShowDescriptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  // NOUVELLE VERSION OPTIMISÉE : Utilise le cache au lieu de Firebase
  const calculateMediaLocauxPercentage = useCallback(async (tactiques: Tactique[]): Promise<number> => {
    console.log('\n🏠 [INDICATEUR MÉDIA LOCAUX] Début calcul...');
    
    const digitalMediaTypes = ['DIG', 'SEA', 'SH_DNEQYAVD', 'SH_R3Z3VC6B'];
    
    // Filtrer les tactiques digitales
    const digitalTactiques = tactiques.filter(t => 
      t.TC_Media_Type && digitalMediaTypes.includes(t.TC_Media_Type)
    );
    
    console.log(`📱 [DIGITAL] ${digitalTactiques.length} tactiques digitales trouvées sur ${tactiques.length} total`);
    
    // Calculer le budget digital total
    const totalDigitalBudget = digitalTactiques.reduce((sum, t) => 
      sum + (t.TC_Client_Budget_RefCurrency || 0), 0
    );
    
    console.log(`💰 [BUDGET DIGITAL] Total: ${totalDigitalBudget}`);
    
    if (totalDigitalBudget === 0) {
      console.log('⚠️ [MÉDIA LOCAUX] Budget digital = 0, retour 0%');
      return 0;
    }
    
    // NOUVELLE APPROCHE : Utiliser le cache au lieu des appels Firebase
    console.log('🎯 [CACHE] Récupération des shortcodes depuis le cache...');
    const allShortcodes = getCachedAllShortcodes();
    
    if (!allShortcodes) {
      console.error('❌ [CACHE] Shortcodes non disponibles dans le cache!');
      return 0;
    }
    
    console.log(`✅ [CACHE] ${Object.keys(allShortcodes).length} shortcodes disponibles dans le cache`);
    
    // Helper pour vérifier si un shortcode contient LMI_Local (insensible à la casse)
    const hasLMILocalTag = (shortcode: ShortcodeItem): boolean => {
      if (!shortcode.SH_Tags) return false;
      
      // Gérer les cas où SH_Tags peut être string ou array
      let tags: string[];
      const rawTags = shortcode.SH_Tags as any; // Forcer le type pour éviter l'erreur TypeScript
      
      if (typeof rawTags === 'string') {
        tags = rawTags.split(',').map((tag: string) => tag.trim());
      } else if (Array.isArray(rawTags)) {
        tags = rawTags;
      } else {
        return false;
      }
      
      // CORRECTION : Vérification insensible à la casse
      return tags.some((tag: string) => 
        tag.toLowerCase().includes('lmi_local')
      );
    };
    
    // Analyser chaque tactique digitale
    let localBudget = 0;
    let localTactiquesCount = 0;
    
    digitalTactiques.forEach((tactique, index) => {
      const budget = tactique.TC_Client_Budget_RefCurrency || 0;
      let isLocal = false;
      
      console.log(`\n📋 [TACTIQUE ${index + 1}/${digitalTactiques.length}] Budget: ${budget}`);
      
      // Vérifier Publisher
      if (tactique.TC_Publisher) {
        const publisherShortcode = allShortcodes[tactique.TC_Publisher];
        if (publisherShortcode) {
          const publisherIsLocal = hasLMILocalTag(publisherShortcode);
          console.log(`   📡 Publisher: ${publisherShortcode.SH_Display_Name_FR} (${tactique.TC_Publisher})`);
          console.log(`   🏷️  Tags: ${publisherShortcode.SH_Tags}`);
          console.log(`   🏠 Local: ${publisherIsLocal ? 'OUI' : 'NON'}`);
          
          if (publisherIsLocal) isLocal = true;
        } else {
          console.log(`   ⚠️  Publisher ${tactique.TC_Publisher} non trouvé dans le cache`);
        }
      }
      
      // Vérifier Inventory
      if (tactique.TC_Inventory) {
        const inventoryShortcode = allShortcodes[tactique.TC_Inventory];
        if (inventoryShortcode) {
          const inventoryIsLocal = hasLMILocalTag(inventoryShortcode);
          console.log(`   📦 Inventory: ${inventoryShortcode.SH_Display_Name_FR} (${tactique.TC_Inventory})`);
          console.log(`   🏷️  Tags: ${inventoryShortcode.SH_Tags}`);
          console.log(`   🏠 Local: ${inventoryIsLocal ? 'OUI' : 'NON'}`);
          
          if (inventoryIsLocal) isLocal = true;
        } else {
          console.log(`   ⚠️  Inventory ${tactique.TC_Inventory} non trouvé dans le cache`);
        }
      }
      
      if (isLocal) {
        localBudget += budget;
        localTactiquesCount++;
        console.log(`   ✅ TACTIQUE LOCALE - Budget ajouté: ${budget}`);
      } else {
        console.log(`   ❌ Tactique non locale`);
      }
    });
    
    const percentage = (localBudget / totalDigitalBudget) * 100;
    
    console.log(`\n📊 [RÉSULTAT FINAL]`);
    console.log(`   🏠 Tactiques locales: ${localTactiquesCount}/${digitalTactiques.length}`);
    console.log(`   💰 Budget local: ${localBudget}`);
    console.log(`   💰 Budget digital total: ${totalDigitalBudget}`);
    console.log(`   📈 Pourcentage: ${percentage.toFixed(2)}%`);
    
    return percentage;
  }, []);

  const calculateNumeriquePercentage = useCallback(async (tactiques: Tactique[]): Promise<number> => {
    console.log('\n💻 [INDICATEUR NUMÉRIQUE] Début calcul...');
    
    const digitalMediaTypes = ['DIG', 'SEA', 'SH_DNEQYAVD', 'SH_R3Z3VC6B'];
    
    // Calculer le budget total de la campagne
    const totalBudget = tactiques.reduce((sum, t) => 
      sum + (t.TC_Client_Budget_RefCurrency || 0), 0
    );
    
    console.log(`💰 [BUDGET TOTAL] ${totalBudget}`);
    
    if (totalBudget === 0) {
      console.log('⚠️ [NUMÉRIQUE] Budget total = 0, retour 0%');
      return 0;
    }
    
    // Calculer le budget digital
    const digitalBudget = tactiques
      .filter(t => t.TC_Media_Type && digitalMediaTypes.includes(t.TC_Media_Type))
      .reduce((sum, t) => sum + (t.TC_Client_Budget_RefCurrency || 0), 0);
    
    const percentage = (digitalBudget / totalBudget) * 100;
    
    console.log(`💻 [NUMÉRIQUE] Budget digital: ${digitalBudget} (${percentage.toFixed(2)}%)`);
    
    return percentage;
  }, []);

  // Configuration des indicateurs
  const indicatorConfigs: IndicatorConfig[] = [
    {
      key: 'Local_1',
      nameKey: 'budgetIndicators.mediaLocaux.name',
      descriptionKey: 'budgetIndicators.mediaLocaux.description',
      calculate: calculateMediaLocauxPercentage,
      threshold1Key: 'Local_1',
      threshold2Key: 'Local_2',
      status: 'active'
    },
    {
      key: 'Num_1',
      nameKey: 'budgetIndicators.numerique.name',
      descriptionKey: 'budgetIndicators.numerique.description', 
      calculate: calculateNumeriquePercentage,
      threshold1Key: 'Num_1',
      threshold2Key: 'Num_2',
      status: 'active'
    },
    {
      key: 'Labs_1',
      nameKey: 'budgetIndicators.labs.name',
      descriptionKey: 'budgetIndicators.labs.description',
      calculate: async () => 0,
      threshold1Key: 'Labs_1',
      threshold2Key: 'Labs_2',
      status: 'coming-soon'
    },
    {
      key: 'Complex_1',
      nameKey: 'budgetIndicators.complexite.name',
      descriptionKey: 'budgetIndicators.complexite.description',
      calculate: async () => 0,
      threshold1Key: 'Complex_1',
      threshold2Key: 'Complex_2',
      status: 'coming-soon'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800">
              {t('budgetIndicators.title')}
            </h4>
          </div>
          <div className="p-4 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block rounded-full h-6 w-6 border-b-2 border-indigo-600"
            />
            <p className="text-sm text-gray-500 mt-2">
              {t('budgetIndicators.loading')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="border border-red-200 rounded-lg">
          <div className="p-3 bg-red-50 border-b border-red-200">
            <h4 className="text-sm font-semibold text-red-800">
              {t('budgetIndicators.title')}
            </h4>
          </div>
          <div className="p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={loadIndicators}
              className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors"
            >
              {t('budgetIndicators.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-4"
    >
      <div className="border border-gray-200 rounded-lg">

        <div className="p-4 space-y-6">
          {indicatorConfigs.map((config, index) => {
            const threshold1 = indicators?.[config.threshold1Key] ?? null;
            const threshold2 = indicators?.[config.threshold2Key] ?? null;
            
            return (
              <IndicatorItem
                key={config.key}
                config={config}
                allCampaignTactiques={allCampaignTactiques}
                threshold1={threshold1}
                threshold2={threshold2}
                showDescription={showDescriptions[config.key] || false}
                onToggleDescription={() => toggleDescription(config.key)}
                t={t}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default BudgetIndicatorsView;