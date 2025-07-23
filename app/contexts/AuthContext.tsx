/**
 * Ce fichier gère l'authentification des utilisateurs pour l'application.
 * Il fournit un contexte React pour rendre les informations d'authentification disponibles
 * à travers toute l'application. Il gère la connexion via Google, la déconnexion,
 * et la persistance de l'état de l'utilisateur avec Firebase Authentication et Firestore.
 * Il s'occupe également de vérifier et de traiter les invitations pour les nouveaux utilisateurs.
 */
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { User, AuthContextType } from '../types/auth';
import { acceptInvitation } from '../lib/invitationService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Fournit le contexte d'authentification à l'application.
 * Gère l'état de l'utilisateur (connecté/déconnecté) et les opérations d'authentification.
 * @param {Object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - Les composants enfants qui auront accès au contexte.
 * @returns {JSX.Element} Le fournisseur de contexte d'authentification.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Effet de bord qui s'abonne aux changements de l'état d'authentification Firebase.
   * Met à jour l'état de l'utilisateur localement et dans Firestore.
   * Gère également le traitement des invitations pour les nouveaux utilisateurs.
   * @returns {Function} Une fonction de nettoyage pour se désabonner de l'observateur.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Convertir l'utilisateur Firebase en notre type User
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: new Date(),
          lastLogin: new Date(),
        };

        // Vérifier si c'est un nouvel utilisateur
        const userRef = doc(db, 'users', firebaseUser.uid);
        console.log("FIREBASE: LECTURE - Fichier: AuthContext.tsx - Fonction: useEffect - Path: users/${firebaseUser.uid}");
        const userDoc = await getDoc(userRef);
        const isNewUser = !userDoc.exists();

        // Mettre à jour les infos utilisateur dans Firestore
        console.log("FIREBASE: ÉCRITURE - Fichier: AuthContext.tsx - Fonction: useEffect - Path: users/${firebaseUser.uid}");
        await setDoc(
          userRef,
          {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: new Date(),
            ...(isNewUser && { createdAt: new Date() }),
          },
          { merge: true }
        );

        // Si c'est un nouvel utilisateur, vérifier s'il y a une invitation pendante
        if (isNewUser) {
          try {
            await acceptInvitation(user.email, firebaseUser.uid);
          } catch (error) {
            console.error('Erreur lors du traitement de l\'invitation:', error);
            // Ne pas bloquer la connexion si l'invitation échoue
          }
        }

        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Gère le processus de connexion de l'utilisateur avec Google.
   * Ouvre une fenêtre popup pour l'authentification Google et gère la création/mise à jour
   * de l'utilisateur dans Firestore. Traite également les invitations pour les nouveaux utilisateurs.
   * @returns {Promise<void>} Une promesse qui se résout une fois la connexion tentée.
   */
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Vérifier si c'est un nouvel utilisateur
      const userRef = doc(db, 'users', firebaseUser.uid);
      console.log("FIREBASE: LECTURE - Fichier: AuthContext.tsx - Fonction: signInWithGoogle - Path: users/${firebaseUser.uid}");
      const userDoc = await getDoc(userRef);
      const isNewUser = !userDoc.exists();

      // Créer ou mettre à jour l'utilisateur dans Firestore
      console.log("FIREBASE: ÉCRITURE - Fichier: AuthContext.tsx - Fonction: signInWithGoogle - Path: users/${firebaseUser.uid}");
      await setDoc(
        userRef,
        {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          lastLogin: new Date(),
          ...(isNewUser && { createdAt: new Date() }),
        },
        { merge: true }
      );

      // Si c'est un nouvel utilisateur, traiter l'invitation
      if (isNewUser && firebaseUser.email) {
        try {
          await acceptInvitation(firebaseUser.email, firebaseUser.uid);
        } catch (error) {
          console.error('Erreur lors de l\'acceptation de l\'invitation:', error);
          // Ne pas bloquer la connexion
        }
      }
    } catch (error: any) {
      console.error('Erreur détaillée de connexion:', error);
      console.error('Code erreur:', error.code);
      console.error('Message:', error.message);
    }
  };

  /**
   * Gère le processus de déconnexion de l'utilisateur.
   * Déconnecte l'utilisateur de Firebase et met à jour l'état local.
   * @returns {Promise<void>} Une promesse qui se résout une fois la déconnexion effectuée.
   */
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook personnalisé pour utiliser le contexte d'authentification.
 * @returns {AuthContextType} L'objet du contexte d'authentification contenant l'utilisateur, l'état de chargement et les fonctions d'authentification.
 * @throws {Error} Si le hook est utilisé en dehors d'un AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}