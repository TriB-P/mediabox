/**
 * Ce composant est responsable de l'affichage et de la gestion des frais associés à un client sélectionné.
 * Il permet aux utilisateurs disposant des permissions adéquates d'ajouter, de modifier, de supprimer et de réorganiser les frais
 * ainsi que leurs options spécifiques. Il récupère les données depuis Firebase et gère l'interface utilisateur pour
 * l'administration des frais, y compris les formulaires et les modaux.
 */
'use client';

import React, { useState, useEffect } from 'react';
import {
  getClientFees,
  getFeeOptions,
  addFee,
  updateFee,
  deleteFee,
  addFeeOption,
  updateFeeOption,
  deleteFeeOption,
  moveFeeUp,
  moveFeeDown
} from '../../lib/feeService';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Fee, FeeOption, FeeFormData, FeeOptionFormData } from '../../types/fee';
import FeeForm from './FeeForm';
import FeeOptionForm from './FeeOptionForm';
import {
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  TrashIcon,
  PencilIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

/**
 * Composant principal pour gérer les frais d'un client. Il gère l'état,
 * les interactions utilisateur et la communication avec les services Firebase
 * pour toutes les opérations liées aux frais.
 * @returns {React.JSX.Element} Le JSX du composant de gestion des frais.
 */
export default function ClientFees() {
  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [fees, setFees] = useState<Fee[]>([]);
  const [feeOptions, setFeeOptions] = useState<{ [feeId: string]: FeeOption[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const hasFeesPermission = canPerformAction('Fees');
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [currentFee, setCurrentFee] = useState<Fee | null>(null);
  const [showOptionForm, setShowOptionForm] = useState(false);
  const [currentOption, setCurrentOption] = useState<{ feeId: string, option: FeeOption | null }>({ feeId: '', option: null });
  const [expandedFees, setExpandedFees] = useState<{ [feeId: string]: boolean }>({});

  useEffect(() => {
    if (selectedClient) {
      loadFees();
    }
  }, [selectedClient]);

  /**
   * Charge les frais et leurs options depuis Firebase pour le client actuellement sélectionné.
   * Met à jour les états `fees`, `feeOptions`, `loading` et `error`.
   * @returns {Promise<void>} Une promesse qui se résout une fois les données chargées.
   */
  const loadFees = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`FIREBASE: LECTURE - Fichier: ClientFees.tsx - Fonction: loadFees - Path: clients/${selectedClient.clientId}/fees`);
      const fetchedFees = await getClientFees(selectedClient.clientId);
      setFees(fetchedFees);

      const expanded: { [feeId: string]: boolean } = {};
      fetchedFees.forEach(fee => {
        expanded[fee.id] = false;
      });
      setExpandedFees(expanded);

      const options: { [feeId: string]: FeeOption[] } = {};
      for (const fee of fetchedFees) {
        console.log(`FIREBASE: LECTURE - Fichier: ClientFees.tsx - Fonction: loadFees - Path: clients/${selectedClient.clientId}/fees/${fee.id}/options`);
        options[fee.id] = await getFeeOptions(selectedClient.clientId, fee.id);
      }
      setFeeOptions(options);

    } catch (err) {
      console.error('Erreur lors du chargement des frais:', err);
      setError('Impossible de charger les frais du client.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Bascule l'affichage (développé/réduit) des options pour un frais donné dans l'interface.
   * @param {string} feeId - L'ID du frais à basculer.
   * @returns {void}
   */
  const toggleFeeExpand = (feeId: string) => {
    setExpandedFees(prev => ({
      ...prev,
      [feeId]: !prev[feeId]
    }));
  };

  /**
   * Gère la demande de déplacement d'un frais vers le haut dans la liste.
   * @param {string} feeId - L'ID du frais à déplacer.
   * @returns {Promise<void>} Une promesse qui se résout après la tentative de déplacement.
   */
  const handleMoveFeeUp = async (feeId: string) => {
    if (!selectedClient || !hasFeesPermission) return;

    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: ClientFees.tsx - Fonction: handleMoveFeeUp - Path: clients/${selectedClient.clientId}/fees/${feeId}`);
      await moveFeeUp(selectedClient.clientId, feeId);
      setSuccess('Frais déplacé vers le haut.');
      setTimeout(() => setSuccess(null), 2000);
      loadFees();
    } catch (err) {
      console.error('Erreur lors du déplacement du frais:', err);
      setError('Impossible de déplacer le frais.');
    }
  };

  /**
   * Gère la demande de déplacement d'un frais vers le bas dans la liste.
   * @param {string} feeId - L'ID du frais à déplacer.
   * @returns {Promise<void>} Une promesse qui se résout après la tentative de déplacement.
   */
  const handleMoveFeeDown = async (feeId: string) => {
    if (!selectedClient || !hasFeesPermission) return;

    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: ClientFees.tsx - Fonction: handleMoveFeeDown - Path: clients/${selectedClient.clientId}/fees/${feeId}`);
      await moveFeeDown(selectedClient.clientId, feeId);
      setSuccess('Frais déplacé vers le bas.');
      setTimeout(() => setSuccess(null), 2000);
      loadFees();
    } catch (err) {
      console.error('Erreur lors du déplacement du frais:', err);
      setError('Impossible de déplacer le frais.');
    }
  };

  /**
   * Gère la soumission du formulaire pour ajouter un nouveau frais.
   * @param {FeeFormData} formData - Les données du nouveau frais à ajouter.
   * @returns {Promise<void>} Une promesse qui se résout après la tentative d'ajout.
   */
  const handleAddFee = async (formData: FeeFormData) => {
    if (!selectedClient || !hasFeesPermission) return;

    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: ClientFees.tsx - Fonction: handleAddFee - Path: clients/${selectedClient.clientId}/fees`);
      await addFee(selectedClient.clientId, formData);
      setShowFeeForm(false);
      loadFees();
      setSuccess('Frais ajouté avec succès.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de l\'ajout du frais:', err);
      setError('Impossible d\'ajouter le frais.');
    }
  };

  /**
   * Gère la soumission du formulaire pour mettre à jour un frais existant.
   * @param {FeeFormData} formData - Les nouvelles données du frais.
   * @returns {Promise<void>} Une promesse qui se résout après la tentative de mise à jour.
   */
  const handleUpdateFee = async (formData: FeeFormData) => {
    if (!selectedClient || !currentFee || !hasFeesPermission) return;

    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: ClientFees.tsx - Fonction: handleUpdateFee - Path: clients/${selectedClient.clientId}/fees/${currentFee.id}`);
      await updateFee(selectedClient.clientId, currentFee.id, formData);
      setShowFeeForm(false);
      setCurrentFee(null);
      loadFees();
      setSuccess('Frais mis à jour avec succès.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du frais:', err);
      setError('Impossible de mettre à jour le frais.');
    }
  };

  /**
   * Gère la demande de suppression d'un frais après confirmation de l'utilisateur.
   * @param {string} feeId - L'ID du frais à supprimer.
   * @returns {Promise<void>} Une promesse qui se résout après la tentative de suppression.
   */
  const handleDeleteFee = async (feeId: string) => {
    if (!selectedClient || !hasFeesPermission) return;

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce frais et toutes ses options ?')) {
      try {
        console.log(`FIREBASE: ÉCRITURE - Fichier: ClientFees.tsx - Fonction: handleDeleteFee - Path: clients/${selectedClient.clientId}/fees/${feeId}`);
        await deleteFee(selectedClient.clientId, feeId);
        loadFees();
        setSuccess('Frais supprimé avec succès.');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Erreur lors de la suppression du frais:', err);
        setError('Impossible de supprimer le frais.');
      }
    }
  };

  /**
   * Gère la soumission du formulaire pour ajouter une nouvelle option à un frais.
   * @param {FeeOptionFormData} formData - Les données de la nouvelle option.
   * @returns {Promise<void>} Une promesse qui se résout après la tentative d'ajout.
   */
  const handleAddOption = async (formData: FeeOptionFormData) => {
    if (!selectedClient || !currentOption.feeId || !hasFeesPermission) return;

    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: ClientFees.tsx - Fonction: handleAddOption - Path: clients/${selectedClient.clientId}/fees/${currentOption.feeId}/options`);
      await addFeeOption(selectedClient.clientId, currentOption.feeId, formData);
      setShowOptionForm(false);
      setCurrentOption({ feeId: '', option: null });

      console.log(`FIREBASE: LECTURE - Fichier: ClientFees.tsx - Fonction: handleAddOption - Path: clients/${selectedClient.clientId}/fees/${currentOption.feeId}/options`);
      const updatedOptions = await getFeeOptions(selectedClient.clientId, currentOption.feeId);
      setFeeOptions(prev => ({
        ...prev,
        [currentOption.feeId]: updatedOptions
      }));
      setSuccess('Option ajoutée avec succès.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'option:', err);
      setError('Impossible d\'ajouter l\'option.');
    }
  };

  /**
   * Gère la soumission du formulaire pour mettre à jour une option de frais existante.
   * @param {FeeOptionFormData} formData - Les nouvelles données de l'option.
   * @returns {Promise<void>} Une promesse qui se résout après la tentative de mise à jour.
   */
  const handleUpdateOption = async (formData: FeeOptionFormData) => {
    if (!selectedClient || !currentOption.feeId || !currentOption.option || !hasFeesPermission) return;

    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: ClientFees.tsx - Fonction: handleUpdateOption - Path: clients/${selectedClient.clientId}/fees/${currentOption.feeId}/options/${currentOption.option.id}`);
      await updateFeeOption(
        selectedClient.clientId,
        currentOption.feeId,
        currentOption.option.id,
        formData
      );
      setShowOptionForm(false);
      setCurrentOption({ feeId: '', option: null });

      console.log(`FIREBASE: LECTURE - Fichier: ClientFees.tsx - Fonction: handleUpdateOption - Path: clients/${selectedClient.clientId}/fees/${currentOption.feeId}/options`);
      const updatedOptions = await getFeeOptions(selectedClient.clientId, currentOption.feeId);
      setFeeOptions(prev => ({
        ...prev,
        [currentOption.feeId]: updatedOptions
      }));
      setSuccess('Option mise à jour avec succès.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'option:', err);
      setError('Impossible de mettre à jour l\'option.');
    }
  };

  /**
   * Gère la demande de suppression d'une option de frais après confirmation de l'utilisateur.
   * @param {string} feeId - L'ID du frais parent de l'option.
   * @param {string} optionId - L'ID de l'option à supprimer.
   * @returns {Promise<void>} Une promesse qui se résout après la tentative de suppression.
   */
  const handleDeleteOption = async (feeId: string, optionId: string) => {
    if (!selectedClient || !hasFeesPermission) return;

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette option ?')) {
      try {
        console.log(`FIREBASE: ÉCRITURE - Fichier: ClientFees.tsx - Fonction: handleDeleteOption - Path: clients/${selectedClient.clientId}/fees/${feeId}/options/${optionId}`);
        await deleteFeeOption(selectedClient.clientId, feeId, optionId);

        console.log(`FIREBASE: LECTURE - Fichier: ClientFees.tsx - Fonction: handleDeleteOption - Path: clients/${selectedClient.clientId}/fees/${feeId}/options`);
        const updatedOptions = await getFeeOptions(selectedClient.clientId, feeId);
        setFeeOptions(prev => ({
          ...prev,
          [feeId]: updatedOptions
        }));
        setSuccess('Option supprimée avec succès.');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'option:', err);
        setError('Impossible de supprimer l\'option.');
      }
    }
  };

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Veuillez sélectionner un client pour voir ses frais.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Frais du client</h2>
          <button
            onClick={() => {
              if (hasFeesPermission) {
                setCurrentFee(null);
                setShowFeeForm(true);
              }
            }}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm ${hasFeesPermission
                ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                : 'text-gray-500 bg-gray-300 cursor-not-allowed'
              }`}
            disabled={!hasFeesPermission}
            title={!hasFeesPermission ? "Vous n'avez pas la permission d'ajouter des frais" : ""}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Ajouter un frais
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

        {!hasFeesPermission && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700">
            Vous êtes en mode lecture seule. Vous n'avez pas les permissions nécessaires pour modifier les frais.
          </div>
        )}

        {loading ? (
          <div className="py-4 text-center text-gray-500">Chargement des frais...</div>
        ) : fees.length === 0 ? (
          <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            <p>Aucun frais configuré pour ce client.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fees.map((fee, index) => (
              <div key={fee.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                  className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleFeeExpand(fee.id)}
                >
                  <div className="flex items-center flex-1">
                    {expandedFees[fee.id] ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{fee.FE_Name}</h3>
                      <div className="flex space-x-4 text-sm text-gray-500">
                        <span>{fee.FE_Calculation_Type}</span>
                        <span>•</span>
                        <span>{fee.FE_Calculation_Mode}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasFeesPermission && index > 0) {
                            handleMoveFeeUp(fee.id);
                          }
                        }}
                        className={`p-1 ${hasFeesPermission && index > 0
                            ? 'text-gray-500 hover:text-indigo-600'
                            : 'text-gray-300 cursor-not-allowed'
                          }`}
                        disabled={!hasFeesPermission || index === 0}
                        title="Déplacer vers le haut"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasFeesPermission && index < fees.length - 1) {
                            handleMoveFeeDown(fee.id);
                          }
                        }}
                        className={`p-1 ${hasFeesPermission && index < fees.length - 1
                            ? 'text-gray-500 hover:text-indigo-600'
                            : 'text-gray-300 cursor-not-allowed'
                          }`}
                        disabled={!hasFeesPermission || index === fees.length - 1}
                        title="Déplacer vers le bas"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasFeesPermission) {
                          setCurrentFee(fee);
                          setShowFeeForm(true);
                        }
                      }}
                      className={`${hasFeesPermission
                          ? 'text-gray-500 hover:text-indigo-600'
                          : 'text-gray-300 cursor-not-allowed'
                        }`}
                      disabled={!hasFeesPermission}
                      title={!hasFeesPermission ? "Vous n'avez pas la permission de modifier les frais" : ""}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasFeesPermission) {
                          handleDeleteFee(fee.id);
                        }
                      }}
                      className={`${hasFeesPermission
                          ? 'text-gray-500 hover:text-red-600'
                          : 'text-gray-300 cursor-not-allowed'
                        }`}
                      disabled={!hasFeesPermission}
                      title={!hasFeesPermission ? "Vous n'avez pas la permission de supprimer les frais" : ""}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {expandedFees[fee.id] && (
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-700">Options du frais</h4>
                      <button
                        onClick={() => {
                          if (hasFeesPermission) {
                            setCurrentOption({ feeId: fee.id, option: null });
                            setShowOptionForm(true);
                          }
                        }}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md ${hasFeesPermission
                            ? 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            : 'text-gray-500 bg-gray-200 cursor-not-allowed'
                          }`}
                        disabled={!hasFeesPermission}
                        title={!hasFeesPermission ? "Vous n'avez pas la permission d'ajouter des options" : ""}
                      >
                        <PlusIcon className="h-3 w-3 mr-1" />
                        Ajouter une option
                      </button>
                    </div>

                    {feeOptions[fee.id] && feeOptions[fee.id].length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Option
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Valeur
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Buffer
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Éditable
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {feeOptions[fee.id].map((option) => (
                              <tr key={option.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {option.FO_Option}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {option.FO_Value}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {option.FO_Buffer}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {option.FO_Editable ? 'Oui' : 'Non'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => {
                                        if (hasFeesPermission) {
                                          setCurrentOption({ feeId: fee.id, option });
                                          setShowOptionForm(true);
                                        }
                                      }}
                                      className={`${hasFeesPermission
                                          ? 'text-indigo-600 hover:text-indigo-900'
                                          : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                      disabled={!hasFeesPermission}
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (hasFeesPermission) {
                                          handleDeleteOption(fee.id, option.id);
                                        }
                                      }}
                                      className={`${hasFeesPermission
                                          ? 'text-red-600 hover:text-red-900'
                                          : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                      disabled={!hasFeesPermission}
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Aucune option configurée pour ce frais.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showFeeForm && hasFeesPermission && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {currentFee ? 'Modifier le frais' : 'Ajouter un frais'}
            </h3>
            <FeeForm
              fee={currentFee || undefined}
              onSubmit={currentFee ? handleUpdateFee : handleAddFee}
              onCancel={() => {
                setShowFeeForm(false);
                setCurrentFee(null);
              }}
            />
          </div>
        </div>
      )}

      {showOptionForm && hasFeesPermission && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {currentOption.option ? 'Modifier l\'option' : 'Ajouter une option'}
            </h3>
            <FeeOptionForm
              option={currentOption.option || undefined}
              onSubmit={currentOption.option ? handleUpdateOption : handleAddOption}
              onCancel={() => {
                setShowOptionForm(false);
                setCurrentOption({ feeId: '', option: null });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}