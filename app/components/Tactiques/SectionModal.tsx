'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Section {
  id: string;
  SECTION_Name: string;
  SECTION_Color?: string;
  SECTION_Order: number;
  SECTION_Budget?: number;
}

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sectionData: { SECTION_Name: string; SECTION_Color: string }) => void;
  section?: Section | null;
  mode: 'create' | 'edit';
}

const PREDEFINED_COLORS = [
  '#5EBFD0', 
  '#F8C207',
  '#F5659A', 
  '#25A740', 
  '#594B96', 
];

export default function SectionModal({
  isOpen,
  onClose,
  onSave,
  section,
  mode
}: SectionModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Initialiser les valeurs quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && section) {
        setName(section.SECTION_Name);
        setSelectedColor(section.SECTION_Color || '#6366f1');
      } else {
        setName('');
        setSelectedColor('#6366f1');
      }
      setErrors({});
    }
  }, [isOpen, mode, section]);

  const validateForm = () => {
    const newErrors: { name?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Le nom de la section est obligatoire';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    onSave({
      SECTION_Name: name.trim(),
      SECTION_Color: selectedColor
    });
    
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setSelectedColor('#6366f1');
    setErrors({});
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleClose}
            >
              <span className="sr-only">Fermer</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {mode === 'create' ? 'Nouvelle section' : 'Modifier la section'}
              </h3>

              <div className="space-y-4">
                {/* Nom de la section */}
                <div>
                  <label htmlFor="section-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la section
                  </label>
                  <input
                    type="text"
                    id="section-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                      errors.name ? 'border-red-300' : ''
                    }`}
                    placeholder="Entrez le nom de la section"
                    autoFocus
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Sélecteur de couleur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur de la section
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {PREDEFINED_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                          selectedColor === color 
                            ? 'border-gray-800 scale-110' 
                            : 'border-gray-300 hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: color }}
                        title={`Couleur ${color}`}
                      >
                        {selectedColor === color && (
                          <div className="w-full h-full rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {mode === 'create' ? 'Créer' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
