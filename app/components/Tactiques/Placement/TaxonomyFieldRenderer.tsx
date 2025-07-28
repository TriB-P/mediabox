// app/components/Tactiques/Placement/TaxonomyFieldRenderer.tsx - CORRECTION HYBRIDE

'use client';

import React from 'react';
import { FormInput, SmartSelect } from '../Tactiques/TactiqueFormComponents';
import { getSourceColor, formatRequiresShortcode, getVariableConfig } from '../../../config/taxonomyFields';
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
  
  const renderVariableInput = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = variable.variable;
    const fieldState = fieldStates[fieldKey];
    const currentValue = formData[fieldKey] || '';
    
    // 🔥 CORRECTION: Utiliser getVariableConfig pour obtenir les formats autorisés
    const variableConfig = getVariableConfig(variable.variable);
    const allowedFormats = variableConfig?.allowedFormats || [];
    
    const hasShortcodeList = allowedFormats.some(formatRequiresShortcode) && fieldState?.hasCustomList;
    
    // 🔥 CORRECTION: Vérifier si la valeur actuelle correspond à un ID d'option
    let isValueInOptions = false;
    let matchingOption = null;
    
    if (hasShortcodeList && fieldState.options.length > 0) {
      matchingOption = fieldState.options.find(opt => opt.id === currentValue || opt.label === currentValue);
      isValueInOptions = !!matchingOption;
    }
    
    console.log(`🔍 ${fieldKey}: hasShortcodeList=${hasShortcodeList}, isValueInOptions=${isValueInOptions}, currentValue="${currentValue}"`);

    // 🔥 NOUVEAU: Mode hybride - SmartSelect SI la valeur est dans les options OU si pas de valeur actuelle
    if (hasShortcodeList && (isValueInOptions || !currentValue)) {
      console.log(`📋 ${fieldKey}: Rendu SmartSelect (valeur dans options ou vide)`);
      
      // Déterminer la valeur à afficher dans le select
      const selectValue = matchingOption ? matchingOption.id : currentValue;
      
      return (
        <div className="relative">
          <SmartSelect
            id={fieldKey}
            name={fieldKey}
            value={selectValue}
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedOption = fieldState.options.find(opt => opt.id === selectedId);
              const primaryFormat = allowedFormats.find(f => formatRequiresShortcode(f)) || 'code';
              console.log(`🔄 SmartSelect ${fieldKey} changé:`, { selectedId, selectedOption, primaryFormat });
              onFieldChange(variable.variable, selectedOption?.label || '', primaryFormat, selectedId);
            }}
            options={[
              { id: '', label: 'Saisie libre...' }, // 🔥 NOUVEAU: Option pour passer en mode libre
              ...fieldState.options
            ]}
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
    
    // 🔥 CORRECTION: Mode texte libre - quand valeur pas dans options OU pas de liste
    console.log(`📝 ${fieldKey}: Rendu FormInput (saisie libre)`);
    return (
      <div className="space-y-2">
        <FormInput
          id={fieldKey}
          name={fieldKey}
          value={currentValue}
          onChange={(e) => {
            console.log(`🔄 FormInput ${fieldKey} changé:`, e.target.value);
            onFieldChange(variable.variable, e.target.value, 'open');
          }}
          type="text"
          placeholder="Saisir la valeur..."
          label=""
        />
        {/* 🔥 NOUVEAU: Bouton pour passer en mode liste si disponible */}
        {hasShortcodeList && (
          <button
            type="button"
            onClick={() => {
              // Vider la valeur pour forcer le passage en mode SmartSelect
              onFieldChange(variable.variable, '', 'open');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            📋 Choisir dans la liste ({fieldState.options.length} options)
          </button>
        )}
      </div>
    );
  };

  const renderVariableCard = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = variable.variable;
    const sourceColor = getSourceColor(variable.source);
    const currentValue = formData[fieldKey] || '';
    
    return (
      <div
        key={fieldKey}
        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
          highlightState.activeVariable === variable.variable
            ? `${sourceColor.border} bg-${sourceColor.bg.split('-')[1]}-50`
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onMouseEnter={() => onFieldHighlight(variable.variable)}
        onMouseLeave={() => onFieldHighlight()}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900">
              {variable.label || variable.variable}
            </span>

          </div>
        </div>
        
        <div className="mt-2">
          {renderVariableInput(variable)}
        </div>
      </div>
    );
  };

  // ==================== RENDU PRINCIPAL ====================
  
  return (
    <div className="space-y-4">


      {manualVariables.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-2">
            Configuration des champs de placement
          </h4>
          <p className="text-sm">
            Toutes les variables sont héritées automatiquement. Aucune configuration manuelle n'est requise.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
            Champs à configurer ({manualVariables.length})
          </h4>
          {manualVariables.map((variable) => renderVariableCard(variable))}
        </div>
      )}
    </div>
  );
};

export default TaxonomyFieldRenderer;