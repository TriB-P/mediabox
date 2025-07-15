import { db } from '@/lib/firebase'; // Corrigé ici
import { collection, getDocs, query, where, writeBatch, DocumentData } from 'firebase/firestore';

// Définition des types pour les paramètres de la fonction
type ParentType = 'campaign' | 'tactic' | 'placement';

interface ParentData {
  id: string;
  name: string;
  [key: string]: any; 
}

// Ce hook fournit une fonction pour mettre à jour les taxonomies des éléments enfants (placements, créatifs)
// lorsqu'un élément parent (campagne, tactique, placement) est modifié.
export const useUpdateTaxonomies = () => {
  const updateTaxonomies = async (parentType: ParentType, parentData: ParentData) => {
    const batch = writeBatch(db);

    try {
      // Si la campagne est mise à jour, on rafraîchit les placements et créatifs.
      if (parentType === 'campaign') {
        // Mettre à jour les placements
        const placementsQuery = query(collection(db, 'placements'), where('campaignId', '==', parentData.id));
        const placementsSnapshot = await getDocs(placementsQuery);
        for (const doc of placementsSnapshot.docs) {
          const placementData = doc.data() as DocumentData;
          const newPlacementTaxonomy = {
            ...placementData.taxonomy,
            campaignName: parentData.name,
          };
          batch.update(doc.ref, { taxonomy: newPlacementTaxonomy });
        }

        // Mettre à jour les créatifs
        const creativesQuery = query(collection(db, 'creatives'), where('campaignId', '==', parentData.id));
        const creativesSnapshot = await getDocs(creativesQuery);
        for (const doc of creativesSnapshot.docs) {
            const creativeData = doc.data() as DocumentData;
            const newCreativeTaxonomy = {
                ...creativeData.taxonomy,
                campaignName: parentData.name,
            };
            batch.update(doc.ref, { taxonomy: newCreativeTaxonomy });
        }
      }

      // Si la tactique est mise à jour, on rafraîchit les placements et créatifs.
      if (parentType === 'tactic') {
        // Mettre à jour les placements
        const placementsQuery = query(collection(db, 'placements'), where('tacticId', '==', parentData.id));
        const placementsSnapshot = await getDocs(placementsQuery);
        for (const doc of placementsSnapshot.docs) {
            const placementData = doc.data() as DocumentData;
            const newPlacementTaxonomy = {
                ...placementData.taxonomy,
                tacticName: parentData.name,
            };
            batch.update(doc.ref, { taxonomy: newPlacementTaxonomy });
        }
        
        // Mettre à jour les créatifs
        const creativesQuery = query(collection(db, 'creatives'), where('tacticId', '==', parentData.id));
        const creativesSnapshot = await getDocs(creativesQuery);
        for (const doc of creativesSnapshot.docs) {
            const creativeData = doc.data() as DocumentData;
            const newCreativeTaxonomy = {
                ...creativeData.taxonomy,
                tacticName: parentData.name,
            };
            batch.update(doc.ref, { taxonomy: newCreativeTaxonomy });
        }
      }

      // Si le placement est mis à jour, on rafraîchit les créatifs.
      if (parentType === 'placement') {
        const creativesQuery = query(collection(db, 'creatives'), where('placementId', '==', parentData.id));
        const creativesSnapshot = await getDocs(creativesQuery);
        for (const doc of creativesSnapshot.docs) {
            const creativeData = doc.data() as DocumentData;
            const newCreativeTaxonomy = {
                ...creativeData.taxonomy,
                placementName: parentData.name,
            };
            batch.update(doc.ref, { taxonomy: newCreativeTaxonomy });
        }
      }

      await batch.commit();
      console.log('Taxonomies mises à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des taxonomies:', error);
      throw new Error('La mise à jour des taxonomies a échoué.');
    }
  };

  return { updateTaxonomies };
};