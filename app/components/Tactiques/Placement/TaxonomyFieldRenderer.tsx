// app/components/Tactiques/Placement/TaxonomyFieldRenderer.tsx - Avec filtrage des champs sans liste

'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { FormInput, SmartSelect } from '../Tactiques/TactiqueFormComponents';
import { getSourceColor, formatRequiresShortcode, getVariableConfig } from '../../../config/taxonomyFields';
import { ClientConfig } from '../../../config/TaxonomyFieldLabels';
import type { ParsedTaxonomyVariable, HighlightState } from '../../../types/tactiques';
import type { TaxonomyFormat } from '../../../config/taxonomyFields';

// ==================== TYPES ====================

interface FieldState {
  options: Array<{ id: string; label: string; code?: string }>; // Garder pour compatibilité
  items?: Array<{ id: string; SH_Display_Name_FR: string; SH_Display_Name_EN?: string; SH_Code?: string }>; // NOUVEAU
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

  // 🔥 NOUVEAU : Filtrage des champs selon les nouvelles règles
  const { visibleVariables, hiddenFields } = useMemo(() => {
    const visible: ParsedTaxonomyVariable[] = [];
    const hidden: string[] = [];

    manualVariables.forEach(variable => {
      const fieldKey = variable.variable;
      const fieldState = fieldStates[fieldKey];
      
      // Pour les champs TC_ (tactique), garder le comportement actuel
      if (fieldKey.startsWith('TC_')) {
        visible.push(variable);
        return;
      }
      
      // Pour les champs PL_ et CR_, appliquer la nouvelle logique
      if (fieldKey.startsWith('PL_') || fieldKey.startsWith('CR_')) {
        // Vérifier si le champ accepte le format 'open'
        const variableConfig = getVariableConfig(fieldKey);
        const allowedFormats = variableConfig?.allowedFormats || [];
        const isOpenFormat = allowedFormats.includes('open');
        const hasCustomList = fieldState?.hasCustomList === true;
        
        // Afficher le champ SI :
        // - Format 'open' OU
        // - A une liste configurée
        if (isOpenFormat || hasCustomList) {
          visible.push(variable);
        } else {
          // Obtenir le label pour l'affichage du message
          let fieldLabel = fieldKey;
          
          // Vérifier d'abord les dimensions personnalisées
          if (fieldKey === 'PL_Custom_Dim_1' && clientConfig?.Custom_Dim_PL_1) {
            fieldLabel = clientConfig.Custom_Dim_PL_1;
          } else if (fieldKey === 'PL_Custom_Dim_2' && clientConfig?.Custom_Dim_PL_2) {
            fieldLabel = clientConfig.Custom_Dim_PL_2;
          } else if (fieldKey === 'PL_Custom_Dim_3' && clientConfig?.Custom_Dim_PL_3) {
            fieldLabel = clientConfig.Custom_Dim_PL_3;
          } else if (fieldKey === 'CR_Custom_Dim_1' && clientConfig?.Custom_Dim_CR_1) {
            fieldLabel = clientConfig.Custom_Dim_CR_1;
          } else if (fieldKey === 'CR_Custom_Dim_2' && clientConfig?.Custom_Dim_CR_2) {
            fieldLabel = clientConfig.Custom_Dim_CR_2;
          } else if (fieldKey === 'CR_Custom_Dim_3' && clientConfig?.Custom_Dim_CR_3) {
            fieldLabel = clientConfig.Custom_Dim_CR_3;
          } else {
            // Utiliser cleanFieldName pour nettoyer le nom technique
            fieldLabel = fieldKey
              .replace(/^(PL_|CR_)/, '') // Enlever les préfixes PL_ ou CR_
              .replace(/_/g, ' ')        // Remplacer les underscores par des espaces
              .replace(/\b\w/g, l => l.toUpperCase()); // Mettre en majuscule la première lettre de chaque mot
          }
          
          hidden.push(fieldLabel);
        }
        return;
      }
      
      // Pour tous les autres champs, garder le comportement actuel
      visible.push(variable);
    });

    return { visibleVariables: visible, hiddenFields: hidden };
  }, [manualVariables, fieldStates, clientConfig, t]);

  // ==================== FONCTIONS UTILITAIRES ====================

  /**
   * Obtient le label à afficher pour un champ donné en utilisant la config client
   * CORRIGÉ : Utilise cleanFieldName en fallback si la traduction échoue
   */
  const getFieldLabelWithConfig = (variable: ParsedTaxonomyVariable): string => {
    const fieldKey = variable.variable;
    
    // Pour les dimensions personnalisées, vérifier d'abord la config client
    if (fieldKey === 'PL_Custom_Dim_1' && clientConfig?.Custom_Dim_PL_1) {
      return clientConfig.Custom_Dim_PL_1;
    }
    if (fieldKey === 'PL_Custom_Dim_2' && clientConfig?.Custom_Dim_PL_2) {
      return clientConfig.Custom_Dim_PL_2;
    }
    if (fieldKey === 'PL_Custom_Dim_3' && clientConfig?.Custom_Dim_PL_3) {
      return clientConfig.Custom_Dim_PL_3;
    }
    if (fieldKey === 'CR_Custom_Dim_1' && clientConfig?.Custom_Dim_CR_1) {
      return clientConfig.Custom_Dim_CR_1;
    }
    if (fieldKey === 'CR_Custom_Dim_2' && clientConfig?.Custom_Dim_CR_2) {
      return clientConfig.Custom_Dim_CR_2;
    }
    if (fieldKey === 'CR_Custom_Dim_3' && clientConfig?.Custom_Dim_CR_3) {
      return clientConfig.Custom_Dim_CR_3;
    }
    
    // Utiliser cleanFieldName pour tous les autres champs
    return cleanFieldName(fieldKey);
  };

  /**
   * Nettoie un nom de champ technique pour le rendre plus lisible
   */
  const cleanFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/^(PL_|CR_)/, '') // Enlever les préfixes PL_ ou CR_
      .replace(/_/g, ' ')        // Remplacer les underscores par des espaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Mettre en majuscule la première lettre de chaque mot
  };

/**
   * Gère le changement de valeur avec validation en temps réel
   */
const handleInputChange = (variable: ParsedTaxonomyVariable, inputValue: string) => {
  // Exclure CR_URL de la validation car les URLs contiennent des caractères spéciaux légitimes
  if (variable.variable === 'CR_URL') {
    // Propager directement la valeur sans validation ni nettoyage
    onFieldChange(variable.variable, inputValue, 'open');
    return;
  }
  
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
    
    if (hasShortcodeList && fieldState.items && fieldState.items.length > 0) {
      matchingOption = fieldState.items.find(opt => opt.id === currentValue);
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
          const selectedOption = fieldState.items?.find(opt => opt.id === selectedId);
          const primaryFormat = allowedFormats.find(f => formatRequiresShortcode(f)) || 'code';
          onFieldChange(variable.variable, selectedOption?.SH_Display_Name_FR || '', primaryFormat, selectedId);
        }}
        items={fieldState.items || []}
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
      {/* 🔥 NOUVEAU : Message pour les champs masqués */}
      {hiddenFields.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 mt-0.5">
              <span className="text-amber-600">ℹ️</span>
            </div>
            <div className="text-sm">
              <p>
              {t('taxonomyFieldRenderer.hiddenFields.prefix')} <strong>{hiddenFields.join("', '")}</strong>' {t('taxonomyFieldRenderer.hiddenFields.message')}.
              </p>
              
            </div>
          </div>
        </div>
      )}

      {visibleVariables.length === 0 ? (
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
            {t('taxonomyFieldRenderer.configuredState.title', { count: visibleVariables.length })}
          </h4>
          {visibleVariables.map((variable) => renderVariableCard(variable))}
        </div>
      )}
    </div>
  );
};

export default TaxonomyFieldRenderer;