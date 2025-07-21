// app/tactiques/page.tsx - Version avec vos vraies fonctions CRUD restaurées

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppData } from '../hooks/useAppData';
import { SectionWithTactiques, Section, Tactique, Placement, Creatif } from '../types/tactiques';
import CampaignVersionSelector from '../components/Others/CampaignVersionSelector';
import TactiquesHierarchyView from '../components/Tactiques/Views/Hierarchy/TactiquesHierarchyView';
import TactiquesAdvancedTableView from '../components/Tactiques/Views/Table/TactiquesAdvancedTableView';
import TactiquesTimelineView from '../components/Tactiques/Views/Timeline/TactiquesTimelineView';
import TactiquesFooter from '../components/Tactiques/TactiquesFooter';
import { default as SectionModal } from '../components/Tactiques/SectionModal';
import LoadingSpinner from '../components/Others/LoadingSpinner';
import TactiquesBudgetPanel from '../components/Tactiques/TactiquesBudgetPanel';
import SelectedActionsPanel from '../components/Tactiques/SelectedActionsPanel';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { duplicateSelectedItems, DuplicationContext } from '../lib/duplicationService';
import { getClientFees } from '../lib/feeService';
import { ClientFee } from '../lib/budgetService';

// 🔥 IMPORTS DE VOS VRAIES FONCTIONS
import { 
  addSection, 
  updateSection, 
  deleteSection,
  addTactique,
  updateTactique,
  deleteTactique,
  addOnglet,
  updateOnglet,
  deleteOnglet
} from '../lib/tactiqueService';

import { 
  createPlacement, 
  updatePlacement, 
  deletePlacement 
} from '../lib/placementService';

import { 
  createCreatif, 
  updateCreatif, 
  deleteCreatif 
} from '../lib/creatifService';

// ==================== TYPES ====================

type ViewMode = 'hierarchy' | 'table' | 'timeline';

// ==================== COMPOSANT PRINCIPAL ====================

export default function TactiquesPage() {
  
  // ==================== HOOK PRINCIPAL ====================

  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();

  // Hook consolidé pour toutes les données
  const {
    campaigns,
    versions,
    selectedCampaign,
    selectedVersion,
    onglets,
    selectedOnglet,
    sections,
    tactiques,
    placements,
    creatifs,
    loading,
    error,
    stage,
    handleCampaignChange,
    handleVersionChange,
    handleOngletChange,
    refresh
  } = useAppData();

  // ==================== ÉTATS UI ====================

  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [duplicationLoading, setDuplicationLoading] = useState(false);
  const [clientFees, setClientFees] = useState<ClientFee[]>([]);
  const [clientFeesLoading, setClientFeesLoading] = useState(false);

  // États pour les modals et expansions
  const [sectionModal, setSectionModal] = useState({
    isOpen: false,
    section: null as Section | null,
    mode: 'create' as 'create' | 'edit'
  });
  
  const [sectionExpansions, setSectionExpansions] = useState<{[key: string]: boolean}>({});

  // ==================== EFFET POUR CHARGER LES FRAIS DU CLIENT ====================

  useEffect(() => {
    const loadClientFees = async () => {
      if (!selectedClient?.clientId) {
        setClientFees([]);
        return;
      }

      try {
        setClientFeesLoading(true);
        console.log('🔄 Chargement des frais pour le client:', selectedClient.clientId);
        
        const fees = await getClientFees(selectedClient.clientId);
        
        const adaptedFees: ClientFee[] = fees.map(fee => ({
          ...fee,
          options: []
        }));
        
        setClientFees(adaptedFees);
        
        console.log('✅ Frais du client chargés:', fees.length, 'frais');
      } catch (error) {
        console.error('❌ Erreur lors du chargement des frais du client:', error);
        setClientFees([]);
      } finally {
        setClientFeesLoading(false);
      }
    };

    loadClientFees();
  }, [selectedClient?.clientId]);

  // ==================== GESTION DU BUDGET ====================

  const totalBudget = useMemo(() => {
    return selectedCampaign?.CA_Budget || 0;
  }, [selectedCampaign]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  // ==================== GESTION DES SÉLECTIONS ====================

  const handleSelectItems = useCallback((
    itemIds: string[],
    type: 'section' | 'tactique' | 'placement' | 'creatif',
    isSelected: boolean
  ) => {
    setSelectedItems(prevSelected => {
      const newSelected = new Set(prevSelected);
      itemIds.forEach(id => {
        if (isSelected) {
          newSelected.add(id);
        } else {
          newSelected.delete(id);
        }
      });
      return newSelected;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // ==================== DUPLICATION INTÉGRÉE ====================

  const handleDuplicateSelected = useCallback(async (itemIds: string[]) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      console.error('Contexte manquant pour la duplication');
      return;
    }

    if (itemIds.length === 0) {
      return;
    }

    console.log('🔄 Début duplication de', itemIds.length, 'éléments:', itemIds);

    try {
      setDuplicationLoading(true);

      const context: DuplicationContext = {
        clientId: selectedClient.clientId,
        campaignId: selectedCampaignId,
        versionId: selectedVersionId,
        ongletId: selectedOngletId
      };

      const itemHierarchy = {
        sections,
        tactiques,
        placements,
        creatifs
      };

      const result = await duplicateSelectedItems(context, itemIds, itemHierarchy);

      if (result.success && result.duplicatedIds.length > 0) {
        console.log('✅ Duplication réussie:', result.duplicatedIds);
        
        const successMessage = `${result.duplicatedIds.length} élément${result.duplicatedIds.length > 1 ? 's dupliqués' : ' dupliqué'} avec succès`;
        
        const successToast = document.createElement('div');
        successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        successToast.textContent = successMessage;
        document.body.appendChild(successToast);
        
        setTimeout(() => {
          document.body.removeChild(successToast);
        }, 3000);

        await refresh();
        handleClearSelection();

      } else {
        const errorMessages = result.errors.length > 0 ? result.errors : ['Erreur inconnue lors de la duplication'];
        console.error('❌ Erreurs duplication:', errorMessages);
      }

    } catch (error) {
      console.error('💥 Erreur critique duplication:', error);
    } finally {
      setDuplicationLoading(false);
    }
  }, [
    selectedClient?.clientId, 
    selectedCampaignId, 
    selectedVersionId, 
    selectedOngletId,
    sections, 
    tactiques, 
    placements, 
    creatifs,
    refresh, 
    handleClearSelection
  ]);

  const handleDeleteSelected = useCallback(async (itemIds: string[]) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer les ${itemIds.length} éléments sélectionnés ? Cette action est irréversible.`)) {
      return;
    }

    console.log('🗑️ TODO: Implémenter la suppression des éléments:', itemIds);
    // TODO: Implémenter la logique de suppression avec vos vraies fonctions
    handleClearSelection();
    refresh();
  }, [handleClearSelection, refresh]);

  // ==================== 🔥 VOS VRAIES FONCTIONS CRUD RESTAURÉES ====================
  
  // ===== FONCTIONS SECTION =====
  const handleCreateSection = useCallback(async (sectionData: any) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour créer une section');
    }

    try {
      console.log('🔄 Création section...');
      
      const newSectionId = await addSection(
        selectedClient.clientId,
        selectedCampaignId, 
        selectedVersionId,
        selectedOngletId,
        {
          SECTION_Name: sectionData.SECTION_Name || 'Nouvelle section',
          SECTION_Order: sections.length,
          SECTION_Color: sectionData.SECTION_Color || '#6366f1',
          SECTION_Budget: sectionData.SECTION_Budget || 0
        }
      );
      
      console.log('✅ Section créée:', newSectionId);
      return newSectionId;
    } catch (error) {
      console.error('❌ Erreur création section:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections.length]);

  const handleUpdateSection = useCallback(async (sectionId: string, sectionData: any) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour modifier une section');
    }

    try {
      console.log('🔄 Modification section...');
      
      await updateSection(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        sectionData
      );
      
      console.log('✅ Section modifiée');
    } catch (error) {
      console.error('❌ Erreur modification section:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId]);

  const handleDeleteSectionReal = useCallback(async (sectionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette section ? Cette action est irréversible.')) {
      return;
    }

    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour supprimer une section');
    }

    try {
      console.log('🔄 Suppression section...');
      
      await deleteSection(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId
      );
      
      console.log('✅ Section supprimée');
      refresh();
    } catch (error) {
      console.error('❌ Erreur suppression section:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, refresh]);

  // ===== FONCTIONS TACTIQUE =====
  const handleCreateTactiqueReal = useCallback(async (sectionId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour créer une tactique');
    }

    try {
      console.log('🔄 Création tactique...');
      
      const sectionTactiques = tactiques[sectionId] || [];
      
      const newTactiqueId = await addTactique(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        {
          TC_Label: 'Nouvelle tactique',
          TC_Budget: 0,
          TC_Order: sectionTactiques.length,
          TC_Start_Date: new Date().toISOString(),
          TC_End_Date: new Date().toISOString(),
          TC_SectionId: sectionId,
          TC_Unit_Type: '',
          TC_Unit_Count: 0,
          TC_Unit_Cost: 0
        }
      );
      
      console.log('✅ Tactique créée:', newTactiqueId);
      
      // Créer un objet tactique pour le retour
      const newTactique: Tactique = {
        id: newTactiqueId,
        TC_Label: 'Nouvelle tactique',
        TC_Budget: 0,
        TC_Order: sectionTactiques.length,
        TC_Start_Date: new Date().toISOString(),
        TC_End_Date: new Date().toISOString(),
        TC_SectionId: sectionId,
        TC_Unit_Type: '',
        TC_Unit_Count: 0,
        TC_Unit_Cost: 0
      };
      
      return newTactique;
    } catch (error) {
      console.error('❌ Erreur création tactique:', error);
      return {} as Tactique;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, tactiques]);

  const handleUpdateTactiqueReal = useCallback(async (sectionId: string, tactiqueId: string, data: Partial<Tactique>) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour modifier une tactique');
    }

    try {
      console.log('🔄 Modification tactique...');
      
      await updateTactique(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        data
      );
      
      console.log('✅ Tactique modifiée');
      refresh();
    } catch (error) {
      console.error('❌ Erreur modification tactique:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, refresh]);

  const handleDeleteTactiqueReal = useCallback(async (sectionId: string, tactiqueId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tactique ? Cette action est irréversible.')) {
      return;
    }

    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour supprimer une tactique');
    }

    try {
      console.log('🔄 Suppression tactique...');
      
      await deleteTactique(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId
      );
      
      console.log('✅ Tactique supprimée');
      refresh();
    } catch (error) {
      console.error('❌ Erreur suppression tactique:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, refresh]);

  // ===== FONCTIONS PLACEMENT =====
  const handleCreatePlacementReal = useCallback(async (tactiqueId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour créer un placement');
    }

    // Trouver la section qui contient cette tactique
    let sectionId = '';
    for (const section of sections) {
      if (tactiques[section.id]?.some(t => t.id === tactiqueId)) {
        sectionId = section.id;
        break;
      }
    }

    if (!sectionId) {
      throw new Error('Section parent non trouvée pour la tactique');
    }

    try {
      console.log('🔄 Création placement...');
      
      const tactiquesPlacements = placements[tactiqueId] || [];
      const currentTactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
      const currentCampaign = selectedCampaign;
      
      const newPlacementId = await createPlacement(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        {
          PL_Label: 'Nouveau placement',
          PL_Order: tactiquesPlacements.length,
          PL_TactiqueId: tactiqueId,
          PL_Taxonomy_Tags: '',
          PL_Taxonomy_Platform: '',
          PL_Taxonomy_MediaOcean: '',
          PL_Taxonomy_Values: {}
        },
        currentCampaign, // campaignData
        currentTactique  // tactiqueData
      );
      
      console.log('✅ Placement créé:', newPlacementId);
      
      // Créer un objet placement pour le retour
      const newPlacement: Placement = {
        id: newPlacementId,
        PL_Label: 'Nouveau placement',
        PL_Order: tactiquesPlacements.length,
        PL_TactiqueId: tactiqueId,
        PL_Taxonomy_Tags: '',
        PL_Taxonomy_Platform: '',
        PL_Taxonomy_MediaOcean: '',
        PL_Taxonomy_Values: {}
      };
      
      return newPlacement;
    } catch (error) {
      console.error('❌ Erreur création placement:', error);
      return {} as Placement;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections, tactiques, placements, selectedCampaign]);

  const handleUpdatePlacementReal = useCallback(async (placementId: string, data: Partial<Placement>) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour modifier un placement');
    }

    // Trouver la hiérarchie du placement
    let sectionId = '';
    let tactiqueId = '';
    
    for (const section of sections) {
      for (const tactique of (tactiques[section.id] || [])) {
        if (placements[tactique.id]?.some(p => p.id === placementId)) {
          sectionId = section.id;
          tactiqueId = tactique.id;
          break;
        }
      }
      if (tactiqueId) break;
    }

    if (!sectionId || !tactiqueId) {
      throw new Error('Hiérarchie parent non trouvée pour le placement');
    }

    try {
      console.log('🔄 Modification placement...');
      
      const currentTactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
      const currentCampaign = selectedCampaign;
      
      await updatePlacement(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId,
        data,
        currentCampaign, // campaignData
        currentTactique  // tactiqueData
      );
      
      console.log('✅ Placement modifié');
      refresh();
    } catch (error) {
      console.error('❌ Erreur modification placement:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections, tactiques, placements, selectedCampaign, refresh]);

  const handleDeletePlacementReal = useCallback(async (sectionId: string, tactiqueId: string, placementId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce placement ? Cette action est irréversible.')) {
      return;
    }

    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour supprimer un placement');
    }

    try {
      console.log('🔄 Suppression placement...');
      
      await deletePlacement(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId
      );
      
      console.log('✅ Placement supprimé');
      refresh();
    } catch (error) {
      console.error('❌ Erreur suppression placement:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, refresh]);

  // ===== FONCTIONS CRÉATIF =====
  const handleCreateCreatifReal = useCallback(async (placementId: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour créer un créatif');
    }

    // Trouver la hiérarchie du créatif
    let sectionId = '';
    let tactiqueId = '';
    let currentPlacement: Placement | undefined;
    
    for (const section of sections) {
      for (const tactique of (tactiques[section.id] || [])) {
        const placement = placements[tactique.id]?.find(p => p.id === placementId);
        if (placement) {
          sectionId = section.id;
          tactiqueId = tactique.id;
          currentPlacement = placement;
          break;
        }
      }
      if (tactiqueId) break;
    }

    if (!sectionId || !tactiqueId || !currentPlacement) {
      throw new Error('Hiérarchie parent non trouvée pour le créatif');
    }

    try {
      console.log('🔄 Création créatif...');
      
      const placementCreatifs = creatifs[placementId] || [];
      const currentTactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
      const currentCampaign = selectedCampaign;
      
      const newCreatifId = await createCreatif(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId,
        {
          CR_Label: 'Nouveau créatif',
          CR_Order: placementCreatifs.length,
          CR_PlacementId: placementId,
          CR_Taxonomy_Tags: '',
          CR_Taxonomy_Platform: '',
          CR_Taxonomy_MediaOcean: '',
          CR_Taxonomy_Values: {}
        },
        currentCampaign,   // campaignData
        currentTactique,   // tactiqueData
        currentPlacement   // placementData
      );
      
      console.log('✅ Créatif créé:', newCreatifId);
      
      // Créer un objet créatif pour le retour
      const newCreatif: Creatif = {
        id: newCreatifId,
        CR_Label: 'Nouveau créatif',
        CR_Order: placementCreatifs.length,
        CR_PlacementId: placementId,
        CR_Taxonomy_Tags: '',
        CR_Taxonomy_Platform: '',
        CR_Taxonomy_MediaOcean: '',
        CR_Taxonomy_Values: {}
      };
      
      return newCreatif;
    } catch (error) {
      console.error('❌ Erreur création créatif:', error);
      return {} as Creatif;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections, tactiques, placements, creatifs, selectedCampaign]);

  const handleUpdateCreatifReal = useCallback(async (creatifId: string, data: Partial<Creatif>) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour modifier un créatif');
    }

    // Trouver la hiérarchie du créatif
    let sectionId = '';
    let tactiqueId = '';
    let placementId = '';
    let currentPlacement: Placement | undefined;
    
    for (const section of sections) {
      for (const tactique of (tactiques[section.id] || [])) {
        for (const placement of (placements[tactique.id] || [])) {
          if (creatifs[placement.id]?.some(c => c.id === creatifId)) {
            sectionId = section.id;
            tactiqueId = tactique.id;
            placementId = placement.id;
            currentPlacement = placement;
            break;
          }
        }
        if (placementId) break;
      }
      if (placementId) break;
    }

    if (!sectionId || !tactiqueId || !placementId || !currentPlacement) {
      throw new Error('Hiérarchie parent non trouvée pour le créatif');
    }

    try {
      console.log('🔄 Modification créatif...');
      
      const currentTactique = tactiques[sectionId]?.find(t => t.id === tactiqueId);
      const currentCampaign = selectedCampaign;
      
      await updateCreatif(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId,
        creatifId,
        data,
        currentCampaign,   // campaignData
        currentTactique,   // tactiqueData
        currentPlacement   // placementData
      );
      
      console.log('✅ Créatif modifié');
      refresh();
    } catch (error) {
      console.error('❌ Erreur modification créatif:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, sections, tactiques, placements, creatifs, selectedCampaign, refresh]);

  const handleDeleteCreatifReal = useCallback(async (sectionId: string, tactiqueId: string, placementId: string, creatifId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créatif ? Cette action est irréversible.')) {
      return;
    }

    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId || !selectedOngletId) {
      throw new Error('Contexte manquant pour supprimer un créatif');
    }

    try {
      console.log('🔄 Suppression créatif...');
      
      await deleteCreatif(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        selectedOngletId,
        sectionId,
        tactiqueId,
        placementId,
        creatifId
      );
      
      console.log('✅ Créatif supprimé');
      refresh();
    } catch (error) {
      console.error('❌ Erreur suppression créatif:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, selectedOngletId, refresh]);

  // ===== FONCTIONS ONGLET =====
  const handleAddOngletReal = useCallback(async () => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error('Contexte manquant pour créer un onglet');
    }

    try {
      console.log('🔄 Création onglet...');
      
      const newOngletId = await addOnglet(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        {
          ONGLET_Name: 'Nouvel onglet',
          ONGLET_Order: onglets.length
        }
      );
      
      console.log('✅ Onglet créé:', newOngletId);
      refresh();
    } catch (error) {
      console.error('❌ Erreur création onglet:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, onglets.length, refresh]);

  const handleRenameOngletReal = useCallback(async (ongletId: string, newName?: string) => {
    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error('Contexte manquant pour renommer un onglet');
    }

    const finalName = newName || prompt('Nouveau nom de l\'onglet:');
    if (!finalName) return;

    try {
      console.log('🔄 Renommage onglet...');
      
      await updateOnglet(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        ongletId,
        { ONGLET_Name: finalName }
      );
      
      console.log('✅ Onglet renommé');
      refresh();
    } catch (error) {
      console.error('❌ Erreur renommage onglet:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, refresh]);

  const handleDeleteOngletReal = useCallback(async (ongletId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet onglet ? Toutes ses données seront perdues.')) {
      return;
    }

    if (!selectedClient?.clientId || !selectedCampaignId || !selectedVersionId) {
      throw new Error('Contexte manquant pour supprimer un onglet');
    }

    try {
      console.log('🔄 Suppression onglet...');
      
      await deleteOnglet(
        selectedClient.clientId,
        selectedCampaignId,
        selectedVersionId,
        ongletId
      );
      
      console.log('✅ Onglet supprimé');
      refresh();
    } catch (error) {
      console.error('❌ Erreur suppression onglet:', error);
      throw error;
    }
  }, [selectedClient?.clientId, selectedCampaignId, selectedVersionId, refresh]);

  // ===== GESTIONNAIRES MODAL SECTION =====
  const handleSaveSection = useCallback(async (sectionData: any) => {
    try {
      if (sectionModal.mode === 'create') {
        await handleCreateSection(sectionData);
      } else if (sectionModal.mode === 'edit' && sectionModal.section) {
        await handleUpdateSection(sectionModal.section.id, sectionData);
      }
      
      setSectionModal({ isOpen: false, section: null, mode: 'create' });
      refresh();
    } catch (error) {
      console.error('❌ Erreur sauvegarde section:', error);
      // Garder le modal ouvert en cas d'erreur
    }
  }, [sectionModal.mode, sectionModal.section, handleCreateSection, handleUpdateSection, refresh]);
  
  const closeSectionModal = useCallback(() => {
    setSectionModal({ isOpen: false, section: null, mode: 'create' });
  }, []);
  
  const handleSectionExpand = useCallback((sectionId: string) => {
    setSectionExpansions(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);
  
  const handleAddSection = useCallback(() => {
    setSectionModal({ isOpen: true, section: null, mode: 'create' });
  }, []);
  
  const handleEditSection = useCallback((sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setSectionModal({ isOpen: true, section, mode: 'edit' });
    }
  }, [sections]);

  // ==================== PRÉPARATION DES DONNÉES ====================

  const sectionsWithTactiques: SectionWithTactiques[] = useMemo(() => {
    return sections.map(section => {
      const sectionTactiques = tactiques[section.id] || [];
      
      const calculatedSectionBudget = sectionTactiques.reduce((total, tactique) => {
        return total + (tactique.TC_Budget || 0);
      }, 0);
      
      const mappedTactiques = sectionTactiques.map(tactique => {
        const tactiquePlacements = placements[tactique.id] || [];
        
        const mappedPlacements = tactiquePlacements.map(placement => {
          const placementCreatifs = creatifs[placement.id] || [];
          
          const mappedCreatifs = placementCreatifs.map(creatif => ({
            ...creatif,
            isSelected: selectedItems.has(creatif.id)
          }));

          const isPlacementSelected = selectedItems.has(placement.id) || 
                                      (mappedCreatifs.length > 0 && mappedCreatifs.every(c => c.isSelected));

          return {
            ...placement,
            creatifs: mappedCreatifs,
            isSelected: isPlacementSelected
          };
        });

        const isTactiqueSelected = selectedItems.has(tactique.id) || 
                                   (mappedPlacements.length > 0 && mappedPlacements.every(p => p.isSelected));

        return {
          ...tactique,
          placements: mappedPlacements,
          isSelected: isTactiqueSelected
        };
      });

      const isSectionSelected = selectedItems.has(section.id) ||
                                (mappedTactiques.length > 0 && mappedTactiques.every(t => t.isSelected));

      return {
        ...section,
        SECTION_Budget: calculatedSectionBudget,
        tactiques: mappedTactiques,
        isSelected: isSectionSelected,
        isExpanded: sectionExpansions[section.id] || false
      };
    });
  }, [sections, tactiques, placements, creatifs, selectedItems, sectionExpansions]);

  // Données enrichies pour les composants
  const enrichedPlacements = useMemo(() => {
    const result: { [tactiqueId: string]: Placement[] } = {};
    sectionsWithTactiques.forEach(section => {
      section.tactiques.forEach(tactique => {
        if (tactique.placements) {
          result[tactique.id] = tactique.placements;
        }
      });
    });
    return result;
  }, [sectionsWithTactiques]);

  const enrichedCreatifs = useMemo(() => {
    const result: { [placementId: string]: Creatif[] } = {};
    sectionsWithTactiques.forEach(section => {
      section.tactiques.forEach(tactique => {
        if (tactique.placements) {
          tactique.placements.forEach(placement => {
            if (placement.creatifs) {
              result[placement.id] = placement.creatifs;
            }
          });
        }
      });
    });
    return result;
  }, [sectionsWithTactiques]);

  const sectionNames = useMemo(() => {
    return sections.reduce((names, section) => {
      names[section.id] = section.SECTION_Name;
      return names;
    }, {} as Record<string, string>);
  }, [sections]);

  const flatTactiques = useMemo(() => {
    return Object.values(tactiques).flat();
  }, [tactiques]);

  // Contexte hiérarchique pour le déplacement
  const hierarchyContextForMove = useMemo(() => {
    return {
      sections: sections,
      tactiques: tactiques,
      placements: placements,
      creatifs: creatifs
    };
  }, [sections, tactiques, placements, creatifs]);

  // Items sélectionnés avec données
  const selectedItemsWithData = useMemo(() => {
    const result: Array<{
      id: string;
      name: string;
      type: 'section' | 'tactique' | 'placement' | 'creatif';
      data?: Section | Tactique | Placement | Creatif;
    }> = [];

    Array.from(selectedItems).forEach(itemId => {
      for (const section of sectionsWithTactiques) {
        if (section.id === itemId) {
          result.push({
            id: itemId,
            name: section.SECTION_Name,
            type: 'section',
            data: section
          });
          return;
        }
        
        for (const tactique of section.tactiques) {
          if (tactique.id === itemId) {
            result.push({
              id: itemId,
              name: tactique.TC_Label,
              type: 'tactique',
              data: tactique
            });
            return;
          }
          
          if (tactique.placements) {
            for (const placement of tactique.placements) {
              if (placement.id === itemId) {
                result.push({
                  id: itemId,
                  name: placement.PL_Label,
                  type: 'placement',
                  data: placement
                });
                return;
              }
              
              if (placement.creatifs) {
                for (const creatif of placement.creatifs) {
                  if (creatif.id === itemId) {
                    result.push({
                      id: itemId,
                      name: creatif.CR_Label,
                      type: 'creatif',
                      data: creatif
                    });
                    return;
                  }
                }
              }
            }
          }
        }
      }
    });

    return result;
  }, [selectedItems, sectionsWithTactiques]);

  // ==================== GESTION D'ERREUR ET CHARGEMENT ====================

  const hasError = !!error;
  const isLoading = loading || duplicationLoading || clientFeesLoading;
  const shouldShowFullLoader = loading && !selectedOnglet;
  const shouldShowTopIndicator = loading && !!selectedOnglet;

  // ==================== CLASSES CSS ====================

  const getContainerClasses = () => {
    return "space-y-6 pb-16 px-3";
  };

  const getContentClasses = () => {
    if (viewMode === 'table') {
      return "w-full";
    } else {
      return "w-full flex";
    }
  };

  const getMainContentClasses = () => {
    if (viewMode === 'table') {
      return "w-full";
    } else {
      return "flex-1 mr-4";
    }
  };

  // ==================== RENDU ====================

  return (
    <div className={getContainerClasses()}>
      
      {/* ==================== EN-TÊTE ==================== */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tactiques</h1>
      </div>

      {/* ==================== SÉLECTEUR CAMPAGNE/VERSION ==================== */}
      <CampaignVersionSelector
        campaigns={campaigns}
        versions={versions}
        selectedCampaign={selectedCampaign}
        selectedVersion={selectedVersion}
        loading={loading}
        error={error}
        onCampaignChange={handleCampaignChange}
        onVersionChange={handleVersionChange}
        className="mb-6"
      />

      {/* ==================== INDICATEURS DE CHARGEMENT ==================== */}
      
      {shouldShowTopIndicator && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span className="text-sm text-indigo-700">{stage || 'Actualisation en cours...'}</span>
          </div>
        </div>
      )}

      {duplicationLoading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            <span className="text-sm text-green-700">Duplication en cours...</span>
          </div>
        </div>
      )}

      {clientFeesLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Chargement des frais du client...</span>
          </div>
        </div>
      )}

      {/* ==================== AFFICHAGE D'ERREUR ==================== */}
      {hasError && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-red-600">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Erreur de chargement</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={refresh}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CHARGEMENT COMPLET ==================== */}
      {shouldShowFullLoader && (
        <LoadingSpinner 
          message={stage || "Chargement des tactiques..."} 
          minimumDuration={1500}
        />
      )}

      {/* ==================== CONTENU PRINCIPAL ==================== */}
      {selectedVersion && !shouldShowFullLoader && (
        <div className={getContentClasses()}>
          
          {/* Zone de contenu principal */}
          <div className={getMainContentClasses()}>
            
            {/* Panel d'actions groupées */}
            {selectedItems.size > 0 && viewMode === 'hierarchy' && (
              <SelectedActionsPanel
                selectedItems={selectedItemsWithData}
                onDuplicateSelected={handleDuplicateSelected}
                onDeleteSelected={handleDeleteSelected}
                onClearSelection={handleClearSelection}
                onRefresh={refresh}
                loading={isLoading}
                hierarchyContext={hierarchyContextForMove}
              />
            )}
            
            {/* Barre d'outils */}
            {(viewMode === 'hierarchy' || viewMode === 'timeline') && (
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddSection}
                    className="flex items-center px-3 py-1.5 rounded text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                  >
                    <PlusIcon className="h-5 w-5 mr-1.5" />
                    Nouvelle section
                  </button>
                </div>

                {/* Statistiques */}
                {sectionsWithTactiques.length > 0 && (
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      {Object.values(placements).reduce((total, tacticPlacements) => total + tacticPlacements.length, 0)} placement{Object.values(placements).reduce((total, tacticPlacements) => total + tacticPlacements.length, 0) !== 1 ? 's' : ''}
                    </span>
                    <span>
                      {Object.values(creatifs).reduce((total, placementCreatifs) => total + placementCreatifs.length, 0)} créatif{Object.values(creatifs).reduce((total, placementCreatifs) => total + placementCreatifs.length, 0) !== 1 ? 's' : ''}
                    </span>
                    {selectedItems.size > 0 && (
                      <span className="text-indigo-600 font-medium">
                        {selectedItems.size} sélectionné{selectedItems.size > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Contenu selon le mode de vue */}
            {!hasError && (
              <>
                {viewMode === 'hierarchy' && (
                  <>
                     {sectionsWithTactiques.length > 0 ? (
                    <TactiquesHierarchyView
                      sections={sectionsWithTactiques}
                      placements={enrichedPlacements} 
                      creatifs={enrichedCreatifs} 
                      onSectionExpand={handleSectionExpand}
                      onEditSection={handleEditSection}
                      onDeleteSection={handleDeleteSectionReal}
                      onCreateTactique={handleCreateTactiqueReal}
                      onUpdateTactique={handleUpdateTactiqueReal}
                      onDeleteTactique={handleDeleteTactiqueReal}
                      onCreatePlacement={handleCreatePlacementReal}
                      onUpdatePlacement={handleUpdatePlacementReal}
                      onDeletePlacement={handleDeletePlacementReal}
                      onCreateCreatif={handleCreateCreatifReal}
                      onUpdateCreatif={handleUpdateCreatifReal}
                      onDeleteCreatif={handleDeleteCreatifReal}
                      formatCurrency={formatCurrency}
                      totalBudget={totalBudget}
                      onRefresh={refresh}
                      onSelectItems={handleSelectItems}
                      onDuplicateSelected={handleDuplicateSelected}
                      onDeleteSelected={handleDeleteSelected}
                      onClearSelection={handleClearSelection}
                      loading={isLoading}
                      hierarchyContext={hierarchyContextForMove}
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

                {viewMode === 'table' && (
                  <div className="w-full">
                    <TactiquesAdvancedTableView
                      sections={sections}
                      tactiques={tactiques}
                      placements={placements}
                      creatifs={creatifs}
                      onUpdateTactique={handleUpdateTactiqueReal}
                      onUpdateSection={async (sectionId: string, data: Partial<Section>) => {
                        await handleUpdateSection(sectionId, data);
                      }}
                      onUpdatePlacement={handleUpdatePlacementReal}
                      onUpdateCreatif={handleUpdateCreatifReal}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                )}

                {viewMode === 'timeline' && selectedCampaign && (
                  <TactiquesTimelineView
                    tactiques={flatTactiques}
                    sectionNames={sectionNames}
                    campaignStartDate={selectedCampaign.CA_Start_Date}
                    campaignEndDate={selectedCampaign.CA_End_Date}
                    formatCurrency={formatCurrency}
                    onEditTactique={(tactiqueId, sectionId) => {
                      const tactique = flatTactiques.find(t => t.id === tactiqueId);
                      if (tactique) {
                        console.log('Éditer tactique:', tactique);
                      }
                    }}
                  />
                )}
              </>
            )}
          </div>

          {/* Budget Panel */}
          {(viewMode === 'hierarchy' || viewMode === 'timeline') && (
            <TactiquesBudgetPanel
              selectedCampaign={selectedCampaign}
              sections={sections}
              tactiques={tactiques}
              selectedOnglet={selectedOnglet}
              onglets={onglets}
              formatCurrency={formatCurrency}
              clientFees={clientFees}
            />
          )}
        </div>
      )}

      {/* Message si aucune version sélectionnée */}
      {!shouldShowFullLoader && !hasError && !selectedVersion && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">
            Veuillez sélectionner une campagne et une version pour voir les tactiques.
          </p>
        </div>
      )}

      {/* Footer avec onglets et boutons de vue */}
      {selectedOnglet && !shouldShowFullLoader && (
        <TactiquesFooter
          viewMode={viewMode}
          setViewMode={setViewMode}
          onglets={onglets}
          selectedOnglet={selectedOnglet}
          onSelectOnglet={handleOngletChange}
          onAddOnglet={handleAddOngletReal} 
          onRenameOnglet={handleRenameOngletReal} 
          onDeleteOnglet={handleDeleteOngletReal} 
        />
      )}

      {/* Modal de section */}
      <SectionModal
        isOpen={sectionModal.isOpen}
        onClose={closeSectionModal}
        onSave={handleSaveSection}
        section={sectionModal.section}
        mode={sectionModal.mode}
      />
    </div>
  );
}