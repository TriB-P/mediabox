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

// Obtenir tous les contacts pour un partenaire spécifique
export async function getPartnerContacts(partnerId: string): Promise<Contact[]> {
  try {
    console.log(`Récupération des contacts pour le partenaire: ${partnerId}`);
    const contactsCollection = collection(
      db,
      'lists',
      'CA_Publisher',
      'shortcodes',
      partnerId,
      'contacts'
    );
    
    // Utiliser un seul critère de tri pour éviter l'erreur d'index composé
    const q = query(contactsCollection, orderBy('lastName'));
    const snapshot = await getDocs(q);
    
    const contacts = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Pour assurer la rétrocompatibilité avec les anciens contacts qui utilisaient language au lieu de languages
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
    
    // Tri secondaire par prénom fait côté client
    contacts.sort((a, b) => {
      if (a.lastName === b.lastName) {
        return a.firstName.localeCompare(b.firstName);
      }
      return 0; // Le tri principal par lastName est déjà fait par Firestore
    });
    
    console.log(`${contacts.length} contacts trouvés`);
    return contacts;
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts:', error);
    return [];
  }
}

// Ajouter un nouveau contact
export async function addContact(partnerId: string, contactData: ContactFormData): Promise<string> {
  try {
    const contactsCollection = collection(
      db,
      'lists',
      'CA_Publisher',
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
    
    const docRef = await addDoc(contactsCollection, newContact);
    console.log(`Contact ajouté avec ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du contact:', error);
    throw error;
  }
}

// Mettre à jour un contact existant
export async function updateContact(partnerId: string, contactId: string, contactData: ContactFormData): Promise<void> {
  try {
    const contactRef = doc(
      db,
      'lists',
      'CA_Publisher',
      'shortcodes',
      partnerId,
      'contacts',
      contactId
    );
    
    const updatedContact = {
      ...contactData,
      updatedAt: new Date().toISOString(),
    };
    
    await updateDoc(contactRef, updatedContact);
    console.log(`Contact ${contactId} mis à jour`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contact:', error);
    throw error;
  }
}

// Supprimer un contact
export async function deleteContact(partnerId: string, contactId: string): Promise<void> {
  try {
    const contactRef = doc(
      db,
      'lists',
      'CA_Publisher',
      'shortcodes',
      partnerId,
      'contacts',
      contactId
    );
    
    await deleteDoc(contactRef);
    console.log(`Contact ${contactId} supprimé`);
  } catch (error) {
    console.error('Erreur lors de la suppression du contact:', error);
    throw error;
  }
}