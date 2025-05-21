'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { getPartnersList } from '../lib/listService';
import { updatePartner } from '../lib/shortcodeService';

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

interface PartnerContextType {
  partners: Partner[];
  filteredPartners: Partner[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeTypes: {[key: string]: boolean};
  toggleType: (type: string) => void;
  selectedPartner: Partner | null;
  setSelectedPartner: (partner: Partner | null) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  updateSelectedPartner: (updatedData: Partial<Partner>) => Promise<void>;
  refreshPartners: () => Promise<void>;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export const usePartners = () => {
  const context = useContext(PartnerContext);
  if (context === undefined) {
    throw new Error('usePartners must be used within a PartnerProvider');
  }
  return context;
};

export const PartnerProvider = ({ children }: { children: React.ReactNode }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypes, setActiveTypes] = useState<{[key: string]: boolean}>({});
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Récupération des partenaires
  const fetchPartners = async () => {
    try {
      setIsLoading(true);
      const partnersData = await getPartnersList();
      
      // Trier les partenaires par ordre alphabétique du nom d'affichage
      const sortedPartners = [...partnersData].sort((a, b) => 
        a.SH_Display_Name_FR.localeCompare(b.SH_Display_Name_FR, 'fr', { sensitivity: 'base' })
      );
      
      setPartners(sortedPartners);
      setFilteredPartners(sortedPartners);

      // Extraire les types uniques
      const uniqueTypes: {[key: string]: boolean} = {};
      sortedPartners.forEach(partner => {
        if (partner.SH_Type) {
          uniqueTypes[partner.SH_Type] = false; // Tous désactivés par défaut
        }
      });
      setActiveTypes(uniqueTypes);

      // Si un partenaire était sélectionné, mettre à jour ses données
      if (selectedPartner) {
        const updatedSelectedPartner = sortedPartners.find(p => p.id === selectedPartner.id);
        if (updatedSelectedPartner) {
          setSelectedPartner(updatedSelectedPartner);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des partenaires:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialisation des partenaires
  useEffect(() => {
    fetchPartners();
  }, []);

  // Fonction pour rafraîchir la liste des partenaires
  const refreshPartners = async () => {
    await fetchPartners();
  };

  // Filtrage des partenaires amélioré pour chercher dans tous les champs pertinents
  useEffect(() => {
    const activeTypesList = Object.keys(activeTypes).filter(type => activeTypes[type]);
    const filtered = partners.filter(partner => {
      // Recherche améliorée dans plusieurs champs
      const searchFields = [
        partner.id,
        partner.SH_Code,
        partner.SH_Display_Name_FR,
        partner.SH_Display_Name_EN,
        partner.SH_Default_UTM
      ].filter(Boolean).map(field => field?.toLowerCase());
      
      const matchesSearch = searchTerm === '' || 
                          searchFields.some(field => field?.includes(searchTerm.toLowerCase()));
      
      const matchesType = activeTypesList.length === 0 || 
                         (partner.SH_Type && activeTypesList.includes(partner.SH_Type));
      
      return matchesSearch && matchesType;
    });
    
    setFilteredPartners(filtered);
  }, [partners, searchTerm, activeTypes]);

  // Nouvelle implémentation: sélectionner un seul type à la fois
  const toggleType = (type: string) => {
    // Si le type est déjà actif, on désactive tous les types
    if (activeTypes[type]) {
      const resetTypes = {...activeTypes};
      Object.keys(resetTypes).forEach(key => {
        resetTypes[key] = false;
      });
      setActiveTypes(resetTypes);
    } else {
      // Sinon, on désactive tous les types et on active uniquement celui-ci
      const newActiveTypes = {...activeTypes};
      Object.keys(newActiveTypes).forEach(key => {
        newActiveTypes[key] = key === type;
      });
      setActiveTypes(newActiveTypes);
    }
  };

  // Fonction pour mettre à jour le partenaire sélectionné
  const updateSelectedPartner = async (updatedData: Partial<Partner>) => {
    if (!selectedPartner) return;
    
    try {
      await updatePartner(selectedPartner.id, updatedData);
      
      // Mettre à jour l'état local avec les nouvelles données
      const updatedPartner = { ...selectedPartner, ...updatedData };
      setSelectedPartner(updatedPartner);
      
      // Mettre à jour la liste des partenaires
      await refreshPartners();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du partenaire:', error);
      throw error;
    }
  };

  const value = {
    partners,
    filteredPartners,
    searchTerm,
    setSearchTerm,
    activeTypes,
    toggleType,
    selectedPartner,
    setSelectedPartner,
    isDrawerOpen,
    setIsDrawerOpen,
    isLoading,
    updateSelectedPartner,
    refreshPartners
  };

  return (
    <PartnerContext.Provider value={value}>
      {children}
    </PartnerContext.Provider>
  );
};