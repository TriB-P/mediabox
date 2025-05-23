'use client';

import React, { memo, useCallback } from 'react';
import { createLabelWithHelp } from './TactiqueFormComponents';

// ==================== TYPES ====================

interface CampaignAdminValues {
  CA_Billing_ID?: string;
  CA_PO?: string;
}

interface TactiqueFormAdminProps {
  // Données du formulaire
  formData: {
    TC_Billing_ID?: string;
    TC_PO?: string;
  };
  
  // États des héritages
  useInheritedBilling: boolean;
  useInheritedPO: boolean;
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  onInheritedBillingChange: (useInherited: boolean) => void;
  onInheritedPOChange: (useInherited: boolean) => void;
  
  // Données externes
  campaignAdminValues: CampaignAdminValues;
  
  // État de chargement
  loading?: boolean;
}

// ==================== COMPOSANTS ====================

/**
 * Composant pour un champ admin avec héritage
 */
const AdminField = memo<{
  id: string;
  name: string;
  label: string;
  tooltip: string;
  value: string;
  inheritedValue: string;
  useInherited: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInheritedChange: (useInherited: boolean) => void;
  onTooltipChange: (tooltip: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}>(({
  id,
  name,
  label,
  tooltip,
  value,
  inheritedValue,
  useInherited,
  onChange,
  onInheritedChange,
  onTooltipChange,
  placeholder,
  disabled = false
}) => {
  
  const handleInheritedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onInheritedChange(e.target.checked);
  }, [onInheritedChange]);

  const checkboxId = `inherit_${id}`;

  return (
    <div>
      {/* Checkbox pour l'héritage */}
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id={checkboxId}
          checked={useInherited}
          onChange={handleInheritedChange}
          disabled={disabled}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
        />
        <label htmlFor={checkboxId} className="ml-3 text-sm text-gray-700">
          Utiliser le même que la campagne
        </label>
      </div>
      
      {/* Label avec icône d'aide */}
      <div className="flex items-center gap-3 mb-2">
        {createLabelWithHelp(label, tooltip, onTooltipChange)}
      </div>
      
      {/* Input selon le mode */}
      {useInherited ? (
        <input
          type="text"
          value={inheritedValue || ''}
          disabled
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-500"
          placeholder="Valeur héritée de la campagne"
        />
      ) : (
        <input
          type="text"
          id={id}
          name={name}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          placeholder={placeholder}
        />
      )}
    </div>
  );
});

AdminField.displayName = 'AdminField';

// ==================== COMPOSANT PRINCIPAL ====================

const TactiqueFormAdmin = memo<TactiqueFormAdminProps>(({
  formData,
  useInheritedBilling,
  useInheritedPO,
  onChange,
  onTooltipChange,
  onInheritedBillingChange,
  onInheritedPOChange,
  campaignAdminValues,
  loading = false
}) => {
  
  // Désactiver les champs si en cours de chargement
  const isDisabled = loading;

  return (
    <div className="p-8 space-y-8">
      {/* En-tête de section */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Administration
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configuration administrative et facturation
        </p>
      </div>
      
      {/* Champs administratifs */}
      <div className="space-y-8">
        
        {/* TC_Billing_ID */}
        <AdminField
          id="TC_Billing_ID"
          name="TC_Billing_ID"
          label="Numéro de facturation"
          tooltip="Numéro utilisé pour la facturation de cette tactique"
          value={formData.TC_Billing_ID || ''}
          inheritedValue={campaignAdminValues.CA_Billing_ID || ''}
          useInherited={useInheritedBilling}
          onChange={onChange}
          onInheritedChange={onInheritedBillingChange}
          onTooltipChange={onTooltipChange}
          placeholder="Numéro de facturation spécifique"
          disabled={isDisabled}
        />

        {/* TC_PO */}
        <AdminField
          id="TC_PO"
          name="TC_PO"
          label="PO"
          tooltip="Numéro de bon de commande pour cette tactique"
          value={formData.TC_PO || ''}
          inheritedValue={campaignAdminValues.CA_PO || ''}
          useInherited={useInheritedPO}
          onChange={onChange}
          onInheritedChange={onInheritedPOChange}
          onTooltipChange={onTooltipChange}
          placeholder="PO spécifique"
          disabled={isDisabled}
        />
      </div>

      {/* Informations sur l'héritage */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-800 mb-2">
          💡 À propos de l'héritage
        </h5>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            • <strong>Héritage activé :</strong> La tactique utilisera les valeurs définies au niveau de la campagne.
          </p>
          <p>
            • <strong>Héritage désactivé :</strong> Vous pouvez définir des valeurs spécifiques pour cette tactique.
          </p>
          <p>
            • Les valeurs héritées sont automatiquement mises à jour si la campagne change.
          </p>
        </div>
      </div>

      {/* Valeurs actuelles de la campagne */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-800 mb-3">
          📋 Valeurs de la campagne
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Numéro de facturation :</span>
            <div className="mt-1 text-gray-800">
              {campaignAdminValues.CA_Billing_ID || (
                <span className="italic text-gray-500">Non défini</span>
              )}
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-600">PO :</span>
            <div className="mt-1 text-gray-800">
              {campaignAdminValues.CA_PO || (
                <span className="italic text-gray-500">Non défini</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message d'information si en chargement */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">Chargement des données administratives...</p>
        </div>
      )}

      {/* Message si les valeurs de campagne sont manquantes */}
      {(!campaignAdminValues.CA_Billing_ID && !campaignAdminValues.CA_PO) && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            ⚠️ Aucune valeur administrative n'est définie au niveau de la campagne. 
            Vous devrez saisir des valeurs spécifiques pour cette tactique.
          </p>
        </div>
      )}
    </div>
  );
});

TactiqueFormAdmin.displayName = 'TactiqueFormAdmin';

export default TactiqueFormAdmin;