/**
 * Ce fichier définit le composant SpecForm, qui est un formulaire réutilisable
 * pour créer ou modifier une spécification technique (Spec). Il gère l'état
 * des champs du formulaire, la validation des entrées et la soumission des données.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Spec, SpecFormData } from '../../lib/specService';
import { CheckIcon } from '@heroicons/react/24/outline';

interface SpecFormProps {
  spec?: Spec;
  onSubmit: (specData: SpecFormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Affiche un formulaire pour créer ou éditer une spécification.
 * @param {SpecFormProps} props - Les propriétés du composant.
 * @param {Spec} [props.spec] - L'objet de spécification existant à modifier. Si non fourni, le formulaire est en mode création.
 * @param {(specData: SpecFormData) => Promise<void>} props.onSubmit - La fonction à appeler lors de la soumission du formulaire. Elle reçoit les données du formulaire.
 * @param {() => void} props.onCancel - La fonction à appeler lorsque l'utilisateur annule l'opération.
 * @returns {React.ReactElement} Le composant de formulaire.
 */
export default function SpecForm({ spec, onSubmit, onCancel }: SpecFormProps) {
  const [formData, setFormData] = useState<SpecFormData>({
    name: '',
    format: '',
    ratio: '',
    fileType: '',
    maxWeight: '',
    weight: '',
    animation: '',
    title: '',
    text: '',
    specSheetLink: '',
    notes: '',
  });

  const [errors, setErrors] = useState<{
    name?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  /**
   * Effet qui s'exécute lorsque le composant est monté ou que la prop 'spec' change.
   * Si une 'spec' est fournie (mode édition), ses données sont utilisées pour pré-remplir le formulaire.
   */
  useEffect(() => {
    if (spec) {
      setFormData({
        name: spec.name,
        format: spec.format || '',
        ratio: spec.ratio || '',
        fileType: spec.fileType || '',
        maxWeight: spec.maxWeight || '',
        weight: spec.weight || '',
        animation: spec.animation || '',
        title: spec.title || '',
        text: spec.text || '',
        specSheetLink: spec.specSheetLink || '',
        notes: spec.notes || '',
      });
    }
  }, [spec]);

  /**
   * Gère les changements dans les champs de saisie (input, textarea).
   * Met à jour l'état du formulaire avec la nouvelle valeur et efface les messages d'erreur
   * associés au champ modifié.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - L'événement de changement.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  /**
   * Valide les données du formulaire. Pour l'instant, vérifie uniquement si le nom n'est pas vide.
   * Met à jour l'état des erreurs et retourne un booléen indiquant si le formulaire est valide.
   * @returns {boolean} True si le formulaire est valide, sinon false.
   */
  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
    } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Gère la soumission du formulaire.
   * Empêche l'envoi par défaut, valide le formulaire, et si valide,
   * appelle la fonction 'onSubmit' avec les données. Affiche une notification de succès
   * puis ferme ou réinitialise le formulaire.
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);

      setShowSuccess(true);

      setTimeout(() => {
        if (!spec) {
          setFormData({
            name: '',
            format: '',
            ratio: '',
            fileType: '',
            maxWeight: '',
            weight: '',
            animation: '',
            title: '',
            text: '',
            specSheetLink: '',
            notes: '',
          });
        }

        setShowSuccess(false);
        onCancel();
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      setShowSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10 rounded-md">
          <div className="bg-green-100 text-green-800 p-4 rounded-md flex items-center shadow-md">
            <CheckIcon className="h-6 w-6 mr-2 text-green-600" />
            <span className="font-medium">
              Spécification sauvegardée avec succès!
            </span>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-gray-50 p-4 rounded-md border border-gray-200"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Nom de la spécification *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.name
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="format"
              className="block text-sm font-medium text-gray-700"
            >
              Format
            </label>
            <input
              type="text"
              id="format"
              name="format"
              value={formData.format}
              onChange={handleChange}
              placeholder="ex: 300x250"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="ratio"
              className="block text-sm font-medium text-gray-700"
            >
              Ratio
            </label>
            <input
              type="text"
              id="ratio"
              name="ratio"
              value={formData.ratio}
              onChange={handleChange}
              placeholder="ex: 16:9"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="fileType"
              className="block text-sm font-medium text-gray-700"
            >
              Type de fichier
            </label>
            <input
              type="text"
              id="fileType"
              name="fileType"
              value={formData.fileType}
              onChange={handleChange}
              placeholder="ex: JPG, PNG, GIF"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="animation"
              className="block text-sm font-medium text-gray-700"
            >
              Animation
            </label>
            <input
              type="text"
              id="animation"
              name="animation"
              value={formData.animation}
              onChange={handleChange}
              placeholder="ex: Autorisée, Non autorisée"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="maxWeight"
              className="block text-sm font-medium text-gray-700"
            >
              Poids maximal
            </label>
            <input
              type="text"
              id="maxWeight"
              name="maxWeight"
              value={formData.maxWeight}
              onChange={handleChange}
              placeholder="ex: 100 Ko"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="weight"
              className="block text-sm font-medium text-gray-700"
            >
              Poids maximal si HTML 5
            </label>
            <input
              type="text"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="ex: 80 Ko"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Titre
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="ex: Max 50 caractères"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="text"
              className="block text-sm font-medium text-gray-700"
            >
              Texte
            </label>
            <input
              type="text"
              id="text"
              name="text"
              value={formData.text}
              onChange={handleChange}
              placeholder="ex: Texte court descriptif"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="specSheetLink"
            className="block text-sm font-medium text-gray-700"
          >
            Lien vers feuille de specs
          </label>
          <input
            type="text"
            id="specSheetLink"
            name="specSheetLink"
            value={formData.specSheetLink}
            onChange={handleChange}
            placeholder="https://example.com/specs.pdf"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700"
          >
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notes additionnelles"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Enregistrement...'
              : spec
                ? 'Mettre à jour'
                : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
}