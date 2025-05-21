import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, getDoc } from 'firebase/firestore';

import { db } from './firebase';
import { Template, TemplateFormData } from '../types/template';

// Collection de référence dans Firestore
const templatesCollection = 'templates';

// Récupérer tous les gabarits pour un client spécifique
export async function getTemplatesByClient(clientId: string): Promise<Template[]> {
  try {
    const templatesRef = collection(db, templatesCollection);
    const q = query(templatesRef, where('clientId', '==', clientId));
    const querySnapshot = await getDocs(q);
    
    const templates: Template[] = [];
    querySnapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        ...doc.data()
      } as Template);
    });
    
    return templates;
  } catch (error) {
    console.error('Error getting templates:', error);
    throw error;
  }
}

// Créer un nouveau gabarit
export async function createTemplate(
  clientId: string,
  templateData: TemplateFormData
): Promise<string> {
  try {
    const now = new Date().toISOString();
    const newTemplate = {
      ...templateData,
      clientId,
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(db, templatesCollection), newTemplate);
    return docRef.id;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

// Mettre à jour un gabarit existant
export async function updateTemplate(
  templateId: string,
  templateData: TemplateFormData
): Promise<void> {
  try {
    const templateRef = doc(db, templatesCollection, templateId);
    await updateDoc(templateRef, {
      ...templateData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

// Supprimer un gabarit
export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    const templateRef = doc(db, templatesCollection, templateId);
    await deleteDoc(templateRef);
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// Récupérer un gabarit par son ID
export async function getTemplateById(templateId: string): Promise<Template | null> {
  try {
    const templateRef = doc(db, templatesCollection, templateId);

    const templateDoc = await getDoc(templateRef);

    
    if (!templateDoc.exists()) {
      return null;
    }
    
    return {
      id: templateDoc.id,
      ...templateDoc.data()
    } as Template;
  } catch (error) {
    console.error('Error getting template by ID:', error);
    throw error;
  }
}

