// app/components/Tactiques/Placement/TaxonomyFieldRenderer.tsx - VERSION OPTIMISÉE AVEC DÉDUPLICATION

'use client';

import React from 'react';
import { FormInput, SmartSelect } from '../Tactiques/TactiqueFormComponents';
import { 
  getSourceColor, 
  getFormatColor, 
  formatRequiresShortcode, 
  formatAllowsUserInput,
  getFieldDefinition,
  getFormatInfo,
  type TaxonomyFormat 
} from '../../../config/taxonomyFields';

// ==================== TYPES ADAPTÉS ====================

// Variable optimisée avec déduplication
interface OptimizedParsedVariable {
  variable: string;
  formats: TaxonomyFormat[]; // Tous les formats demandés pour cette variable
  source: 'campaign' | 'tactique' | 'manual';
  level: number;
  isValid: boolean;
  errorMessage?: string;
  occurrences: Array<{
    taxonomyType: 'tags' | 'platform' | 'mediaocean';
    format: TaxonomyFormat;
    level: number;
  }>;
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
  manualVariables: OptimizedParsedVariable[];
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
   * Détermine le meilleur format par défaut pour un champ avec multiples formats
   */
  const getBestDefaultFormat = (variable: OptimizedParsedVariable): TaxonomyFormat => {
    const fieldDef = getFieldDefinition(variable.variable);
    
    // Si on a une valeur existante, utiliser son format
    const existingValue = taxonomyValues[variable.variable];
    if (existingValue) {
      return existingValue.format;
    }
    
    // Utiliser le format par défaut de la définition du champ
    if (fieldDef && variable.formats.includes(fieldDef.defaultFormat)) {
      return fieldDef.defaultFormat;
    }
    
    // Prioriser dans l'ordre : display_fr > code > open > autres
    const priorityOrder: TaxonomyFormat[] = ['display_fr', 'code', 'open', 'display_en', 'utm', 'custom_code', 'custom_utm'];
    
    for (const format of priorityOrder) {
      if (variable.formats.includes(format)) {
        return format;
      }
    }
    
    // Fallback sur le premier format disponible
    return variable.formats[0];
  };

  /**
   * Obtient la valeur actuelle pour un champ (hérité ou manuel)
   */
  const getCurrentFieldValue = (variable: OptimizedParsedVariable): { displayValue: string; actualValue: string; currentFormat: TaxonomyFormat } => {
    const taxonomyValue = taxonomyValues[variable.variable];
    
    if (variable.source === 'campaign' || variable.source === 'tactique') {
      // Champs hérités : utiliser la valeur formatée
      const formattedValue = getFormattedValue(variable.variable);
      return {
        displayValue: formattedValue,
        actualValue: formattedValue,
        currentFormat: variable.formats[0] // Format principal pour les hérités
      };
    }
    
    if (!taxonomyValue) {
      const defaultFormat = getBestDefaultFormat(variable);
      return {
        displayValue: '',
        actualValue: '',
        currentFormat: defaultFormat
      };
    }
    
    // Gérer format open
    if (taxonomyValue.format === 'open') {
      return {
        displayValue: taxonomyValue.openValue || '',
        actualValue: taxonomyValue.openValue || '',
        currentFormat: 'open'
      };
    }
    
    if (taxonomyValue.shortcodeId) {
      // Format shortcode : afficher le shortcode sélectionné
      const fieldKey = variable.variable;
      const fieldState = fieldStates[fieldKey];
      
      if (fieldState?.options) {
        const selectedOption = fieldState.options.find(opt => opt.id === taxonomyValue.shortcodeId);
        if (selectedOption) {
          return {
            displayValue: selectedOption.label,
            actualValue: taxonomyValue.shortcodeId,
            currentFormat: taxonomyValue.format
          };
        }
      }
    }
    
    return {
      displayValue: taxonomyValue.value || '',
      actualValue: taxonomyValue.value || '',
      currentFormat: taxonomyValue.format
    };
  };

  /**
   * Détermine quels contrôles afficher selon les formats demandés
   */
  const getControlStrategy = (variable: OptimizedParsedVariable): {
    showFormatSelector: boolean;
    availableInputModes: ('shortcode' | 'open')[];
    defaultMode: 'shortcode' | 'open';
  } => {
    const hasOpenFormat = variable.formats.includes('open');
    const hasShortcodeFormats = variable.formats.some(format => formatRequiresShortcode(format));
    
    // Si on a les deux types, permettre le choix
    if (hasOpenFormat && hasShortcodeFormats) {
      return {
        showFormatSelector: true,
        availableInputModes: ['shortcode', 'open'],
        defaultMode: 'shortcode' // Prioriser shortcode par défaut
      };
    }
    
    // Si on a que open
    if (hasOpenFormat && !hasShortcodeFormats) {
      return {
        showFormatSelector: false,
        availableInputModes: ['open'],
        defaultMode: 'open'
      };
    }
    
    // Si on a que shortcode
    return {
      showFormatSelector: false,
      availableInputModes: ['shortcode'],
      defaultMode: 'shortcode'
    };
  };

  /**
   * Rend un champ selon sa stratégie optimale
   */
  const renderVariableInput = (variable: OptimizedParsedVariable, fieldState: FieldState) => {
    const fieldKey = variable.variable;
    const { displayValue, actualValue, currentFormat } = getCurrentFieldValue(variable);
    const strategy = getControlStrategy(variable);
    
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
    const currentIsOpen = currentFormat === 'open';
    
    return (
      <div className="space-y-3">
        {/* Sélecteur de mode si nécessaire */}
        {strategy.showFormatSelector && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (!currentIsOpen) {
                  onFieldChange(variable.variable, '', 'open');
                }
              }}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                currentIsOpen 
                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
            >
              📝 Saisie libre
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentIsOpen) {
                  const primaryFormat = variable.formats.find(f => formatRequiresShortcode(f)) || variable.formats[0];
                  onFieldChange(variable.variable, '', primaryFormat);
                }
              }}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                !currentIsOpen 
                  ? 'bg-blue-100 text-blue-800 border-blue-300' 
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
            >
              📋 Sélection
            </button>
          </div>
        )}
        
        {/* Champ selon le mode */}
        {currentIsOpen ? (
          // Mode saisie libre
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
        ) : (
          // Mode sélection shortcode
          fieldState.hasCustomList && fieldState.options.length > 0 ? (
            <div className="relative">
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
          ) : (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
              ⚠ Liste non disponible pour cette variable
            </div>
          )
        )}
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
   * Rend les badges des formats avec détail des occurrences
   */
  const renderFormatBadges = (variable: OptimizedParsedVariable) => {
    return (
      <div className="space-y-1">
        {/* Formats demandés */}
        <div className="flex flex-wrap gap-1">
          {variable.formats.map((format, index) => {
            const formatColor = getFormatColor(format);
            const formatInfo = getFormatInfo(format);
            const formatLabel = formatInfo?.label || format;
            
            return (
              <span 
                key={index}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formatColor.bg} ${formatColor.text}`}
                title={formatInfo?.description || `Format: ${format}`}
              >
                {formatLabel}
              </span>
            );
          })}
        </div>
        
        {/* Détail des occurrences */}
        <div className="text-xs text-gray-500">
          Utilisé dans: {variable.occurrences.map(occ => 
            `${occ.taxonomyType}(${occ.format})`
          ).join(', ')}
        </div>
      </div>
    );
  };

  /**
   * Rend les champs de variables avec déduplication
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
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
                Variables à configurer ({manualVars.length})
              </h4>
              <div className="text-xs text-gray-500">
                Une variable = un champ, même si utilisée avec plusieurs formats
              </div>
            </div>
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
   * Rend une carte de variable avec gestion optimisée des multiples formats
   */
  const renderVariableCard = (variable: OptimizedParsedVariable) => {
    const fieldKey = variable.variable;
    const fieldState = fieldStates[fieldKey];
    const sourceColor = getSourceColor(variable.source);
    const fieldDef = getFieldDefinition(variable.variable);
    
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
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-gray-900">
                {fieldDef?.name || variable.variable}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sourceColor.bg} ${sourceColor.text}`}>
                {variable.source}
              </span>
            </div>
            
            {/* Description du champ */}
            {fieldDef?.description && (
              <p className="text-xs text-gray-600 mb-2">
                {fieldDef.description}
              </p>
            )}
            
            {/* Formats et occurrences */}
            {renderFormatBadges(variable)}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {!variable.isValid && (
              <span className="text-xs text-red-600">
                ⚠ Variable invalide
              </span>
            )}
          </div>
        </div>
        
        {/* Champ de saisie */}
        {variable.source === 'manual' && fieldState ? (
          renderVariableInput(variable, fieldState)
        ) : variable.source !== 'manual' ? (
          renderVariableInput(variable, { options: [], hasCustomList: false, isLoading: false })
        ) : null}
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