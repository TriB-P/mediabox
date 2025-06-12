'use client';

import React, { memo } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import SearchableSelect from '../SearchableSelect';

// ==================== TYPES ====================

interface HelpIconProps {
  tooltip: string;
  onTooltipChange: (tooltip: string | null) => void;
}

interface SelectionButtonsProps {
  options: { id: string; label: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  placeholder: string;
}

interface SmartSelectProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  options: { id: string; label: string }[];
  placeholder: string;
  label: React.ReactNode;
}

interface FormInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'date' | 'number';
  placeholder?: string;
  required?: boolean;
  label: React.ReactNode;
  className?: string;
}

interface FormTextareaProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
  label: React.ReactNode;
  className?: string;
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

// ==================== COMPOSANTS ====================

/**
 * Icône d'aide avec tooltip optimisée
 */
export const HelpIcon = memo<HelpIconProps>(({ tooltip, onTooltipChange }) => (
  <QuestionMarkCircleIcon 
    className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-help transition-colors flex-shrink-0" 
    onMouseEnter={() => onTooltipChange(tooltip)}
    onMouseLeave={() => onTooltipChange(null)}
  />
));

HelpIcon.displayName = 'HelpIcon';

/**
 * Boutons de sélection pour les petites listes (≤5 options)
 */
export const SelectionButtons = memo<SelectionButtonsProps>(({ 
  options, 
  value, 
  onChange, 
  name, 
  placeholder 
}) => (
  <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => {
            const event = {
              target: { name, value: value === option.id ? '' : option.id }
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(event);
          }}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            value === option.id
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
    {value && (
      <button
        type="button"
        onClick={() => {
          const event = {
            target: { name, value: '' }
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(event);
        }}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Effacer la sélection
      </button>
    )}
  </div>
));

SelectionButtons.displayName = 'SelectionButtons';

/**
 * Sélecteur intelligent qui choisit entre boutons ou dropdown selon le nombre d'options
 */
export const SmartSelect = memo<SmartSelectProps>(({ 
  id, 
  name, 
  value, 
  onChange, 
  options, 
  placeholder, 
  label 
}) => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        {label}
      </div>
      
      {/* NOUVELLE LOGIQUE : Vérifie si des options sont disponibles */}
      {options && options.length > 0 ? (
        // Comportement existant si des options sont fournies
        options.length <= 5 ? (
          <SelectionButtons
            options={options}
            value={value}
            onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
            name={name}
            placeholder={placeholder}
          />
        ) : (
          <SearchableSelect
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            label=""
          />
        )
      ) : (
        // NOUVEAU : Affiche un champ de saisie libre si aucune option n'est disponible
        <FormInput
          id={id}
          name={name}
          value={value}
          onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
          type="text"
          placeholder="Saisir une valeur..."
          label="" // Le label est déjà affiché au-dessus
        />
      )}
    </div>
  );
});

SmartSelect.displayName = 'SmartSelect';

/**
 * Input de formulaire standardisé avec label et icône d'aide
 */
export const FormInput = memo<FormInputProps>(({ 
  id, 
  name, 
  value, 
  onChange, 
  type = 'text',
  placeholder, 
  required = false,
  label,
  className = ''
}) => (
  <div className={className}>
    <div className="flex items-center gap-3 mb-2">
      {label}
    </div>
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      placeholder={placeholder}
    />
  </div>
));

FormInput.displayName = 'FormInput';

/**
 * Textarea de formulaire standardisé avec label et icône d'aide
 */
export const FormTextarea = memo<FormTextareaProps>(({ 
  id, 
  name, 
  value, 
  onChange, 
  rows = 3,
  placeholder, 
  label,
  className = ''
}) => (
  <div className={className}>
    <div className="flex items-center gap-3 mb-2">
      {label}
    </div>
    <textarea
      id={id}
      name={name}
      rows={rows}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      placeholder={placeholder}
    />
  </div>
));

FormTextarea.displayName = 'FormTextarea';

/**
 * Section de formulaire avec titre et description
 */
export const FormSection = memo<FormSectionProps>(({ 
  title, 
  description, 
  children, 
  className = '' 
}) => (
  <div className={`border-t border-gray-200 pt-8 ${className}`}>
    <div className="border-b border-gray-200 pb-4 mb-6">
      <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
      {description && (
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      )}
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </div>
));

FormSection.displayName = 'FormSection';

/**
 * Helper pour créer un label avec icône d'aide
 */
export const createLabelWithHelp = (
  text: string, 
  tooltip: string, 
  onTooltipChange: (tooltip: string | null) => void
) => (
  <>
    <HelpIcon tooltip={tooltip} onTooltipChange={onTooltipChange} />
    <label className="block text-sm font-medium text-gray-700">
      {text}
    </label>
  </>
);

/**
 * Bandeau de tooltip optimisé
 */
export const TooltipBanner = memo<{ tooltip: string | null }>(({ tooltip }) => {
  if (!tooltip) return null;
  
  return (
<div className="fixed bottom-20 right-0 z-50 w-[50vw]">
<div className="bg-gray-800 bg-opacity-80 text-white px-4 py-3 shadow-lg">
    <p className="text-sm text-center">{tooltip}</p>
  </div>
</div>
  );
});

TooltipBanner.displayName = 'TooltipBanner';