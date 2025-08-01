/**
 * Ce fichier définit le composant React `ContactForm`.
 * Il s'agit d'un formulaire réutilisable pour créer un nouveau contact ou modifier un contact existant.
 * Il gère son propre état pour les champs du formulaire, la validation et les retours visuels à l'utilisateur (messages de succès, erreurs).
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Contact, ContactFormData } from '../../lib/contactService';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (contactData: ContactFormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Composant de formulaire pour la création et la mise à jour de contacts.
 * @param {Contact} [contact] - Les données du contact existant à modifier. Si non fourni, le formulaire est en mode création.
 * @param {Function} onSubmit - La fonction à appeler lors de la soumission du formulaire. Reçoit les données du formulaire.
 * @param {Function} onCancel - La fonction à appeler pour annuler l'opération et fermer le formulaire.
 * @returns {JSX.Element} Le formulaire de contact rendu.
 */
export default function ContactForm({ contact, onSubmit, onCancel }: ContactFormProps) {
  const { t } = useTranslation();
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

  /**
   * Effet qui pré-remplit le formulaire avec les données d'un contact existant
   * lorsque le composant est utilisé en mode "modification".
   */
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

  /**
   * Gère les changements de valeur des champs de saisie (input, textarea).
   * Met à jour l'état du formulaire et efface l'erreur de validation associée au champ modifié.
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
   * Gère le changement d'état des cases à cocher pour les langues.
   * @param {'FR' | 'EN'} language - La langue dont l'état doit être basculé.
   */
  const handleLanguageChange = (language: 'FR' | 'EN') => {
    setFormData(prev => ({
      ...prev,
      languages: {
        ...prev.languages,
        [language]: !prev.languages[language]
      }
    }));
  };

  /**
   * Valide les données du formulaire.
   * Vérifie que le prénom, le nom et l'email sont présents et valides.
   * S'assure qu'au moins une langue est sélectionnée, sinon sélectionne 'FR' par défaut.
   * @returns {boolean} `true` si le formulaire est valide, sinon `false`.
   */
  const validateForm = (): boolean => {
    const newErrors: {
      firstName?: string;
      lastName?: string;
      email?: string;
    } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('contactForm.errors.firstNameRequired');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('contactForm.errors.lastNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('contactForm.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('contactForm.errors.emailInvalid');
    }

    if (!formData.languages.FR && !formData.languages.EN) {
      setFormData(prev => ({
        ...prev,
        languages: { ...prev.languages, FR: true }
      }));
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Gère la soumission du formulaire.
   * Prévient le comportement par défaut, valide les données, et appelle la fonction `onSubmit` passée en props.
   * Gère l'état de soumission et affiche un message de succès avant de fermer le formulaire.
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
        if (!contact) {
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            languages: { FR: true, EN: false },
            comment: '',
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
            <span className="font-medium">{t('contactForm.success.message')}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-md border border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              {t('contactForm.labels.firstName')}
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

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              {t('contactForm.labels.lastName')}
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

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('contactForm.labels.email')}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('contactForm.labels.preferredLanguages')}
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
                {t('contactForm.labels.french')}
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
                {t('contactForm.labels.english')}
              </label>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
            {t('contactForm.labels.comment')}
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={3}
            value={formData.comment}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder={t('contactForm.placeholders.additionalInfo')}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            {t('contactForm.buttons.cancel')}
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('contactForm.buttons.saving') : contact ? t('contactForm.buttons.update') : t('contactForm.buttons.add')}
          </button>
        </div>
      </form>
    </div>
  );
}