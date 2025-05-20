'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, ChevronDownIcon, ChevronRightIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { 
  getClientTaxonomies, 
  addTaxonomy, 
  updateTaxonomy,
  deleteTaxonomy
} from '../../lib/taxonomyService';
import { useClient } from '../../contexts/ClientContext';
import { Taxonomy, TaxonomyFormData } from '../../types/taxonomy';
import TaxonomyForm from './TaxonomyForm';

const ClientTaxonomies: React.FC = () => {
  const { selectedClient } = useClient();
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les formulaires
  const [showTaxonomyForm, setShowTaxonomyForm] = useState(false);
  const [currentTaxonomy, setCurrentTaxonomy] = useState<Taxonomy | null>(null);
  
  // État pour les accordions
  const [expandedTaxonomies, setExpandedTaxonomies] = useState<{[taxonomyId: string]: boolean}>({});

  // Charger les taxonomies quand le client change
  useEffect(() => {
    if (selectedClient) {
      loadTaxonomies();
    }
  }, [selectedClient]);

  const loadTaxonomies = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const fetchedTaxonomies = await getClientTaxonomies(selectedClient.clientId);
      setTaxonomies(fetchedTaxonomies);
      
      // Initialiser l'état des accordions
      const expanded: {[taxonomyId: string]: boolean} = {};
      fetchedTaxonomies.forEach(taxonomy => {
        expanded[taxonomy.id] = false;
      });
      setExpandedTaxonomies(expanded);
      
    } catch (err) {
      console.error('Erreur lors du chargement des taxonomies:', err);
      setError('Impossible de charger les taxonomies du client.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaxonomyExpand = (taxonomyId: string) => {
    setExpandedTaxonomies(prev => ({
      ...prev,
      [taxonomyId]: !prev[taxonomyId]
    }));
  };

  // Gestion des taxonomies
  const handleAddTaxonomy = async (formData: TaxonomyFormData) => {
    if (!selectedClient) return;
    
    try {
      await addTaxonomy(selectedClient.clientId, formData);
      setShowTaxonomyForm(false);
      loadTaxonomies();
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la taxonomie:', err);
      setError('Impossible d\'ajouter la taxonomie.');
    }
  };

  const handleUpdateTaxonomy = async (formData: TaxonomyFormData) => {
    if (!selectedClient || !currentTaxonomy) return;
    
    try {
      await updateTaxonomy(selectedClient.clientId, currentTaxonomy.id, formData);
      setShowTaxonomyForm(false);
      setCurrentTaxonomy(null);
      loadTaxonomies();
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la taxonomie:', err);
      setError('Impossible de mettre à jour la taxonomie.');
    }
  };

  const handleDeleteTaxonomy = async (taxonomyId: string) => {
    if (!selectedClient) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette taxonomie ?')) {
      try {
        await deleteTaxonomy(selectedClient.clientId, taxonomyId);
        loadTaxonomies();
      } catch (err) {
        console.error('Erreur lors de la suppression de la taxonomie:', err);
        setError('Impossible de supprimer la taxonomie.');
      }
    }
  };

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Veuillez sélectionner un client pour voir ses taxonomies.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Taxonomies du client</h2>
          <button
            onClick={() => {
              setCurrentTaxonomy(null);
              setShowTaxonomyForm(true);
            }}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Ajouter une taxonomie
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-4 text-center text-gray-500">Chargement des taxonomies...</div>
        ) : taxonomies.length === 0 ? (
          <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            <p>Aucune taxonomie configurée pour ce client.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {taxonomies.map((taxonomy) => (
              <div key={taxonomy.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* En-tête de la taxonomie */}
                <div 
                  className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleTaxonomyExpand(taxonomy.id)}
                >
                  <div className="flex items-center">
                    {expandedTaxonomies[taxonomy.id] ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{taxonomy.NA_Display_Name}</h3>
                      <p className="text-sm text-gray-500">
                        {taxonomy.NA_Standard ? 'Standard' : 'Personnalisée'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentTaxonomy(taxonomy);
                        setShowTaxonomyForm(true);
                      }}
                      className="text-gray-500 hover:text-indigo-600"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTaxonomy(taxonomy.id);
                      }}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Détails de la taxonomie (visible si expanded) */}
                {expandedTaxonomies[taxonomy.id] && (
                  <div className="p-4 bg-white">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                      <p className="text-sm text-gray-600">{taxonomy.NA_Description || 'Aucune description'}</p>
                    </div>

                    <h4 className="text-sm font-medium text-gray-700 mb-2">Niveaux de taxonomie</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((level) => {
                        const title = taxonomy[`NA_Name_Level_${level}_Title` as keyof Taxonomy];
                        const name = taxonomy[`NA_Name_Level_${level}` as keyof Taxonomy];
                        
                        if (!title && !name) return null;
                        
                        return (
                          <div key={level} className="border border-gray-200 rounded-md p-3">
                            <h5 className="text-xs font-medium text-gray-700 mb-1">Niveau {level}</h5>
                            {title && (
                              <div className="mb-2">
                                <span className="text-xs text-gray-500">Titre:</span>
                                <p className="text-sm text-gray-900">{title}</p>
                              </div>
                            )}
                            {name && (
                              <div>
                                <span className="text-xs text-gray-500">Nom:</span>
                                <p className="text-sm text-gray-900">{name}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal pour le formulaire de taxonomie */}
      {showTaxonomyForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {currentTaxonomy ? 'Modifier la taxonomie' : 'Ajouter une taxonomie'}
            </h3>
            <TaxonomyForm
              taxonomy={currentTaxonomy || undefined}
              onSubmit={currentTaxonomy ? handleUpdateTaxonomy : handleAddTaxonomy}
              onCancel={() => {
                setShowTaxonomyForm(false);
                setCurrentTaxonomy(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientTaxonomies;