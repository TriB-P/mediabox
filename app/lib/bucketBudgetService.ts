/**
 * Ce fichier est responsable du calcul des budgets assignés aux "buckets" (catégories budgétaires)
 * pour une campagne donnée. Il gère la récupération des données depuis Firebase,
 * la conversion des devises si nécessaire, et l'agrégation des budgets par bucket.
 * Il contient également des fonctions utilitaires pour la gestion des taux de change.
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

export interface CurrencyConversion {
  [currencyCode: string]: number; // taux de change vers la devise de campagne
}

/**
* Calcule les budgets totaux assignés à chaque bucket.
* @param clientId L'identifiant unique du client.
* @param campaignId L'identifiant unique de la campagne.
* @param versionId L'identifiant unique de la version de la campagne.
* @param campaignCurrency La devise principale de la campagne (par défaut 'CAD').
* @param exchangeRates Les taux de change nécessaires pour la conversion des devises.
* @returns Un objet où les clés sont les identifiants des buckets et les valeurs sont les montants totaux assignés dans la devise de la campagne.
*/
export async function calculateBucketAssignments(
  clientId: string,
  campaignId: string,
  versionId: string,
  campaignCurrency: string = 'CAD',
  exchangeRates: CurrencyConversion = {}
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

                  if (tactique.TC_Bucket && tactique.TC_Budget) {
                      const bucketId = tactique.TC_Bucket;
                      const tactiquebudget = tactique.TC_Budget;
                      const tactiqueCurrency = tactique.TC_Currency || campaignCurrency;

                      const convertedBudget = convertCurrency(
                          tactiquebudget,
                          tactiqueCurrency,
                          campaignCurrency,
                          exchangeRates
                      );

                      if (!assignments[bucketId]) {
                          assignments[bucketId] = 0;
                      }
                      assignments[bucketId] += convertedBudget;
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
* Convertit un montant d'une devise vers une autre.
* @param amount Le montant numérique à convertir.
* @param fromCurrency Le code de la devise source (ex: 'USD').
* @param toCurrency Le code de la devise cible (ex: 'CAD').
* @param exchangeRates Un objet contenant les taux de change nécessaires pour la conversion.
* @returns Le montant converti dans la devise cible.
*/
function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: CurrencyConversion
): number {
  if (fromCurrency === toCurrency) {
      return amount;
  }

  const rate = exchangeRates[fromCurrency];
  if (rate && rate > 0) {
      const converted = amount * rate;
      return converted;
  }

  console.warn(`⚠️ Taux de change non trouvé pour ${fromCurrency} → ${toCurrency}, montant original conservé`);
  return amount;
}

/**
* Récupère les taux de change pour un client depuis Firestore.
* @param clientId L'identifiant unique du client.
* @param campaignCurrency La devise de la campagne pour laquelle les taux sont recherchés.
* @returns Un objet où les clés sont les codes de devise source et les valeurs sont les taux de change vers la devise de la campagne.
*/
export async function getExchangeRatesForCampaign(
  clientId: string,
  campaignCurrency: string
): Promise<CurrencyConversion> {
  try {
      const currenciesRef = collection(db, 'clients', clientId, 'currencies');
      console.log("FIREBASE: LECTURE - Fichier: bucketBudgetService.ts - Fonction: getExchangeRatesForCampaign - Path: clients/${clientId}/currencies");
      const snapshot = await getDocs(currenciesRef);

      const rates: CurrencyConversion = {};

      snapshot.docs.forEach(doc => {
          const currencyData = doc.data();
          const fromCurrency = currencyData.CU_From;
          const toCurrency = currencyData.CU_To;
          const rate = currencyData.CU_Rate;

          if (toCurrency === campaignCurrency && fromCurrency !== campaignCurrency) {
              rates[fromCurrency] = rate;
          } else if (fromCurrency === campaignCurrency && toCurrency !== campaignCurrency && rate > 0) {
              rates[toCurrency] = 1 / rate;
          }
      });
      return rates;

  } catch (error) {
      console.error('❌ Erreur lors du chargement des taux de change:', error);
      return {};
  }
}

/**
* Fonction principale qui orchestre le chargement des taux de change et le calcul des assignations budgétaires par bucket.
* @param clientId L'identifiant unique du client.
* @param campaignId L'identifiant unique de la campagne.
* @param versionId L'identifiant unique de la version de la campagne.
* @param campaignCurrency La devise principale de la campagne (par défaut 'CAD').
* @returns Un objet contenant les budgets assignés par bucket dans la devise de la campagne.
*/
export async function getBucketAssignmentsWithCurrency(
  clientId: string,
  campaignId: string,
  versionId: string,
  campaignCurrency: string = 'CAD'
): Promise<BucketBudgetAssignment> {
  try {
      const exchangeRates = await getExchangeRatesForCampaign(clientId, campaignCurrency);

      const assignments = await calculateBucketAssignments(
          clientId,
          campaignId,
          versionId,
          campaignCurrency,
          exchangeRates
      );

      return assignments;

  } catch (error) {
      console.error('❌ Erreur complète lors du calcul des assignations:', error);
      throw error;
  }
}