// Types pour le module de stratégie

// Représente un bucket (enveloppe budgétaire)
export interface Bucket {
  id: string;
  name: string;
  description: string;
  target: number;        // Montant cible alloué à ce bucket
  actual: number;        // Montant réel dépensé (viendra du module tactiques)
  percentage: number;    // Pourcentage du budget total alloué à ce bucket
  color: string;         // Couleur associée au bucket
  publishers: string[];  // IDs des publishers associés à ce bucket
}

// Représente un publisher média
export interface Publisher {
  id: string;
  name: string;
  logo: string;          // URL du logo ou emoji pour les placeholders
}

// Représente une version de stratégie
export interface version {
  id: string;
  name: string;
  createdAt: string;     // Date de création au format ISO
  createdBy: string;     // Email ou ID de l'utilisateur qui a créé cette version
  isOfficial: boolean;   // Indique si cette version est la version officielle
  buckets: Bucket[];     // Liste des buckets dans cette version
}

// Pour stocker les stratégies dans Firestore
export interface Strategy {
  id: string;
  campaignId: string;    // ID de la campagne associée
  versions: version[]; // Versions de cette stratégie
  officialVersionId: string;   // ID de la version officielle
}

// Types des fonctions de service pour les opérations sur les buckets
export interface BucketService {
  getBuckets: (campaignId: string, versionId: string) => Promise<Bucket[]>;
  createBucket: (campaignId: string, versionId: string, bucket: Omit<Bucket, 'id'>) => Promise<string>;
  updateBucket: (campaignId: string, versionId: string, bucket: Bucket) => Promise<void>;
  deleteBucket: (campaignId: string, versionId: string, bucketId: string) => Promise<void>;
  
  // Créer une nouvelle version
  createVersion: (campaignId: string, versionName: string, baseVersionId?: string) => Promise<string>;
  
  // Mettre à jour la version officielle
  setOfficialVersion: (campaignId: string, versionId: string) => Promise<void>;
}