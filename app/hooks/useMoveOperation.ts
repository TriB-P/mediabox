// app/hooks/useMoveOperation.ts - VERSION CORRIGÉE COMPLÈTE

import { useState, useCallback, useMemo } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import {
  MoveModalState,
  SelectionAnalysis,
  SelectedItemWithSource,
  MoveDestination,
  MoveOperation,
  MoveValidationResult,
  MoveResult,
  CascadeLevel,
  CascadeItem,
  MoveItemType,
  MOVE_LEVEL_HIERARCHY,
  MOVE_LEVEL_LABELS,
  TARGET_LEVEL_LABELS,
  UseMoveOperationReturn
} from '../types/move';
import { Section, Tactique, Placement, Creatif } from '../types/tactiques';
import { moveItems, validateMoveDestination } from '../lib/moveService';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

// ==================== ÉTAT INITIAL DU MODAL ====================

const createInitialCascadeLevel = (): CascadeLevel => ({
  level: 'campaign',
  isRequired: true,
  isVisible: true,
  items: [],
  selectedId: null,
  loading: false,
  searchTerm: ''
});

const createInitialModalState = (): MoveModalState => ({
  isOpen: false,
  step: 'destination',
  selection: null,
  destination: {},
  cascadeLevels: {
    campaign: { ...createInitialCascadeLevel(), level: 'campaign' },
    version: { ...createInitialCascadeLevel(), level: 'version', isVisible: false },
    onglet: { ...createInitialCascadeLevel(), level: 'onglet', isVisible: false },
    section: { ...createInitialCascadeLevel(), level: 'section', isVisible: false },
    tactique: { ...createInitialCascadeLevel(), level: 'tactique', isVisible: false },
    placement: { ...createInitialCascadeLevel(), level: 'placement', isVisible: false }
  },
  validation: null,
  operation: null,
  result: null,
  loading: false,
  error: null
});

// ==================== HOOK PRINCIPAL ====================

export function useMoveOperation(): UseMoveOperationReturn {
  const { selectedClient } = useClient();
  const { selectedCampaignId, selectedVersionId, selectedOngletId } = useSelection();
  
  const [modalState, setModalState] = useState<MoveModalState>(createInitialModalState());

  // ==================== FONCTIONS UTILITAIRES DE VALIDATION ====================

  const isChildOf = useCallback((child: SelectedItemWithSource, parent: SelectedItemWithSource): boolean => {
    // Une section ne peut pas être enfant d'une autre section
    if (child.type === 'section') return false;
    
    // Une tactique est enfant d'une section
    if (child.type === 'tactique' && parent.type === 'section') {
      return child.parentPath[0] === parent.id;
    }
    
    // Un placement est enfant d'une tactique ou d'une section (via sa tactique)
    if (child.type === 'placement') {
      if (parent.type === 'tactique') {
        return child.parentPath[1] === parent.id;
      }
      if (parent.type === 'section') {
        return child.parentPath[0] === parent.id;
      }
    }
    
    // Un créatif est enfant d'un placement, d'une tactique ou d'une section
    if (child.type === 'creatif') {
      if (parent.type === 'placement') {
        return child.parentPath[2] === parent.id;
      }
      if (parent.type === 'tactique') {
        return child.parentPath[1] === parent.id;
      }
      if (parent.type === 'section') {
        return child.parentPath[0] === parent.id;
      }
    }
    
    return false;
  }, []);

  const checkHierarchicalConflictInRoots = useCallback((rootElements: SelectedItemWithSource[]): boolean => {
    // Vérifier qu'aucun élément racine n'est parent ou enfant d'un autre élément racine
    for (let i = 0; i < rootElements.length; i++) {
      for (let j = i + 1; j < rootElements.length; j++) {
        if (isChildOf(rootElements[i], rootElements[j]) || isChildOf(rootElements[j], rootElements[i])) {
          console.warn('🚨 Conflit hiérarchique détecté entre:', rootElements[i], rootElements[j]);
          return true;
        }
      }
    }
    return false;
  }, [isChildOf]);

  // ==================== ANALYSE DE SÉLECTION CORRIGÉE ====================

  const analyzeSelection = useCallback((selectedItems: any[]): SelectionAnalysis => {
    console.log('🔍 Analyse de sélection:', selectedItems);

    if (!selectedItems || selectedItems.length === 0) {
      return {
        isValid: false,
        canMove: false,
        rootElements: [],
        allElements: [],
        moveLevel: 'section',
        targetLevel: 'onglet',
        totalItemsToMove: 0,
        errorMessage: 'Aucun élément sélectionné'
      };
    }

    // ========== PHASE 1: CONVERSION DES ÉLÉMENTS ==========
    
    const convertedElements: SelectedItemWithSource[] = selectedItems.map(item => {
      let itemType: MoveItemType;
      let parentPath: string[] = [];
      let actualItem: Section | Tactique | Placement | Creatif;
      let selectionSource: 'direct' | 'automatic' = 'direct';

      // Vérifier d'abord si l'objet a déjà une propriété 'type'
      if (item.type) {
        itemType = item.type as MoveItemType;
        actualItem = { id: item.id, ...item } as any;
        
        // Parent path basé sur le type
        switch (itemType) {
          case 'section':
            parentPath = [];
            break;
          case 'tactique':
            parentPath = [item.TC_SectionId || ''];
            break;
          case 'placement':
            parentPath = [item.PL_SectionId || '', item.PL_TactiqueId || ''];
            break;
          case 'creatif':
            parentPath = [item.CR_SectionId || '', item.CR_TactiqueId || '', item.CR_PlacementId || ''];
            break;
        }
      }
      // Fallback: détecter le type par les propriétés
      else if ('SECTION_Name' in item) {
        itemType = 'section';
        parentPath = [];
        actualItem = item as Section;
      } else if ('TC_Label' in item) {
        itemType = 'tactique';
        parentPath = [item.TC_SectionId || ''];
        actualItem = item as Tactique;
      } else if ('PL_Label' in item) {
        itemType = 'placement';
        parentPath = [item.PL_SectionId || '', item.PL_TactiqueId || ''];
        actualItem = item as Placement;
      } else if ('CR_Label' in item) {
        itemType = 'creatif';
        parentPath = [item.CR_SectionId || '', item.CR_TactiqueId || '', item.CR_PlacementId || ''];
        actualItem = item as Creatif;
      } else {
        // Déduction par les clés
        const keys = Object.keys(item);
        console.warn('🚨 Type d\'élément non reconnu, tentative de déduction:', item);
        
        if (keys.includes('SECTION_Name') || keys.includes('SECTION_Order')) {
          itemType = 'section';
          parentPath = [];
        } else if (keys.includes('TC_Label') || keys.includes('TC_Budget')) {
          itemType = 'tactique';
          parentPath = [item.TC_SectionId || ''];
        } else if (keys.includes('PL_Label') || keys.includes('PL_TactiqueId')) {
          itemType = 'placement';
          parentPath = [item.PL_SectionId || '', item.PL_TactiqueId || ''];
        } else if (keys.includes('CR_Label') || keys.includes('CR_PlacementId')) {
          itemType = 'creatif';
          parentPath = [item.CR_SectionId || '', item.CR_TactiqueId || '', item.CR_PlacementId || ''];
        } else {
          throw new Error(`Type d'élément non reconnu après déduction: ${JSON.stringify(item)}`);
        }
        
        actualItem = { id: item.id, ...item } as any;
      }

      return {
        id: item.id,
        type: itemType,
        selectionSource,
        parentPath,
        item: actualItem
      };
    });

    // ========== PHASE 2: IDENTIFICATION DES ÉLÉMENTS RACINES ==========
    
    // 🔥 CORRECTION PRINCIPALE: Un élément est racine s'il n'est pas enfant d'un autre élément sélectionné
    const rootElements = convertedElements.filter(element => {
      return !convertedElements.some(otherElement => {
        if (otherElement.id === element.id) return false;
        return isChildOf(element, otherElement);
      });
    });

    console.log('🌳 Éléments racines identifiés:', rootElements);
    console.log('📊 Répartition par type:', {
      total: convertedElements.length,
      roots: rootElements.length,
      typeDistribution: rootElements.reduce((acc, el) => {
        acc[el.type] = (acc[el.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

    // ========== PHASE 3: VALIDATION ==========
    
    // Vérifier qu'on a au moins un élément racine
    if (rootElements.length === 0) {
      return {
        isValid: false,
        canMove: false,
        rootElements,
        allElements: convertedElements,
        moveLevel: 'section',
        targetLevel: 'onglet',
        totalItemsToMove: convertedElements.length,
        errorMessage: 'Aucun élément racine identifié'
      };
    }

    // 🔥 VALIDATION CORRIGÉE: Seuls les éléments racines doivent être du même type
    const rootTypes = new Set(rootElements.map(el => el.type));
    if (rootTypes.size > 1) {
      return {
        isValid: false,
        canMove: false,
        rootElements,
        allElements: convertedElements,
        moveLevel: 'section',
        targetLevel: 'onglet',
        totalItemsToMove: convertedElements.length,
        errorMessage: `Impossible de déplacer des éléments racines de types différents (${Array.from(rootTypes).join(', ')})`
      };
    }

    const moveLevel = rootElements[0]?.type || 'section';
    const targetLevel = MOVE_LEVEL_HIERARCHY[moveLevel];

    // ========== PHASE 4: VALIDATION HIÉRARCHIQUE ==========
    
    // 🔥 VALIDATION AMÉLIORÉE: Vérifier les conflits hiérarchiques entre les racines uniquement
    const hasHierarchicalConflict = checkHierarchicalConflictInRoots(rootElements);
    if (hasHierarchicalConflict) {
      return {
        isValid: false,
        canMove: false,
        rootElements,
        allElements: convertedElements,
        moveLevel,
        targetLevel,
        totalItemsToMove: convertedElements.length,
        errorMessage: 'Les éléments racines sélectionnés ont des relations hiérarchiques conflictuelles'
      };
    }

    // ========== PHASE 5: RÉSULTAT FINAL ==========
    
    console.log('✅ Analyse terminée avec succès:', {
      rootElements: rootElements.length,
      totalElements: convertedElements.length,
      moveLevel,
      targetLevel
    });

    return {
      isValid: true,
      canMove: true,
      rootElements,
      allElements: convertedElements,
      moveLevel,
      targetLevel,
      totalItemsToMove: convertedElements.length
    };
  }, [isChildOf, checkHierarchicalConflictInRoots]);

  // ==================== FONCTIONS UTILITAIRES POUR L'UI ====================

  const canMoveSelection = useCallback((selectedItems: any[]): boolean => {
    const analysis = analyzeSelection(selectedItems);
    return analysis.canMove;
  }, [analyzeSelection]);

  const getMoveButtonLabel = useCallback((selectedItems: any[]): string => {
    const analysis = analyzeSelection(selectedItems);
    
    if (!analysis.canMove) {
      return analysis.errorMessage || 'Sélection invalide';
    }

    const rootCount = analysis.rootElements.length;
    const totalCount = analysis.totalItemsToMove;
    const itemLabel = MOVE_LEVEL_LABELS[analysis.moveLevel];
    const targetLabel = TARGET_LEVEL_LABELS[analysis.targetLevel];
    
    // Si on déplace des éléments avec leurs enfants
    if (totalCount > rootCount) {
      return `Déplacer ${rootCount} ${itemLabel} (${totalCount} éléments au total) vers ${targetLabel}`;
    }
    
    // Si on déplace seulement les éléments racines
    return `Déplacer ${rootCount} ${itemLabel} vers ${targetLabel}`;
  }, [analyzeSelection]);

  // ==================== GESTION DU MODAL ====================

  const openMoveModal = useCallback((selection: SelectionAnalysis) => {
    console.log('🚀 Ouverture du modal de déplacement', selection);
    
    // Réinitialiser l'état du modal
    const newModalState = createInitialModalState();
    newModalState.isOpen = true;
    newModalState.selection = selection;
    
    // Configurer les niveaux de cascade selon le type de destination
    const targetLevel = selection.targetLevel;
    
    // Campagne toujours visible pour choisir la destination
    newModalState.cascadeLevels.campaign.isVisible = true;
    newModalState.cascadeLevels.campaign.loading = true;
    
    // Version toujours visible (on a besoin de choisir une version)
    newModalState.cascadeLevels.version.isVisible = true;
    
    // Onglet visible pour tous les types de destination
    newModalState.cascadeLevels.onglet.isVisible = ['onglet', 'section', 'tactique', 'placement'].includes(targetLevel);
    
    // Section visible si on déplace vers section, tactique ou placement
    newModalState.cascadeLevels.section.isVisible = ['section', 'tactique', 'placement'].includes(targetLevel);
    
    // Tactique visible si on déplace vers tactique ou placement
    newModalState.cascadeLevels.tactique.isVisible = ['tactique', 'placement'].includes(targetLevel);
    
    // Placement visible seulement si on déplace des créatifs
    newModalState.cascadeLevels.placement.isVisible = targetLevel === 'placement';
    
    setModalState(newModalState);
    
    // Charger immédiatement les campagnes
    loadCampaigns();
  }, []);

  const closeMoveModal = useCallback(() => {
    console.log('❌ Fermeture du modal de déplacement');
    setModalState(createInitialModalState());
  }, []);

  // app/hooks/useMoveOperation.ts - PARTIE 2: CHARGEMENT DES DONNÉES ET VALIDATION

  // ==================== CHARGEMENT DES DONNÉES DE CASCADE ====================

  const loadCampaigns = useCallback(async () => {
    if (!selectedClient?.clientId) return;
    
    setModalState(prev => ({
      ...prev,
      cascadeLevels: {
        ...prev.cascadeLevels,
        campaign: { ...prev.cascadeLevels.campaign, loading: true }
      }
    }));
    
    try {
      const campaignsRef = collection(db, 'clients', selectedClient.clientId, 'campaigns');
      const q = query(campaignsRef, orderBy('CA_Name', 'asc'));
      const snapshot = await getDocs(q);
      
      const campaigns: CascadeItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.CA_Name || 'Campagne sans nom',
          description: `${data.CA_Status || ''} • Budget: ${data.CA_Budget || 0}`,
          metadata: data
        };
      });
      
      setModalState(prev => ({
        ...prev,
        cascadeLevels: {
          ...prev.cascadeLevels,
          campaign: {
            ...prev.cascadeLevels.campaign,
            items: campaigns,
            loading: false
          }
        }
      }));
      
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
      setModalState(prev => ({
        ...prev,
        cascadeLevels: {
          ...prev.cascadeLevels,
          campaign: { ...prev.cascadeLevels.campaign, loading: false }
        },
        error: 'Erreur lors du chargement des campagnes'
      }));
    }
  }, [selectedClient?.clientId]);

  const loadVersions = useCallback(async (campaignId: string) => {
    if (!selectedClient?.clientId) return;
    
    setModalState(prev => ({
      ...prev,
      cascadeLevels: {
        ...prev.cascadeLevels,
        version: { ...prev.cascadeLevels.version, loading: true }
      }
    }));
    
    try {
      const versionsRef = collection(db, 'clients', selectedClient.clientId, 'campaigns', campaignId, 'versions');
      const q = query(versionsRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      const versions: CascadeItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Version sans nom',
          description: data.isOfficial ? 'Version officielle' : 'Brouillon',
          metadata: data
        };
      });
      
      setModalState(prev => ({
        ...prev,
        cascadeLevels: {
          ...prev.cascadeLevels,
          version: {
            ...prev.cascadeLevels.version,
            items: versions,
            loading: false
          }
        }
      }));
      
    } catch (error) {
      console.error('Erreur chargement versions:', error);
      setModalState(prev => ({
        ...prev,
        cascadeLevels: {
          ...prev.cascadeLevels,
          version: { ...prev.cascadeLevels.version, loading: false }
        },
        error: 'Erreur lors du chargement des versions'
      }));
    }
  }, [selectedClient?.clientId]);

  const loadOnglets = useCallback(async (campaignId: string, versionId: string) => {
    if (!selectedClient?.clientId) return;
    
    setModalState(prev => ({
      ...prev,
      cascadeLevels: {
        ...prev.cascadeLevels,
        onglet: { ...prev.cascadeLevels.onglet, loading: true }
      }
    }));
    
    try {
      const ongletsRef = collection(db, 'clients', selectedClient.clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets');
      const q = query(ongletsRef, orderBy('ONGLET_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      const onglets: CascadeItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.ONGLET_Name || 'Onglet sans nom',
          description: `Ordre: ${data.ONGLET_Order || 0}`,
          metadata: data
        };
      });
      
      setModalState(prev => ({
        ...prev,
        cascadeLevels: {
          ...prev.cascadeLevels,
          onglet: {
            ...prev.cascadeLevels.onglet,
            items: onglets,
            loading: false
          }
        }
      }));
      
    } catch (error) {
      console.error('Erreur chargement onglets:', error);
      setModalState(prev => ({
        ...prev,
        cascadeLevels: {
          ...prev.cascadeLevels,
          onglet: { ...prev.cascadeLevels.onglet, loading: false }
        },
        error: 'Erreur lors du chargement des onglets'
      }));
    }
  }, [selectedClient?.clientId]);

  const loadSections = useCallback(async (campaignId: string, versionId: string, ongletId: string) => {
    if (!selectedClient?.clientId) return;
    
    setModalState(prev => ({
      ...prev,
      cascadeLevels: {
        ...prev.cascadeLevels,
        section: { ...prev.cascadeLevels.section, loading: true }
      }
    }));
    
    try {
      const sectionsRef = collection(db, 'clients', selectedClient.clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections');
      const q = query(sectionsRef, orderBy('SECTION_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      const sections: CascadeItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.SECTION_Name || 'Section sans nom',
          description: `Budget: ${data.SECTION_Budget || 0}`,
          metadata: data
        };
      });
      
      setModalState(prev => ({
        ...prev,
        cascadeLevels: {
          ...prev.cascadeLevels,
          section: {
            ...prev.cascadeLevels.section,
            items: sections,
            loading: false
          }
        }
      }));
      
    } catch (error) {
      console.error('Erreur chargement sections:', error);
      setModalState(prev => ({
        ...prev,
        cascadeLevels: {
          ...prev.cascadeLevels,
          section: { ...prev.cascadeLevels.section, loading: false }
        },
        error: 'Erreur lors du chargement des sections'
      }));
    }
  }, [selectedClient?.clientId]);

  const loadTactiques = useCallback(async (campaignId: string, versionId: string, ongletId: string, sectionId: string) => {
    if (!selectedClient?.clientId) return;
    
    setModalState(prev => ({
      ...prev,
      cascadeLevels: {
        ...prev.cascadeLevels,
        tactique: { ...prev.cascadeLevels.tactique, loading: true }
      }
    }));
    
    try {
      const tactiquesRef = collection(db, 'clients', selectedClient.clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques');
      const q = query(tactiquesRef, orderBy('TC_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      const tactiques: CascadeItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.TC_Label || 'Tactique sans nom',
          description: `Budget: ${data.TC_Budget || 0}`,
          metadata: data
        };
      });
      
      setModalState(prev => ({
        ...prev,
        cascadeLevels: {
          ...prev.cascadeLevels,
          tactique: {
            ...prev.cascadeLevels.tactique,
            items: tactiques,
            loading: false
          }
        }
      }));
      
    } catch (error) {
      console.error('Erreur chargement tactiques:', error);
      setModalState(prev => ({
        ...prev,
        cascadeLevels: {
          ...prev.cascadeLevels,
          tactique: { ...prev.cascadeLevels.tactique, loading: false }
        },
        error: 'Erreur lors du chargement des tactiques'
      }));
    }
  }, [selectedClient?.clientId]);

  const loadPlacements = useCallback(async (campaignId: string, versionId: string, ongletId: string, sectionId: string, tactiqueId: string) => {
    if (!selectedClient?.clientId) return;
    
    setModalState(prev => ({
      ...prev,
      cascadeLevels: {
        ...prev.cascadeLevels,
        placement: { ...prev.cascadeLevels.placement, loading: true }
      }
    }));
    
    try {
      const placementsRef = collection(db, 'clients', selectedClient.clientId, 'campaigns', campaignId, 'versions', versionId, 'onglets', ongletId, 'sections', sectionId, 'tactiques', tactiqueId, 'placements');
      const q = query(placementsRef, orderBy('PL_Order', 'asc'));
      const snapshot = await getDocs(q);
      
      const placements: CascadeItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.PL_Label || 'Placement sans nom',
          description: `Ordre: ${data.PL_Order || 0}`,
          metadata: data
        };
      });
      
      setModalState(prev => ({
        ...prev,
        cascadeLevels: {
          ...prev.cascadeLevels,
          placement: {
            ...prev.cascadeLevels.placement,
            items: placements,
            loading: false
          }
        }
      }));
      
    } catch (error) {
      console.error('Erreur chargement placements:', error);
      setModalState(prev => ({
        ...prev,
        cascadeLevels: {
          ...prev.cascadeLevels,
          placement: { ...prev.cascadeLevels.placement, loading: false }
        },
        error: 'Erreur lors du chargement des placements'
      }));
    }
  }, [selectedClient?.clientId]);// app/hooks/useMoveOperation.ts - PARTIE 3: SÉLECTION DE DESTINATION ET VALIDATION

  // ==================== SÉLECTION DE DESTINATION ====================

  const selectDestination = useCallback(async (level: string, itemId: string) => {
    console.log('🎯 Sélection de destination:', level, itemId);
    
    // Mettre à jour la sélection pour ce niveau
    setModalState(prev => {
      const newState = { ...prev };
      
      // Trouver l'item sélectionné
      const selectedItem = newState.cascadeLevels[level as keyof typeof newState.cascadeLevels].items.find(item => item.id === itemId);
      if (!selectedItem) return prev;
      
      // Mettre à jour la destination
      const newDestination = { ...newState.destination };
      
      switch (level) {
        case 'campaign':
          newDestination.campaignId = itemId;
          newDestination.campaignName = selectedItem.name;
          // Reset les niveaux suivants
          delete newDestination.versionId;
          delete newDestination.versionName;
          delete newDestination.ongletId;
          delete newDestination.ongletName;
          delete newDestination.sectionId;
          delete newDestination.sectionName;
          delete newDestination.tactiqueId;
          delete newDestination.tactiqueName;
          delete newDestination.placementId;
          delete newDestination.placementName;
          break;
          
        case 'version':
          newDestination.versionId = itemId;
          newDestination.versionName = selectedItem.name;
          // Reset les niveaux suivants
          delete newDestination.ongletId;
          delete newDestination.ongletName;
          delete newDestination.sectionId;
          delete newDestination.sectionName;
          delete newDestination.tactiqueId;
          delete newDestination.tactiqueName;
          delete newDestination.placementId;
          delete newDestination.placementName;
          break;
          
        case 'onglet':
          newDestination.ongletId = itemId;
          newDestination.ongletName = selectedItem.name;
          // Reset les niveaux suivants
          delete newDestination.sectionId;
          delete newDestination.sectionName;
          delete newDestination.tactiqueId;
          delete newDestination.tactiqueName;
          delete newDestination.placementId;
          delete newDestination.placementName;
          break;
          
        case 'section':
          newDestination.sectionId = itemId;
          newDestination.sectionName = selectedItem.name;
          // Reset les niveaux suivants
          delete newDestination.tactiqueId;
          delete newDestination.tactiqueName;
          delete newDestination.placementId;
          delete newDestination.placementName;
          break;
          
        case 'tactique':
          newDestination.tactiqueId = itemId;
          newDestination.tactiqueName = selectedItem.name;
          // Reset les niveaux suivants
          delete newDestination.placementId;
          delete newDestination.placementName;
          break;
          
        case 'placement':
          newDestination.placementId = itemId;
          newDestination.placementName = selectedItem.name;
          break;
      }
      
      newState.destination = newDestination;
      
      // Mettre à jour la sélection pour ce niveau
      newState.cascadeLevels[level as keyof typeof newState.cascadeLevels].selectedId = itemId;
      
      // Reset les sélections des niveaux suivants
      const levelOrder = ['campaign', 'version', 'onglet', 'section', 'tactique', 'placement'];
      const currentIndex = levelOrder.indexOf(level);
      for (let i = currentIndex + 1; i < levelOrder.length; i++) {
        const nextLevel = levelOrder[i] as keyof typeof newState.cascadeLevels;
        newState.cascadeLevels[nextLevel].selectedId = null;
        newState.cascadeLevels[nextLevel].items = [];
      }
      
      return newState;
    });
    
    // Charger les données du niveau suivant
    const dest = modalState.destination;
    
    switch (level) {
      case 'campaign':
        if (modalState.cascadeLevels.version.isVisible) {
          await loadVersions(itemId);
        }
        break;
        
      case 'version':
        if (modalState.cascadeLevels.onglet.isVisible && dest.campaignId) {
          await loadOnglets(dest.campaignId, itemId);
        }
        break;
        
      case 'onglet':
        if (modalState.cascadeLevels.section.isVisible && dest.campaignId && dest.versionId) {
          await loadSections(dest.campaignId, dest.versionId, itemId);
        }
        break;
        
      case 'section':
        if (modalState.cascadeLevels.tactique.isVisible && dest.campaignId && dest.versionId && dest.ongletId) {
          await loadTactiques(dest.campaignId, dest.versionId, dest.ongletId, itemId);
        }
        break;
        
      case 'tactique':
        if (modalState.cascadeLevels.placement.isVisible && dest.campaignId && dest.versionId && dest.ongletId && dest.sectionId) {
          await loadPlacements(dest.campaignId, dest.versionId, dest.ongletId, dest.sectionId, itemId);
        }
        break;
    }
  }, [modalState.destination, modalState.cascadeLevels, loadVersions, loadOnglets, loadSections, loadTactiques, loadPlacements]);

  // ==================== VALIDATION ET CONFIRMATION ====================

  const validateMove = useCallback(async (destination: Partial<MoveDestination>): Promise<MoveValidationResult> => {
    if (!selectedClient?.clientId) {
      return {
        isValid: false,
        canProceed: false,
        errors: ['Client non sélectionné'],
        warnings: []
      };
    }
    
    return await validateMoveDestination(destination, selectedClient.clientId);
  }, [selectedClient?.clientId]);

  const confirmMove = useCallback(async (): Promise<void> => {
    if (!modalState.selection || !selectedClient?.clientId) {
      throw new Error('Contexte invalide pour le déplacement');
    }
    
    console.log('🚀 Confirmation du déplacement');
    
    setModalState(prev => ({
      ...prev,
      step: 'progress',
      loading: true,
      error: null
    }));
    
    try {
      // Validation finale
      const validation = await validateMove(modalState.destination);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Construire l'opération de déplacement
      const operation: MoveOperation = {
        sourceItems: modalState.selection.rootElements,
        destination: modalState.destination as MoveDestination,
        operationType: modalState.selection.moveLevel,
        totalItemsAffected: modalState.selection.totalItemsToMove,
        clientId: selectedClient.clientId
      };
      
      setModalState(prev => ({ ...prev, operation }));
      
      // Exécuter le déplacement
      const result = await moveItems(operation);
      
      setModalState(prev => ({
        ...prev,
        step: 'result',
        loading: false,
        result
      }));
      
      console.log('✅ Déplacement terminé:', result);
      
    } catch (error) {
      console.error('❌ Erreur lors du déplacement:', error);
      setModalState(prev => ({
        ...prev,
        step: 'result',
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        result: {
          success: false,
          movedItemsCount: 0,
          skippedItemsCount: modalState.selection?.totalItemsToMove || 0,
          errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
          warnings: []
        }
      }));
    }
  }, [modalState, selectedClient?.clientId, validateMove]);

  // ==================== DESTINATION COMPLÈTE ====================

  const isDestinationComplete = useMemo((): boolean => {
    if (!modalState.selection) return false;
    
    const targetLevel = modalState.selection.targetLevel;
    const dest = modalState.destination;
    
    switch (targetLevel) {
      case 'onglet':
        return !!(dest.campaignId && dest.versionId && dest.ongletId);
      case 'section':
        return !!(dest.campaignId && dest.versionId && dest.ongletId && dest.sectionId);
      case 'tactique':
        return !!(dest.campaignId && dest.versionId && dest.ongletId && dest.sectionId && dest.tactiqueId);
      case 'placement':
        return !!(dest.campaignId && dest.versionId && dest.ongletId && dest.sectionId && dest.tactiqueId && dest.placementId);
      default:
        return false;
    }
  }, [modalState.selection, modalState.destination]);

  // ==================== RETURN ====================

  return {
    modalState,
    openMoveModal,
    closeMoveModal,
    selectDestination,
    confirmMove,
    analyzeSelection,
    validateMove,
    canMoveSelection,
    getMoveButtonLabel
  };
}

// ==================== EXPORT PAR DÉFAUT ====================

export default useMoveOperation;