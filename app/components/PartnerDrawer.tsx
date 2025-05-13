'use client';

import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserIcon, BuildingOfficeIcon, PlusIcon } from '@heroicons/react/24/outline';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { Contact, ContactFormData, getPartnerContacts, addContact, updateContact, deleteContact } from '../lib/contactService';
import ContactForm from './ContactForm';
import ContactList from './ContactList';

// Type pour les partenaires
interface Partner {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
  SH_Default_UTM?: string;
  SH_Logo?: string;
  SH_Type?: string;
  SH_Tags?: string | string[]; // Peut être une chaîne ou un tableau
}

interface PartnerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
}

export default function PartnerDrawer({ isOpen, onClose, partner }: PartnerDrawerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  
  const categories = [
    { name: 'Informations', icon: BuildingOfficeIcon },
    { name: 'Contacts', icon: UserIcon },
  ];

  // Effet pour charger l'image lorsqu'un nouveau partenaire est sélectionné
  useEffect(() => {
    // Toujours réinitialiser l'URL de l'image quand le partenaire change
    setImageUrl(null);
    setImageError(false);
    
    if (partner && partner.SH_Logo) {
      setImageLoading(true);

      const loadImage = async () => {
        try {
          const storage = getStorage();
          
          if (partner.SH_Logo?.startsWith('gs://')) {
            // Si c'est une référence de stockage Firebase (gs://)
            const storageRef = ref(storage, partner.SH_Logo);
            const url = await getDownloadURL(storageRef);
            setImageUrl(url);
          } else {
            // Si c'est déjà une URL HTTP(S), l'utiliser directement
          }
        } catch (error) {
          console.error('Erreur de chargement de l\'image:', error);
          setImageError(true);
        } finally {
          setImageLoading(false);
        }
      };

      loadImage();
    } else {
      setImageLoading(false);
    }
  }, [partner]);

  // Charger les contacts lorsque le partenaire change
  useEffect(() => {
    async function loadContacts() {
      if (!partner) return;
      
      setLoadingContacts(true);
      try {
        const partnerContacts = await getPartnerContacts(partner.id);
        setContacts(partnerContacts);
      } catch (error) {
        console.error('Erreur lors du chargement des contacts:', error);
      } finally {
        setLoadingContacts(false);
      }
    }
    
    if (isOpen && partner) {
      loadContacts();
    }
  }, [partner, isOpen]);

  // Fonction pour convertir SH_Tags en tableau s'il s'agit d'une chaîne
  const getTagsArray = (tags: string | string[] | undefined): string[] => {
    if (!tags) return [];
    
    // Si c'est déjà un tableau, on le retourne tel quel
    if (Array.isArray(tags)) return tags;
    
    // Si c'est une chaîne, on la découpe et on nettoie les éléments
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  // Fonction pour rendre le placeholder
  const renderPlaceholder = () => (
    <div className="h-40 w-40 bg-gray-200 rounded-full flex items-center justify-center text-4xl text-gray-500">
      {partner?.SH_Display_Name_FR.charAt(0).toUpperCase()}
    </div>
  );

  // Gérer l'ajout d'un contact
  const handleAddContact = async (contactData: ContactFormData) => {
    if (!partner) return;
    
    try {
      await addContact(partner.id, contactData);
      // Recharger les contacts
      const updatedContacts = await getPartnerContacts(partner.id);
      setContacts(updatedContacts);
      setShowContactForm(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du contact:', error);
    }
  };

  // Gérer la mise à jour d'un contact
  const handleUpdateContact = async (contactData: ContactFormData) => {
    if (!partner || !selectedContact) return;
    
    try {
      await updateContact(partner.id, selectedContact.id, contactData);
      // Recharger les contacts
      const updatedContacts = await getPartnerContacts(partner.id);
      setContacts(updatedContacts);
      setSelectedContact(null);
      setShowContactForm(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contact:', error);
    }
  };

  // Gérer la suppression d'un contact
  const handleDeleteContact = async (contactId: string) => {
    if (!partner) return;
    
    try {
      await deleteContact(partner.id, contactId);
      // Mettre à jour la liste locale
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
    } catch (error) {
      console.error('Erreur lors de la suppression du contact:', error);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-[50vw]">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-indigo-600 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-medium text-white">
                          {partner?.SH_Display_Name_FR || "Détails du partenaire"}
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
                            onClick={onClose}
                          >
                            <span className="sr-only">Fermer</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    {partner && (
                      <div>
                        {/* Onglets manuels au lieu de Tab.Group */}
                        <div className="flex border-b border-gray-200">
                          {categories.map((category, index) => {
                            const Icon = category.icon;
                            return (
                              <button
                                key={category.name}
                                onClick={() => setSelectedTab(index)}
                                className={`flex-1 whitespace-nowrap py-4 px-1 text-sm font-medium text-center focus:outline-none ${
                                  selectedTab === index
                                    ? 'text-indigo-600 border-b-2 border-indigo-500'
                                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                                }`}
                              >
                                <div className="flex items-center justify-center">
                                  <Icon className="h-5 w-5 mr-2" />
                                  {category.name}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Panneau Informations */}
                        {selectedTab === 0 && (
                          <div className="p-6">
                            {/* Logo */}
                            <div className="mb-8 flex justify-center">
                              <div className="relative h-40 w-40 flex items-center justify-center">
                                {imageLoading ? (
                                  <div className="animate-pulse h-40 w-40 bg-gray-200 rounded-lg"></div>
                                ) : imageUrl && !imageError ? (
                                  <img
                                    src={imageUrl}
                                    alt={partner.SH_Display_Name_FR}
                                    className="max-h-full max-w-full object-contain"
                                    onError={() => setImageError(true)}
                                  />
                                ) : (
                                  renderPlaceholder()
                                )}
                              </div>
                            </div>
                            
                            {/* Informations */}
                            <div className="space-y-6">
                              <InfoItem label="Code" value={partner.SH_Code} />
                              <InfoItem label="Nom" value={partner.SH_Display_Name_FR} />
                              <InfoItem label="UTM par défaut" value={partner.SH_Default_UTM || '-'} />
                              <InfoItem label="Type" value={partner.SH_Type || '-'} />
                              
                              {/* Tags */}
                              <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                  {getTagsArray(partner.SH_Tags).length > 0 ? (
                                    getTagsArray(partner.SH_Tags).map((tag, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                      >
                                        {tag}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-gray-500">Aucun tag</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Panneau Contacts */}
                        {selectedTab === 1 && (
                          <div className="p-6">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h2 className="text-lg font-medium text-gray-900">Contacts</h2>
                                {!showContactForm && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedContact(null);
                                      setShowContactForm(true);
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700"
                                  >
                                    <PlusIcon className="h-4 w-4 mr-1" />
                                    Ajouter un contact
                                  </button>
                                )}
                              </div>
                              
                              {showContactForm ? (
                                <ContactForm
                                  contact={selectedContact || undefined}
                                  onSubmit={selectedContact ? handleUpdateContact : handleAddContact}
                                  onCancel={() => {
                                    setShowContactForm(false);
                                    setSelectedContact(null);
                                  }}
                                />
                              ) : loadingContacts ? (
                                <div className="text-center py-4">
                                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                                  <p className="mt-2 text-sm text-gray-500">Chargement des contacts...</p>
                                </div>
                              ) : (
                                <ContactList
                                  contacts={contacts}
                                  onEdit={(contact) => {
                                    setSelectedContact(contact);
                                    setShowContactForm(true);
                                  }}
                                  onDelete={handleDeleteContact}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

// Composant d'élément d'information
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{label}</h3>
      <p className="text-base text-gray-900">{value}</p>
    </div>
  );
}