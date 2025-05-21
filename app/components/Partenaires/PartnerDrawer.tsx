'use client';

import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserIcon, BuildingOfficeIcon, DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// Imports pour les contacts
import { Contact, ContactFormData, getPartnerContacts, addContact, updateContact, deleteContact } from '../../lib/contactService';
import ContactForm from './ContactForm';
import ContactList from './ContactList';

// Imports pour les specs
import { Spec, SpecFormData, getPartnerSpecs, addSpec, updateSpec, deleteSpec } from '../../lib/specService';
import SpecForm from './SpecForm';
import SpecList from './SpecList';
import { updatePartner } from '../../lib/shortcodeService';


// Type pour les partenaires
interface Partner {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
  SH_Display_Name_EN?: string;
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
  // États pour l'image du partenaire
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // États pour les onglets
  const [selectedTab, setSelectedTab] = useState(0);
  
  // États pour les contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  
  // États pour les specs
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<Spec | null>(null);
  const [showSpecForm, setShowSpecForm] = useState(false);

  // États pour l'édition du partenaire
const [isEditingPartner, setIsEditingPartner] = useState(false);
const [partnerFormData, setPartnerFormData] = useState<Partial<Partner>>({});
const [isSavingPartner, setIsSavingPartner] = useState(false);
  
  // Définition des onglets
  const categories = [
    { name: 'Informations', icon: BuildingOfficeIcon },
    { name: 'Contacts', icon: UserIcon },
    { name: 'Specs', icon: DocumentTextIcon }
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
    
    if (isOpen && partner && selectedTab === 1) {
      loadContacts();
    }
  }, [partner, isOpen, selectedTab]);
  
  // Charger les specs lorsque le partenaire change
  useEffect(() => {
    async function loadSpecs() {
      if (!partner) return;
      
      setLoadingSpecs(true);
      try {
        const partnerSpecs = await getPartnerSpecs(partner.id);
        setSpecs(partnerSpecs);
      } catch (error) {
        console.error('Erreur lors du chargement des specs:', error);
      } finally {
        setLoadingSpecs(false);
      }
    }
    
    if (isOpen && partner && selectedTab === 2) {
      loadSpecs();
    }
  }, [partner, isOpen, selectedTab]);

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

  // FONCTIONS POUR LES CONTACTS
  
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
  
  // FONCTIONS POUR LES SPECS
  
  // Gérer l'ajout d'une spec
  const handleAddSpec = async (specData: SpecFormData) => {
    if (!partner) return;
    
    try {
      await addSpec(partner.id, specData);
      // Recharger les specs
      const updatedSpecs = await getPartnerSpecs(partner.id);
      setSpecs(updatedSpecs);
      setShowSpecForm(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la spec:', error);
    }
  };

  // Gérer la mise à jour d'une spec
  const handleUpdateSpec = async (specData: SpecFormData) => {
    if (!partner || !selectedSpec) return;
    
    try {
      await updateSpec(partner.id, selectedSpec.id, specData);
      // Recharger les specs
      const updatedSpecs = await getPartnerSpecs(partner.id);
      setSpecs(updatedSpecs);
      setSelectedSpec(null);
      setShowSpecForm(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la spec:', error);
    }
  };

  // Gérer la suppression d'une spec
  const handleDeleteSpec = async (specId: string) => {
    if (!partner) return;
    
    try {
      await deleteSpec(partner.id, specId);
      // Mettre à jour la liste locale
      setSpecs(prev => prev.filter(spec => spec.id !== specId));
    } catch (error) {
      console.error('Erreur lors de la suppression de la spec:', error);
    }
  };

  // FONCTIONS POUR L'ÉDITION DU PARTENAIRE

// Initialiser le formulaire d'édition avec les données du partenaire
const initPartnerForm = () => {
  if (partner) {
    setPartnerFormData({
      SH_Code: partner.SH_Code || '',
      SH_Display_Name_FR: partner.SH_Display_Name_FR || '',
      SH_Display_Name_EN: partner.SH_Display_Name_EN || '',
      SH_Default_UTM: partner.SH_Default_UTM || '',
      SH_Logo: partner.SH_Logo || '',
      SH_Type: partner.SH_Type || ''
    });
    setIsEditingPartner(true);
  }
};

// Gérer les changements dans le formulaire
const handlePartnerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setPartnerFormData(prev => ({ ...prev, [name]: value }));
};

// Sauvegarder les modifications
const handleSavePartner = async () => {
  if (!partner) return;
  
  try {
    setIsSavingPartner(true);
    
    // Créer une copie pour la conversion des types
    const formattedData: any = { ...partnerFormData };
    
    // Convertir SH_Tags en tableau si c'est une chaîne
    if (typeof formattedData.SH_Tags === 'string') {
      formattedData.SH_Tags = formattedData.SH_Tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    }
    
    await updatePartner(partner.id, formattedData);
    setIsEditingPartner(false);
    // Rafraîchir les données
    onClose(); // Fermer le drawer pour forcer un rechargement
  } catch (error) {
    console.error('Erreur lors de la mise à jour du partenaire:', error);
  } finally {
    setIsSavingPartner(false);
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
                        {/* Onglets */}
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
                              
                              {/* Bouton d'édition */}
                              {!isEditingPartner && (
                                <div className="flex justify-end mb-4">
                                  <button
                                    type="button"
                                    onClick={initPartnerForm}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700"
                                  >
                                    Modifier
                                  </button>
                                </div>
                              )}
                              
                              {/* Mode Édition */}
                              {isEditingPartner ? (
                                <form className="space-y-4">
                                  <div>
                                    <label htmlFor="SH_Code" className="block text-sm font-medium text-gray-700">Code</label>
                                    <input
                                      type="text"
                                      name="SH_Code"
                                      id="SH_Code"
                                      value={partnerFormData.SH_Code || ''}
                                      onChange={handlePartnerFormChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      required
                                    />
                                  </div>
                                  
                                  <div>
                                    <label htmlFor="SH_Display_Name_FR" className="block text-sm font-medium text-gray-700">Nom d'affichage (FR)</label>
                                    <input
                                      type="text"
                                      name="SH_Display_Name_FR"
                                      id="SH_Display_Name_FR"
                                      value={partnerFormData.SH_Display_Name_FR || ''}
                                      onChange={handlePartnerFormChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      required
                                    />
                                  </div>
                                  
                                  <div>
                                    <label htmlFor="SH_Display_Name_EN" className="block text-sm font-medium text-gray-700">Nom d'affichage (EN)</label>
                                    <input
                                      type="text"
                                      name="SH_Display_Name_EN"
                                      id="SH_Display_Name_EN"
                                      value={partnerFormData.SH_Display_Name_EN || ''}
                                      onChange={handlePartnerFormChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label htmlFor="SH_Default_UTM" className="block text-sm font-medium text-gray-700">UTM par défaut</label>
                                    <input
                                      type="text"
                                      name="SH_Default_UTM"
                                      id="SH_Default_UTM"
                                      value={partnerFormData.SH_Default_UTM || ''}
                                      onChange={handlePartnerFormChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label htmlFor="SH_Type" className="block text-sm font-medium text-gray-700">Type</label>
                                    <input
                                      type="text"
                                      name="SH_Type"
                                      id="SH_Type"
                                      value={partnerFormData.SH_Type || ''}
                                      onChange={handlePartnerFormChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label htmlFor="SH_Logo" className="block text-sm font-medium text-gray-700">URL du logo</label>
                                    <input
                                      type="text"
                                      name="SH_Logo"
                                      id="SH_Logo"
                                      value={partnerFormData.SH_Logo || ''}
                                      onChange={handlePartnerFormChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  </div>
                                  
                                  <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingPartner(false)}
                                      className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleSavePartner}
                                      disabled={isSavingPartner}
                                      className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                      {isSavingPartner ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                /* Mode Affichage */
                                <div className="space-y-6">
                                  <InfoItem label="Code" value={partner.SH_Code} />
                                  <InfoItem label="Nom" value={partner.SH_Display_Name_FR} />
                                  <InfoItem label="Nom (EN)" value={partner.SH_Display_Name_EN || '-'} />
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
                              )}
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
                        
                        {/* Panneau Specs */}
                        {selectedTab === 2 && (
                          <div className="p-6">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h2 className="text-lg font-medium text-gray-900">Spécifications techniques</h2>
                                {!showSpecForm && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSpec(null);
                                      setShowSpecForm(true);
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700"
                                  >
                                    <PlusIcon className="h-4 w-4 mr-1" />
                                    Ajouter une spec
                                  </button>
                                )}
                              </div>
                              
                              {showSpecForm ? (
                                <SpecForm
                                  spec={selectedSpec || undefined}
                                  onSubmit={selectedSpec ? handleUpdateSpec : handleAddSpec}
                                  onCancel={() => {
                                    setShowSpecForm(false);
                                    setSelectedSpec(null);
                                  }}
                                />
                              ) : loadingSpecs ? (
                                <div className="text-center py-4">
                                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                                  <p className="mt-2 text-sm text-gray-500">Chargement des spécifications...</p>
                                </div>
                              ) : (
                                <SpecList
                                  specs={specs}
                                  onEdit={(spec) => {
                                    setSelectedSpec(spec);
                                    setShowSpecForm(true);
                                  }}
                                  onDelete={handleDeleteSpec}
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