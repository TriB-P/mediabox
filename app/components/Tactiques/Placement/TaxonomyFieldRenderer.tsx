// app/components/Tactiques/Placement/TaxonomyFieldRenderer.tsx - Avec validation en temps réel

'use client';

import React, { useState } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { FormInput, SmartSelect } from '../Tactiques/TactiqueFormComponents';
import { getSourceColor, formatRequiresShortcode, getVariableConfig } from '../../../config/taxonomyFields';
import { getFieldLabel, ClientConfig } from '../../../config/TaxonomyFieldLabels';
import type { ParsedTaxonomyVariable, HighlightState } from '../../../types/tactiques';
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
  clientConfig?: ClientConfig;
  onFieldChange: (variableName: string, value: string, format: TaxonomyFormat, shortcodeId?: string) => void;
  onFieldHighlight: (variableName?: string) => void;
}

// ==================== UTILITAIRES DE VALIDATION ====================

/**
 * Convertit les caractères accentués vers leurs équivalents non accentués
 */
const removeAccents = (str: string): string => {
  const accentsMap: { [key: string]: string } = {
    'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ā': 'a', 'ã': 'a',
    'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e', 'ē': 'e',
    'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i', 'ī': 'i',
    'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'ō': 'o', 'õ': 'o',
    'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u', 'ū': 'u',
    'ý': 'y', 'ỳ': 'y', 'ÿ': 'y', 'ŷ': 'y',
    'ç': 'c', 'ñ': 'n',
    'Á': 'A', 'À': 'A', 'Ä': 'A', 'Â': 'A', 'Ā': 'A', 'Ã': 'A',
    'É': 'E', 'È': 'E', 'Ë': 'E', 'Ê': 'E', 'Ē': 'E',
    'Í': 'I', 'Ì': 'I', 'Ï': 'I', 'Î': 'I', 'Ī': 'I',
    'Ó': 'O', 'Ò': 'O', 'Ö': 'O', 'Ô': 'O', 'Ō': 'O', 'Õ': 'O',
    'Ú': 'U', 'Ù': 'U', 'Ü': 'U', 'Û': 'U', 'Ū': 'U',
    'Ý': 'Y', 'Ỳ': 'Y', 'Ÿ': 'Y', 'Ŷ': 'Y',
    'Ç': 'C', 'Ñ': 'N'
  };

  return str.replace(/[àáäâāãèéëêēìíïîīòóöôōõùúüûūýỳÿŷçñÀÁÄÂĀÃÈÉËÊĒÌÍÏÎĪÒÓÖÔŌÕÙÚÜÛŪÝỲŸŶÇÑ]/g, 
    (match) => accentsMap[match] || match);
};

/**
 * Nettoie et valide une chaîne de caractères selon les règles définies
 * Autorise uniquement : lettres, chiffres, tirets
 */
const sanitizeInput = (input: string): { cleanValue: string; hasInvalidChars: boolean } => {
  // Convertir les accents
  const withoutAccents = removeAccents(input);
  
  // Vérifier s'il y a des caractères invalides avant nettoyage
  const invalidCharsRegex = /[^a-zA-Z0-9\-]/g;
  const hasInvalidChars = invalidCharsRegex.test(withoutAccents);
  
  // Nettoyer en gardant seulement les caractères autorisés
  const cleanValue = withoutAccents.replace(invalidCharsRegex, '');
  
  return { cleanValue, hasInvalidChars };
};

// ==================== COMPOSANT PRINCIPAL ====================

const TaxonomyFieldRenderer: React.FC<TaxonomyFieldRendererProps> = ({
  manualVariables,
  fieldStates,
  formData,
  highlightState,
  clientConfig = {},
  onFieldChange,
  onFieldHighlight,
}) => {

  const { t } = useTranslation();
  
  // État pour tracker les erreurs de validation par champ
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: boolean }>({});

  // ==================== FONCTIONS UTILITAIRES ====================

  /**
   * Obtient le label à afficher pour un champ donné en utilisant la config client
   */
  const getFieldLabelWithConfig = (variable: ParsedTaxonomyVariable): string => {
    const fieldKey = variable.variable;
    return getFieldLabel(fieldKey, clientConfig);
  };

  /**
   * Gère le changement de valeur avec validation en temps réel
   */
  const handleInputChange = (variable: ParsedTaxonomyVariable, inputValue: string) => {
    const { cleanValue, hasInvalidChars } = sanitizeInput(inputValue);
    
    // Mettre à jour l'état d'erreur
    setValidationErrors(prev => ({
      ...prev,
      [variable.variable]: hasInvalidChars
    }));
    
    // Toujours propager la valeur nettoyée
    onFieldChange(variable.variable, cleanValue, 'open');
    
    // Effacer l'erreur après un délai si la valeur est maintenant propre
    if (!hasInvalidChars && validationErrors[variable.variable]) {
      setTimeout(() => {
        setValidationErrors(prev => ({
          ...prev,
          [variable.variable]: false
        }));
      }, 1000);
    }
  };

  // ==================== FONCTIONS DE RENDU ====================
  
  const renderVariableField = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = variable.variable;
    const fieldState = fieldStates[fieldKey];
    const currentValue = formData[fieldKey] || '';
    const hasValidationError = validationErrors[fieldKey];
    
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
            onChange={() => {}}
            type="text"
            placeholder={t('common.loading')}
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
          placeholder={t('taxonomyFieldRenderer.select.placeholder')}
          label=""
        />
      );
    }
    
    // Mode texte libre avec validation
    return (
      <div className="space-y-2">
        <div className="relative">
          <FormInput
            id={fieldKey}
            name={fieldKey}
            value={currentValue}
            onChange={(e) => handleInputChange(variable, e.target.value)}
            type="text"
            placeholder={t('taxonomyFieldRenderer.input.placeholder')}
            label=""
            className={hasValidationError ? 'border-red-500 bg-red-50' : ''}
          />
          {hasValidationError && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
        
        {hasValidationError && (
          <div className="text-xs text-red-600 flex items-center space-x-1">
            <span>⚠️</span>
            <span>{t('taxonomyFieldRenderer.input.authorizedChar')}</span>
          </div>
        )}
        
        {/* Bouton pour passer en mode liste si disponible */}
        {hasShortcodeList && (
          <button
            type="button"
            onClick={() => {
              // Vider la valeur pour forcer le passage en mode SmartSelect
              onFieldChange(variable.variable, '', 'open');
              // Effacer l'erreur de validation
              setValidationErrors(prev => ({
                ...prev,
                [variable.variable]: false
              }));
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            {t('taxonomyFieldRenderer.button.chooseFromList', { count: fieldState.options.length })}
          </button>
        )}
      </div>
    );
  };

  const renderVariableCard = (variable: ParsedTaxonomyVariable) => {
    const fieldKey = variable.variable;
    const sourceColor = getSourceColor(variable.source);
    const fieldLabel = getFieldLabelWithConfig(variable);
    const hasValidationError = validationErrors[fieldKey];
    
    return (
      <div
        key={fieldKey}
        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
          hasValidationError
            ? 'border-red-300 bg-red-25'
            : highlightState.activeVariable === variable.variable
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
            {t('taxonomyFieldRenderer.emptyState.title')}
          </h4>
          <p className="text-sm">
            {t('taxonomyFieldRenderer.emptyState.description')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
            {t('taxonomyFieldRenderer.configuredState.title', { count: manualVariables.length })}
          </h4>
          {manualVariables.map((variable) => renderVariableCard(variable))}
        </div>
      )}
    </div>
  );
};

export default TaxonomyFieldRenderer;