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
  
  export interface Spec {
    id: string;
    name: string;
    format: string;
    ratio: string;
    fileType: string;
    maxWeight: string;
    weight: string;
    animation: string;
    title: string;
    text: string;
    specSheetLink: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface SpecFormData {
    name: string;
    format: string;
    ratio: string;
    fileType: string;
    maxWeight: string;
    weight: string;
    animation: string;
    title: string;
    text: string;
    specSheetLink: string;
    notes: string;
  }
  
  // Obtenir toutes les specs pour un partenaire spécifique
  export async function getPartnerSpecs(partnerId: string): Promise<Spec[]> {
    try {
      console.log(`Récupération des specs pour le partenaire: ${partnerId}`);
      const specsCollection = collection(
        db,
        'lists',
        'CA_Publisher',
        'shortcodes',
        partnerId,
        'specs'
      );
      const q = query(specsCollection, orderBy('name'));
      const snapshot = await getDocs(q);
      
      const specs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Spec));
      
      console.log(`${specs.length} specs trouvées`);
      return specs;
    } catch (error) {
      console.error('Erreur lors de la récupération des specs:', error);
      return [];
    }
  }
  
  // Ajouter une nouvelle spec
  export async function addSpec(partnerId: string, specData: SpecFormData): Promise<string> {
    try {
      const specsCollection = collection(
        db,
        'lists',
        'CA_Publisher',
        'shortcodes',
        partnerId,
        'specs'
      );
      
      const now = new Date().toISOString();
      
      const newSpec = {
        ...specData,
        createdAt: now,
        updatedAt: now,
      };
      
      const docRef = await addDoc(specsCollection, newSpec);
      console.log(`Spec ajoutée avec ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la spec:', error);
      throw error;
    }
  }
  
  // Mettre à jour une spec existante
  export async function updateSpec(partnerId: string, specId: string, specData: SpecFormData): Promise<void> {
    try {
      const specRef = doc(
        db,
        'lists',
        'CA_Publisher',
        'shortcodes',
        partnerId,
        'specs',
        specId
      );
      
      const updatedSpec = {
        ...specData,
        updatedAt: new Date().toISOString(),
      };
      
      await updateDoc(specRef, updatedSpec);
      console.log(`Spec ${specId} mise à jour`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la spec:', error);
      throw error;
    }
  }
  
  // Supprimer une spec
  export async function deleteSpec(partnerId: string, specId: string): Promise<void> {
    try {
      const specRef = doc(
        db,
        'lists',
        'CA_Publisher',
        'shortcodes',
        partnerId,
        'specs',
        specId
      );
      
      await deleteDoc(specRef);
      console.log(`Spec ${specId} supprimée`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la spec:', error);
      throw error;
    }
  }