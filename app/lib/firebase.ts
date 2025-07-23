/**
 * Ce fichier initialise l'application Firebase et exporte les instances de ses services
 * principaux tels que Firestore (base de données), Authentication (authentification des utilisateurs),
 * et Storage (stockage de fichiers). Il configure également le fournisseur Google
 * pour l'authentification, incluant des scopes spécifiques pour l'accès à Google Sheets.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Initialise l'application Firebase avec la configuration fournie.
 * @returns L'instance de l'application Firebase.
 */
const app = initializeApp(firebaseConfig);

/**
 * Initialise le service Firestore.
 * @param app L'instance de l'application Firebase.
 * @returns L'instance de Firestore.
 */
export const db = getFirestore(app);

/**
 * Initialise le service d'authentification.
 * @param app L'instance de l'application Firebase.
 * @returns L'instance d'authentification.
 */
export const auth = getAuth(app);

/**
 * Initialise le service de stockage.
 * @param app L'instance de l'application Firebase.
 * @returns L'instance de stockage.
 */
export const storage = getStorage(app);

/**
 * Initialise le fournisseur d'authentification Google.
 * @returns L'instance du fournisseur GoogleAuthProvider.
 */
export const googleProvider = new GoogleAuthProvider();

/**
 * Définit des paramètres personnalisés pour le fournisseur Google, demandant à l'utilisateur de sélectionner un compte.
 * @param parameters Un objet contenant les paramètres personnalisés.
 */
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Ajoute un scope pour l'accès à Google Sheets au fournisseur Google.
 * @param scope La chaîne de caractères représentant le scope à ajouter.
 */
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');