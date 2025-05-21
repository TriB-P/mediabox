'use client';

import { useState, useEffect } from 'react';
import { usePartners } from '../../contexts/PartnerContext';

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

  // Initialiser le formulaire avec les données du partenaire sélectionné
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

  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;

    try {
      setIsSubmitting(true);
      setError('');

      // Création de l'objet de mise à jour en ne gardant que les champs modifiés
      const updatedFields: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        // @ts-ignore
        if (value !== selectedPartner[key]) {
          updatedFields[key] = value;
        }
      });

      // Si aucun champ n'a été modifié, simplement fermer le mode édition
      if (Object.keys(updatedFields).length === 0) {
        setIsEditing(false);
        return;
      }

      // Effectuer la mise à jour
      await updateSelectedPartner(updatedFields);
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la mise à jour du partenaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si aucun partenaire n'est sélectionné, ne rien afficher
  if (!selectedPartner) {
    return null;
  }

  // Mode vue (non édition)
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
          {/* Logo */}
          {selectedPartner.SH_Logo && (
            <div className="mb-4 flex justify-center">
              <img 
                src={selectedPartner.SH_Logo} 
                alt={`Logo ${selectedPartner.SH_Display_Name_FR}`} 
                className="h-20 object-contain"
              />
            </div>
          )}

          {/* Information détails */}
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

  // Mode édition
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Modifier le partenaire</h2>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Champ non modifiable: ID */}
        <div>
          <label className="form-label">ID</label>
          <input
            type="text"
            value={selectedPartner.id}
            disabled
            className="form-input bg-gray-100"
          />
        </div>
        
        {/* Code */}
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
        
        {/* Nom d'affichage (FR) */}
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
        
        {/* Nom d'affichage (EN) */}
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
        
        {/* UTM par défaut */}
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
        
        {/* Type */}
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
        
        {/* Logo URL */}
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
        
        {/* Logo preview */}
        {formData.SH_Logo && (
          <div className="mt-2 flex justify-center">
            <img 
              src={formData.SH_Logo}
              alt="Aperçu du logo"
              className="h-20 object-contain"
              onError={(e) => {
                // Gérer les erreurs de chargement d'image
                e.currentTarget.src = 'https://via.placeholder.com/150?text=Logo+Error';
              }}
            />
          </div>
        )}
        
        {/* Boutons d'action */}
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