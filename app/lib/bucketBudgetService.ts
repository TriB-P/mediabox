// app/lib/bucketBudgetService.ts

import {
    collection,
    getDocs,
    query,
    orderBy,
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { Tactique } from '../types/tactiques';
  
  // ==================== TYPES ====================
  
  export interface BucketBudgetAssignment {
    [bucketId: string]: number; // montant total assigné à ce bucket
  }
  
  export interface CurrencyConversion {
    [currencyCode: string]: number; // taux de change vers la devise de campagne
  }
  
  // ==================== SERVICE PRINCIPAL ====================
  
  /**
   * Calcule les budgets totaux assignés à chaque bucket
   * @param clientId - ID du client
   * @param campaignId - ID de la campagne
   * @param versionId - ID de la version
   * @param campaignCurrency - Devise de la campagne (ex: 'CAD')
   * @param exchangeRates - Taux de change { 'USD': 1.35, 'EUR': 1.45 } (vers devise campagne)
   * @returns Objet avec bucketId -> montant total assigné dans la devise de campagne
   */
  export async function calculateBucketAssignments(
    clientId: string,
    campaignId: string,
    versionId: string,
    campaignCurrency: string = 'CAD',
    exchangeRates: CurrencyConversion = {}
  ): Promise<BucketBudgetAssignment> {
    try {
      console.log('📊 Calcul des budgets assignés aux buckets...', {
        clientId,
        campaignId, 
        versionId,
        campaignCurrency
      });
  
      // Récupérer toutes les tactiques de toutes les sections de tous les onglets
      const assignments: BucketBudgetAssignment = {};
      
      // 1. Récupérer tous les onglets
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
      
      const ongletsSnapshot = await getDocs(query(ongletsRef, orderBy('ONGLET_Order', 'asc')));
      
      // 2. Pour chaque onglet, récupérer toutes les sections et leurs tactiques
      for (const ongletDoc of ongletsSnapshot.docs) {
        const ongletId = ongletDoc.id;
        
        // Récupérer les sections de cet onglet
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
        
        const sectionsSnapshot = await getDocs(query(sectionsRef, orderBy('SECTION_Order', 'asc')));
        
        // 3. Pour chaque section, récupérer les tactiques
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
          
          const tactiquesSnapshot = await getDocs(query(tactiquesRef, orderBy('TC_Order', 'asc')));
          
          // 4. Traiter chaque tactique
          tactiquesSnapshot.docs.forEach(tactiqueDoc => {
            const tactique = { id: tactiqueDoc.id, ...tactiqueDoc.data() } as Tactique;
            
            // Vérifier si la tactique a un bucket assigné
            if (tactique.TC_Bucket && tactique.TC_Budget) {
              const bucketId = tactique.TC_Bucket;
              const tactiquebudget = tactique.TC_Budget;
              const tactiqueCurrency = tactique.TC_Currency || campaignCurrency;
              
              // Convertir le budget dans la devise de campagne si nécessaire
              const convertedBudget = convertCurrency(
                tactiquebudget,
                tactiqueCurrency,
                campaignCurrency,
                exchangeRates
              );
              
              // Ajouter au total du bucket
              if (!assignments[bucketId]) {
                assignments[bucketId] = 0;
              }
              assignments[bucketId] += convertedBudget;
              
              console.log(`💰 Tactique "${tactique.TC_Label}" (${tactiquebudget} ${tactiqueCurrency}) assignée au bucket ${bucketId} = ${convertedBudget} ${campaignCurrency}`);
            }
          });
        }
      }
      
      console.log('✅ Calcul terminé - Budgets assignés par bucket:', assignments);
      return assignments;
      
    } catch (error) {
      console.error('❌ Erreur lors du calcul des budgets assignés:', error);
      throw error;
    }
  }
  
  // ==================== FONCTIONS UTILITAIRES ====================
  
  /**
   * Convertit un montant d'une devise vers une autre
   * @param amount - Montant à convertir
   * @param fromCurrency - Devise source
   * @param toCurrency - Devise cible
   * @param exchangeRates - Taux de change vers la devise cible
   * @returns Montant converti
   */
  function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRates: CurrencyConversion
  ): number {
    // Si c'est la même devise, pas de conversion
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // Chercher le taux de change
    const rate = exchangeRates[fromCurrency];
    if (rate && rate > 0) {
      const converted = amount * rate;
      console.log(`💱 Conversion: ${amount} ${fromCurrency} × ${rate} = ${converted} ${toCurrency}`);
      return converted;
    }
    
    // Si pas de taux trouvé, retourner le montant original avec un warning
    console.warn(`⚠️ Taux de change non trouvé pour ${fromCurrency} → ${toCurrency}, montant original conservé`);
    return amount;
  }
  
  /**
   * Obtient les taux de change pour un client depuis Firestore
   * Retourne un objet avec les taux vers la devise de campagne
   * @param clientId - ID du client
   * @param campaignCurrency - Devise de campagne (devise cible)
   * @returns Taux de change { 'USD': 1.35, 'EUR': 1.45 }
   */
  export async function getExchangeRatesForCampaign(
    clientId: string,
    campaignCurrency: string
  ): Promise<CurrencyConversion> {
    try {
      const currenciesRef = collection(db, 'clients', clientId, 'currencies');
      const snapshot = await getDocs(currenciesRef);
      
      const rates: CurrencyConversion = {};
      
      snapshot.docs.forEach(doc => {
        const currencyData = doc.data();
        const fromCurrency = currencyData.CU_From;
        const toCurrency = currencyData.CU_To;
        const rate = currencyData.CU_Rate;
        
        // On veut les taux VERS la devise de campagne
        if (toCurrency === campaignCurrency && fromCurrency !== campaignCurrency) {
          rates[fromCurrency] = rate;
        }
        // Si on a un taux DEPUIS la devise de campagne, on peut calculer l'inverse
        else if (fromCurrency === campaignCurrency && toCurrency !== campaignCurrency && rate > 0) {
          rates[toCurrency] = 1 / rate;
        }
      });
      
      console.log('💱 Taux de change chargés vers', campaignCurrency, ':', rates);
      return rates;
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des taux de change:', error);
      return {};
    }
  }
  
  /**
   * Fonction complète qui charge les taux et calcule les assignations
   * @param clientId - ID du client
   * @param campaignId - ID de la campagne 
   * @param versionId - ID de la version
   * @param campaignCurrency - Devise de la campagne
   * @returns Budgets assignés par bucket
   */
  export async function getBucketAssignmentsWithCurrency(
    clientId: string,
    campaignId: string,
    versionId: string,
    campaignCurrency: string = 'CAD'
  ): Promise<BucketBudgetAssignment> {
    try {
      // 1. Charger les taux de change
      const exchangeRates = await getExchangeRatesForCampaign(clientId, campaignCurrency);
      
      // 2. Calculer les assignations avec conversion
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