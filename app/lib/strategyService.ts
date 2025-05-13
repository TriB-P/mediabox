import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { Bucket, version } from '../types/strategy';
  
  // Obtenir tous les buckets d'une version de stratégie
  export async function getBuckets(campaignId: string, versionId: string): Promise<Bucket[]> {
    try {
      const bucketsCollection = collection(
        db,
        'clients',
        'CLIENT_ID', // Devrait être dynamique en fonction du client sélectionné
        'campaigns',
        campaignId,
        'strategy',
        versionId,
        'buckets'
      );
      
      const snapshot = await getDocs(bucketsCollection);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }) as Bucket);
    } catch (error) {
      console.error('Erreur lors de la récupération des buckets:', error);
      throw error;
    }
  }
  
  // Créer un nouveau bucket
  export async function createBucket(
    campaignId: string, 
    versionId: string, 
    bucket: Omit<Bucket, 'id'>
  ): Promise<string> {
    try {
      const bucketsCollection = collection(
        db,
        'clients',
        'CLIENT_ID', // Devrait être dynamique
        'campaigns',
        campaignId,
        'strategy',
        versionId,
        'buckets'
      );
      
      const docRef = await addDoc(bucketsCollection, bucket);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création du bucket:', error);
      throw error;
    }
  }
  
  // Mettre à jour un bucket
  export async function updateBucket(
    campaignId: string, 
    versionId: string, 
    bucket: Bucket
  ): Promise<void> {
    try {
      const bucketRef = doc(
        db,
        'clients',
        'CLIENT_ID', // Devrait être dynamique
        'campaigns',
        campaignId,
        'strategy',
        versionId,
        'buckets',
        bucket.id
      );
      
      // Exclure l'ID car il est déjà dans le chemin
      const { id, ...data } = bucket;
      
      await updateDoc(bucketRef, data);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du bucket:', error);
      throw error;
    }
  }
  
  // Supprimer un bucket
  export async function deleteBucket(
    campaignId: string, 
    versionId: string, 
    bucketId: string
  ): Promise<void> {
    try {
      const bucketRef = doc(
        db,
        'clients',
        'CLIENT_ID', // Devrait être dynamique
        'campaigns',
        campaignId,
        'strategy',
        versionId,
        'buckets',
        bucketId
      );
      
      await deleteDoc(bucketRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du bucket:', error);
      throw error;
    }
  }
  
  // Obtenir toutes les versions de stratégie pour une campagne
  export async function getversions(campaignId: string): Promise<version[]> {
    try {
      const versionsCollection = collection(
        db,
        'clients',
        'CLIENT_ID', // Devrait être dynamique
        'campaigns',
        campaignId,
        'versions'
      );
      
      const snapshot = await getDocs(versionsCollection);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }) as version);
    } catch (error) {
      console.error('Erreur lors de la récupération des versions de stratégie:', error);
      throw error;
    }
  }
  
  // Créer une nouvelle version de stratégie (peut copier les buckets d'une version existante)
  export async function createversion(
    campaignId: string,
    versionName: string,
    userEmail: string,
    baseVersionId?: string
  ): Promise<string> {
    try {
      // Créer la nouvelle version
      const versionsCollection = collection(
        db,
        'clients',
        'CLIENT_ID', // Devrait être dynamique
        'campaigns',
        campaignId,
        'versions'
      );
      
      const newVersion: Omit<version, 'id' | 'buckets'> = {
        name: versionName,
        createdAt: new Date().toISOString(),
        createdBy: userEmail,
        isOfficial: false,
      };
      
      const docRef = await addDoc(versionsCollection, newVersion);
      const newVersionId = docRef.id;
      
      // Si une version de base est spécifiée, copier les buckets
      if (baseVersionId) {
        const baseBuckets = await getBuckets(campaignId, baseVersionId);
        
        // Créer les buckets dans la nouvelle version
        for (const bucket of baseBuckets) {
          const { id, ...bucketData } = bucket;
          await createBucket(campaignId, newVersionId, bucketData);
        }
      }
      
      return newVersionId;
    } catch (error) {
      console.error('Erreur lors de la création de la version de stratégie:', error);
      throw error;
    }
  }
  
  // Définir une version comme version officielle
  export async function setOfficialversion(
    campaignId: string,
    versionId: string
  ): Promise<void> {
    try {
      // 1. Mettre à jour la campagne avec l'ID de la version officielle
      const campaignRef = doc(
        db,
        'clients',
        'CLIENT_ID', // Devrait être dynamique
        'campaigns',
        campaignId
      );
      
      await updateDoc(campaignRef, {
        officialversionId: versionId,
      });
      
      // 2. Mettre à jour toutes les versions pour enlever le statut officiel
      const versionsCollection = collection(
        db,
        'clients',
        'CLIENT_ID', // Devrait être dynamique
        'campaigns',
        campaignId,
        'versions'
      );
      
      const q = query(versionsCollection, where('isOfficial', '==', true));
      const snapshot = await getDocs(q);
      
      const updates = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { isOfficial: false })
      );
      await Promise.all(updates);
      
      // 3. Mettre à jour la nouvelle version officielle
      const versionRef = doc(
        db,
        'clients',
        'CLIENT_ID', // Devrait être dynamique
        'campaigns',
        campaignId,
        'versions',
        versionId
      );
      
      await updateDoc(versionRef, { isOfficial: true });
    } catch (error) {
      console.error('Erreur lors de la définition de la version officielle:', error);
      throw error;
    }
  }