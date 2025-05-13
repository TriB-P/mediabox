'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TrashIcon, PencilIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Bucket {
  id: string;
  name: string;
  description: string;
  target: number;
  actual: number;
  percentage: number;
  color: string;
  publishers: string[];
}

interface Publisher {
  id: string;
  name: string;
  logo: string;
}

interface BudgetBucketProps {
  bucket: Bucket;
  totalBudget: number;
  onDelete: () => void;
  onUpdate: (bucket: Bucket) => void;
  onSliderChange: (id: string, percentage: number) => void;
  onAmountChange: (id: string, amount: number) => void;
  onColorChange: (id: string, color: string) => void;
  availableColors: string[];
  publisherLogos: Publisher[];
  formatCurrency: (amount: number) => string;
}

const BudgetBucket: React.FC<BudgetBucketProps> = ({
  bucket,
  totalBudget,
  onDelete,
  onUpdate,
  onSliderChange,
  onAmountChange,
  onColorChange,
  availableColors,
  publisherLogos,
  formatCurrency
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(bucket.name);
  const [editDescription, setEditDescription] = useState(bucket.description);
  const [editTarget, setEditTarget] = useState(bucket.target);
  const [editPercentage, setEditPercentage] = useState(bucket.percentage);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Formatage des chiffres
  const formattedTarget = formatCurrency(bucket.target);
  const formattedActual = formatCurrency(bucket.actual);
  const difference = bucket.actual - bucket.target;
  const formattedDifference = formatCurrency(Math.abs(difference));
  const isDifferencePositive = difference > 0;

  // Cliquer en dehors pour fermer les dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mettre à jour les valeurs d'édition quand le bucket change
  useEffect(() => {
    setEditName(bucket.name);
    setEditDescription(bucket.description);
    setEditTarget(bucket.target);
    setEditPercentage(bucket.percentage);
  }, [bucket]);

  const handleEditSave = () => {
    onUpdate({
      ...bucket,
      name: editName,
      description: editDescription,
      target: editTarget,
      percentage: editPercentage
    });
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditName(bucket.name);
    setEditDescription(bucket.description);
    setEditTarget(bucket.target);
    setEditPercentage(bucket.percentage);
    setIsEditing(false);
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseFloat(e.target.value) || 0;
    setEditTarget(newAmount);
    
    // Calculer le nouveau pourcentage basé sur le montant
    if (totalBudget > 0) {
      const newPercentage = Math.round((newAmount / totalBudget) * 100);
      setEditPercentage(newPercentage);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercentage = parseInt(e.target.value);
    setEditPercentage(newPercentage);
    
    // Calculer le nouveau montant cible basé sur le pourcentage
    const newTarget = Math.round(totalBudget * newPercentage / 100);
    setEditTarget(newTarget);
  };

  // Liste des publishers dans ce bucket (pour affichage seulement)
  const bucketPublishers = publisherLogos.filter(publisher => 
    bucket.publishers.includes(publisher.id)
  );

  return (
    <div 
      className="rounded-lg shadow overflow-hidden"
      style={{ borderTop: `4px solid ${bucket.color}` }}
    >
      <div className="bg-white">
        {/* Header section with edit/delete buttons */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-start mb-2">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="font-bold text-lg w-full border-b border-gray-300 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            ) : (
              <h3 className="font-bold text-lg">{bucket.name}</h3>
            )}
            
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleEditSave}
                    className="text-green-600 hover:text-green-800"
                  >
                    <CheckIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={handleEditCancel}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={onDelete}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Description */}
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full text-sm text-gray-600 border border-gray-300 rounded p-2 focus:outline-none focus:border-indigo-500"
              rows={2}
            />
          ) : (
            <p className="text-sm text-gray-600">{bucket.description}</p>
          )}
          
          {/* Color picker button - visible only in edit mode */}
          {isEditing && (
            <div className="mt-3 relative" ref={colorPickerRef}>
              <button 
                className="text-xs flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              >
                <span 
                  className="w-4 h-4 rounded-full mr-1 inline-block border border-gray-300" 
                  style={{ backgroundColor: bucket.color }}
                ></span>
                Changer la couleur
              </button>
              
              {/* Color picker dropdown */}
              {isColorPickerOpen && (
                <div className="absolute mt-1 p-2 bg-white border border-gray-200 rounded-md shadow-lg z-10 flex space-x-2">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full border ${bucket.color === color ? 'border-gray-800 p-0.5' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        onColorChange(bucket.id, color);
                        setIsColorPickerOpen(false);
                      }}
                    >
                      {bucket.color === color && (
                        <div className="w-full h-full rounded-full flex items-center justify-center">
                          <CheckIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Target section */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Budget planifié</label>
            <div className="text-right">
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max={totalBudget}
                  value={editTarget}
                  onChange={handleAmountInputChange}
                  className="w-28 px-2 py-1 border border-gray-300 rounded text-right text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              ) : (
                <span className="text-lg font-bold text-gray-900">{formattedTarget}</span>
              )}
              <div className="text-xs text-gray-500">
                {isEditing ? `${editPercentage}% du budget` : `${bucket.percentage}% du budget`}
              </div>
            </div>
          </div>
          
          {/* Interactive slider - only editable in edit mode */}
          <div className="relative pt-4 pb-2">
            {isEditing ? (
              <input
                type="range"
                min="0"
                max="100"
                value={editPercentage}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            ) : (
              <div className="relative h-2 w-full bg-gray-200 rounded-lg">
                <div 
                  className="absolute h-2 rounded-l-lg bg-indigo-600"
                  style={{ width: `${bucket.percentage}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Actual section (placeholder) */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Assigné dans MediaBox</span>
            <div className="text-right">
              <span className="text-sm font-medium">{formattedActual}</span>
              <div className={`text-xs ${isDifferencePositive ? 'text-red-600' : 'text-green-600'}`}>
                {isDifferencePositive ? '+' : ''}{formattedDifference}
              </div>
            </div>
          </div>
        </div>
        
        {/* Publisher logos section - Static display only */}
        <div className="p-4">
          <div className="flex flex-wrap gap-1 items-center">
            {/* Afficher jusqu'à 3 logos maximum */}
            {bucketPublishers.slice(0, 3).map(publisher => (
              <div 
                key={publisher.id} 
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm border border-gray-200"
                title={publisher.name}
              >
                {publisher.logo}
              </div>
            ))}
            
            {/* Afficher une bulle "+X" si plus de 3 partenaires */}
            {bucketPublishers.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-700 border border-gray-300">
                +{bucketPublishers.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetBucket;