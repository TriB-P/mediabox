/**
 * Ce fichier gère la page principale des guides de coûts.
 * Il permet aux administrateurs de créer, visualiser, modifier et supprimer des guides de coûts.
 * Pour les utilisateurs non-administrateurs, il affiche le guide de coûts associé à leur client.
 * Il intègre des composants pour la gestion des entrées de guide (liste hiérarchique et tableau d'édition rapide).
 */
'use client';

import { useState, useEffect } from 'react';
import { CostGuide, CostGuideEntry } from '../types/costGuide';
import {
  getCostGuides,
  createCostGuide,
  deleteCostGuide,
  updateCostGuide,
  getCostGuideEntries,
  getCostGuideById,
} from '../lib/costGuideService';
import { getClientInfo } from '../lib/clientService';
import { getPartnersList } from '../lib/listService';
import {
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PencilIcon,
  TableCellsIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import CostGuideEntryForm from '../components/CostGuide/CostGuideEntryForm';
import CostGuideEntryList from '../components/CostGuide/CostGuideEntryList';
import CostGuideEntryTable from '../components/CostGuide/CostGuideEntryTable';
import { usePermissions } from '../contexts/PermissionsContext';
import { useClient } from '../contexts/ClientContext';
import { useTranslation } from '../contexts/LanguageContext';

/**
 * Composant principal de la page des guides de coûts.
 * Affiche la liste des guides pour les administrateurs et le guide spécifique pour les clients.
 * Permet la gestion des guides et de leurs entrées.
 * @returns {JSX.Element} Le composant de la page des guides de coûts.
 */
export default function CostGuidePage() {
  const { t } = useTranslation();
  const { userRole, canPerformAction } = usePermissions();
  const { selectedClient } = useClient();
  const isAdmin = userRole === 'admin';
  const hasCostGuidePermission = canPerformAction('CostGuide');

  const [guides, setGuides] = useState<CostGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGuideName, setNewGuideName] = useState('');
  const [newGuideDescription, setNewGuideDescription] = useState('');
  
  const [selectedGuide, setSelectedGuide] = useState<CostGuide | null>(null);
  const [entries, setEntries] = useState<CostGuideEntry[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CostGuideEntry | null>(null);
  const [formPreset, setFormPreset] = useState<{
    partnerId?: string;
    level1?: string;
    level2?: string;
  }>({});
  
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [clientGuideId, setClientGuideId] = useState<string | null>(null);

  /**
   * Effet de chargement initial des guides basé sur le rôle de l'utilisateur et le client sélectionné.
   * Si l'utilisateur est admin, charge tous les guides.
   * Si un client est sélectionné, charge le guide associé à ce client.
   * @returns {void}
   */
  useEffect(() => {
    if (isAdmin) {
      loadGuides();
    } else if (selectedClient) {
      loadClientGuide();
    } else {
      setLoading(false);
    }
  }, [selectedClient, isAdmin]);

  /**
   * Charge le guide de coûts associé au client actuellement sélectionné.
   * Met à jour les états `guides`, `clientGuideId`, `error` et `loading`.
   * @returns {Promise<void>}
   */
  const loadClientGuide = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("FIREBASE: LECTURE - Fichier: page.tsx - Fonction: loadClientGuide - Path: clients/${selectedClient.clientId}");
      const clientInfo = await getClientInfo(selectedClient.clientId);
      const guideId = clientInfo.CL_Cost_Guide_ID;
      setClientGuideId(guideId || null);
      
      if (guideId) {
        console.log("FIREBASE: LECTURE - Fichier: page.tsx - Fonction: loadClientGuide - Path: costGuides/${guideId}");
        const loadedGuide = await getCostGuideById(guideId);
        if (loadedGuide) {
          setGuides([loadedGuide]);
          await loadGuideDetails(guideId);
        } else {
          setGuides([]);
          setError(t('costGuidePage.error.clientGuideNotFound'));
        }
      } else {
        setGuides([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du guide client:', err);
      setError(t('costGuidePage.error.loadClientGuide'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charge la liste complète des guides de coûts. Utilisé uniquement par les administrateurs.
   * Met à jour les états `guides`, `error` et `loading`.
   * @returns {Promise<void>}
   */
  const loadGuides = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("FIREBASE: LECTURE - Fichier: page.tsx - Fonction: loadGuides - Path: costGuides");
      const data = await getCostGuides();
      setGuides(data);
    } catch (err) {
      setError(t('costGuidePage.error.loadGuides'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charge les détails d'un guide de coûts spécifique, y compris ses entrées et la liste des partenaires.
   * Met à jour les états `selectedGuide`, `editedName`, `editedDescription`, `entries`, `partners`, `error` et `loadingDetail`.
   * @param {string} guideId L'identifiant du guide à charger.
   * @returns {Promise<void>}
   */
  const loadGuideDetails = async (guideId: string) => {
    try {
      setLoadingDetail(true);
      
      let guide = guides.find(g => g.id === guideId);
      
      if (!guide) {
        console.log("FIREBASE: LECTURE - Fichier: page.tsx - Fonction: loadGuideDetails - Path: costGuides/${guideId}");
        const loadedGuide = await getCostGuideById(guideId);
        if (!loadedGuide) {
          setError(t('costGuidePage.error.guideNotFound'));
          return;
        }
        guide = loadedGuide;
      }
      
      setSelectedGuide(guide);
      setEditedName(guide.name);
      setEditedDescription(guide.description);
      
      console.log("FIREBASE: LECTURE - Fichier: page.tsx - Fonction: loadGuideDetails - Path: costGuides/${guideId}/entries");
      const entriesData = await getCostGuideEntries(guideId);
      setEntries(entriesData);
      
      console.log("FIREBASE: LECTURE - Fichier: page.tsx - Fonction: loadGuideDetails - Path: partners");
      const partnersData = await getPartnersList();
      setPartners(partnersData);
    } catch (err) {
      console.error('Erreur lors du chargement du guide:', err);
      setError(t('costGuidePage.error.loadData'));
    } finally {
      setLoadingDetail(false);
    }
  };

  /**
   * Gère la création d'un nouveau guide de coûts.
   * Ne permet la création que si l'utilisateur est admin.
   * Met à jour les états `loading`, `error`, `isCreateModalOpen`, `newGuideName` et `newGuideDescription`.
   * Appelle `loadGuides` pour rafraîchir la liste et `loadGuideDetails` pour afficher le nouveau guide.
   * @returns {Promise<void>}
   */
  const handleCreateGuide = async () => {
    if (!newGuideName.trim() || !isAdmin) return;

    try {
      setLoading(true);
      console.log("FIREBASE: ÉCRITURE - Fichier: page.tsx - Fonction: handleCreateGuide - Path: costGuides");
      const guideId = await createCostGuide({
        name: newGuideName,
        description: newGuideDescription,
      });
      await loadGuides();
      setIsCreateModalOpen(false);
      setNewGuideName('');
      setNewGuideDescription('');
      
      await loadGuideDetails(guideId);
    } catch (err) {
      setError(t('costGuidePage.error.createGuide'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère la suppression d'un guide de coûts.
   * Ne permet la suppression que si l'utilisateur est admin et après confirmation.
   * Met à jour les états `loading`, `selectedGuide`, `guides`, `clientGuideId` et `error`.
   * @param {string} guideId L'identifiant du guide à supprimer.
   * @returns {Promise<void>}
   */
  const handleDeleteGuide = async (guideId: string) => {
    if (!isAdmin || !confirm(t('costGuidePage.confirmDelete'))) return;

    try {
      setLoading(true);
      console.log("FIREBASE: ÉCRITURE - Fichier: page.tsx - Fonction: handleDeleteGuide - Path: costGuides/${guideId}");
      await deleteCostGuide(guideId);
      
      if (selectedGuide && selectedGuide.id === guideId) {
        setSelectedGuide(null);
      }
      
      if (isAdmin) {
        await loadGuides();
      } else {
        setGuides([]);
        setClientGuideId(null);
      }
    } catch (err) {
      setError(t('costGuidePage.error.deleteGuide'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère la mise à jour d'un guide de coûts existant.
   * Ne permet la mise à jour que si un guide est sélectionné et si l'utilisateur est admin ou si c'est le guide de son client.
   * Met à jour les états `guides`, `selectedGuide`, `editedName`, `editedDescription` et `isEditing`.
   * @returns {Promise<void>}
   */
  const handleUpdateGuide = async () => {
    if (!selectedGuide || (!isAdmin && clientGuideId !== selectedGuide.id)) return;
    
    try {
      console.log("FIREBASE: ÉCRITURE - Fichier: page.tsx - Fonction: handleUpdateGuide - Path: costGuides/${selectedGuide.id}");
      await updateCostGuide(selectedGuide.id, {
        name: editedName,
        description: editedDescription,
      });
      
      const updatedGuides = guides.map(guide => 
        guide.id === selectedGuide.id 
          ? { ...guide, name: editedName, description: editedDescription } 
          : guide
      );
      setGuides(updatedGuides);
      
      setSelectedGuide({
        ...selectedGuide,
        name: editedName,
        description: editedDescription,
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du guide:', err);
      setError(t('costGuidePage.error.updateGuide'));
    }
  };

  /**
   * Rafraîchit la liste des entrées du guide actuellement sélectionné.
   * Met à jour l'état `entries`.
   * @returns {Promise<void>}
   */
  const refreshEntries = async () => {
    if (!selectedGuide) return;
    
    try {
      console.log("FIREBASE: LECTURE - Fichier: page.tsx - Fonction: refreshEntries - Path: costGuides/${selectedGuide.id}/entries");
      const entriesData = await getCostGuideEntries(selectedGuide.id);
      setEntries(entriesData);
    } catch (err) {
      console.error('Erreur lors du rechargement des entrées:', err);
    }
  };

  /**
   * Gère le retour à la liste des guides (pour les administrateurs) ou au rechargement du guide client (pour les non-administrateurs).
   * Réinitialise les états liés à la vue détaillée du guide.
   * @returns {void}
   */
  const handleBackToList = () => {
    if (!isAdmin && clientGuideId) {
      loadClientGuide();
    } else {
      setSelectedGuide(null);
      setEntries([]);
      setPartners([]);
      setIsEditing(false);
      setShowEntryForm(false);
      setSelectedEntry(null);
      setFormPreset({});
    }
  };
  
  /**
   * Ouvre le formulaire d'ajout d'entrée avec des valeurs prédéfinies.
   * Vérifie les permissions avant d'ouvrir le formulaire.
   * Met à jour les états `formPreset`, `selectedEntry` et `showEntryForm`.
   * @param {{ partnerId?: string; level1?: string; level2?: string; }} preset Les valeurs prédéfinies pour le formulaire.
   * @returns {void}
   */
  const handleAddWithPreset = (preset: {
    partnerId?: string;
    level1?: string;
    level2?: string;
  }) => {
    if (!hasCostGuidePermission) return;
    
    setFormPreset(preset);
    setSelectedEntry(null);
    setShowEntryForm(true);
  };

  /**
   * Affiche un message d'information si aucun guide de coûts n'est associé au client actuel.
   * @returns {JSX.Element} Le composant du message d'avertissement.
   */
  const renderNoClientGuide = () => (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationCircleIcon className="h-5 w-5 text-amber-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-amber-700">
            {t('costGuidePage.noClientGuideMessage')}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {!selectedGuide ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900">{t('costGuidePage.title')}</h1>
              <p className="text-gray-600">
                {isAdmin 
                  ? t('costGuidePage.subtitle.admin')
                  : t('costGuidePage.subtitle.client')
                }
              </p>
            </>
          ) : (
            <h1 className="text-xl font-bold text-gray-900">{t('costGuidePage.title')}</h1>
          )}
        </div>
        
        {!selectedGuide ? (
          isAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {t('costGuidePage.newGuideButton')}
            </button>
          )
        ) : (
          <button
            onClick={handleBackToList}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {isAdmin ? t('costGuidePage.backToListButton.admin') : t('costGuidePage.backToListButton.client')}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!isAdmin && !loading && guides.length === 0 && !selectedGuide && renderNoClientGuide()}

      {!selectedGuide && isAdmin && (
        <>
          {loading && !guides.length && (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('costGuidePage.loadingGuides')}</p>
            </div>
          )}

          {!loading && !guides.length && (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">
                {t('costGuidePage.noGuidesFound')}
              </p>
            </div>
          )}

          {guides.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {guides.map((guide) => (
                  <li key={guide.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="cursor-pointer" onClick={() => loadGuideDetails(guide.id)}>
                        <h3 className="text-lg font-medium text-gray-900">
                          {guide.name}
                        </h3>
                        {guide.description && (
                          <p className="text-sm text-gray-500">
                            {guide.description}
                          </p>
                        )}
                        
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleDeleteGuide(guide.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title={t('costGuidePage.deleteButton')}
                          disabled={!isAdmin}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => loadGuideDetails(guide.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent rounded text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                        >
                          <span className="mr-1">{t('costGuidePage.viewButton')}</span>
                          <ArrowRightIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {selectedGuide && (
        <>
          {loadingDetail && (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('costGuidePage.loadingCostGuide')}</p>
            </div>
          )}

          {!loadingDetail && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
                {isEditing ? (
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-lg font-bold"
                      placeholder={t('costGuidePage.guideNamePlaceholder')}
                    />
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm"
                      placeholder={t('costGuidePage.descriptionOptionalPlaceholder')}
                      rows={2}
                    ></textarea>
                  </div>
                ) : (
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{selectedGuide.name}</h2>
                    {selectedGuide.description && (
                      <p className="text-gray-600 mt-1">{selectedGuide.description}</p>
                    )}
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleUpdateGuide}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        {t('costGuidePage.saveButton')}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedName(selectedGuide.name);
                          setEditedDescription(selectedGuide.description);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {t('costGuidePage.cancelButton')}
                      </button>
                    </>
                  ) : (
                    <>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="text-gray-400 hover:text-indigo-600 p-2"
                            title={t('costGuidePage.modifyButton')}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGuide(selectedGuide.id)}
                            className="text-gray-400 hover:text-red-600 p-2"
                            title={t('costGuidePage.deleteButton')}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center px-3 py-1.5 rounded ${
                      viewMode === 'list'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-1" />
                    {t('costGuidePage.hierarchicalViewButton')}
                  </button>

                  {hasCostGuidePermission && (
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center px-3 py-1.5 rounded ${
                      viewMode === 'table'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <TableCellsIcon className="h-5 w-5 mr-1" />
                    {t('costGuidePage.quickEditButton')}
                  </button>)}
                </div>
                
                {hasCostGuidePermission && (
                  <button
                    onClick={() => {
                      setSelectedEntry(null);
                      setFormPreset({});
                      setShowEntryForm(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    {t('costGuidePage.newEntryButton')}
                  </button>
                )}
              </div>

              {showEntryForm && hasCostGuidePermission && (
                <div className="bg-white rounded-lg shadow p-6">
                  <CostGuideEntryForm
                    guideId={selectedGuide.id}
                    entry={selectedEntry}
                    preset={formPreset}
                    onCancel={() => {
                      setShowEntryForm(false);
                      setSelectedEntry(null);
                      setFormPreset({});
                    }}
                    onSuccess={() => {
                      setShowEntryForm(false);
                      setSelectedEntry(null);
                      setFormPreset({});
                      refreshEntries();
                    }}
                  />
                </div>
              )}

              {viewMode === 'list' ? (
                <CostGuideEntryList
                  entries={entries}
                  onEdit={(entry) => {
                    if (hasCostGuidePermission) {
                      setSelectedEntry(entry);
                      setFormPreset({});
                      setShowEntryForm(true);
                    }
                  }}
                  onDelete={hasCostGuidePermission ? refreshEntries : () => {}}
                  onDuplicate={hasCostGuidePermission ? refreshEntries : () => {}}
                  onAddWithPreset={hasCostGuidePermission ? handleAddWithPreset : () => {}}
                  readOnly={!hasCostGuidePermission}
                />
              ) : (
                <CostGuideEntryTable
                  guideId={selectedGuide.id}
                  entries={entries}
                  onEntriesUpdated={refreshEntries}
                  readOnly={!hasCostGuidePermission}
                />
              )}

              {entries.length === 0 && !showEntryForm && (
                <div className="text-center py-8 bg-white rounded-lg shadow">
                  <p className="text-gray-500">
                    {t('costGuidePage.noEntriesInGuide')} 
                    {hasCostGuidePermission ? t('costGuidePage.addFirstEntry') : ""}
                  </p>
                </div>
              )}
              
              {!hasCostGuidePermission && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md mt-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        {t('costGuidePage.readOnlyMessage')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {isCreateModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{t('costGuidePage.newCostGuideModal.title')}</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="guideName"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('costGuidePage.newCostGuideModal.guideNameLabel')} *
                </label>
                <input
                  type="text"
                  id="guideName"
                  value={newGuideName}
                  onChange={(e) => setNewGuideName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('costGuidePage.newCostGuideModal.guideNamePlaceholder')}
                />
              </div>
              <div>
                <label
                  htmlFor="guideDescription"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('costGuidePage.newCostGuideModal.descriptionLabel')}
                </label>
                <textarea
                  id="guideDescription"
                  value={newGuideDescription}
                  onChange={(e) => setNewGuideDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('costGuidePage.newCostGuideModal.descriptionPlaceholder')}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewGuideName('');
                  setNewGuideDescription('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('costGuidePage.newCostGuideModal.cancelButton')}
              </button>
              <button
                type="button"
                onClick={handleCreateGuide}
                disabled={!newGuideName.trim()}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  newGuideName.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-indigo-400 cursor-not-allowed'
                }`}
              >
                {t('costGuidePage.newCostGuideModal.createButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}