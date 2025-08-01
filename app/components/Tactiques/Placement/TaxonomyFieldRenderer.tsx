// app/components/Tactiques/Placement/TaxonomyFieldRenderer.tsx - Version avec labels et custom dimensions

'use client';

import React from 'react';
import { FormInput, SmartSelect } from '../Tactiques/TactiqueFormComponents';
import { getSourceColor, formatRequiresShortcode, getVariableConfig } from '../../../config/taxonomyFields';
import { getPlacementFieldLabel, isCustomDimension } from '../../../config/placementFieldLabels';
import type { ParsedTaxonomyVariable, TaxonomyValues, HighlightState } from '../../../types/tactiques';
import type { TaxonomyFormat } from '../../../config/taxonomyFields';

// ==================== TYPES ====================

interface FieldState {
  options: Array<{ id: string; label: string; code?: string }>;
  hasCustomList: boolean;
  isLoading: boolean;
  error?: string;
}

interface ClientConfig {
  Custom_Dim_PL_1?: string;
  Custom_Dim_PL_2?: string;
  Custom_Dim_SPL_3?: string;
}

interface TaxonomyFieldRendererProps {
  manualVariables: ParsedTaxonomyVariable[];
  fieldStates: { [key: string]: FieldState };
  formData: any; 
  highlightState: HighlightState;
  clientConfig?: ClientConfig;
  customDim1List?: Array<{ id: string; label: string; code?: string }>;
  customDim2List?: Array<{ id: string; label: string; code?: string }>;
  customDim3List?: Array<{ id: string; label: string; code?: string }>;
  loadingCustomDims?: boolean;
  onFieldChange: (variableName: string, value: string, format: TaxonomyFormat, shortcodeId?: string) => void;
  onFieldHighlight: (variableName?: string) => void;
}

// ==================== COMPOSANT PRINCIPAL ====================

const TaxonomyFieldRenderer: React.FC<TaxonomyFieldRendererProps> = ({
  manualVariables,
  fieldStates,
  formData,
  highlightState,
  clientConfig = {},
  customDim1List = [],
  customDim2List = [],
  customDim3List = [],
  loadingCustomDims = false,
  onFieldChange,
  onFieldHighlight,
}) => {

  // ==================== FONCTIONS UTILITAIRES ====================

  /**
   * Obtient le label à afficher pour un champ donné
   */
  const getFieldLabel = (variable: ParsedTaxonomyVariable): string => {
    const fieldKey = variable.variable;
    
    // Pour les dimensions personnalisées, utiliser la config client si disponible
    if (isCustomDimension(fieldKey)) {
      const configKey = fieldKey.replace('PL_', '') as keyof ClientConfig;
      const customLabel = clientConfig[configKey];
      return getPlacementFieldLabel(fieldKey, customLabel);
    }
    
    // Pour les autres champs, utiliser le mapping standard
    return getPlacementFieldLabel(fieldKey, variable.label);
  };

  /**
   * Détermine si un champ de dimension personnalisée doit être affiché
   */
  const shouldShowCustomDimension = (fieldKey: string): boolean => {
    if (!isCustomDimension(fieldKey)) return true;
    
    const configKey = fieldKey.replace('PL_', '') as keyof ClientConfig;
    return !!clientConfig[configKey];
  };

  /**
   * Obtient les options pour les dimensions personnalisées
   */
  const getCustomDimensionOptions = (fieldKey: string) => {
    switch (fieldKey) {
      case 'PL_Custom_Dim_1':
        return customDim1List;
      case 'PL_Custom_Dim_2':
        return customDim2List;
      case 'PL_Custom_Dim_3':
        return customDim3List;
      default:
        return [];
    }
  };

  // ==================== FONCTIONS DE RENDU ====================
  
  const renderCustomDimensionField = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = variable.variable;
    const currentValue = formData[fieldKey] || '';
    const customOptions = getCustomDimensionOptions(fieldKey);
    const hasCustomOptions = customOptions.length > 0;
    
    // Si chargement en cours
    if (loadingCustomDims) {
      return (
        <div className="relative">
          <FormInput
            id={fieldKey}
            name={fieldKey}
            value={currentValue}
            onChange={() => {}} // Disabled pendant le chargement
            type="text"
            placeholder="Chargement..."
            label=""
          />
          <div className="absolute inset-0 bg-gray-100 bg-opacity-70 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        </div>
      );
    }

    // Si des options sont disponibles, utiliser SmartSelect
    if (hasCustomOptions) {
      const selectedOption = customOptions.find(opt => opt.id === currentValue || opt.label === currentValue);
      const selectValue = selectedOption ? selectedOption.id : currentValue;
      
      return (
        <SmartSelect
          id={fieldKey}
          name={fieldKey}
          value={selectValue}
          onChange={(e) => {
            const selectedId = e.target.value;
            const selectedOption = customOptions.find(opt => opt.id === selectedId);
            console.log(`🔄 CustomDim ${fieldKey} changé:`, { selectedId, selectedOption });
            onFieldChange(variable.variable, selectedOption?.label || '', 'code', selectedId);
          }}
          options={customOptions}
          placeholder="Sélectionner..."
          label=""
        />
      );
    }

    // Sinon, champ texte libre
    return (
      <FormInput
        id={fieldKey}
        name={fieldKey}
        value={currentValue}
        onChange={(e) => {
          console.log(`🔄 CustomDim ${fieldKey} (texte libre) changé:`, e.target.value);
          onFieldChange(variable.variable, e.target.value, 'open');
        }}
        type="text"
        placeholder="Saisir la valeur..."
        label=""
      />
    );
  };
  
  const renderStandardField = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = variable.variable;
    const fieldState = fieldStates[fieldKey];
    const currentValue = formData[fieldKey] || '';
    
    // Obtenir les formats autorisés pour ce champ
    const variableConfig = getVariableConfig(variable.variable);
    const allowedFormats = variableConfig?.allowedFormats || [];
    
    const hasShortcodeList = allowedFormats.some(formatRequiresShortcode) && fieldState?.hasCustomList;
    
    // Vérifier si la valeur actuelle correspond à un ID d'option
    let isValueInOptions = false;
    let matchingOption = null;
    
    if (hasShortcodeList && fieldState.options.length > 0) {
      matchingOption = fieldState.options.find(opt => opt.id === currentValue || opt.label === currentValue);
      isValueInOptions = !!matchingOption;
    }
    
    console.log(`🔍 ${fieldKey}: hasShortcodeList=${hasShortcodeList}, isValueInOptions=${isValueInOptions}, currentValue="${currentValue}"`);

    // Mode hybride - SmartSelect SI la valeur est dans les options OU si pas de valeur actuelle
    if (hasShortcodeList && (isValueInOptions || !currentValue)) {
      console.log(`📋 ${fieldKey}: Rendu SmartSelect (valeur dans options ou vide)`);
      
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
    
    // Mode texte libre
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
        {/* Bouton pour passer en mode liste si disponible */}
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

  const renderVariableInput = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = variable.variable;
    
    // Pour les dimensions personnalisées, utiliser le rendu spécialisé
    if (isCustomDimension(fieldKey)) {
      return renderCustomDimensionField(variable);
    }
    
    // Pour les autres champs, utiliser le rendu standard
    return renderStandardField(variable);
  };

  const renderVariableCard = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = variable.variable;
    const sourceColor = getSourceColor(variable.source);
    const fieldLabel = getFieldLabel(variable);
    
    // Ne pas afficher les dimensions personnalisées non configurées
    if (isCustomDimension(fieldKey) && !shouldShowCustomDimension(fieldKey)) {
      return null;
    }
    
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
            <div className="text-sm font-medium text-gray-900">
              {fieldLabel}
            </div>
            {/* Afficher le nom technique en dessous si différent du label */}
            {fieldLabel !== fieldKey && (
              <div className="text-[10px] text-gray-400 mt-0.5">
                {fieldKey}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-2">
          {renderVariableInput(variable)}
        </div>
      </div>
    );
  };

  // ==================== RENDU PRINCIPAL ====================
  
  // Filtrer les variables pour exclure les dimensions non configurées
  const visibleVariables = manualVariables.filter(variable => {
    if (isCustomDimension(variable.variable)) {
      return shouldShowCustomDimension(variable.variable);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {visibleVariables.length === 0 ? (
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
            Champs à configurer ({visibleVariables.length})
          </h4>
          {visibleVariables.map((variable) => renderVariableCard(variable))}
        </div>
      )}
    </div>
  );
};

export default TaxonomyFieldRenderer;