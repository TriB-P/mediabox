// app/contexts/AuthContext.tsx (version mise à jour)

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
        const userDoc = await getDoc(userRef);
        const isNewUser = !userDoc.exists();

        // Mettre à jour les infos utilisateur dans Firestore
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
            console.log('Invitation traitée pour:', user.email);
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

  const signInWithGoogle = async () => {
    console.log('signInWithGoogle appelé');
    try {
      console.log('Tentative de connexion avec Google...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Connexion réussie:', result.user.email);
      const firebaseUser = result.user;

      // Vérifier si c'est un nouvel utilisateur
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      const isNewUser = !userDoc.exists();

      // Créer ou mettre à jour l'utilisateur dans Firestore
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
          console.log('Invitation acceptée pour:', firebaseUser.email);
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}