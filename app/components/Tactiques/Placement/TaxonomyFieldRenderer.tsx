/**
 * Ce composant a pour rôle d'afficher une liste de champs de formulaire pour des variables de taxonomie.
 * Il est utilisé pour configurer des champs de placement spécifiques.
 * Sa particularité est de pouvoir afficher soit une liste déroulante (SmartSelect) lorsque des options prédéfinies sont disponibles,
 * soit un champ de texte libre (FormInput) si l'utilisateur a besoin de saisir une valeur personnalisée.
 * Ce comportement "hybride" offre plus de flexibilité à l'utilisateur.
 */
'use client';

import React from 'react';
import { FormInput, SmartSelect } from '../Tactiques/TactiqueFormComponents';
import { getSourceColor, formatRequiresShortcode } from '../../../config/taxonomyFields';
import type { ParsedTaxonomyVariable, TaxonomyValues, HighlightState } from '../../../types/tactiques';
import type { TaxonomyFormat } from '../../../config/taxonomyFields';

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

/**
 * Composant principal pour afficher les champs de taxonomie manuels.
 * @param {ParsedTaxonomyVariable[]} manualVariables - Liste des variables à afficher manuellement.
 * @param {Object} fieldStates - L'état de chaque champ (options, chargement, etc.).
 * @param {Object} formData - Les données actuelles du formulaire.
 * @param {HighlightState} highlightState - L'état de mise en évidence pour savoir quel champ est survolé.
 * @param {Function} onFieldChange - Callback appelé lorsqu'une valeur de champ change.
 * @param {Function} onFieldHighlight - Callback appelé lorsqu'un champ est survolé.
 * @returns {React.ReactElement} Le composant React rendu.
 */
const TaxonomyFieldRenderer: React.FC<TaxonomyFieldRendererProps> = ({
  manualVariables,
  fieldStates,
  formData,
  highlightState,
  onFieldChange,
  onFieldHighlight,
}) => {

  /**
   * Détermine et rend le bon type de champ (sélection ou texte libre) pour une variable donnée.
   * C'est le coeur de la logique "hybride" du composant.
   * @param {ParsedTaxonomyVariable} variable - La variable pour laquelle rendre le champ.
   * @returns {React.ReactElement} Le champ de formulaire (SmartSelect ou FormInput).
   */
  const renderVariableInput = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = variable.variable;
    const fieldState = fieldStates[fieldKey];
    const currentValue = formData[fieldKey] || '';

    const hasShortcodeList = variable.formats.some(formatRequiresShortcode) && fieldState?.hasCustomList;

    let isValueInOptions = false;
    let matchingOption = null;

    if (hasShortcodeList && fieldState.options.length > 0) {
      matchingOption = fieldState.options.find(opt => opt.id === currentValue || opt.label === currentValue);
      isValueInOptions = !!matchingOption;
    }

    if (hasShortcodeList && (isValueInOptions || !currentValue)) {
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
              const primaryFormat = variable.formats.find(f => formatRequiresShortcode(f)) || 'code';
              onFieldChange(variable.variable, selectedOption?.label || '', primaryFormat, selectedId);
            }}
            options={[
              { id: '', label: 'Saisie libre...' },
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
        {hasShortcodeList && (
          <button
            type="button"
            onClick={() => {
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

  /**
   * Rend une "carte" contenant le libellé de la variable et son champ de formulaire associé.
   * Gère également l'effet visuel de survol.
   * @param {ParsedTaxonomyVariable} variable - La variable à afficher dans la carte.
   * @returns {React.ReactElement} La carte de la variable.
   */
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