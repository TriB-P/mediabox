// app/components/Tactiques/Tactiques/CostGuideModal.tsx
/**
 * Modal réutilisable pour la sélection de valeurs depuis un guide de coûts.
 * Navigation en cascade à travers les 4 niveaux du guide de coûts avec
 * application finale du prix unitaire sélectionné.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CostGuideEntry } from '../../../types/costGuide';
import { useTranslation } from '../../../contexts/LanguageContext';

// Interfaces
interface CostGuideModalState {
  level1Selection: string;
  level2Selection: string;
  level3Selection: string;
  level4Selection: string;
  currentLevel: 1 | 2 | 3 | 4;
}

interface CostGuideOption {
  value: string;
  label: string;
  count?: number;
}

interface CostGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (unitPrice: number) => void;
  costGuideEntries: CostGuideEntry[];
  title?: string;
}

/**
 * Composant modal pour la sélection dans le guide de coûts
 */
export default function CostGuideModal({
  isOpen,
  onClose,
  onSelect,
  costGuideEntries,
  title: propTitle
}: CostGuideModalProps) {
  const { t } = useTranslation();
  const title = propTitle || t('costGuideModal.title');
  const [modalState, setModalState] = useState<CostGuideModalState>({
    level1Selection: '',
    level2Selection: '',
    level3Selection: '',
    level4Selection: '',
    currentLevel: 1
  });
  // Nouvel état pour la barre de recherche
  const [searchQuery, setSearchQuery] = useState('');

  // Réinitialiser l'état quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setModalState({
        level1Selection: '',
        level2Selection: '',
        level3Selection: '',
        level4Selection: '',
        currentLevel: 1
      });
      // Réinitialiser la recherche
      setSearchQuery('');
    }
  }, [isOpen]);

  // Réinitialiser la recherche lors du changement de niveau
  useEffect(() => {
    setSearchQuery('');
  }, [modalState.currentLevel]);


  /**
   * Obtient les options pour un niveau donné selon les sélections précédentes et la recherche
   */
  const getCostGuideOptions = (level: 1 | 2 | 3 | 4): CostGuideOption[] => {
    if (costGuideEntries.length === 0) return [];

    let filteredEntries = costGuideEntries;

    // Filtrer selon les sélections précédentes
    if (level >= 2 && modalState.level1Selection) {
      filteredEntries = filteredEntries.filter(entry => entry.level1 === modalState.level1Selection);
    }
    if (level >= 3 && modalState.level2Selection) {
      filteredEntries = filteredEntries.filter(entry => entry.level2 === modalState.level2Selection);
    }
    if (level >= 4 && modalState.level3Selection) {
      filteredEntries = filteredEntries.filter(entry => entry.level3 === modalState.level3Selection);
    }

    // Extraire les valeurs uniques pour le niveau demandé
    const levelKey = `level${level}` as keyof CostGuideEntry;
    const uniqueValues = Array.from(new Set(
      filteredEntries
        .map(entry => entry[levelKey] as string)
        .filter(value => value && value.trim() !== '')
    ));

    // Créer les options
    const options = uniqueValues.map(value => ({
      value,
      label: value,
      count: filteredEntries.filter(entry => entry[levelKey] === value).length
    }));

    // Filtrer par la barre de recherche (uniquement pour les niveaux 1, 2, 3)
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    if (lowerCaseQuery && level < 4) {
      return options.filter(option => 
        option.label.toLowerCase().includes(lowerCaseQuery)
      );
    }
    
    return options;
  };

  /**
   * Obtient les entrées finales pour le niveau 4 (avec filtration par recherche)
   */
  const getFinalCostGuideEntries = (): CostGuideEntry[] => {
    const finalEntries = costGuideEntries.filter(entry => 
      entry.level1 === modalState.level1Selection &&
      entry.level2 === modalState.level2Selection &&
      entry.level3 === modalState.level3Selection
    );

    // Filtration par la barre de recherche pour le niveau 4 (sur level4, purchaseUnit, et comment)
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    if (lowerCaseQuery) {
      return finalEntries.filter(entry => 
        entry.level4.toLowerCase().includes(lowerCaseQuery) ||
        entry.purchaseUnit.toLowerCase().includes(lowerCaseQuery) ||
        (entry.comment || '').toLowerCase().includes(lowerCaseQuery)
      );
    }

    return finalEntries;
  };

  // On utilise useMemo pour éviter de recalculer les options à chaque rendu
  const currentOptions = useMemo(() => getCostGuideOptions(modalState.currentLevel), [modalState, searchQuery, costGuideEntries]);
  const finalEntries = useMemo(() => getFinalCostGuideEntries(), [modalState, searchQuery, costGuideEntries]);


  /**
   * Gère la sélection d'un niveau (1, 2, ou 3)
   */
  const handleCostGuideSelection = (level: 1 | 2 | 3, value: string) => {
    setModalState(prev => ({
      ...prev,
      [`level${level}Selection`]: value,
      currentLevel: (level + 1) as (1 | 2 | 3 | 4),
      // Réinitialiser les sélections des niveaux suivants
      ...(level <= 1 && { level2Selection: '', level3Selection: '', level4Selection: '' }),
      ...(level <= 2 && { level3Selection: '', level4Selection: '' }),
      ...(level <= 3 && { level4Selection: '' })
    }));
    // La recherche sera réinitialisée par l'useEffect
  };

  /**
   * Applique la sélection finale du cost guide (niveau 4)
   */
  const handleApplyCostGuideSelection = (entry: CostGuideEntry) => {
    onSelect(entry.unitPrice);
    onClose();
  };

  /**
   * Navigation retour dans le cost guide
   */
  const handleCostGuideBack = (e?: React.MouseEvent) => {
    // Empêcher toute propagation d'événement
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setModalState(prev => {
      const newLevel = Math.max(1, prev.currentLevel - 1) as (1 | 2 | 3 | 4);
      
      return {
        ...prev,
        currentLevel: newLevel
      };
    });
    // La recherche sera réinitialisée par l'useEffect
  };

  /**
   * Obtient le titre du niveau actuel
   */
  const getCurrentLevelTitle = (): string => {
    switch (modalState.currentLevel) {
      case 1: return t('costGuideModal.levelTitles.mainCategory');
      case 2: return t('costGuideModal.levelTitles.subCategory');
      case 3: return t('costGuideModal.levelTitles.specification');
      case 4: return t('costGuideModal.levelTitles.optionWithPrice');
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div 
        className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {title}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Breadcrumb de navigation */}
        <div className="flex items-center space-x-2 text-sm text-slate-600 mb-4">
          <span className={modalState.currentLevel >= 1 ? 'font-medium text-slate-900' : ''}>
            {t('costGuideModal.breadcrumb.level1')}
          </span>
          {modalState.level1Selection && (
            <>
              <span>→</span>
              <span className={modalState.currentLevel >= 2 ? 'font-medium text-slate-900' : ''}>
                {modalState.level1Selection}
              </span>
            </>
          )}
          {modalState.level2Selection && (
            <>
              <span>→</span>
              <span className={modalState.currentLevel >= 3 ? 'font-medium text-slate-900' : ''}>
                {modalState.level2Selection}
              </span>
            </>
          )}
          {modalState.level3Selection && (
            <>
              <span>→</span>
              <span className={modalState.currentLevel >= 4 ? 'font-medium text-slate-900' : ''}>
                {modalState.level3Selection}
              </span>
            </>
          )}
        </div>

        {/* Bouton retour */}
        {modalState.currentLevel > 1 && (
          <button
            type="button"
            onClick={handleCostGuideBack}
            className="mb-4 px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            {t('costGuideModal.buttons.back')}
          </button>
        )}

        {/* Barre de recherche (ajoutée ici) */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={`${t('common.search')}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Contenu selon le niveau actuel */}
        <div className="space-y-2">
          {modalState.currentLevel < 4 ? (
            // Niveaux 1, 2, 3 : affichage des options
            <>
              <h4 className="font-medium text-slate-900 mb-3">
                {t('costGuideModal.selection.choose')} {getCurrentLevelTitle()}
              </h4>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {currentOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleCostGuideSelection(modalState.currentLevel as 1 | 2 | 3, option.value)}
                    className="flex items-center justify-between p-3 text-left border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <span className="font-medium">{option.label}</span>
                    <span className="text-sm text-slate-500">
                      {option.count} {t('costGuideModal.selection.option')}{(option.count || 0) > 1 ? 's' : ''}
                    </span>
                  </button>
                ))}
                {currentOptions.length === 0 && (
                  <div className="text-center py-4 text-slate-500">
                    <p>{t('costGuideModal.noOptions.searchResult')}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Niveau 4 : affichage des entrées finales avec prix
            <>
              <h4 className="font-medium text-slate-900 mb-3">
                {t('costGuideModal.selection.choose')} {getCurrentLevelTitle()}
              </h4>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {finalEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleApplyCostGuideSelection(entry)}
                    className="flex items-center justify-between p-4 text-left border border-slate-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{entry.level4}</div>
                      <div className="text-sm text-slate-600">
                        {t('costGuideModal.finalSelection.unit')}: {entry.purchaseUnit}
                        {entry.comment && (
                          <span className="ml-2 text-slate-500">• {entry.comment}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 group-hover:text-green-700">
                        {entry.unitPrice.toLocaleString('fr-CA', { 
                          style: 'currency', 
                          currency: 'CAD' 
                        })}
                      </div>
                      <div className="text-xs text-slate-500">{t('costGuideModal.finalSelection.per')} {entry.purchaseUnit}</div>
                    </div>
                  </button>
                ))}
                {finalEntries.length === 0 && (
                  <div className="text-center py-4 text-slate-500">
                    <p>{t('costGuideModal.noOptions.searchResult')}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Message si aucune option (seulement si la recherche est vide) */}
        {searchQuery === '' && ((modalState.currentLevel < 4 && currentOptions.length === 0) ||
          (modalState.currentLevel === 4 && finalEntries.length === 0)) && (
          <div className="text-center py-8 text-slate-500">
            <p>{t('costGuideModal.noOptions.title')}</p>
            <p className="text-sm mt-1">{t('costGuideModal.noOptions.instruction')}</p>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}