/**
 * Ce fichier définit le composant React `ContactList`.
 * Son rôle est d'afficher une liste de contacts associés à un partenaire.
 * Il permet aux utilisateurs de voir les informations de base de chaque contact,
 * de déplier une section pour voir plus de détails, et d'accéder aux
 * fonctionnalités de modification et de suppression pour chaque contact.
 */
'use client';

import React, { useState } from 'react';
import { Contact } from '../../lib/contactService';
import { PencilIcon, TrashIcon, EnvelopeIcon, UserIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

interface ContactListProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
}

/**
 * Affiche une liste interactive de contacts.
 * @param {ContactListProps} props - Les propriétés du composant.
 * @param {Contact[]} props.contacts - Le tableau des contacts à afficher.
 * @param {(contact: Contact) => void} props.onEdit - La fonction à appeler lors du clic sur le bouton "Modifier".
 * @param {(contactId: string) => void} props.onDelete - La fonction à appeler lors du clic sur le bouton "Supprimer".
 * @returns {React.ReactElement} Le composant JSX représentant la liste des contacts.
 */
export default function ContactList({ contacts, onEdit, onDelete }: ContactListProps) {
  const { t } = useTranslation();
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  /**
   * Gère l'affichage (ouverture/fermeture) des détails d'un contact.
   * @param {string} contactId - L'identifiant du contact à afficher ou masquer.
   */
  const toggleExpand = (contactId: string) => {
    if (expandedContact === contactId) {
      setExpandedContact(null);
    } else {
      setExpandedContact(contactId);
    }
  };

  if (contacts.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        {t('contactList.emptyState.message')}
      </div>
    );
  }

  /**
   * Génère des badges visuels pour les langues parlées par un contact.
   * @param {{ FR: boolean; EN: boolean }} languages - Un objet indiquant les langues maîtrisées.
   * @returns {React.ReactElement[]} Un tableau d'éléments JSX représentant les badges.
   */
  const renderLanguageBadges = (languages: { FR: boolean; EN: boolean }) => {
    const badges = [];

    if (languages.FR) {
      badges.push(
        <span key="FR" className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1">
          FR
        </span>
      );
    }

    if (languages.EN) {
      badges.push(
        <span key="EN" className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          EN
        </span>
      );
    }

    return badges;
  };

  return (
    <ul className="divide-y divide-gray-200">
      {contacts.map((contact) => (
        <li key={contact.id} className="py-3">
          <div
            className="flex items-start justify-between cursor-pointer"
            onClick={() => toggleExpand(contact.id)}
          >
            <div className="flex items-center">
              <div className="bg-indigo-100 rounded-full p-2 mr-3">
                <UserIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {contact.firstName} {contact.lastName}{' '}
                  <span className="ml-1">
                    {renderLanguageBadges(contact.languages)}
                  </span>
                </p>
                <p className="text-sm text-gray-500 flex items-center">
                  <EnvelopeIcon className="h-3 w-3 mr-1" />
                  {contact.email}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(contact);
                }}
                className="text-gray-400 hover:text-indigo-600"
                title={t('contactList.actions.edit')}
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(t('contactList.actions.confirmDelete'))) {
                    onDelete(contact.id);
                  }
                }}
                className="text-gray-400 hover:text-red-600"
                title={t('contactList.actions.delete')}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {expandedContact === contact.id && (
            <div className="mt-3 ml-10 p-3 bg-gray-50 rounded-md text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-gray-500">{t('contactList.details.languages')}:</span>{' '}
                  <span className="text-gray-900">
                    {contact.languages.FR && contact.languages.EN ? t('contactList.details.frenchAndEnglish') :
                     contact.languages.FR ? t('contactList.details.french') :
                     contact.languages.EN ? t('contactList.details.english') : t('contactList.details.notSpecified')}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">{t('contactList.details.createdAt')}:</span>{' '}
                  <span className="text-gray-900">{new Date(contact.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {contact.comment && (
                <div className="mt-2">
                  <span className="font-medium text-gray-500">{t('contactList.details.comment')}:</span>
                  <p className="mt-1 text-gray-900">{contact.comment}</p>
                </div>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}