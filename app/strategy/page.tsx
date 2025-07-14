// app/strategy/page.tsx - Avec calcul des budgets assignés aux buckets

'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import { PlusIcon } from '@heroicons/react/24/outline';
import BudgetBucket from '../components/Others/BudgetBucket';
import CampaignVersionSelector from '../components/Others/CampaignVersionSelector';
import { useClient } from '../contexts/ClientContext';
import { useCampaignSelection } from '../hooks/useCampaignSelection';
import { 
  collection, 
  getDocs, 
  query, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  getBucketAssignmentsWithCurrency,
  BucketBudgetAssignment 
} from '../lib/bucketBudgetService';

// ==================== TYPES ====================

interface Bucket {
  id: string;
  name: string;
  description: string;
  target: number;
  actual: number;
  percentage: number;
  color: string;
  publishers: string[];
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function StrategiePage() {
  const { selectedClient } = useClient();
  const {
    campaigns,
    versions,
    selectedCampaign,
    selectedVersion,
    loading: campaignLoading,
    error: campaignError,
    handleCampaignChange,
    handleVersionChange,
  } = useCampaignSelection();

  // ==================== ÉTATS LOCAUX ====================

  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [remainingBudget, setRemainingBudget] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🔥 NOUVEAU: États pour les budgets assignés
  const [bucketAssignments, setBucketAssignments] = useState<BucketBudgetAssignment>({});
  const [campaignCurrency, setCampaignCurrency] = useState<string>('CAD');
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  
  // ==================== CONFIGURATION ====================

  // Exemple de couleurs disponibles pour les buckets
  const availableColors = [
    '#2cac44', // vert
    '#ed679e', // rose
    '#fdc300', // jaune
    '#58c1d5', // bleu clair
    '#5b4c9a', // violet
  ];

  // Exemple de logos de publishers (utilisation de placeholders)
  const publisherLogos = [
    { id: 'meta', name: 'Meta', logo: '📘' },
    { id: 'google', name: 'Google', logo: '🔍' },
    { id: 'twitter', name: 'Twitter', logo: '🐦' },
    { id: 'linkedin', name: 'LinkedIn', logo: '💼' },
    { id: 'tiktok', name: 'TikTok', logo: '🎵' },
    { id: 'youtube', name: 'YouTube', logo: '▶️' },
    { id: 'spotify', name: 'Spotify', logo: '🎧' },
    { id: 'snapchat', name: 'Snapchat', logo: '👻' },
  ];

  // ==================== EFFETS ====================

  // Mettre à jour le budget total et la devise quand la campagne change
  useEffect(() => {
    if (selectedCampaign) {
      setTotalBudget(selectedCampaign.CA_Budget);
      setCampaignCurrency(selectedCampaign.CA_Currency || 'CAD');
    } else {
      setTotalBudget(0);
      setCampaignCurrency('CAD');
    }
  }, [selectedCampaign]);

  // Charger les buckets quand une version est sélectionnée
  useEffect(() => {
    if (selectedVersion && selectedClient && selectedCampaign) {
      loadBuckets(selectedVersion.id);
    } else {
      setBuckets([]);
      setBucketAssignments({});
    }
  }, [selectedVersion, selectedClient, selectedCampaign]);

  // 🔥 NOUVEAU: Charger les budgets assignés quand les buckets changent
  useEffect(() => {
    if (selectedVersion && selectedClient && selectedCampaign && buckets.length > 0) {
      loadBucketAssignments();
    }
  }, [selectedVersion, selectedClient, selectedCampaign, buckets.length]);

  // Calculer le budget restant à chaque changement de buckets ou de budget total
  useEffect(() => {
    if (selectedCampaign) {
      const allocated = buckets.reduce((sum, bucket) => sum + bucket.target, 0);
      setRemainingBudget(selectedCampaign.CA_Budget - allocated);
    }
  }, [buckets, selectedCampaign]);
  
  // ==================== FONCTIONS DE CHARGEMENT ====================

  // Charger les buckets pour une version spécifique
  const loadBuckets = async (versionId: string) => {
    if (!selectedClient || !selectedCampaign) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const bucketsRef = collection(
        db, 
        'clients', 
        selectedClient.clientId, 
        'campaigns', 
        selectedCampaign.id, 
        'versions',
        versionId,
        'buckets'
      );
      
      const q = query(bucketsRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const bucketsData: Bucket[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bucketsData.push({
          id: doc.id,
          name: data.name || 'Sans nom',
          description: data.description || '',
          target: data.target || 0,
          actual: data.actual || 0,
          percentage: data.percentage || 0,
          color: data.color || availableColors[0],
          publishers: data.publishers || [],
        });
      });
      
      setBuckets(bucketsData);
    } catch (err) {
      console.error('Erreur lors du chargement des buckets:', err);
      setError('Erreur lors du chargement des buckets');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NOUVEAU: Charger les budgets assignés aux buckets
  const loadBucketAssignments = async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    try {
      setLoadingAssignments(true);
      console.log('📊 Chargement des budgets assignés...');
      
      const assignments = await getBucketAssignmentsWithCurrency(
        selectedClient.clientId,
        selectedCampaign.id,
        selectedVersion.id,
        campaignCurrency
      );
      
      setBucketAssignments(assignments);
      console.log('✅ Budgets assignés chargés:', assignments);
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement des budgets assignés:', err);
      // Ne pas afficher d'erreur à l'utilisateur car ce n'est pas critique
      setBucketAssignments({});
    } finally {
      setLoadingAssignments(false);
    }
  };

  // ==================== GESTIONNAIRES DE CHANGEMENT ====================

  // 🔥 NOUVEAU: Gestionnaires simplifiés grâce au CampaignVersionSelector
  const handleCampaignChangeLocal = (campaign: any) => {
    handleCampaignChange(campaign);
    setBuckets([]); // Vider les buckets quand on change de campagne
    setBucketAssignments({}); // Vider les assignations
    setError(null); // Reset erreur
  };

  const handleVersionChangeLocal = (version: any) => {
    handleVersionChange(version);
    setBucketAssignments({}); // Vider les assignations
    setError(null); // Reset erreur
  };

  // ==================== FONCTIONS CRUD BUCKETS ====================

  // Fonction pour ajouter un nouveau bucket
  const handleAddBucket = async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    try {
      setLoading(true);
      
      const bucketsRef = collection(
        db, 
        'clients', 
        selectedClient.clientId, 
        'campaigns', 
        selectedCampaign.id, 
        'versions',
        selectedVersion.id,
        'buckets'
      );
      
      const newBucket = {
        name: 'Nouveau bucket',
        description: 'Description du bucket',
        target: 0,
        actual: 0,
        percentage: 0,
        color: availableColors[buckets.length % availableColors.length],
        publishers: [], // Commencer avec une liste vide
        createdAt: new Date().toISOString(),
      };
      
      await addDoc(bucketsRef, newBucket);
      
      // Recharger les buckets
      await loadBuckets(selectedVersion.id);
    } catch (err) {
      console.error('Erreur lors de la création du bucket:', err);
      setError('Erreur lors de la création du bucket');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer un bucket
  const handleDeleteBucket = async (id: string) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    try {
      setLoading(true);
      
      const bucketRef = doc(
        db, 
        'clients', 
        selectedClient.clientId, 
        'campaigns', 
        selectedCampaign.id, 
        'versions',
        selectedVersion.id,
        'buckets',
        id
      );
      
      await deleteDoc(bucketRef);
      
      // Recharger les buckets
      await loadBuckets(selectedVersion.id);
    } catch (err) {
      console.error('Erreur lors de la suppression du bucket:', err);
      setError('Erreur lors de la suppression du bucket');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour un bucket
  const handleUpdateBucket = async (updatedBucket: Bucket) => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    try {
      setLoading(true);
      
      const bucketRef = doc(
        db, 
        'clients', 
        selectedClient.clientId, 
        'campaigns', 
        selectedCampaign.id, 
        'versions',
        selectedVersion.id,
        'buckets',
        updatedBucket.id
      );
      
      // Exclure l'ID car c'est déjà le chemin du document
      const { id, ...bucketData } = updatedBucket;
      
      await updateDoc(bucketRef, bucketData);
      
      // Mettre à jour l'état local
      setBuckets(prev => prev.map(bucket => 
        bucket.id === updatedBucket.id ? updatedBucket : bucket
      ));
    } catch (err) {
      console.error('Erreur lors de la mise à jour du bucket:', err);
      setError('Erreur lors de la mise à jour du bucket');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour changer la couleur d'un bucket
  const handleColorChange = async (id: string, newColor: string) => {
    // Mettre à jour l'état local
    const updatedBuckets = buckets.map(bucket => {
      if (bucket.id === id) {
        return {
          ...bucket,
          color: newColor
        };
      }
      return bucket;
    });
    
    setBuckets(updatedBuckets);
    
    // Trouver le bucket mis à jour
    const updatedBucket = updatedBuckets.find(b => b.id === id);
    if (updatedBucket) {
      await handleUpdateBucket(updatedBucket);
    }
  };

  // ==================== FONCTIONS UTILITAIRES ====================

  // Ces fonctions sont maintenant des stubs qui seront passées au composant
  // mais ne seront pas réellement utilisées puisque le composant gère les valeurs
  // en local et ne les soumet que lors de la sauvegarde
  const handleSliderChange = () => {};
  const handleAmountChange = () => {};

  // Formater les montants en CAD
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: campaignCurrency || 'CAD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // 🔥 NOUVEAU: Fonction pour enrichir les buckets avec les budgets assignés
  const getEnrichedBuckets = () => {
    return buckets.map(bucket => ({
      ...bucket,
      actual: bucketAssignments[bucket.id] || 0, // Utiliser le budget assigné calculé
    }));
  };

  // ==================== CALCULS ====================

  const isLoading = campaignLoading || loading;
  const hasError = campaignError || error;
  const enrichedBuckets = getEnrichedBuckets();

  // ==================== RENDU ====================

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <div className="space-y-6">
          
          {/* ==================== EN-TÊTE ==================== */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Stratégie</h1>
            {selectedCampaign && selectedVersion && (
              <div className="text-right text-sm text-gray-500">
                <div>Campagne: <span className="font-medium">{selectedCampaign.CA_Name}</span></div>
                <div>Version: <span className="font-medium">{selectedVersion.name}</span></div>
                {loadingAssignments && (
                  <div className="text-xs text-blue-500 mt-1">
                    📊 Calcul des budgets assignés...
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* ==================== SÉLECTEUR CAMPAGNE/VERSION ==================== */}
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-4xl">
              <CampaignVersionSelector
                campaigns={campaigns}
                versions={versions}
                selectedCampaign={selectedCampaign}
                selectedVersion={selectedVersion}
                loading={campaignLoading}
                error={campaignError}
                onCampaignChange={handleCampaignChangeLocal}
                onVersionChange={handleVersionChangeLocal}
                className="mb-0"
              />
            </div>
            
            {/* Bouton nouvelle enveloppe */}
            <div className="ml-4">
              <button
                onClick={handleAddBucket}
                disabled={!selectedCampaign || !selectedVersion || isLoading}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                  !selectedCampaign || !selectedVersion || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nouvelle enveloppe
              </button>
            </div>
          </div>
          
          {/* ==================== DESCRIPTION ==================== */}
          <div className="bg-white p-4 rounded-lg shadow mb-6 text-sm text-gray-600">
            <p>
              Les enveloppes budgétaires sont un outil pour les équipes de planification qui permet d'utiliser MediaBox pour faire de la planification à très
              haut niveau. Vous pouvez créer autant d'enveloppe que vous le souhaitez et assigner une portion du budget de la campagne dans ses
              enveloppes. Le montant "Assigné dans MediaBox" reflète automatiquement le budget total (incluant les frais) des tactiques assignées à chaque enveloppe.
            </p>
          </div>
          
          {/* ==================== MESSAGES D'ÉTAT ==================== */}
          {isLoading && (
            <div className="bg-white p-8 rounded-lg shadow flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <div className="text-sm text-gray-500">Chargement en cours...</div>
              </div>
            </div>
          )}
          
          {hasError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {hasError}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}
          
          {/* ==================== CONTENU PRINCIPAL ==================== */}
          {!isLoading && !hasError && (
            <>
              {/* Budget Info */}
              {selectedCampaign && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <p className="text-sm text-blue-700 font-medium mr-2">Budget total:</p>
                      <p className="text-md font-bold text-blue-800">{formatCurrency(totalBudget)}</p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm text-blue-700 font-medium mr-2">Budget alloué:</p>
                      <p className="text-md font-bold text-blue-800">{formatCurrency(totalBudget - remainingBudget)}</p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm text-blue-700 font-medium mr-2">Budget restant:</p>
                      <p className={`text-md font-bold ${remainingBudget < 0 ? 'text-red-600' : 'text-blue-800'}`}>
                        {formatCurrency(remainingBudget)}
                      </p>
                    </div>
                  </div>
                  {/* Barre de progression globale */}
                  <div className="w-full bg-blue-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${remainingBudget < 0 ? 'bg-red-500' : 'bg-blue-500'}`} 
                      style={{ width: `${Math.min(100, ((totalBudget - remainingBudget) / totalBudget) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Messages d'aide */}
              {!selectedCampaign && (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500">
                    Veuillez sélectionner une campagne et une version pour voir les enveloppes budgétaires.
                  </p>
                </div>
              )}
              
              {selectedCampaign && !selectedVersion && (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500">
                    Veuillez sélectionner une version pour voir les enveloppes budgétaires.
                  </p>
                </div>
              )}
              
              {/* Grid de buckets */}
              {selectedCampaign && selectedVersion && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrichedBuckets.map(bucket => (
                    <BudgetBucket 
                      key={bucket.id}
                      bucket={bucket}
                      totalBudget={totalBudget}
                      onDelete={() => handleDeleteBucket(bucket.id)}
                      onUpdate={handleUpdateBucket}
                      onSliderChange={handleSliderChange}
                      onAmountChange={handleAmountChange}
                      onColorChange={handleColorChange}
                      availableColors={availableColors}
                      publisherLogos={publisherLogos}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                  
                  {buckets.length === 0 && (
                    <div className="col-span-full bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
                      <p className="text-gray-500">
                        Aucune enveloppe budgétaire n'a été créée pour cette version.
                      </p>
                      <button
                        onClick={handleAddBucket}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Créer une enveloppe
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}