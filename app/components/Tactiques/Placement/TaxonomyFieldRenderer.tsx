// app/components/Tactiques/Placement/TaxonomyFieldRenderer.tsx - Simplifié sans logique spéciale

'use client';

import React from 'react';
import { FormInput, SmartSelect } from '../Tactiques/TactiqueFormComponents';
import { getSourceColor, formatRequiresShortcode, getVariableConfig } from '../../../config/taxonomyFields';
import { getFieldLabel as getGenericFieldLabel } from '../../../config/TaxonomyFieldLabels';
import type { ParsedTaxonomyVariable, HighlightState } from '../../../types/tactiques';
import type { TaxonomyFormat } from '../../../config/taxonomyFields';


// ==================== TYPES ====================

interface FieldState {
  options: Array<{ id: string; label: string; code?: string }>;
  hasCustomList: boolean;
  isLoading: boolean;
  error?: string;
}

// 🔥 AJOUTÉ: Interface pour config client (labels pour placements ET créatifs)
interface ClientConfig {
  Custom_Dim_PL_1?: string;
  Custom_Dim_PL_2?: string;
  Custom_Dim_PL_3?: string;
  Custom_Dim_CR_1?: string; // 🔥 AJOUTÉ: Support créatifs
  Custom_Dim_CR_2?: string; // 🔥 AJOUTÉ: Support créatifs
  Custom_Dim_CR_3?: string; // 🔥 AJOUTÉ: Support créatifs
}

interface TaxonomyFieldRendererProps {
  manualVariables: ParsedTaxonomyVariable[];
  fieldStates: { [key: string]: FieldState };
  formData: any; 
  highlightState: HighlightState;
  clientConfig?: ClientConfig; // 🔥 AJOUTÉ: Pour les labels personnalisés
  onFieldChange: (variableName: string, value: string, format: TaxonomyFormat, shortcodeId?: string) => void;
  onFieldHighlight: (variableName?: string) => void;
}

// ==================== COMPOSANT PRINCIPAL ====================

const TaxonomyFieldRenderer: React.FC<TaxonomyFieldRendererProps> = ({
  manualVariables,
  fieldStates,
  formData,
  highlightState,
  clientConfig = {}, // 🔥 AJOUTÉ: Config client avec valeur par défaut
  onFieldChange,
  onFieldHighlight,
}) => {

  // ==================== FONCTIONS UTILITAIRES ====================

  /**
   * Obtient le label à afficher pour un champ donné
   */
  const getFieldLabel = (variable: ParsedTaxonomyVariable): string => {
    const fieldKey = variable.variable;
    
    // Pour les custom dimensions PLACEMENT, utiliser le label personnalisé si disponible
    if (fieldKey === 'PL_Custom_Dim_1' && clientConfig.Custom_Dim_PL_1) {
      return clientConfig.Custom_Dim_PL_1;
    }
    if (fieldKey === 'PL_Custom_Dim_2' && clientConfig.Custom_Dim_PL_2) {
      return clientConfig.Custom_Dim_PL_2;
    }
    if (fieldKey === 'PL_Custom_Dim_3' && clientConfig.Custom_Dim_PL_3) {
      return clientConfig.Custom_Dim_PL_3;
    }
    
    // Pour les custom dimensions CRÉATIF, utiliser le label personnalisé si disponible  
    if (fieldKey === 'CR_Custom_Dim_1' && clientConfig.Custom_Dim_CR_1) {
      return clientConfig.Custom_Dim_CR_1;
    }
    if (fieldKey === 'CR_Custom_Dim_2' && clientConfig.Custom_Dim_CR_2) {
      return clientConfig.Custom_Dim_CR_2;
    }
    if (fieldKey === 'CR_Custom_Dim_3' && clientConfig.Custom_Dim_CR_3) {
      return clientConfig.Custom_Dim_CR_3;
    }
    
    // Pour tous les autres champs, utiliser la fonction générique importée
    return getGenericFieldLabel(fieldKey);
  };
  // ==================== FONCTIONS DE RENDU ====================
  
  const renderVariableField = (variable: ParsedTaxonomyVariable) => {
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
    

    // Si chargement en cours
    if (fieldState?.isLoading) {
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

    // Mode hybride - SmartSelect SI la valeur est dans les options OU si pas de valeur actuelle
    if (hasShortcodeList && (isValueInOptions || !currentValue)) {
      
      const selectValue = matchingOption ? matchingOption.id : currentValue;
      
      return (
        <SmartSelect
          id={fieldKey}
          name={fieldKey}
          value={selectValue}
          onChange={(e) => {
            const selectedId = e.target.value;
            const selectedOption = fieldState.options.find(opt => opt.id === selectedId);
            const primaryFormat = allowedFormats.find(f => formatRequiresShortcode(f)) || 'code';
            onFieldChange(variable.variable, selectedOption?.label || '', primaryFormat, selectedId);
          }}
          options={fieldState.options}
          placeholder="Sélectionner..."
          label=""
        />
      );
    }
    
    // Mode texte libre
    return (
      <div className="space-y-2">
        <FormInput
          id={fieldKey}
          name={fieldKey}
          value={currentValue}
          onChange={(e) => {
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

  const renderVariableCard = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = variable.variable;
    const sourceColor = getSourceColor(variable.source);
    const fieldLabel = getFieldLabel(variable);
    
    
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
          {renderVariableField(variable)}
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