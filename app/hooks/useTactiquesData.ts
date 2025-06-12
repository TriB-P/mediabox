// app/hooks/useTactiquesData.ts

import { useState, useEffect } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { Section, Tactique, Onglet, Placement, Creatif } from '../types/tactiques';
import {
  getOnglets,
  getSections,
  getTactiques,
  addSection,
  updateSection,
  deleteSection,
  addTactique,
  updateTactique,
  deleteTactique
} from '../lib/tactiqueService';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SectionModalState {
  isOpen: boolean;
  section: Section | null;
  mode: 'create' | 'edit';
}

interface UseTactiquesDataReturn {
  // États
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  
  // Données
  onglets: Onglet[];
  selectedOnglet: Onglet | null;
  sections: Array<Section & { isExpanded: boolean }>;
  tactiques: { [sectionId: string]: Tactique[] };
  
  // Modal de section
  sectionModal: SectionModalState;
  openSectionModal: () => void;
  closeSectionModal: () => void;
  handleSaveSection: (sectionData: { SECTION_Name: string; SECTION_Color: string }) => Promise<void>;
  
  // Actions pour sections
  handleAddSection: () => void;
  handleEditSection: (sectionId: string) => void;
  handleDeleteSection: (sectionId: string) => Promise<void>;
  handleSectionExpand: (sectionId: string) => void;
  
  // Actions pour tactiques
  handleCreateTactique: (sectionId: string) => Promise<Tactique>;
  handleUpdateTactique: (sectionId: string, tactiqueId: string, updates: Partial<Tactique>) => Promise<void>;
  handleDeleteTactique: (sectionId: string, tactiqueId: string) => Promise<void>;
  
  // Actions pour placements (temporaires)
  handleCreatePlacement: (tactiqueId: string) => Promise<Placement>;
  handleUpdatePlacement: (placementId: string, data: Partial<Placement>) => Promise<void>;
  handleDeletePlacement: (placementId: string) => Promise<void>;
  
  // Actions pour créatifs (temporaires)
  handleCreateCreatif: (placementId: string) => Promise<Creatif>;
  handleUpdateCreatif: (creatifId: string, data: Partial<Creatif>) => Promise<void>;
  handleDeleteCreatif: (creatifId: string) => Promise<void>;
  
  // Actions pour onglets
  handleAddOnglet: () => Promise<void>;
  handleRenameOnglet: (ongletId: string, newName: string) => Promise<void>;
  handleDeleteOnglet: (ongletId: string) => Promise<void>;
  handleSelectOnglet: (onglet: Onglet) => void;
}

export function useTactiquesData(
  selectedCampaign: any,
  selectedVersion: any
): UseTactiquesDataReturn {
  const { selectedClient } = useClient();
  const { selectedOngletId, setSelectedOngletId } = useSelection();
  
  // États
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onglets, setOnglets] = useState<Onglet[]>([]);
  const [selectedOnglet, setSelectedOnglet] = useState<Onglet | null>(null);
  const [sections, setSections] = useState<Array<Section & { isExpanded: boolean }>>([]);
  const [tactiques, setTactiques] = useState<{ [sectionId: string]: Tactique[] }>({});

  // État pour le modal de section
  const [sectionModal, setSectionModal] = useState<SectionModalState>({
    isOpen: false,
    section: null,
    mode: 'create'
  });

  // Charger les onglets lorsqu'une version est sélectionnée
  useEffect(() => {
    async function loadOnglets() {
      if (!selectedClient || !selectedCampaign || !selectedVersion) {
        setOnglets([]);
        setSelectedOnglet(null);
        setSections([]);
        setTactiques({});
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const ongletsData = await getOnglets(
          selectedClient.clientId,
          selectedCampaign.id,
          selectedVersion.id
        );
        
        // Créer un onglet par défaut si aucun n'existe
        if (ongletsData.length === 0) {
          const defaultOngletData = {
            ONGLET_Name: 'Général',
            ONGLET_Order: 0
          };
          
          try {
            const ongletRef = await addDoc(
              collection(
                db,
                'clients',
                selectedClient.clientId,
                'campaigns',
                selectedCampaign.id,
                'versions',
                selectedVersion.id,
                'onglets'
              ),
              {
                ...defaultOngletData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            );
            
            ongletsData.push({
              id: ongletRef.id,
              ...defaultOngletData
            });
          } catch (error) {
            console.error('Erreur lors de la création de l\'onglet par défaut:', error);
          }
        }
        
        setOnglets(ongletsData);
        
        // Restaurer l'onglet sélectionné
        let ongletToSelect: Onglet | null = null;
        
        if (selectedOngletId) {
          const savedOnglet = ongletsData.find(o => o.id === selectedOngletId);
          if (savedOnglet) {
            ongletToSelect = savedOnglet;
          } else {
            setSelectedOngletId(null);
          }
        }
        
        if (!ongletToSelect && ongletsData.length > 0) {
          ongletToSelect = ongletsData[0];
        }
        
        if (ongletToSelect) {
          setSelectedOnglet(ongletToSelect);
          setSelectedOngletId(ongletToSelect.id);
        } else {
          setSelectedOnglet(null);
          setSections([]);
          setTactiques({});
        }
      } catch (err) {
        console.error('Erreur lors du chargement des onglets:', err);
        setError('Erreur lors du chargement des onglets');
      } finally {
        setLoading(false);
      }
    }
    
    loadOnglets();
  }, [selectedClient, selectedCampaign, selectedVersion, selectedOngletId]);

  // Charger les sections et tactiques lorsqu'un onglet est sélectionné
  useEffect(() => {
    async function loadSectionsAndTactiques() {
      if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedOnglet) return;
      
      try {
        setLoading(true);
        
        const sectionsData = await getSections(
          selectedClient.clientId,
          selectedCampaign.id,
          selectedVersion.id,
          selectedOnglet.id
        );
        
        const sectionsWithExpanded = sectionsData.map(section => ({
          ...section,
          isExpanded: true,
        }));
        
        setSections(sectionsWithExpanded);
        
        const tactiquesObj: { [sectionId: string]: Tactique[] } = {};
        
        for (const section of sectionsData) {
          const sectionTactiques = await getTactiques(
            selectedClient.clientId,
            selectedCampaign.id,
            selectedVersion.id,
            selectedOnglet.id,
            section.id
          );
          
          tactiquesObj[section.id] = sectionTactiques;
        }
        
        setTactiques(tactiquesObj);
        
        // Calculer les budgets des sections
        const sectionsWithBudget = sectionsWithExpanded.map(section => {
          const sectionTactiques = tactiquesObj[section.id] || [];
          const totalBudget = sectionTactiques.reduce(
            (sum, tactique) => sum + tactique.TC_Budget,
            0
          );
          
          return {
            ...section,
            SECTION_Budget: totalBudget,
          };
        });
        
        setSections(sectionsWithBudget);
      } catch (err) {
        console.error('Erreur lors du chargement des sections et tactiques:', err);
        setError('Erreur lors du chargement des sections et tactiques');
      } finally {
        setLoading(false);
      }
    }
    
    loadSectionsAndTactiques();
  }, [selectedClient, selectedCampaign, selectedVersion, selectedOnglet]);

  // Fonctions pour le modal de section
  const openSectionModal = () => {
    setSectionModal({
      isOpen: true,
      section: null,
      mode: 'create'
    });
  };

  const closeSectionModal = () => {
    setSectionModal({
      isOpen: false,
      section: null,
      mode: 'create'
    });
  };

  const handleSaveSection = async (sectionData: { SECTION_Name: string; SECTION_Color: string }) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedOnglet) return;
    
    try {
      if (sectionModal.mode === 'create') {
        // Créer une nouvelle section
        const nextOrder = sections.length;
        
        const newSectionData = {
          SECTION_Name: sectionData.SECTION_Name,
          SECTION_Order: nextOrder,
          SECTION_Color: sectionData.SECTION_Color,
          SECTION_Budget: 0
        };
        
        const sectionId = await addSection(
          selectedClient.clientId,
          selectedCampaign.id,
          selectedVersion.id,
          selectedOnglet.id,
          newSectionData
        );
        
        setSections(prev => [
          ...prev,
          {
            id: sectionId,
            ...newSectionData,
            isExpanded: true
          }
        ]);
        
        setTactiques(prev => ({
          ...prev,
          [sectionId]: []
        }));
      } else if (sectionModal.mode === 'edit' && sectionModal.section) {
        // Modifier une section existante
        const updates = {
          SECTION_Name: sectionData.SECTION_Name,
          SECTION_Color: sectionData.SECTION_Color
        };
        
        await updateSection(
          selectedClient.clientId,
          selectedCampaign.id,
          selectedVersion.id,
          selectedOnglet.id,
          sectionModal.section.id,
          updates
        );
        
        setSections(prev => prev.map(section => 
          section.id === sectionModal.section!.id ? { ...section, ...updates } : section
        ));
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la section:', err);
      setError('Erreur lors de la sauvegarde de la section');
    }
  };

  // Gestionnaires pour les sections
  const handleAddSection = () => {
    openSectionModal();
  };
  
  const handleEditSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    setSectionModal({
      isOpen: true,
      section,
      mode: 'edit'
    });
  };
  
  const handleDeleteSection = async (sectionId: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedOnglet) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette section et toutes ses tactiques ?')) {
      return;
    }
    
    try {
      await deleteSection(
        selectedClient.clientId,
        selectedCampaign.id,
        selectedVersion.id,
        selectedOnglet.id,
        sectionId
      );
      
      setSections(prev => prev.filter(section => section.id !== sectionId));
      
      setTactiques(prev => {
        const newTactiques = { ...prev };
        delete newTactiques[sectionId];
        return newTactiques;
      });
    } catch (err) {
      console.error('Erreur lors de la suppression de la section:', err);
      setError('Erreur lors de la suppression de la section');
    }
  };

  const handleSectionExpand = (sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, isExpanded: !section.isExpanded }
          : section
      )
    );
  };

  // Gestionnaires pour les tactiques
  const handleCreateTactique = async (sectionId: string): Promise<Tactique> => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedOnglet) {
      throw new Error('Contexte manquant pour créer une tactique');
    }
    
    try {
      const sectionTactiques = tactiques[sectionId] || [];
      const nextOrder = sectionTactiques.length;
      
      const newTactiqueData = {
        TC_Label: 'Nouvelle tactique',
        TC_Budget: 0,
        TC_Order: nextOrder,
        TC_SectionId: sectionId,
        TC_Status: 'Planned' as const,
        TC_StartDate: selectedCampaign.startDate,
        TC_EndDate: selectedCampaign.endDate
      };
      
      const tactiqueId = await addTactique(
        selectedClient.clientId,
        selectedCampaign.id,
        selectedVersion.id,
        selectedOnglet.id,
        sectionId,
        newTactiqueData
      );
      
      const newTactique = {
        id: tactiqueId,
        ...newTactiqueData
      };
      
      setTactiques(prev => ({
        ...prev,
        [sectionId]: [
          ...(prev[sectionId] || []),
          newTactique
        ]
      }));
      
      return newTactique;
    } catch (err) {
      console.error('Erreur lors de la création de la tactique:', err);
      throw err;
    }
  };

  const handleUpdateTactique = async (sectionId: string, tactiqueId: string, updates: Partial<Tactique>) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedOnglet) return;
    
    try {
      await updateTactique(
        selectedClient.clientId,
        selectedCampaign.id,
        selectedVersion.id,
        selectedOnglet.id,
        sectionId,
        tactiqueId,
        updates
      );
      
      setTactiques(prev => {
        const sectionTactiques = [...(prev[sectionId] || [])];
        const updatedTactiques = sectionTactiques.map(tactique => 
          tactique.id === tactiqueId ? { ...tactique, ...updates } : tactique
        );
        
        return {
          ...prev,
          [sectionId]: updatedTactiques
        };
      });
      
      // Recalculer le budget de la section si nécessaire
      if (updates.TC_Budget !== undefined) {
        const updatedSectionTactiques = tactiques[sectionId].map(tactique => 
          tactique.id === tactiqueId 
            ? { ...tactique, TC_Budget: updates.TC_Budget || 0 } 
            : tactique
        );
        
        const newSectionBudget = updatedSectionTactiques.reduce(
          (sum, tactique) => sum + tactique.TC_Budget,
          0
        );
        
        setSections(prev => prev.map(section => 
          section.id === sectionId 
            ? { ...section, SECTION_Budget: newSectionBudget } 
            : section
        ));
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la tactique:', err);
      setError('Erreur lors de la mise à jour de la tactique');
    }
  };
  
  const handleDeleteTactique = async (sectionId: string, tactiqueId: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedOnglet) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tactique ?')) {
      return;
    }
    
    try {
      const tactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
      if (!tactique) return;
      
      await deleteTactique(
        selectedClient.clientId,
        selectedCampaign.id,
        selectedVersion.id,
        selectedOnglet.id,
        sectionId,
        tactiqueId
      );
      
      setTactiques(prev => {
        const sectionTactiques = [...(prev[sectionId] || [])];
        const updatedTactiques = sectionTactiques.filter(t => t.id !== tactiqueId);
        
        return {
          ...prev,
          [sectionId]: updatedTactiques
        };
      });
      
      setSections(prev => {
        const section = prev.find(s => s.id === sectionId);
        if (!section) return prev;
        
        const newBudget = (section.SECTION_Budget || 0) - tactique.TC_Budget;
        
        return prev.map(s => 
          s.id === sectionId ? { ...s, SECTION_Budget: newBudget } : s
        );
      });
    } catch (err) {
      console.error('Erreur lors de la suppression de la tactique:', err);
      setError('Erreur lors de la suppression de la tactique');
    }
  };

  // Gestionnaires temporaires pour placements et créatifs
  const handleCreatePlacement = async (tactiqueId: string): Promise<Placement> => {
    console.log('Création de placement pour tactique:', tactiqueId);
    return {
      id: `temp-placement-${Date.now()}`,
      PL_Label: 'Nouveau placement',
      PL_Budget: 0,
      PL_Order: 0,
      PL_TactiqueId: tactiqueId
    };
  };

  const handleUpdatePlacement = async (placementId: string, data: Partial<Placement>) => {
    console.log('Mise à jour placement:', placementId, data);
  };

  const handleDeletePlacement = async (placementId: string) => {
    console.log('Suppression placement:', placementId);
  };

  const handleCreateCreatif = async (placementId: string): Promise<Creatif> => {
    console.log('Création de créatif pour placement:', placementId);
    return {
      id: `temp-creatif-${Date.now()}`,
      CR_Label: 'Nouveau créatif',
      CR_Order: 0,
      CR_PlacementId: placementId
    };
  };

  const handleUpdateCreatif = async (creatifId: string, data: Partial<Creatif>) => {
    console.log('Mise à jour créatif:', creatifId, data);
  };

  const handleDeleteCreatif = async (creatifId: string) => {
    console.log('Suppression créatif:', creatifId);
  };

  // Gestionnaires pour les onglets
  const handleAddOnglet = async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    try {
      const nextOrder = onglets.length;
      
      const newOngletData = {
        ONGLET_Name: 'Nouvel onglet',
        ONGLET_Order: nextOrder
      };
      
      const ongletRef = await addDoc(
        collection(
          db,
          'clients',
          selectedClient.clientId,
          'campaigns',
          selectedCampaign.id,
          'versions',
          selectedVersion.id,
          'onglets'
        ),
        {
          ...newOngletData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
        
      const newOnglet = {
        id: ongletRef.id,
        ...newOngletData
      };
      
      setOnglets(prev => [...prev, newOnglet]);
      setSelectedOnglet(newOnglet);
      setSelectedOngletId(newOnglet.id);
    } catch (err) {
      console.error('Erreur lors de l\'ajout d\'un onglet:', err);
      setError('Erreur lors de l\'ajout d\'un onglet');
    }
  };
    
  const handleRenameOnglet = async (ongletId: string, newName: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    try {
      const ongletRef = doc(
        db,
        'clients',
        selectedClient.clientId,
        'campaigns',
        selectedCampaign.id,
        'versions',
        selectedVersion.id,
        'onglets',
        ongletId
      );
      
      await updateDoc(ongletRef, {
        ONGLET_Name: newName,
        updatedAt: new Date().toISOString()
      });
      
      setOnglets(prev => prev.map(onglet => 
        onglet.id === ongletId ? { ...onglet, ONGLET_Name: newName } : onglet
      ));
      
      if (selectedOnglet?.id === ongletId) {
        setSelectedOnglet(prev => prev ? { ...prev, ONGLET_Name: newName } : null);
      }
    } catch (err) {
      console.error('Erreur lors du renommage de l\'onglet:', err);
      setError('Erreur lors du renommage de l\'onglet');
    }
  };
    
  const handleDeleteOnglet = async (ongletId: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    if (onglets.length <= 1) {
      setError('Impossible de supprimer le dernier onglet');
      return;
    }
    
    try {
      const ongletRef = doc(
        db,
        'clients',
        selectedClient.clientId,
        'campaigns',
        selectedCampaign.id,
        'versions',
        selectedVersion.id,
        'onglets',
        ongletId
      );
      
      await deleteDoc(ongletRef);
      
      const updatedOnglets = onglets.filter(onglet => onglet.id !== ongletId);
      setOnglets(updatedOnglets);
      
      if (selectedOnglet?.id === ongletId && updatedOnglets.length > 0) {
        setSelectedOnglet(updatedOnglets[0]);
        setSelectedOngletId(updatedOnglets[0].id);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'onglet:', err);
      setError('Erreur lors de la suppression de l\'onglet');
    }
  };
    
  const handleSelectOnglet = (onglet: Onglet) => {
    setSelectedOnglet(onglet);
    setSelectedOngletId(onglet.id);
  };

  return {
    // États
    loading,
    error,
    setError,
    
    // Données
    onglets,
    selectedOnglet,
    sections,
    tactiques,
    
    // Modal de section
    sectionModal,
    openSectionModal,
    closeSectionModal,
    handleSaveSection,
    
    // Actions pour sections
    handleAddSection,
    handleEditSection,
    handleDeleteSection,
    handleSectionExpand,
    
    // Actions pour tactiques
    handleCreateTactique,
    handleUpdateTactique,
    handleDeleteTactique,
    
    // Actions pour placements
    handleCreatePlacement,
    handleUpdatePlacement,
    handleDeletePlacement,
    
    // Actions pour créatifs
    handleCreateCreatif,
    handleUpdateCreatif,
    handleDeleteCreatif,
    
    // Actions pour onglets
    handleAddOnglet,
    handleRenameOnglet,
    handleDeleteOnglet,
    handleSelectOnglet,
  };
}