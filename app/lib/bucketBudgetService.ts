// app/lib/bucketBudgetService.ts
/**
 * Ce fichier est responsable du calcul des budgets assignés aux "buckets" (catégories budgétaires)
 * pour une campagne donnée. Il gère la récupération des données depuis Firebase
 * et l'agrégation des budgets par bucket en utilisant directement TC_Client_Budget_RefCurrency.
 */
import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Tactique } from '../types/tactiques';

export interface BucketBudgetAssignment {
  [bucketId: string]: number; // montant total assigné à ce bucket
}

/**
* Calcule les budgets totaux assignés à chaque bucket.
* @param clientId L'identifiant unique du client.
* @param campaignId L'identifiant unique de la campagne.
* @param versionId L'identifiant unique de la version de la campagne.
* @returns Un objet où les clés sont les identifiants des buckets et les valeurs sont les montants totaux assignés.
*/
export async function calculateBucketAssignments(
  clientId: string,
  campaignId: string,
  versionId: string
): Promise<BucketBudgetAssignment> {
  try {
      const assignments: BucketBudgetAssignment = {};

      const ongletsRef = collection(
          db,
          'clients',
          clientId,
          'campaigns',
          campaignId,
          'versions',
          versionId,
          'onglets'
      );

      console.log("FIREBASE: LECTURE - Fichier: bucketBudgetService.ts - Fonction: calculateBucketAssignments - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets");
      const ongletsSnapshot = await getDocs(query(ongletsRef, orderBy('ONGLET_Order', 'asc')));

      for (const ongletDoc of ongletsSnapshot.docs) {
          const ongletId = ongletDoc.id;

          const sectionsRef = collection(
              db,
              'clients',
              clientId,
              'campaigns',
              campaignId,
              'versions',
              versionId,
              'onglets',
              ongletId,
              'sections'
          );

          console.log("FIREBASE: LECTURE - Fichier: bucketBudgetService.ts - Fonction: calculateBucketAssignments - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections");
          const sectionsSnapshot = await getDocs(query(sectionsRef, orderBy('SECTION_Order', 'asc')));

          for (const sectionDoc of sectionsSnapshot.docs) {
              const sectionId = sectionDoc.id;

              const tactiquesRef = collection(
                  db,
                  'clients',
                  clientId,
                  'campaigns',
                  campaignId,
                  'versions',
                  versionId,
                  'onglets',
                  ongletId,
                  'sections',
                  sectionId,
                  'tactiques'
              );

              console.log("FIREBASE: LECTURE - Fichier: bucketBudgetService.ts - Fonction: calculateBucketAssignments - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/onglets/${ongletId}/sections/${sectionId}/tactiques");
              const tactiquesSnapshot = await getDocs(query(tactiquesRef, orderBy('TC_Order', 'asc')));

              tactiquesSnapshot.docs.forEach(tactiqueDoc => {
                  const tactique = { id: tactiqueDoc.id, ...tactiqueDoc.data() } as Tactique;

                  // Debug : affichons les valeurs
                  console.log(`🔍 Tactique ${tactique.id}:`, {
                      TC_Bucket: tactique.TC_Bucket,
                      TC_Client_Budget_RefCurrency: tactique.TC_Client_Budget_RefCurrency,
                      type: typeof tactique.TC_Client_Budget_RefCurrency
                  });

                  // Condition corrigée : vérifier que les champs existent (pas forcément truthy)
                  if (tactique.TC_Bucket && tactique.TC_Client_Budget_RefCurrency !== undefined && tactique.TC_Client_Budget_RefCurrency !== null) {
                      const bucketId = tactique.TC_Bucket;
                      let tactiqueBudget = tactique.TC_Client_Budget_RefCurrency;

                      // Convertir en nombre si c'est une string
                      if (typeof tactiqueBudget === 'string') {
                          tactiqueBudget = parseFloat(tactiqueBudget) || 0;
                      }

                      console.log(`✅ Ajout au bucket ${bucketId}: ${tactiqueBudget}`);

                      if (!assignments[bucketId]) {
                          assignments[bucketId] = 0;
                      }
                      assignments[bucketId] += tactiqueBudget;
                  } else {
                      console.log(`❌ Tactique ${tactique.id} ignorée - TC_Bucket: ${tactique.TC_Bucket}, TC_Client_Budget_RefCurrency: ${tactique.TC_Client_Budget_RefCurrency}`);
                  }
              });
          }
      }
      return assignments;

  } catch (error) {
      console.error('❌ Erreur lors du calcul des budgets assignés:', error);
      throw error;
  }
}

/**
* Fonction principale qui orchestre le calcul des assignations budgétaires par bucket.
* @param clientId L'identifiant unique du client.
* @param campaignId L'identifiant unique de la campagne.
* @param versionId L'identifiant unique de la version de la campagne.
* @returns Un objet contenant les budgets assignés par bucket.
*/
export async function getBucketAssignments(
  clientId: string,
  campaignId: string,
  versionId: string
): Promise<BucketBudgetAssignment> {
  try {
      const assignments = await calculateBucketAssignments(
          clientId,
          campaignId,
          versionId
      );

      return assignments;

  } catch (error) {
      console.error('❌ Erreur complète lors du calcul des assignations:', error);
      throw error;
  }
}