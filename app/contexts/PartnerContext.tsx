/**
 * Ce fichier définit le contexte `PartnerContext` qui permet de gérer l'état et les logiques
 * liés aux partenaires de l'application. Il inclut des fonctionnalités pour
 * charger, filtrer, rechercher et mettre à jour les partenaires, ainsi que la gestion
 * de l'état du panneau latéral (drawer) d'édition.
 * Il fournit également des fonctions utilitaires pour formater les données des partenaires.
 */
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

interface SelectOption {
  id: string;
  label: string;
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
  
  getPublishersForSelect: () => SelectOption[];
  isPublishersLoading: boolean;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

/**
 * Hook personnalisé pour utiliser le contexte des partenaires.
 * @returns {PartnerContextType} Le contexte des partenaires.
 * @throws {Error} Si le hook est utilisé en dehors d'un `PartnerProvider`.
 */
export const usePartners = () => {
  const context = useContext(PartnerContext);
  if (context === undefined) {
    throw new Error('usePartners must be used within a PartnerProvider');
  }
  return context;
};

/**
 * Fournisseur de contexte pour les partenaires.
 * Gère l'état des partenaires, le filtrage, la recherche et les interactions avec Firebase.
 * @param {Object} props Les propriétés du composant.
 * @param {React.ReactNode} props.children Les composants enfants qui auront accès au contexte.
 * @returns {JSX.Element} Le fournisseur de contexte.
 */
export const PartnerProvider = ({ children }: { children: React.ReactNode }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypes, setActiveTypes] = useState<{[key: string]: boolean}>({});
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishersLoading, setIsPublishersLoading] = useState(true);

  /**
   * Récupère la liste des partenaires depuis Firebase et met à jour l'état.
   * Trie les partenaires par nom d'affichage et initialise les types uniques.
   * @returns {Promise<void>} Une promesse qui se résout une fois les partenaires récupérés.
   */
  const fetchPartners = async () => {
    try {
      setIsLoading(true);
      setIsPublishersLoading(true);
      
      console.log("FIREBASE: LECTURE - Fichier: PartnerProvider.tsx - Fonction: fetchPartners - Path: partners");
      const partnersData = await getPartnersList();
      
      const sortedPartners = [...partnersData].sort((a, b) => 
        a.SH_Display_Name_FR.localeCompare(b.SH_Display_Name_FR, 'fr', { sensitivity: 'base' })
      );
      
      setPartners(sortedPartners);
      setFilteredPartners(sortedPartners);

      const uniqueTypes: {[key: string]: boolean} = {};
      sortedPartners.forEach(partner => {
        if (partner.SH_Type) {
          uniqueTypes[partner.SH_Type] = false;
        }
      });
      setActiveTypes(uniqueTypes);

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
      setIsPublishersLoading(false);
    }
  };

  /**
   * Hook d'effet pour l'initialisation des partenaires lors du montage du composant.
   */
  useEffect(() => {
    fetchPartners();
  }, []);

  /**
   * Rafraîchit la liste des partenaires en appelant `fetchPartners`.
   * @returns {Promise<void>} Une promesse qui se résout une fois la liste rafraîchie.
   */
  const refreshPartners = async () => {
    await fetchPartners();
  };

  /**
   * Formate la liste des partenaires pour être utilisée dans un composant `SelectableSearch`.
   * @returns {SelectOption[]} Une liste d'objets avec `id` et `label`.
   */
  const getPublishersForSelect = (): SelectOption[] => {
    return partners.map(partner => ({
      id: partner.id,
      label: partner.SH_Display_Name_FR
    }));
  };

  /**
   * Hook d'effet pour filtrer les partenaires en fonction du terme de recherche et des types actifs.
   * Le filtrage s'effectue sur plusieurs champs du partenaire.
   */
  useEffect(() => {
    const activeTypesList = Object.keys(activeTypes).filter(type => activeTypes[type]);
    const filtered = partners.filter(partner => {
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

  /**
   * Active ou désactive un type de partenaire.
   * Permet de sélectionner un seul type à la fois ou de désactiver tous les types.
   * @param {string} type Le type de partenaire à basculer.
   */
  const toggleType = (type: string) => {
    if (activeTypes[type]) {
      const resetTypes = {...activeTypes};
      Object.keys(resetTypes).forEach(key => {
        resetTypes[key] = false;
      });
      setActiveTypes(resetTypes);
    } else {
      const newActiveTypes = {...activeTypes};
      Object.keys(newActiveTypes).forEach(key => {
        newActiveTypes[key] = key === type;
      });
      setActiveTypes(newActiveTypes);
    }
  };

  /**
   * Met à jour les données d'un partenaire sélectionné dans Firebase et rafraîchit l'état local.
   * @param {Partial<Partner>} updatedData Les données partielles à mettre à jour pour le partenaire.
   * @returns {Promise<void>} Une promesse qui se résout une fois le partenaire mis à jour.
   * @throws {Error} Si une erreur survient lors de la mise à jour.
   */
  const updateSelectedPartner = async (updatedData: Partial<Partner>) => {
    if (!selectedPartner) return;
    
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: PartnerProvider.tsx - Fonction: updateSelectedPartner - Path: partners/${selectedPartner.id}");
      await updatePartner(selectedPartner.id, updatedData);
      
      const updatedPartner = { ...selectedPartner, ...updatedData };
      setSelectedPartner(updatedPartner);
      
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
    refreshPartners,
    
    getPublishersForSelect,
    isPublishersLoading,
  };

  return (
    <PartnerContext.Provider value={value}>
      {children}
    </PartnerContext.Provider>
  );
};