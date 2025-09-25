// Fichier: app/components/Tactiques/BudgetIndicatorsView.tsx
// Chemin: app/components/Tactiques/BudgetIndicatorsView.tsx

/**
 * Composant d'affichage des indicateurs de performance budgétaire.
 * Affiche 4 indicateurs visuels avec calculs métier spécifiques :
 * - Média Locaux : % investissements digitaux sur médias canadiens
 * - Numérique : % investissements en digital
 * - Labs : À venir
 * - Complexité : À venir
 * 
 * Chaque indicateur utilise des seuils dynamiques récupérés depuis les paramètres client
 * et affiche une barre colorée (rouge/jaune/vert) avec un triangle indicateur.
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionMarkCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Campaign } from '../../types/campaign';
import { Section, Tactique } from '../../types/tactiques';
import { getClientIndicators, ClientIndicators } from '../../lib/clientService';
import { useClient } from '../../contexts/ClientContext';
import { useTranslation } from '../../contexts/LanguageContext';

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

interface Shortcode {
  id: string;
  SH_Tags?: string;
  SH_Display_Name_FR?: string;
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
      <div className="relative w-full h-3 bg-gray-100  overflow-hidden">
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
  const [shortcodesCache, setShortcodesCache] = useState<{ [key: string]: Shortcode }>({});

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

  // Récupérer les shortcodes depuis Firebase
  const getShortcodes = useCallback(async (shortcodeIds: string[]): Promise<{ [key: string]: Shortcode }> => {
    if (!selectedClient?.clientId || shortcodeIds.length === 0) return {};
    
    // Vérifier le cache
    const uncachedIds = shortcodeIds.filter(id => !shortcodesCache[id]);
    if (uncachedIds.length === 0) {
      return Object.fromEntries(shortcodeIds.map(id => [id, shortcodesCache[id]]));
    }

    try {
      console.log(`FIREBASE: LECTURE - Fichier: BudgetIndicatorsView.tsx - Fonction: getShortcodes - Path: shortcodes`);
      const shortcodesRef = collection(db, 'shortcodes');
      const q = query(shortcodesRef, where('__name__', 'in', uncachedIds));
      const snapshot = await getDocs(q);
      
      const newShortcodes: { [key: string]: Shortcode } = {};
      snapshot.docs.forEach(doc => {
        newShortcodes[doc.id] = {
          id: doc.id,
          SH_Tags: doc.data().SH_Tags || '',
          SH_Display_Name_FR: doc.data().SH_Display_Name_FR || ''
        };
      });

      // Mettre à jour le cache
      setShortcodesCache(prev => ({ ...prev, ...newShortcodes }));
      
      // Retourner tous les shortcodes demandés (cachés + nouveaux)
      const result: { [key: string]: Shortcode } = {};
      shortcodeIds.forEach(id => {
        if (shortcodesCache[id]) {
          result[id] = shortcodesCache[id];
        } else if (newShortcodes[id]) {
          result[id] = newShortcodes[id];
        }
      });
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la récupération des shortcodes:', error);
      return {};
    }
  }, [selectedClient?.clientId, shortcodesCache]);

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

  // Calculs des indicateurs
  const calculateMediaLocauxPercentage = useCallback(async (tactiques: Tactique[]): Promise<number> => {
    const digitalMediaTypes = ['DIG', 'SEA', 'SH_DNEQYAVD', 'SH_R3Z3VC6B'];
    
    // Filtrer les tactiques digitales
    const digitalTactiques = tactiques.filter(t => 
      t.TC_Media_Type && digitalMediaTypes.includes(t.TC_Media_Type)
    );
    
    // Calculer le budget digital total
    const totalDigitalBudget = digitalTactiques.reduce((sum, t) => 
      sum + (t.TC_Client_Budget_RefCurrency || 0), 0
    );
    
    if (totalDigitalBudget === 0) return 0;
    
    // Récupérer tous les shortcodes nécessaires
    const shortcodeIds = new Set<string>();
    digitalTactiques.forEach(t => {
      if (t.TC_Publisher) shortcodeIds.add(t.TC_Publisher);
      if (t.TC_Inventory) shortcodeIds.add(t.TC_Inventory);
    });
    
    const shortcodes = await getShortcodes(Array.from(shortcodeIds));
    
    // Filtrer les tactiques locales (shortcode contient "LMI_Local" dans SH_Tags)
    const localTactiques = digitalTactiques.filter(t => {
      const publisherShortcode = t.TC_Publisher ? shortcodes[t.TC_Publisher] : null;
      const inventoryShortcode = t.TC_Inventory ? shortcodes[t.TC_Inventory] : null;
      
      const publisherIsLocal = publisherShortcode?.SH_Tags?.includes('LMI_Local') || false;
      const inventoryIsLocal = inventoryShortcode?.SH_Tags?.includes('LMI_Local') || false;
      
      return publisherIsLocal || inventoryIsLocal;
    });
    
    // Calculer le budget local
    const localBudget = localTactiques.reduce((sum, t) => 
      sum + (t.TC_Client_Budget_RefCurrency || 0), 0
    );
    
    return (localBudget / totalDigitalBudget) * 100;
  }, [getShortcodes]);

  const calculateNumeriquePercentage = useCallback(async (tactiques: Tactique[]): Promise<number> => {
    const digitalMediaTypes = ['DIG', 'SEA', 'SH_DNEQYAVD', 'SH_R3Z3VC6B'];
    
    // Calculer le budget total de la campagne
    const totalBudget = tactiques.reduce((sum, t) => 
      sum + (t.TC_Client_Budget_RefCurrency || 0), 0
    );
    
    if (totalBudget === 0) return 0;
    
    // Calculer le budget digital
    const digitalBudget = tactiques
      .filter(t => t.TC_Media_Type && digitalMediaTypes.includes(t.TC_Media_Type))
      .reduce((sum, t) => sum + (t.TC_Client_Budget_RefCurrency || 0), 0);
    
    return (digitalBudget / totalBudget) * 100;
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
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center">
            <ChartBarIcon className="h-4 w-4 mr-2" />
            {t('budgetIndicators.title')}
          </h4>
        </div>
        
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