// app/components/Others/LanguageToggle.tsx
/**
 * Composant pour basculer entre les langues français et anglais.
 * Version simple avec indicateur de sélection.
 * Utilise le contexte de langue pour gérer l'état et la persistance.
 */

'use client';

import { useTranslation, Language } from '../../contexts/LanguageContext';

interface LanguageToggleProps {
  className?: string;
}

/**
 * Composant de toggle de langue simple avec indicateur visuel.
 * @param {LanguageToggleProps} props - Les propriétés du composant
 * @param {string} props.className - Classes CSS additionnelles
 * @returns {JSX.Element} Le composant toggle de langue
 */
export default function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { language, setLanguage } = useTranslation();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return (
    <div className={`px-4 flex items-center text-sm font-medium text-gray-600 ${className}`}>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-4 py-1 rounded-l transition-colors duration-200 ${
          language === 'en'
            ? 'bg-indigo-100 text-indigo-700 font-semibold'
            : 'hover:bg-gray-100 hover:text-gray-800'
        }`}
      >
        EN
      </button>
      <span className="text-gray-400 mx-1">|</span>
      <button
        onClick={() => handleLanguageChange('fr')}
        className={`px-4 py-1 rounded-r transition-colors duration-200 ${
          language === 'fr'
            ? 'bg-indigo-100 text-indigo-700 font-semibold'
            : 'hover:bg-gray-100 hover:text-gray-800'
        }`}
      >
        FR
      </button>
    </div>
  );
}