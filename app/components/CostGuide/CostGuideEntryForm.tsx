// app/components/CostGuide/CostGuideEntryForm.tsx
/**
 * Ce fichier contient le formulaire qui permet d'ajouter ou de modifier une entrée dans un guide de coûts.
 * Il gère les champs du formulaire, vérifie que les données sont correctes avant de les envoyer,
 * et communique avec la base de données pour sauvegarder les informations.
 */
'use client';

import { useState, useEffect } from 'react';
import { CostGuideEntry, PurchaseUnit, CostGuideEntryFormData } from '../../types/costGuide';
import {
  addCostGuideEntry,
  updateCostGuideEntry,
} from '../../lib/costGuideService';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

interface CostGuideEntryFormProps {
  guideId: string;
  entry: CostGuideEntry | null;
  preset?: {
    level1?: string;
    level2?: string;
    level3?: string;
    level4?: string;
  };
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * Affiche un formulaire pour créer ou modifier une entrée dans un guide de coûts.
 * @param {CostGuideEntryFormProps} props - Les propriétés du composant.
 * @param {string} props.guideId - L'ID du guide de coûts auquel l'entrée appartient.
 * @param {CostGuideEntry | null} props.entry - L'entrée à modifier. Si null, le formulaire est en mode création.
 * @param {object} [props.preset] - Valeurs prédéfinies pour certains champs du formulaire.
 * @param {() => void} props.onCancel - Fonction appelée lorsque l'utilisateur annule.
 * @param {() => void} props.onSuccess - Fonction appelée après une soumission réussie.
 * @returns {JSX.Element} Le composant de formulaire.
 */
export default function CostGuideEntryForm({
  guideId,
  entry,
  preset = {},
  onCancel,
  onSuccess,
}: CostGuideEntryFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CostGuideEntryFormData>({
    level1: '',
    level2: '',
    level3: '',
    level4: '',
    purchaseUnit: 'CPM',
    unitPrice: '',
    comment: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (entry) {
      setFormData({
        level1: entry.level1,
        level2: entry.level2,
        level3: entry.level3,
        level4: entry.level4,
        purchaseUnit: entry.purchaseUnit,
        unitPrice: entry.unitPrice.toString(),
        comment: entry.comment || '',
      });
    } else if (preset && Object.keys(preset).length > 0) {
      setFormData(prev => ({
        ...prev,
        level1: preset.level1 || prev.level1,
        level2: preset.level2 || prev.level2,
        level3: preset.level3 || prev.level3,
        level4: preset.level4 || prev.level4,
      }));
    }
  }, [entry, preset]);

  /**
   * Gère les changements dans les champs du formulaire.
   * Met à jour l'état du formulaire avec la nouvelle valeur et efface les erreurs associées au champ modifié.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>} e - L'événement de changement du champ.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  /**
   * Valide les données du formulaire.
   * Vérifie que tous les champs requis sont remplis et que les valeurs sont correctes.
   * @returns {boolean} - 'true' si le formulaire est valide, sinon 'false'.
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.level1) {
      newErrors.level1 = t('costGuideForm.errors.level1Required');
    }

    if (!formData.level2) {
      newErrors.level2 = t('costGuideForm.errors.level2Required');
    }

    if (!formData.level3) {
      newErrors.level3 = t('costGuideForm.errors.level3Required');
    }

    if (!formData.level4) {
      newErrors.level4 = t('costGuideForm.errors.level4Required');
    }

    if (!formData.unitPrice) {
      newErrors.unitPrice = t('costGuideForm.errors.unitPriceRequired');
    } else if (isNaN(Number(formData.unitPrice))) {
      newErrors.unitPrice = t('costGuideForm.errors.unitPriceInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Gère la soumission du formulaire.
   * Valide les données, puis appelle le service approprié pour ajouter ou mettre à jour l'entrée dans Firebase.
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      if (entry) {
        console.log(`FIREBASE: ÉCRITURE - Fichier: CostGuideEntryForm.tsx - Fonction: handleSubmit - Path: costGuides/${guideId}/entries/${entry.id}`);
        await updateCostGuideEntry(guideId, entry.id, formData);
      } else {
        console.log(`FIREBASE: ÉCRITURE - Fichier: CostGuideEntryForm.tsx - Fonction: handleSubmit - Fonction: handleSubmit - Path: costGuides/${guideId}/entries`);
        await addCostGuideEntry(guideId, formData);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err) {
      console.error(t('costGuideForm.submissionError'), err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {success && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10 rounded-md">
          <div className="bg-green-100 text-green-800 p-4 rounded-md flex items-center shadow-md">
            <CheckIcon className="h-6 w-6 mr-2 text-green-600" />
            <span className="font-medium">{t('costGuideForm.successMessage')}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {entry ? t('costGuideForm.editEntry') : t('costGuideForm.addEntry')}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="level1" className="block text-sm font-medium text-gray-700">
              {t('costGuideForm.level1Label')} *
            </label>
            <input
              type="text"
              id="level1"
              name="level1"
              value={formData.level1}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.level1
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {errors.level1 && (
              <p className="mt-1 text-sm text-red-600">{errors.level1}</p>
            )}
          </div>

          <div>
            <label htmlFor="level2" className="block text-sm font-medium text-gray-700">
              {t('costGuideForm.level2Label')} *
            </label>
            <input
              type="text"
              id="level2"
              name="level2"
              value={formData.level2}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.level2
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {errors.level2 && (
              <p className="mt-1 text-sm text-red-600">{errors.level2}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="level3" className="block text-sm font-medium text-gray-700">
              {t('costGuideForm.level3Label')} *
            </label>
            <input
              type="text"
              id="level3"
              name="level3"
              value={formData.level3}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.level3
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {errors.level3 && (
              <p className="mt-1 text-sm text-red-600">{errors.level3}</p>
            )}
          </div>

          <div>
            <label htmlFor="level4" className="block text-sm font-medium text-gray-700">
              {t('costGuideForm.level4Label')} *
            </label>
            <input
              type="text"
              id="level4"
              name="level4"
              value={formData.level4}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.level4
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {errors.level4 && (
              <p className="mt-1 text-sm text-red-600">{errors.level4}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="purchaseUnit" className="block text-sm font-medium text-gray-700">
              {t('costGuideForm.purchaseUnitLabel')} *
            </label>
            <select
              id="purchaseUnit"
              name="purchaseUnit"
              value={formData.purchaseUnit}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="CPM">CPM</option>
              <option value="PEB">PEB</option>
              <option value="Unitaire">{t('costGuideForm.unitOption')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">
              {t('costGuideForm.unitPriceLabel')} * (CAD)
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="text"
                id="unitPrice"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                className={`block w-full rounded-md pl-7 sm:text-sm ${
                  errors.unitPrice
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.unitPrice && (
              <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
            {t('costGuideForm.commentLabel')}
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={3}
            value={formData.comment}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder={t('costGuideForm.commentPlaceholder')}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={submitting}
          >
            {t('costGuideForm.cancelButton')}
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={submitting}
          >
            {submitting
              ? t('costGuideForm.savingButton')
              : entry
              ? t('costGuideForm.updateButton')
              : t('costGuideForm.addButton')}
          </button>
        </div>
      </form>
    </div>
  );
}