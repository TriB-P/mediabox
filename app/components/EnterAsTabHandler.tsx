// app/components/Global/EnterAsTabHandler.tsx
'use client';

import { useEffect } from 'react';

/**
 * Composant global qui transforme la touche "Enter" en "Tab" dans les formulaires.
 * Améliore l'expérience utilisateur en permettant la navigation au clavier
 * sans fermer les modales/drawers.
 */
export default function EnterAsTabHandler() {
  useEffect(() => {
    /**
     * Gestionnaire global pour transformer Enter en Tab
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore si ce n'est pas la touche Enter
      if (event.key !== 'Enter') return;

      const target = event.target as HTMLElement;
      
      // Exceptions où Enter doit garder son comportement normal
      const exceptions = [
        'TEXTAREA',           // Zone de texte multiligne
        'BUTTON',            // Boutons (y compris submit)
        '[contenteditable="true"]', // Éléments éditables
        '[data-enter-submit]',      // Éléments avec attribut personnalisé
        'input[type="submit"]',     // Boutons de soumission
        'input[type="button"]',     // Boutons génériques
      ];

      // Vérifier les exceptions
      for (const exception of exceptions) {
        if (exception.startsWith('[')) {
          // Sélecteur d'attribut
          if (target.matches?.(exception)) return;
        } else {
          // Nom de balise
          if (target.tagName === exception) return;
        }
      }

      // Cas spéciaux pour les inputs
      if (target.tagName === 'INPUT') {
        const inputType = (target as HTMLInputElement).type.toLowerCase();
        
        // Types d'input où Enter doit être préservé
        const preserveEnterTypes = ['submit', 'button', 'image'];
        if (preserveEnterTypes.includes(inputType)) return;
      }

      // Si on arrive ici, on transforme Enter en Tab
      event.preventDefault();
      event.stopPropagation();

      // Trouver tous les éléments focusables dans la page
      const focusableElements = Array.from(
        document.querySelectorAll(
          'input:not([disabled]):not([type="hidden"]), ' +
          'select:not([disabled]), ' +
          'textarea:not([disabled]), ' +
          'button:not([disabled]), ' +
          '[tabindex]:not([tabindex="-1"]):not([disabled]), ' +
          'a[href]:not([disabled])'
        )
      ) as HTMLElement[];

      // Filtrer les éléments visibles
      const visibleElements = focusableElements.filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               el.offsetParent !== null; // Élément dans le DOM visible
      });

      if (visibleElements.length === 0) return;

      // Trouver l'index de l'élément actuellement focusé
      const currentIndex = visibleElements.indexOf(target);
      
      if (currentIndex === -1) return;

      // Déterminer le prochain élément à focaliser
      let nextIndex = currentIndex + 1;

      // Si on est au dernier élément, chercher un bouton submit dans le contexte
      if (nextIndex >= visibleElements.length) {
        // Chercher un bouton de soumission dans le formulaire parent
        const form = target.closest('form');
        if (form) {
          const submitButton = form.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement;
          if (submitButton) {
            submitButton.focus();
            return;
          }
        }
        
        // Sinon, boucler au premier élément
        nextIndex = 0;
      }

      // Focaliser le prochain élément
      const nextElement = visibleElements[nextIndex];
      if (nextElement) {
        nextElement.focus();
        
        // Si c'est un input text, sélectionner le contenu pour faciliter la saisie
        if (nextElement.tagName === 'INPUT') {
          const inputElement = nextElement as HTMLInputElement;
          const selectableTypes = ['text', 'email', 'password', 'tel', 'url', 'search'];
          if (selectableTypes.includes(inputElement.type)) {
            // Petite temporisation pour s'assurer que le focus est établi
            setTimeout(() => {
              inputElement.select();
            }, 0);
          }
        }
      }
    };

    // Ajouter l'écouteur d'événement
    document.addEventListener('keydown', handleKeyDown, true);

    // Nettoyer à la désactivation du composant
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // Ce composant ne rend rien visuellement
  return null;
}