'use client';

import { useState, useEffect, useRef } from 'react';
import { useClient } from '../contexts/ClientContext';
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
import { getCampaigns } from '../lib/campaignService';
import { getVersions } from '../lib/versionService';
import TactiquesHierarchyView from '../components/Tactiques/TactiquesHierarchyView';
import TactiquesTableView from '../components/Tactiques/TactiquesTableView';
import TactiquesTimelineView from '../components/Tactiques/TactiquesTimelineView';
import TactiquesTotals from '../components/Tactiques/TactiquesTotals';
import TactiquesIndicateurs from '../components/Tactiques/TactiquesIndicateurs';
import { 
  ChevronDownIcon, 
  PlusIcon, 
  TableCellsIcon, 
  ViewColumnsIcon,
  ListBulletIcon,
  ChartBarIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Modes de visualisation
type ViewMode = 'hierarchy' | 'table' | 'timeline';

export default function TactiquesPage() {
  const { selectedClient } = useClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour le mode de visualisation
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  
  // États pour les sélections
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [onglets, setOnglets] = useState<Onglet[]>([]);
  const [selectedOnglet, setSelectedOnglet] = useState<Onglet | null>(null);
  
  // États pour les données
  const [sections, setSections] = useState<Array<Section & { isExpanded: boolean }>>([]);
  const [tactiques, setTactiques] = useState<{ [sectionId: string]: Tactique[] }>({});
  const [totalBudget, setTotalBudget] = useState<number>(0);
  
  // États pour les dropdowns
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showOngletDropdown, setShowOngletDropdown] = useState(false);
  
  // État pour les panneaux latéraux
  const [showTotalsPanel, setShowTotalsPanel] = useState(true);
  const [showIndicateursPanel, setShowIndicateursPanel] = useState(true);
  
  // Refs pour gérer les clics en dehors des dropdowns
  const campaignDropdownRef = useRef<HTMLDivElement>(null);
  const versionDropdownRef = useRef<HTMLDivElement>(null);
  const ongletDropdownRef = useRef<HTMLDivElement>(null);
  
  // Fermer les dropdowns quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (campaignDropdownRef.current && !campaignDropdownRef.current.contains(event.target as Node)) {
        setShowCampaignDropdown(false);
      }
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target as Node)) {
        setShowVersionDropdown(false);
      }
      if (ongletDropdownRef.current && !ongletDropdownRef.current.contains(event.target as Node)) {
        setShowOngletDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Charger les campagnes au chargement initial
  useEffect(() => {
    async function loadCampaigns() {
      if (!selectedClient) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const campaignsData = await getCampaigns(selectedClient.clientId);
        setCampaigns(campaignsData);
        
        // Réinitialiser les sélections
        setSelectedCampaign(null);
        setSelectedVersion(null);
        setSelectedOnglet(null);
        setSections([]);
        setTactiques({});
      } catch (err) {
        console.error('Erreur lors du chargement des campagnes:', err);
        setError('Erreur lors du chargement des campagnes');
      } finally {
        setLoading(false);
      }
    }
    
    loadCampaigns();
  }, [selectedClient]);
  
  // Charger les versions lorsqu'une campagne est sélectionnée
  useEffect(() => {
    async function loadVersions() {
      if (!selectedClient || !selectedCampaign) return;
      
      try {
        setLoading(true);
        
        const versionsData = await getVersions(selectedClient.clientId, selectedCampaign.id);
        setVersions(versionsData);
        
        // Définir le budget total à partir de la campagne
        setTotalBudget(selectedCampaign.budget || 0);
        
        // Réinitialiser les sélections suivantes
        setSelectedVersion(null);
        setSelectedOnglet(null);
        setSections([]);
        setTactiques({});
      } catch (err) {
        console.error('Erreur lors du chargement des versions:', err);
        setError('Erreur lors du chargement des versions');
      } finally {
        setLoading(false);
      }
    }
    
    loadVersions();
  }, [selectedClient, selectedCampaign]);
  
  // Charger les onglets lorsqu'une version est sélectionnée
  useEffect(() => {
    async function loadOnglets() {
      if (!selectedClient || !selectedCampaign || !selectedVersion) return;
      
      try {
        setLoading(true);
        
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
        
        // Sélectionner automatiquement le premier onglet s'il y en a
        if (ongletsData.length > 0) {
          setSelectedOnglet(ongletsData[0]);
        } else {
          // Réinitialiser les sélections suivantes
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
  }, [selectedClient, selectedCampaign, selectedVersion]);
  
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
      
      // Pas besoin de mettre à jour le budget de la section car celui de la tactique est 0
    } catch (err) {
      console.error('Erreur lors de l\'ajout d\'une tactique:', err);
      setError('Erreur lors de l\'ajout d\'une tactique');
    }
  };
  
  const handleEditTactique = (sectionId: string, tactiqueId: string) => {
    // Pour l'instant, afficher simplement un dialogue de modification rapide
    const tactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
    if (!tactique) return;
    
    const newLabel = prompt('Nom de la tactique:', tactique.TC_Label);
    if (newLabel === null) return; // L'utilisateur a annulé
    
    const newBudgetStr = prompt('Budget de la tactique:', tactique.TC_Budget.toString());
    if (newBudgetStr === null) return; // L'utilisateur a annulé
    
    const newBudget = parseFloat(newBudgetStr) || 0;
    
    handleUpdateTactique(sectionId, tactiqueId, { 
      TC_Label: newLabel,
      TC_Budget: newBudget
    });
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
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tactiques</h1>
        
        {/* Afficher le budget total et restant */}
        {selectedCampaign && (
          <div className="text-right">
            <div className="text-sm text-gray-500">Budget total: <span className="font-medium">{formatCurrency(totalBudget)}</span></div>
            <div className={`text-sm ${budgetRestant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Budget restant: <span className="font-medium">{formatCurrency(budgetRestant)}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Sélecteurs de campagne, version et onglet */}
      <div className="flex gap-4 mb-6">
        {/* Sélecteur de campagne */}
        <div className="w-1/3 relative" ref={campaignDropdownRef}>
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
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setShowCampaignDropdown(false);
                    }}
                  >
                    {campaign.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Sélecteur de version */}
        <div className="w-1/3 relative" ref={versionDropdownRef}>
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
                    onClick={() => {
                      setSelectedVersion(version);
                      setShowVersionDropdown(false);
                    }}
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
        
        {/* Sélecteur d'onglet */}
        <div className="w-1/3 relative" ref={ongletDropdownRef}>
          <button 
            type="button" 
            className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={() => setShowOngletDropdown(!showOngletDropdown)}
            disabled={!selectedVersion || onglets.length === 0}
          >
            <span>{selectedOnglet?.ONGLET_Name || 'Sélectionner un onglet'}</span>
            <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1" />
          </button>
          
          {/* Dropdown pour les onglets */}
          {showOngletDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-56 overflow-auto">
              <ul className="py-1">
                {onglets.map(onglet => (
                  <li 
                    key={onglet.id}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                      selectedOnglet?.id === onglet.id ? 'bg-gray-50 font-medium' : ''
                    }`}
                    onClick={() => {
                      setSelectedOnglet(onglet);
                      setShowOngletDropdown(false);
                    }}
                  >
                    {onglet.ONGLET_Name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {selectedOnglet && (
        <div className="flex flex-col md:flex-row gap-6 md:gap-4">
          {/* Zone principale - 2/3 de la largeur sur les écrans moyens et grands */}
          <div className="w-full md:w-2/3 space-y-4">
            {/* Barre d'outils */}
            <div className="flex justify-between items-center">
              {/* Boutons de vue */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('hierarchy')}
                  className={`flex items-center px-3 py-1.5 rounded text-sm ${
                    viewMode === 'hierarchy'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5 mr-1.5" />
                  Vue hiérarchique
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center px-3 py-1.5 rounded text-sm ${
                    viewMode === 'table'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <TableCellsIcon className="h-5 w-5 mr-1.5" />
                  Vue tableau
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`flex items-center px-3 py-1.5 rounded text-sm ${
                    viewMode === 'timeline'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ViewColumnsIcon className="h-5 w-5 mr-1.5" />
                  Vue timeline
                </button>
              </div>
              
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
            {loading && (
              <div className="bg-white p-8 rounded-lg shadow flex items-center justify-center">
                <div className="text-sm text-gray-500">Chargement en cours...</div>
              </div>
            )}
            
            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {/* Contenu principal selon le mode de vue */}
            {!loading && !error && (
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
          
          {/* Panneaux latéraux - 1/3 de la largeur sur les écrans moyens et grands */}
          <div className="w-full md:w-1/3 space-y-4">
            {/* Panneau des totaux */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Totaux</h3>
              <button
                onClick={() => setShowTotalsPanel(!showTotalsPanel)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChartPieIcon className="h-5 w-5" />
              </button>
            </div>
            
            {showTotalsPanel && (
              <TactiquesTotals
                sections={sections}
                totalBudget={totalBudget}
                formatCurrency={formatCurrency}
              />
            )}
            
            {/* Panneau des indicateurs */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Indicateurs</h3>
              <button
                onClick={() => setShowIndicateursPanel(!showIndicateursPanel)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChartBarIcon className="h-5 w-5" />
              </button>
            </div>
            
            {showIndicateursPanel && selectedCampaign && (
              <TactiquesIndicateurs
                tactiques={flatTactiques}
                totalBudget={totalBudget}
                campaignStartDate={selectedCampaign.startDate}
                campaignEndDate={selectedCampaign.endDate}
                formatCurrency={formatCurrency}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Message si aucun onglet sélectionné */}
      {!loading && !error && !selectedOnglet && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">
            Veuillez sélectionner une campagne, une version et un onglet pour voir les tactiques.
          </p>
        </div>
      )}
    </div>
  );
}