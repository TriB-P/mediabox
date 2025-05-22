'use client';

import { useState, useEffect, useRef } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { useCampaignSelection } from '../hooks/useCampaignSelection';
import { Section, Tactique, Onglet, Version, SectionWithTactiques } from '../types/tactiques';
import {
  getOnglets,
  getSections,
  getTactiques,
  reorderSections,
  reorderTactiques,
  moveTactiqueToSection,
  addSection,
  updateSection,
  deleteSection,
  addTactique,
  updateTactique,
  deleteTactique
} from '../lib/tactiqueService';
import TactiquesHierarchyView from '../components/Tactiques/TactiquesHierarchyView';
import TactiquesTableView from '../components/Tactiques/TactiquesTableView';
import TactiquesTimelineView from '../components/Tactiques/TactiquesTimelineView';
import TactiquesFooter from '../components/Tactiques/TactiquesFooter';
import { 
  ChevronDownIcon, 
  PlusIcon, 
} from '@heroicons/react/24/outline';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import TactiqueDrawer from '../components/Tactiques/TactiqueDrawer';
import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';

// Déclaration pour TypeScript
declare global {
  interface Window {
    editTactiqueHandled?: boolean;
  }
}

// Modes de visualisation
type ViewMode = 'hierarchy' | 'table' | 'timeline';

export default function TactiquesPage() {
  const { selectedClient } = useClient();
  const { 
    selectedOngletId, 
    setSelectedOngletId,
  } = useSelection();
  
  const {
    campaigns,
    versions,
    selectedCampaign,
    selectedVersion,
    loading: campaignLoading,
    error: campaignError,
    handleCampaignChange,
    handleVersionChange,
  } = useCampaignSelection();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour le mode de visualisation
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  
  // États pour les données
  const [onglets, setOnglets] = useState<Onglet[]>([]);
  const [selectedOnglet, setSelectedOnglet] = useState<Onglet | null>(null);
  const [sections, setSections] = useState<Array<Section & { isExpanded: boolean }>>([]);
  const [tactiques, setTactiques] = useState<{ [sectionId: string]: Tactique[] }>({});
  const [totalBudget, setTotalBudget] = useState<number>(0);
  
  // États pour les dropdowns
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  
  // État pour le drawer
  const [tactiqueDrawerOpen, setTactiqueDrawerOpen] = useState(false);
  const [selectedTactiqueForEdit, setSelectedTactiqueForEdit] = useState<Tactique | null>(null);
  const [selectedSectionIdForEdit, setSelectedSectionIdForEdit] = useState<string>('');
  
  // Refs pour gérer les clics en dehors des dropdowns
  const campaignDropdownRef = useRef<HTMLDivElement>(null);
  const versionDropdownRef = useRef<HTMLDivElement>(null);
  
  // Fermer les dropdowns quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (campaignDropdownRef.current && !campaignDropdownRef.current.contains(event.target as Node)) {
        setShowCampaignDropdown(false);
      }
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target as Node)) {
        setShowVersionDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mettre à jour le budget total quand la campagne change
  useEffect(() => {
    if (selectedCampaign) {
      setTotalBudget(selectedCampaign.budget || 0);
    } else {
      setTotalBudget(0);
    }
  }, [selectedCampaign]);
  
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
        
        // S'il n'y a pas d'onglets, en créer un par défaut
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
            
            // Ajouter l'onglet par défaut à la liste
            ongletsData.push({
              id: ongletRef.id,
              ...defaultOngletData
            });
          } catch (error) {
            console.error('Erreur lors de la création de l\'onglet par défaut:', error);
          }
        }
        
        setOnglets(ongletsData);
        
        // Essayer de restaurer l'onglet sélectionné depuis le contexte
        let ongletToSelect: Onglet | null = null;
        
        if (selectedOngletId) {
          const savedOnglet = ongletsData.find(o => o.id === selectedOngletId);
          if (savedOnglet) {
            ongletToSelect = savedOnglet;
            console.log('Onglet restauré depuis les sélections:', savedOnglet);
          } else {
            // L'onglet sauvegardé n'existe plus, nettoyer la sélection
            setSelectedOngletId(null);
          }
        }
        
        // Si pas d'onglet restauré, sélectionner le premier
        if (!ongletToSelect && ongletsData.length > 0) {
          ongletToSelect = ongletsData[0];
          console.log('Premier onglet sélectionné automatiquement:', ongletToSelect);
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
        
        // Charger les sections
        const sectionsData = await getSections(
          selectedClient.clientId,
          selectedCampaign.id,
          selectedVersion.id,
          selectedOnglet.id
        );
        
        // Initialiser les sections avec isExpanded = true
        const sectionsWithExpanded = sectionsData.map(section => ({
          ...section,
          isExpanded: true,
        }));
        
        setSections(sectionsWithExpanded);
        
        // Charger les tactiques pour chaque section
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
  
  // Gestionnaires pour les changements de sélection avec dropdown
  const handleCampaignChangeLocal = (campaign: any) => {
    handleCampaignChange(campaign);
    setShowCampaignDropdown(false);
    setShowVersionDropdown(false);
  };

  const handleVersionChangeLocal = (version: any) => {
    handleVersionChange(version);
    setShowVersionDropdown(false);
  };
  
  // Gestionnaire pour développer/réduire une section
  const handleSectionExpand = (sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, isExpanded: !section.isExpanded }
          : section
      )
    );
  };
  
  // Gestionnaire pour le drag and drop
  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId, type } = result;
    
    // Si aucune destination ou destination identique à la source, ne rien faire
    if (!destination || (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )) {
      return;
    }
    
    if (type === 'SECTION') {
      // Réorganisation des sections
      const sectionId = draggableId.replace('section-', '');
      const newSections = [...sections];
      const [removed] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, removed);
      
      // Mettre à jour l'ordre des sections en local
      const updatedSections = newSections.map((section, index) => ({
        ...section,
        SECTION_Order: index,
      }));
      
      setSections(updatedSections);
      
      // Préparer la mise à jour dans Firestore
      const sectionOrders = updatedSections.map(section => ({
        id: section.id,
        order: section.SECTION_Order,
      }));
      
      try {
        await reorderSections(
          selectedClient!.clientId,
          selectedCampaign!.id,
          selectedVersion!.id,
          selectedOnglet!.id,
          sectionOrders
        );
      } catch (err) {
        console.error('Erreur lors de la réorganisation des sections:', err);
        setError('Erreur lors de la réorganisation des sections');
      }
    } else if (type === 'TACTIQUE') {
      const tactiqueId = draggableId.replace('tactique-', '');
      const sourceSectionId = source.droppableId.replace('tactiques-', '');
      
      if (destination.droppableId === source.droppableId) {
        // Réorganisation des tactiques au sein d'une même section
        const newTactiques = [...(tactiques[sourceSectionId] || [])];
        const [removed] = newTactiques.splice(source.index, 1);
        newTactiques.splice(destination.index, 0, removed);
        
        // Mettre à jour l'ordre des tactiques en local
        const updatedTactiques = newTactiques.map((tactique, index) => ({
          ...tactique,
          TC_Order: index,
        }));
        
        setTactiques(prev => ({
          ...prev,
          [sourceSectionId]: updatedTactiques,
        }));
        
        // Préparer la mise à jour dans Firestore
        const tactiqueOrders = updatedTactiques.map(tactique => ({
          id: tactique.id,
          order: tactique.TC_Order,
        }));
        
        try {
          await reorderTactiques(
            selectedClient!.clientId,
            selectedCampaign!.id,
            selectedVersion!.id,
            selectedOnglet!.id,
            sourceSectionId,
            tactiqueOrders
          );
        } catch (err) {
          console.error('Erreur lors de la réorganisation des tactiques:', err);
          setError('Erreur lors de la réorganisation des tactiques');
        }
      } else {
        // Déplacement d'une tactique vers une autre section
        const destinationSectionId = destination.droppableId.replace('tactiques-', '');
        
        // Récupérer la tactique à déplacer
        const tactiqueToMove = tactiques[sourceSectionId].find(
          t => t.id === tactiqueId
        );
        
        if (!tactiqueToMove) return;
        
        // Mettre à jour les tactiques en local
        // 1. Retirer de la section source
        const newSourceTactiques = tactiques[sourceSectionId].filter(
          t => t.id !== tactiqueId
        );
        
        // 2. Ajouter à la section de destination
        const newDestTactiques = [...(tactiques[destinationSectionId] || [])];
        newDestTactiques.splice(destination.index, 0, {
          ...tactiqueToMove,
          TC_SectionId: destinationSectionId,
        });
        
        // 3. Mettre à jour les ordres
        const updatedSourceTactiques = newSourceTactiques.map((t, i) => ({
          ...t,
          TC_Order: i,
        }));
        
        const updatedDestTactiques = newDestTactiques.map((t, i) => ({
          ...t,
          TC_Order: i,
        }));
        
        // Mettre à jour l'état local
        setTactiques(prev => ({
          ...prev,
          [sourceSectionId]: updatedSourceTactiques,
          [destinationSectionId]: updatedDestTactiques,
        }));
        
        // Mettre à jour les budgets des sections
        const updatedSections = sections.map(section => {
          if (section.id === sourceSectionId) {
            const newBudget = updatedSourceTactiques.reduce(
              (sum, t) => sum + t.TC_Budget,
              0
            );
            return { ...section, SECTION_Budget: newBudget };
          }
          if (section.id === destinationSectionId) {
            const newBudget = updatedDestTactiques.reduce(
              (sum, t) => sum + t.TC_Budget,
              0
            );
            return { ...section, SECTION_Budget: newBudget };
          }
          return section;
        });
        
        setSections(updatedSections);
        
        // Effectuer la mise à jour dans Firestore
        try {
          await moveTactiqueToSection(
            selectedClient!.clientId,
            selectedCampaign!.id,
            selectedVersion!.id,
            selectedOnglet!.id,
            tactiqueId,
            sourceSectionId,
            destinationSectionId,
            destination.index
          );
        } catch (err) {
          console.error('Erreur lors du déplacement de la tactique:', err);
          setError('Erreur lors du déplacement de la tactique');
        }
      }
    }
  };
  
  // Gestionnaires pour les actions sur les sections et tactiques
  const handleAddSection = async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedOnglet) return;
    
    try {
      // Déterminer le prochain ordre
      const nextOrder = sections.length;
      
      // Générer une couleur aléatoire parmi une sélection de couleurs
      const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#22c55e'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newSectionData = {
        SECTION_Name: 'Nouvelle section',
        SECTION_Order: nextOrder,
        SECTION_Color: randomColor,
        SECTION_Budget: 0
      };
      
      const sectionId = await addSection(
        selectedClient.clientId,
        selectedCampaign.id,
        selectedVersion.id,
        selectedOnglet.id,
        newSectionData
      );
      
      // Ajouter la section à l'état local
      setSections(prev => [
        ...prev,
        {
          id: sectionId,
          ...newSectionData,
          isExpanded: true
        }
      ]);
      
      // Initialiser les tactiques pour cette section
      setTactiques(prev => ({
        ...prev,
        [sectionId]: []
      }));
    } catch (err) {
      console.error('Erreur lors de l\'ajout d\'une section:', err);
      setError('Erreur lors de l\'ajout d\'une section');
    }
  };
  
  const handleEditSection = (sectionId: string) => {
    // Pour l'instant, afficher simplement un dialogue de modification rapide
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const newName = prompt('Nom de la section:', section.SECTION_Name);
    if (newName === null) return; // L'utilisateur a annulé
    
    handleUpdateSection(sectionId, { SECTION_Name: newName });
  };
  
  const handleUpdateSection = async (sectionId: string, updates: Partial<Section>) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedOnglet) return;
    
    try {
      await updateSection(
        selectedClient.clientId,
        selectedCampaign.id,
        selectedVersion.id,
        selectedOnglet.id,
        sectionId,
        updates
      );
      
      // Mettre à jour l'état local
      setSections(prev => prev.map(section => 
        section.id === sectionId ? { ...section, ...updates } : section
      ));
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la section:', err);
      setError('Erreur lors de la mise à jour de la section');
    }
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
      
      // Mettre à jour l'état local
      setSections(prev => prev.filter(section => section.id !== sectionId));
      
      // Supprimer les tactiques associées
      setTactiques(prev => {
        const newTactiques = { ...prev };
        delete newTactiques[sectionId];
        return newTactiques;
      });
      
      // Réorganiser les sections restantes
      const remainingSections = sections.filter(section => section.id !== sectionId);
      const reorderedSections = remainingSections.map((section, index) => ({
        id: section.id,
        order: index
      }));
      
      if (reorderedSections.length > 0) {
        await reorderSections(
          selectedClient.clientId,
          selectedCampaign.id,
          selectedVersion.id,
          selectedOnglet.id,
          reorderedSections
        );
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de la section:', err);
      setError('Erreur lors de la suppression de la section');
    }
  };
  
  const handleAddTactique = async (sectionId: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedOnglet) return;
    
    try {
      // Déterminer le prochain ordre
      const sectionTactiques = tactiques[sectionId] || [];
      const nextOrder = sectionTactiques.length;
      
      const newTactiqueData = {
        TC_Label: 'Nouvelle tactique',
        TC_Budget: 0,
        TC_Order: nextOrder,
        TC_SectionId: sectionId,
        TC_Status: 'Planned' as 'Planned' | 'Active' | 'Completed' | 'Cancelled',
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
      
      // Ajouter la tactique à l'état local
      setTactiques(prev => ({
        ...prev,
        [sectionId]: [
          ...(prev[sectionId] || []),
          {
            id: tactiqueId,
            ...newTactiqueData
          }
        ]
      }));
      
      // Ouvrir le drawer d'édition pour la nouvelle tactique
      const newTactique = {
        id: tactiqueId,
        ...newTactiqueData
      };
      
      setSelectedTactiqueForEdit(newTactique);
      setSelectedSectionIdForEdit(sectionId);
      setTactiqueDrawerOpen(true);
    } catch (err) {
      console.error('Erreur lors de l\'ajout d\'une tactique:', err);
      setError('Erreur lors de l\'ajout d\'une tactique');
    }
  };
  
  const handleEditTactique = (sectionId: string, tactiqueId: string) => {
    // Si le drawer est déjà ouvert par notre composant, ne pas afficher les prompts
    if (window.editTactiqueHandled) return;
    
    // Trouver la tactique concernée
    const tactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
    if (!tactique) return;
    
    // Ouvrir le drawer au lieu d'afficher des prompts
    setSelectedTactiqueForEdit(tactique);
    setSelectedSectionIdForEdit(sectionId);
    setTactiqueDrawerOpen(true);
    window.editTactiqueHandled = true;
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
      
      // Mettre à jour l'état local
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
      
      // Si le budget a changé, mettre à jour le budget de la section
      if (updates.TC_Budget !== undefined) {
        // Recalculer le total du budget de la section
        const updatedSectionTactiques = tactiques[sectionId].map(tactique => 
          tactique.id === tactiqueId 
            ? { ...tactique, TC_Budget: updates.TC_Budget || 0 } 
            : tactique
        );
        
        const newSectionBudget = updatedSectionTactiques.reduce(
          (sum, tactique) => sum + tactique.TC_Budget,
          0
        );
        
        // Mettre à jour le budget de la section
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
  
  const handleSaveTactiqueFromDrawer = async (tactiqueData: any) => {
    if (!selectedTactiqueForEdit || !selectedSectionIdForEdit) return;
    
    await handleUpdateTactique(
      selectedSectionIdForEdit,
      selectedTactiqueForEdit.id,
      tactiqueData
    );
    
    setTactiqueDrawerOpen(false);
    setSelectedTactiqueForEdit(null);
    window.editTactiqueHandled = false;
  };
  
  const handleDeleteTactique = async (sectionId: string, tactiqueId: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion || !selectedOnglet) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tactique ?')) {
      return;
    }
    
    try {
      // Trouver la tactique pour connaître son budget
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
      
      // Mettre à jour l'état local
      setTactiques(prev => {
        const sectionTactiques = [...(prev[sectionId] || [])];
        const updatedTactiques = sectionTactiques.filter(t => t.id !== tactiqueId);
        
        return {
          ...prev,
          [sectionId]: updatedTactiques
        };
      });
      
      // Mettre à jour le budget de la section
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
  
  // Formater les montants en CAD
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Fonctions pour la gestion des onglets
  const handleAddOnglet = async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    try {
      // Déterminer le prochain ordre
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
        
        // Ajouter l'onglet à l'état local
        setOnglets(prev => [...prev, newOnglet]);
        
        // Sélectionner le nouvel onglet
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
        
        // Mettre à jour l'état local
        setOnglets(prev => prev.map(onglet => 
          onglet.id === ongletId ? { ...onglet, ONGLET_Name: newName } : onglet
        ));
        
        // Mettre à jour l'onglet sélectionné si nécessaire
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
      
      // Vérifier qu'il reste plus d'un onglet
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
        
        // Mettre à jour l'état local
        const updatedOnglets = onglets.filter(onglet => onglet.id !== ongletId);
        setOnglets(updatedOnglets);
        
        // Si l'onglet supprimé était sélectionné, sélectionner le premier onglet disponible
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
    
    // Préparer les données pour la vue hiérarchique
    const sectionsWithTactiques: SectionWithTactiques[] = sections.map(section => ({
      ...section,
      tactiques: tactiques[section.id] || [],
    }));
    
    // Calculer le budget total utilisé et le budget restant
    const budgetUtilisé = sections.reduce((total, section) => total + (section.SECTION_Budget || 0), 0);
    const budgetRestant = totalBudget - budgetUtilisé;
    
    // Générer un dictionnaire des noms de sections pour la vue tableau
    const sectionNames = sections.reduce((names, section) => {
      names[section.id] = section.SECTION_Name;
      return names;
    }, {} as Record<string, string>);
    
    // Aplatir la liste des tactiques pour la vue tableau et timeline
    const flatTactiques = Object.values(tactiques).flat();
  
    const isLoading = campaignLoading || loading;
    const hasError = campaignError || error;
  
    return (

          <div className="space-y-6 pb-16">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Tactiques</h1>
              
              {/* Afficher le budget total et restant */}
              {selectedCampaign && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">Budget total: <span className="font-medium">{formatCurrency(totalBudget)}</span></div>
                  <div className={`text-sm ${budgetRestant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Budget restant: <span className="font-medium">{formatCurrency(budgetRestant)}</span>
                  </div>
                  {selectedCampaign && selectedVersion && (
                    <div className="text-xs text-gray-400 mt-1">
                      {selectedCampaign.name} • {selectedVersion.name}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Sélecteurs de campagne et version */}
            <div className="flex gap-4 mb-6">
              {/* Sélecteur de campagne */}
              <div className="w-1/2 relative" ref={campaignDropdownRef}>
                <button 
                  type="button" 
                  className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={() => setShowCampaignDropdown(!showCampaignDropdown)}
                >
                  <span>{selectedCampaign?.name || 'Sélectionner une campagne'}</span>
                  <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1" />
                </button>
                
                {/* Dropdown pour les campagnes */}
                {showCampaignDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-56 overflow-auto">
                    <ul className="py-1">
                      {campaigns.map(campaign => (
                        <li 
                          key={campaign.id}
                          className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                            selectedCampaign?.id === campaign.id ? 'bg-gray-50 font-medium' : ''
                          }`}
                          onClick={() => handleCampaignChangeLocal(campaign)}
                        >
                          {campaign.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Sélecteur de version */}
              <div className="w-1/2 relative" ref={versionDropdownRef}>
                <button 
                  type="button" 
                  className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                  disabled={!selectedCampaign || versions.length === 0}
                >
                  <span>{selectedVersion?.name || 'Sélectionner une version'}</span>
                  <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1" />
                </button>
                
                {/* Dropdown pour les versions */}
                {showVersionDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-56 overflow-auto">
                    <ul className="py-1">
                      {versions.map(version => (
                        <li 
                          key={version.id}
                          className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                            selectedVersion?.id === version.id ? 'bg-gray-50 font-medium' : ''
                          }`}
                          onClick={() => handleVersionChangeLocal(version)}
                        >
                          {version.name}
                          {version.isOfficial && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Officielle
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {selectedVersion && (
              <div className="w-full">
                {/* Barre d'outils */}
                <div className="flex justify-between items-center mb-4">
                  {/* Boutons d'action */}
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddSection}
                      className="flex items-center px-3 py-1.5 rounded text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    >
                      <PlusIcon className="h-5 w-5 mr-1.5" />
                      Nouvelle section
                    </button>
                    {sections.length > 0 && (
                      <button
                        onClick={() => handleAddTactique(sections[0].id)}
                        className="flex items-center px-3 py-1.5 rounded text-sm bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-1.5" />
                        Nouvelle tactique
                      </button>
                    )}
                  </div>
                </div>
  
                {/* État de chargement */}
                {isLoading && (
                  <div className="bg-white p-8 rounded-lg shadow flex items-center justify-center">
                    <div className="text-sm text-gray-500">Chargement en cours...</div>
                  </div>
                )}
                
                {/* Message d'erreur */}
                {hasError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {hasError}
                  </div>
                )}
                
                {/* Contenu principal selon le mode de vue */}
                {!isLoading && !hasError && (
                  <>
                    {/* Vue hiérarchique */}
                    {viewMode === 'hierarchy' && (
                      <>
                        {sectionsWithTactiques.length > 0 ? (
                          <TactiquesHierarchyView
                            sections={sectionsWithTactiques}
                            onSectionExpand={handleSectionExpand}
                            onDragEnd={handleDragEnd}
                            onEditSection={handleEditSection}
                            onDeleteSection={handleDeleteSection}
                            onEditTactique={handleEditTactique}
                            onDeleteTactique={handleDeleteTactique}
                            onAddTactique={handleAddTactique}
                            formatCurrency={formatCurrency}
                            totalBudget={totalBudget}
                          />
                        ) : (
                          <div className="bg-white p-8 rounded-lg shadow text-center">
                            <p className="text-gray-500">
                              Aucune section trouvée pour cet onglet. Créez une nouvelle section pour commencer.
                            </p>
                            <button
                              onClick={handleAddSection}
                              className="mt-4 flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 mx-auto"
                            >
                              <PlusIcon className="h-5 w-5 mr-1.5" />
                              Nouvelle section
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Vue tableau */}
                    {viewMode === 'table' && (
                      <TactiquesTableView
                        tactiques={flatTactiques}
                        onUpdateTactique={handleUpdateTactique}
                        onDeleteTactique={handleDeleteTactique}
                        formatCurrency={formatCurrency}
                        sectionNames={sectionNames}
                      />
                    )}
                    
                    {/* Vue timeline */}
                    {viewMode === 'timeline' && selectedCampaign && (
                      <TactiquesTimelineView
                        tactiques={flatTactiques}
                        sectionNames={sectionNames}
                        campaignStartDate={selectedCampaign.startDate}
                        campaignEndDate={selectedCampaign.endDate}
                        formatCurrency={formatCurrency}
                        onEditTactique={handleEditTactique}
                      />
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Message si aucune version sélectionnée */}
            {!isLoading && !hasError && !selectedVersion && (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">
                  Veuillez sélectionner une campagne et une version pour voir les tactiques.
                </p>
              </div>
            )}
            
            {/* Bas de page sticky avec les onglets et les boutons de vue */}
            {selectedOnglet && (
              <TactiquesFooter 
                viewMode={viewMode} 
                setViewMode={setViewMode}
                onglets={onglets}
                selectedOnglet={selectedOnglet}
                onSelectOnglet={handleSelectOnglet}
                onAddOnglet={handleAddOnglet}
                onRenameOnglet={handleRenameOnglet}
                onDeleteOnglet={handleDeleteOnglet}
              />
            )}
  
            {/* Drawer de tactique */}
            {selectedVersion && (
              <TactiqueDrawer
                isOpen={tactiqueDrawerOpen}
                onClose={() => {
                  setTactiqueDrawerOpen(false);
                  setSelectedTactiqueForEdit(null);
                  window.editTactiqueHandled = false;
                }}
                tactique={selectedTactiqueForEdit}
                sectionId={selectedSectionIdForEdit}
                onSave={handleSaveTactiqueFromDrawer}
              />
            )}
          </div>

    );
  }