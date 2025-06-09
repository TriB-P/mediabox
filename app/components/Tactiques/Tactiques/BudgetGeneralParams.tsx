// app/components/Tactiques/BudgetGeneralParams.tsx

'use client';

import React, { memo } from 'react';
import { SmartSelect, createLabelWithHelp } from './TactiqueFormComponents';

// ==================== TYPES ====================

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
}

interface BudgetGeneralParamsProps {
  // Données du formulaire
  formData: {
    TC_Currency?: string;
    TC_Unit_Type?: string;
    TC_Budget_Mode?: 'client' | 'media';
  };
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  
  // Données externes
  unitTypeOptions: ListItem[];
  
  // État de chargement
  disabled?: boolean;
}

// ==================== CONSTANTES ====================

const CURRENCIES = [
  { id: 'CAD', label: 'CAD - Dollar Canadien' },
  { id: 'USD', label: 'USD - Dollar Américain' },
  { id: 'EUR', label: 'EUR - Euro' }
];

const BUDGET_MODES = [
  { 
    id: 'media', 
    label: 'Budget média'
  },
  { 
    id: 'client', 
    label: 'Budget client'
  }
];

// ==================== COMPOSANT PRINCIPAL ====================

const BudgetGeneralParams = memo<BudgetGeneralParamsProps>(({
  formData,
  onChange,
  onTooltipChange,
  unitTypeOptions,
  disabled = false
}) => {
  
  const selectedCurrency = formData.TC_Currency || 'CAD';
  const selectedUnitType = formData.TC_Unit_Type || '';
  const selectedBudgetMode = formData.TC_Budget_Mode || 'media';

  return (
    <div className="space-y-6">
      {/* Type d'unité - Affiché seulement si des options sont disponibles */}
      {unitTypeOptions.length > 0 && (
        <SmartSelect
          id="TC_Unit_Type"
          name="TC_Unit_Type"
          value={selectedUnitType}
          onChange={onChange}
          options={unitTypeOptions.map(item => ({ 
            id: item.id, 
            label: item.SH_Display_Name_FR 
          }))}
          placeholder="Sélectionner un type d'unité..."
          label={createLabelWithHelp(
            'Type d\'unité', 
            'Type d\'unité utilisé pour cette tactique (ex: CPM, CPC, CPV). Masqué si aucune liste dynamique n\'est trouvée.', 
            onTooltipChange
          )}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Devise d'achat */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              'Devise d\'achat', 
              'Devise dans laquelle les achats média seront effectués. Utilisée pour les calculs de budget et la conversion si différente de la campagne.', 
              onTooltipChange
            )}
          </div>
          <select
            id="TC_Currency"
            name="TC_Currency"
            value={selectedCurrency}
            onChange={onChange}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
          >
            {CURRENCIES.map(currency => (
              <option key={currency.id} value={currency.id}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mode de saisie */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              'Mode de saisie', 
              'Détermine comment interpréter le budget saisi. Budget client = montant total incluant frais. Budget média = montant net pour les plateformes.', 
              onTooltipChange
            )}
          </div>
          <select
            id="TC_Budget_Mode"
            name="TC_Budget_Mode"
            value={selectedBudgetMode}
            onChange={onChange}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
          >
            {BUDGET_MODES.map(mode => (
              <option key={mode.id} value={mode.id}>
                {mode.label}
              </option>
            ))}
          </select>
          
        </div>
      </div>

      {/* Encadré explicatif des modes de saisie */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-800 mb-2">
          💡 Modes de saisie du budget
        </h5>
        <div className="text-sm text-blue-700 space-y-2">
          <div>
            <strong>Budget média :</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• Montant net qui sera effectivement dépensé sur les plateformes média</li>
              <li>• Les frais s'ajoutent par-dessus pour calculer le budget client total</li>
            </ul>
          </div>
          <div>
            <strong>Budget client :</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• Montant total incluant le budget média + tous les frais</li>
              <li>• Correspond au montant facturable au client</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Message si aucun type d'unité disponible */}
      {unitTypeOptions.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
          <p className="text-sm">
            <strong>Type d'unité :</strong> Aucune liste dynamique configurée. 
            Vous pouvez configurer les types d'unité dans la section Administration.
          </p>
        </div>
      )}

      {/* Message si champs désactivés */}
      {disabled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            ⏳ Chargement en cours... Les paramètres généraux seront disponibles une fois les données chargées.
          </p>
        </div>
      )}
    </div>
  );
});

BudgetGeneralParams.displayName = 'BudgetGeneralParams';

export default BudgetGeneralParams;