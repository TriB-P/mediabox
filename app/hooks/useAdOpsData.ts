// app/hooks/useAdOpsData.ts
/**
 * Hook personnalisé pour récupérer les données AdOps
 * Filtre les tactiques qui ont des placements avec PL_Tag_Type non vide
 * et extrait la liste unique des publishers pour le dropdown
 * CORRIGÉ : Utilise le cache service pour les noms des publishers
 */

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useClient } from '../contexts/ClientContext';
import { Tactique, Placement } from '../types/tactiques';
import { getCachedAllShortcodes, getListForClient } from '../lib/cacheService';

interface AdOpsTactique extends Tactique {
  ongletName: string;
  sectionName: string;
  placementsWithTags: Placement[];
}

interface Publisher {
  id: string;
  name: string;
  tactiqueCount: number;
  isSelected: boolean;
}

interface UseAdOpsDataReturn {
  tactiques: AdOpsTactique[];
  publishers: Publisher[];
  loading: boolean;
  error: string | null;
  togglePublisher: (publisherId: string) => void;
  selectAllPublishers: () => void;
  deselectAllPublishers: () => void;
  selectedPublishers: string[]; // IDs des publishers sélectionnés
  filteredTactiques: AdOpsTactique[];
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupère toutes les tactiques avec leurs placements ayant PL_Tag_Type non vide
   */
  async function fetchAdOpsData() {
    if (!selectedClient || !selectedCampaign || !selectedVersion) {
      setTactiques([]);
      setPublishers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tactiquesWithTags: AdOpsTactique[] = [];
      const publisherMap = new Map<string, { name: string; count: number }>();
      const clientId = selectedClient.clientId || selectedClient.id;

      // Récupérer tous les shortcodes publishers pour le mapping ID -> Display Name
      console.log(`FIREBASE: LECTURE - Fichier: useAdOpsData.ts - Fonction: fetchAdOpsData - Path: shortcodes`);
      const shortcodesRef = collection(db, 'shortcodes');
      const shortcodesQuery = query(shortcodesRef, where('SH_Dimension', '==', 'TC_Publisher'));
      const shortcodesSnapshot = await getDocs(shortcodesQuery);
      
      const publisherShortcodes = new Map<string, string>();
      shortcodesSnapshot.docs.forEach(doc => {
        const shortcodeData = doc.data();
        publisherShortcodes.set(doc.id, shortcodeData.SH_Display_Name_FR || doc.id);
      });

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
              if (placementData.TC_Tag_Type && placementData.TC_Tag_Type.trim() !== '') {
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
                placementsWithTags
              };
              
              tactiquesWithTags.push(adOpsTactique);

              // Compter le publisher pour le dropdown - utiliser le display name
              const publisherId = tactiqueData.TC_Publisher;
              if (publisherId && publisherId.trim() !== '') {
                const publisherDisplayName = publisherShortcodes.get(publisherId) || publisherId;
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

      setTactiques(tactiquesWithTags);
      setPublishers(publishersList);
      
    } catch (err) {
      console.error('Erreur lors de la récupération des données AdOps:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Toggle la sélection d'un publisher
   */
  const togglePublisher = (publisherId: string) => {
    setPublishers(prev => 
      prev.map(pub => 
        pub.id === publisherId 
          ? { ...pub, isSelected: !pub.isSelected }
          : pub
      )
    );
  };

  /**
   * Sélectionne tous les publishers
   */
  const selectAllPublishers = () => {
    setPublishers(prev => 
      prev.map(pub => ({ ...pub, isSelected: true }))
    );
  };

  /**
   * Désélectionne tous les publishers
   */
  const deselectAllPublishers = () => {
    setPublishers(prev => 
      prev.map(pub => ({ ...pub, isSelected: false }))
    );
  };

  /**
   * Liste des publishers sélectionnés (IDs)
   */
  const selectedPublishers = publishers
    .filter(pub => pub.isSelected)
    .map(pub => pub.id);

  /**
   * Tactiques filtrées selon les publishers sélectionnés
   */
  const filteredTactiques = tactiques.filter(tactique => 
    selectedPublishers.includes(tactique.TC_Publisher || '')
  );

  // Effect pour charger les données quand la campagne/version change
  useEffect(() => {
    fetchAdOpsData();
  }, [selectedClient, selectedCampaign, selectedVersion]);

  return {
    tactiques,
    publishers,
    loading,
    error,
    togglePublisher,
    selectAllPublishers,
    deselectAllPublishers,
    selectedPublishers,
    filteredTactiques
  };
}