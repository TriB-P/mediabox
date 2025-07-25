// app/locales/translations.ts
/**
 * Fichier de traductions pour l'application.
 * Contient toutes les traductions en français et anglais.
 */

export const translations = {
  fr: {
    admin: {
      title: "Administration",
      subtitle: "Gérer les utilisateurs et les permissions",
      tabs: {
        users: "Utilisateurs",
        permissions: "Permissions"
      }
    },
    campaigns: {
      title: "Campagnes",
      noClientSelected: "Aucun client sélectionné",
      noClientMessage: "Veuillez sélectionner un client pour voir ses campagnes.",
      client: "Client:",
      totalCampaigns: "Campagnes totales",
      totalBudget: "Budget total",
      searchLabel: "Rechercher une campagne",
      searchPlaceholder: "Rechercher par nom ou identifiant...",
      newCampaign: "Nouvelle campagne",
      loadingError: "Erreur lors du chargement des campagnes",
      retry: "Réessayer",
      savingError: "Erreur lors de la sauvegarde",
      deletingError: "Erreur lors de la suppression",
      noData: "Aucune campagne trouvée",
      noResults: "Aucun résultat pour votre recherche",
      status: {
        active: "Actif",
        inactive: "Inactif",
        draft: "Brouillon",
        completed: "Terminé",
        paused: "En pause"
      },
      table: {
        name: "Nom",
        nameIdentifier: "Nom / Identifiant",
        identifier: "Identifiant",
        identifierShort: "ID",
        budget: "Budget",
        status: "Statut",
        period: "Période",
        startDate: "Date de début",
        endDate: "Date de fin",
        dates: "Dates",
        actions: "Actions",
        noDataMessage: "Aucune campagne n'a été créée pour ce client.",
        createFirst: "Créer la première campagne",
        noCampaignsTitle: "Aucune campagne",
        noCampaignsMessage: "Commencez par créer votre première campagne.",
        divisionsLoadingError: "Impossible de charger les divisions"
      },
      drawer: {
        createTitle: "Créer une nouvelle campagne",
        editTitle: "Modifier la campagne",
        form: {
          name: "Nom de la campagne",
          identifier: "Identifiant de campagne",
          budget: "Budget",
          startDate: "Date de début",
          endDate: "Date de fin",
          description: "Description",
          status: "Statut"
        },
        validation: {
          nameRequired: "Le nom de la campagne est requis",
          identifierRequired: "L'identifiant de campagne est requis",
          budgetRequired: "Le budget est requis",
          budgetMinimum: "Le budget doit être supérieur à 0",
          startDateRequired: "La date de début est requise",
          endDateRequired: "La date de fin est requise",
          endDateAfterStart: "La date de fin doit être après la date de début"
        },
        breakdowns: {
          title: "Répartitions supplémentaires",
          add: "Ajouter une répartition",
          remove: "Supprimer",
          name: "Nom de la répartition",
          budget: "Budget alloué"
        }
      }
    },
    common: {
      loading: "Chargement...",
      save: "Sauvegarder",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      duplicate : "Dupliquer",
      close: "Fermer",
      create: "Créer",
      update: "Mettre à jour",
      view: "Voir",
      search: "Rechercher",
      filter: "Filtrer",
      export: "Exporter",
      import: "Importer",
      settings: "Paramètres",
      refresh: "Actualiser",
      yes: "Oui",
      no: "Non",
      confirm: "Confirmer",
      warning: "Attention",
      error: "Erreur",
      success: "Succès",
      info: "Information"
    },
    errors: {
      generic: "Une erreur inattendue s'est produite",
      network: "Erreur de connexion réseau",
      unauthorized: "Accès non autorisé",
      forbidden: "Action interdite",
      notFound: "Ressource non trouvée",
      validation: "Erreur de validation",
      server: "Erreur serveur interne",
      timeout: "Délai d'attente dépassé"
    },
    actions: {
      confirmDelete: "Êtes-vous sûr de vouloir supprimer cet élément ?",
      confirmDeleteMultiple: "Êtes-vous sûr de vouloir supprimer ces éléments ?",
      unsavedChanges: "Vous avez des modifications non sauvegardées. Voulez-vous continuer ?",
      operationSuccess: "Opération réussie",
      operationFailed: "Échec de l'opération"
    }
  },
  en: {
    admin: {
      title: "Administration",
      subtitle: "Manage users and permissions",
      tabs: {
        users: "Users",
        permissions: "Permissions"
      }
    },
    campaigns: {
      title: "Campaigns",
      noClientSelected: "No client selected",
      noClientMessage: "Please select a client to view their campaigns.",
      client: "Client:",
      totalCampaigns: "Total campaigns",
      totalBudget: "Total budget",
      searchLabel: "Search campaign",
      searchPlaceholder: "Search by name or identifier...",
      newCampaign: "New campaign",
      loadingError: "Error loading campaigns",
      retry: "Retry",
      savingError: "Error saving",
      deletingError: "Error deleting",
      noData: "No campaigns found",
      noResults: "No results for your search",
      status: {
        active: "Active",
        inactive: "Inactive",
        draft: "Draft",
        completed: "Completed",
        paused: "Paused"
      },
      table: {
        name: "Name",
        nameIdentifier: "Name / Identifier",
        identifier: "Identifier",
        identifierShort: "ID",
        budget: "Budget",
        status: "Status",
        period: "Period",
        startDate: "Start Date",
        endDate: "End Date",
        dates: "Dates",
        actions: "Actions",
        noDataMessage: "No campaigns have been created for this client.",
        createFirst: "Create first campaign",
        noCampaignsTitle: "No campaigns",
        noCampaignsMessage: "Start by creating your first campaign.",
        divisionsLoadingError: "Could not load divisions"
      },
      drawer: {
        createTitle: "Create new campaign",
        editTitle: "Edit campaign",
        form: {
          name: "Campaign name",
          identifier: "Campaign identifier",
          budget: "Budget",
          startDate: "Start date",
          endDate: "End date",
          description: "Description",
          status: "Status"
        },
        validation: {
          nameRequired: "Campaign name is required",
          identifierRequired: "Campaign identifier is required",
          budgetRequired: "Budget is required",
          budgetMinimum: "Budget must be greater than 0",
          startDateRequired: "Start date is required",
          endDateRequired: "End date is required",
          endDateAfterStart: "End date must be after start date"
        },
        breakdowns: {
          title: "Additional breakdowns",
          add: "Add breakdown",
          remove: "Remove",
          name: "Breakdown name",
          budget: "Allocated budget"
        }
      }
    },
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      duplicate : "Duplicate",
      close: "Close",
      create: "Create",
      update: "Update",
      view: "View",
      search: "Search",
      filter: "Filter",
      export: "Export",
      import: "Import",
      settings: "Settings",
      refresh: "Refresh",
      yes: "Yes",
      no: "No",
      confirm: "Confirm",
      warning: "Warning",
      error: "Error",
      success: "Success",
      info: "Information"
    },
    errors: {
      generic: "An unexpected error occurred",
      network: "Network connection error",
      unauthorized: "Unauthorized access",
      forbidden: "Forbidden action",
      notFound: "Resource not found",
      validation: "Validation error",
      server: "Internal server error",
      timeout: "Request timeout"
    },
    actions: {
      confirmDelete: "Are you sure you want to delete this item?",
      confirmDeleteMultiple: "Are you sure you want to delete these items?",
      unsavedChanges: "You have unsaved changes. Do you want to continue?",
      operationSuccess: "Operation successful",
      operationFailed: "Operation failed"
    }
  }
};