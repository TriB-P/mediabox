// components/Tactiques/Tactiques/TactiqueFormComponents.tsx

/**
 * Ce fichier regroupe un ensemble de composants React réutilisables pour construire des formulaires
 * de manière cohérente dans l'application. Il fournit des éléments de base comme des champs de saisie,
 * des zones de texte, des sélecteurs intelligents, ainsi que des composants de structure pour organiser
 * le formulaire. L'objectif est de standardiser l'apparence et le comportement des formulaires.
 */
'use client';

import React, { memo } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import SearchableSelect from '../SearchableSelect';

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

/**
 * Affiche une icône d'aide qui révèle une infobulle au survol.
 * Ce composant est mémoïsé pour optimiser les performances.
 * @param {string} tooltip - Le texte à afficher dans l'infobulle.
 * @param {(tooltip: string | null) => void} onTooltipChange - Fonction de rappel pour gérer l'affichage de l'infobulle.
 * @returns {React.ReactElement} Le composant de l'icône d'aide.
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
 * Affiche une série de boutons pour faire une sélection. Idéal pour les listes courtes (≤ 5 options).
 * Ce composant est mémoïsé.
 * @param {{ id: string; label: string }[]} options - Les options à afficher sous forme de boutons.
 * @param {string} value - L'ID de l'option actuellement sélectionnée.
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} onChange - La fonction à appeler lors d'un changement de sélection.
 * @param {string} name - Le nom du champ de formulaire, utilisé dans l'événement de changement.
 * @param {string} placeholder - Texte indicatif (non utilisé directement, mais conservé pour l'interface).
 * @returns {React.ReactElement} Le composant des boutons de sélection.
 */
export const SelectionButtons = memo<SelectionButtonsProps>(({
  options,
  value,
  onChange,
  name,
  placeholder,
}) => (
  <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => {
            const event = {
              target: { name, value: value === option.id ? '' : option.id },
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
            target: { name, value: '' },
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
 * Un composant de sélection "intelligent" qui s'adapte en fonction du nombre d'options.
 * - Affiche des `SelectionButtons` si le nombre d'options est inférieur ou égal à 5.
 * - Affiche un `SearchableSelect` (liste déroulante avec recherche) pour plus de 5 options.
 * - Affiche un `FormInput` de texte libre si aucune option n'est fournie.
 * Ce composant est mémoïsé.
 * @param {string} id - L'ID de l'élément de formulaire.
 * @param {string} name - Le nom de l'élément de formulaire.
 * @param {string} value - La valeur actuelle de la sélection.
 * @param {(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void} onChange - La fonction de rappel pour les changements de valeur.
 * @param {{ id: string; label: string }[]} options - La liste des options disponibles.
 * @param {string} placeholder - Le texte indicatif pour les champs.
 * @param {React.ReactNode} label - Le label à afficher au-dessus du composant.
 * @returns {React.ReactElement} Le composant de sélection adapté.
 */
export const SmartSelect = memo<SmartSelectProps>(({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  label,
}) => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">{label}</div>

      {options && options.length > 0 ? (
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
        <FormInput
          id={id}
          name={name}
          value={value}
          onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
          type="text"
          placeholder="Saisir une valeur..."
          label=""
        />
      )}
    </div>
  );
});

SmartSelect.displayName = 'SmartSelect';

/**
 * Un champ de saisie standard pour les formulaires.
 * Ce composant est mémoïsé.
 * @param {string} id - L'ID de l'input.
 * @param {string} name - Le nom de l'input.
 * @param {string} value - La valeur actuelle de l'input.
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} onChange - La fonction de rappel pour les changements.
 * @param {'text' | 'date' | 'number'} [type='text'] - Le type de l'input.
 * @param {string} [placeholder] - Le texte indicatif.
 * @param {boolean} [required=false] - Indique si le champ est obligatoire.
 * @param {React.ReactNode} label - Le label à afficher.
 * @param {string} [className=''] - Classes CSS additionnelles pour le conteneur.
 * @returns {React.ReactElement} Le composant de champ de saisie.
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
  className = '',
}) => (
  <div className={className}>
    <div className="flex items-center gap-3 mb-2">{label}</div>
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      placeholder={placeholder}
    />
  </div>
));

FormInput.displayName = 'FormInput';

/**
 * Une zone de texte standard pour les formulaires.
 * Ce composant est mémoïsé.
 * @param {string} id - L'ID du textarea.
 * @param {string} name - Le nom du textarea.
 * @param {string} value - La valeur actuelle.
 * @param {(e: React.ChangeEvent<HTMLTextAreaElement>) => void} onChange - La fonction de rappel pour les changements.
 * @param {number} [rows=3] - Le nombre de lignes à afficher.
 * @param {string} [placeholder] - Le texte indicatif.
 * @param {React.ReactNode} label - Le label à afficher.
 * @param {string} [className=''] - Classes CSS additionnelles pour le conteneur.
 * @returns {React.ReactElement} Le composant de la zone de texte.
 */
export const FormTextarea = memo<FormTextareaProps>(({
  id,
  name,
  value,
  onChange,
  rows = 3,
  placeholder,
  label,
  className = '',
}) => (
  <div className={className}>
    <div className="flex items-center gap-3 mb-2">{label}</div>
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
 * Crée une section visuelle dans un formulaire avec un titre et une description.
 * Ce composant est mémoïsé.
 * @param {string} title - Le titre de la section.
 * @param {string} [description] - Une description facultative pour la section.
 * @param {React.ReactNode} children - Les champs de formulaire ou autres éléments à inclure dans la section.
 * @param {string} [className=''] - Classes CSS additionnelles pour le conteneur.
 * @returns {React.ReactElement} Le composant de section de formulaire.
 */
export const FormSection = memo<FormSectionProps>(({
  title,
  description,
  children,
  className = '',
}) => (
  <div className={`${className}`}>
    <div className="border-b border-gray-200 pb-4 mb-6">
      <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
      {description && (
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      )}
    </div>
    <div className="space-y-6">{children}</div>
  </div>
));

FormSection.displayName = 'FormSection';

/**
 * Une fonction utilitaire pour créer un label de formulaire accompagné d'une icône d'aide.
 * @param {string} text - Le texte du label.
 * @param {string} tooltip - Le message d'aide à afficher dans l'infobulle de l'icône.
 * @param {(tooltip: string | null) => void} onTooltipChange - La fonction de rappel pour gérer l'état d'affichage de l'infobulle.
 * @returns {React.ReactElement} Un fragment React contenant l'icône et le label.
 */
export const createLabelWithHelp = (
  text: string,
  tooltip: string,
  onTooltipChange: (tooltip: string | null) => void
) => (
  <>
    <HelpIcon tooltip={tooltip} onTooltipChange={onTooltipChange} />
    <label className="block text-sm font-medium text-gray-700">{text}</label>
  </>
);

/**
 * Affiche une bannière contenant le texte de l'infobulle active.
 * La bannière apparaît en bas à droite de l'écran.
 * Ce composant est mémoïsé.
 * @param {{ tooltip: string | null }} props - Les propriétés du composant.
 * @param {string | null} props.tooltip - Le texte de l'infobulle à afficher. Si null, le composant ne rend rien.
 * @returns {React.ReactElement | null} Le composant de la bannière ou null.
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