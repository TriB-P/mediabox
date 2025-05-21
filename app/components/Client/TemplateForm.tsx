'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Template, TemplateFormData, LANGUAGES } from '../../types/template';

interface TemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: Template) => void;
  template: Template | null;
}

export default function TemplateForm({ isOpen, onClose, onSave, template }: TemplateFormProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    TE_Name: '',
    TE_URL: '',
    TE_Duplicate: false,
    TE_Language: 'Français'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialiser le formulaire avec les données du gabarit si en mode édition
  useEffect(() => {
    if (template) {
      setFormData({
        TE_Name: template.TE_Name,
        TE_URL: template.TE_URL,
        TE_Duplicate: template.TE_Duplicate,
        TE_Language: template.TE_Language
      });
    } else {
      // Réinitialiser le formulaire en mode création
      setFormData({
        TE_Name: '',
        TE_URL: '',
        TE_Duplicate: false,
        TE_Language: 'Français'
      });
    }
    setErrors({});
  }, [template]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.TE_Name.trim()) {
      newErrors.TE_Name = 'Le nom du gabarit est requis';
    }
    
    if (!formData.TE_URL.trim()) {
      newErrors.TE_URL = 'L\'URL du gabarit est requise';
    } else {
      try {
        new URL(formData.TE_URL);
      } catch (e) {
        newErrors.TE_URL = 'L\'URL doit être valide';
      }
    }
    
    if (!formData.TE_Language) {
      newErrors.TE_Language = 'La langue est requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Gestion spéciale pour les cases à cocher
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        ...formData,
        id: template?.id || '',
        createdAt: template?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                >
                  {template ? 'Modifier le gabarit' : 'Ajouter un gabarit'}
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </Dialog.Title>
                
                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="space-y-4">
                    {/* Nom du gabarit */}
                    <div>
                      <label htmlFor="TE_Name" className="block text-sm font-medium text-gray-700">
                        Nom du gabarit *
                      </label>
                      <input
                        type="text"
                        name="TE_Name"
                        id="TE_Name"
                        value={formData.TE_Name}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.TE_Name ? 'border-red-500' : ''
                        }`}
                        placeholder="Ex: Gabarit Standard"
                      />
                      {errors.TE_Name && (
                        <p className="mt-1 text-sm text-red-500">{errors.TE_Name}</p>
                      )}
                    </div>

                    {/* URL du gabarit */}
                    <div>
                      <label htmlFor="TE_URL" className="block text-sm font-medium text-gray-700">
                        URL du gabarit *
                      </label>
                      <input
                        type="text"
                        name="TE_URL"
                        id="TE_URL"
                        value={formData.TE_URL}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.TE_URL ? 'border-red-500' : ''
                        }`}
                        placeholder="https://docs.google.com/spreadsheets/d/exemple"
                      />
                      {errors.TE_URL && (
                        <p className="mt-1 text-sm text-red-500">{errors.TE_URL}</p>
                      )}
                    </div>

                    {/* Option de duplication */}
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="TE_Duplicate"
                          name="TE_Duplicate"
                          type="checkbox"
                          checked={formData.TE_Duplicate}
                          onChange={handleChange}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="TE_Duplicate" className="font-medium text-gray-700">
                          Dupliquer pour chaque onglet
                        </label>
                        <p className="text-gray-500">
                          Activer cette option pour créer un onglet par section de campagne
                        </p>
                      </div>
                    </div>

                    {/* Langue du gabarit */}
                    <div>
                      <label htmlFor="TE_Language" className="block text-sm font-medium text-gray-700">
                        Langue *
                      </label>
                      <select
                        id="TE_Language"
                        name="TE_Language"
                        value={formData.TE_Language}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.TE_Language ? 'border-red-500' : ''
                        }`}
                      >
                        {LANGUAGES.map((language) => (
                          <option key={language} value={language}>
                            {language}
                          </option>
                        ))}
                      </select>
                      {errors.TE_Language && (
                        <p className="mt-1 text-sm text-red-500">{errors.TE_Language}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      {template ? 'Mettre à jour' : 'Créer'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}