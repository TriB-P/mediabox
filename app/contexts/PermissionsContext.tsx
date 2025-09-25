/**
 * Ce fichier gère les permissions des utilisateurs dans l'application.
 * Il fournit un contexte React pour accéder aux permissions et au rôle de l'utilisateur.
 * Les permissions sont chargées depuis Firebase Firestore en fonction du rôle de l'utilisateur.
 * Il expose également une fonction utilitaire pour vérifier si l'utilisateur peut effectuer une action spécifique.
 */
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface Permissions {
  Access: boolean;
  ClientInfo: boolean;
  CostGuide: boolean;
  Currency: boolean;
  CustomCodes: boolean;
  Dimensions: boolean;
  Fees: boolean;
  Listes: boolean;
  Taxonomy: boolean;
  Templates: boolean;
  Indicators: boolean;
}

interface PermissionsContextType {
  permissions: Permissions;
  userRole: string | null;
  loading: boolean;
  canPerformAction: (permissionKey: keyof Permissions) => boolean;
}

const defaultPermissions: Permissions = {
  Access: false,
  ClientInfo: false,
  CostGuide: false,
  Currency: false,
  CustomCodes: false,
  Dimensions: false,
  Fees: false,
  Listes: false,
  Taxonomy: false,
  Templates: false,
  Indicators: false,
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

/**
 * Fournit le contexte des permissions aux composants enfants.
 * Charge les permissions de l'utilisateur depuis Firebase Firestore.
 * @param {Object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - Les éléments enfants à rendre.
 * @returns {JSX.Element} Le fournisseur de contexte des permissions.
 */
export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Charge les permissions de l'utilisateur depuis Firebase.
     * Récupère le rôle de l'utilisateur, puis les permissions associées à ce rôle.
     */
    const loadPermissions = async () => {
      if (!user) {
        setPermissions(defaultPermissions);
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        console.log("FIREBASE: LECTURE - Fichier: PermissionsContext.tsx - Fonction: loadPermissions - Path: users/${user.id}");
        const userDocRef = doc(db, 'users', user.id);
        const userSnapshot = await getDoc(userDocRef);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          const role = userData.role || 'user';
          setUserRole(role);
          
          console.log("FIREBASE: LECTURE - Fichier: PermissionsContext.tsx - Fonction: loadPermissions - Path: roles/${role}");
          const roleDocRef = doc(db, 'roles', role);
          const roleSnapshot = await getDoc(roleDocRef);
          
          if (roleSnapshot.exists()) {
            const roleData = roleSnapshot.data() as Permissions;
            setPermissions(roleData);
          } else {
            console.warn(`Rôle ${role} non trouvé dans Firestore`);
            setPermissions(defaultPermissions);
          }
        } else {
          console.warn(`Utilisateur ${user.id} non trouvé dans Firestore`);
          setPermissions(defaultPermissions);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des permissions:', error);
        setPermissions(defaultPermissions);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user]);

  /**
   * Vérifie si l'utilisateur a la permission d'effectuer une action spécifique.
   * Les administrateurs ont toutes les permissions.
   * @param {keyof Permissions} permissionKey - La clé de la permission à vérifier.
   * @returns {boolean} Vrai si l'utilisateur a la permission, faux sinon.
   */
  const canPerformAction = (permissionKey: keyof Permissions): boolean => {
    if (loading) return false;
    
    if (userRole === 'admin') return true;
    
    return permissions[permissionKey] === true;
  };

  const value: PermissionsContextType = {
    permissions,
    userRole,
    loading,
    canPerformAction,
  };

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

/**
 * Hook personnalisé pour utiliser le contexte des permissions.
 * @returns {PermissionsContextType} Le contexte des permissions.
 * @throws {Error} Si le hook est utilisé en dehors d'un PermissionsProvider.
 */
export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}