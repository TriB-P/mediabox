'use client';

import React, { useState, useEffect } from 'react';
import { Taxonomy, TaxonomyFormData } from '../../types/taxonomy';

interface TaxonomyFormProps {
  taxonomy?: Taxonomy;
  onSubmit: (data: TaxonomyFormData) => void;
  onCancel: () => void;
}

const TaxonomyForm: React.FC<TaxonomyFormProps> = ({ taxonomy, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<TaxonomyFormData>({
    NA_Display_Name: '',
    NA_Description: '',
    NA_Standard: false,
    NA_Name_Level_1: '',
    NA_Name_Level_2: '',
    NA_Name_Level_3: '',
    NA_Name_Level_4: '',
    NA_Name_Level_5: '',
    NA_Name_Level_6: '',
    NA_Name_Level_1_Title: '',
    NA_Name_Level_2_Title: '',
    NA_Name_Level_3_Title: '',
    NA_Name_Level_4_Title: '',
    NA_Name_Level_5_Title: '',
    NA_Name_Level_6_Title: '',
  });

  // Mettre à jour le formulaire avec les données de la taxonomie si elles existent
  useEffect(() => {
    if (taxonomy) {
      setFormData({
        NA_Display_Name: taxonomy.NA_Display_Name,
        NA_Description: taxonomy.NA_Description,
        NA_Standard: taxonomy.NA_Standard,
        NA_Name_Level_1: taxonomy.NA_Name_Level_1,
        NA_Name_Level_2: taxonomy.NA_Name_Level_2,
        NA_Name_Level_3: taxonomy.NA_Name_Level_3,
        NA_Name_Level_4: taxonomy.NA_Name_Level_4,
        NA_Name_Level_5: taxonomy.NA_Name_Level_5,
        NA_Name_Level_6: taxonomy.NA_Name_Level_6,
        NA_Name_Level_1_Title: taxonomy.NA_Name_Level_1_Title,
        NA_Name_Level_2_Title: taxonomy.NA_Name_Level_2_Title,
        NA_Name_Level_3_Title: taxonomy.NA_Name_Level_3_Title,
        NA_Name_Level_4_Title: taxonomy.NA_Name_Level_4_Title,
        NA_Name_Level_5_Title: taxonomy.NA_Name_Level_5_Title,
        NA_Name_Level_6_Title: taxonomy.NA_Name_Level_6_Title,
      });
    }
  }, [taxonomy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Fonction pour obtenir en toute sécurité une valeur de chaîne pour un textarea
  const getStringValue = (key: keyof TaxonomyFormData): string => {
    const value = formData[key];
    return typeof value === 'string' ? value : '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow divide-y divide-gray-200">
        {/* Informations générales */}
        <div className="pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="NA_Display_Name" className="block text-sm font-medium text-gray-700">
                Nom d'affichage*
              </label>
              <input
                type="text"
                id="NA_Display_Name"
                name="NA_Display_Name"
                value={formData.NA_Display_Name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div className="flex items-center h-full mt-8">
              <input
                type="checkbox"
                id="NA_Standard"
                name="NA_Standard"
                checked={formData.NA_Standard}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="NA_Standard" className="ml-2 block text-sm text-gray-700">
                Standard
              </label>
            </div>
          </div>
          
          <div className="mt-4">
            <label htmlFor="NA_Description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="NA_Description"
              name="NA_Description"
              value={formData.NA_Description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        
        {/* Niveaux de taxonomie */}
        <div className="pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Niveaux de taxonomie</h3>
          
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <div key={level} className="mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">Niveau {level}</h4>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label 
                    htmlFor={`NA_Name_Level_${level}_Title`} 
                    className="block text-sm font-medium text-gray-700"
                  >
                    Titre
                  </label>
                  <input
                    type="text"
                    id={`NA_Name_Level_${level}_Title`}
                    name={`NA_Name_Level_${level}_Title`}
                    value={getStringValue(`NA_Name_Level_${level}_Title` as keyof TaxonomyFormData)}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label 
                    htmlFor={`NA_Name_Level_${level}`} 
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nom
                  </label>
                  <textarea
                    id={`NA_Name_Level_${level}`}
                    name={`NA_Name_Level_${level}`}
                    value={getStringValue(`NA_Name_Level_${level}` as keyof TaxonomyFormData)}
                    onChange={handleChange}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
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
          {taxonomy ? 'Mettre à jour' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
};

export default TaxonomyForm;