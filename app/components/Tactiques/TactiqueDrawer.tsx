'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Tactique, TactiqueFormData } from '../../types/tactiques';
import FormDrawer from './FormDrawer';
import FormTabs, { FormTab } from './FormTabs';
import { DocumentTextIcon, LightBulbIcon, RectangleGroupIcon, ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useClient } from '../../contexts/ClientContext';
import SearchableSelect from './SearchableSelect';

// Types pour les listes dynamiques
interface ListItem {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
}

interface TactiqueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tactique?: Tactique | null;
  sectionId: string;
  onSave: (tactiqueData: TactiqueFormData) => Promise<void>;
}

export default function TactiqueDrawer({
  isOpen,
  onClose,
  tactique,
  sectionId,
  onSave
}: TactiqueDrawerProps) {
  const { selectedClient } = useClient();
  
  // État pour les onglets
  const [activeTab, setActiveTab] = useState('infos');
  
  // État pour le formulaire
  const [formData, setFormData] = useState<TactiqueFormData>({
    TC_Label: '',
    TC_Budget: 0,
    TC_Order: 0,
    TC_SectionId: sectionId,
  });
  
  // États pour les listes dynamiques
  const [mediaTypes, setMediaTypes] = useState<ListItem[]>([]);
  const [publishers, setPublishers] = useState<ListItem[]>([]);
  const [buyingMethods, setBuyingMethods] = useState<ListItem[]>([]);
  const [mediaObjectives, setMediaObjectives] = useState<ListItem[]>([]);
  
  // État de chargement
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Définition des onglets
  const tabs: FormTab[] = [
    { id: 'infos', name: 'Informations', icon: DocumentTextIcon },
    { id: 'strategie', name: 'Stratégie', icon: LightBulbIcon },
    { id: 'formats', name: 'Formats', icon: RectangleGroupIcon },
    { id: 'kpis', name: 'KPIs', icon: ChartBarIcon },
    { id: 'budget', name: 'Budget', icon: CurrencyDollarIcon },
  ];
  
  // Initialiser le formulaire si on modifie une tactique existante
  useEffect(() => {
    if (tactique) {
      setFormData({
        ...tactique,
        // Par défaut, ces champs peuvent être undefined
        TC_Media_Type: tactique.TC_Media_Type || '',
        TC_Publisher: tactique.TC_Publisher || '',
        TC_Buying_Method: tactique.TC_Buying_Method || '',
        TC_Product_Open: tactique.TC_Product_Open || '',
        TC_Targeting_Open: tactique.TC_Targeting_Open || '',
        TC_Market_Open: tactique.TC_Market_Open || '',
        TC_Format_Open: tactique.TC_Format_Open || '',
        TC_Media_Objective: tactique.TC_Media_Objective || '',
      });
      // Par défaut, ouvrir l'onglet Informations
      setActiveTab('infos');
    } else {
      // Réinitialiser pour une nouvelle tactique
      setFormData({
        TC_Label: '',
        TC_Budget: 0,
        TC_Order: 0,
        TC_SectionId: sectionId,
        TC_Status: 'Planned',
      });
    }
  }, [tactique, sectionId]);
  
  // Bloquer les prompts globaux
  useEffect(() => {
    // Stocker l'ancien prompt pour pouvoir le restaurer
    const originalPrompt = window.prompt;
    
    // Override global prompt function
    window.prompt = function() {
      console.log("Prompt intercepté !");
      return null;
    };
    
    // Nettoyer lors du démontage du composant
    return () => {
      // Restore the original prompt
      window.prompt = originalPrompt;
    };
  }, []);
  
  // Charger les listes dynamiques
  useEffect(() => {
    async function loadDynamicLists() {
      if (!selectedClient || !isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Charger les types de média
        const mediaTypesRef = collection(db, 'lists', 'TC_Media_Type', 'shortcodes');
        const mediaTypesQuery = query(mediaTypesRef, orderBy('SH_Display_Name_FR'));
        const mediaTypesSnapshot = await getDocs(mediaTypesQuery);
        setMediaTypes(mediaTypesSnapshot.docs.map(doc => ({
          id: doc.id,
          SH_Code: doc.data().SH_Code || doc.id,
          SH_Display_Name_FR: doc.data().SH_Display_Name_FR || doc.data().SH_Code || doc.id,
        })));
        
        // Charger les publishers
        const publishersRef = collection(db, 'lists', 'CA_Publisher', 'shortcodes');
        const publishersQuery = query(publishersRef, orderBy('SH_Display_Name_FR'));
        const publishersSnapshot = await getDocs(publishersQuery);
        setPublishers(publishersSnapshot.docs.map(doc => ({
          id: doc.id,
          SH_Code: doc.data().SH_Code || doc.id,
          SH_Display_Name_FR: doc.data().SH_Display_Name_FR || doc.data().SH_Code || doc.id,
        })));
        
        // Charger les méthodes d'achat
        const buyingMethodsRef = collection(db, 'lists', 'TC_Buying_Method', 'shortcodes');
        const buyingMethodsQuery = query(buyingMethodsRef, orderBy('SH_Display_Name_FR'));
        const buyingMethodsSnapshot = await getDocs(buyingMethodsQuery);
        setBuyingMethods(buyingMethodsSnapshot.docs.map(doc => ({
          id: doc.id,
          SH_Code: doc.data().SH_Code || doc.id,
          SH_Display_Name_FR: doc.data().SH_Display_Name_FR || doc.data().SH_Code || doc.id,
        })));
        
        // Charger les objectifs média
        const mediaObjectivesRef = collection(db, 'lists', 'TC_Media_Objective', 'shortcodes');
        const mediaObjectivesQuery = query(mediaObjectivesRef, orderBy('SH_Display_Name_FR'));
        const mediaObjectivesSnapshot = await getDocs(mediaObjectivesQuery);
        setMediaObjectives(mediaObjectivesSnapshot.docs.map(doc => ({
          id: doc.id,
          SH_Code: doc.data().SH_Code || doc.id,
          SH_Display_Name_FR: doc.data().SH_Display_Name_FR || doc.data().SH_Code || doc.id,
        })));
      } catch (err) {
        console.error('Erreur lors du chargement des listes dynamiques:', err);
        setError('Erreur lors du chargement des listes. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    }
    
    loadDynamicLists();
  }, [selectedClient, isOpen]);
  
  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Pour les champs numériques
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la tactique:', err);
      setError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    }
  };
  
  // Rendu du contenu selon l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case 'infos':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {/* TC_Label - Nom de la tactique */}
              <div>
                <label htmlFor="TC_Label" className="block text-sm font-medium text-gray-700">
                  Nom de la tactique *
                </label>
                <input
                  type="text"
                  id="TC_Label"
                  name="TC_Label"
                  value={formData.TC_Label || ''}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              {/* TC_Status - Statut */}
              <div>
                <label htmlFor="TC_Status" className="block text-sm font-medium text-gray-700">
                  Statut
                </label>
                <select
                  id="TC_Status"
                  name="TC_Status"
                  value={formData.TC_Status || 'Planned'}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="Planned">Planifiée</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Terminée</option>
                  <option value="Cancelled">Annulée</option>
                </select>
              </div>
              
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="TC_StartDate" className="block text-sm font-medium text-gray-700">
                    Date de début
                  </label>
                  <input
                    type="date"
                    id="TC_StartDate"
                    name="TC_StartDate"
                    value={formData.TC_StartDate || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="TC_EndDate" className="block text-sm font-medium text-gray-700">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    id="TC_EndDate"
                    name="TC_EndDate"
                    value={formData.TC_EndDate || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'strategie':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Stratégie</h3>
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {/* TC_Media_Type */}
              <SearchableSelect
                id="TC_Media_Type"
                name="TC_Media_Type"
                value={formData.TC_Media_Type || ''}
                onChange={handleChange}
                options={mediaTypes.map(item => ({ id: item.id, label: item.SH_Display_Name_FR }))}
                placeholder="Sélectionner un type de média..."
                label="Type de média"
              />
              
              {/* TC_Publisher */}
              <SearchableSelect
                id="TC_Publisher"
                name="TC_Publisher"
                value={formData.TC_Publisher || ''}
                onChange={handleChange}
                options={publishers.map(item => ({ id: item.id, label: item.SH_Display_Name_FR }))}
                placeholder="Sélectionner un partenaire..."
                label="Partenaire"
              />
              
              {/* TC_Buying_Method */}
              <SearchableSelect
                id="TC_Buying_Method"
                name="TC_Buying_Method"
                value={formData.TC_Buying_Method || ''}
                onChange={handleChange}
                options={buyingMethods.map(item => ({ id: item.id, label: item.SH_Display_Name_FR }))}
                placeholder="Sélectionner une méthode d'achat..."
                label="Méthode d'achat"
              />
              
              {/* TC_Product_Open */}
              <div>
                <label htmlFor="TC_Product_Open" className="block text-sm font-medium text-gray-700">
                  Produit
                </label>
                <input
                  type="text"
                  id="TC_Product_Open"
                  name="TC_Product_Open"
                  value={formData.TC_Product_Open || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              {/* TC_Targeting_Open */}
              <div>
                <label htmlFor="TC_Targeting_Open" className="block text-sm font-medium text-gray-700">
                  Ciblage
                </label>
                <textarea
                  id="TC_Targeting_Open"
                  name="TC_Targeting_Open"
                  rows={3}
                  value={formData.TC_Targeting_Open || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              {/* TC_Market_Open */}
              <div>
                <label htmlFor="TC_Market_Open" className="block text-sm font-medium text-gray-700">
                  Marché
                </label>
                <input
                  type="text"
                  id="TC_Market_Open"
                  name="TC_Market_Open"
                  value={formData.TC_Market_Open || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              {/* TC_Format_Open */}
              <div>
                <label htmlFor="TC_Format_Open" className="block text-sm font-medium text-gray-700">
                  Format (description)
                </label>
                <textarea
                  id="TC_Format_Open"
                  name="TC_Format_Open"
                  rows={2}
                  value={formData.TC_Format_Open || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              {/* TC_Media_Objective */}
              <SearchableSelect
                id="TC_Media_Objective"
                name="TC_Media_Objective"
                value={formData.TC_Media_Objective || ''}
                onChange={handleChange}
                options={mediaObjectives.map(item => ({ id: item.id, label: item.SH_Display_Name_FR }))}
                placeholder="Sélectionner un objectif média..."
                label="Objectif média"
              />
            </div>
          </div>
        );
        
      case 'formats':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Formats</h3>
            <p className="text-gray-500">Cette section sera implémentée ultérieurement.</p>
          </div>
        );
        
      case 'kpis':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">KPIs</h3>
            <p className="text-gray-500">Cette section sera implémentée ultérieurement.</p>
          </div>
        );
        
      case 'budget':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Budget</h3>
            
            <div className="space-y-4">
              {/* TC_Budget - Budget de la tactique */}
              <div>
                <label htmlFor="TC_Budget" className="block text-sm font-medium text-gray-700">
                  Budget *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="TC_Budget"
                    name="TC_Budget"
                    value={formData.TC_Budget}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">CAD</span>
                  </div>
                </div>
              </div>
              
              {/* Informations additionnelles sur le budget */}
              <div className="bg-yellow-50 p-4 rounded-md">
                <p className="text-sm text-yellow-700">
                  Le budget sera automatiquement redistribué aux placements associés à cette tactique.
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={tactique ? `Modifier la tactique: ${tactique.TC_Label}` : 'Nouvelle tactique'}
    >
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        {/* Navigation par onglets */}
        <FormTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {/* Contenu de l'onglet actif */}
        {renderTabContent()}
        
        {/* Footer avec les boutons d'action */}
        <div className="sticky bottom-0 bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              {tactique ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      </form>
    </FormDrawer>
  );
}