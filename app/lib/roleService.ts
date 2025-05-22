// app/lib/roleService.ts

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
  
  // Récupérer tous les rôles
  export async function getRoles(): Promise<Role[]> {
    try {
      console.log('Récupération de tous les rôles...');
      const rolesCollection = collection(db, 'roles');
      const snapshot = await getDocs(rolesCollection);
      
      console.log(`Nombre de rôles trouvés: ${snapshot.size}`);
      
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
  
  // Récupérer un rôle par son ID
  export async function getRole(roleId: string): Promise<Role | null> {
    try {
      console.log(`Récupération du rôle ${roleId}`);
      const roleRef = doc(db, 'roles', roleId);
      const roleDoc = await getDoc(roleRef);
      
      if (!roleDoc.exists()) {
        console.log(`Rôle ${roleId} non trouvé`);
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
  
  // Créer un nouveau rôle
  export async function createRole(roleData: RoleFormData): Promise<string> {
    try {
      console.log('Création d\'un nouveau rôle:', roleData);
      const rolesCollection = collection(db, 'roles');
      const newRoleRef = doc(rolesCollection);
      
      await setDoc(newRoleRef, {
        ...roleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log(`Rôle créé avec l'ID: ${newRoleRef.id}`);
      return newRoleRef.id;
    } catch (error) {
      console.error('Erreur lors de la création du rôle:', error);
      throw error;
    }
  }
  
  // Mettre à jour un rôle
  export async function updateRole(roleId: string, roleData: Partial<RoleFormData>): Promise<void> {
    try {
      console.log(`Mise à jour du rôle ${roleId}:`, roleData);
      const roleRef = doc(db, 'roles', roleId);
      
      await updateDoc(roleRef, {
        ...roleData,
        updatedAt: serverTimestamp(),
      });
      
      console.log(`Rôle ${roleId} mis à jour`);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du rôle ${roleId}:`, error);
      throw error;
    }
  }
  
  // Supprimer un rôle
  export async function deleteRole(roleId: string): Promise<void> {
    try {
      console.log(`Suppression du rôle ${roleId}`);
      const roleRef = doc(db, 'roles', roleId);
      await deleteDoc(roleRef);
      
      console.log(`Rôle ${roleId} supprimé`);
    } catch (error) {
      console.error(`Erreur lors de la suppression du rôle ${roleId}:`, error);
      throw error;
    }
  }