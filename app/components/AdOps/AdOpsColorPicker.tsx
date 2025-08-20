// app/components/AdOps/AdOpsColorPicker.tsx
/**
 * Composant AdOpsColorPicker unifié et optimisé
 * CORRIGÉ : Types unifiés, logique simplifiée, performance améliorée
 */
'use client';

import React, { useMemo, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

// Import des types unifiés
import {
  AdOpsColorPickerProps,
  AdOpsColor
} from '../../types/adops';

// ================================
// COMPOSANTS UTILITAIRES
// ================================

/**
 * Bouton de couleur optimisé
 */
const ColorButton = React.memo(({ 
  color, 
  onSelect, 
  isActive = false 
}: {
  color: AdOpsColor;
  onSelect: (value: string) => void;
  isActive?: boolean;
}) => {
  const { t } = useTranslation();
  
  const handleClick = useCallback(() => {
    onSelect(color.value);
  }, [onSelect, color.value]);

  const buttonStyles = useMemo(() => ({
    className: `
      relative group px-4 py-2 rounded-lg border-2 transition-all duration-200 
      ${color.class} hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
      ${isActive ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-300'}
    `.trim().replace(/\s+/g, ' '),
    title: t('colorPicker.applyColor', { colorName: color.name.toLowerCase() })
  }), [color.class, color.name, isActive, t]);

  return (
    <button
      onClick={handleClick}
      className={buttonStyles.className}
      title={buttonStyles.title}
    >
      <div className="flex items-center gap-2">
        <div 
          className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
          style={{ backgroundColor: color.value }}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-gray-700">
          {color.name}
        </span>
      </div>
      
      {/* Effet hover élégant */}
      <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </button>
  );
});

ColorButton.displayName = 'ColorButton';

/**
 * Bouton de suppression de couleur
 */
const RemoveColorButton = React.memo(({ 
  onSelect, 
  isActive = false 
}: {
  onSelect: (value: string) => void;
  isActive?: boolean;
}) => {
  const { t } = useTranslation();
  
  const handleClick = useCallback(() => {
    onSelect('');
  }, [onSelect]);

  const buttonStyles = useMemo(() => ({
    className: `
      px-4 py-2 bg-white border-2 rounded-lg transition-all duration-200 
      hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
      ${isActive ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-300'}
    `.trim().replace(/\s+/g, ' '),
    title: t('colorPicker.removeColor')
  }), [isActive, t]);

  return (
    <button
      onClick={handleClick}
      className={buttonStyles.className}
      title={buttonStyles.title}
    >
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full border border-gray-400 bg-white relative flex-shrink-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <XMarkIcon className="w-3 h-3 text-red-500" />
          </div>
        </div>
        <span className="text-sm font-medium text-gray-700">
          {t('colorPicker.none')}
        </span>
      </div>
    </button>
  );
});

RemoveColorButton.displayName = 'RemoveColorButton';

/**
 * En-tête du sélecteur avec titre et bouton fermer
 */
const ColorPickerHeader = React.memo(({ 
  onClose 
}: {
  onClose: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-medium text-gray-900">
        {t('colorPicker.title')}
      </h4>
      <button
        onClick={onClose}
        className="p-1 hover:bg-gray-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title={t('common.close')}
        aria-label={t('common.close')}
      >
        <XMarkIcon className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
});

ColorPickerHeader.displayName = 'ColorPickerHeader';

// ================================
// COMPOSANT PRINCIPAL
// ================================

/**
 * Sélecteur de couleurs pour AdOps
 */
export default function AdOpsColorPicker({
  colors,
  onColorSelect,
  onClose
}: AdOpsColorPickerProps) {
  const { t } = useTranslation();

  // Mémoisation des couleurs triées
  const sortedColors = useMemo(() => {
    return [...colors].sort((a, b) => a.name.localeCompare(b.name));
  }, [colors]);

  // Gestionnaire de sélection mémorisé
  const handleColorSelect = useCallback((colorValue: string) => {
    onColorSelect(colorValue);
  }, [onColorSelect]);

  // Gestionnaire de fermeture mémorisé  
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Gestion de l'accessibilité clavier
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  return (
    <div 
      className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label={t('colorPicker.title')}
    >
      
      {/* En-tête */}
      <ColorPickerHeader onClose={handleClose} />
      
      {/* Conteneur des boutons de couleur */}
      <div className="flex items-center gap-3 flex-wrap">
        
        {/* Couleurs prédéfinies */}
        {sortedColors.map((color) => (
          <ColorButton
            key={color.value}
            color={color}
            onSelect={handleColorSelect}
          />
        ))}
        
        {/* Bouton de suppression */}
        <RemoveColorButton onSelect={handleColorSelect} />
      </div>
      
      {/* Instructions d'utilisation */}
      <div className="mt-3 text-xs text-gray-600">
        <p>{t('colorPicker.applyInfo')}</p>
      </div>

      {/* Informations d'accessibilité */}
      <div className="sr-only">
        <p>{t('colorPicker.accessibility.instructions')}</p>
      </div>
    </div>
  );
}