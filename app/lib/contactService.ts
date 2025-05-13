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
    language: 'FR' | 'EN';
    comment?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ContactFormData {
    firstName: string;
    lastName: string;
    email: string;
    language: 'FR' | 'EN';
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
      const q = query(contactsCollection, orderBy('lastName'), orderBy('firstName'));
      const snapshot = await getDocs(q);
      
      const contacts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Contact));
      
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