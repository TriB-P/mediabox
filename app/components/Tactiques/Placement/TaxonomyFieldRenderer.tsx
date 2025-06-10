// app/components/Tactiques/Placement/TaxonomyFieldRenderer.tsx

'use client';

import React from 'react';
import { FormInput, SmartSelect } from '../Tactiques/TactiqueFormComponents';
import { getSourceColor, getFormatColor, formatRequiresShortcode, formatAllowsUserInput } from '../../../config/taxonomyFields';
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
  taxonomyValues: TaxonomyValues;
  highlightState: HighlightState;
  campaignData?: any;
  tactiqueData?: any;
  onFieldChange: (variableName: string, value: string, format: TaxonomyFormat, shortcodeId?: string) => void;
  onFieldHighlight: (variableName?: string) => void;
  // 🔥 MODIFIÉ: La signature de la fonction attend maintenant le format.
  getFormattedValue: (variableName: string, format: string) => string;
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
  onFieldHighlight,
  getFormattedValue
}) => {

  // ==================== FONCTIONS DE RENDU ====================
  
  const getCurrentFieldValue = (variable: ParsedTaxonomyVariable): { displayValue: string; actualValue: string } => {
    // 🔥 MODIFIÉ: Utilise le premier format comme format par défaut pour l'affichage.
    const formattedValue = getFormattedValue(variable.variable, variable.formats[0]);
    
    if (variable.source !== 'manual') {
      return { displayValue: formattedValue, actualValue: formattedValue };
    }
    
    const taxonomyValue = taxonomyValues[variable.variable];
    if (!taxonomyValue) return { displayValue: '', actualValue: '' };
    
    if (taxonomyValue.format === 'open') {
      return { displayValue: taxonomyValue.openValue || '', actualValue: taxonomyValue.openValue || '' };
    }
    
    if (taxonomyValue.shortcodeId) {
      const fieldState = fieldStates[variable.variable];
      if (fieldState?.options) {
        const selectedOption = fieldState.options.find(opt => opt.id === taxonomyValue.shortcodeId);
        if (selectedOption) {
          return { displayValue: selectedOption.label, actualValue: taxonomyValue.shortcodeId };
        }
      }
    }
    
    return { displayValue: taxonomyValue.value || '', actualValue: taxonomyValue.value || '' };
  };

  const renderVariableInput = (variable: ParsedTaxonomyVariable, fieldState: FieldState) => {
    const fieldKey = variable.variable;
    const { displayValue, actualValue } = getCurrentFieldValue(variable);
    
    if (variable.source !== 'manual') {
      return (
        <div className="relative">
          <FormInput id={fieldKey} name={fieldKey} value={displayValue} onChange={() => {}} type="text" placeholder={`Hérité de ${variable.source}`} label="" />
          <div className="absolute inset-0 bg-gray-100 bg-opacity-50 cursor-not-allowed rounded-lg"></div>
        </div>
      );
    }
    
    const hasOpenFormat = variable.formats.includes('open');
    const hasShortcodeFormats = variable.formats.some(formatRequiresShortcode);

    if (hasOpenFormat && (!hasShortcodeFormats || !fieldState.hasCustomList)) {
      return (
        <FormInput
          id={fieldKey}
          name={fieldKey}
          value={displayValue}
          onChange={(e) => onFieldChange(variable.variable, e.target.value, 'open')}
          type="text"
          placeholder="Saisir la valeur..."
          label=""
        />
      );
    }
    
    if (hasShortcodeFormats && fieldState.hasCustomList) {
      return (
        <div className="relative">
          <SmartSelect
            id={fieldKey}
            name={fieldKey}
            value={actualValue}
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedOption = fieldState.options.find(opt => opt.id === selectedId);
              const primaryFormat = variable.formats.find(f => formatRequiresShortcode(f)) || 'code';
              onFieldChange(variable.variable, selectedOption?.label || '', primaryFormat, selectedId);
            }}
            options={fieldState.options}
            placeholder={fieldState.isLoading ? "Chargement..." : "Sélectionner..."}
            label=""
          />
          {fieldState.isLoading && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-70 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <FormInput
        id={fieldKey}
        name={fieldKey}
        value={displayValue}
        onChange={(e) => onFieldChange(variable.variable, e.target.value, variable.formats[0])}
        type="text"
        placeholder="Saisie libre (pas de liste trouvée)"
        label=""
      />
    );
  };

  const renderFormatBadges = (formats: TaxonomyFormat[]) => {
    return (
      <div className="flex flex-wrap gap-1">
        {formats.map((format, index) => {
          const formatColor = getFormatColor(format);
          return (
            <span 
              key={index}
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formatColor.bg} ${formatColor.text}`}
            >
              {format}
            </span>
          );
        })}
      </div>
    );
  };
  
  const renderVariableCard = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = variable.variable;
    const fieldState = fieldStates[fieldKey];
    const sourceColor = getSourceColor(variable.source);
    
    if (!fieldState && variable.source === 'manual') return null;
    
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
          {renderFormatBadges(variable.formats)}
        </div>
        
        {renderVariableInput(variable, fieldState!)}
      </div>
    );
  };

  // ==================== RENDU PRINCIPAL ====================
  
  if (manualVariables.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-2">
          Configuration des variables
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
        Variables à configurer ({manualVariables.length})
      </h4>
      {manualVariables.map((variable) => renderVariableCard(variable))}
    </div>
  );
};

export default TaxonomyFieldRenderer;