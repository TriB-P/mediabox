// app/hooks/useAdOpsData.ts
/**
 * Hook personnalisé pour récupérer les données AdOps
 * Filtre les tactiques qui ont des placements avec PL_Tag_Type non vide
 * et extrait la liste unique des publishers pour le dropdown
 * CORRIGÉ : Affiche SH_Display_Name_FR au lieu des IDs
 * AJOUTÉ : Fonction de rechargement pour actualiser les données après modifications
 * MODIFIÉ : Ajout gestion sélection multiple des tactiques en cascade avec publishers
 */

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useClient } from '../contexts/ClientContext';
import { Tactique, Placement } from '../types/tactiques';
import { getCachedAllShortcodes, getListForClient } from '../lib/cacheService';

interface AdOpsTactique extends Tactique {
  ongletName: string;
  sectionName: string;
  ongletId: string;
  sectionId: string; 
  placementsWithTags: Placement[];
}

interface Publisher {
  id: string;
  name: string;
  tactiqueCount: number;
  isSelected: boolean;
}

// NOUVEAU : Interface pour la gestion des tactiques
interface TactiqueOption {
  id: string;
  label: string;
  publisherId: string;
  isSelected: boolean;
  tactiqueData: AdOpsTactique; // Référence vers les données complètes
}

interface UseAdOpsDataReturn {
  tactiques: AdOpsTactique[];
  publishers: Publisher[];
  // NOUVEAU : Gestion des tactiques
  tactiqueOptions: TactiqueOption[];
  selectedTactiques: string[]; // IDs des tactiques sélectionnées
  toggleTactique: (tactiqueId: string) => void;
  selectAllTactiques: () => void;
  deselectAllTactiques: () => void;
  // Existant
  loading: boolean;
  error: string | null;
  togglePublisher: (publisherId: string) => void;
  selectAllPublishers: () => void;
  deselectAllPublishers: () => void;
  selectedPublishers: string[];
  filteredTactiques: AdOpsTactique[]; // MODIFIÉ : Filtrées par publishers ET tactiques sélectionnées
  reloadData: () => Promise<void>;
}

interface Campaign {
  id: string;
  CA_Name: string;
}

interface Version {
  id: string;
  name: string;
}

export function useAdOpsData(
  selectedCampaign: Campaign | null, 
  selectedVersion: Version | null
): UseAdOpsDataReturn {
  const { selectedClient } = useClient();
  const [tactiques, setTactiques] = useState<AdOpsTactique[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  
  // NOUVEAU : États pour la gestion des tactiques
  const [tactiqueOptions, setTactiqueOptions] = useState<TactiqueOption[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupère le nom d'affichage d'un publisher depuis le cache
   */
  const getPublisherDisplayName = (publisherId: string): string => {
    if (!publisherId || publisherId.trim() === '') return publisherId;
    
    // Essayer d'abord le cache optimisé
    const allShortcodes = getCachedAllShortcodes();
    if (allShortcodes && allShortcodes[publisherId]) {
      return allShortcodes[publisherId].SH_Display_Name_FR || publisherId;
    }
    
    // Fallback : essayer la liste des publishers du client
    if (selectedClient) {
      const clientId = selectedClient.clientId;
      const publishersList = getListForClient('TC_Publisher', clientId);
      if (publishersList) {
        const publisher = publishersList.find(p => p.id === publisherId);
        if (publisher) {
          return publisher.SH_Display_Name_FR || publisherId;
        }
      }
    }
    
    // Si rien trouvé, retourner l'ID original
    return publisherId;
  };

  /**
   * Récupère toutes les tactiques avec leurs placements ayant PL_Tag_Type non vide
   */
  async function fetchAdOpsData() {
    if (!selectedClient || !selectedCampaign || !selectedVersion) {
      setTactiques([]);
      setPublishers([]);
      setTactiqueOptions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tactiquesWithTags: AdOpsTactique[] = [];
      const publisherMap = new Map<string, { name: string; count: number }>();
      const clientId = selectedClient.clientId;

      // Récupérer tous les onglets
      console.log(`FIREBASE: LECTURE - Fichier: useAdOpsData.ts - Fonction: fetchAdOpsData - Path: clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets`);
      const ongletsRef = collection(db, 'clients', clientId, 'campaigns', selectedCampaign.id, 'versions', selectedVersion.id, 'onglets');
      const ongletsSnapshot = await getDocs(query(ongletsRef, orderBy('ONGLET_Order', 'asc')));

      for (const ongletDoc of ongletsSnapshot.docs) {
        const ongletData = ongletDoc.data();
        const ongletName = ongletData.ONGLET_Name;

        // Récupérer toutes les sections de cet onglet
        console.log(`FIREBASE: LECTURE - Fichier: useAdOpsData.ts - Fonction: fetchAdOpsData - Path: clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${ongletDoc.id}/sections`);
        const sectionsRef = collection(db, 'clients', clientId, 'campaigns', selectedCampaign.id, 'versions', selectedVersion.id, 'onglets', ongletDoc.id, 'sections');
        const sectionsSnapshot = await getDocs(query(sectionsRef, orderBy('SECTION_Order', 'asc')));

        for (const sectionDoc of sectionsSnapshot.docs) {
          const sectionData = sectionDoc.data();
          const sectionName = sectionData.SECTION_Name;

          // Récupérer toutes les tactiques de cette section
          console.log(`FIREBASE: LECTURE - Fichier: useAdOpsData.ts - Fonction: fetchAdOpsData - Path: clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${ongletDoc.id}/sections/${sectionDoc.id}/tactiques`);
          const tactiquesRef = collection(db, 'clients', clientId, 'campaigns', selectedCampaign.id, 'versions', selectedVersion.id, 'onglets', ongletDoc.id, 'sections', sectionDoc.id, 'tactiques');
          const tactiquesSnapshot = await getDocs(query(tactiquesRef, orderBy('TC_Order', 'asc')));

          for (const tactiqueDoc of tactiquesSnapshot.docs) {
            const tactiqueData = tactiqueDoc.data() as Tactique;
            
            // Récupérer les placements de cette tactique
            console.log(`FIREBASE: LECTURE - Fichier: useAdOpsData.ts - Fonction: fetchAdOpsData - Path: clients/${clientId}/campaigns/${selectedCampaign.id}/versions/${selectedVersion.id}/onglets/${ongletDoc.id}/sections/${sectionDoc.id}/tactiques/${tactiqueDoc.id}/placements`);
            const placementsRef = collection(db, 'clients', clientId, 'campaigns', selectedCampaign.id, 'versions', selectedVersion.id, 'onglets', ongletDoc.id, 'sections', sectionDoc.id, 'tactiques', tactiqueDoc.id, 'placements');
            const placementsSnapshot = await getDocs(query(placementsRef, orderBy('PL_Order', 'asc')));
            
            // Filtrer les placements qui ont PL_Tag_Type non vide
            const placementsWithTags: Placement[] = [];
            placementsSnapshot.docs.forEach(placementDoc => {
              const placementData = placementDoc.data() as Placement;
              if (placementData.PL_Tag_Type && placementData.PL_Tag_Type.trim() !== '') {
                placementsWithTags.push({
                  ...placementData,
                  id: placementDoc.id
                });
              }
            });

            // Si cette tactique a des placements avec tags, l'ajouter à la liste
            if (placementsWithTags.length > 0) {
              const adOpsTactique: AdOpsTactique = {
                ...tactiqueData,
                id: tactiqueDoc.id,
                ongletName,
                sectionName,
                ongletId: ongletDoc.id,
                sectionId: sectionDoc.id,
                placementsWithTags
              };
              
              tactiquesWithTags.push(adOpsTactique);

              // Compter le publisher pour le dropdown - utiliser le display name
              const publisherId = tactiqueData.TC_Publisher;
              if (publisherId && publisherId.trim() !== '') {
                const publisherDisplayName = getPublisherDisplayName(publisherId);
                const current = publisherMap.get(publisherId) || { name: publisherDisplayName, count: 0 };
                publisherMap.set(publisherId, {
                  name: publisherDisplayName,
                  count: current.count + 1
                });
              }
            }
          }
        }
      }

      // Créer la liste des publishers pour le dropdown
      const publishersList: Publisher[] = Array.from(publisherMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          tactiqueCount: data.count,
          isSelected: true // Par défaut, tous sont sélectionnés
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      // NOUVEAU : Créer les options de tactiques pour le dropdown
      const tactiqueOptionsList: TactiqueOption[] = tactiquesWithTags
        .map(tactique => ({
          id: tactique.id,
          label: tactique.TC_Label || 'Tactique sans nom',
          publisherId: tactique.TC_Publisher || '',
          isSelected: true, // Par défaut, toutes sont sélectionnées
          tactiqueData: tactique
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      setTactiques(tactiquesWithTags);
      setPublishers(publishersList);
      setTactiqueOptions(tactiqueOptionsList);
      
    } catch (err) {
      console.error('Erreur lors de la récupération des données AdOps:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Toggle la sélection d'un publisher
   * MODIFIÉ : Met à jour aussi les tactiques correspondantes
   */
  const togglePublisher = (publisherId: string) => {
    setPublishers(prev => {
      const updated = prev.map(pub => 
        pub.id === publisherId 
          ? { ...pub, isSelected: !pub.isSelected }
          : pub
      );
      
      // Si un publisher est désélectionné, désélectionner ses tactiques
      const publisher = updated.find(p => p.id === publisherId);
      if (publisher && !publisher.isSelected) {
        setTactiqueOptions(prevTactiques =>
          prevTactiques.map(tactique =>
            tactique.publisherId === publisherId
              ? { ...tactique, isSelected: false }
              : tactique
          )
        );
      }
      // Si un publisher est sélectionné, sélectionner toutes ses tactiques
      else if (publisher && publisher.isSelected) {
        setTactiqueOptions(prevTactiques =>
          prevTactiques.map(tactique =>
            tactique.publisherId === publisherId
              ? { ...tactique, isSelected: true }
              : tactique
          )
        );
      }
      
      return updated;
    });
  };

  /**
   * Sélectionne tous les publishers
   * MODIFIÉ : Met à jour aussi toutes les tactiques
   */
  const selectAllPublishers = () => {
    setPublishers(prev => 
      prev.map(pub => ({ ...pub, isSelected: true }))
    );
    setTactiqueOptions(prev =>
      prev.map(tactique => ({ ...tactique, isSelected: true }))
    );
  };

  /**
   * Désélectionne tous les publishers
   * MODIFIÉ : Met à jour aussi toutes les tactiques
   */
  const deselectAllPublishers = () => {
    setPublishers(prev => 
      prev.map(pub => ({ ...pub, isSelected: false }))
    );
    setTactiqueOptions(prev =>
      prev.map(tactique => ({ ...tactique, isSelected: false }))
    );
  };

  // NOUVEAU : Fonctions de gestion des tactiques

  /**
   * Toggle la sélection d'une tactique
   */
  const toggleTactique = (tactiqueId: string) => {
    setTactiqueOptions(prev =>
      prev.map(tactique =>
        tactique.id === tactiqueId
          ? { ...tactique, isSelected: !tactique.isSelected }
          : tactique
      )
    );
  };

  /**
   * Sélectionne toutes les tactiques (filtrées par publishers sélectionnés)
   */
  const selectAllTactiques = () => {
    const selectedPublisherIds = publishers
      .filter(pub => pub.isSelected)
      .map(pub => pub.id);

    setTactiqueOptions(prev =>
      prev.map(tactique => ({
        ...tactique,
        isSelected: selectedPublisherIds.includes(tactique.publisherId)
      }))
    );
  };

  /**
   * Désélectionne toutes les tactiques
   */
  const deselectAllTactiques = () => {
    setTactiqueOptions(prev =>
      prev.map(tactique => ({ ...tactique, isSelected: false }))
    );
  };

  /**
   * Liste des publishers sélectionnés (IDs)
   */
  const selectedPublishers = publishers
    .filter(pub => pub.isSelected)
    .map(pub => pub.id);

  /**
   * NOUVEAU : Liste des tactiques sélectionnées (IDs)
   */
  const selectedTactiques = tactiqueOptions
    .filter(tactique => tactique.isSelected)
    .map(tactique => tactique.id);

  /**
   * Tactiques filtrées selon les publishers ET tactiques sélectionnées
   * MODIFIÉ : Double filtrage en cascade
   */
  const filteredTactiques = tactiques.filter(tactique => {
    // D'abord filtrer par publisher sélectionné
    const publisherSelected = selectedPublishers.includes(tactique.TC_Publisher || '');
    // Puis filtrer par tactique sélectionnée
    const tactiqueSelected = selectedTactiques.includes(tactique.id);
    
    return publisherSelected && tactiqueSelected;
  });

  // Effect pour charger les données quand la campagne/version change
  useEffect(() => {
    fetchAdOpsData();
  }, [selectedClient, selectedCampaign, selectedVersion]);

  return {
    tactiques,
    publishers,
    // NOUVEAU : Gestion des tactiques
    tactiqueOptions,
    selectedTactiques,
    toggleTactique,
    selectAllTactiques,
    deselectAllTactiques,
    // Existant
    loading,
    error,
    togglePublisher,
    selectAllPublishers,
    deselectAllPublishers,
    selectedPublishers,
    filteredTactiques,
    reloadData: fetchAdOpsData
  };
}