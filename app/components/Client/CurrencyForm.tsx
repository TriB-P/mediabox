'use client';

import React, { useState, useEffect } from 'react';
import { Currency, CurrencyFormData, CURRENCIES } from '../../types/currency';

interface CurrencyFormProps {
  currency?: Currency;
  onSubmit: (data: CurrencyFormData) => void;
  onCancel: () => void;
}

const CurrencyForm: React.FC<CurrencyFormProps> = ({ currency, onSubmit, onCancel }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());
  
  const [formData, setFormData] = useState<CurrencyFormData>({
    CU_Rate: 1,
    CU_Year: currentYear.toString(),
    CU_From: 'CAD',
    CU_To: 'USD',
  });

  // Mettre à jour le formulaire avec les données de la devise si elle existe
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'CU_Rate') {
      // Traitement spécial pour le taux (nombre)
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
            Année
          </label>
          <select
            id="CU_Year"
            name="CU_Year"
            value={formData.CU_Year}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="CU_Rate" className="block text-sm font-medium text-gray-700">
            Taux
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
            Devise source
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
            Devise cible
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
          Annuler
        </button>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {currency ? 'Mettre à jour' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
};

export default CurrencyForm;