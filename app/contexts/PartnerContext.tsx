'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { getPartnersList } from '../lib/listService';

interface Partner {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
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
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setIsLoading(true);
        const partnersData = await getPartnersList();
        setPartners(partnersData);
        setFilteredPartners(partnersData);

        // Extraire les types uniques
        const uniqueTypes: {[key: string]: boolean} = {};
        partnersData.forEach(partner => {
          if (partner.SH_Type) {
            uniqueTypes[partner.SH_Type] = true;
          }
        });
        setActiveTypes(uniqueTypes);
      } catch (error) {
        console.error('Erreur lors de la récupération des partenaires:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartners();
  }, []);

  // Filtrage des partenaires
  useEffect(() => {
    const activeTypesList = Object.keys(activeTypes).filter(type => activeTypes[type]);
    const filtered = partners.filter(partner => {
      const matchesSearch = partner.SH_Display_Name_FR.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          partner.SH_Code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = activeTypesList.length === 0 || 
                         (partner.SH_Type && activeTypesList.includes(partner.SH_Type));
      
      return matchesSearch && matchesType;
    });
    
    setFilteredPartners(filtered);
  }, [partners, searchTerm, activeTypes]);

  const toggleType = (type: string) => {
    setActiveTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
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
    isLoading
  };

  return (
    <PartnerContext.Provider value={value}>
      {children}
    </PartnerContext.Provider>
  );
};