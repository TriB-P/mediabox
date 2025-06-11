// app/components/Tactiques/Placement/TaxonomyFieldRenderer.tsx

'use client';

import React from 'react';
import { FormInput, SmartSelect } from '../Tactiques/TactiqueFormComponents';
import { getSourceColor, formatRequiresShortcode } from '../../../config/taxonomyFields';
import type { ParsedTaxonomyVariable, TaxonomyValues, HighlightState } from '../../../types/tactiques';
import type { TaxonomyFormat } from '../../../config/taxonomyFields';

// ==================== TYPES ====================

interface FieldState {
  options: Array<{ id: string; label: string; code?: string }>;
  hasCustomList: boolean;
  isLoading: boolean;
  error?: string;
}

interface TaxonomyFieldRendererProps {
  manualVariables: ParsedTaxonomyVariable[];
  fieldStates: { [key: string]: FieldState };
  // 🔥 NOUVEAU: Reçoit directement formData pour lire les valeurs des champs
  formData: any; 
  highlightState: HighlightState;
  onFieldChange: (variableName: string, value: string, format: TaxonomyFormat, shortcodeId?: string) => void;
  onFieldHighlight: (variableName?: string) => void;
}

// ==================== COMPOSANT PRINCIPAL ====================

const TaxonomyFieldRenderer: React.FC<TaxonomyFieldRendererProps> = ({
  manualVariables,
  fieldStates,
  formData,
  highlightState,
  onFieldChange,
  onFieldHighlight,
}) => {

  // ==================== FONCTIONS DE RENDU ====================
  
  /**
   * 🔥 SIMPLIFIÉ: Rend un champ de formulaire pour une variable de placement.
   */
  const renderVariableInput = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = variable.variable;
    const fieldState = fieldStates[fieldKey];
    
    // La valeur est lue directement depuis le formData principal
    const currentValue = formData[fieldKey] || '';
    
    // Déterminer si on doit afficher un dropdown ou un champ de texte
    const hasShortcodeList = variable.formats.some(formatRequiresShortcode) && fieldState?.hasCustomList;

    if (hasShortcodeList) {
      return (
        <div className="relative">
          <SmartSelect
            id={fieldKey}
            name={fieldKey}
            value={currentValue}
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedOption = fieldState.options.find(opt => opt.id === selectedId);
              // On utilise le premier format compatible comme format par défaut pour le shortcode
              const primaryFormat = variable.formats.find(f => formatRequiresShortcode(f)) || 'code';
              onFieldChange(variable.variable, selectedOption?.label || '', primaryFormat, selectedId);
            }}
            options={fieldState.options}
            placeholder={fieldState.isLoading ? "Chargement..." : "Sélectionner..."}
            label=""
          />
          {fieldState.isLoading && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-70 flex items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      );
    }
    
    // Par défaut, ou si pas de liste, on affiche un champ de texte libre
    return (
      <FormInput
        id={fieldKey}
        name={fieldKey}
        value={currentValue}
        // Le format 'open' est utilisé pour la saisie libre
        onChange={(e) => onFieldChange(variable.variable, e.target.value, 'open')}
        type="text"
        placeholder="Saisir la valeur..."
        label=""
      />
    );
  };

  const renderVariableCard = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = variable.variable;
    const sourceColor = getSourceColor(variable.source);
    
    return (
      <div
        key={fieldKey}
        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
          highlightState.activeVariable === variable.variable
            ? `${sourceColor.border} bg-${sourceColor.bg.split('-')[1]}-50`
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onMouseEnter={() => onFieldHighlight(variable.variable)}
        onMouseLeave={() => onFieldHighlight()}
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm font-medium text-gray-900">
            {variable.variable}
          </span>
        </div>
        
        {renderVariableInput(variable)}
      </div>
    );
  };

  // ==================== RENDU PRINCIPAL ====================
  
  if (manualVariables.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-2">
          Configuration des champs de placement
        </h4>
        <p className="text-sm">
          Toutes les variables sont héritées automatiquement. Aucune configuration manuelle n'est requise.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
        Champs de placement à configurer ({manualVariables.length})
      </h4>
      {manualVariables.map((variable) => renderVariableCard(variable))}
    </div>
  );
};

export default TaxonomyFieldRenderer;