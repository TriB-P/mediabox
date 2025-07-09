// app/hooks/useTactiquesData.ts - AVEC INTÉGRATION CRÉATIFS COMPLÈTE

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

// 🔥 Import du service de placement
import {
  getPlacementsForTactique,
  createPlacement,
  updatePlacement,
  deletePlacement,
} from '../lib/placementService';

// 🔥 NOUVEAU : Import du service de créatifs
import {
  getCreatifsForPlacement,
  createCreatif,
  updateCreatif,
  deleteCreatif,
} from '../lib/creatifService';

import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SectionModalState {
  isOpen: boolean;
  section: Section | null;
  mode: 'create' | 'edit';
}

interface PlacementsByTactique {
  [tactiqueId: string]: Placement[];
}

// 🔥 NOUVEAU : État pour stocker les créatifs par placement
interface CreatifsByPlacement {
  [placementId: string]: Creatif[];
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
  placements: PlacementsByTactique;
  creatifs: CreatifsByPlacement; // 🔥 NOUVEAU : Export des créatifs
  
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
  
  // Actions pour placements
  handleCreatePlacement: (tactiqueId: string) => Promise<Placement>;
  handleUpdatePlacement: (placementId: string, data: Partial<Placement>) => Promise<void>;
  handleDeletePlacement: (placementId: string) => Promise<void>;
  
  // 🔥 NOUVELLES ACTIONS POUR CRÉATIFS (vraies)
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
  
  // États existants
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onglets, setOnglets] = useState<Onglet[]>([]);
  const [selectedOnglet, setSelectedOnglet] = useState<Onglet | null>(null);
  const [sections, setSections] = useState<Array<Section & { isExpanded: boolean }>>([]);
  const [tactiques, setTactiques] = useState<{ [sectionId: string]: Tactique[] }>({});
  const [placements, setPlacements] = useState<PlacementsByTactique>({});

  // 🔥 NOUVEAU : État pour les créatifs
  const [creatifs, setCreatifs] = useState<CreatifsByPlacement>({});

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
        setPlacements({});
        setCreatifs({}); // 🔥 NOUVEAU : Reset des créatifs
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
          setPlacements({});
          setCreatifs({}); // 🔥 NOUVEAU
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

  // 🔥 MODIFIÉ : Charger les sections, tactiques, placements ET créatifs
  useEffect(() => {
    async function loadSectionsTactiquesPlacementsCreatifs() {
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
        const placementsObj: PlacementsByTactique = {};
        const creatifsObj: CreatifsByPlacement = {}; // 🔥 NOUVEAU
        
        for (const section of sectionsData) {
          // Charger les tactiques
          const sectionTactiques = await getTactiques(
            selectedClient.clientId,
            selectedCampaign.id,
            selectedVersion.id,
            selectedOnglet.id,
            section.id
          );
          
          tactiquesObj[section.id] = sectionTactiques;
          
          // Charger les placements pour chaque tactique
          for (const tactique of sectionTactiques) {
            try {
              const tactiquePlacements = await getPlacementsForTactique(
                selectedClient.clientId,
                selectedCampaign.id,
                selectedVersion.id,
                selectedOnglet.id,
                section.id,
                tactique.id
              );
              
              placementsObj[tactique.id] = tactiquePlacements;
              console.log(`📋 ${tactiquePlacements.length} placements chargés pour tactique ${tactique.TC_Label}`);
              
              // 🔥 NOUVEAU : Charger les créatifs pour chaque placement
              for (const placement of tactiquePlacements) {
                try {
                  const placementCreatifs = await getCreatifsForPlacement(
                    selectedClient.clientId,
                    selectedCampaign.id,
                    selectedVersion.id,
                    selectedOnglet.id,
                    section.id,
                    tactique.id,
                    placement.id
                  );
                  
                  creatifsObj[placement.id] = placementCreatifs;
                  console.log(`🎨 ${placementCreatifs.length} créatifs chargés pour placement ${placement.PL_Label}`);
                } catch (error) {
                  console.error(`Erreur chargement créatifs pour placement ${placement.id}:`, error);
                  creatifsObj[placement.id] = [];
                }
              }
            } catch (error) {
              console.error(`Erreur chargement placements pour tactique ${tactique.id}:`, error);
              placementsObj[tactique.id] = [];
            }
          }
        }
        
        setTactiques(tactiquesObj);
        setPlacements(placementsObj);
        setCreatifs(creatifsObj); // 🔥 NOUVEAU
        
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
    
    loadSectionsTactiquesPlacementsCreatifs();
  }, [selectedClient, selectedCampaign, selectedVersion, selectedOnglet]);

  // 🔥 FONCTION UTILITAIRE : Trouver les chemins pour une tactique
  const findTactiquePaths = (tactiqueId: string) => {
    for (const section of sections) {
      const tactique = tactiques[section.id]?.find(t => t.id === tactiqueId);
      if (tactique) {
        return {
          sectionId: section.id,
          tactique,
          paths: {
            clientId: selectedClient!.clientId,
            campaignId: selectedCampaign!.id,
            versionId: selectedVersion!.id,
            ongletId: selectedOnglet!.id,
            sectionId: section.id,
            tactiqueId
          }
        };
      }
    }
    return null;
  };

  // 🔥 FONCTION UTILITAIRE : Trouver les chemins pour un placement
  const findPlacementPaths = (placementId: string) => {
    for (const [tactiqueId, tactiquesPlacements] of Object.entries(placements)) {
      const placement = tactiquesPlacements.find(p => p.id === placementId);
      if (placement) {
        const tactiqueInfo = findTactiquePaths(tactiqueId);
        if (tactiqueInfo) {
          return {
            placement,
            ...tactiqueInfo,
            placementId
          };
        }
      }
    }
    return null;
  };

  // 🔥 NOUVELLE FONCTION UTILITAIRE : Trouver les chemins pour un créatif
  const findCreatifPaths = (creatifId: string) => {
    for (const [placementId, placementCreatifs] of Object.entries(creatifs)) {
      const creatif = placementCreatifs.find(c => c.id === creatifId);
      if (creatif) {
        const placementInfo = findPlacementPaths(placementId);
        if (placementInfo) {
          return {
            creatif,
            ...placementInfo,
            creatifId
          };
        }
      }
    }
    return null;
  };

  // Actions pour les placements [INCHANGÉES]
  const handleCreatePlacement = async (tactiqueId: string): Promise<Placement> => {
    const tactiqueInfo = findTactiquePaths(tactiqueId);
    if (!tactiqueInfo) {
      throw new Error('Tactique non trouvée pour créer un placement');
    }
    
    try {
      const existingPlacements = placements[tactiqueId] || [];
      const nextOrder = existingPlacements.length;
      
      const newPlacementData = {
        PL_Label: 'Nouveau placement',
        PL_Order: nextOrder,
        PL_TactiqueId: tactiqueId,
        PL_Taxonomy_Values: {},
        PL_Generated_Taxonomies: {}
      };
      
      const placementId = await createPlacement(
        tactiqueInfo.paths.clientId,
        tactiqueInfo.paths.campaignId,
        tactiqueInfo.paths.versionId,
        tactiqueInfo.paths.ongletId,
        tactiqueInfo.paths.sectionId,
        tactiqueInfo.paths.tactiqueId,
        newPlacementData,
        selectedCampaign,
        tactiqueInfo.tactique
      );
      
      const newPlacement = {
        id: placementId,
        ...newPlacementData
      };
      
      setPlacements(prev => ({
        ...prev,
        [tactiqueId]: [
          ...(prev[tactiqueId] || []),
          newPlacement
        ]
      }));
      
      // 🔥 NOUVEAU : Initialiser les créatifs pour ce placement
      setCreatifs(prev => ({
        ...prev,
        [placementId]: []
      }));
      
      console.log('✅ Placement créé:', newPlacement);
      return newPlacement;
    } catch (err) {
      console.error('Erreur lors de la création du placement:', err);
      throw err;
    }
  };

  const handleUpdatePlacement = async (placementId: string, data: Partial<Placement>) => {
    const placementInfo = findPlacementPaths(placementId);
    if (!placementInfo) {
      throw new Error('Placement non trouvé pour mise à jour');
    }
    
    try {
      await updatePlacement(
        placementInfo.paths.clientId,
        placementInfo.paths.campaignId,
        placementInfo.paths.versionId,
        placementInfo.paths.ongletId,
        placementInfo.paths.sectionId,
        placementInfo.paths.tactiqueId,
        placementId,
        data,
        selectedCampaign,
        placementInfo.tactique
      );
      
      setPlacements(prev => {
        const tactiqueId = placementInfo.tactique.id;
        const updatedPlacements = (prev[tactiqueId] || []).map(placement => 
          placement.id === placementId ? { ...placement, ...data } : placement
        );
        
        return {
          ...prev,
          [tactiqueId]: updatedPlacements
        };
      });
      
      console.log('✅ Placement mis à jour');
    } catch (err) {
      console.error('Erreur lors de la mise à jour du placement:', err);
      throw err;
    }
  };

  const handleDeletePlacement = async (placementId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce placement et ses créatifs ?')) {
      return;
    }
    
    const placementInfo = findPlacementPaths(placementId);
    if (!placementInfo) {
      throw new Error('Placement non trouvé pour suppression');
    }
    
    try {
      await deletePlacement(
        placementInfo.paths.clientId,
        placementInfo.paths.campaignId,
        placementInfo.paths.versionId,
        placementInfo.paths.ongletId,
        placementInfo.paths.sectionId,
        placementInfo.paths.tactiqueId,
        placementId
      );
      
      setPlacements(prev => {
        const tactiqueId = placementInfo.tactique.id;
        const filteredPlacements = (prev[tactiqueId] || []).filter(p => p.id !== placementId);
        
        return {
          ...prev,
          [tactiqueId]: filteredPlacements
        };
      });
      
      // 🔥 NOUVEAU : Nettoyer les créatifs de ce placement
      setCreatifs(prev => {
        const newCreatifs = { ...prev };
        delete newCreatifs[placementId];
        return newCreatifs;
      });
      
      console.log('✅ Placement supprimé');
    } catch (err) {
      console.error('Erreur lors de la suppression du placement:', err);
      throw err;
    }
  };

  // 🔥 NOUVELLES ACTIONS POUR CRÉATIFS (vraies, plus temporaires)
  const handleCreateCreatif = async (placementId: string): Promise<Creatif> => {
    const placementInfo = findPlacementPaths(placementId);
    if (!placementInfo) {
      throw new Error('Placement non trouvé pour créer un créatif');
    }
    
    try {
      const existingCreatifs = creatifs[placementId] || [];
      const nextOrder = existingCreatifs.length;
      
      const newCreatifData = {
        CR_Label: 'Nouveau créatif',
        CR_Order: nextOrder,
        CR_PlacementId: placementId,
        CR_Taxonomy_Values: {},
        CR_Generated_Taxonomies: {}
      };
      
      const creatifId = await createCreatif(
        placementInfo.paths.clientId,
        placementInfo.paths.campaignId,
        placementInfo.paths.versionId,
        placementInfo.paths.ongletId,
        placementInfo.paths.sectionId,
        placementInfo.paths.tactiqueId,
        placementId,
        newCreatifData,
        selectedCampaign,
        placementInfo.tactique,
        placementInfo.placement
      );
      
      const newCreatif = {
        id: creatifId,
        ...newCreatifData
      };
      
      setCreatifs(prev => ({
        ...prev,
        [placementId]: [
          ...(prev[placementId] || []),
          newCreatif
        ]
      }));
      
      console.log('✅ Créatif créé:', newCreatif);
      return newCreatif;
    } catch (err) {
      console.error('Erreur lors de la création du créatif:', err);
      throw err;
    }
  };

  const handleUpdateCreatif = async (creatifId: string, data: Partial<Creatif>) => {
    const creatifInfo = findCreatifPaths(creatifId);
    if (!creatifInfo) {
      throw new Error('Créatif non trouvé pour mise à jour');
    }
    
    try {
      await updateCreatif(
        creatifInfo.paths.clientId,
        creatifInfo.paths.campaignId,
        creatifInfo.paths.versionId,
        creatifInfo.paths.ongletId,
        creatifInfo.paths.sectionId,
        creatifInfo.paths.tactiqueId,
        creatifInfo.placementId,
        creatifId,
        data,
        selectedCampaign,
        creatifInfo.tactique,
        creatifInfo.placement
      );
      
      setCreatifs(prev => {
        const placementId = creatifInfo.placement.id;
        const updatedCreatifs = (prev[placementId] || []).map(creatif => 
          creatif.id === creatifId ? { ...creatif, ...data } : creatif
        );
        
        return {
          ...prev,
          [placementId]: updatedCreatifs
        };
      });
      
      console.log('✅ Créatif mis à jour');
    } catch (err) {
      console.error('Erreur lors de la mise à jour du créatif:', err);
      throw err;
    }
  };

  const handleDeleteCreatif = async (creatifId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créatif ?')) {
      return;
    }
    
    const creatifInfo = findCreatifPaths(creatifId);
    if (!creatifInfo) {
      throw new Error('Créatif non trouvé pour suppression');
    }
    
    try {
      await deleteCreatif(
        creatifInfo.paths.clientId,
        creatifInfo.paths.campaignId,
        creatifInfo.paths.versionId,
        creatifInfo.paths.ongletId,
        creatifInfo.paths.sectionId,
        creatifInfo.paths.tactiqueId,
        creatifInfo.placementId,
        creatifId
      );
      
      setCreatifs(prev => {
        const placementId = creatifInfo.placement.id;
        const filteredCreatifs = (prev[placementId] || []).filter(c => c.id !== creatifId);
        
        return {
          ...prev,
          [placementId]: filteredCreatifs
        };
      });
      
      console.log('✅ Créatif supprimé');
    } catch (err) {
      console.error('Erreur lors de la suppression du créatif:', err);
      throw err;
    }
  };

  // ... [Le reste des fonctions (sections, tactiques, onglets) restent inchangées] ...

  // Fonctions pour le modal de section [INCHANGÉES]
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

  // Gestionnaires pour les sections [INCHANGÉS]
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

  // Gestionnaires pour les tactiques [INCHANGÉS]
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
        TC_StartDate: selectedCampaign.CA_Start_Date,
        TC_EndDate: selectedCampaign.CA_End_Date
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
      
      setPlacements(prev => ({
        ...prev,
        [tactiqueId]: []
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
      
      setPlacements(prev => {
        const newPlacements = { ...prev };
        delete newPlacements[tactiqueId];
        return newPlacements;
      });
      
      // 🔥 NOUVEAU : Nettoyer les créatifs des placements de cette tactique
      setCreatifs(prev => {
        const newCreatifs = { ...prev };
        const tactiquePlacements = placements[tactiqueId] || [];
        tactiquePlacements.forEach(placement => {
          delete newCreatifs[placement.id];
        });
        return newCreatifs;
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

  // Gestionnaires pour les onglets [INCHANGÉS] ...
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
    placements,
    creatifs, // 🔥 NOUVEAU : Export des créatifs
    
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
    
    // Actions pour créatifs (maintenant réelles)
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