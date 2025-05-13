'use client';

import React, { useState, useEffect } from 'react';
import { Contact, ContactFormData } from '../lib/contactService';
import { CheckIcon } from '@heroicons/react/24/outline';

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (contactData: ContactFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ContactForm({ contact, onSubmit, onCancel }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    languages: { FR: true, EN: false },
    comment: '',
  });
  
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
  }>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Si on modifie un contact existant, initialiser le formulaire avec ses données
  useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        languages: contact.languages || { FR: true, EN: false },
        comment: contact.comment || '',
      });
    }
  }, [contact]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Effacer l'erreur lorsqu'on modifie le champ
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleLanguageChange = (language: 'FR' | 'EN') => {
    setFormData(prev => ({
      ...prev,
      languages: {
        ...prev.languages,
        [language]: !prev.languages[language]
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: {
      firstName?: string;
      lastName?: string;
      email?: string;
    } = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    // Vérifier qu'au moins une langue est sélectionnée
    if (!formData.languages.FR && !formData.languages.EN) {
      // Sélectionner FR par défaut si aucune langue n'est choisie
      setFormData(prev => ({
        ...prev,
        languages: { ...prev.languages, FR: true }
      }));
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      
      // Afficher un message de succès
      setShowSuccess(true);
      
      // Après 2 secondes, fermer le formulaire
      setTimeout(() => {
        if (!contact) {
          // Réinitialiser le formulaire si c'est un nouveau contact
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            languages: { FR: true, EN: false },
            comment: '',
          });
        }
        
        // Fermer le message de succès et le formulaire
        setShowSuccess(false);
        onCancel(); // Ferme le formulaire et retourne à la liste
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
            <span className="font-medium">Contact sauvegardé avec succès!</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-md border border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          {/* Prénom */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              Prénom *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.firstName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>
          
          {/* Nom */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Nom *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.lastName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>
        
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
        
        {/* Langues - Checkboxes au lieu d'un select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Langues préférées
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="language-fr"
                type="checkbox"
                checked={formData.languages.FR}
                onChange={() => handleLanguageChange('FR')}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="language-fr" className="ml-2 block text-sm text-gray-900">
                Français
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="language-en"
                type="checkbox"
                checked={formData.languages.EN}
                onChange={() => handleLanguageChange('EN')}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="language-en" className="ml-2 block text-sm text-gray-900">
                Anglais
              </label>
            </div>
          </div>
        </div>
        
        {/* Commentaire */}
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
        
        {/* Boutons d'action */}
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
            {isSubmitting ? 'Enregistrement...' : contact ? 'Mettre à jour' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
}