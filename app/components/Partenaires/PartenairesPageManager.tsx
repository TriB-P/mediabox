// app/components/Partenaires/PartenairesPageManager.tsx

/**
 * Composant principal qui gère tous les partenaires en utilisant le cache localStorage.
 * VERSION 2024 : Utilise le cache localStorage au lieu d'appels Firebase coûteux.
 * VERSION 2024.1 : Intègre la traduction des types de partenaires avec recherche bilingue.
 * VERSION 2024.2 : Correction des filtres qui s'activent/désactivent instantanément.
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCachedAllShortcodes, ShortcodeItem } from '../../lib/cacheService';
import { updatePartner } from '../../lib/shortcodeService';
import { createPartnerTypeFilters, matchesPartnerTypeSearch } from '../../lib/partnerTypeService';
import { useTranslation } from '../../contexts/LanguageContext';
import PartnersTitle from './PartnersTitle';
import PartenairesFilter from './PartenairesFilter';
import PartenairesGrid from './PartenairesGrid';
import DrawerContainer from './DrawerContainer';
import { motion, Variants } from 'framer-motion';

interface Partner {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
  SH_Display_Name_EN?: string;
  SH_Default_UTM?: string;
  SH_Logo?: string;
  SH_Type?: string;
  SH_Tags?: string[];
}

/**
 * Convertit un ShortcodeItem du cache en Partner pour les composants
 * @param shortcode L'élément shortcode du cache
 * @returns L'objet Partner formaté
 */
const convertShortcodeToPartner = (shortcode: ShortcodeItem): Partner => ({
  id: shortcode.id,
  SH_Code: shortcode.SH_Code,
  SH_Display_Name_FR: shortcode.SH_Display_Name_FR,
  SH_Display_Name_EN: shortcode.SH_Display_Name_EN,
  SH_Default_UTM: shortcode.SH_Default_UTM,
  SH_Logo: shortcode.SH_Logo,
  SH_Type: shortcode.SH_Type,
  SH_Tags: shortcode.SH_Tags || []
});

const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease },
  },
};

const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: { duration: 0.4, ease },
    },
};

const interactiveVariants: Variants = {
  hover: { scale: 1.05, transition: { duration: 0.2, ease } },
  tap: { scale: 0.95 },
};


/**
 * Composant principal qui gère la page des partenaires.
 * Charge les données depuis le cache localStorage et gère tous les états.
 */
export default function PartenairesPageManager() {
  const { t, language } = useTranslation();
  
  // États pour les données des partenaires
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour le filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypeFilters, setActiveTypeFilters] = useState<{
    [translatedType: string]: { englishType: string; active: boolean }
  }>({});
  
  // Flag pour éviter les conflits lors de l'initialisation
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // États pour le drawer
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  /**
   * Charge tous les partenaires depuis le cache localStorage au montage du composant
   */
  useEffect(() => {
    const loadPartnersFromCache = () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('[CACHE] 🚀 Chargement des partenaires depuis le cache localStorage');
        
        // Récupérer tous les shortcodes depuis le cache
        const allShortcodes = getCachedAllShortcodes();
        
        if (!allShortcodes) {
          console.warn('[CACHE] ⚠️ Aucun shortcode en cache - initialisation du cache requise');
          setError('Aucune donnée en cache. Veuillez actualiser la page pour initialiser le cache.');
          setIsLoading(false);
          return;
        }

        // Convertir les shortcodes en partenaires et trier par nom
        const partnersData = Object.values(allShortcodes)
        .map(convertShortcodeToPartner)
        .filter(partner => partner.SH_Type && partner.SH_Type.trim() !== '')
        .sort((a, b) => 
          a.SH_Display_Name_FR.localeCompare(b.SH_Display_Name_FR, 'fr', { sensitivity: 'base' })
        );

        setPartners(partnersData);

        // Initialiser les filtres avec la langue actuelle
        console.log('🔧 Initialisation des filtres de types pour la langue:', language);
        const typeFilters = createPartnerTypeFilters(partnersData, language);
        setActiveTypeFilters(typeFilters);
        setFiltersInitialized(true);

        console.log(`[CACHE] ✅ ${partnersData.length} partenaires chargés depuis le cache`);

      } catch (err) {
        console.error('[CACHE] ❌ Erreur lors du chargement des partenaires:', err);
        setError('Erreur lors du chargement des partenaires depuis le cache.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPartnersFromCache();
  }, []); // Seulement au montage du composant

  /**
   * Met à jour les traductions des filtres quand la langue change
   * Préserve les états actifs lors du changement de langue
   */
  useEffect(() => {
    if (partners.length > 0 && filtersInitialized) {
      console.log('🌍 Changement de langue - mise à jour des traductions des filtres');
      
      // Sauvegarder les types anglais actuellement actifs
      const activeEnglishTypes = Object.values(activeTypeFilters)
        .filter(filter => filter.active)
        .map(filter => filter.englishType);
      
      console.log('💾 Types anglais actifs préservés:', activeEnglishTypes);
      
      // Créer les nouveaux filtres avec les nouvelles traductions
      const newTypeFilters = createPartnerTypeFilters(partners, language);
      
      // Réappliquer les états actifs préservés
      Object.entries(newTypeFilters).forEach(([translatedType, filterData]) => {
        if (activeEnglishTypes.includes(filterData.englishType)) {
          newTypeFilters[translatedType].active = true;
        }
      });
      
      console.log('🔄 Filtres mis à jour avec états préservés');
      setActiveTypeFilters(newTypeFilters);
    }
  }, [language]); // Seulement quand la langue change

  /**
   * Filtre les partenaires selon le terme de recherche et les types actifs
   */
  const filteredPartners = useMemo(() => {
    const activeEnglishTypes = Object.values(activeTypeFilters)
      .filter(filter => filter.active)
      .map(filter => filter.englishType);
    
    const filtered = partners.filter(partner => {
      // Filtrage par recherche textuelle (bilingue pour les types)
      const searchFields = [
        partner.id,
        partner.SH_Code,
        partner.SH_Display_Name_FR,
        partner.SH_Display_Name_EN,
        partner.SH_Default_UTM
      ].filter(Boolean).map(field => field?.toLowerCase());
      
      const matchesSearch = searchTerm === '' || 
                          searchFields.some(field => field?.includes(searchTerm.toLowerCase())) ||
                          (partner.SH_Type && matchesPartnerTypeSearch(partner.SH_Type, searchTerm, language));
      
      // Filtrage par type - si aucun filtre actif, montrer tous les partenaires
      const matchesType = activeEnglishTypes.length === 0 || 
                         (partner.SH_Type && activeEnglishTypes.includes(partner.SH_Type));
      
      return matchesSearch && matchesType;
    });

    console.log(`📊 Filtrage: ${filtered.length}/${partners.length} partenaires (actifs: ${activeEnglishTypes.length})`);
    return filtered;
  }, [partners, searchTerm, activeTypeFilters, language]);

  /**
   * Bascule l'activation d'un type de filtre
   * Permet la sélection multiple des types
   * @param translatedType Le type traduit à basculer
   */
  const handleToggleType = (translatedType: string) => {
    console.log('🔄 Toggle du type:', translatedType);
    
    setActiveTypeFilters(prev => {
      const newFilters = { ...prev };
      
      if (newFilters[translatedType]) {
        // Simplement basculer l'état du type cliqué
        newFilters[translatedType] = {
          ...newFilters[translatedType],
          active: !newFilters[translatedType].active
        };
        
        const newState = newFilters[translatedType].active ? 'activé' : 'désactivé';
        console.log(`✅ Type ${translatedType} ${newState}`);
      }
      
      return newFilters;
    });
  };

  /**
   * Ouvre le drawer avec un partenaire spécifique
   * @param partner Le partenaire à afficher
   */
  const handlePartnerClick = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsDrawerOpen(true);
  };

  /**
   * Ferme le drawer et réinitialise le partenaire sélectionné
   */
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedPartner(null);
  };

  /**
   * Met à jour un partenaire via Firebase et rafraîchit le cache local
   * @param partnerId L'ID du partenaire à mettre à jour
   * @param updatedData Les données mises à jour
   */
  const handleUpdatePartner = async (partnerId: string, updatedData: Partial<Partner>) => {
    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: PartenairesPageManager.tsx - Fonction: handleUpdatePartner - Path: partners/${partnerId}`);
      
      // Mettre à jour dans Firebase
      await updatePartner(partnerId, updatedData);
      
      // Mettre à jour dans l'état local
      setPartners(prevPartners => 
        prevPartners.map(partner => 
          partner.id === partnerId 
            ? { ...partner, ...updatedData }
            : partner
        )
      );

      // Mettre à jour le partenaire sélectionné si c'est celui-ci
      if (selectedPartner && selectedPartner.id === partnerId) {
        setSelectedPartner(prev => prev ? { ...prev, ...updatedData } : null);
      }

      console.log(`[CACHE] ✅ Partenaire ${partnerId} mis à jour localement`);

    } catch (error) {
      console.error('[CACHE] ❌ Erreur lors de la mise à jour du partenaire:', error);
      throw error;
    }
  };

  // Affichage d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <motion.div 
            className="max-w-7xl mx-auto"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600">⚠️</div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erreur de chargement</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <motion.button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded"
                  variants={interactiveVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Actualiser la page
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease }}
    >
      <motion.div 
        className="max-w-7xl mx-auto p-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Titre avec compteur */}
        <motion.div className="mb-6" variants={itemVariants}>
          <PartnersTitle 
            partners={partners}
            filteredPartners={filteredPartners}
          />
        </motion.div>

        {/* Filtres */}
        <motion.div variants={itemVariants}>
          <PartenairesFilter
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            activeTypeFilters={activeTypeFilters}
            onToggleType={handleToggleType}
          />
        </motion.div>

        {/* Grille des partenaires */}
        <motion.div variants={itemVariants}>
          <PartenairesGrid
            filteredPartners={filteredPartners}
            isLoading={isLoading}
            onPartnerClick={handlePartnerClick}
          />
        </motion.div>

        {/* Drawer pour les détails */}
        <DrawerContainer
          selectedPartner={selectedPartner}
          isDrawerOpen={isDrawerOpen}
          onCloseDrawer={handleCloseDrawer}
          onUpdatePartner={handleUpdatePartner}
        />
      </motion.div>
    </motion.div>
  );
}