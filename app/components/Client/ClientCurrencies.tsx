// app/components/Client/ClientCurrencies.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { Currency, CurrencyFormData } from '../../types/currency';
import { 
  getClientCurrencies, 
  addCurrency, 
  updateCurrency, 
  deleteCurrency 
} from '../../lib/currencyService';
import CurrencyForm from './CurrencyForm';

const ClientCurrencies: React.FC = () => {
  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Vérifier si l'utilisateur a la permission de gérer les devises
  const hasCurrencyPermission = canPerformAction('Currency');
  
  // États pour le formulaire
  const [showForm, setShowForm] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState<Currency | null>(null);
  
  // Filtrage et tri
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Charger les devises quand le client change
  useEffect(() => {
    if (selectedClient) {
      loadCurrencies();
    }
  }, [selectedClient]);

  const loadCurrencies = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const fetchedCurrencies = await getClientCurrencies(selectedClient.clientId);
      setCurrencies(fetchedCurrencies);
      
    } catch (err) {
      console.error('Erreur lors du chargement des devises:', err);
      setError('Impossible de charger les devises du client.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer et trier les devises
  const filteredCurrencies = currencies.filter(currency => {
    const searchMatch = 
      currency.CU_From.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.CU_To.toLowerCase().includes(searchTerm.toLowerCase());
    
    const yearMatch = selectedYear === 'all' || currency.CU_Year === selectedYear;
    
    return searchMatch && yearMatch;
  });

  // Liste des années uniques pour le filtre
  const uniqueYears = Array.from(new Set(currencies.map(c => c.CU_Year))).sort().reverse();

  // Gestion des devises
  const handleAddCurrency = async (formData: CurrencyFormData) => {
    if (!selectedClient || !hasCurrencyPermission) return;
    
    try {
      await addCurrency(selectedClient.clientId, formData);
      setShowForm(false);
      loadCurrencies();
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout de la devise:', err);
      setError(err.message || 'Impossible d\'ajouter la devise.');
    }
  };

  const handleUpdateCurrency = async (formData: CurrencyFormData) => {
    if (!selectedClient || !currentCurrency || !hasCurrencyPermission) return;
    
    try {
      await updateCurrency(selectedClient.clientId, currentCurrency.id, formData);
      setShowForm(false);
      setCurrentCurrency(null);
      loadCurrencies();
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de la devise:', err);
      setError(err.message || 'Impossible de mettre à jour la devise.');
    }
  };

  const handleDeleteCurrency = async (currencyId: string) => {
    if (!selectedClient || !hasCurrencyPermission) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce taux de conversion ?')) {
      try {
        await deleteCurrency(selectedClient.clientId, currencyId);
        loadCurrencies();
      } catch (err) {
        console.error('Erreur lors de la suppression de la devise:', err);
        setError('Impossible de supprimer la devise.');
      }
    }
  };

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Veuillez sélectionner un client pour voir ses taux de conversion.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-800">Taux de conversion</h2>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="all">Toutes les années</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            <button
              onClick={() => {
                setCurrentCurrency(null);
                setShowForm(true);
              }}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm ${
                hasCurrencyPermission 
                  ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                  : 'text-gray-500 bg-gray-300 cursor-not-allowed'
              }`}
              disabled={!hasCurrencyPermission}
              title={!hasCurrencyPermission ? "Vous n'avez pas la permission d'ajouter des taux de conversion" : ""}
            >
              + Ajouter
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-4 text-center text-gray-500">Chargement des taux de conversion...</div>
        ) : filteredCurrencies.length === 0 ? (
          <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            {currencies.length === 0 ? (
              <p>Aucun taux de conversion configuré pour ce client.</p>
            ) : (
              <p>Aucun résultat pour votre recherche.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Année
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    De
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vers
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taux
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCurrencies.map((currency) => (
                  <tr key={currency.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {currency.CU_Year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {currency.CU_From}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {currency.CU_To}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {currency.CU_Rate.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            if (hasCurrencyPermission) {
                              setCurrentCurrency(currency);
                              setShowForm(true);
                            }
                          }}
                          className={`${
                            hasCurrencyPermission 
                              ? 'text-indigo-600 hover:text-indigo-900' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!hasCurrencyPermission}
                          title={!hasCurrencyPermission ? "Vous n'avez pas la permission de modifier les taux" : ""}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            if (hasCurrencyPermission) {
                              handleDeleteCurrency(currency.id);
                            }
                          }}
                          className={`${
                            hasCurrencyPermission 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!hasCurrencyPermission}
                          title={!hasCurrencyPermission ? "Vous n'avez pas la permission de supprimer les taux" : ""}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal pour le formulaire */}
      {showForm && hasCurrencyPermission && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {currentCurrency ? 'Modifier le taux' : 'Ajouter un taux'}
            </h3>
            <CurrencyForm
              currency={currentCurrency || undefined}
              onSubmit={currentCurrency ? handleUpdateCurrency : handleAddCurrency}
              onCancel={() => {
                setShowForm(false);
                setCurrentCurrency(null);
                setError(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientCurrencies;