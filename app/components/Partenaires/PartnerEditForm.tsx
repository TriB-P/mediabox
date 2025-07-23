/**
 * Ce fichier définit le composant PartnerEditForm, qui est utilisé pour afficher et modifier les détails
 * d'un partenaire (stakeholder). Le composant possède deux états : un mode de visualisation pour afficher
 * les informations et un mode d'édition pour les modifier via un formulaire. Il interagit avec le
 * PartnerContext pour accéder aux données du partenaire sélectionné et pour déclencher les mises à jour.
 */
'use client';

import { useState, useEffect } from 'react';
import { usePartners } from '../../contexts/PartnerContext';

/**
 * Le composant PartnerEditForm gère l'affichage et la modification des détails d'un partenaire.
 * Il utilise l'état local pour gérer le mode (édition ou visualisation) et les données du formulaire.
 * Les données du partenaire proviennent du `PartnerContext`.
 * @returns {JSX.Element | null} Le JSX pour le formulaire d'édition ou la vue détaillée, ou null si aucun partenaire n'est sélectionné.
 */
export default function PartnerEditForm() {
  const { selectedPartner, updateSelectedPartner, setIsDrawerOpen } = usePartners();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    SH_Code: '',
    SH_Display_Name_FR: '',
    SH_Display_Name_EN: '',
    SH_Default_UTM: '',
    SH_Logo: '',
    SH_Type: ''
  });
  const [error, setError] = useState('');

  /**
   * Effet de bord qui s'exécute lorsque le partenaire sélectionné (`selectedPartner`) change.
   * Il initialise l'état local du formulaire (`formData`) avec les données du partenaire
   * pour pré-remplir les champs.
   */
  useEffect(() => {
    if (selectedPartner) {
      setFormData({
        SH_Code: selectedPartner.SH_Code || '',
        SH_Display_Name_FR: selectedPartner.SH_Display_Name_FR || '',
        SH_Display_Name_EN: selectedPartner.SH_Display_Name_EN || '',
        SH_Default_UTM: selectedPartner.SH_Default_UTM || '',
        SH_Logo: selectedPartner.SH_Logo || '',
        SH_Type: selectedPartner.SH_Type || ''
      });
    }
  }, [selectedPartner]);

  /**
   * Gère les changements de valeur des champs du formulaire.
   * Met à jour l'état `formData` avec la nouvelle valeur.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - L'événement de changement du champ.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Gère la soumission du formulaire d'édition.
   * Calcule les champs qui ont été modifiés, puis appelle la fonction `updateSelectedPartner`
   * du contexte pour enregistrer les changements dans Firebase.
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;

    try {
      setIsSubmitting(true);
      setError('');

      const updatedFields: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        // @ts-ignore
        if (value !== selectedPartner[key]) {
          updatedFields[key] = value;
        }
      });

      if (Object.keys(updatedFields).length === 0) {
        setIsEditing(false);
        return;
      }

      console.log(`FIREBASE: [ÉCRITURE] - Fichier: PartnerEditForm.tsx - Fonction: handleSubmit - Path: stakeholders/${selectedPartner.id}`);
      await updateSelectedPartner(updatedFields);
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la mise à jour du partenaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedPartner) {
    return null;
  }

  if (!isEditing) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Détails du partenaire</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary text-sm"
          >
            Modifier
          </button>
        </div>

        <div className="space-y-4">
          {selectedPartner.SH_Logo && (
            <div className="mb-4 flex justify-center">
              <img
                src={selectedPartner.SH_Logo}
                alt={`Logo ${selectedPartner.SH_Display_Name_FR}`}
                className="h-20 object-contain"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            <div>
              <span className="text-sm font-medium text-gray-500">ID</span>
              <p className="mt-1">{selectedPartner.id}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Code</span>
              <p className="mt-1">{selectedPartner.SH_Code}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Nom d'affichage (FR)</span>
              <p className="mt-1">{selectedPartner.SH_Display_Name_FR}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Nom d'affichage (EN)</span>
              <p className="mt-1">{selectedPartner.SH_Display_Name_EN || '-'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">UTM par défaut</span>
              <p className="mt-1">{selectedPartner.SH_Default_UTM || '-'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Type</span>
              <p className="mt-1">{selectedPartner.SH_Type || '-'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Logo URL</span>
              <p className="mt-1 break-all text-xs">{selectedPartner.SH_Logo || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Modifier le partenaire</h2>

      {error && (
        <div className="bg-red-50 text-red-500 p-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">ID</label>
          <input
            type="text"
            value={selectedPartner.id}
            disabled
            className="form-input bg-gray-100"
          />
        </div>

        <div>
          <label htmlFor="SH_Code" className="form-label">Code</label>
          <input
            id="SH_Code"
            name="SH_Code"
            type="text"
            value={formData.SH_Code}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div>
          <label htmlFor="SH_Display_Name_FR" className="form-label">Nom d'affichage (FR)</label>
          <input
            id="SH_Display_Name_FR"
            name="SH_Display_Name_FR"
            type="text"
            value={formData.SH_Display_Name_FR}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div>
          <label htmlFor="SH_Display_Name_EN" className="form-label">Nom d'affichage (EN)</label>
          <input
            id="SH_Display_Name_EN"
            name="SH_Display_Name_EN"
            type="text"
            value={formData.SH_Display_Name_EN}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="SH_Default_UTM" className="form-label">UTM par défaut</label>
          <input
            id="SH_Default_UTM"
            name="SH_Default_UTM"
            type="text"
            value={formData.SH_Default_UTM}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="SH_Type" className="form-label">Type</label>
          <input
            id="SH_Type"
            name="SH_Type"
            type="text"
            value={formData.SH_Type}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="SH_Logo" className="form-label">Logo URL</label>
          <input
            id="SH_Logo"
            name="SH_Logo"
            type="text"
            value={formData.SH_Logo}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        {formData.SH_Logo && (
          <div className="mt-2 flex justify-center">
            <img
              src={formData.SH_Logo}
              alt="Aperçu du logo"
              className="h-20 object-contain"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/150?text=Logo+Error';
              }}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}