// app/components/Taxonomy/ClientTaxonomies.tsx
/**
 * Ce fichier gère l'affichage, l'ajout, la modification et la suppression des taxonomies associées à un client spécifique.
 * Il permet aux utilisateurs de visualiser les taxonomies existantes, d'en créer de nouvelles, de mettre à jour celles qui existent
 * déjà et de les supprimer, en tenant compte des permissions de l'utilisateur.
 * NOUVEAU: Ajout de la fonctionnalité de recherche/remplacement en masse dans les champs de structure.
 * NOUVEAU: Ajout de la fonctionnalité de recherche pour trouver les occurrences dans les taxonomies.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  ChevronDownIcon, 
  ChevronRightIcon, 
  TrashIcon, 
  PencilIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import { 
  getClientTaxonomies, 
  addTaxonomy, 
  updateTaxonomy,
  deleteTaxonomy,
  searchReplaceInTaxonomies,
  searchInTaxonomies
} from '../../lib/taxonomyService';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Taxonomy, TaxonomyFormData, SearchResult } from '../../types/taxonomy';
import TaxonomyForm from './TaxonomyForm';
import { useTranslation } from '../../contexts/LanguageContext';

/**
 * Composant ClientTaxonomies.
 * Affiche et gère les taxonomies d'un client sélectionné.
 *
 * @returns {JSX.Element} Le composant ClientTaxonomies.
 */
const ClientTaxonomies: React.FC = () => {
  const { t } = useTranslation();
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

  // États pour le modal de recherche/remplacement
  const [showSearchReplaceModal, setShowSearchReplaceModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isSearchReplaceLoading, setIsSearchReplaceLoading] = useState(false);

  // NOUVEAU: États pour le modal de recherche
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchOnlyText, setSearchOnlyText] = useState('');
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

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
   * NOUVEAU: Fonction pour mettre en évidence le texte recherché dans les résultats
   */
  const highlightSearchText = (text: string, searchText: string): JSX.Element => {
    if (!searchText) return <span>{text}</span>;
    
    const parts = text.split(new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === searchText.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
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
      setError(t('clientTaxonomies.errors.loadFailed'));
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
      
      setSuccess(t('clientTaxonomies.success.added'));
      setTimeout(() => setSuccess(null), 3000);
      
      setShowTaxonomyForm(false);
      await loadTaxonomies();
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la taxonomie:', err);
      setError(t('clientTaxonomies.errors.addFailed'));
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
      
      setSuccess(t('clientTaxonomies.success.updated'));
      setTimeout(() => setSuccess(null), 3000);
      
      setShowTaxonomyForm(false);
      setCurrentTaxonomy(null);
      await loadTaxonomies();
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la taxonomie:', err);
      setError(t('clientTaxonomies.errors.updateFailed'));
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
    
    if (window.confirm(t('clientTaxonomies.confirm.delete'))) {
      try {
        setLoading(true);
        setError(null);
        
        console.log("FIREBASE: ÉCRITURE - Fichier: ClientTaxonomies.tsx - Fonction: handleDeleteTaxonomy - Path: clients/${selectedClient.clientId}/taxonomies/${taxonomyId}");
        await deleteTaxonomy(selectedClient.clientId, taxonomyId);
        
        setSuccess(t('clientTaxonomies.success.deleted'));
        setTimeout(() => setSuccess(null), 3000);
        
        await loadTaxonomies();
      } catch (err) {
        console.error('Erreur lors de la suppression de la taxonomie:', err);
        setError(t('clientTaxonomies.errors.deleteFailed'));
        setLoading(false);
      }
    }
  };

  /**
   * Gère la recherche et le remplacement en masse dans toutes les taxonomies du client.
   * Appelle le service de recherche/remplacement et met à jour l'interface utilisateur.
   *
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   * @returns {Promise<void>} Une promesse qui se résout après le remplacement.
   */
  const handleSearchReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !hasTaxonomyPermission || !searchText.trim()) return;
    
    try {
      setIsSearchReplaceLoading(true);
      setError(null);
      
      console.log("FIREBASE: ÉCRITURE - Fichier: ClientTaxonomies.tsx - Fonction: handleSearchReplace - Path: clients/${selectedClient.clientId}/taxonomies (multiple)");
      const replacementCount = await searchReplaceInTaxonomies(selectedClient.clientId, searchText, replaceText);
      
      if (replacementCount > 0) {
        setSuccess(t('clientTaxonomies.success.replacementsMade', { count: replacementCount }));
        setTimeout(() => setSuccess(null), 5000);
        await loadTaxonomies(); // Recharger les taxonomies pour voir les changements
      } else {
        setSuccess(t('clientTaxonomies.info.noneFound'));
        setTimeout(() => setSuccess(null), 3000);
      }
      
      // Fermer le modal et réinitialiser les champs
      setShowSearchReplaceModal(false);
      setSearchText('');
      setReplaceText('');
      
    } catch (err) {
      console.error('Erreur lors du remplacement:', err);
      setError(t('clientTaxonomies.errors.replaceFailed'));
    } finally {
      setIsSearchReplaceLoading(false);
    }
  };

  /**
   * NOUVEAU: Gère la recherche dans toutes les taxonomies du client.
   * Appelle le service de recherche et affiche les résultats.
   *
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   * @returns {Promise<void>} Une promesse qui se résout après la recherche.
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !searchOnlyText.trim()) return;
    
    try {
      setIsSearchLoading(true);
      setError(null);
      setSearchResults([]);
      
      console.log("FIREBASE: LECTURE - Fichier: ClientTaxonomies.tsx - Fonction: handleSearch - Path: clients/${selectedClient.clientId}/taxonomies (search)");
      const results = await searchInTaxonomies(selectedClient.clientId, searchOnlyText);
      setSearchResults(results);
      
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError(t('clientTaxonomies.errors.searchFailed'));
    } finally {
      setIsSearchLoading(false);
    }
  };

  /**
   * Ferme le modal de recherche/remplacement et réinitialise les champs.
   */
  const closeSearchReplaceModal = () => {
    setShowSearchReplaceModal(false);
    setSearchText('');
    setReplaceText('');
  };

  /**
   * NOUVEAU: Ferme le modal de recherche et réinitialise les champs.
   */
  const closeSearchModal = () => {
    setShowSearchModal(false);
    setSearchOnlyText('');
    setSearchResults([]);
  };

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">{t('clientTaxonomies.selectClientPrompt')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">{t('clientTaxonomies.header.title')}</h2>
          <div className="flex space-x-2">
            {/* NOUVEAU: Bouton Rechercher */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-black-500 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-100"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
              {t('common.search')}
            </button>
            
            {/* Bouton Rechercher & Remplacer */}
            <button
              onClick={() => {
                if (hasTaxonomyPermission) {
                  setShowSearchReplaceModal(true);
                }
              }}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm ${
                hasTaxonomyPermission 
                  ? 'text-black-500 bg-indigo-200 hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-100' 
                  : 'text-gray-500 bg-gray-300 cursor-not-allowed'
              }`}
              disabled={!hasTaxonomyPermission}
              title={!hasTaxonomyPermission ? t('clientTaxonomies.permissions.cannotModify') : ""}
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
              {t('clientTaxonomies.buttons.searchAndReplace')}
            </button>
            
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
              title={!hasTaxonomyPermission ? t('clientTaxonomies.permissions.cannotAdd') : ""}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              {t('clientTaxonomies.buttons.add')}
            </button>
          </div>
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
            {t('clientTaxonomies.permissions.readOnly')}
          </div>
        )}

        {loading ? (
          <div className="py-4 text-center text-gray-500">{t('clientTaxonomies.loading.taxonomies')}</div>
        ) : taxonomies.length === 0 ? (
          <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            <p>{t('clientTaxonomies.emptyState.noTaxonomies')}</p>
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
                        {taxonomy.NA_Standard ? t('clientTaxonomies.details.standard') : t('clientTaxonomies.details.custom')}
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
                      title={!hasTaxonomyPermission ? t('clientTaxonomies.permissions.cannotModify') : t('common.edit')}
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
                      title={!hasTaxonomyPermission ? t('clientTaxonomies.permissions.cannotDelete') : t('common.delete')}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {expandedTaxonomies[taxonomy.id] && (
                  <div className="p-4 bg-white">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">{t('clientTaxonomies.details.description')}</h4>
                      <p className="text-sm text-gray-600">{taxonomy.NA_Description || t('clientTaxonomies.details.noDescription')}</p>
                    </div>

                    <h4 className="text-sm font-medium text-gray-700 mb-2">{t('clientTaxonomies.details.taxonomyLevels')}</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((level) => {
                        const title = taxonomy[`NA_Name_Level_${level}_Title` as keyof Taxonomy];
                        const name = taxonomy[`NA_Name_Level_${level}` as keyof Taxonomy];
                        
                        if (!title && !name) return null;
                        
                        return (
                          <div key={level} className="border border-gray-200 rounded-md p-3">
                            <h5 className="text-xs font-medium text-gray-700 mb-1">{t('clientTaxonomies.details.level', { level })}</h5>
                            {title && (
                              <div className="mb-2">
                                <span className="text-xs text-gray-500">{t('clientTaxonomies.details.title')}</span>
                                <p className="text-sm text-gray-900 overflow-wrap-break-word">
                                  {formatTextWithBreaks(title as string)}
                                </p>
                              </div>
                            )}
                            {name && (
                              <div>
                                <span className="text-xs text-gray-500">{t('clientTaxonomies.details.name')}</span>
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

      {/* Modal de formulaire de taxonomie */}
      {showTaxonomyForm && hasTaxonomyPermission && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {currentTaxonomy ? t('clientTaxonomies.form.editTitle') : t('clientTaxonomies.form.addTitle')}
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

      {/* NOUVEAU: Modal de recherche */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('clientTaxonomies.searchModal.title')}
            </h3>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="searchOnlyText" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientTaxonomies.searchModal.searchLabel')}
                </label>
                <input
                  type="text"
                  id="searchOnlyText"
                  value={searchOnlyText}
                  onChange={(e) => setSearchOnlyText(e.target.value)}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder={t('clientTaxonomies.searchModal.searchPlaceholder')}
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeSearchModal}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isSearchLoading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!searchOnlyText.trim() || isSearchLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSearchLoading ? t('clientTaxonomies.searchModal.searching') : t('common.search')}
                </button>
              </div>
            </form>

            {/* Affichage des résultats de recherche */}
            {searchResults.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  {t('clientTaxonomies.searchModal.results', { count: searchResults.length })}
                </h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{result.taxonomyName}</h5>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          {t('clientTaxonomies.details.level', { level: result.level })}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        <span className="text-xs text-gray-500 mr-2">{t('clientTaxonomies.searchModal.foundIn')}:</span>
                        <div className="font-mono bg-white p-2 rounded border mt-1 break-all">
                          {highlightSearchText(result.content, searchOnlyText)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message si aucun résultat */}
            {!isSearchLoading && searchOnlyText && searchResults.length === 0 && (
              <div className="mt-6 border-t pt-4">
                <p className="text-gray-500 text-center py-4">
                  {t('clientTaxonomies.searchModal.noResults')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de recherche et remplacement */}
      {showSearchReplaceModal && hasTaxonomyPermission && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('clientTaxonomies.buttons.searchAndReplace')}
            </h3>
            <form onSubmit={handleSearchReplace} className="space-y-4">
              <div>
                <label htmlFor="searchText" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientTaxonomies.searchReplaceModal.searchLabel')}
                </label>
                <input
                  type="text"
                  id="searchText"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder={t('clientTaxonomies.searchReplaceModal.searchPlaceholder')}
                  autoFocus
                />
              </div>
              
              <div>
                <label htmlFor="replaceText" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientTaxonomies.searchReplaceModal.replaceLabel')}
                </label>
                <input
                  type="text"
                  id="replaceText"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder={t('clientTaxonomies.searchReplaceModal.replacePlaceholder')}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeSearchReplaceModal}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isSearchReplaceLoading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!searchText.trim() || isSearchReplaceLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSearchReplaceLoading ? t('clientTaxonomies.searchReplaceModal.replacing') : t('clientTaxonomies.buttons.replace')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientTaxonomies;