/**
 * Ce fichier contient des fonctions pour interagir avec la collection 'roles' dans Firebase.
 * Il permet de récupérer, créer, mettre à jour et supprimer des rôles.
 * Chaque rôle représente un ensemble de permissions au sein de l'application.
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Role, RoleFormData } from '../types/roles';

/**
 * Récupère tous les rôles de la collection 'roles' dans Firebase.
 * @returns Une promesse qui résout en un tableau d'objets Role. Retourne un tableau vide en cas d'erreur.
 */
export async function getRoles(): Promise<Role[]> {
  try {
    const rolesCollection = collection(db, 'roles');
    console.log("FIREBASE: LECTURE - Fichier: roleService.ts - Fonction: getRoles - Path: roles");
    const snapshot = await getDocs(rolesCollection);

    const roles = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        Access: data.Access || false,
        ClientInfo: data.ClientInfo || false,
        CostGuide: data.CostGuide || false,
        Currency: data.Currency || false,
        CustomCodes: data.CustomCodes || false,
        Dimensions: data.Dimensions || false,
        Fees: data.Fees || false,
        Listes: data.Listes || false,
        Taxonomy: data.Taxonomy || false,
        Templates: data.Templates || false,
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
      } as Role;
    });

    return roles;
  } catch (error) {
    console.error('Erreur lors de la récupération des rôles:', error);
    return [];
  }
}

/**
 * Récupère un rôle spécifique par son ID depuis la collection 'roles' dans Firebase.
 * @param roleId L'ID du rôle à récupérer.
 * @returns Une promesse qui résout en un objet Role si trouvé, sinon null. Retourne null en cas d'erreur.
 */
export async function getRole(roleId: string): Promise<Role | null> {
  try {
    const roleRef = doc(db, 'roles', roleId);
    console.log(`FIREBASE: LECTURE - Fichier: roleService.ts - Fonction: getRole - Path: roles/${roleId}`);
    const roleDoc = await getDoc(roleRef);

    if (!roleDoc.exists()) {
      return null;
    }

    const data = roleDoc.data();
    return {
      id: roleDoc.id,
      name: data.name || '',
      Access: data.Access || false,
      ClientInfo: data.ClientInfo || false,
      CostGuide: data.CostGuide || false,
      Currency: data.Currency || false,
      CustomCodes: data.CustomCodes || false,
      Dimensions: data.Dimensions || false,
      Fees: data.Fees || false,
      Listes: data.Listes || false,
      Taxonomy: data.Taxonomy || false,
      Templates: data.Templates || false,
      createdAt: data.createdAt || '',
      updatedAt: data.updatedAt || '',
    } as Role;
  } catch (error) {
    console.error(`Erreur lors de la récupération du rôle ${roleId}:`, error);
    return null;
  }
}

/**
 * Crée un nouveau rôle dans la collection 'roles' de Firebase.
 * @param roleData Les données du rôle à créer, conformes à l'interface RoleFormData.
 * @returns Une promesse qui résout en l'ID du nouveau rôle créé. Lance une erreur en cas d'échec.
 */
export async function createRole(roleData: RoleFormData): Promise<string> {
  try {
    const rolesCollection = collection(db, 'roles');
    const newRoleRef = doc(rolesCollection);

    console.log("FIREBASE: ÉCRITURE - Fichier: roleService.ts - Fonction: createRole - Path: roles");
    await setDoc(newRoleRef, {
      ...roleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newRoleRef.id;
  } catch (error) {
    console.error('Erreur lors de la création du rôle:', error);
    throw error;
  }
}

/**
 * Met à jour un rôle existant dans la collection 'roles' de Firebase.
 * @param roleId L'ID du rôle à mettre à jour.
 * @param roleData Les données partielles du rôle à modifier, conformes à l'interface Partial<RoleFormData>.
 * @returns Une promesse qui résout une fois la mise à jour terminée. Lance une erreur en cas d'échec.
 */
export async function updateRole(roleId: string, roleData: Partial<RoleFormData>): Promise<void> {
  try {
    const roleRef = doc(db, 'roles', roleId);

    console.log(`FIREBASE: ÉCRITURE - Fichier: roleService.ts - Fonction: updateRole - Path: roles/${roleId}`);
    await updateDoc(roleRef, {
      ...roleData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du rôle ${roleId}:`, error);
    throw error;
  }
}

/**
 * Supprime un rôle de la collection 'roles' dans Firebase.
 * @param roleId L'ID du rôle à supprimer.
 * @returns Une promesse qui résout une fois la suppression terminée. Lance une erreur en cas d'échec.
 */
export async function deleteRole(roleId: string): Promise<void> {
  try {
    const roleRef = doc(db, 'roles', roleId);
    console.log(`FIREBASE: ÉCRITURE - Fichier: roleService.ts - Fonction: deleteRole - Path: roles/${roleId}`);
    await deleteDoc(roleRef);
  } catch (error) {
    console.error(`Erreur lors de la suppression du rôle ${roleId}:`, error);
    throw error;
  }
}