'use client';

import React, { useState, useEffect } from 'react';
import { FeeOption, FeeOptionFormData } from '../../types/fee';

interface FeeOptionFormProps {
  option?: FeeOption;
  onSubmit: (data: FeeOptionFormData) => void;
  onCancel: () => void;
}

export default function FeeOptionForm({ option, onSubmit, onCancel }: FeeOptionFormProps) {
  const [formData, setFormData] = useState<FeeOptionFormData>({
    FO_Option: '',
    FO_Value: 0,
    FO_Buffer: 0,
    FO_Editable: false,
  });

  // Mettre à jour le formulaire avec les données de l'option si elles existent
  useEffect(() => {
    if (option) {
      setFormData({
        FO_Option: option.FO_Option,
        FO_Value: option.FO_Value,
        FO_Buffer: option.FO_Buffer,
        FO_Editable: option.FO_Editable,
      });
    }
  }, [option]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    let newValue: string | number | boolean = value;
    
    if (type === 'number' || type === 'range') {
      newValue = parseFloat(value) || 0;
    } else if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }
    
    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="FO_Option" className="block text-sm font-medium text-gray-700">
          Nom de l'option
        </label>
        <input
          type="text"
          id="FO_Option"
          name="FO_Option"
          value={formData.FO_Option}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Nom de l'option"
        />
      </div>

      <div>
        <label htmlFor="FO_Value" className="block text-sm font-medium text-gray-700">
          Valeur
        </label>
        <input
          type="number"
          id="FO_Value"
          name="FO_Value"
          value={formData.FO_Value}
          onChange={handleChange}
          step="0.01"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="FO_Buffer" className="block text-sm font-medium text-gray-700">
            Buffer (%)
          </label>
          <span className="text-sm font-medium text-indigo-600">
            {formData.FO_Buffer}%
          </span>
        </div>
        <input
          type="range"
          id="FO_Buffer"
          name="FO_Buffer"
          min="0"
          max="100"
          step="5"
          value={formData.FO_Buffer}
          onChange={handleChange}
          className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-500 px-1 mt-1">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="FO_Editable"
          name="FO_Editable"
          checked={formData.FO_Editable}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="FO_Editable" className="ml-2 block text-sm text-gray-700">
          Éditable
        </label>
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
          {option ? 'Mettre à jour' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}