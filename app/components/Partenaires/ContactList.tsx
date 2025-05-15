'use client';

import React, { useState } from 'react';
import { Contact } from '../../lib/contactService';
import { PencilIcon, TrashIcon, EnvelopeIcon, UserIcon } from '@heroicons/react/24/outline';

interface ContactListProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
}

export default function ContactList({ contacts, onEdit, onDelete }: ContactListProps) {
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  
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
        Aucun contact n'a été ajouté pour ce partenaire.
      </div>
    );
  }
  
  // Rendu des badges de langue
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
                  {contact.firstName} {contact.lastName} {' '}
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
                title="Modifier"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contact?')) {
                    onDelete(contact.id);
                  }
                }}
                className="text-gray-400 hover:text-red-600"
                title="Supprimer"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Détails étendus */}
          {expandedContact === contact.id && (
            <div className="mt-3 ml-10 p-3 bg-gray-50 rounded-md text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-gray-500">Langues:</span>{' '}
                  <span className="text-gray-900">
                    {contact.languages.FR && contact.languages.EN ? 'Français et Anglais' :
                     contact.languages.FR ? 'Français' : 
                     contact.languages.EN ? 'Anglais' : 'Non spécifié'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Créé le:</span>{' '}
                  <span className="text-gray-900">{new Date(contact.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              {contact.comment && (
                <div className="mt-2">
                  <span className="font-medium text-gray-500">Commentaire:</span>
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