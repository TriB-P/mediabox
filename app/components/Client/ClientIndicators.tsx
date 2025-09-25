// Fichier: app/components/Client/ClientIndicators.tsx
// Chemin: app/components/Client/ClientIndicators.tsx

/**
 * Ce composant React, 'ClientIndicators', est une interface utilisateur sous forme de formulaire
 * qui permet de visualiser et de modifier les indicateurs de performance et leurs seuils
 * pour un client sélectionné. Il affiche 4 indicateurs : Média locaux, Numérique, Labs et Complexité.
 * Chaque indicateur a 2 seuils qui définissent les zones rouge/jaune/vert sur une barre visuelle.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { getClientIndicators, updateClientIndicators } from '../../lib/clientService';
import { useTranslation } from '../../contexts/LanguageContext';

interface IndicatorsData {
  Local_1: number | null;
  Local_2: number | null;
  Num_1: number | null;
  Num_2: number | null;
  Labs_1: number | null;
  Labs_2: number | null;
  Complex_1: number | null;
  Complex_2: number | null;
}

interface IndicatorRowProps {
  indicatorKey: string;
  label: string;
  description: string;
  threshold1: number | null;
  threshold2: number | null;
  hasPermission: boolean;
  onChange: (name: string, value: number | null) => void;
  validationErrors: Record<string, string>;
}

/**
 * Composant pour afficher une rangée d'indicateur avec layout intégré
 * [Zone rouge] - [Input seuil 1] - [Zone jaune] - [Input seuil 2] - [Zone verte]
 */
const IndicatorRow: React.FC<IndicatorRowProps> = ({ 
  indicatorKey, 
  label, 
  description,
  threshold1, 
  threshold2, 
  hasPermission, 
  onChange, 
  validationErrors 
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-800 pb-1">
          {label}
        </h3>
        <p className="text-sm text-gray-600 pb-3 border-b border-gray-200">
          {description}
        </p>
      </div>
      
      {/* Layout horizontal intégré */}
      <div className="flex items-center gap-3">
        {/* Zone rouge */}
        <div className="flex-1 min-w-0">
          <div className="h-8 bg-red-500 rounded-l-md flex items-center justify-center">
          </div>
        </div>
        
        {/* Input seuil 1 */}
        <div className="flex-shrink-0 w-20">
          <div className="relative">
            <input
              type="number"
              name={`${indicatorKey}_1`}
              min="0"
              max="100"
              step="5"
              value={threshold1 ?? ''}
              onChange={(e) => onChange(`${indicatorKey}_1`, e.target.value === '' ? null : parseFloat(e.target.value))}
              placeholder="%"
              className={`block w-full text-center rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                !hasPermission ? 'bg-gray-100 cursor-not-allowed' : ''
              } ${validationErrors[`${indicatorKey}_1`] ? 'border-red-500' : ''}`}
              disabled={!hasPermission}
            />
          </div>
        </div>
        
        {/* Zone jaune */}
        <div className="flex-1 min-w-0">
          <div className="h-8 bg-yellow-500 flex items-center justify-center">
          </div>
        </div>
        
        {/* Input seuil 2 */}
        <div className="flex-shrink-0 w-20">
          <div className="relative">
            <input
              type="number"
              name={`${indicatorKey}_2`}
              min="0"
              max="100"
              step="5"
              value={threshold2 ?? ''}
              onChange={(e) => onChange(`${indicatorKey}_2`, e.target.value === '' ? null : parseFloat(e.target.value))}
              placeholder="%"
              className={`block w-full text-center rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                !hasPermission ? 'bg-gray-100 cursor-not-allowed' : ''
              } ${validationErrors[`${indicatorKey}_2`] ? 'border-red-500' : ''}`}
              disabled={!hasPermission}
            />
          </div>
        </div>
        
        {/* Zone verte */}
        <div className="flex-1 min-w-0">
          <div className="h-8 bg-green-500 rounded-r-md flex items-center justify-center">
          </div>
        </div>
      </div>
      
      {/* Messages d'erreur de validation */}
      {validationErrors[`${indicatorKey}_1`] && (
        <p className="text-sm text-red-600">{validationErrors[`${indicatorKey}_1`]}</p>
      )}
      {validationErrors[`${indicatorKey}_2`] && (
        <p className="text-sm text-red-600">{validationErrors[`${indicatorKey}_2`]}</p>
      )}
      {validationErrors[`${indicatorKey}_order`] && (
        <p className="text-sm text-red-600">{validationErrors[`${indicatorKey}_order`]}</p>
      )}
      

    </div>
  );
};

/**
 * Composant principal pour afficher et gérer le formulaire des indicateurs du client.
 * Il gère son propre état pour les données du formulaire, le chargement, la sauvegarde et les erreurs.
 * @returns {React.ReactElement} Le JSX du composant de formulaire.
 */
const ClientIndicators: React.FC = () => {
  const { t } = useTranslation();
  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [indicators, setIndicators] = useState<IndicatorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const hasIndicatorsPermission = canPerformAction('Indicators');

  useEffect(() => {
    if (selectedClient) {
      loadClientIndicators();
    }
  }, [selectedClient]);

  /**
   * Charge les indicateurs pour le client actuellement sélectionné depuis Firebase.
   * La fonction met à jour l'état local du composant avec les données récupérées
   * et gère les états de chargement et d'erreur.
   * @returns {Promise<void>} Une promesse qui se résout une fois les données chargées.
   */
  const loadClientIndicators = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`FIREBASE: [LECTURE] - Fichier: ClientIndicators.tsx - Fonction: loadClientIndicators - Path: clients/${selectedClient.clientId}/indicators`);
      const indicatorsData = await getClientIndicators(selectedClient.clientId);
      
      setIndicators(indicatorsData);
    } catch (err) {
      console.error('Erreur lors du chargement des indicateurs du client:', err);
      setError(t('clientIndicators.messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Valide les données des indicateurs
   * @param data Les données à valider
   * @returns Les erreurs de validation
   */
  const validateIndicators = (data: IndicatorsData): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Validation pour chaque indicateur
    const indicatorKeys = ['Local', 'Num', 'Labs', 'Complex'];
    
    indicatorKeys.forEach(key => {
      const threshold1 = data[`${key}_1` as keyof IndicatorsData];
      const threshold2 = data[`${key}_2` as keyof IndicatorsData];
      
      // Vérifier que les valeurs sont dans la plage 0-100
      if (threshold1 !== null && (threshold1 < 0 || threshold1 > 100)) {
        errors[`${key}_1`] = t('clientIndicators.validation.rangeError');
      }
      if (threshold2 !== null && (threshold2 < 0 || threshold2 > 100)) {
        errors[`${key}_2`] = t('clientIndicators.validation.rangeError');
      }
      
      // Vérifier que seuil1 < seuil2 si les deux sont renseignés
      if (threshold1 !== null && threshold2 !== null && threshold1 >= threshold2) {
        errors[`${key}_order`] = t('clientIndicators.validation.orderError');
      }
    });

    return errors;
  };

  /**
   * Gère la soumission du formulaire pour enregistrer les indicateurs modifiés dans Firebase.
   * Empêche la soumission si l'utilisateur n'a pas les permissions nécessaires.
   * Affiche des messages de succès ou d'erreur en conséquence.
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   * @returns {Promise<void>} Une promesse qui se résout une fois la mise à jour terminée.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !indicators || !hasIndicatorsPermission) return;
    
    // Valider les données
    const errors = validateIndicators(indicators);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setError(t('clientIndicators.messages.validationError'));
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      console.log(`FIREBASE: [ÉCRITURE] - Fichier: ClientIndicators.tsx - Fonction: handleSubmit - Path: clients/${selectedClient.clientId}/indicators`);
      await updateClientIndicators(selectedClient.clientId, indicators);
      
      setSuccess(t('clientIndicators.messages.updateSuccess'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour des indicateurs:', err);
      setError(t('clientIndicators.messages.updateError'));
    } finally {
      setSaving(false);
    }
  };

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">{t('clientIndicators.messages.selectClientPrompt')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">{t('clientIndicators.messages.loading')}</p>
      </div>
    );
  }

  const indicatorsConfig = [
    { 
      key: 'Local', 
      label: t('clientIndicators.indicators.local'),
      description: t('clientIndicators.descriptions.local')
    },
    { 
      key: 'Num', 
      label: t('clientIndicators.indicators.digital'),
      description: t('clientIndicators.descriptions.digital')
    },
    { 
      key: 'Labs', 
      label: t('clientIndicators.indicators.labs'),
      description: t('clientIndicators.descriptions.labs')
    },
    { 
      key: 'Complex', 
      label: t('clientIndicators.indicators.complexity'),
      description: t('clientIndicators.descriptions.complexity')
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">{t('clientIndicators.headings.title')}</h2>
        
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
        
        {!hasIndicatorsPermission && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700">
            {t('clientIndicators.messages.readOnly')}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl">
          {indicatorsConfig.map((config) => (
            <IndicatorRow
              key={config.key}
              indicatorKey={config.key}
              label={config.label}
              description={config.description}
              threshold1={indicators?.[`${config.key}_1` as keyof IndicatorsData] ?? null}
              threshold2={indicators?.[`${config.key}_2` as keyof IndicatorsData] ?? null}
              hasPermission={hasIndicatorsPermission}
              onChange={(name, value) => {
                if (!indicators || !hasIndicatorsPermission) return;
                setIndicators({
                  ...indicators,
                  [name]: value,
                });
                // Effacer les erreurs de validation pour ce champ
                if (validationErrors[name]) {
                  const newErrors = { ...validationErrors };
                  delete newErrors[name];
                  setValidationErrors(newErrors);
                }
              }}
              validationErrors={validationErrors}
            />
          ))}
          
          <div className="pt-5 border-t border-gray-200 mt-8">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={loadClientIndicators}
                className={`bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${!hasIndicatorsPermission ? 'hidden' : ''}`}
              >
                {t('clientIndicators.buttons.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving || !hasIndicatorsPermission}
                className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  hasIndicatorsPermission
                    ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? t('clientIndicators.buttons.saving') : t('clientIndicators.buttons.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientIndicators;