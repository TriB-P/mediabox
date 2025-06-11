'use client';

import React, { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import BudgetBucket from '../components/Others/BudgetBucket';
import { useClient } from '../contexts/ClientContext';
import { useSelection } from '../contexts/SelectionContext';
import { useCampaignSelection } from '../hooks/useCampaignSelection';
import { Campaign } from '../types/campaign';
import { 
  collection, 
  getDocs, 
  query, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Types
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

interface Version {
  id: string;
  name: string;
}

export default function StrategiePage() {
  const { selectedClient } = useClient();
  const { selectedVersionId, setSelectedVersionId } = useSelection();
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

  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [remainingBudget, setRemainingBudget] = useState<number>(0);
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const campaignDropdownRef = useRef<HTMLDivElement>(null);
  const versionDropdownRef = useRef<HTMLDivElement>(null);
  
  // Fermer les dropdowns quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (campaignDropdownRef.current && !campaignDropdownRef.current.contains(event.target as Node)) {
        setShowCampaignDropdown(false);
      }
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target as Node)) {
        setShowVersionDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Mettre à jour le budget total quand la campagne change
  useEffect(() => {
    if (selectedCampaign) {
      setTotalBudget(selectedCampaign.CA_Budget);
    } else {
      setTotalBudget(0);
    }
  }, [selectedCampaign]);

  // Charger les buckets quand une version est sélectionnée
  useEffect(() => {
    if (selectedVersion) {
      loadBuckets(selectedVersion.id);
    } else {
      setBuckets([]);
    }
  }, [selectedVersion, selectedClient, selectedCampaign]);
  
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

  // Créer une version initiale si nécessaire
  const createInitialVersion = async () => {
    if (!selectedClient || !selectedCampaign) return;
    
    try {
      const versionsRef = collection(
        db, 
        'clients', 
        selectedClient.clientId, 
        'campaigns', 
        selectedCampaign.id, 
        'versions'
      );
      
      const initialVersion = {
        name: 'Version originale',
        createdAt: new Date().toISOString(),
        createdBy: 'système',
        isOfficial: true,
      };
      
      const versionDocRef = await addDoc(versionsRef, initialVersion);
      
      // Mettre à jour la campagne avec l'ID de la version officielle
      await updateDoc(
        doc(db, 'clients', selectedClient.clientId, 'campaigns', selectedCampaign.id),
        { officialversionId: versionDocRef.id }
      );
      
      return versionDocRef.id;
    } catch (err) {
      console.error('Erreur lors de la création de la version initiale:', err);
      setError('Erreur lors de la création de la version initiale');
      return null;
    }
  };
  
  // Changer de version
  const handleVersionChangeLocal = async (version: Version) => {
    handleVersionChange(version);
    await loadBuckets(version.id);
    setShowVersionDropdown(false);
  };
  
  // Changer de campagne
  const handleCampaignChangeLocal = (campaign: Campaign) => {
    handleCampaignChange(campaign);
    setBuckets([]); // Vider les buckets
    setShowCampaignDropdown(false);
    setShowVersionDropdown(false); // Fermer aussi le dropdown de version
  };

  // Calculer le budget restant à chaque changement de buckets ou de budget total
  useEffect(() => {
    if (selectedCampaign) {
      const allocated = buckets.reduce((sum, bucket) => sum + bucket.target, 0);
      setRemainingBudget(selectedCampaign.CA_Budget - allocated);
    }
  }, [buckets, selectedCampaign]);

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

  // Ces fonctions sont maintenant des stubs qui seront passées au composant
  // mais ne seront pas réellement utilisées puisque le composant gère les valeurs
  // en local et ne les soumet que lors de la sauvegarde
  const handleSliderChange = () => {};
  const handleAmountChange = () => {};

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

  // Formater les montants en CAD
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const isLoading = campaignLoading || loading;
  const hasError = campaignError || error;

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Stratégie</h1>
            {selectedCampaign && selectedVersion && (
              <div className="text-right text-sm text-gray-500">
                <div>Campagne: <span className="font-medium">{selectedCampaign.CA_Name}</span></div>
                <div>Version: <span className="font-medium">{selectedVersion.name}</span></div>
              </div>
            )}
          </div>
          
          {/* Sélecteurs de campagne et version */}
          <div className="flex gap-4 mb-6">
            <div className="w-1/3 relative" ref={campaignDropdownRef}>
              <button 
                type="button" 
                className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={() => setShowCampaignDropdown(!showCampaignDropdown)}
              >
                <div className="flex items-center">
                  {/* Logo de campagne (placeholder) */}
                  <div className="w-6 h-6 mr-2 flex items-center justify-center bg-indigo-100 rounded-md text-indigo-600">
                    <span className="text-xs">📊</span>
                  </div>
                  <span>{selectedCampaign?.CA_Name || 'Sélectionner une campagne'}</span>
                </div>
                <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1" aria-hidden="true" />
              </button>
              
              {/* Dropdown pour les campagnes */}
              {showCampaignDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-56 overflow-auto">
                  <ul className="py-1">
                    {campaigns.map(campaign => (
                      <li 
                        key={campaign.id}
                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center ${
                          selectedCampaign?.id === campaign.id ? 'bg-gray-50 font-medium' : ''
                        }`}
                        onClick={() => handleCampaignChangeLocal(campaign)}
                      >
                        <div className="w-5 h-5 flex items-center justify-center bg-indigo-100 rounded text-indigo-600 mr-2">
                          <span className="text-xs">📊</span>
                        </div>
                        {campaign.CA_Name}
                      </li>
                    ))}
                    {campaigns.length === 0 && (
                      <li className="px-4 py-2 text-sm text-gray-500">
                        Aucune campagne disponible
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="w-1/3 relative" ref={versionDropdownRef}>
              <button 
                type="button" 
                className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                disabled={!selectedCampaign}
              >
                <div className="flex items-center">
                  {/* Logo de version (placeholder) */}
                  <div className="w-6 h-6 mr-2 flex items-center justify-center bg-indigo-100 rounded-md text-indigo-600">
                    <span className="text-xs">📝</span>
                  </div>
                  <span>{selectedVersion?.name || 'Sélectionner une version'}</span>
                </div>
                <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1" aria-hidden="true" />
              </button>
              
              {/* Dropdown pour les versions */}
              {showVersionDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-56 overflow-auto">
                  <ul className="py-1">
                    {versions.map(version => (
                      <li 
                        key={version.id}
                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center ${
                          selectedVersion?.id === version.id ? 'bg-gray-50 font-medium' : ''
                        }`}
                        onClick={() => handleVersionChangeLocal(version)}
                      >
                        <div className="w-5 h-5 flex items-center justify-center bg-indigo-100 rounded text-indigo-600 mr-2">
                          <span className="text-xs">📝</span>
                        </div>
                        {version.name}
                        {version.isOfficial && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Officielle
                          </span>
                        )}
                      </li>
                    ))}
                    {versions.length === 0 && (
                      <li className="px-4 py-2 text-sm text-gray-500">
                        Aucune version disponible
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="ml-auto">
              <button
                onClick={handleAddBucket}
                disabled={!selectedCampaign || !selectedVersion}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                  !selectedCampaign || !selectedVersion
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nouvelle enveloppe
              </button>
            </div>
          </div>
          
          {/* Description */}
          <div className="bg-white p-4 rounded-lg shadow mb-6 text-sm text-gray-600">
            <p>
              Les enveloppes budgétaires sont un outil pour les équipes de planification qui permet d'utiliser MediaBox pour faire de la planification à très
              haut niveau. Vous pouvez créer autant d'enveloppe que vous le souhaitez et assigner une portion du budget de la campagne dans ses
              enveloppes
            </p>
          </div>
          
          {/* Messages d'erreur et de chargement */}
          {isLoading && (
            <div className="bg-white p-8 rounded-lg shadow flex items-center justify-center">
              <div className="text-sm text-gray-500">Chargement en cours...</div>
            </div>
          )}
          
          {hasError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {hasError}
            </div>
          )}
          
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
              
              {!selectedCampaign && (
                <div className="bg-yellow-50 p-6 rounded-lg shadow text-center">
                  <p className="text-yellow-700">
                    Veuillez sélectionner une campagne pour voir les enveloppes budgétaires.
                  </p>
                </div>
              )}
              
              {selectedCampaign && !selectedVersion && (
                <div className="bg-yellow-50 p-6 rounded-lg shadow text-center">
                  <p className="text-yellow-700">
                    Veuillez sélectionner une version pour voir les enveloppes budgétaires.
                  </p>
                </div>
              )}
              
              {/* Grid de buckets */}
              {selectedCampaign && selectedVersion && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {buckets.map(bucket => (
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