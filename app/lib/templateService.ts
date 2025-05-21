import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, orderBy } from 'firebase/firestore';

import { db } from './firebase';
import { Template, TemplateFormData } from '../types/template';

// Récupérer tous les gabarits pour un client spécifique
export async function getTemplatesByClient(clientId: string): Promise<Template[]> {
  try {
    console.log(`Récupération des gabarits pour le client ${clientId}`);
    // Utiliser la sous-collection 'templates' sous le document du client
    const templatesRef = collection(db, 'clients', clientId, 'templates');
    // Trier les gabarits par nom pour faciliter la navigation
    const q = query(templatesRef, orderBy('TE_Name'));
    const querySnapshot = await getDocs(q);
    
    const templates: Template[] = [];
    querySnapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        ...doc.data()
      } as Template);
    });
    
    console.log(`${templates.length} gabarits trouvés pour le client ${clientId}`);
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
    console.log(`Création d'un nouveau gabarit pour le client ${clientId}`);
    const now = new Date().toISOString();
    const newTemplate = {
      ...templateData,
      createdAt: now,
      updatedAt: now
    };
    
    // Ajouter à la sous-collection du client
    const templatesRef = collection(db, 'clients', clientId, 'templates');
    const docRef = await addDoc(templatesRef, newTemplate);
    console.log(`Gabarit créé avec ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

// Mettre à jour un gabarit existant
export async function updateTemplate(
  clientId: string,
  templateId: string,
  templateData: TemplateFormData
): Promise<void> {
  try {
    console.log(`Mise à jour du gabarit ${templateId} pour le client ${clientId}`);
    const templateRef = doc(db, 'clients', clientId, 'templates', templateId);
    await updateDoc(templateRef, {
      ...templateData,
      updatedAt: new Date().toISOString()
    });
    console.log(`Gabarit ${templateId} mis à jour avec succès`);
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

// Supprimer un gabarit
export async function deleteTemplate(
  clientId: string,
  templateId: string
): Promise<void> {
  try {
    console.log(`Suppression du gabarit ${templateId} pour le client ${clientId}`);
    const templateRef = doc(db, 'clients', clientId, 'templates', templateId);
    await deleteDoc(templateRef);
    console.log(`Gabarit ${templateId} supprimé avec succès`);
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// Récupérer un gabarit par son ID
export async function getTemplateById(
  clientId: string,
  templateId: string
): Promise<Template | null> {
  try {
    console.log(`Récupération du gabarit ${templateId} pour le client ${clientId}`);
    const templateRef = doc(db, 'clients', clientId, 'templates', templateId);

    const templateDoc = await getDoc(templateRef);
    
    if (!templateDoc.exists()) {
      console.log(`Gabarit ${templateId} non trouvé`);
      return null;
    }
    
    console.log(`Gabarit ${templateId} récupéré avec succès`);
    return {
      id: templateDoc.id,
      ...templateDoc.data()
    } as Template;
  } catch (error) {
    console.error('Error getting template by ID:', error);
    throw error;
  }
}