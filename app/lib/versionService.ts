// app/lib/versionService.ts
/**
 * Ce fichier contient des fonctions de service pour interagir avec les données de version
 * dans Firebase Firestore. Il permet de gérer les opérations CRUD (Créer, Lire, Mettre à jour, Supprimer)
 * pour les versions associées à des campagnes spécifiques, ainsi que la gestion
 * de la version officielle d'une campagne et la duplication de versions complètes.
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore'
import { db } from './firebase'
import { addOnglet } from './tactiqueService'
import { duplicateVersionWithHierarchy } from './versionDuplicationUtils'

export interface Version {
  id: string;
  name: string;
  isOfficial: boolean;
  createdAt: string;
  createdBy: string;
}

export interface VersionFormData {
  name: string;
}

/**
 * Récupère toutes les versions pour une campagne spécifique.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @returns Une promesse qui résout en un tableau d'objets Version.
 */
export const getVersions = async (clientId: string, campaignId: string): Promise<Version[]> => {
  try {
    const versionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions')
    const q = query(versionsRef, orderBy('createdAt', 'asc'))
    console.log("FIREBASE: LECTURE - Fichier: versionService.ts - Fonction: getVersions - Path: clients/${clientId}/campaigns/${campaignId}/versions");
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Version))
  } catch (error) {
    console.error('Erreur lors de la récupération des versions:', error)
    return []
  }
}

/**
 * Crée une nouvelle version pour une campagne spécifique.
 * Crée également un onglet "General" par défaut dans cette version.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param formData Les données du formulaire pour la nouvelle version.
 * @param userEmail L'e-mail de l'utilisateur qui crée la version.
 * @returns Une promesse qui résout en l'ID de la nouvelle version créée.
 */
export const createVersion = async (
  clientId: string,
  campaignId: string,
  formData: VersionFormData,
  userEmail: string
): Promise<string> => {
  try {
    const versionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions')
    const newVersion = {
      ...formData,
      isOfficial: false,
      createdAt: new Date().toISOString(),
      createdBy: userEmail
    }
    console.log("FIREBASE: ÉCRITURE - Fichier: versionService.ts - Fonction: createVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions");
    const docRef = await addDoc(versionsRef, newVersion)

    // Créer l'onglet "General" par défaut
    console.log("FIREBASE: ÉCRITURE - Fichier: versionService.ts - Fonction: createVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions/${docRef.id}/onglets");
    await addOnglet(
      clientId,
      campaignId,
      docRef.id,
      {
        ONGLET_Name: 'General',
        ONGLET_Order: 0
      }
    );

    return docRef.id
  } catch (error) {
    console.error('Erreur lors de la création de la version:', error)
    throw error
  }
}

/**
 * Duplique une version existante avec tout son contenu (buckets, onglets, sections, tactiques, placements, créatifs).
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param sourceVersionId L'ID de la version source à dupliquer.
 * @param newVersionName Le nom de la nouvelle version dupliquée.
 * @param userEmail L'e-mail de l'utilisateur qui effectue la duplication.
 * @returns Une promesse qui résout en l'ID de la nouvelle version dupliquée.
 */
export const duplicateVersion = async (
  clientId: string,
  campaignId: string,
  sourceVersionId: string,
  newVersionName: string,
  userEmail: string
): Promise<string> => {
  try {
    // 1. Vérifier que la version source existe
    const sourceVersionRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', sourceVersionId)
    console.log(`FIREBASE: LECTURE - Fichier: versionService.ts - Fonction: duplicateVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions/${sourceVersionId}`);
    const sourceVersionDoc = await getDoc(sourceVersionRef)
    
    if (!sourceVersionDoc.exists()) {
      throw new Error('Version source introuvable')
    }

    const sourceVersionData = sourceVersionDoc.data() as Version

    // 2. Créer la nouvelle version
    const versionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions')
    const newVersion = {
      name: newVersionName,
      isOfficial: false,
      createdAt: new Date().toISOString(),
      createdBy: userEmail
    }
    
    console.log(`FIREBASE: ÉCRITURE - Fichier: versionService.ts - Fonction: duplicateVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions`);
    const newVersionRef = await addDoc(versionsRef, newVersion)
    const newVersionId = newVersionRef.id

    // 3. Dupliquer tout le contenu de la version source
    await duplicateVersionWithHierarchy(clientId, campaignId, sourceVersionId, newVersionId)

    console.log(`✅ Version "${sourceVersionData.name}" dupliquée avec succès vers "${newVersionName}"`)
    return newVersionId

  } catch (error) {
    console.error('Erreur lors de la duplication de la version:', error)
    throw error
  }
}

/**
 * Définit une version spécifique comme officielle pour une campagne.
 * Cela retire le statut officiel de toutes les autres versions et met à jour la campagne.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version à définir comme officielle.
 * @returns Une promesse qui résout une fois l'opération terminée.
 */
export const setOfficialVersion = async (
  clientId: string,
  campaignId: string,
  versionId: string
): Promise<void> => {
  try {
    const versionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions')
    const q = query(versionsRef, where('isOfficial', '==', true))
    console.log("FIREBASE: LECTURE - Fichier: versionService.ts - Fonction: setOfficialVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions");
    const snapshot = await getDocs(q)
    const updates = snapshot.docs.map(doc => {
      console.log("FIREBASE: ÉCRITURE - Fichier: versionService.ts - Fonction: setOfficialVersion - Path: versions/${doc.id}");
      return updateDoc(doc.ref, { isOfficial: false })
    })
    await Promise.all(updates)
    const versionRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId)
    console.log("FIREBASE: ÉCRITURE - Fichier: versionService.ts - Fonction: setOfficialVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}");
    await updateDoc(versionRef, { isOfficial: true })
    const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId)
    console.log("FIREBASE: ÉCRITURE - Fichier: versionService.ts - Fonction: setOfficialVersion - Path: clients/${clientId}/campaigns/${campaignId}");
    await updateDoc(campaignRef, {
      officialVersionId: versionId
    })
  } catch (error) {
    console.error('Erreur lors du changement de version officielle:', error)
    throw error
  }
}

/**
 * Supprime une version spécifique ainsi que toutes ses sous-collections (tactiques, créatifs, placements).
 * Ne permet pas la suppression de la version officielle.
 * @param clientId L'ID du client.
 * @param campaignId L'ID de la campagne.
 * @param versionId L'ID de la version à supprimer.
 * @returns Une promesse qui résout une fois l'opération terminée.
 * @throws Erreur si la version n'est pas trouvée ou si elle est la version officielle.
 */
export const deleteVersion = async (
  clientId: string,
  campaignId: string,
  versionId: string
): Promise<void> => {
  try {
    const versionRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId)
    console.log("FIREBASE: LECTURE - Fichier: versionService.ts - Fonction: deleteVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}");
    const versionDoc = await getDoc(versionRef)
    if (!versionDoc.exists()) {
      throw new Error('Version introuvable')
    }
    const versionData = versionDoc.data() as Version
    if (versionData.isOfficial) {
      throw new Error('Impossible de supprimer la version officielle')
    }
    const tacticsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'tactics')
    console.log("FIREBASE: LECTURE - Fichier: versionService.ts - Fonction: deleteVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/tactics");
    const tacticsSnapshot = await getDocs(tacticsRef)
    for (const tacticDoc of tacticsSnapshot.docs) {
      const tacticId = tacticDoc.id
      const creativesRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'tactics', tacticId, 'creatives')
      console.log("FIREBASE: LECTURE - Fichier: versionService.ts - Fonction: deleteVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/tactics/${tacticId}/creatives");
      const creativesSnapshot = await getDocs(creativesRef)
      const deleteCreatives = creativesSnapshot.docs.map(doc => {
        console.log("FIREBASE: SUPPRESSION - Fichier: versionService.ts - Fonction: deleteVersion - Path: creatives/${doc.id}");
        return deleteDoc(doc.ref)
      })
      await Promise.all(deleteCreatives)
      const placementsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId, 'tactics', tacticId, 'placements')
      console.log("FIREBASE: LECTURE - Fichier: versionService.ts - Fonction: deleteVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}/tactics/${tacticId}/placements");
      const placementsSnapshot = await getDocs(placementsRef)
      const deletePlacements = placementsSnapshot.docs.map(doc => {
        console.log("FIREBASE: SUPPRESSION - Fichier: versionService.ts - Fonction: deleteVersion - Path: placements/${doc.id}");
        return deleteDoc(doc.ref)
      })
      await Promise.all(deletePlacements)
      console.log("FIREBASE: SUPPRESSION - Fichier: versionService.ts - Fonction: deleteVersion - Path: tactics/${tacticDoc.id}");
      await deleteDoc(tacticDoc.ref)
    }
    console.log("FIREBASE: SUPPRESSION - Fichier: versionService.ts - Fonction: deleteVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions/${versionId}");
    await deleteDoc(versionRef)
  } catch (error) {
    console.error('Erreur lors de la suppression de la version:', error)
    throw error
  }
}