import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore'
import { db } from './firebase'

// Types
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

// Fonctions
export const getVersions = async (clientId: string, campaignId: string): Promise<Version[]> => {
  try {
    const versionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions')
    const q = query(versionsRef, orderBy('createdAt', 'asc'))
    const snapshot = await getDocs(q)
    
    console.log('Nombre de versions trouvées:', snapshot.size)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Version))
  } catch (error) {
    console.error('Erreur lors de la récupération des versions:', error)
    return []
  }
}

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
    
    const docRef = await addDoc(versionsRef, newVersion)
    return docRef.id
  } catch (error) {
    console.error('Erreur lors de la création de la version:', error)
    throw error
  }
}

export const setOfficialVersion = async (
  clientId: string, 
  campaignId: string, 
  versionId: string
): Promise<void> => {
  try {
    // 1. Retirer le statut officiel de toutes les versions
    const versionsRef = collection(db, 'clients', clientId, 'campaigns', campaignId, 'versions')
    const q = query(versionsRef, where('isOfficial', '==', true))
    const snapshot = await getDocs(q)
    
    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { isOfficial: false })
    )
    await Promise.all(updates)
    
    // 2. Marquer la nouvelle version comme officielle
    const versionRef = doc(db, 'clients', clientId, 'campaigns', campaignId, 'versions', versionId)
    await updateDoc(versionRef, { isOfficial: true })
    
    // 3. Mettre à jour la campagne
    const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId)
    await updateDoc(campaignRef, {
      officialVersionId: versionId
    })
  } catch (error) {
    console.error('Erreur lors du changement de version officielle:', error)
    throw error
  }
}