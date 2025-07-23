/**
 * Ce fichier contient des fonctions pour interagir avec Firebase Firestore,
 * spécifiquement pour la gestion des "buckets" et des versions de stratégie
 * associées aux campagnes. Il permet de récupérer, créer, mettre à jour et supprimer
 * des buckets, ainsi que de gérer les versions de stratégie, y compris la copie
 * de buckets d'une version à l'autre et la définition d'une version officielle.
 */
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

/**
* Récupère tous les buckets associés à une version spécifique d'une stratégie de campagne.
* @param campaignId L'identifiant de la campagne.
* @param versionId L'identifiant de la version de la stratégie.
* @returns Une promesse qui résout en un tableau d'objets Bucket.
*/
export async function getBuckets(campaignId: string, versionId: string): Promise<Bucket[]> {
  try {
      const bucketsCollection = collection(
          db,
          'clients',
          'CLIENT_ID',
          'campaigns',
          campaignId,
          'strategy',
          versionId,
          'buckets'
      );
      console.log("FIREBASE: LECTURE - Fichier: code.js - Fonction: getBuckets - Path: clients/CLIENT_ID/campaigns/${campaignId}/strategy/${versionId}/buckets");
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

/**
* Crée un nouveau bucket pour une version spécifique d'une stratégie de campagne.
* @param campaignId L'identifiant de la campagne.
* @param versionId L'identifiant de la version de la stratégie.
* @param bucket Les données du bucket à créer, sans l'ID.
* @returns Une promesse qui résout en l'ID du nouveau bucket créé.
*/
export async function createBucket(
  campaignId: string,
  versionId: string,
  bucket: Omit<Bucket, 'id'>
): Promise<string> {
  try {
      const bucketsCollection = collection(
          db,
          'clients',
          'CLIENT_ID',
          'campaigns',
          campaignId,
          'strategy',
          versionId,
          'buckets'
      );
      console.log("FIREBASE: ÉCRITURE - Fichier: code.js - Fonction: createBucket - Path: clients/CLIENT_ID/campaigns/${campaignId}/strategy/${versionId}/buckets");
      const docRef = await addDoc(bucketsCollection, bucket);
      return docRef.id;
  } catch (error) {
      console.error('Erreur lors de la création du bucket:', error);
      throw error;
  }
}

/**
* Met à jour un bucket existant pour une version spécifique d'une stratégie de campagne.
* @param campaignId L'identifiant de la campagne.
* @param versionId L'identifiant de la version de la stratégie.
* @param bucket Les données complètes du bucket à mettre à jour, incluant son ID.
* @returns Une promesse qui résout lorsque la mise à jour est terminée.
*/
export async function updateBucket(
  campaignId: string,
  versionId: string,
  bucket: Bucket
): Promise<void> {
  try {
      const bucketRef = doc(
          db,
          'clients',
          'CLIENT_ID',
          'campaigns',
          campaignId,
          'strategy',
          versionId,
          'buckets',
          bucket.id
      );

      const { id, ...data } = bucket;
      console.log("FIREBASE: ÉCRITURE - Fichier: code.js - Fonction: updateBucket - Path: clients/CLIENT_ID/campaigns/${campaignId}/strategy/${versionId}/buckets/${bucket.id}");
      await updateDoc(bucketRef, data);
  } catch (error) {
      console.error('Erreur lors de la mise à jour du bucket:', error);
      throw error;
  }
}

/**
* Supprime un bucket spécifique d'une version de stratégie de campagne.
* @param campaignId L'identifiant de la campagne.
* @param versionId L'identifiant de la version de la stratégie.
* @param bucketId L'identifiant du bucket à supprimer.
* @returns Une promesse qui résout lorsque la suppression est terminée.
*/
export async function deleteBucket(
  campaignId: string,
  versionId: string,
  bucketId: string
): Promise<void> {
  try {
      const bucketRef = doc(
          db,
          'clients',
          'CLIENT_ID',
          'campaigns',
          campaignId,
          'strategy',
          versionId,
          'buckets',
          bucketId
      );
      console.log("FIREBASE: ÉCRITURE - Fichier: code.js - Fonction: deleteBucket - Path: clients/CLIENT_ID/campaigns/${campaignId}/strategy/${versionId}/buckets/${bucketId}");
      await deleteDoc(bucketRef);
  } catch (error) {
      console.error('Erreur lors de la suppression du bucket:', error);
      throw error;
  }
}

/**
* Récupère toutes les versions de stratégie associées à une campagne donnée.
* @param campaignId L'identifiant de la campagne.
* @returns Une promesse qui résout en un tableau d'objets version.
*/
export async function getversions(campaignId: string): Promise<version[]> {
  try {
      const versionsCollection = collection(
          db,
          'clients',
          'CLIENT_ID',
          'campaigns',
          campaignId,
          'versions'
      );
      console.log("FIREBASE: LECTURE - Fichier: code.js - Fonction: getversions - Path: clients/CLIENT_ID/campaigns/${campaignId}/versions");
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

/**
* Crée une nouvelle version de stratégie pour une campagne.
* Optionnellement, elle peut copier les buckets d'une version de base existante.
* @param campaignId L'identifiant de la campagne.
* @param versionName Le nom de la nouvelle version.
* @param userEmail L'e-mail de l'utilisateur qui crée la version.
* @param baseVersionId L'identifiant d'une version existante dont les buckets doivent être copiés (optionnel).
* @returns Une promesse qui résout en l'ID de la nouvelle version créée.
*/
export async function createversion(
  campaignId: string,
  versionName: string,
  userEmail: string,
  baseVersionId?: string
): Promise<string> {
  try {
      const versionsCollection = collection(
          db,
          'clients',
          'CLIENT_ID',
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
      console.log("FIREBASE: ÉCRITURE - Fichier: code.js - Fonction: createversion - Path: clients/CLIENT_ID/campaigns/${campaignId}/versions");
      const docRef = await addDoc(versionsCollection, newVersion);
      const newVersionId = docRef.id;

      if (baseVersionId) {
          const baseBuckets = await getBuckets(campaignId, baseVersionId);

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

/**
* Définit une version de stratégie spécifique comme la version officielle pour une campagne.
* Cela met à jour la campagne pour pointer vers la nouvelle version officielle et
* réinitialise le statut 'isOfficial' pour toutes les autres versions de la campagne.
* @param campaignId L'identifiant de la campagne.
* @param versionId L'identifiant de la version à définir comme officielle.
* @returns Une promesse qui résout lorsque la mise à jour est terminée.
*/
export async function setOfficialversion(
  campaignId: string,
  versionId: string
): Promise<void> {
  try {
      const campaignRef = doc(
          db,
          'clients',
          'CLIENT_ID',
          'campaigns',
          campaignId
      );
      console.log("FIREBASE: ÉCRITURE - Fichier: code.js - Fonction: setOfficialversion - Path: clients/CLIENT_ID/campaigns/${campaignId}");
      await updateDoc(campaignRef, {
          officialversionId: versionId,
      });

      const versionsCollection = collection(
          db,
          'clients',
          'CLIENT_ID',
          'campaigns',
          campaignId,
          'versions'
      );

      const q = query(versionsCollection, where('isOfficial', '==', true));
      console.log("FIREBASE: LECTURE - Fichier: code.js - Fonction: setOfficialversion - Path: clients/CLIENT_ID/campaigns/${campaignId}/versions (query for isOfficial == true)");
      const snapshot = await getDocs(q);

      const updates = snapshot.docs.map(doc => {
          console.log("FIREBASE: ÉCRITURE - Fichier: code.js - Fonction: setOfficialversion - Path: clients/CLIENT_ID/campaigns/${campaignId}/versions/${doc.id}");
          return updateDoc(doc.ref, { isOfficial: false })
      });
      await Promise.all(updates);

      const versionRef = doc(
          db,
          'clients',
          'CLIENT_ID',
          'campaigns',
          campaignId,
          'versions',
          versionId
      );
      console.log("FIREBASE: ÉCRITURE - Fichier: code.js - Fonction: setOfficialversion - Path: clients/CLIENT_ID/campaigns/${campaignId}/versions/${versionId}");
      await updateDoc(versionRef, { isOfficial: true });
  } catch (error) {
      console.error('Erreur lors de la définition de la version officielle:', error);
      throw error;
  }
}