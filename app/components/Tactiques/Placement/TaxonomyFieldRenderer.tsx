// app/components/Tactiques/Placement/TaxonomyFieldRenderer.tsx - VERSION CORRIGÉE MULTIPLES FORMATS

'use client';

import React from 'react';
import { FormInput, SmartSelect } from '../Tactiques/TactiqueFormComponents';
import { getSourceColor, getFormatColor, formatRequiresShortcode, formatAllowsUserInput } from '../../../config/taxonomyFields';
import type { TaxonomyFormat } from '../../../config/taxonomyFields';

// ==================== TYPES ADAPTÉS ====================

// 🔥 NOUVEAU : Variable avec multiples formats
interface ExtendedParsedTaxonomyVariable {
  variable: string;
  formats: TaxonomyFormat[]; // 🔥 CHANGEMENT : Array de formats
  source: 'campaign' | 'tactique' | 'manual';
  level: number;
  isValid: boolean;
  errorMessage?: string;
}

interface TaxonomyValues {
  [variableName: string]: {
    value: string;
    source: 'campaign' | 'tactique' | 'manual';
    format: TaxonomyFormat;
    shortcodeId?: string;
    openValue?: string;
  };
}

interface HighlightState {
  activeField?: string;
  activeVariable?: string;
  mode: 'field' | 'preview' | 'none';
}

interface FieldState {
  options: Array<{ id: string; label: string; code?: string }>;
  hasCustomList: boolean;
  isLoading: boolean;
  error?: string;
}

interface TaxonomyFieldRendererProps {
  manualVariables: ExtendedParsedTaxonomyVariable[]; // 🔥 CHANGEMENT : Type mis à jour
  fieldStates: { [key: string]: FieldState };
  taxonomyValues: TaxonomyValues;
  highlightState: HighlightState;
  campaignData?: any;
  tactiqueData?: any;
  onFieldChange: (variableName: string, value: string, format: TaxonomyFormat, shortcodeId?: string) => void;
  onFieldHighlight: (variableName?: string) => void;
  getFormattedValue: (variableName: string) => string;
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
  
  /**
   * 🔥 FONCTION ADAPTÉE : Obtient la valeur actuelle pour un champ
   */
  const getCurrentFieldValue = (variable: ExtendedParsedTaxonomyVariable): { displayValue: string; actualValue: string } => {
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
    
    // 🔥 NOUVEAU : Gérer format open
    if (variable.formats.includes('open')) {
      return {
        displayValue: taxonomyValue.openValue || '',
        actualValue: taxonomyValue.openValue || ''
      };
    }
    
    if (taxonomyValue.shortcodeId) {
      // Format shortcode : afficher le shortcode sélectionné
      const fieldKey = variable.variable; // 🔥 CORRECTION : Plus de format dans la clé
      const fieldState = fieldStates[fieldKey];
      
      if (fieldState?.options) {
        const selectedOption = fieldState.options.find(opt => opt.id === taxonomyValue.shortcodeId);
        if (selectedOption) {
          return {
            displayValue: selectedOption.label,
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
   * 🔥 FONCTION ADAPTÉE : Rend un champ selon ses formats et sa source
   */
  const renderVariableInput = (variable: ExtendedParsedTaxonomyVariable, fieldState: FieldState) => {
    const fieldKey = variable.variable; // 🔥 CORRECTION : Plus de format dans la clé
    const { displayValue, actualValue } = getCurrentFieldValue(variable);
    
    // CHAMPS HÉRITÉS (lecture seule)
    if (variable.source === 'campaign' || variable.source === 'tactique') {
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
    
    // CHAMPS MANUELS
    
    // 🔥 NOUVEAU : Déterminer le mode d'input selon les formats demandés
    const hasOpenFormat = variable.formats.includes('open');
    const hasShortcodeFormats = variable.formats.some(format => formatRequiresShortcode(format));
    
    // Si on a le format 'open', privilégier la saisie libre
    if (hasOpenFormat && !hasShortcodeFormats) {
      return (
        <div className="relative">
          <FormInput
            id={fieldKey}
            name={fieldKey}
            value={displayValue}
            onChange={(e) => onFieldChange(variable.variable, e.target.value, 'open')}
            type="text"
            placeholder="Saisir la valeur..."
            label=""
          />
          {renderFieldStatus(fieldState)}
        </div>
      );
    }
    
    // Si on a des formats shortcode et une liste disponible
    if (hasShortcodeFormats && fieldState.hasCustomList && fieldState.options.length > 0) {
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
              
              // 🔥 NOUVEAU : Utiliser le premier format shortcode trouvé
              const primaryFormat = variable.formats.find(f => formatRequiresShortcode(f)) || variable.formats[0];
              
              onFieldChange(variable.variable, displayValue, primaryFormat, selectedId);
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
    }
    
    // Si on a les deux types de formats, permettre le choix
    if (hasOpenFormat && hasShortcodeFormats) {
      const currentIsOpen = taxonomyValues[variable.variable]?.format === 'open';
      
      return (
        <div className="space-y-2">
          {/* Toggle pour choisir le mode */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (!currentIsOpen) {
                  onFieldChange(variable.variable, '', 'open');
                }
              }}
              className={`px-2 py-1 text-xs rounded ${
                currentIsOpen 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Saisie libre
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentIsOpen) {
                  const primaryFormat = variable.formats.find(f => formatRequiresShortcode(f)) || variable.formats[0];
                  onFieldChange(variable.variable, '', primaryFormat);
                }
              }}
              className={`px-2 py-1 text-xs rounded ${
                !currentIsOpen 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sélection
            </button>
          </div>
          
          {/* Champ selon le mode */}
          {currentIsOpen ? (
            <FormInput
              id={fieldKey}
              name={fieldKey}
              value={displayValue}
              onChange={(e) => onFieldChange(variable.variable, e.target.value, 'open')}
              type="text"
              placeholder="Saisir la valeur..."
              label=""
            />
          ) : (
            fieldState.hasCustomList && fieldState.options.length > 0 ? (
              <SmartSelect
                id={fieldKey}
                name={fieldKey}
                value={actualValue}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedOption = fieldState.options.find(opt => opt.id === selectedId);
                  const displayValue = selectedOption?.label || '';
                  const primaryFormat = variable.formats.find(f => formatRequiresShortcode(f)) || variable.formats[0];
                  
                  onFieldChange(variable.variable, displayValue, primaryFormat, selectedId);
                }}
                options={fieldState.options}
                placeholder="Sélectionner une valeur..."
                label=""
              />
            ) : (
              <div className="text-xs text-amber-600">
                ⚠ Liste non disponible pour cette variable
              </div>
            )
          )}
          
          {renderFieldStatus(fieldState)}
        </div>
      );
    }
    
    // Fallback : champ de saisie libre
    return (
      <div className="relative">
        <FormInput
          id={fieldKey}
          name={fieldKey}
          value={displayValue}
          onChange={(e) => onFieldChange(variable.variable, e.target.value, variable.formats[0])}
          type="text"
          placeholder="Saisir la valeur..."
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
   * 🔥 FONCTION ADAPTÉE : Rend les badges de multiples formats
   */
  const renderFormatBadges = (formats: TaxonomyFormat[]) => {
    return (
      <div className="flex flex-wrap gap-1">
        {formats.map((format, index) => {
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
            <span 
              key={index}
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formatColor.bg} ${formatColor.text}`}
            >
              {formatLabel}
            </span>
          );
        })}
      </div>
    );
  };

  /**
   * 🔥 FONCTION ADAPTÉE : Rend les champs de variables
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
   * 🔥 FONCTION ADAPTÉE : Rend une carte de variable avec multiples formats
   */
  const renderVariableCard = (variable: ExtendedParsedTaxonomyVariable) => {
    const fieldKey = variable.variable; // 🔥 CORRECTION : Plus de format dans la clé
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
            {/* 🔥 NOUVEAU : Afficher tous les formats demandés */}
            {renderFormatBadges(variable.formats)}
          </div>
          
          <div className="flex items-center space-x-2">
            {!variable.isValid && (
              <span className="text-xs text-red-600">
                ⚠ Variable invalide
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