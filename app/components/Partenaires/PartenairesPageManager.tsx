// app/components/Partenaires/PartenairesPageManager.tsx

/**
 * Composant principal qui gère tous les partenaires en utilisant le cache localStorage.
 * VERSION 2024 : Utilise le cache localStorage au lieu d'appels Firebase coûteux.
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCachedAllShortcodes, ShortcodeItem } from '../../lib/cacheService';
import { updatePartner } from '../../lib/shortcodeService';
import PartnersTitle from './PartnersTitle';
import PartenairesFilter from './PartenairesFilter';
import PartenairesGrid from './PartenairesGrid';
import DrawerContainer from './DrawerContainer';

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

/**
 * Composant principal qui gère la page des partenaires.
 * Charge les données depuis le cache localStorage et gère tous les états.
 */
export default function PartenairesPageManager() {
  // États pour les données des partenaires
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour le filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypes, setActiveTypes] = useState<{[key: string]: boolean}>({});

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

        // Initialiser les types uniques pour le filtrage
        const uniqueTypes: {[key: string]: boolean} = {};
        partnersData.forEach(partner => {
          if (partner.SH_Type) {
            uniqueTypes[partner.SH_Type] = false;
          }
        });
        setActiveTypes(uniqueTypes);

        console.log(`[CACHE] ✅ ${partnersData.length} partenaires chargés depuis le cache`);

      } catch (err) {
        console.error('[CACHE] ❌ Erreur lors du chargement des partenaires:', err);
        setError('Erreur lors du chargement des partenaires depuis le cache.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPartnersFromCache();
  }, []);

  /**
   * Filtre les partenaires selon le terme de recherche et les types actifs
   */
  const filteredPartners = useMemo(() => {
    const activeTypesList = Object.keys(activeTypes).filter(type => activeTypes[type]);
    
    return partners.filter(partner => {
      // Filtrage par recherche textuelle
      const searchFields = [
        partner.id,
        partner.SH_Code,
        partner.SH_Display_Name_FR,
        partner.SH_Display_Name_EN,
        partner.SH_Default_UTM
      ].filter(Boolean).map(field => field?.toLowerCase());
      
      const matchesSearch = searchTerm === '' || 
                          searchFields.some(field => field?.includes(searchTerm.toLowerCase()));
      
      // Filtrage par type
      const matchesType = activeTypesList.length === 0 || 
                         (partner.SH_Type && activeTypesList.includes(partner.SH_Type));
      
      return matchesSearch && matchesType;
    });
  }, [partners, searchTerm, activeTypes]);

  /**
   * Bascule l'activation d'un type de filtre
   * @param type Le type à basculer
   */
  const handleToggleType = (type: string) => {
    if (activeTypes[type]) {
      // Désactiver ce type
      const resetTypes = {...activeTypes};
      Object.keys(resetTypes).forEach(key => {
        resetTypes[key] = false;
      });
      setActiveTypes(resetTypes);
    } else {
      // Activer seulement ce type
      const newActiveTypes = {...activeTypes};
      Object.keys(newActiveTypes).forEach(key => {
        newActiveTypes[key] = key === type;
      });
      setActiveTypes(newActiveTypes);
    }
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600">⚠️</div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erreur de chargement</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded"
                >
                  Actualiser la page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Titre avec compteur */}
        <div className="mb-6">
          <PartnersTitle 
            partners={partners}
            filteredPartners={filteredPartners}
          />
        </div>

        {/* Filtres */}
        <PartenairesFilter
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          activeTypes={activeTypes}
          onToggleType={handleToggleType}
        />

        {/* Grille des partenaires */}
        <PartenairesGrid
          filteredPartners={filteredPartners}
          isLoading={isLoading}
          onPartnerClick={handlePartnerClick}
        />

        {/* Drawer pour les détails */}
        <DrawerContainer
          selectedPartner={selectedPartner}
          isDrawerOpen={isDrawerOpen}
          onCloseDrawer={handleCloseDrawer}
          onUpdatePartner={handleUpdatePartner}
        />
      </div>
    </div>
  );
}