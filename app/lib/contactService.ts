/**
 * Ce fichier contient des fonctions pour interagir avec la collection 'contacts'
 * d'un partenaire spécifique dans Firebase Firestore. Il permet de récupérer, ajouter,
 * mettre à jour et supprimer des contacts associés à un identifiant de partenaire donné.
 * Il gère également la rétrocompatibilité des données de langue des contacts.
 */
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  languages: {
    FR: boolean;
    EN: boolean;
  };
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  languages: {
    FR: boolean;
    EN: boolean;
  };
  comment?: string;
}

/**
 * Récupère tous les contacts associés à un identifiant de partenaire donné.
 * Les contacts sont triés par nom de famille (lastName) côté Firestore et ensuite par prénom (firstName) côté client.
 * @param partnerId L'identifiant du partenaire dont on veut récupérer les contacts.
 * @returns Une promesse qui résout en un tableau d'objets Contact.
 */
export async function getPartnerContacts(partnerId: string): Promise<Contact[]> {
  try {
    const contactsCollection = collection(
      db,
      'shortcodes',
      partnerId,
      'contacts'
    );

    const q = query(contactsCollection, orderBy('lastName'));
    console.log("FIREBASE: LECTURE - Fichier: code.ts - Fonction: getPartnerContacts - Path: lists/CA_Publisher/shortcodes/${partnerId}/contacts");
    const snapshot = await getDocs(q);

    const contacts = snapshot.docs.map(doc => {
      const data = doc.data();

      let languages = data.languages;
      if (!languages && data.language) {
        languages = {
          FR: data.language === 'FR',
          EN: data.language === 'EN',
        };
      } else if (!languages) {
        languages = { FR: true, EN: false };
      }

      return {
        id: doc.id,
        ...data,
        languages
      } as Contact;
    });

    contacts.sort((a, b) => {
      if (a.lastName === b.lastName) {
        return a.firstName.localeCompare(b.firstName);
      }
      return 0;
    });

    return contacts;
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts:', error);
    return [];
  }
}

/**
 * Ajoute un nouveau contact pour un partenaire spécifique dans Firestore.
 * Le contact est créé avec des horodatages pour sa création et sa dernière mise à jour.
 * @param partnerId L'identifiant du partenaire auquel le contact sera associé.
 * @param contactData Les données du nouveau contact.
 * @returns Une promesse qui résout en l'identifiant du document nouvellement créé.
 */
export async function addContact(partnerId: string, contactData: ContactFormData): Promise<string> {
  try {
    const contactsCollection = collection(
      db,
      'shortcodes',
      partnerId,
      'contacts'
    );

    const now = new Date().toISOString();

    const newContact = {
      ...contactData,
      createdAt: now,
      updatedAt: now,
    };
    console.log("FIREBASE: ÉCRITURE - Fichier: code.ts - Fonction: addContact - Path: lists/CA_Publisher/shortcodes/${partnerId}/contacts");
    const docRef = await addDoc(contactsCollection, newContact);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du contact:', error);
    throw error;
  }
}

/**
 * Met à jour un contact existant pour un partenaire spécifique dans Firestore.
 * L'horodatage de la dernière mise à jour est automatiquement mis à jour.
 * @param partnerId L'identifiant du partenaire auquel le contact appartient.
 * @param contactId L'identifiant du contact à mettre à jour.
 * @param contactData Les nouvelles données du contact.
 * @returns Une promesse qui résout lorsque la mise à jour est terminée.
 */
export async function updateContact(partnerId: string, contactId: string, contactData: ContactFormData): Promise<void> {
  try {
    const contactRef = doc(
      db,
      'shortcodes',
      partnerId,
      'contacts',
      contactId
    );

    const updatedContact = {
      ...contactData,
      updatedAt: new Date().toISOString(),
    };
    console.log("FIREBASE: ÉCRITURE - Fichier: code.ts - Fonction: updateContact - Path: lists/CA_Publisher/shortcodes/${partnerId}/contacts/${contactId}");
    await updateDoc(contactRef, updatedContact);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contact:', error);
    throw error;
  }
}

/**
 * Supprime un contact spécifique pour un partenaire donné de Firestore.
 * @param partnerId L'identifiant du partenaire auquel le contact appartient.
 * @param contactId L'identifiant du contact à supprimer.
 * @returns Une promesse qui résout lorsque la suppression est terminée.
 */
export async function deleteContact(partnerId: string, contactId: string): Promise<void> {
  try {
    const contactRef = doc(
      db,
      'shortcodes',
      partnerId,
      'contacts',
      contactId
    );
    console.log("FIREBASE: ÉCRITURE - Fichier: code.ts - Fonction: deleteContact - Path: lists/CA_Publisher/shortcodes/${partnerId}/contacts/${contactId}");
    await deleteDoc(contactRef);
  } catch (error) {
    console.error('Erreur lors de la suppression du contact:', error);
    throw error;
  }
}