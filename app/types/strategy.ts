/**
 * Ce fichier définit les structures de données (interfaces) utilisées dans l'application
 * pour gérer les stratégies de campagne. Il inclut les définitions pour les buckets (enveloppes budgétaires),
 * les publishers (éditeurs média), les versions de stratégie, et la stratégie globale.
 * Il contient également les types pour les fonctions de service qui interagissent
 * avec ces données, notamment pour les opérations de lecture et d'écriture de buckets
 * ainsi que la gestion des versions de stratégie.
 */
export interface Bucket {
  id: string;
  name: string;
  description: string;
  target: number;
  actual: number;
  percentage: number;
  color: string;
  publishers: string[];
}

export interface Publisher {
  id: string;
  name: string;
  logo: string;
}

export interface version {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  isOfficial: boolean;
  buckets: Bucket[];
}

export interface Strategy {
  id: string;
  campaignId: string;
  versions: version[];
  officialVersionId: string;
}

/**
 * Définit les signatures des fonctions pour le service de gestion des buckets.
 *
 * @param campaignId L'identifiant de la campagne.
 * @param versionId L'identifiant de la version de la stratégie.
 * @param bucket Les données du bucket à créer ou mettre à jour.
 * @returns Une promesse qui résout en un tableau de buckets ou l'identifiant du bucket créé, ou rien pour les opérations de suppression/mise à jour.
 */
export interface BucketService {
  /**
   * Récupère tous les buckets pour une campagne et une version de stratégie données.
   *
   * @param campaignId L'identifiant de la campagne.
   * @param versionId L'identifiant de la version de la stratégie.
   * @returns Une promesse qui résout en un tableau de `Bucket`.
   */
  getBuckets: (campaignId: string, versionId: string) => Promise<Bucket[]>;
  /**
   * Crée un nouveau bucket pour une campagne et une version de stratégie données.
   *
   * @param campaignId L'identifiant de la campagne.
   * @param versionId L'identifiant de la version de la stratégie.
   * @param bucket Les données du bucket à créer, sans l'ID.
   * @returns Une promesse qui résout en l'identifiant du bucket créé.
   */
  createBucket: (campaignId: string, versionId: string, bucket: Omit<Bucket, 'id'>) => Promise<string>;
  /**
   * Met à jour un bucket existant pour une campagne et une version de stratégie données.
   *
   * @param campaignId L'identifiant de la campagne.
   * @param versionId L'identifiant de la version de la stratégie.
   * @param bucket Les données complètes du bucket à mettre à jour.
   * @returns Une promesse qui résout lorsque l'opération est terminée.
   */
  updateBucket: (campaignId: string, versionId: string, bucket: Bucket) => Promise<void>;
  /**
   * Supprime un bucket spécifique pour une campagne et une version de stratégie données.
   *
   * @param campaignId L'identifiant de la campagne.
   * @param versionId L'identifiant de la version de la stratégie.
   * @param bucketId L'identifiant du bucket à supprimer.
   * @returns Une promesse qui résout lorsque l'opération est terminée.
   */
  deleteBucket: (campaignId: string, versionId: string, bucketId: string) => Promise<void>;

  /**
   * Crée une nouvelle version de stratégie pour une campagne donnée.
   *
   * @param campaignId L'identifiant de la campagne.
   * @param versionName Le nom de la nouvelle version.
   * @param baseVersionId (Optionnel) L'identifiant de la version à partir de laquelle copier les données.
   * @returns Une promesse qui résout en l'identifiant de la version créée.
   */
  createVersion: (campaignId: string, versionName: string, baseVersionId?: string) => Promise<string>;

  /**
   * Définit une version existante comme la version officielle pour une campagne donnée.
   *
   * @param campaignId L'identifiant de la campagne.
   * @param versionId L'identifiant de la version à définir comme officielle.
   * @returns Une promesse qui résout lorsque l'opération est terminée.
   */
  setOfficialVersion: (campaignId: string, versionId: string) => Promise<void>;
}