// app/components/Tactiques/Placement/TaxonomyFieldRenderer.tsx

'use client';

import React from 'react';
import { FormInput, SmartSelect } from '../Tactiques/TactiqueFormComponents';
import { getSourceColor, getFormatColor, formatRequiresShortcode, formatAllowsUserInput } from '../../../config/taxonomyFields';
import type {
  ParsedTaxonomyVariable,
  TaxonomyValues,
  HighlightState
} from '../../../types/tactiques';
import type { TaxonomyFormat } from '../../../config/taxonomyFields';

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
  onFieldChange: (variableName: string, value: string, format: TaxonomyFormat, shortcodeId?: string) => void;
  onFieldHighlight: (variableName?: string) => void;
  getFormattedValue: (variableName: string) => string; // 🔥 NOUVEAU
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
  getFormattedValue // 🔥 NOUVEAU
}) => {

  // ==================== FONCTIONS DE RENDU ====================
  
  /**
   * 🔥 NOUVEAU : Obtient la valeur actuelle pour un champ
   */
  const getCurrentFieldValue = (variable: ParsedTaxonomyVariable): { displayValue: string; actualValue: string } => {
    const taxonomyValue = taxonomyValues[variable.variable];
    
    if (variable.source === 'campaign' || variable.source === 'tactique') {
      // Champs hérités : utiliser la valeur formatée
      const formattedValue = getFormattedValue(variable.variable);
      return {
        displayValue: formattedValue,
        actualValue: formattedValue
      };
    }
    
    if (!taxonomyValue) {
      return {
        displayValue: '',
        actualValue: ''
      };
    }
    
    if (variable.format === 'open') {
      // Format open : utiliser directement la valeur saisie
      return {
        displayValue: taxonomyValue.openValue || '',
        actualValue: taxonomyValue.openValue || ''
      };
    }
    
    if (taxonomyValue.shortcodeId) {
      // Format shortcode : afficher le shortcode sélectionné
      const fieldKey = `${variable.variable}_${variable.format}`;
      const fieldState = fieldStates[fieldKey];
      
      if (fieldState?.options) {
        const selectedOption = fieldState.options.find(opt => opt.id === taxonomyValue.shortcodeId);
        if (selectedOption) {
          return {
            displayValue: selectedOption.label, // Toujours display_fr pour l'affichage
            actualValue: taxonomyValue.shortcodeId
          };
        }
      }
    }
    
    return {
      displayValue: taxonomyValue.value || '',
      actualValue: taxonomyValue.value || ''
    };
  };

  /**
   * 🔥 NOUVEAU : Rend un champ selon son format et sa source
   */
  const renderVariableInput = (variable: ParsedTaxonomyVariable, fieldState: FieldState) => {
    const fieldKey = `${variable.variable}_${variable.format}`;
    const { displayValue, actualValue } = getCurrentFieldValue(variable);
    
    // 🔥 CHAMPS HÉRITÉS (lecture seule)
    if (variable.source === 'campaign' || variable.source === 'tactique') {
      const inheritedValue = variable.source === 'campaign' 
        ? (campaignData?.[variable.variable] || '')
        : (tactiqueData?.[variable.variable] || '');
      
      const formattedValue = getFormattedValue(variable.variable);
      
      return (
        <div className="relative">
          <FormInput
            id={fieldKey}
            name={fieldKey}
            value={formattedValue}
            onChange={() => {}} // Lecture seule
            type="text"
            placeholder={`Valeur héritée de ${variable.source}`}
            label=""
          />
          <div className="absolute top-2 right-2">
            <span className="text-xs text-gray-500">
              {formattedValue ? '✓ Valeur héritée' : '⚠ Aucune valeur'}
            </span>
          </div>
          {/* Overlay pour indiquer visuellement la lecture seule */}
          <div className="absolute inset-0 bg-gray-100 bg-opacity-30 cursor-not-allowed rounded pointer-events-none"></div>
        </div>
      );
    }
    
    // 🔥 CHAMPS MANUELS
    
    // Format OPEN (saisie libre)
    if (variable.format === 'open') {
      return (
        <div className="relative">
          <FormInput
            id={fieldKey}
            name={fieldKey}
            value={displayValue}
            onChange={(e) => onFieldChange(variable.variable, e.target.value, variable.format)}
            type="text"
            placeholder={`Saisir ${variable.format}...`}
            label=""
          />
          {renderFieldStatus(fieldState)}
        </div>
      );
    }
    
    // Formats nécessitant un SHORTCODE
    if (formatRequiresShortcode(variable.format)) {
      if (fieldState.hasCustomList && fieldState.options.length > 0) {
        return (
          <div className="relative">
            <SmartSelect
              id={fieldKey}
              name={fieldKey}
              value={actualValue} // ID du shortcode sélectionné
              onChange={(e) => {
                const selectedId = e.target.value;
                const selectedOption = fieldState.options.find(opt => opt.id === selectedId);
                const displayValue = selectedOption?.label || '';
                
                onFieldChange(variable.variable, displayValue, variable.format, selectedId);
              }}
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
      } else {
        // Pas de liste disponible pour ce format shortcode
        return (
          <div className="relative">
            <FormInput
              id={fieldKey}
              name={fieldKey}
              value=""
              onChange={() => {}}
              type="text"
              placeholder="Liste non disponible pour ce format"
              label=""
            />
            <div className="text-xs text-amber-600 mt-1">
              ⚠ Format {variable.format} nécessite une liste de shortcodes
            </div>
          </div>
        );
      }
    }
    
    // Fallback : champ de saisie libre
    return (
      <div className="relative">
        <FormInput
          id={fieldKey}
          name={fieldKey}
          value={displayValue}
          onChange={(e) => onFieldChange(variable.variable, e.target.value, variable.format)}
          type="text"
          placeholder={`Saisir ${variable.format}...`}
          label=""
        />
        {renderFieldStatus(fieldState)}
      </div>
    );
  };

  /**
   * Rend le statut d'un champ (erreur, chargement, etc.)
   */
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

  /**
   * 🔥 NOUVEAU : Rend la badge de format avec couleur
   */
  const renderFormatBadge = (format: TaxonomyFormat) => {
    const formatColor = getFormatColor(format);
    const formatLabel = (() => {
      switch (format) {
        case 'code': return 'Code';
        case 'display_fr': return 'FR';
        case 'display_en': return 'EN';
        case 'utm': return 'UTM';
        case 'custom_utm': return 'UTM+';
        case 'custom_code': return 'Code+';
        case 'open': return 'Libre';
        default: return format;
      }
    })();
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formatColor.bg} ${formatColor.text}`}>
        {formatLabel}
      </span>
    );
  };

  /**
   * 🔥 NOUVEAU : Rend une info sur le type de champ
   */
  const renderFieldTypeInfo = (variable: ParsedTaxonomyVariable) => {
    if (variable.format === 'open') {
      return (
        <div className="text-xs text-gray-500 flex items-center">
          <span>✏️ Saisie libre</span>
        </div>
      );
    } else if (formatRequiresShortcode(variable.format)) {
      return (
        <div className="text-xs text-gray-500 flex items-center">
          <span>📋 Sélection depuis liste</span>
        </div>
      );
    }
    return null;
  };

  /**
   * Rend les champs de variables
   */
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

  /**
   * 🔥 NOUVEAU : Rend une carte de variable avec les nouvelles informations
   */
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
            {renderFormatBadge(variable.format)}
          </div>
          
          <div className="flex items-center space-x-2">
            {!variable.isValid && (
              <span className="text-xs text-red-600">
                ⚠ {variable.errorMessage}
              </span>
            )}
            {renderFieldTypeInfo(variable)}
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