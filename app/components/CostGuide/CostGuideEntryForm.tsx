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

interface CostGuideEntryFormProps {
  guideId: string;
  entry: CostGuideEntry | null;
  partners: any[];
  preset?: {
    partnerId?: string;
    level1?: string;
    level2?: string;
  };
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * Affiche un formulaire pour créer ou modifier une entrée dans un guide de coûts.
 * @param {CostGuideEntryFormProps} props - Les propriétés du composant.
 * @param {string} props.guideId - L'ID du guide de coûts auquel l'entrée appartient.
 * @param {CostGuideEntry | null} props.entry - L'entrée à modifier. Si null, le formulaire est en mode création.
 * @param {any[]} props.partners - La liste des partenaires à afficher dans le sélecteur.
 * @param {object} [props.preset] - Valeurs prédéfinies pour certains champs du formulaire.
 * @param {() => void} props.onCancel - Fonction appelée lorsque l'utilisateur annule.
 * @param {() => void} props.onSuccess - Fonction appelée après une soumission réussie.
 * @returns {JSX.Element} Le composant de formulaire.
 */
export default function CostGuideEntryForm({
  guideId,
  entry,
  partners,
  preset = {},
  onCancel,
  onSuccess,
}: CostGuideEntryFormProps) {
  const [formData, setFormData] = useState<CostGuideEntryFormData>({
    partnerId: '',
    level1: '',
    level2: '',
    level3: '',
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
        partnerId: entry.partnerId,
        level1: entry.level1,
        level2: entry.level2,
        level3: entry.level3,
        purchaseUnit: entry.purchaseUnit,
        unitPrice: entry.unitPrice.toString(),
        comment: entry.comment || '',
      });
    } else if (preset && Object.keys(preset).length > 0) {
      setFormData(prev => ({
        ...prev,
        partnerId: preset.partnerId || prev.partnerId,
        level1: preset.level1 || prev.level1,
        level2: preset.level2 || prev.level2,
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

    if (!formData.partnerId) {
      newErrors.partnerId = 'Le partenaire est requis';
    }

    if (!formData.level1) {
      newErrors.level1 = 'L\'information de niveau 1 est requise';
    }

    if (!formData.level2) {
      newErrors.level2 = 'L\'information de niveau 2 est requise';
    }

    if (!formData.level3) {
      newErrors.level3 = 'L\'information de niveau 3 est requise';
    }

    if (!formData.unitPrice) {
      newErrors.unitPrice = 'Le montant unitaire est requis';
    } else if (isNaN(Number(formData.unitPrice))) {
      newErrors.unitPrice = 'Le montant doit être un nombre';
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

      const selectedPartner = partners.find(p => p.id === formData.partnerId);
      const partnerName = selectedPartner ? selectedPartner.SH_Display_Name_FR : '';

      if (entry) {
        console.log(`FIREBASE: ÉCRITURE - Fichier: CostGuideEntryForm.tsx - Fonction: handleSubmit - Path: costGuides/${guideId}/entries/${entry.id}`);
        await updateCostGuideEntry(guideId, entry.id, formData, partnerName);
      } else {
        console.log(`FIREBASE: ÉCRITURE - Fichier: CostGuideEntryForm.tsx - Fonction: handleSubmit - Path: costGuides/${guideId}/entries`);
        await addCostGuideEntry(guideId, formData, partnerName);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err) {
      console.error('Erreur lors de la soumission du formulaire:', err);
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
            <span className="font-medium">Entrée sauvegardée avec succès!</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {entry ? 'Modifier l\'entrée' : 'Ajouter une entrée'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div>
          <label htmlFor="partnerId" className="block text-sm font-medium text-gray-700">
            Partenaire *
          </label>
          <select
            id="partnerId"
            name="partnerId"
            value={formData.partnerId}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.partnerId
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
            }`}
          >
            <option value="">Sélectionner un partenaire</option>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.SH_Display_Name_FR}
              </option>
            ))}
          </select>
          {errors.partnerId && (
            <p className="mt-1 text-sm text-red-600">{errors.partnerId}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="level1" className="block text-sm font-medium text-gray-700">
              Niveau 1 *
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
              Niveau 2 *
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

          <div>
            <label htmlFor="level3" className="block text-sm font-medium text-gray-700">
              Niveau 3 *
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
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="purchaseUnit" className="block text-sm font-medium text-gray-700">
              Unité d'achat *
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
              <option value="Unitaire">Unitaire</option>
            </select>
          </div>

          <div>
            <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">
              Montant unitaire * (CAD)
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
            Commentaire
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={3}
            value={formData.comment}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Informations supplémentaires..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={submitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={submitting}
          >
            {submitting
              ? 'Enregistrement...'
              : entry
              ? 'Mettre à jour'
              : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
}