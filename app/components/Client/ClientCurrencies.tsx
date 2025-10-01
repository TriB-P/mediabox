// app/components/Client/ClientCurrencies.tsx

/**
 * Ce fichier définit le composant `ClientCurrencies`, qui est responsable de l'affichage et de la gestion
 * des taux de conversion de devises pour un client sélectionné. Il permet de visualiser, ajouter,
 * modifier et supprimer des taux, tout en gérant les permissions utilisateurs pour ces actions.
 * Le composant interagit avec les services Firebase pour la persistance des données.
 * MODIFIÉ : Support des versions personnalisées (ex: "2025 v1", "2025 v2") au lieu d'années strictes.
 */
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
import { useTranslation } from '../../contexts/LanguageContext';

/**
 * Gère l'affichage, la création, la modification et la suppression des taux de conversion pour le client actuellement sélectionné.
 * @returns {React.ReactElement} Le composant JSX pour gérer les devises du client.
 */
const ClientCurrencies: React.FC = () => {
  const { t } = useTranslation();
  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasCurrencyPermission = canPerformAction('Currency');

  const [showForm, setShowForm] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState<Currency | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string>('all'); // MODIFIÉ : selectedYear -> selectedVersion

  useEffect(() => {
    if (selectedClient) {
      loadCurrencies();
    }
  }, [selectedClient]);

  /**
   * Charge les taux de conversion depuis Firebase pour le client sélectionné.
   * Gère les états de chargement et d'erreur.
   * @returns {Promise<void>}
   */
  const loadCurrencies = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);
      setError(null);
      console.log(`FIREBASE: LECTURE - Fichier: ClientCurrencies.tsx - Fonction: loadCurrencies - Path: clients/${selectedClient.clientId}/currencies`);
      const fetchedCurrencies = await getClientCurrencies(selectedClient.clientId);
      setCurrencies(fetchedCurrencies);

    } catch (err) {
      console.error('Erreur lors du chargement des devises:', err);
      setError(t('clientCurrencies.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // MODIFIÉ : Logique de filtrage adaptée aux versions personnalisées
  const filteredCurrencies = currencies.filter(currency => {
    const searchMatch =
      currency.CU_From.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.CU_To.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.CU_Year.toLowerCase().includes(searchTerm.toLowerCase()); // NOUVEAU : recherche aussi dans les versions

    const versionMatch = selectedVersion === 'all' || currency.CU_Year === selectedVersion;

    return searchMatch && versionMatch;
  });

  // MODIFIÉ : Génération des versions uniques disponibles
  const uniqueVersions = Array.from(new Set(currencies.map(c => c.CU_Year)))
    .sort((a, b) => {
      // Tri intelligent : d'abord par année extraite, puis par version
      const extractYear = (version: string) => {
        const match = version.match(/(\d{4})/);
        return match ? parseInt(match[1]) : 0;
      };
      
      const yearA = extractYear(a);
      const yearB = extractYear(b);
      
      if (yearA !== yearB) {
        return yearB - yearA; // Années décroissantes
      }
      
      // Si même année, tri alphabétique inverse (v2 avant v1)
      return b.localeCompare(a);
    });

  /**
   * Gère l'ajout d'un nouveau taux de conversion dans Firebase.
   * @param {CurrencyFormData} formData - Les données du formulaire pour le nouveau taux.
   * @returns {Promise<void>}
   */
  const handleAddCurrency = async (formData: CurrencyFormData) => {
    if (!selectedClient || !hasCurrencyPermission) return;

    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: ClientCurrencies.tsx - Fonction: handleAddCurrency - Path: clients/${selectedClient.clientId}/currencies`);
      await addCurrency(selectedClient.clientId, formData);
      setShowForm(false);
      loadCurrencies();
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout de la devise:', err);
      setError(err.message || t('clientCurrencies.errors.addFailed'));
    }
  };

  /**
   * Gère la mise à jour d'un taux de conversion existant dans Firebase.
   * @param {CurrencyFormData} formData - Les nouvelles données du formulaire pour le taux à modifier.
   * @returns {Promise<void>}
   */
  const handleUpdateCurrency = async (formData: CurrencyFormData) => {
    if (!selectedClient || !currentCurrency || !hasCurrencyPermission) return;

    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: ClientCurrencies.tsx - Fonction: handleUpdateCurrency - Path: clients/${selectedClient.clientId}/currencies/${currentCurrency.id}`);
      await updateCurrency(selectedClient.clientId, currentCurrency.id, formData);
      setShowForm(false);
      setCurrentCurrency(null);
      loadCurrencies();
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de la devise:', err);
      setError(err.message || t('clientCurrencies.errors.updateFailed'));
    }
  };

  /**
   * Gère la suppression d'un taux de conversion dans Firebase.
   * @param {string} currencyId - L'ID du taux de conversion à supprimer.
   * @returns {Promise<void>}
   */
  const handleDeleteCurrency = async (currencyId: string) => {
    if (!selectedClient || !hasCurrencyPermission) return;

    if (window.confirm(t('clientCurrencies.confirmations.delete'))) {
      try {
        console.log(`FIREBASE: ÉCRITURE - Fichier: ClientCurrencies.tsx - Fonction: handleDeleteCurrency - Path: clients/${selectedClient.clientId}/currencies/${currencyId}`);
        await deleteCurrency(selectedClient.clientId, currencyId);
        loadCurrencies();
      } catch (err) {
        console.error('Erreur lors de la suppression de la devise:', err);
        setError(t('clientCurrencies.errors.deleteFailed'));
      }
    }
  };

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">{t('clientCurrencies.messages.selectClient')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-800">{t('clientCurrencies.header.title')}</h2>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder={t('clientCurrencies.search.placeholder')} // MODIFIÉ : placeholder plus inclusif
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
              value={selectedVersion} // MODIFIÉ : selectedYear -> selectedVersion
              onChange={(e) => setSelectedVersion(e.target.value)} // MODIFIÉ : setSelectedYear -> setSelectedVersion
              className="border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="all">{t('clientCurrencies.versionFilter.all')}</option> {/* MODIFIÉ : libellé */}
              {uniqueVersions.map(version => (
                <option key={version} value={version}>{version}</option> // MODIFIÉ : year -> version
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
              title={!hasCurrencyPermission ? t('clientCurrencies.permissions.noAddPermission') : ""}
            >
              + {t('clientCurrencies.actions.add')}
            </button>
          </div>
        </div>

        {!hasCurrencyPermission && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700">
            {t('clientCurrencies.permissions.readOnlyWarning')}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-4 text-center text-gray-500">{t('common.loading')}</div>
        ) : filteredCurrencies.length === 0 ? (
          <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            {currencies.length === 0 ? (
              <div>
                <p className="font-medium">{t('clientCurrencies.messages.noCurrenciesConfigured.title')}</p>
                <p className="text-sm mt-1">{t('clientCurrencies.messages.noCurrenciesConfigured.text')}</p>
              </div>
            ) : (
              <p>{t('clientCurrencies.messages.noFilterResults')}</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientCurrencies.table.version')} {/* MODIFIÉ : Année -> Version */}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientCurrencies.table.from')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientCurrencies.table.to')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientCurrencies.table.rate')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientCurrencies.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCurrencies.map((currency) => (
                  <tr key={currency.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {currency.CU_Year} {/* Affichage avec badge pour mettre en évidence les versions */}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-mono font-medium">{currency.CU_From}</span> {/* NOUVEAU : style monospace pour devises */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-mono font-medium">{currency.CU_To}</span> {/* NOUVEAU : style monospace pour devises */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-mono">{currency.CU_Rate.toFixed(4)}</span> {/* NOUVEAU : style monospace pour taux */}
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
                          title={!hasCurrencyPermission ? t('clientCurrencies.permissions.noEditPermission') : ""}
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
                          title={!hasCurrencyPermission ? t('clientCurrencies.permissions.noDeletePermission') : ""}
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

        {/* NOUVEAU : Affichage d'information sur les versions personnalisées */}
        {currencies.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-blue-500">💡</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>{t('clientCurrencies.info.customVersions.title')}</strong>
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {t('clientCurrencies.info.customVersions.text')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showForm && hasCurrencyPermission && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {currentCurrency ? t('clientCurrencies.form.editTitle') : t('clientCurrencies.form.addTitle')}
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