// app/components/Taxonomy/ClientTaxonomies.tsx
/**
 * Ce fichier gère l'affichage, l'ajout, la modification et la suppression des taxonomies associées à un client spécifique.
 * Il permet aux utilisateurs de visualiser les taxonomies existantes, d'en créer de nouvelles, de mettre à jour celles qui existent
 * déjà et de les supprimer, en tenant compte des permissions de l'utilisateur.
 */

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
import { usePermissions } from '../../contexts/PermissionsContext';
import { Taxonomy, TaxonomyFormData } from '../../types/taxonomy';
import TaxonomyForm from './TaxonomyForm';

/**
 * Composant ClientTaxonomies.
 * Affiche et gère les taxonomies d'un client sélectionné.
 *
 * @returns {JSX.Element} Le composant ClientTaxonomies.
 */
const ClientTaxonomies: React.FC = () => {
  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const hasTaxonomyPermission = canPerformAction('Taxonomy');
  
  const [showTaxonomyForm, setShowTaxonomyForm] = useState(false);
  const [currentTaxonomy, setCurrentTaxonomy] = useState<Taxonomy | null>(null);
  
  const [expandedTaxonomies, setExpandedTaxonomies] = useState<{[taxonomyId: string]: boolean}>({});

  /**
   * Fonction pour formater le texte avec des opportunités de line break avant les crochets
   *
   * @param {string} text - Le texte à formater
   * @returns {JSX.Element | string} Le texte formaté avec des breaks ou le texte original
   */
  const formatTextWithBreaks = (text: string): JSX.Element | string => {
    if (!text || !text.includes('[')) {
      return text;
    }

    const parts = text.split('[');
    
    return (
      <>
        {parts[0]}
        {parts.slice(1).map((part, index) => (
          <React.Fragment key={index}>
            <wbr />
            [<span className="break-words">{part}</span>
          </React.Fragment>
        ))}
      </>
    );
  };

  /**
   * Effet de chargement des taxonomies lorsque le client sélectionné change.
   *
   * @param {string | null} selectedClient - Le client actuellement sélectionné.
   */
  useEffect(() => {
    if (selectedClient) {
      loadTaxonomies();
    }
  }, [selectedClient]);

  /**
   * Charge les taxonomies du client sélectionné depuis Firebase.
   * Met à jour les états de chargement, d'erreur et des taxonomies.
   *
   * @returns {Promise<void>} Une promesse qui se résout une fois les taxonomies chargées.
   */
  const loadTaxonomies = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("FIREBASE: LECTURE - Fichier: ClientTaxonomies.tsx - Fonction: loadTaxonomies - Path: clients/${selectedClient.clientId}/taxonomies");
      const fetchedTaxonomies = await getClientTaxonomies(selectedClient.clientId);
      setTaxonomies(fetchedTaxonomies);
      
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

  /**
   * Alterne l'état d'expansion/réduction d'une taxonomie spécifique.
   *
   * @param {string} taxonomyId - L'identifiant de la taxonomie à basculer.
   * @returns {void}
   */
  const toggleTaxonomyExpand = (taxonomyId: string) => {
    setExpandedTaxonomies(prev => ({
      ...prev,
      [taxonomyId]: !prev[taxonomyId]
    }));
  };

  /**
   * Gère l'ajout d'une nouvelle taxonomie.
   * Appelle le service d'ajout de taxonomie et met à jour l'interface utilisateur.
   *
   * @param {TaxonomyFormData} formData - Les données du formulaire de la nouvelle taxonomie.
   * @returns {Promise<void>} Une promesse qui se résout après l'ajout de la taxonomie.
   */
  const handleAddTaxonomy = async (formData: TaxonomyFormData) => {
    if (!selectedClient || !hasTaxonomyPermission) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("FIREBASE: ÉCRITURE - Fichier: ClientTaxonomies.tsx - Fonction: handleAddTaxonomy - Path: clients/${selectedClient.clientId}/taxonomies");
      await addTaxonomy(selectedClient.clientId, formData);
      
      setSuccess('Taxonomie ajoutée avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      setShowTaxonomyForm(false);
      await loadTaxonomies();
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la taxonomie:', err);
      setError('Impossible d\'ajouter la taxonomie.');
      setLoading(false);
    }
  };

  /**
   * Gère la mise à jour d'une taxonomie existante.
   * Appelle le service de mise à jour de taxonomie et met à jour l'interface utilisateur.
   *
   * @param {TaxonomyFormData} formData - Les données mises à jour du formulaire de la taxonomie.
   * @returns {Promise<void>} Une promesse qui se résout après la mise à jour de la taxonomie.
   */
  const handleUpdateTaxonomy = async (formData: TaxonomyFormData) => {
    if (!selectedClient || !currentTaxonomy || !hasTaxonomyPermission) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("FIREBASE: ÉCRITURE - Fichier: ClientTaxonomies.tsx - Fonction: handleUpdateTaxonomy - Path: clients/${selectedClient.clientId}/taxonomies/${currentTaxonomy.id}");
      await updateTaxonomy(selectedClient.clientId, currentTaxonomy.id, formData);
      
      setSuccess('Taxonomie mise à jour avec succès.');
      setTimeout(() => setSuccess(null), 3000);
      
      setShowTaxonomyForm(false);
      setCurrentTaxonomy(null);
      await loadTaxonomies();
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la taxonomie:', err);
      setError('Impossible de mettre à jour la taxonomie.');
      setLoading(false);
    }
  };

  /**
   * Gère la suppression d'une taxonomie.
   * Demande une confirmation à l'utilisateur, puis appelle le service de suppression.
   *
   * @param {string} taxonomyId - L'identifiant de la taxonomie à supprimer.
   * @returns {Promise<void>} Une promesse qui se résout après la suppression de la taxonomie.
   */
  const handleDeleteTaxonomy = async (taxonomyId: string) => {
    if (!selectedClient || !hasTaxonomyPermission) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette taxonomie ?')) {
      try {
        setLoading(true);
        setError(null);
        
        console.log("FIREBASE: ÉCRITURE - Fichier: ClientTaxonomies.tsx - Fonction: handleDeleteTaxonomy - Path: clients/${selectedClient.clientId}/taxonomies/${taxonomyId}");
        await deleteTaxonomy(selectedClient.clientId, taxonomyId);
        
        setSuccess('Taxonomie supprimée avec succès.');
        setTimeout(() => setSuccess(null), 3000);
        
        await loadTaxonomies();
      } catch (err) {
        console.error('Erreur lors de la suppression de la taxonomie:', err);
        setError('Impossible de supprimer la taxonomie.');
        setLoading(false);
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
              if (hasTaxonomyPermission) {
                setCurrentTaxonomy(null);
                setShowTaxonomyForm(true);
              }
            }}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm ${
              hasTaxonomyPermission 
                ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                : 'text-gray-500 bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!hasTaxonomyPermission}
            title={!hasTaxonomyPermission ? "Vous n'avez pas la permission d'ajouter des taxonomies" : ""}
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
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
            {success}
          </div>
        )}
        
        {!hasTaxonomyPermission && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700">
            Vous êtes en mode lecture seule. Vous n'avez pas les permissions nécessaires pour modifier les taxonomies.
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
                        if (hasTaxonomyPermission) {
                          setCurrentTaxonomy(taxonomy);
                          setShowTaxonomyForm(true);
                        }
                      }}
                      className={`${
                        hasTaxonomyPermission 
                          ? 'text-gray-500 hover:text-indigo-600' 
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                      disabled={!hasTaxonomyPermission}
                      title={!hasTaxonomyPermission ? "Vous n'avez pas la permission de modifier les taxonomies" : ""}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasTaxonomyPermission) {
                          handleDeleteTaxonomy(taxonomy.id);
                        }
                      }}
                      className={`${
                        hasTaxonomyPermission 
                          ? 'text-gray-500 hover:text-red-600' 
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                      disabled={!hasTaxonomyPermission}
                      title={!hasTaxonomyPermission ? "Vous n'avez pas la permission de supprimer les taxonomies" : ""}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

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
                                <p className="text-sm text-gray-900 overflow-wrap-break-word">
                                  {formatTextWithBreaks(title as string)}
                                </p>
                              </div>
                            )}
                            {name && (
                              <div>
                                <span className="text-xs text-gray-500">Nom:</span>
                                <p className="text-sm text-gray-900 overflow-wrap-break-word">
                                  {formatTextWithBreaks(name as string)}
                                </p>
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

      {showTaxonomyForm && hasTaxonomyPermission && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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