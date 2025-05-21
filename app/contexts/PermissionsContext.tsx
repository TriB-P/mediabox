'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

// Définition de la structure des permissions
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
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setPermissions(defaultPermissions);
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Récupérer le rôle de l'utilisateur
        const userDocRef = doc(db, 'users', user.id);
        const userSnapshot = await getDoc(userDocRef);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          const role = userData.role || 'user';
          setUserRole(role);
          
          // Récupérer les permissions basées sur le rôle
          const roleDocRef = doc(db, 'Roles', role);
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

  // Fonction utilitaire pour vérifier une permission spécifique
  const canPerformAction = (permissionKey: keyof Permissions): boolean => {
    if (loading) return false;
    
    // Les administrateurs ont toutes les permissions
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

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}