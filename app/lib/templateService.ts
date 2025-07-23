/**
 * Ce fichier contient des fonctions pour interagir avec les gabarits (templates) dans Firebase Firestore.
 * Il permet de récupérer, créer, mettre à jour et supprimer des gabarits associés à des clients spécifiques.
 * C'est utile pour gérer les modèles de documents ou de données propres à chaque client.
 */
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, orderBy } from 'firebase/firestore';

import { db } from './firebase';
import { Template, TemplateFormData } from '../types/template';

/**
 * Récupère tous les gabarits pour un client donné depuis Firebase.
 * @param {string} clientId L'identifiant unique du client.
 * @returns {Promise<Template[]>} Une promesse qui résout en un tableau de gabarits.
 */
export async function getTemplatesByClient(clientId: string): Promise<Template[]> {
  try {
    const templatesRef = collection(db, 'clients', clientId, 'templates');
    const q = query(templatesRef, orderBy('TE_Name'));
    console.log("FIREBASE: LECTURE - Fichier: client-templates.ts - Fonction: getTemplatesByClient - Path: clients/${clientId}/templates");
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

/**
 * Crée un nouveau gabarit pour un client spécifique dans Firebase.
 * @param {string} clientId L'identifiant unique du client.
 * @param {TemplateFormData} templateData Les données du gabarit à créer.
 * @returns {Promise<string>} Une promesse qui résout en l'identifiant du nouveau gabarit créé.
 */
export async function createTemplate(
  clientId: string,
  templateData: TemplateFormData
): Promise<string> {
  try {
    const now = new Date().toISOString();
    const newTemplate = {
      ...templateData,
      createdAt: now,
      updatedAt: now
    };

    const templatesRef = collection(db, 'clients', clientId, 'templates');
    console.log("FIREBASE: ÉCRITURE - Fichier: client-templates.ts - Fonction: createTemplate - Path: clients/${clientId}/templates");
    const docRef = await addDoc(templatesRef, newTemplate);
    return docRef.id;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

/**
 * Met à jour un gabarit existant pour un client donné dans Firebase.
 * @param {string} clientId L'identifiant unique du client.
 * @param {string} templateId L'identifiant unique du gabarit à mettre à jour.
 * @param {TemplateFormData} templateData Les nouvelles données du gabarit.
 * @returns {Promise<void>} Une promesse qui résout une fois la mise à jour terminée.
 */
export async function updateTemplate(
  clientId: string,
  templateId: string,
  templateData: TemplateFormData
): Promise<void> {
  try {
    const templateRef = doc(db, 'clients', clientId, 'templates', templateId);
    console.log("FIREBASE: ÉCRITURE - Fichier: client-templates.ts - Fonction: updateTemplate - Path: clients/${clientId}/templates/${templateId}");
    await updateDoc(templateRef, {
      ...templateData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

/**
 * Supprime un gabarit pour un client donné de Firebase.
 * @param {string} clientId L'identifiant unique du client.
 * @param {string} templateId L'identifiant unique du gabarit à supprimer.
 * @returns {Promise<void>} Une promesse qui résout une fois la suppression terminée.
 */
export async function deleteTemplate(
  clientId: string,
  templateId: string
): Promise<void> {
  try {
    const templateRef = doc(db, 'clients', clientId, 'templates', templateId);
    console.log("FIREBASE: ÉCRITURE - Fichier: client-templates.ts - Fonction: deleteTemplate - Path: clients/${clientId}/templates/${templateId}");
    await deleteDoc(templateRef);
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

/**
 * Récupère un gabarit spécifique par son identifiant pour un client donné.
 * @param {string} clientId L'identifiant unique du client.
 * @param {string} templateId L'identifiant unique du gabarit à récupérer.
 * @returns {Promise<Template | null>} Une promesse qui résout en le gabarit trouvé ou null s'il n'existe pas.
 */
export async function getTemplateById(
  clientId: string,
  templateId: string
): Promise<Template | null> {
  try {
    const templateRef = doc(db, 'clients', clientId, 'templates', templateId);
    console.log("FIREBASE: LECTURE - Fichier: client-templates.ts - Fonction: getTemplateById - Path: clients/${clientId}/templates/${templateId}");
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