// app/components/Tactiques/Tactiques/TactiqueFormTags.tsx

/**
 * Composant pour l'onglet Tags du formulaire de tactique
 * Contient les champs spécifiques aux tags : Buy Type, CM360 Volume et Rate calculé
 */

import React, { useEffect } from 'react';
import { TactiqueFormData } from '../../../types/tactiques';

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

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        
        {/* TC_Buy_Type - Type d'achat */}
        <div>
          <label 
            htmlFor="TC_Buy_Type" 
            className="block text-sm font-medium text-gray-700"
          >
            Type d'achat *
          </label>
          <select
            id="TC_Buy_Type"
            name="TC_Buy_Type"
            value={(formData as any).TC_Buy_Type || ''}
            onChange={onChange}
            onFocus={() => onTooltipChange('Sélectionnez le type d\'achat pour cette tactique')}
            onBlur={() => onTooltipChange(null)}
            disabled={loading}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
            required
          >
            <option value="">Sélectionner un type</option>
            <option value="CPM">CPM</option>
            <option value="CPC">CPC</option>
          </select>
        </div>

        {/* TC_CM360_Volume - Volume CM360 */}
        <div>
          <label 
            htmlFor="TC_CM360_Volume" 
            className="block text-sm font-medium text-gray-700"
          >
            Volume CM360 *
          </label>
          <input
            type="number"
            id="TC_CM360_Volume"
            name="TC_CM360_Volume"
            value={(formData as any).TC_CM360_Volume || ''}
            onChange={onChange}
            onFocus={() => onTooltipChange('Entrez le volume prévu pour cette tactique (nombre entier)')}
            onBlur={() => onTooltipChange(null)}
            disabled={loading}
            min="1"
            step="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Ex: 1000000"
            required
          />
          {(formData as any).TC_CM360_Volume && (formData as any).TC_CM360_Volume <= 0 && (
            <p className="mt-1 text-sm text-red-600">
              Le volume doit être supérieur à 0
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
          Taux CM360 (calculé automatiquement)
        </label>
        <div className="mt-1 relative">
          <input
            type="number"
            id="TC_CM360_Rate"
            name="TC_CM360_Rate"
            value={calculateCM360Rate().toFixed(4)}
            onFocus={() => onTooltipChange('Taux calculé automatiquement : Budget Client ÷ Volume CM360 (×1000 si CPM)')}
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