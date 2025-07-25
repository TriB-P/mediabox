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
  t: (key: string) => string;
}

// Fichier de traductions intégré
const translations = {
  fr: {
    admin: {
      title: "Administration",
      subtitle: "Gérer les utilisateurs et les permissions",
      tabs: {
        users: "Utilisateurs",
        permissions: "Permissions"
      }
    },
    common: {
      loading: "Chargement...",
      save: "Sauvegarder",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      close: "Fermer"
    }
  },
  en: {
    admin: {
      title: "Administration",
      subtitle: "Manage users and permissions",
      tabs: {
        users: "Users",
        permissions: "Permissions"
      }
    },
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      close: "Close"
    }
  }
};

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
   * Fonction de traduction avec fallback
   * @param key - Clé de traduction (ex: "admin.title")
   * @returns Le texte traduit ou la clé si traduction manquante
   */
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    // Naviguer dans l'objet de traductions
    for (const k of keys) {
      value = value?.[k];
    }

    // Si traduction trouvée, la retourner
    if (typeof value === 'string') {
      return value;
    }

    // Fallback vers le français
    if (language !== 'fr') {
      let fallbackValue: any = translations.fr;
      for (const k of keys) {
        fallbackValue = fallbackValue?.[k];
      }
      if (typeof fallbackValue === 'string') {
        return fallbackValue;
      }
    }

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