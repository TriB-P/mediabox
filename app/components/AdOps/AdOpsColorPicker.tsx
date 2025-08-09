// app/components/AdOps/AdOpsColorPicker.tsx
/**
 * Composant AdOpsColorPicker
 * Interface pour sélectionner une couleur à appliquer aux lignes sélectionnées.
 * Affiche les 4 couleurs prédéfinies avec preview.
 */
'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Color {
  name: string;
  value: string;
  class: string;
}

interface AdOpsColorPickerProps {
  colors: Color[];
  onColorSelect: (colorValue: string) => void;
  onClose: () => void;
}

/**
 * Composant sélecteur de couleurs
 */
export default function AdOpsColorPicker({
  colors,
  onColorSelect,
  onClose
}: AdOpsColorPickerProps) {
  return (
    <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">
          Choisir une couleur
        </h4>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded"
          title="Fermer"
        >
          <XMarkIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorSelect(color.value)}
            className={`
              relative group px-4 py-2 rounded-lg border-2 border-gray-300 
              hover:border-gray-400 transition-all duration-200 
              ${color.class}
            `}
            title={`Appliquer la couleur ${color.name.toLowerCase()}`}
          >
            <div className="flex items-center gap-2">
              <div 
                className={`w-4 h-4 rounded-full border border-gray-300 ${color.class}`}
                style={{ backgroundColor: color.value }}
              ></div>
              <span className="text-sm font-medium text-gray-700">
                {color.name}
              </span>
            </div>
            
            {/* Effet hover */}
            <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        ))}
        
        {/* Bouton pour supprimer la couleur */}
        <button
          onClick={() => onColorSelect('')}
          className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-all duration-200"
          title="Supprimer la couleur"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-gray-400 bg-white relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-0.5 bg-red-500 rotate-45"></div>
                <div className="w-3 h-0.5 bg-red-500 -rotate-45 absolute"></div>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Aucune
            </span>
          </div>
        </button>
      </div>
      
      <p className="mt-3 text-xs text-gray-600">
        La couleur sera appliquée à toutes les lignes sélectionnées et sauvegardée automatiquement.
      </p>
    </div>
  );
}