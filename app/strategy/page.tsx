/**
 * Ce fichier définit la page "Stratégie" de l'application.
 * Elle permet de visualiser et de gérer les "enveloppes budgétaires" (buckets)
 * pour une campagne et une version de campagne sélectionnées.
 * Les utilisateurs peuvent créer, modifier, supprimer des buckets et y allouer des budgets.
 * Le composant affiche également le budget total, le budget alloué et le budget restant de la campagne.
 */
'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import { PlusIcon } from '@heroicons/react/24/outline';
import BudgetBucket from '../components/Others/BudgetBucket';
import { useTranslation } from '../contexts/LanguageContext';
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
import { motion, Variants } from 'framer-motion';

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

const easeOut: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easeOut,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOut },
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: easeOut },
  },
};

/**
 * Composant principal de la page Stratégie.
 * Permet de gérer les enveloppes budgétaires pour les campagnes.
 *
 * @returns {JSX.Element} Le composant React de la page Stratégie.
 */
export default function StrategiePage() {
  const { selectedClient } = useClient();
  const { t } = useTranslation();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [bucketAssignments, setBucketAssignments] = useState<BucketBudgetAssignment>({});
  const [campaignCurrency, setCampaignCurrency] = useState<string>('CAD');
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  
  const availableColors = [
    '#2cac44',
    '#ed679e',
    '#fdc300',
    '#58c1d5',
    '#5b4c9a',
  ];

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

  /**
   * Effet de bord pour mettre à jour le budget total et la devise lorsque la campagne sélectionnée change.
   * @param {object} selectedCampaign - La campagne actuellement sélectionnée.
   */
  useEffect(() => {
    if (selectedCampaign) {
      setTotalBudget(selectedCampaign.CA_Budget);
      setCampaignCurrency(selectedCampaign.CA_Currency || 'CAD');
    } else {
      setTotalBudget(0);
      setCampaignCurrency('CAD');
    }
  }, [selectedCampaign]);

  /**
   * Effet de bord pour charger les buckets lorsque la version, le client ou la campagne sélectionnée change.
   * @param {object} selectedVersion - La version de campagne actuellement sélectionnée.
   * @param {object} selectedClient - Le client actuellement sélectionné.
   * @param {object} selectedCampaign - La campagne actuellement sélectionnée.
   */
  useEffect(() => {
    if (selectedVersion && selectedClient && selectedCampaign) {
      loadBuckets(selectedVersion.id);
    } else {
      setBuckets([]);
      setBucketAssignments({});
    }
  }, [selectedVersion, selectedClient, selectedCampaign]);

  /**
   * Effet de bord pour charger les budgets assignés aux buckets lorsque les buckets,
   * la version, le client ou la campagne sélectionnée changent.
   * @param {object} selectedVersion - La version de campagne actuellement sélectionnée.
   * @param {object} selectedClient - Le client actuellement sélectionné.
   * @param {object} selectedCampaign - La campagne actuellement sélectionnée.
   * @param {number} buckets.length - Le nombre de buckets chargés.
   */
  useEffect(() => {
    if (selectedVersion && selectedClient && selectedCampaign && buckets.length > 0) {
      loadBucketAssignments();
    }
  }, [selectedVersion, selectedClient, selectedCampaign, buckets.length]);

  /**
   * Effet de bord pour calculer le budget restant à chaque changement des buckets ou du budget total.
   * @param {Array<Bucket>} buckets - La liste des buckets.
   * @param {object} selectedCampaign - La campagne actuellement sélectionnée.
   */
  useEffect(() => {
    if (selectedCampaign) {
      const allocated = buckets.reduce((sum, bucket) => sum + bucket.target, 0);
      setRemainingBudget(selectedCampaign.CA_Budget - allocated);
    }
  }, [buckets, selectedCampaign]);
  
  /**
   * Charge les buckets depuis Firebase pour une version spécifique de campagne.
   *
   * @param {string} versionId - L'ID de la version de campagne.
   * @returns {Promise<void>} Une promesse qui se résout une fois les buckets chargés.
   */
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
      console.log("FIREBASE: LECTURE - Fichier: page.tsx - Fonction: loadBuckets - Path: clients/" + selectedClient.clientId + "/campaigns/" + selectedCampaign.id + "/versions/" + versionId + "/buckets");
      const querySnapshot = await getDocs(q);
      
      const bucketsData: Bucket[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bucketsData.push({
          id: doc.id,
          name: data.name || t('strategy.unnamedBucket'),
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
      setError(t('strategy.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charge les budgets assignés aux buckets depuis le service `bucketBudgetService`.
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois les budgets assignés chargés.
   */
  const loadBucketAssignments = async () => {
    if (!selectedClient || !selectedCampaign || !selectedVersion) return;
    
    try {
      setLoadingAssignments(true);
      
      const assignments = await getBucketAssignmentsWithCurrency(
        selectedClient.clientId,
        selectedCampaign.id,
        selectedVersion.id,
        campaignCurrency
      );
      
      setBucketAssignments(assignments);
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement des budgets assignés:', err);
      setBucketAssignments({});
    } finally {
      setLoadingAssignments(false);
    }
  };

  /**
   * Gère le changement de campagne sélectionnée.
   *
   * @param {any} campaign - La nouvelle campagne sélectionnée.
   * @returns {void}
   */
  const handleCampaignChangeLocal = (campaign: any) => {
    handleCampaignChange(campaign);
    setBuckets([]);
    setBucketAssignments({});
    setError(null);
  };

  /**
   * Gère le changement de version de campagne sélectionnée.
   *
   * @param {any} version - La nouvelle version de campagne sélectionnée.
   * @returns {void}
   */
  const handleVersionChangeLocal = (version: any) => {
    handleVersionChange(version);
    setBucketAssignments({});
    setError(null);
  };

  /**
   * Ajoute un nouveau bucket à la campagne et version sélectionnées dans Firebase.
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois le bucket ajouté et les buckets rechargés.
   */
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
        name: t('strategy.newBucketName'),
        description: '',
        target: 0,
        actual: 0,
        percentage: 0,
        color: availableColors[buckets.length % availableColors.length],
        publishers: [],
        createdAt: new Date().toISOString(),
      };
      
      console.log("FIREBASE: ÉCRITURE - Fichier: page.tsx - Fonction: handleAddBucket - Path: clients/" + selectedClient.clientId + "/campaigns/" + selectedCampaign.id + "/versions/" + selectedVersion.id + "/buckets");
      await addDoc(bucketsRef, newBucket);
      
      await loadBuckets(selectedVersion.id);
    } catch (err) {
      console.error('Erreur lors de la création du bucket:', err);
      setError(t('strategy.creationError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprime un bucket de Firebase.
   *
   * @param {string} id - L'ID du bucket à supprimer.
   * @returns {Promise<void>} Une promesse qui se résout une fois le bucket supprimé et les buckets rechargés.
   */
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
      
      console.log("FIREBASE: ÉCRITURE - Fichier: page.tsx - Fonction: handleDeleteBucket - Path: clients/" + selectedClient.clientId + "/campaigns/" + selectedCampaign.id + "/versions/" + selectedVersion.id + "/buckets/" + id);
      await deleteDoc(bucketRef);
      
      await loadBuckets(selectedVersion.id);
    } catch (err) {
      console.error('Erreur lors de la suppression du bucket:', err);
      setError(t('strategy.deleteError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Met à jour un bucket existant dans Firebase.
   *
   * @param {Bucket} updatedBucket - Le bucket avec les données mises à jour.
   * @returns {Promise<void>} Une promesse qui se résout une fois le bucket mis à jour.
   */
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
      
      const { id, ...bucketData } = updatedBucket;
      
      console.log("FIREBASE: ÉCRITURE - Fichier: page.tsx - Fonction: handleUpdateBucket - Path: clients/" + selectedClient.clientId + "/campaigns/" + selectedCampaign.id + "/versions/" + selectedVersion.id + "/buckets/" + updatedBucket.id);
      await updateDoc(bucketRef, bucketData);
      
      setBuckets(prev => prev.map(bucket => 
        bucket.id === updatedBucket.id ? updatedBucket : bucket
      ));
    } catch (err) {
      console.error('Erreur lors de la mise à jour du bucket:', err);
      setError(t('strategy.updateError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère le changement de couleur d'un bucket.
   * Met à jour l'état local du bucket et déclenche une mise à jour dans Firebase.
   *
   * @param {string} id - L'ID du bucket à modifier.
   * @param {string} newColor - La nouvelle couleur du bucket.
   * @returns {Promise<void>} Une promesse qui se résout une fois la couleur mise à jour.
   */
  const handleColorChange = async (id: string, newColor: string) => {
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
    
    const updatedBucket = updatedBuckets.find(b => b.id === id);
    if (updatedBucket) {
      await handleUpdateBucket(updatedBucket);
    }
  };

  /**
   * Fonction de rappel pour le changement du slider. Actuellement un stub.
   * @returns {void}
   */
  const handleSliderChange = () => {};

  /**
   * Fonction de rappel pour le changement de montant. Actuellement un stub.
   * @returns {void}
   */
  const handleAmountChange = () => {};

  /**
   * Formate un montant numérique en une chaîne de caractères représentant une devise.
   *
   * @param {number} amount - Le montant à formater.
   * @returns {string} Le montant formaté avec le symbole de la devise.
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: campaignCurrency || 'CAD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  /**
   * Enrichit la liste des buckets existants avec les budgets assignés calculés.
   * Chaque bucket aura sa propriété 'actual' mise à jour avec le budget assigné correspondant.
   *
   * @returns {Array<Bucket>} La liste des buckets enrichis.
   */
  const getEnrichedBuckets = () => {
    return buckets.map(bucket => ({
      ...bucket,
      actual: bucketAssignments[bucket.id] || 0,
    }));
  };

  const isLoading = campaignLoading || loading;
  const hasError = campaignError || error;
  const enrichedBuckets = getEnrichedBuckets();

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <motion.div 
          className="space-y-6"
          variants={pageVariants}
          initial="hidden"
          animate="visible"
        >
          
          <motion.div className="flex justify-between items-center" variants={itemVariants}>
            <h1 className="text-2xl font-bold text-gray-900">{t('strategy.title')}</h1>
            {selectedCampaign && selectedVersion && (
              <div className="text-right text-sm text-gray-500">
                <div>{t('strategy.campaign')} <span className="font-medium">{selectedCampaign.CA_Name}</span></div>
                <div>{t('strategy.version')} <span className="font-medium">{selectedVersion.name}</span></div>
                {loadingAssignments && (
                  <div className="text-xs text-blue-500 mt-1">
                    {t('strategy.calculatingAssignedBudgets')}
                  </div>
                )}
              </div>
            )}
          </motion.div>
          
          <motion.div className="flex justify-between items-center" variants={itemVariants}>
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
            
            <div className="ml-4">
              <motion.button
                onClick={handleAddBucket}
                disabled={!selectedCampaign || !selectedVersion || isLoading}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                  !selectedCampaign || !selectedVersion || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                {t('strategy.newBucket')}
              </motion.button>
            </div>
          </motion.div>
          
          <motion.div className="bg-white p-4 rounded-lg shadow mb-6 text-sm text-gray-600" variants={itemVariants}>
            <p>
              {t('strategy.description')}
            </p>
          </motion.div>
          
          {isLoading && (
            <motion.div className="bg-white p-8 rounded-lg shadow flex items-center justify-center" variants={itemVariants}>
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <div className="text-sm text-gray-500">{t('common.loading')}</div>
              </div>
            </motion.div>
          )}
          
          {hasError && (
            <motion.div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" variants={itemVariants}>
              {hasError}
              <motion.button
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </motion.div>
          )}
          
          {!isLoading && !hasError && (
            <>
              {selectedCampaign && (
                <motion.div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6" variants={itemVariants}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <p className="text-sm text-blue-700 font-medium mr-2">{t('strategy.totalBudget')}</p>
                      <p className="text-md font-bold text-blue-800">{formatCurrency(totalBudget)}</p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm text-blue-700 font-medium mr-2">{t('strategy.allocatedBudget')}</p>
                      <p className="text-md font-bold text-blue-800">{formatCurrency(totalBudget - remainingBudget)}</p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm text-blue-700 font-medium mr-2">{t('strategy.remainingBudget')}</p>
                      <p className={`text-md font-bold ${remainingBudget < 0 ? 'text-red-600' : 'text-blue-800'}`}>
                        {formatCurrency(remainingBudget)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2.5">
                    <motion.div 
                      className={`h-2.5 rounded-full ${remainingBudget < 0 ? 'bg-red-500' : 'bg-blue-500'}`} 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((totalBudget - remainingBudget) / totalBudget) * 100)}%` }}
                      transition={{ duration: 0.5, ease: easeOut }}
                    ></motion.div>
                  </div>
                </motion.div>
              )}
              
              {!selectedCampaign && (
                <motion.div className="bg-white p-8 rounded-lg shadow text-center" variants={itemVariants}>
                  <p className="text-gray-500">
                    {t('strategy.selectCampaignAndVersion')}
                  </p>
                </motion.div>
              )}
              
              {selectedCampaign && !selectedVersion && (
                <motion.div className="bg-white p-8 rounded-lg shadow text-center" variants={itemVariants}>
                  <p className="text-gray-500">
                    {t('strategy.selectVersion')}
                  </p>
                </motion.div>
              )}
              
              {selectedCampaign && selectedVersion && (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                >
                  {enrichedBuckets.map(bucket => (
                    <motion.div key={bucket.id} variants={cardVariants}>
                      <BudgetBucket 
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
                    </motion.div>
                  ))}
                  
                  {buckets.length === 0 && (
                    <motion.div className="col-span-full bg-gray-50 p-8 rounded-lg border border-gray-200 text-center" variants={itemVariants}>
                      <p className="text-gray-500">
                        {t('strategy.noBuckets')}
                      </p>
                      <motion.button
                        onClick={handleAddBucket}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        {t('strategy.createBucket')}
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}