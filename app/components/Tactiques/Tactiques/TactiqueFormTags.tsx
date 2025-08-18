// app/components/Tactiques/Tactiques/TactiqueFormTags.tsx

/**
 * Composant pour l'onglet Tags du formulaire de tactique
 * Contient les champs spécifiques aux tags : Buy Type, CM360 Volume et Rate calculé
 * VERSION NOUVELLE : Ajout de la liaison automatique CM360 Volume → Unit Volume
 */

import React, { useEffect } from 'react';
import { TactiqueFormData } from '../../../types/tactiques';
import { useTranslation } from '../../../contexts/LanguageContext';

interface TactiqueFormTagsProps {
  formData: TactiqueFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  loading?: boolean;
}

export default function TactiqueFormTags({
  formData,
  onChange,
  onTooltipChange,
  loading = false
}: TactiqueFormTagsProps) {
  const { t } = useTranslation();

  /**
   * Calcule le TC_CM360_Rate basé sur les valeurs actuelles
   */
  const calculateCM360Rate = (): number => {
    const formDataAny = formData as any;
    const mediaBudget = formDataAny.TC_Media_Budget || 0;
    const volume = formDataAny.TC_CM360_Volume || 0;
    const buyType = formDataAny.TC_Buy_Type;

    // Validation : éviter division par zéro
    if (volume <= 0) {
      return 0;
    }

    const baseRate = mediaBudget / volume;

    // Si CPM, multiplier par 1000
    if (buyType === 'CPM') {
      return baseRate * 1000;
    }

    // Si CPC ou autre, retourner la division simple
    return baseRate;
  };

  /**
   * Met à jour automatiquement le TC_CM360_Rate quand les dépendances changent
   */
  useEffect(() => {
    const calculatedRate = calculateCM360Rate();
    const formDataAny = formData as any;
    
    // Seulement mettre à jour si la valeur a changé pour éviter les boucles infinies
    if (formDataAny.TC_CM360_Rate !== calculatedRate) {
      // Créer un événement simulé pour déclencher onChange
      const syntheticEvent = {
        target: {
          name: 'TC_CM360_Rate',
          value: calculatedRate.toString(),
          type: 'number'
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
    }
  }, [
    (formData as any).TC_Media_Budget, 
    (formData as any).TC_CM360_Volume, 
    (formData as any).TC_Buy_Type,
    onChange
  ]);

  /**
   * Gère le changement de la case à cocher de liaison
   */
  const handleLinkageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isLinked = event.target.checked;
    
    // Créer un événement pour le champ de liaison
    const linkageEvent = {
      target: {
        name: 'TC_CM360_Volume_Linked_To_Unit_Volume',
        value: isLinked.toString(),
        type: 'checkbox',
        checked: isLinked
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(linkageEvent);

    // Si on active la liaison, synchroniser immédiatement avec TC_Unit_Volume
    if (isLinked) {
      const unitVolume = (formData as any).TC_Unit_Volume || 0;
      const volumeEvent = {
        target: {
          name: 'TC_CM360_Volume',
          value: unitVolume.toString(),
          type: 'number'
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(volumeEvent);
    }
  };

  /**
   * Gère le changement manuel du volume CM360 (seulement si non lié)
   */
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isLinked = (formData as any).TC_CM360_Volume_Linked_To_Unit_Volume || false;
    
    // Si lié, ignorer les modifications manuelles
    if (isLinked) {
      return;
    }
    
    onChange(event);
  };

  // Détermine si le champ volume est en mode lecture seule
  const isVolumeReadonly = (formData as any).TC_CM360_Volume_Linked_To_Unit_Volume || false;
  const unitVolume = (formData as any).TC_Unit_Volume || 0;
  const cm360Volume = (formData as any).TC_CM360_Volume || 0;

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        
        {/* TC_Buy_Type - Type d'achat */}
        <div>
          <label 
            htmlFor="TC_Buy_Type" 
            className="block text-sm font-medium text-gray-700"
          >
            {t('tactiqueFormTags.fields.buyType.label')}
          </label>
          <select
            id="TC_Buy_Type"
            name="TC_Buy_Type"
            value={(formData as any).TC_Buy_Type || ''}
            onChange={onChange}
            onFocus={() => onTooltipChange(t('tactiqueFormTags.fields.buyType.tooltip'))}
            onBlur={() => onTooltipChange(null)}
            disabled={loading}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
            required
          >
            <option value="">{t('tactiqueFormTags.fields.buyType.selectPlaceholder')}</option>
            <option value="CPM">CPM</option>
            <option value="CPC">CPC</option>
          </select>
        </div>

        {/* TC_CM360_Volume - Volume CM360 avec liaison */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label 
              htmlFor="TC_CM360_Volume" 
              className="block text-sm font-medium text-gray-700"
            >
              {t('tactiqueFormTags.fields.cm360Volume.label')}
            </label>
            
            {/* Case à cocher pour la liaison */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="TC_CM360_Volume_Linked"
                name="TC_CM360_Volume_Linked_To_Unit_Volume"
                checked={(formData as any).TC_CM360_Volume_Linked_To_Unit_Volume || false}
                onChange={handleLinkageChange}
                disabled={loading}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label 
                htmlFor="TC_CM360_Volume_Linked" 
                className="ml-2 text-xs text-gray-600"
                onMouseEnter={() => onTooltipChange(t('tactiqueFormTags.fields.cm360VolumeLinkage.tooltip'))}
                onMouseLeave={() => onTooltipChange(null)}
              >
                {t('tactiqueFormTags.fields.cm360VolumeLinkage.label')}
              </label>
            </div>
          </div>

          <div className="relative">
            <input
              type="number"
              id="TC_CM360_Volume"
              name="TC_CM360_Volume"
              value={isVolumeReadonly ? unitVolume : cm360Volume}
              onChange={handleVolumeChange}
              onFocus={() => onTooltipChange(
                isVolumeReadonly 
                  ? t('tactiqueFormTags.fields.cm360Volume.tooltipLinked')
                  : t('tactiqueFormTags.fields.cm360Volume.tooltip')
              )}
              onBlur={() => onTooltipChange(null)}
              disabled={loading}
              readOnly={isVolumeReadonly}
              min="1"
              step="1"
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                isVolumeReadonly
                  ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                  : 'border-gray-300 disabled:bg-gray-50 disabled:text-gray-500'
              }`}
              placeholder={isVolumeReadonly ? t('tactiqueFormTags.fields.cm360Volume.placeholderLinked') : "Ex: 1000000"}
              required
            />
            
            {/* Indicateur visuel quand lié */}
            {isVolumeReadonly && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-indigo-500 text-sm">🔗</span>
              </div>
            )}
          </div>

          {/* Messages d'aide */}
          {isVolumeReadonly && (
            <p className="mt-1 text-xs text-indigo-600">
              {t('tactiqueFormTags.fields.cm360Volume.linkedMessage')}
            </p>
          )}
          
          {!isVolumeReadonly && cm360Volume && cm360Volume <= 0 && (
            <p className="mt-1 text-sm text-red-600">
              {t('tactiqueFormTags.validation.volumePositive')}
            </p>
          )}
        </div>

      </div>

      {/* TC_CM360_Rate - Taux calculé (pleine largeur) */}
      <div>
        <label 
          htmlFor="TC_CM360_Rate" 
          className="block text-sm font-medium text-gray-700"
        >
          {t('tactiqueFormTags.fields.cm360Rate.label')}
        </label>
        <div className="mt-1 relative">
          <input
            type="number"
            id="TC_CM360_Rate"
            name="TC_CM360_Rate"
            value={calculateCM360Rate().toFixed(4)}
            onFocus={() => onTooltipChange(t('tactiqueFormTags.fields.cm360Rate.tooltip'))}
            onBlur={() => onTooltipChange(null)}
            disabled={true}
            className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm text-gray-500 cursor-not-allowed"
            readOnly
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-400 sm:text-sm">
              {(formData as any).TC_Buy_Type === 'CPM' ? 'CPM' : 
               (formData as any).TC_Buy_Type === 'CPC' ? 'CPC' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}