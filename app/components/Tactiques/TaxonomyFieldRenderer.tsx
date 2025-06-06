// app/components/Tactiques/TaxonomyFieldRenderer.tsx

'use client';

import React from 'react';
import { FormInput, SmartSelect } from './TactiqueFormComponents';
import { getSourceColor } from '../../config/taxonomyFields';
import type {
  ParsedTaxonomyVariable,
  TaxonomyValues,
  HighlightState
} from '../../types/tactiques';

// ==================== TYPES ====================

interface FieldState {
  config: any;
  options: Array<{ id: string; label: string; code?: string }>;
  hasCustomList: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  error?: string;
}

interface TaxonomyFieldRendererProps {
  manualVariables: ParsedTaxonomyVariable[];
  fieldStates: { [key: string]: FieldState };
  taxonomyValues: TaxonomyValues;
  highlightState: HighlightState;
  campaignData?: any;
  tactiqueData?: any;
  onFieldChange: (variableName: string, value: string, format: string) => void;
  onFieldHighlight: (variableName?: string) => void;
}

// ==================== COMPOSANT PRINCIPAL ====================

const TaxonomyFieldRenderer: React.FC<TaxonomyFieldRendererProps> = ({
  manualVariables,
  fieldStates,
  taxonomyValues,
  highlightState,
  campaignData,
  tactiqueData,
  onFieldChange,
  onFieldHighlight
}) => {

  // ==================== FONCTIONS DE RENDU ====================
  
  const renderVariableInput = (variable: ParsedTaxonomyVariable, fieldState: FieldState) => {
    const fieldKey = `${variable.variable}_${variable.format}`;
    const currentValue = taxonomyValues[variable.variable]?.value || '';
    
    if (variable.source === 'campaign' || variable.source === 'tactique') {
      // Champs en lecture seule avec valeurs héritées
      const inheritedValue = variable.source === 'campaign' 
        ? (campaignData?.[variable.variable] || '')
        : (tactiqueData?.[variable.variable] || '');
      
      return (
        <div className="relative">
          <FormInput
            id={fieldKey}
            name={fieldKey}
            value={String(inheritedValue)}
            onChange={() => {}} // Lecture seule
            type="text"
            placeholder={`Valeur héritée de ${variable.source}`}
            label=""
          />
          <div className="absolute top-2 right-2">
            <span className="text-xs text-gray-500">
              {inheritedValue ? '✓ Valeur héritée' : '⚠ Aucune valeur'}
            </span>
          </div>
          {/* Overlay pour indiquer visuellement la lecture seule */}
          <div className="absolute inset-0 bg-gray-100 bg-opacity-50 cursor-not-allowed rounded pointer-events-none"></div>
        </div>
      );
    }
    
    // Champs manuels
    if (fieldState.hasCustomList && fieldState.options.length > 0) {
      return (
        <div className="relative">
          <SmartSelect
            id={fieldKey}
            name={fieldKey}
            value={currentValue}
            onChange={fieldState.isLoading ? () => {} : (e) => onFieldChange(variable.variable, e.target.value, variable.format)}
            options={fieldState.options}
            placeholder={fieldState.isLoading ? "Chargement..." : "Sélectionner une valeur..."}
            label=""
          />
          {/* Overlay de chargement */}
          {fieldState.isLoading && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-70 cursor-not-allowed rounded pointer-events-none flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
          {renderFieldStatus(fieldState)}
        </div>
      );
    }
    
    // Champ de saisie libre
    return (
      <div className="relative">
        <FormInput
          id={fieldKey}
          name={fieldKey}
          value={currentValue}
          onChange={fieldState.isLoading ? () => {} : (e) => onFieldChange(variable.variable, e.target.value, variable.format)}
          type="text"
          placeholder={fieldState.isLoading ? "Chargement..." : `Saisir ${variable.format}...`}
          label=""
        />
        {/* Overlay de chargement */}
        {fieldState.isLoading && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-70 cursor-not-allowed rounded pointer-events-none flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
        {renderFieldStatus(fieldState)}
      </div>
    );
  };

  const renderFieldStatus = (fieldState: FieldState) => {
    if (fieldState.error) {
      return (
        <div className="text-xs text-red-600 mt-1 flex items-center">
          <span>⚠ {fieldState.error}</span>
        </div>
      );
    }
    

    
    return null;
  };

  const renderVariableFields = () => {
    if (manualVariables.length === 0) {
      return (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-2">
            Configuration des variables
          </h4>
          <p className="text-sm">
            Aucune variable manuelle trouvée. Toutes les valeurs sont héritées automatiquement 
            de la campagne et de la tactique.
          </p>
        </div>
      );
    }

    // Séparer les variables par source pour un meilleur affichage
    const manualVars = manualVariables.filter(v => v.source === 'manual');
    const inheritedVars = manualVariables.filter(v => v.source !== 'manual');

    return (
      <div className="space-y-6">
        {/* Variables manuelles */}
        {manualVars.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
              Variables à configurer ({manualVars.length})
            </h4>
            {manualVars.map((variable) => renderVariableCard(variable))}
          </div>
        )}

        {/* Variables héritées (pour info) */}
        {inheritedVars.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
              Variables héritées ({inheritedVars.length})
            </h4>
            {inheritedVars.map((variable) => renderVariableCard(variable))}
          </div>
        )}
      </div>
    );
  };

  const renderVariableCard = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = `${variable.variable}_${variable.format}`;
    const fieldState = fieldStates[fieldKey];
    const sourceColor = getSourceColor(variable.source);
    
    if (!fieldState) return null;
    
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            
            <span className="text-sm font-medium text-gray-900">
              {variable.variable}
            </span>
            <span className="text-xs text-gray-500">
              ({variable.format})
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {!variable.isValid && (
              <span className="text-xs text-red-600">
                ⚠ {variable.errorMessage}
              </span>
            )}
            
 
          </div>
        </div>
        
        {renderVariableInput(variable, fieldState)}
      </div>
    );
  };

  // ==================== RENDU PRINCIPAL ====================
  
  return (
    <div>
      
      {renderVariableFields()}
    </div>
  );
};

export default TaxonomyFieldRenderer;