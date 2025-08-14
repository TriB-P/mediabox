/**
 * Ce fichier contient des hooks React pour la préparation et l'enrichissement des données liées aux tactiques, placements et créatifs.
 * Il gère la logique de calcul des budgets, l'état de sélection des éléments et le formatage des données pour l'affichage.
 * Il fournit également des utilitaires pour le formatage monétaire, le calcul de pourcentages et la gestion des états d'interface utilisateur.
 */

import { useMemo } from 'react';
import { SectionWithTactiques } from '../types/tactiques';
import { useTranslation } from '../contexts/LanguageContext';

/**
 * Interface pour les propriétés du hook useTactiquesEnrichedData.
 * @property {any[]} sections - La liste des sections brutes.
 * @property {{ [sectionId: string]: any[] }} tactiques - Un objet mappant les IDs de section à leurs tactiques.
 * @property {{ [tactiqueId: string]: any[] }} placements - Un objet mappant les IDs de tactique à leurs placements.
 * @property {{ [placementId: string]: any[] }} creatifs - Un objet mappant les IDs de placement à leurs créatifs.
 * @property {Set<string>} selectedItems - Un ensemble des IDs des éléments sélectionnés.
 * @property {{ [key: string]: boolean }} sectionExpansions - Un objet mappant les IDs de section à leur état d'expansion.
 */
interface UseTactiquesEnrichedDataProps {
  sections: any[];
  tactiques: { [sectionId: string]: any[] };
  placements: { [tactiqueId: string]: any[] };
  creatifs: { [placementId: string]: any[] };
  selectedItems: Set<string>;
  sectionExpansions: { [key: string]: boolean };
}

/**
 * Interface pour le retour du hook useTactiquesEnrichedData.
 * @property {SectionWithTactiques[]} sectionsWithTactiques - Les sections enrichies avec leurs tactiques, placements et créatifs.
 * @property {{ [tactiqueId: string]: any[] }} enrichedPlacements - Les placements enrichis organisés par ID de tactique.
 * @property {{ [placementId: string]: any[] }} enrichedCreatifs - Les créatifs enrichis organisés par ID de placement.
 * @property {{ sections: any[]; tactiques: { [sectionId: string]: any[] }; placements: { [tactiqueId: string]: any[] }; creatifs: { [placementId: string]: any[] }; }} hierarchyContextForMove - Le contexte hiérarchique brut pour les opérations de déplacement.
 * @property {Record<string, string>} sectionNames - Un mappage des IDs de section à leurs noms.
 * @property {any[]} flatTactiques - Une liste aplatie de toutes les tactiques.
 * @property {number} totalBudget - Le budget total calculé à partir de toutes les sections.
 */
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

/**
 * Hook principal pour enrichir les données des tactiques, placements et créatifs avec des informations supplémentaires
 * comme le budget calculé et l'état de sélection.
 * @param {UseTactiquesEnrichedDataProps} props - Les propriétés nécessaires à l'enrichissement des données.
 * @returns {UseTactiquesEnrichedDataReturn} Les données enrichies et d'autres informations utiles.
 */
export function useTactiquesEnrichedData({
  sections,
  tactiques,
  placements,
  creatifs,
  selectedItems,
  sectionExpansions
}: UseTactiquesEnrichedDataProps): UseTactiquesEnrichedDataReturn {

  /**
   * Calcule et retourne les sections enrichies avec leurs tactiques, placements et créatifs.
   * Inclut le calcul du budget de section et l'état de sélection des éléments.
   * @returns {SectionWithTactiques[]} Les sections avec les données hiérarchiques enrichies.
   */
  const sectionsWithTactiques = useMemo((): SectionWithTactiques[] => {
    return sections.map(section => {
      const sectionTactiques = tactiques[section.id] || [];
      
      const calculatedSectionBudget = sectionTactiques.reduce((total, tactique) => {
        return total + (tactique.TC_Client_Budget_RefCurrency || 0);
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

  /**
   * Retourne une structure d'objet des placements enrichis, organisés par l'ID de leur tactique parente.
   * @returns {{ [tactiqueId: string]: any[] }} Un objet des placements enrichis.
   */
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

  /**
   * Retourne une structure d'objet des créatifs enrichis, organisés par l'ID de leur placement parent.
   * @returns {{ [placementId: string]: any[] }} Un objet des créatifs enrichis.
   */
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

  /**
   * Fournit le contexte hiérarchique brut des sections, tactiques, placements et créatifs.
   * Utile pour les opérations nécessitant l'accès aux données originales non enrichies, comme le déplacement d'éléments.
   * @returns {{ sections: any[]; tactiques: { [sectionId: string]: any[] }; placements: { [tactiqueId: string]: any[] }; creatifs: { [placementId: string]: any[] }; }} Le contexte hiérarchique.
   */
  const hierarchyContextForMove = useMemo(() => {
    return {
      sections: sections,
      tactiques: tactiques,
      placements: placements,
      creatifs: creatifs
    };
  }, [sections, tactiques, placements, creatifs]);

  /**
   * Crée un mappage des IDs de section à leurs noms respectifs.
   * @returns {Record<string, string>} Un objet où les clés sont les IDs de section et les valeurs sont leurs noms.
   */
  const sectionNames = useMemo(() => {
    return sections.reduce((names, section) => {
      names[section.id] = section.SECTION_Name;
      return names;
    }, {} as Record<string, string>);
  }, [sections]);

  /**
   * Retourne une liste aplatie de toutes les tactiques.
   * @returns {any[]} Une liste de toutes les tactiques.
   */
  const flatTactiques = useMemo(() => {
    return Object.values(tactiques).flat();
  }, [tactiques]);

  /**
   * Calcule le budget total agrégé de toutes les sections.
   * @returns {number} Le budget total.
   */
  const totalBudget = useMemo(() => {
    return sectionsWithTactiques.reduce((total, section) => {
      return total + (section.SECTION_Budget || 0);
    }, 0);
  }, [sectionsWithTactiques]);

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

/**
 * Hook utilitaire pour les fonctions de formatage liées aux données des tactiques, telles que la devise et les pourcentages.
 */
export function useTactiquesFormatting() {
  const { t } = useTranslation();
  /**
   * Retourne une fonction pour formater un montant numérique en devise canadienne (CAD), sans décimales.
   * @returns {(amount: number) => string} La fonction de formatage de devise.
   */
  const formatCurrency = useMemo(() => {
    return (amount: number) => {
      return new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency: 'CAD',
        maximumFractionDigits: 0
      }).format(amount);
    };
  }, []);

  /**
   * Retourne une fonction pour calculer le pourcentage d'un montant par rapport à un budget total.
   * Le résultat est arrondi à l'entier le plus proche.
   * @returns {(amount: number, totalBudget: number) => number} La fonction de calcul de pourcentage.
   */
  const calculatePercentage = useMemo(() => {
    return (amount: number, totalBudget: number) => {
      if (totalBudget <= 0) return 0;
      return Math.round((amount / totalBudget) * 100);
    };
  }, []);

  /**
   * Retourne une fonction pour formater des statistiques sur le nombre total de placements et de créatifs.
   * @returns {(placements: { [tactiqueId: string]: any[] }, creatifs: { [placementId: string]: any[] }) => { totalPlacements: number; totalCreatifs: number; placementsText: string; creatifsText: string; }} La fonction de formatage des statistiques.
   */
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
        placementsText: `${totalPlacements} ${t('tactiquesPage.statistics.placement')}${totalPlacements !== 1 ? 's' : ''}`,
        creatifsText: `${totalCreatifs} ${t('tactiquesPage.statistics.creative')}${totalCreatifs !== 1 ? 's' : ''}`
      };
    };
  }, [t]);

  return {
    formatCurrency,
    calculatePercentage,
    formatStatistics
  };
}

/**
 * Hook pour gérer les classes CSS et les états de chargement de l'interface utilisateur liés aux tactiques.
 */
export function useTactiquesUIStates() {
  /**
   * Retourne une fonction qui fournit les classes CSS pour le conteneur principal de l'interface.
   * @returns {() => string} La fonction retournant les classes CSS du conteneur.
   */
  const getContainerClasses = useMemo(() => {
    return () => "space-y-6 pb-16 px-3";
  }, []);

  /**
   * Retourne une fonction qui fournit les classes CSS pour le contenu principal en fonction du mode d'affichage.
   * @param {string} viewMode - Le mode d'affichage actuel ('table' ou autre).
   * @returns {string} Les classes CSS du contenu.
   */
  const getContentClasses = useMemo(() => {
    return (viewMode: string) => {
      if (viewMode === 'table') {
        return "w-full";
      } else {
        return "w-full flex";
      }
    };
  }, []);

  /**
   * Retourne une fonction qui fournit les classes CSS pour la zone de contenu principale en fonction du mode d'affichage.
   * @param {string} viewMode - Le mode d'affichage actuel ('table' ou autre).
   * @returns {string} Les classes CSS de la zone de contenu principale.
   */
  const getMainContentClasses = useMemo(() => {
    return (viewMode: string) => {
      if (viewMode === 'table') {
        return "w-full";
      } else {
        return "flex-1 mr-4";
      }
    };
  }, []);

  /**
   * Retourne une fonction qui détermine les différents états de chargement de l'interface utilisateur.
   * @param {boolean} loading - Indique si un chargement général est en cours.
   * @param {any} selectedOnglet - L'onglet actuellement sélectionné.
   * @param {boolean} isRefreshing - Indique si une opération de rafraîchissement est en cours.
   * @param {boolean} duplicationLoading - Indique si une duplication est en cours de chargement.
   * @param {boolean} clientFeesLoading - Indique si les frais client sont en cours de chargement.
   * @returns {{ isLoading: boolean; shouldShowFullLoader: boolean; shouldShowTopIndicator: boolean; }} Un objet avec les états de chargement.
   */
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