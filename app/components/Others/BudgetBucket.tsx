/**
 * Ce fichier définit le composant React `BudgetBucket`.
 * Ce composant est responsable de l'affichage d'un "bucket" (une catégorie) de budget.
 * Il permet à l'utilisateur de voir les détails du budget, de le modifier (nom, description, montant)
 * et de le supprimer. Il gère son propre état d'édition et communique avec le composant parent
 * via des fonctions de rappel (callbacks) pour mettre à jour ou supprimer les données.
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

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

/**
 * Affiche une carte pour un "bucket" de budget individuel.
 * Gère l'affichage, le mode édition, la mise à jour, et la suppression de ce bucket.
 * @param {BudgetBucketProps} props - Les propriétés du composant.
 * @param {Bucket} props.bucket - L'objet contenant les données du bucket.
 * @param {number} props.totalBudget - Le budget total pour calculer les pourcentages.
 * @param {() => void} props.onDelete - Callback pour supprimer le bucket.
 * @param {(bucket: Bucket) => void} props.onUpdate - Callback pour mettre à jour le bucket.
 * @param {(id: string, percentage: number) => void} props.onSliderChange - Callback pour changer le pourcentage (non utilisé directement).
 * @param {(id: string, amount: number) => void} props.onAmountChange - Callback pour changer le montant (non utilisé directement).
 * @param {(id: string, color: string) => void} props.onColorChange - Callback pour changer la couleur du bucket.
 * @param {string[]} props.availableColors - La liste des couleurs disponibles pour le sélecteur.
 * @param {Publisher[]} props.publisherLogos - La liste des éditeurs avec leurs logos.
 * @param {(amount: number) => string} props.formatCurrency - Fonction pour formater un nombre en devise.
 * @returns {React.ReactElement} Le JSX du composant BudgetBucket.
 */
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

  const formattedTarget = formatCurrency(bucket.target);
  const formattedActual = formatCurrency(bucket.actual);
  const difference = bucket.actual - bucket.target;
  const formattedDifference = formatCurrency(Math.abs(difference));
  const isDifferencePositive = difference > 0;

  /**
   * Hook d'effet pour gérer la fermeture du sélecteur de couleur
   * lorsqu'un clic est détecté en dehors de celui-ci.
   */
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

  /**
   * Hook d'effet pour synchroniser l'état d'édition local
   * avec les données du bucket si celles-ci changent depuis le parent.
   */
  useEffect(() => {
    setEditName(bucket.name);
    setEditDescription(bucket.description);
    setEditTarget(bucket.target);
    setEditPercentage(bucket.percentage);
  }, [bucket]);

  /**
   * Sauvegarde les modifications apportées au bucket en appelant la fonction `onUpdate`
   * et désactive le mode édition.
   */
  const handleEditSave = () => {
    console.log(`FIREBASE: ÉCRITURE - Fichier: BudgetBucket.tsx - Fonction: handleEditSave - Path: budgets/${bucket.id}`);
    onUpdate({
      ...bucket,
      name: editName,
      description: editDescription,
      target: editTarget,
      percentage: editPercentage
    });
    setIsEditing(false);
  };

  /**
   * Annule les modifications en cours, réinitialise les champs
   * à leurs valeurs d'origine et désactive le mode édition.
   */
  const handleEditCancel = () => {
    setEditName(bucket.name);
    setEditDescription(bucket.description);
    setEditTarget(bucket.target);
    setEditPercentage(bucket.percentage);
    setIsEditing(false);
  };

  /**
   * Gère le changement de la valeur dans le champ de saisie du montant.
   * Met à jour le montant et recalcule le pourcentage correspondant par rapport au budget total.
   * @param {React.ChangeEvent<HTMLInputElement>} e - L'événement de changement du champ de saisie.
   */
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseFloat(e.target.value) || 0;
    setEditTarget(newAmount);
    
    if (totalBudget > 0) {
      const newPercentage = Math.round((newAmount / totalBudget) * 100);
      setEditPercentage(newPercentage);
    }
  };

  /**
   * Gère le changement de la valeur du curseur (slider) de pourcentage.
   * Met à jour le pourcentage et recalcule le montant cible correspondant.
   * @param {React.ChangeEvent<HTMLInputElement>} e - L'événement de changement du curseur.
   */
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercentage = parseInt(e.target.value);
    setEditPercentage(newPercentage);
    
    const newTarget = Math.round(totalBudget * newPercentage / 100);
    setEditTarget(newTarget);
  };

  const bucketPublishers = publisherLogos.filter(publisher => 
    bucket.publishers.includes(publisher.id)
  );

  return (
    <div 
      className="rounded-lg shadow overflow-hidden"
      style={{ borderTop: `4px solid ${bucket.color}` }}
    >
      <div className="bg-white">
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
                    onClick={() => {
                        console.log(`FIREBASE: ÉCRITURE - Fichier: BudgetBucket.tsx - Fonction: onDelete (inline) - Path: budgets/${bucket.id}`);
                        onDelete();
                    }}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
          
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
              
              {isColorPickerOpen && (
                <div className="absolute mt-1 p-2 bg-white border border-gray-200 rounded-md shadow-lg z-10 flex space-x-2">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full border ${bucket.color === color ? 'border-gray-800 p-0.5' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        console.log(`FIREBASE: ÉCRITURE - Fichier: BudgetBucket.tsx - Fonction: onColorChange (inline) - Path: budgets/${bucket.id}`);
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
        
        <div className="p-4">
          <div className="flex flex-wrap gap-1 items-center">
            {bucketPublishers.slice(0, 3).map(publisher => (
              <div 
                key={publisher.id} 
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm border border-gray-200"
                title={publisher.name}
              >
                {publisher.logo}
              </div>
            ))}
            
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