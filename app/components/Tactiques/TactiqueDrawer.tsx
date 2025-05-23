'use client';

import React, { useState, useEffect } from 'react';
import FormDrawer from './FormDrawer';
import FormTabs, { FormTab } from './FormTabs';
import { DocumentTextIcon, LightBulbIcon, ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Tactique, TactiqueFormData } from '../../types/tactiques';
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
    TC_Status: 'Planned',
  });
  
  // États pour les listes dynamiques
  const [mediaTypes, setMediaTypes] = useState<ListItem[]>([]);
  const [publishers, setPublishers] = useState<ListItem[]>([]);
  const [buyingMethods, setBuyingMethods] = useState<ListItem[]>([]);
  const [mediaObjectives, setMediaObjectives] = useState<ListItem[]>([]);
  
  // État de chargement et erreurs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // Définition des onglets
  const tabs: FormTab[] = [
    { id: 'infos', name: 'Informations', icon: DocumentTextIcon },
    { id: 'strategie', name: 'Stratégie', icon: LightBulbIcon },
    { id: 'kpis', name: 'KPIs', icon: ChartBarIcon },
    { id: 'budget', name: 'Budget', icon: CurrencyDollarIcon },
  ];
  
  // Initialiser le formulaire quand la tactique change
  useEffect(() => {
    if (tactique) {
      setFormData({
        TC_Label: tactique.TC_Label || '',
        TC_Budget: tactique.TC_Budget || 0,
        TC_Order: tactique.TC_Order || 0,
        TC_SectionId: tactique.TC_SectionId || sectionId,
        TC_Status: tactique.TC_Status || 'Planned',
        TC_StartDate: tactique.TC_StartDate || '',
        TC_EndDate: tactique.TC_EndDate || '',
        TC_Media_Type: tactique.TC_Media_Type || '',
        TC_Publisher: tactique.TC_Publisher || '',
        TC_Buying_Method: tactique.TC_Buying_Method || '',
        TC_Product_Open: tactique.TC_Product_Open || '',
        TC_Targeting_Open: tactique.TC_Targeting_Open || '',
        TC_Market_Open: tactique.TC_Market_Open || '',
        TC_Format_Open: tactique.TC_Format_Open || '',
        TC_Media_Objective: tactique.TC_Media_Objective || '',
      });
      setActiveTab('infos'); // Toujours commencer par l'onglet Informations
      setIsDirty(false);
    } else {
      // Nouvelle tactique
      setFormData({
        TC_Label: '',
        TC_Budget: 0,
        TC_Order: 0,
        TC_SectionId: sectionId,
        TC_Status: 'Planned',
      });
      setActiveTab('infos');
      setIsDirty(false);
    }
  }, [tactique, sectionId]);
  
  // Charger les listes dynamiques quand le drawer s'ouvre
  useEffect(() => {
    if (isOpen && selectedClient) {
      loadDynamicLists();
    }
  }, [isOpen, selectedClient]);
  
  const loadDynamicLists = async () => {
    if (!selectedClient) return;
    
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
  };
  
  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (parseFloat(value) || 0) : value
    }));
    
    setIsDirty(true);
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      await onSave(formData);
      setIsDirty(false);
      onClose();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la tactique:', err);
      setError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Gérer la fermeture avec vérification des modifications
  const handleClose = () => {
    if (isDirty) {
      const shouldClose = confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?');
      if (!shouldClose) return;
    }
    
    setIsDirty(false);
    onClose();
  };
  
  // Rendu du contenu selon l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case 'infos':
        return (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
            
            {/* TC_Label */}
            <div>
              <label htmlFor="TC_Label" className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la tactique *
              </label>
              <input
                type="text"
                id="TC_Label"
                name="TC_Label"
                value={formData.TC_Label || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: Bannières Display Google"
              />
            </div>
            
            {/* TC_Status */}
            <div>
              <label htmlFor="TC_Status" className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                id="TC_Status"
                name="TC_Status"
                value={formData.TC_Status || 'Planned'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                <label htmlFor="TC_StartDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  id="TC_StartDate"
                  name="TC_StartDate"
                  value={formData.TC_StartDate || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="TC_EndDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  id="TC_EndDate"
                  name="TC_EndDate"
                  value={formData.TC_EndDate || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        );
      
      case 'strategie':
        return (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Stratégie média</h3>
            
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
            
            {/* Champs texte libres */}
            <div>
              <label htmlFor="TC_Product_Open" className="block text-sm font-medium text-gray-700 mb-1">
                Produit
              </label>
              <input
                type="text"
                id="TC_Product_Open"
                name="TC_Product_Open"
                value={formData.TC_Product_Open || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: iPhone 15 Pro"
              />
            </div>
            
            <div>
              <label htmlFor="TC_Targeting_Open" className="block text-sm font-medium text-gray-700 mb-1">
                Ciblage
              </label>
              <textarea
                id="TC_Targeting_Open"
                name="TC_Targeting_Open"
                rows={3}
                value={formData.TC_Targeting_Open || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Décrivez le ciblage de cette tactique..."
              />
            </div>
            
            <div>
              <label htmlFor="TC_Market_Open" className="block text-sm font-medium text-gray-700 mb-1">
                Marché
              </label>
              <input
                type="text"
                id="TC_Market_Open"
                name="TC_Market_Open"
                value={formData.TC_Market_Open || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: Canada, Québec, Montréal"
              />
            </div>
            
            <div>
              <label htmlFor="TC_Format_Open" className="block text-sm font-medium text-gray-700 mb-1">
                Description du format
              </label>
              <textarea
                id="TC_Format_Open"
                name="TC_Format_Open"
                rows={2}
                value={formData.TC_Format_Open || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Décrivez le format utilisé..."
              />
            </div>
          </div>
        );
        
      case 'kpis':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">KPIs et objectifs</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">
                Cette section sera développée pour inclure les objectifs de performance, 
                les KPIs cibles, et les métriques de suivi.
              </p>
            </div>
          </div>
        );
        
      case 'budget':
        return (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Budget</h3>
            
            {/* TC_Budget */}
            <div>
              <label htmlFor="TC_Budget" className="block text-sm font-medium text-gray-700 mb-1">
                Budget de la tactique *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="TC_Budget"
                  name="TC_Budget"
                  value={formData.TC_Budget || 0}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className="block w-full pl-7 pr-12 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">CAD</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-700">
                💡 Le budget sera automatiquement redistribué aux placements associés à cette tactique.
              </p>
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
      onClose={handleClose}
      title={tactique ? `Modifier la tactique: ${tactique.TC_Label}` : 'Nouvelle tactique'}
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* Messages d'erreur */}
        {error && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {/* Navigation par onglets */}
        <FormTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {/* Contenu de l'onglet actif */}
        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>
        
        {/* Footer avec les boutons d'action */}
        <div className="sticky bottom-0 bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : (tactique ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>
        </div>
      </form>
    </FormDrawer>
  );
}