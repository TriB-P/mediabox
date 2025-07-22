// app/hooks/useTactiquesEnrichedData.ts - Hook pour la préparation des données enrichies

import { useMemo } from 'react';
import { SectionWithTactiques } from '../types/tactiques';

// ==================== TYPES ====================

interface UseTactiquesEnrichedDataProps {
  sections: any[];
  tactiques: { [sectionId: string]: any[] };
  placements: { [tactiqueId: string]: any[] };
  creatifs: { [placementId: string]: any[] };
  selectedItems: Set<string>;
  sectionExpansions: { [key: string]: boolean };
}

interface UseTactiquesEnrichedDataReturn {
  sectionsWithTactiques: SectionWithTactiques[];
  enrichedPlacements: { [tactiqueId: string]: any[] };
  enrichedCreatifs: { [placementId: string]: any[] };
  hierarchyContextForMove: {
    sections: any[];
    tactiques: { [sectionId: string]: any[] };
    placements: { [tactiqueId: string]: any[] };
    creatifs: { [placementId: string]: any[] };
  };
  sectionNames: Record<string, string>;
  flatTactiques: any[];
  totalBudget: number;
}

// ==================== HOOK PRINCIPAL ====================

export function useTactiquesEnrichedData({
  sections,
  tactiques,
  placements,
  creatifs,
  selectedItems,
  sectionExpansions
}: UseTactiquesEnrichedDataProps): UseTactiquesEnrichedDataReturn {

  // ==================== SECTIONS AVEC TACTIQUES ENRICHIES ====================

  const sectionsWithTactiques = useMemo((): SectionWithTactiques[] => {
    return sections.map(section => {
      const sectionTactiques = tactiques[section.id] || [];
      
      // Calculer le budget total de la section basé sur les tactiques
      const calculatedSectionBudget = sectionTactiques.reduce((total, tactique) => {
        return total + (tactique.TC_Budget || 0);
      }, 0);
      
      // Mapper les tactiques avec leurs placements et créatifs
      const mappedTactiques = sectionTactiques.map(tactique => {
        const tactiquePlacements = placements[tactique.id] || [];
        
        // Mapper les placements avec leurs créatifs
        const mappedPlacements = tactiquePlacements.map(placement => {
          const placementCreatifs = creatifs[placement.id] || [];
          
          // Mapper les créatifs avec l'état de sélection
          const mappedCreatifs = placementCreatifs.map(creatif => ({
            ...creatif,
            isSelected: selectedItems.has(creatif.id)
          }));

          // Déterminer si le placement est sélectionné
          // (soit directement, soit si tous ses créatifs sont sélectionnés)
          const isPlacementSelected = selectedItems.has(placement.id) || 
                                      (mappedCreatifs.length > 0 && mappedCreatifs.every(c => c.isSelected));

          return {
            ...placement,
            creatifs: mappedCreatifs,
            isSelected: isPlacementSelected
          };
        });

        // Déterminer si la tactique est sélectionnée
        // (soit directement, soit si tous ses placements sont sélectionnés)
        const isTactiqueSelected = selectedItems.has(tactique.id) || 
                                   (mappedPlacements.length > 0 && mappedPlacements.every(p => p.isSelected));

        return {
          ...tactique,
          placements: mappedPlacements,
          isSelected: isTactiqueSelected
        };
      });

      // Déterminer si la section est sélectionnée
      // (soit directement, soit si toutes ses tactiques sont sélectionnées)
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

  // ==================== PLACEMENTS ENRICHIS ====================

  const enrichedPlacements = useMemo(() => {
    const result: { [tactiqueId: string]: any[] } = {};
    
    sectionsWithTactiques.forEach(section => {
      section.tactiques.forEach(tactique => {
        if (tactique.placements) {
          result[tactique.id] = tactique.placements;
        }
      });
    });
    
    return result;
  }, [sectionsWithTactiques]);

  // ==================== CRÉATIFS ENRICHIS ====================

  const enrichedCreatifs = useMemo(() => {
    const result: { [placementId: string]: any[] } = {};
    
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

  // ==================== CONTEXTE HIÉRARCHIQUE POUR DÉPLACEMENT ====================

  const hierarchyContextForMove = useMemo(() => {
    return {
      sections: sections,
      tactiques: tactiques,
      placements: placements,
      creatifs: creatifs
    };
  }, [sections, tactiques, placements, creatifs]);

  // ==================== NOMS DES SECTIONS ====================

  const sectionNames = useMemo(() => {
    return sections.reduce((names, section) => {
      names[section.id] = section.SECTION_Name;
      return names;
    }, {} as Record<string, string>);
  }, [sections]);

  // ==================== TACTIQUES APLATIES ====================

  const flatTactiques = useMemo(() => {
    return Object.values(tactiques).flat();
  }, [tactiques]);

  // ==================== BUDGET TOTAL ====================

  const totalBudget = useMemo(() => {
    return sectionsWithTactiques.reduce((total, section) => {
      return total + (section.SECTION_Budget || 0);
    }, 0);
  }, [sectionsWithTactiques]);

  // ==================== RETURN ====================

  return {
    sectionsWithTactiques,
    enrichedPlacements,
    enrichedCreatifs,
    hierarchyContextForMove,
    sectionNames,
    flatTactiques,
    totalBudget
  };
}

// ==================== HOOK UTILITAIRE POUR LE FORMATAGE ====================

export function useTactiquesFormatting() {
  const formatCurrency = useMemo(() => {
    return (amount: number) => {
      return new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency: 'CAD',
        maximumFractionDigits: 0
      }).format(amount);
    };
  }, []);

  const calculatePercentage = useMemo(() => {
    return (amount: number, totalBudget: number) => {
      if (totalBudget <= 0) return 0;
      return Math.round((amount / totalBudget) * 100);
    };
  }, []);

  const formatStatistics = useMemo(() => {
    return (placements: { [tactiqueId: string]: any[] }, creatifs: { [placementId: string]: any[] }) => {
      const totalPlacements = Object.values(placements).reduce(
        (total, tacticPlacements) => total + tacticPlacements.length, 
        0
      );
      
      const totalCreatifs = Object.values(creatifs).reduce(
        (total, placementCreatifs) => total + placementCreatifs.length, 
        0
      );

      return {
        totalPlacements,
        totalCreatifs,
        placementsText: `${totalPlacements} placement${totalPlacements !== 1 ? 's' : ''}`,
        creatifsText: `${totalCreatifs} créatif${totalCreatifs !== 1 ? 's' : ''}`
      };
    };
  }, []);

  return {
    formatCurrency,
    calculatePercentage,
    formatStatistics
  };
}

// ==================== HOOK POUR LES STATES UI ====================

export function useTactiquesUIStates() {
  const getContainerClasses = useMemo(() => {
    return () => "space-y-6 pb-16 px-3";
  }, []);

  const getContentClasses = useMemo(() => {
    return (viewMode: string) => {
      if (viewMode === 'table') {
        return "w-full";
      } else {
        return "w-full flex";
      }
    };
  }, []);

  const getMainContentClasses = useMemo(() => {
    return (viewMode: string) => {
      if (viewMode === 'table') {
        return "w-full";
      } else {
        return "flex-1 mr-4";
      }
    };
  }, []);

  const getLoadingStates = useMemo(() => {
    return (loading: boolean, selectedOnglet: any, isRefreshing: boolean, duplicationLoading: boolean, clientFeesLoading: boolean) => {
      const isLoading = loading || duplicationLoading || clientFeesLoading || isRefreshing;
      const shouldShowFullLoader = loading && !selectedOnglet;
      const shouldShowTopIndicator = (loading && !!selectedOnglet) || isRefreshing;

      return {
        isLoading,
        shouldShowFullLoader,
        shouldShowTopIndicator
      };
    };
  }, []);

  return {
    getContainerClasses,
    getContentClasses,
    getMainContentClasses,
    getLoadingStates
  };
}