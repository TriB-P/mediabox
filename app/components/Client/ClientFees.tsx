// app/components/Client/ClientFees.tsx

'use client';

import React, { useState, useEffect } from 'react';
// Importons correctement les icônes
import { 
  getClientFees, 
  getFeeOptions, 
  addFee, 
  updateFee, 
  deleteFee,
  addFeeOption,
  updateFeeOption,
  deleteFeeOption
} from '../../lib/feeService';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Fee, FeeOption, FeeFormData, FeeOptionFormData } from '../../types/fee';
import FeeForm from './FeeForm';
import FeeOptionForm from './FeeOptionForm';
import { PlusIcon, ChevronDownIcon, ChevronRightIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';


export default function ClientFees() {
  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [fees, setFees] = useState<Fee[]>([]);
  const [feeOptions, setFeeOptions] = useState<{[feeId: string]: FeeOption[]}>({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Vérifier si l'utilisateur a la permission de gérer les frais
  const hasFeesPermission = canPerformAction('Fees');
  
  // États pour les formulaires
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [currentFee, setCurrentFee] = useState<Fee | null>(null);
  const [showOptionForm, setShowOptionForm] = useState(false);
  const [currentOption, setCurrentOption] = useState<{feeId: string, option: FeeOption | null}>({feeId: '', option: null});
  
  // État pour les accordions
  const [expandedFees, setExpandedFees] = useState<{[feeId: string]: boolean}>({});

  // Charger les frais quand le client change
  useEffect(() => {
    if (selectedClient) {
      loadFees();
    }
  }, [selectedClient]);

  const loadFees = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const fetchedFees = await getClientFees(selectedClient.clientId);
      setFees(fetchedFees);
      
      // Initialiser l'état des accordions
      const expanded: {[feeId: string]: boolean} = {};
      fetchedFees.forEach(fee => {
        expanded[fee.id] = false;
      });
      setExpandedFees(expanded);
      
      // Charger les options pour chaque frais
      const options: {[feeId: string]: FeeOption[]} = {};
      for (const fee of fetchedFees) {
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

  const toggleFeeExpand = (feeId: string) => {
    setExpandedFees(prev => ({
      ...prev,
      [feeId]: !prev[feeId]
    }));
  };

  // Gestion des frais
  const handleAddFee = async (formData: FeeFormData) => {
    if (!selectedClient || !hasFeesPermission) return;
    
    try {
      await addFee(selectedClient.clientId, formData);
      setShowFeeForm(false);
      loadFees();
    } catch (err) {
      console.error('Erreur lors de l\'ajout du frais:', err);
      setError('Impossible d\'ajouter le frais.');
    }
  };

  const handleUpdateFee = async (formData: FeeFormData) => {
    if (!selectedClient || !currentFee || !hasFeesPermission) return;
    
    try {
      await updateFee(selectedClient.clientId, currentFee.id, formData);
      setShowFeeForm(false);
      setCurrentFee(null);
      loadFees();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du frais:', err);
      setError('Impossible de mettre à jour le frais.');
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    if (!selectedClient || !hasFeesPermission) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce frais et toutes ses options ?')) {
      try {
        await deleteFee(selectedClient.clientId, feeId);
        loadFees();
      } catch (err) {
        console.error('Erreur lors de la suppression du frais:', err);
        setError('Impossible de supprimer le frais.');
      }
    }
  };

  // Gestion des options
  const handleAddOption = async (formData: FeeOptionFormData) => {
    if (!selectedClient || !currentOption.feeId || !hasFeesPermission) return;
    
    try {
      await addFeeOption(selectedClient.clientId, currentOption.feeId, formData);
      setShowOptionForm(false);
      setCurrentOption({feeId: '', option: null});
      
      // Recharger uniquement les options du frais concerné
      const updatedOptions = await getFeeOptions(selectedClient.clientId, currentOption.feeId);
      setFeeOptions(prev => ({
        ...prev,
        [currentOption.feeId]: updatedOptions
      }));
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'option:', err);
      setError('Impossible d\'ajouter l\'option.');
    }
  };

  const handleUpdateOption = async (formData: FeeOptionFormData) => {
    if (!selectedClient || !currentOption.feeId || !currentOption.option || !hasFeesPermission) return;
    
    try {
      await updateFeeOption(
        selectedClient.clientId, 
        currentOption.feeId, 
        currentOption.option.id, 
        formData
      );
      setShowOptionForm(false);
      setCurrentOption({feeId: '', option: null});
      
      // Recharger uniquement les options du frais concerné
      const updatedOptions = await getFeeOptions(selectedClient.clientId, currentOption.feeId);
      setFeeOptions(prev => ({
        ...prev,
        [currentOption.feeId]: updatedOptions
      }));
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'option:', err);
      setError('Impossible de mettre à jour l\'option.');
    }
  };

  const handleDeleteOption = async (feeId: string, optionId: string) => {
    if (!selectedClient || !hasFeesPermission) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette option ?')) {
      try {
        await deleteFeeOption(selectedClient.clientId, feeId, optionId);
        
        // Recharger uniquement les options du frais concerné
        const updatedOptions = await getFeeOptions(selectedClient.clientId, feeId);
        setFeeOptions(prev => ({
          ...prev,
          [feeId]: updatedOptions
        }));
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
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm ${
              hasFeesPermission 
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
            {fees.map((fee) => (
              <div key={fee.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* En-tête du frais */}
                <div 
                  className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleFeeExpand(fee.id)}
                >
                  <div className="flex items-center">
                    {expandedFees[fee.id] ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{fee.FE_Name}</h3>
                      <p className="text-sm text-gray-500">{fee.FE_Calculation_Type}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasFeesPermission) {
                          setCurrentFee(fee);
                          setShowFeeForm(true);
                        }
                      }}
                      className={`${
                        hasFeesPermission 
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
                      className={`${
                        hasFeesPermission 
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

                {/* Options du frais (visible si expanded) */}
                {expandedFees[fee.id] && (
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-700">Options du frais</h4>
                      <button
                        onClick={() => {
                          if (hasFeesPermission) {
                            setCurrentOption({feeId: fee.id, option: null});
                            setShowOptionForm(true);
                          }
                        }}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md ${
                          hasFeesPermission 
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
                                          setCurrentOption({feeId: fee.id, option});
                                          setShowOptionForm(true);
                                        }
                                      }}
                                      className={`${
                                        hasFeesPermission 
                                          ? 'text-indigo-600 hover:text-indigo-900' 
                                          : 'text-gray-300 cursor-not-allowed'
                                      }`}
                                      disabled={!hasFeesPermission}
                                      title={!hasFeesPermission ? "Vous n'avez pas la permission de modifier les options" : ""}
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (hasFeesPermission) {
                                          handleDeleteOption(fee.id, option.id);
                                        }
                                      }}
                                      className={`${
                                        hasFeesPermission 
                                          ? 'text-red-600 hover:text-red-900' 
                                          : 'text-gray-300 cursor-not-allowed'
                                      }`}
                                      disabled={!hasFeesPermission}
                                      title={!hasFeesPermission ? "Vous n'avez pas la permission de supprimer les options" : ""}
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

      {/* Modal pour le formulaire de frais */}
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

      {/* Modal pour le formulaire d'option */}
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
                setCurrentOption({feeId: '', option: null});
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}