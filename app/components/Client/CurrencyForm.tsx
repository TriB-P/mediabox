// app/components/Client/CurrencyForm.tsx

/**
 * Ce fichier définit un composant React nommé CurrencyForm.
 * Il s'agit d'un formulaire réutilisable permettant de créer ou de modifier un taux de change entre deux devises 
 * avec une version/année personnalisée (ex: "2025 v1", "2025 v2").
 * Le formulaire est pré-rempli si une devise existante est fournie et gère la soumission et l'annulation via des fonctions passées en props.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Currency, CurrencyFormData, CURRENCIES } from '../../types/currency';
import { useTranslation } from '../../contexts/LanguageContext';

interface CurrencyFormProps {
  currency?: Currency;
  onSubmit: (data: CurrencyFormData) => void;
  onCancel: () => void;
}

/**
 * CurrencyForm est un composant de formulaire pour ajouter ou modifier des taux de change.
 * @param {CurrencyFormProps} props - Les propriétés du composant.
 * @param {Currency} [props.currency] - Les données de la devise à modifier. Si non fourni, le formulaire est en mode création.
 * @param {(data: CurrencyFormData) => void} props.onSubmit - La fonction à appeler lors de la soumission du formulaire.
 * @param {() => void} props.onCancel - La fonction à appeler lorsque l'utilisateur clique sur le bouton "Annuler".
 * @returns {React.ReactElement} Le formulaire de devise.
 */
const CurrencyForm: React.FC<CurrencyFormProps> = ({ currency, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState<CurrencyFormData>({
    CU_Rate: 1,
    CU_Year: currentYear.toString(), // Valeur par défaut : année courante
    CU_From: 'CAD',
    CU_To: 'USD',
  });

  useEffect(() => {
    if (currency) {
      setFormData({
        CU_Rate: currency.CU_Rate,
        CU_Year: currency.CU_Year,
        CU_From: currency.CU_From,
        CU_To: currency.CU_To,
      });
    }
  }, [currency]);

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
   * Il traite spécifiquement le champ `CU_Rate` pour s'assurer que sa valeur est un nombre.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - L'événement de changement du champ.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'CU_Rate') {
      const numValue = parseFloat(value);
      setFormData({
        ...formData,
        [name]: isNaN(numValue) ? 0 : numValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="CU_Year" className="block text-sm font-medium text-gray-700">
            {t('currencyForm.labels.year')}
          </label>
          <input
            type="text"
            id="CU_Year"
            name="CU_Year"
            value={formData.CU_Year}
            onChange={handleChange}
            required
            placeholder="Ex: 2025, 2025 v1, 2025 Q1..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Vous pouvez saisir une version personnalisée (ex: "2025 v1", "2025 v2")
          </p>
        </div>

        <div>
          <label htmlFor="CU_Rate" className="block text-sm font-medium text-gray-700">
            {t('currencyForm.labels.rate')}
          </label>
          <input
            type="number"
            id="CU_Rate"
            name="CU_Rate"
            value={formData.CU_Rate}
            onChange={handleChange}
            step="0.0001"
            min="0"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="CU_From" className="block text-sm font-medium text-gray-700">
            {t('currencyForm.labels.from')}
          </label>
          <select
            id="CU_From"
            name="CU_From"
            value={formData.CU_From}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {CURRENCIES.map((currency) => (
              <option key={`from-${currency}`} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="CU_To" className="block text-sm font-medium text-gray-700">
            {t('currencyForm.labels.to')}
          </label>
          <select
            id="CU_To"
            name="CU_To"
            value={formData.CU_To}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {CURRENCIES.map((currency) => (
              <option key={`to-${currency}`} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t('currencyForm.buttons.cancel')}
        </button>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t(currency ? 'currencyForm.buttons.update' : 'currencyForm.buttons.add')}
        </button>
      </div>
    </form>
  );
};

export default CurrencyForm;