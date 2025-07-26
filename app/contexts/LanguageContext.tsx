// app/contexts/LanguageContext.tsx
/**
 * Contexte de gestion de la langue de l'application.
 * Permet de basculer entre français (FR) et anglais (EN).
 * Sauvegarde la préférence dans localStorage pour la persistance.
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types pour le système de traduction
export type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

import { translations } from '../locales/translations';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * Fournisseur du contexte de langue.
 * Gère l'état de la langue courante et fournit la fonction de traduction.
 */
export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('fr');

  // Charger la langue sauvegardée au démarrage
  useEffect(() => {
    const savedLanguage = typeof window !== 'undefined' 
      ? localStorage.getItem('language') as Language
      : null;
    
    if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  /**
   * Change la langue et la sauvegarde
   */
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  /**
   * Récupère et interpole une chaîne de traduction pour une langue donnée.
   */
  const getTranslation = (
    lang: Language,
    key: string,
    options?: { [key: string]: string | number }
  ): string | null => {
    const keys = key.split('.');
    let value: any = translations[lang];

    for (const k of keys) {
      if (value === undefined || value === null) {
        return null;
      }
      value = value[k];
    }

    if (typeof value === 'string') {
      let translated = value;
      if (options) {
        Object.keys(options).forEach(optKey => {
          translated = translated.replace(new RegExp(`{{${optKey}}}`, 'g'), String(options[optKey]));
        });
      }
      return translated;
    }

    return null;
  };

  /**
   * Fonction de traduction avec fallback et interpolation
   * @param key - Clé de traduction (ex: "admin.title")
   * @param options - Valeurs à interpoler (ex: { name: "John" })
   * @returns Le texte traduit ou la clé si traduction manquante
   */
  const t = (key: string, options?: { [key: string]: string | number }): string => {
    const translated = getTranslation(language, key, options) ?? getTranslation('fr', key, options);
    if (translated !== null) return translated;

    // Si aucune traduction trouvée, retourner la clé
    console.warn(`Traduction manquante pour la clé: ${key}`);
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook personnalisé pour utiliser le contexte de langue
 * @returns Les fonctions et valeurs du contexte de langue
 */
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation doit être utilisé dans un LanguageProvider');
  }
  return context;
}