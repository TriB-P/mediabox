'use client';

import React, { useState, useEffect } from 'react';
import { useClient } from '../../contexts/ClientContext';
import { getClientInfo, updateClientInfo } from '../../lib/clientService';

interface DimensionsData {
  Custom_Dim_CA_1: string;
  Custom_Dim_CA_2: string;
  Custom_Dim_CA_3: string;
  Custom_Dim_TC_1: string;
  Custom_Dim_TC_2: string;
  Custom_Dim_TC_3: string;
  Custom_Dim_SPL_1: string;
  Custom_Dim_SPL_2: string;
  Custom_Dim_SPL_3: string;
  Custom_Dim_CR_1: string;
  Custom_Dim_CR_2: string;
  Custom_Dim_CR_3: string;
}

const ClientDimensions: React.FC = () => {
  const { selectedClient } = useClient();
  const [dimensions, setDimensions] = useState<DimensionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger les données du client quand le client sélectionné change
  useEffect(() => {
    if (selectedClient) {
      loadClientDimensions();
    }
  }, [selectedClient]);

  const loadClientDimensions = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const clientInfo = await getClientInfo(selectedClient.clientId);
      
      setDimensions({
        Custom_Dim_CA_1: clientInfo.Custom_Dim_CA_1 || '',
        Custom_Dim_CA_2: clientInfo.Custom_Dim_CA_2 || '',
        Custom_Dim_CA_3: clientInfo.Custom_Dim_CA_3 || '',
        Custom_Dim_TC_1: clientInfo.Custom_Dim_TC_1 || '',
        Custom_Dim_TC_2: clientInfo.Custom_Dim_TC_2 || '',
        Custom_Dim_TC_3: clientInfo.Custom_Dim_TC_3 || '',
        Custom_Dim_SPL_1: clientInfo.Custom_Dim_SPL_1 || '',
        Custom_Dim_SPL_2: clientInfo.Custom_Dim_SPL_2 || '',
        Custom_Dim_SPL_3: clientInfo.Custom_Dim_SPL_3 || '',
        Custom_Dim_CR_1: clientInfo.Custom_Dim_CR_1 || '',
        Custom_Dim_CR_2: clientInfo.Custom_Dim_CR_2 || '',
        Custom_Dim_CR_3: clientInfo.Custom_Dim_CR_3 || '',
      });
    } catch (err) {
      console.error('Erreur lors du chargement des dimensions du client:', err);
      setError('Impossible de charger les dimensions du client.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !dimensions) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await updateClientInfo(selectedClient.clientId, dimensions);
      
      setSuccess('Les dimensions du client ont été mises à jour avec succès.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour des dimensions:', err);
      setError('Impossible de mettre à jour les dimensions du client.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!dimensions) return;
    
    const { name, value } = e.target;
    setDimensions({
      ...dimensions,
      [name]: value,
    });
  };

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Veuillez sélectionner un client pour configurer ses dimensions.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Chargement des dimensions du client...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Dimensions personnalisées</h2>
        
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
        
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
          {/* Section Campagne */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Campagne
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <input
                  type="text"
                  id="Custom_Dim_CA_1"
                  name="Custom_Dim_CA_1"
                  value={dimensions?.Custom_Dim_CA_1 || ''}
                  onChange={handleChange}
                  placeholder="Dimension 1"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  id="Custom_Dim_CA_2"
                  name="Custom_Dim_CA_2"
                  value={dimensions?.Custom_Dim_CA_2 || ''}
                  onChange={handleChange}
                  placeholder="Dimension 2"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  id="Custom_Dim_CA_3"
                  name="Custom_Dim_CA_3"
                  value={dimensions?.Custom_Dim_CA_3 || ''}
                  onChange={handleChange}
                  placeholder="Dimension 3"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Section Tactique */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Tactique
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <input
                  type="text"
                  id="Custom_Dim_TC_1"
                  name="Custom_Dim_TC_1"
                  value={dimensions?.Custom_Dim_TC_1 || ''}
                  onChange={handleChange}
                  placeholder="Dimension 1"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  id="Custom_Dim_TC_2"
                  name="Custom_Dim_TC_2"
                  value={dimensions?.Custom_Dim_TC_2 || ''}
                  onChange={handleChange}
                  placeholder="Dimension 2"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  id="Custom_Dim_TC_3"
                  name="Custom_Dim_TC_3"
                  value={dimensions?.Custom_Dim_TC_3 || ''}
                  onChange={handleChange}
                  placeholder="Dimension 3"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Section Placement */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Placement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <input
                  type="text"
                  id="Custom_Dim_SPL_1"
                  name="Custom_Dim_SPL_1"
                  value={dimensions?.Custom_Dim_SPL_1 || ''}
                  onChange={handleChange}
                  placeholder="Dimension 1"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  id="Custom_Dim_SPL_2"
                  name="Custom_Dim_SPL_2"
                  value={dimensions?.Custom_Dim_SPL_2 || ''}
                  onChange={handleChange}
                  placeholder="Dimension 2"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  id="Custom_Dim_SPL_3"
                  name="Custom_Dim_SPL_3"
                  value={dimensions?.Custom_Dim_SPL_3 || ''}
                  onChange={handleChange}
                  placeholder="Dimension 3"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Section Créatif */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Créatif
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <input
                  type="text"
                  id="Custom_Dim_CR_1"
                  name="Custom_Dim_CR_1"
                  value={dimensions?.Custom_Dim_CR_1 || ''}
                  onChange={handleChange}
                  placeholder="Dimension 1"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  id="Custom_Dim_CR_2"
                  name="Custom_Dim_CR_2"
                  value={dimensions?.Custom_Dim_CR_2 || ''}
                  onChange={handleChange}
                  placeholder="Dimension 2"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  id="Custom_Dim_CR_3"
                  name="Custom_Dim_CR_3"
                  value={dimensions?.Custom_Dim_CR_3 || ''}
                  onChange={handleChange}
                  placeholder="Dimension 3"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Boutons d'action */}
          <div className="pt-5 border-t border-gray-200 mt-8">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={loadClientDimensions}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientDimensions;