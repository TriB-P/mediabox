/**
 * @file Ce fichier contient le composant React `FeeForm`.
 * Il s'agit d'un formulaire réutilisable pour créer ou modifier un "frais".
 * Ce composant gère l'état local des champs du formulaire et utilise les fonctions
 * passées en props (`onSubmit`, `onCancel`) pour communiquer avec son composant parent,
 * qui est responsable de la logique métier (par exemple, un appel à Firebase).
 */
'use an client';

import React, { useState, useEffect } from 'react';
import { Fee, FeeFormData, CalculationType, CalculationMode } from '../../types/fee';
import { useTranslation } from '../../contexts/LanguageContext';

interface FeeFormProps {
  fee?: Fee;
  onSubmit: (data: FeeFormData) => void;
  onCancel: () => void;
}

/**
 * Affiche un formulaire pour créer ou éditer un frais.
 * Le formulaire est pré-rempli si un `fee` existant est fourni.
 * @param {FeeFormProps} props - Les propriétés du composant.
 * @param {Fee} [props.fee] - L'objet de frais existant à éditer. Si non fourni, le formulaire est en mode création.
 * @param {(data: FeeFormData) => void} props.onSubmit - La fonction à appeler lors de la soumission du formulaire.
 * @param {() => void} props.onCancel - La fonction à appeler lorsque l'utilisateur annule l'opération.
 * @returns {React.ReactElement} Le composant de formulaire.
 */
const FeeForm: React.FC<FeeFormProps> = ({ fee, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FeeFormData>({
    FE_Name: '',
    FE_Calculation_Type: "Frais fixe",
    FE_Calculation_Mode: "Directement sur le budget média",
  });

  useEffect(() => {
    if (fee) {
      setFormData({
        FE_Name: fee.FE_Name,
        FE_Calculation_Type: fee.FE_Calculation_Type,
        FE_Calculation_Mode: fee.FE_Calculation_Mode || "Directement sur le budget média",
      });
    }
  }, [fee]);

  /**
   * Gère la soumission du formulaire.
   * Empêche le rechargement de la page et appelle la fonction `onSubmit` passée en props avec les données du formulaire.
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  /**
   * Met à jour l'état du formulaire à chaque modification d'un champ.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - L'événement de changement du champ.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // The 'value' must remain in French to match the 'Fee' type definition.
  // The 'label' is used for display and is translated.
  const calculationTypes = [
    { value: "Volume d'unité", label: t('feeForm.calculationTypes.volumeUnit') },
    { value: "Frais fixe", label: t('feeForm.calculationTypes.fixedFee') },
    { value: "Pourcentage budget", label: t('feeForm.calculationTypes.percentageBudget') },
    { value: "Unités", label: t('feeForm.calculationTypes.units') }
  ];

  const calculationModes = [
    { value: "Directement sur le budget média", label: t('feeForm.calculationModes.direct') },
    { value: "Applicable sur les frais précédents", label: t('feeForm.calculationModes.onPrevious') }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="FE_Name" className="block text-sm font-medium text-gray-700">
          {t('feeForm.labels.name')}
        </label>
        <input
          type="text"
          id="FE_Name"
          name="FE_Name"
          value={formData.FE_Name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder={t('feeForm.placeholders.name')}
        />
      </div>

      <div>
        <label htmlFor="FE_Calculation_Type" className="block text-sm font-medium text-gray-700">
          {t('feeForm.labels.calculationType')}
        </label>
        <select
          id="FE_Calculation_Type"
          name="FE_Calculation_Type"
          value={formData.FE_Calculation_Type}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {calculationTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="FE_Calculation_Mode" className="block text-sm font-medium text-gray-700">
          {t('feeForm.labels.calculationMode')}
        </label>
        <select
          id="FE_Calculation_Mode"
          name="FE_Calculation_Mode"
          value={formData.FE_Calculation_Mode}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {calculationModes.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {fee ? t('common.update') : t('common.create')}
        </button>
      </div>
    </form>
  );
};

export default FeeForm;