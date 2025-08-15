// app/locales/translations.ts
/**
 * Fichier de traductions pour l'application.
 * Contient toutes les traductions en français et anglais.
 */

import ListHeader from "@/components/Client/ListHeader";
import ClientDropdown from "@/components/Others/ClientDropdown";

export const translations = {
  fr: {
    navigation: {
      version: {
        title: "Informations de version",
        current: "Actuel",
        previous: "Précédent", 
        upcoming: "À venir",
        whatsNew: "Nouveautés de cette version",
        previousVersions: "Versions précédentes",
        upcomingFeatures: "Fonctionnalités à venir",
        upcomingDisclaimer: "Ces fonctionnalités sont en développement et peuvent changer."
      },
      menus:{
        campaigns: "Campagnes",
        strategy: "Stratégie",
        tactics: "Tactiques",
        documents: "Documents",
        costGuide: "Guide de coût",
        partners: "Partenaires",
        clientConfig: "Client",
        admin: "Admin",
        help: "Aide"
      }
    },
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
      searchPlaceholder: "Rechercher par nom de campagne ou identifiant...",
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
        quarter: "Période",
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
      actions: {
        deleteConfirm: "Êtes-vous sûr de vouloir supprimer la campagne \"{{name}}\" ?\n\nCette action est irréversible et supprimera également toutes les tactiques, versions et autres données associées.",
        deleteError: "Erreur lors de la suppression de la campagne. Veuillez réessayer.",
        duplicateSuccess: "Campagne dupliquée avec succès !",
        duplicateError: "Erreur lors de la duplication de la campagne. Veuillez réessayer.",
        userNotConnected: "Utilisateur non connecté.",
        editTitle: "Modifier la campagne",
        duplicateTitle: "Dupliquer la campagne",
        deleteTitle: "Supprimer la campagne"
      },
      drawer: {
        createTitle: "Nouvelle campagne",
        editTitle: "Modifier la campagne",
        tabs: {
          info: "Informations",
          dates: "Dates",
          budget: "Budget",
          breakdown: "Répartition",
          admin: "Administration"
        },
        buttons: {
          saving: "Enregistrement..."
        },
        closeSr: "Fermer",
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
      },
      formAdmin: {
        title: "Administration",
        description: "Informations administratives et de facturation",
        extClientId: "ID externe client",
        extClientIdHelp: "Identifiant de la campagne dans le système de facturation interne du client",
        extClientIdPlaceholder: "Ex: CLI-2024-001",
        poNumber: "Numéro de PO",
        poNumberHelp: "Numéro de bon de commande (Purchase Order) associé à cette campagne",
        poNumberPlaceholder: "Ex: PO-2024-12345",
        billingId: "ID Facturation (MCPE)",
        billingIdHelp: "Identifiant de facturation pour cette campagne dans MediaOcean",
        billingIdPlaceholder: "Ex: BILL-2024-789",
        tipTitle: "💡 Conseil",
        tipText: "Ces informations administratives sont optionnelles mais recommandées pour faciliter le suivi et la facturation de vos campagnes. Elles peuvent être définies au niveau du client et héritées par les tactiques."
      },
      formBreakdown: {
        title: "Répartition temporelle",
        description: "Définissez comment sera divisée votre campagne dans le temps",
        datesRequiredTitle: "Dates requises :",
        datesRequiredText: "Veuillez définir les dates de début et de fin de la campagne dans l'onglet \"Dates\" avant de configurer les répartitions.",
        loadingError: "Erreur lors du chargement des planifications",
        maxBreakdownsError: "Maximum 3 répartitions autorisées",
        datesNotDefinedError: "Les dates de campagne doivent être définies avant de créer une répartition",
        defaultBreakdownModifyError: "Le breakdown par défaut \"Calendrier\" ne peut pas être modifié. Ses dates sont automatiquement synchronisées avec les dates de la campagne.",
        saveError: "Erreur lors de la sauvegarde",
        deleteError: "Erreur lors de la suppression",
        deleteConfirm: "Êtes-vous sûr de vouloir supprimer cette planification ?",
        defaultDeleteError: "Impossible de supprimer la planification par défaut",
        atLeastOnePeriodError: "Au moins une période doit être définie",
        addBreakdown: "Ajouter une répartition",
        defaultBreakdownLabel: "(Par défaut - Synchronisé avec les dates de campagne)",
        updatedAutomatically: "Mis à jour automatiquement",
        periodsCount: " période(s)",
        notEditable: "Non modifiable",
        defaultBreakdownInfoTitle: "📅 Breakdown par défaut :",
        defaultBreakdownInfoText: "Le breakdown \"Calendrier\" est automatiquement créé et synchronisé avec les dates de votre campagne. Il commence toujours un lundi et ne peut pas être modifié manuellement.",
        modal: {
          newTitle: "Nouvelle répartition",
          editTitle: "Modifier la répartition",
          nameLabel: "Nom *",
          namePlaceholder: "Ex: Sprint 1, Phase initiale...",
          nameHelp: "Nom descriptif de cette répartition temporelle",
          typeLabel: "Type *",
          typeHelp: "Type de répartition : Hebdomadaire (début lundi), Mensuel (début 1er du mois) ou Personnalisé (périodes multiples)",
          startDateLabel: "Date de début *",
          startDateHelpWeekly: "Date de début de la répartition (doit être un lundi)",
          startDateHelpMonthly: "Date de début de la répartition (doit être le 1er du mois)",
          startDateHelpCustom: "Date de début de la répartition",
          endDateLabel: "Date de fin *",
          endDateHelp: "Date de fin de la répartition",
          endDateAfterStartError: "La date de fin doit être postérieure à la date de début",
          customPeriodsLabel: "Périodes personnalisées *",
          customPeriodsHelp: "Définissez autant de périodes que nécessaire (ex: Q1, Q2, Phase 1, etc.). Seuls les noms sont requis.",
          addPeriod: "Ajouter une période",
          period: "Période ",
          periodNameLabel: "Nom de la période *",
          periodNamePlaceholder: "Ex: Q1, Phase 1, Sprint 1...",
          saving: "Sauvegarde..."
        }
      },
      formBudget: {
        title: "Budget et coûts",
        description: "Définissez le budget principal et les frais additionnels",
        mainBudgetLabel: "Budget principal *",
        mainBudgetHelp: "Budget principal alloué à cette campagne (incluant tous les frais)",
        currencyLabel: "Devise",
        currencyHelp: "Devise utilisée pour cette campagne",
        customFeesTitle: "Frais personnalisés",
        customFeesDescription: "Ajoutez des frais additionnels spécifiques à votre campagne",
        customFeeHelp: "Frais additionnel personnalisé",
        summaryTitle: "Récapitulatif budgétaire",
        summaryMainBudget: "Budget principal :",
        summaryCustomFees: "Total frais personnalisés :",
        summaryMediaBudget: "Budget média disponible :",
        negativeBudgetWarning:" Le budget média disponible est négatif. Veuillez vérifier vos frais.",
      },
      formDates: {
        title: "Planification temporelle",
        description: "Définissez la période d'exécution de votre campagne",
        startDateLabel: "Date de début *",
        startDateHelp: "Date de lancement officiel de la campagne",
        endDateLabel: "Date de fin *",
        endDateHelp: "Date de fin prévue de la campagne",
        validationError: "La date de fin doit être postérieure à la date de début",
        sprintPeriodLabel: "Période de sprint (automatique)",
        sprintPeriodHelp: "Ce champ est généré automatiquement à partir des dates de début et de fin.",
        sprintPeriodGenerated: "Généré avec les dates",
        campaignDuration: "Durée de la campagne :",
        days: "jours"
      },
      formInfo: {
        title: "Informations générales",
        description: "Configuration de base de la campagne",
        nameLabel: "Nom de la campagne *",
        nameHelp: "Nom d'affichage principal de la campagne.",
        namePlaceholder: "Ex: Lancement estival",
        identifierLabel: "Identifiant de campagne *",
        identifierHelp: "Identifiant unique utilisé dans les taxonomies.",
        identifierPlaceholder: "Ex: campagne-black-friday",
        creativeFolderLabel: "Dossier créatifs",
        creativeFolderHelp: "Lien vers le dossier contenant les créatifs pour cette campagne",
        creativeFolderPlaceholder: "Lien vers le dossier des créatifs",
        divisionLabel: "Division",
        divisionHelp: "Division ou unité d'affaires",
        divisionPlaceholder: "Sélectionner une division",
        quarterLabel: "Trimestre *",
        quarterHelp: "Période fiscale de la campagne",
        quarterPlaceholder: "Sélectionner un trimestre",
        yearLabel: "Année *",
        yearHelp: "Année fiscale de la campagne",
        yearPlaceholder: "Sélectionner une année",
        customDimHelp: "Dimension: {{name}}",
        customDimSelectPlaceholder: "Sélectionner {{name}}",
        customDimInputPlaceholder: "Saisir {{name}}"
      },
      versions: {
        title: "Versions",
        newVersion: "Nouvelle version",
        loading: "Chargement des versions...",
        createError: "Erreur lors de la création de la version. Veuillez réessayer.",
        officialError: "Erreur lors du changement de version officielle. Veuillez réessayer.",
        deleteError: "Erreur lors de la suppression de la version. Veuillez réessayer.",
        deleteConfirmMessage: "Êtes-vous sûr de vouloir supprimer la version \"{{name}}\" ?\n\n⚠️ ATTENTION : Cette action est irréversible et supprimera :\n• Toutes les tactiques de cette version\n• Tous les créatifs associés\n• Tous les placements associés\n• Toutes les autres données liées à cette version\n\nVoulez-vous vraiment continuer ?",
        deleteOfficialError: "Impossible de supprimer la version officielle.",
        deleteSuccess: "Version supprimée avec succès.",
        official: "Officielle",
        createdBy: "Créée par {{user}} le {{date}}",
        isOfficialTitle: "Version officielle",
        setOfficialTitle: "Définir comme version officielle",
        deleteVersionTitle: "Supprimer cette version",
        namePlaceholder: "Nom de la version",
        noVersions: "Aucune version créée pour cette campagne."
      }
    },
    clients: {
      general: {
        title: "Général",
        description: "Informations générales sur le client.",
        form: {
          nameLabel: "Nom du client",
          nameHelp: "Nom complet du client.",
          identifierLabel: "Identifiant du client",
          identifierHelp: "Identifiant unique du client.",
          activeLabel: "Actif",
          saving: "Sauvegarde..."
        }
      },
      access: {
        title: "Accès",
        description: "Gérez qui peut accéder à ce client.",
        usersWithAccess: "Utilisateurs ayant accès",
        addUser: "Ajouter un utilisateur",
        searchPlaceholder: "Rechercher un utilisateur...",
        noUserFound: "Aucun utilisateur trouvé.",
        removeAccess: "Retirer l'accès",
        removeConfirm: "Êtes-vous sûr de vouloir retirer l'accès à cet utilisateur ?"
      },
      currencies: {
        title: "Devises",
        description: "Gérez les devises pour ce client.",
        addCurrency: "Ajouter une devise",
        defaultCurrency: "Devise par défaut",
        setDefault: "Définir par défaut",
        deleteConfirm: "Êtes-vous sûr de vouloir supprimer la devise {currencyName} ?",
        deleteDefaultError: "Cette devise est définie par défaut et ne peut pas être supprimée.",
        table: {
          name: "Nom",
          code: "Code",
          symbol: "Symbole",
          rate: "Taux de change (vs {defaultCurrency})",
          default: "Par défaut"
        },
        form: {
          addTitle: "Ajouter une devise",
          editTitle: "Modifier la devise",
          nameLabel: "Nom",
          codeLabel: "Code (3 lettres)",
          symbolLabel: "Symbole",
          rateLabel: "Taux de change",
          rateHelp: "Taux de change par rapport à la devise par défaut."
        }
      },
      customCodes: {
        title: "Codes personnalisés",
        description: "Gérez les codes personnalisés pour ce client.",
        addCode: "Ajouter un code",
        deleteConfirm: "Êtes-vous sûr de vouloir supprimer le code {codeName} ?",
        table: {
          name: "Nom",
          code: "Code",
          description: "Description",
          active: "Actif"
        }
      },
      dimensions: {
        title: "Dimensions",
        description: "Gérez les dimensions personnalisées pour ce client.",
        addDimension: "Ajouter une dimension",
        deleteConfirm: "Êtes-vous sûr de vouloir supprimer la dimension {dimensionName} ?",
        table: {
          name: "Nom",
          type: "Type",
          active: "Actif",
          required: "Requis"
        },
        sidebar: {
          addTitle: "Ajouter une dimension",
          editTitle: "Modifier la dimension",
          nameLabel: "Nom de la dimension",
          nameHelp: "Nom d'affichage de la dimension.",
          typeLabel: "Type de dimension",
          typeList: "Liste",
          typeText: "Texte",
          listLabel: "Liste d'options",
          listHelp: "Sélectionnez une liste d'options.",
          activeLabel: "Actif",
          activeHelp: "Rendre cette dimension active.",
          requiredLabel: "Requis",
          requiredHelp: "Rendre cette dimension requise."
        }
      },
      fees: {
        title: "Frais",
        description: "Gérez les frais pour ce client.",
        addFee: "Ajouter un frais",
        deleteConfirm: "Êtes-vous sûr de vouloir supprimer le frais {feeName} ?",
        table: {
          name: "Nom",
          type: "Type",
          value: "Valeur",
          includedInBudget: "Inclus dans le budget",
          active: "Actif"
        },
        form: {
          addTitle: "Ajouter un frais",
          editTitle: "Modifier le frais",
          nameLabel: "Nom du frais",
          typeLabel: "Type de frais",
          typePercentage: "Pourcentage",
          typeFixed: "Montant fixe",
          valueLabel: "Valeur",
          includedLabel: "Inclus dans le budget",
          activeLabel: "Actif"
        }
      },
      lists: {
        title: "Listes",
        description: "Gérez les listes personnalisées pour ce client.",
        addList: "Ajouter une liste",
        deleteConfirm: "Êtes-vous sûr de vouloir supprimer la liste {listName} ?",
        table: {
          name: "Nom",
          itemCount: "Nombre d'éléments"
        },
        items: {
          title: "Éléments",
          addItem: "Ajouter un élément",
          backToLists: "Retour aux listes",
          table: {
            name: "Nom",
            value: "Valeur",
            active: "Actif"
          },
          form: {
            addTitle: "Ajouter un élément",
            editTitle: "Modifier l'élément",
            nameLabel: "Nom",
            valueLabel: "Valeur",
            activeLabel: "Actif"
          }
        }
      },
      templates: {
        title: "Gabarits",
        description: "Gérez les gabarits pour ce client.",
        addTemplate: "Ajouter un gabarit",
        deleteConfirm: "Êtes-vous sûr de vouloir supprimer le gabarit {templateName} ?",
        table: {
          name: "Nom",
          description: "Description"
        },
        form: {
          addTitle: "Ajouter un gabarit",
          editTitle: "Modifier le gabarit",
          nameLabel: "Nom du gabarit",
          descriptionLabel: "Description",
          contentLabel: "Contenu du gabarit"
        }
      }
    },
    tactics: {
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
      info: "Information",
      logout: "Déconnexion",
      on: "sur",
      all:"Tous",
      clearFilters:"Effacer les filtres",
      formatted: "Formaté :",
      tab:"Onglet",

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
      unsavedChanges: "Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?",
      operationSuccess: "Opération réussie",
      operationFailed: "Échec de l'opération"
    },
    strategy: {
      title: "Stratégie",
      newBucket: "Nouvelle enveloppe",
      description: "Les enveloppes budgétaires sont un outil pour les équipes de planification qui permet d'utiliser MediaBox pour faire de la planification à très haut niveau. Vous pouvez créer autant d'enveloppe que vous le souhaitez et assigner une portion du budget de la campagne dans ses enveloppes. Le montant \"Assigné dans MediaBox\" reflète automatiquement le budget total (incluant les frais) des tactiques assignées à chaque enveloppe.",
      loadingError: "Erreur lors du chargement des enveloppes.",
      unnamedBucket: "Enveloppe sans nom",
      newBucketName: "Nouvelle enveloppe",
      newBucketDescription: "Description de l'enveloppe",
      campaign: "Campagne:",
      version: "Version:",
      calculatingAssignedBudgets: "📊 Calcul des budgets assignés...",
      creationError: "Erreur lors de la création de l'enveloppe.",
      deleteError: "Erreur lors de la suppression de l'enveloppe.",
      updateError: "Erreur lors de la mise à jour de l'enveloppe.",
      totalBudget: "Budget total:",
      allocatedBudget: "Budget alloué:",
      remainingBudget: "Budget restant:",
      selectCampaignAndVersion: "Veuillez sélectionner une campagne et une version pour voir les enveloppes budgétaires.",
      selectVersion: "Veuillez sélectionner une version pour voir les enveloppes budgétaires.",
      noBuckets: "Aucune enveloppe budgétaire n'a été créée pour cette version.",
      createBucket: "Créer une enveloppe",
      noDescription: "Aucune description",
      descriptionPlaceholder : "Description de l'enveloppe",

    },
    budgetBucket: {
      changeColor: "Changer la couleur",
      plannedBudget: "Budget planifié",
      percentageOfBudget: "% du budget",
      assignedInMediaBox: "Assigné dans MediaBox",
      morePublishers: "+{count}"
    },
    cache: {
      refreshCache: "Codes et listes",
      refreshing: "Actualisation...",
      refreshSuccess: "Mise à jour complétée",
      refreshError: "Erreur d'actualisation",
      refreshCacheTooltip: "Forcer le rafraîchissement du cache des données (shortcodes et listes)",
      refreshSuccessMessage: "Mise à jour complétée",
      refreshErrorMessage: "Erreur lors de l'actualisation du cache"
    },
    documents: {
        title: "Documents",
        newDocument: "Nouveau document",
        newDocumentDisabled: "Sélectionnez un client pour créer un document",
        noClientSelected: "Aucun client sélectionné",
        noClientMessage: "Veuillez sélectionner un client dans la barre de navigation pour gérer ses documents.",
        loadingDocuments: "Chargement des documents...",
        selectCampaign: "Sélectionnez une campagne",
        selectCampaignMessage: "Choisissez une campagne et une version pour voir les documents associés.",
        selectVersion: "Sélectionnez une version",
        selectVersionMessage: "Choisissez une version pour voir les documents associés.",
        noDocuments: "Aucun document",
        noDocumentsMessage: "Cette version ne contient pas encore de documents.",
        createFirstDocument: "Créer le premier document",
        documentCountPlural: "documents",
        documentCount: "document",
        unlinked: "Dissocié",
        syncInfo: "Sync: {{date}}{{status}}",
        syncFailed: "échec",
        errorLabel: "Erreur",
        status: {
          completed: "Terminé",
          error: "Erreur",
          creating: "En création...",
          unknown: "Inconnu"
        },
        actions: {
          open: "Ouvrir",
          refreshTooltip: "Actualiser les données du document",
          unlinkTooltip: "Dissocier le document (créer une copie statique)",
          deleteTooltip: "Supprimer le document et le fichier Google Drive",
          deleteConfirm: "Êtes-vous sûr de vouloir supprimer le document \"{{name}}\" ?\n\nCette action supprimera :\n- L'entrée de la base de données\n- Le fichier Google Drive associé\n\nCette action est irréversible."
        },
        errors: {
          loadCampaigns: "Impossible de charger les campagnes.",
          loadVersions: "Impossible de charger les versions.",
          loadDocuments: "Impossible de charger les documents.",
          missingContext: "Informations de contexte manquantes pour la dissociation.",
          unlinkUnknown: "Erreur inconnue lors de la dissociation",
          missingContextDelete: "Informations de contexte manquantes pour la suppression.",
          deleteUnknown: "Erreur inconnue lors de la suppression",
          deleteError: "Erreur lors de la suppression: {{message}}",
          missingContextRefresh: "Informations de contexte manquantes pour l'actualisation.",
          onlyCompletedRefresh: "Seuls les documents terminés peuvent être actualisés.",
          refreshFailed: "Échec de l'actualisation des données",
          refreshUnknown: "Erreur inconnue lors de l'actualisation",
          refreshError: "Erreur lors de l'actualisation: {{message}}"
        },
        common: {
          invalidDate: "Date invalide",
          unknownTemplate: "Template inconnu",
          unknownUser: "Utilisateur"
        }
    },
    createDocument: {
        title: "Créer un nouveau document",
        unknownCampaign: "Campagne inconnue",
        unknownVersion: "Version inconnue",
        loadingError: "Erreur de chargement",
        campaignLabel: "Campagne",
        versionLabel: "Version",
        changeSelectionNote: "Pour changer, retournez à la page principale.",
        success: {
          title: "Document créé avec succès !",
          message: "Le document \"{{name}}\" est maintenant disponible.",
          openDocument: "Ouvrir le document →"
        },
        missingSelection: {
          title: "Sélection manquante",
          message: "Veuillez sélectionner une campagne et une version depuis la page principale avant de créer un document."
        },
        form: {
          nameLabel: "Nom du document *",
          namePlaceholder: "Ex: Plan Média Q1 2024",
          templateLabel: "Template *",
          templatePlaceholder: "Sélectionner un template",
          templateHelp: "Les shortcodes seront convertis selon la langue du template sélectionné.",
          creating: "Création en cours...",
          createButton: "Créer le document"
        },
        validation: {
          nameRequired: "Veuillez saisir un nom pour le document.",
          templateRequired: "Veuillez sélectionner un template.",
          noCampaign: "Aucune campagne sélectionnée. Veuillez sélectionner une campagne depuis la page principale.",
          noVersion: "Aucune version sélectionnée. Veuillez sélectionner une version depuis la page principale."
        },
        errors: {
          loadTemplates: "Impossible de charger les templates du client."
        }
    },   
    unlinkDocument: {
        title: "Dissocier le document",
        defaultSuffix: "Unlinked",
        warning: {
          title: "Attention!",
          copyWithoutFormulas: "Une copie sera créée sans aucune formule dynamique",
          noAutomaticTotals: "Les totaux ne seront plus calculés automatiquement",
          noLongerLinked: "Le document ne sera plus lié à MediaBox",
          cannotRefresh: "Il ne sera plus possible d'actualiser le document"
        },
        form: {
          nameLabel: "Nom du nouveau document :",
          namePlaceholder: "Nom du document dissocié",
          unlinking: "Dissociation...",
          unlinkButton: "Dissocier"
        },
        errors: {
          generic: "Erreur lors de la dissociation",
          unknown: "Erreur inconnue"
        }
    },
    clientDropdown: {
      searchPlaceholder: "Rechercher un client...",
      noClientAvailable: "Aucun client disponible",
      noClientFound:"Aucun client trouvé",
      selectClient: "Sélectionner un client",
    },
    campaignSelector: {
      selectCampaign: "Sélectionner une campagne",
      noCampaign: "Aucune campagne",
      searchCampaign: "Rechercher une campagne...",
      noCampaignFound: "Aucune campagne trouvée pour",
      selectCampaignFirst: "Veuillez sélectionner une campagne d'abord",
      noVersion: "Aucune version",
      selectVersion: "Sélectionner une version"
    },
    costGuideForm: {
      errors: {
        level1Required: "L'information de niveau 1 est requise",
        level2Required: "L'information de niveau 2 est requise",
        level3Required: "L'information de niveau 3 est requise",
        level4Required: "L'information de niveau 4 est requise",
        unitPriceRequired: "Le montant unitaire est requis",
        unitPriceInvalid: "Le montant doit être un nombre",
      },
      submissionError: "Erreur lors de la soumission du formulaire:",
      successMessage: "Entrée sauvegardée avec succès!",
      editEntry: "Modifier l'entrée",
      addEntry: "Ajouter une entrée",
      level1Label: "Niveau 1",
      level2Label: "Niveau 2",
      level3Label: "Niveau 3",
      level4Label: "Niveau 4",
      purchaseUnitLabel: "Unité d'achat",
      unitOption: "Unitaire",
      unitPriceLabel: "Montant unitaire",
      commentLabel: "Commentaire",
      commentPlaceholder: "Informations supplémentaires...",
      cancelButton: "Annuler",
      savingButton: "Enregistrement...",
      updateButton: "Mettre à jour",
      addButton: "Ajouter",
    },
    costGuideList: {
      deleteConfirmation: "Êtes-vous sûr de vouloir supprimer cette entrée ?",
      deleteError: "Erreur lors de la suppression de l'entrée:",
      duplicateError: "Erreur lors de la duplication de l'entrée:",
      addEntryLevel1: "Ajouter une entrée avec ce niveau 1",
      addEntryLevel1And2: "Ajouter une entrée avec ces niveaux 1 et 2",
      addEntryLevel12And3: "Ajouter une entrée avec ces niveaux 1, 2 et 3",
      addEntryAllLevels: "Ajouter une entrée avec ces 4 niveaux",
      unit: "Unité",
      unitPrice: "Prix unitaire",
      comment: "Commentaire",
      actions: "Actions",
      edit: "Modifier",
      duplicate: "Dupliquer",
      delete: "Supprimer",
    },
    costGuideTable: {
      saveError: "Erreur lors de la sauvegarde des modifications:",
      saveErrorAlert: "Une erreur est survenue lors de la sauvegarde.",
      fillRequiredFields: "Veuillez remplir tous les champs obligatoires.",
      addEntryError: "Erreur lors de l'ajout d'une entrée:",
      addEntryErrorAlert: "Une erreur est survenue lors de l'ajout de l'entrée.",
      confirmDeleteEntry: "Êtes-vous sûr de vouloir supprimer cette entrée ?",
      deleteEntryError: "Erreur lors de la suppression de l'entrée:",
      deleteEntryErrorAlert: "Une erreur est survenue lors de la suppression.",
      duplicateEntryError: "Erreur lors de la duplication de l'entrée:",
      duplicateEntryErrorAlert: "Une erreur est survenue lors de la duplication.",
      level1: "Niveau 1",
      level2: "Niveau 2",
      level3: "Niveau 3",
      level4: "Niveau 4",
      purchaseUnit: "Unité d'achat",
      unitPrice: "Prix unitaire",
      comment: "Commentaire",
      noEntriesAvailable: "Aucune entrée disponible.",
      addEntriesForQuickEdit: "Ajoutez des entrées pour utiliser l'édition rapide.",
      editModeActive: "Mode édition activé",
      activateEditMode: "Activer l'édition",
      exportCSV: "Exporter CSV",
      cancel: "Annuler",
      saving: "Enregistrement...",
      save: "Enregistrer",
      addEntry: "Ajouter une entrée",
      quickEditModeTitle: "Mode édition rapide :",
      quickEditModeDescription: "Cliquez pour sélectionner une cellule. Maintenez Shift pour sélectionner plusieurs cellules. Double-cliquez pour modifier une cellule. Utilisez Ctrl+C/⌘+C pour copier et Ctrl+V/⌘+V pour coller sur les cellules sélectionnées.",
      addNewEntry: "Ajouter une nouvelle entrée",
      unitPriceAmount: "Montant unitaire",
      additionalInfoPlaceholder: "Informations supplémentaires...",
      addingInProgress: "Ajout en cours...",
      add: "Ajouter",
      actions: "Actions",
      duplicateRow: "Dupliquer cette ligne",
      deleteRow: "Supprimer cette ligne",
      readOnlyModeMessage: "Vous êtes en mode consultation. Vous n'avez pas les permissions nécessaires pour modifier ce guide de coûts."
    },
    costGuidePage: {
      error: {
        clientGuideNotFound: "Le guide de coûts associé à ce client n'a pas été trouvé.",
        loadClientGuide: "Erreur lors du chargement du guide de coûts.",
        loadGuides: "Erreur lors du chargement des guides de coût",
        guideNotFound: "Guide de coûts non trouvé",
        loadData: "Erreur lors du chargement des données",
        createGuide: "Erreur lors de la création du guide",
        deleteGuide: "Erreur lors de la suppression du guide",
        updateGuide: "Erreur lors de la mise à jour du guide"
      },
      noClientGuideMessage: "Aucun guide de coûts n'est associé à ce client. Veuillez contacter un administrateur pour associer un guide de coûts.",
      title: "Guide de coûts",
      subtitle: {
        admin: "Gérez vos guides de coût pour faciliter la planification budgétaire",
        client: "Consultez le guide de coût associé à votre client"
      },
      newGuideButton: "Nouveau guide",
      backToListButton: {
        admin: "Retour à la liste",
        client: "Retour"
      },
      loadingGuides: "Chargement des guides de coût...",
      noGuidesFound: "Aucun guide de coûts trouvé. Créez votre premier guide !",
      deleteButton: "Supprimer",
      viewButton: "Voir",
      loadingCostGuide: "Chargement du guide de coûts...",
      guideNamePlaceholder: "Nom du guide",
      descriptionOptionalPlaceholder: "Description (optionnelle)",
      saveButton: "Enregistrer",
      cancelButton: "Annuler",
      modifyButton: "Modifier",
      hierarchicalViewButton: "Vue hiérarchique",
      quickEditButton: "Édition rapide",
      newEntryButton: "Nouvelle entrée",
      noEntriesInGuide: "Aucune entrée dans ce guide de coûts.",
      addFirstEntry: "Ajoutez votre première entrée !",
      readOnlyMessage: "Vous êtes en mode consultation. Contactez un administrateur si vous souhaitez modifier ce guide.",
      newCostGuideModal: {
        title: "Nouveau guide de coûts",
        guideNameLabel: "Nom du guide",
        guideNamePlaceholder: "Ex: Guide de coûts Q1 2023",
        descriptionLabel: "Description",
        descriptionPlaceholder: "Description optionnelle",
        cancelButton: "Annuler",
        createButton: "Créer"
      },
      confirmDelete: "Êtes-vous sûr de vouloir supprimer ce guide de coûts ?"
    },
    aide: {
      header: {
        title: "Comment pouvons-nous vous aider ?",
        subtitle: "Posez une question ou parcourez les catégories pour trouver des réponses."
      },
      search: {
        placeholder: "Rechercher une question..."
      },
      state: {
        loading: "Chargement des FAQs...",
        errorTitle: "Erreur !",
        loadError: "Impossible de charger les FAQs. Veuillez vérifier la connexion ou l'URL du Google Sheet.",
        errorInstructions: "Veuillez vous assurer que le Google Sheet est correctement publié en CSV et que l'URL est correcte."
      },
      categories: {
        campaigns: "Campagnes",
        strategy: "Stratégie",
        tactics: "Tactiques",
        documents: "Documents",
        costGuide: "Guide de Coûts",
        partners: "Partenaires",
        client: "Client",
        admin: "Admin"
      },
      results: {
        noneInCategory: "Aucune question ne correspond à votre recherche dans cette catégorie.",
        emptyCategoryHint: "(La catégorie \"{{categoryName}}\" pourrait être vide dans le Google Sheet ou les résultats filtrés.)",
        allResultsFor: "Tous les résultats pour \"{{searchTerm}}\"",
        noneOverall: "Aucun résultat trouvé sur l'ensemble des catégories",
        noneOverallHint: "Essayez de simplifier vos mots-clés ou de vérifier l'orthographe."
      },
      contact: {
        intro: "pssttt!",
        prompt: "Vous ne trouvez pas la réponse à vos questions? Écrivez-nous à",
        tooltipCopy: "Copier l'e-mail",
        tooltipCopied: "Copié !"
      },
      logs: {
          loadError: "Erreur lors du chargement des FAQs:",
          csvRowSkipped: "Ligne CSV ignorée en raison de champs manquants ou invalides:",
          copyError: "Impossible de copier l'e-mail :",
          httpError: "Erreur HTTP: {{status}} {{statusText}}"
      }
    },
    clientConfig: {
      header: {
        title: "Configuration du client"
      },
      tabs: {
        general: "Général",
        access: "Accès",
        fees: "Frais",
        taxonomies: "Taxonomies",
        templates: "Gabarits",
        lists: "Listes",
        dimensions: "Dimensions",
        customCodes: "Codes personnalisés",
        currencies: "Devises"
      }
    },
    clientAccess: {
      title: "Gestion des accès",
      accessLevels: {
        editor: "Éditeur",
        user: "Utilisateur"
      },
      errors: {
        loadData: "Impossible de charger les données.",
        addUser: "Impossible d'ajouter l'utilisateur.",
        updateUser: "Impossible de mettre à jour l'accès utilisateur.",
        removeUser: "Impossible de supprimer l'accès utilisateur."
      },
      success: {
        userAdded: "Utilisateur ajouté avec succès.",
        userUpdated: "Accès utilisateur mis à jour avec succès.",
        userRemoved: "Accès utilisateur supprimé avec succès."
      },
      confirmations: {
        removeUser: "Êtes-vous sûr de vouloir supprimer l'accès de cet utilisateur ?"
      },
      messages: {
        selectClient: "Veuillez sélectionner un client pour gérer les accès.",
        loading: "Chargement des données d'accès...",
        readOnly: "Vous êtes en mode lecture seule. Vous n'avez pas les permissions nécessaires pour modifier les accès."
      },
      tooltips: {
        noAccessPermission: "Vous n'avez pas la permission de gérer les accès",
        noEditPermission: "Vous n'avez pas la permission de modifier les accès",
        noDeletePermission: "Vous n'avez pas la permission de supprimer les accès"
      },
      buttons: {
        addUser: "Ajouter un utilisateur",
        cancel: "Annuler",
        update: "Mettre à jour",
        add: "Ajouter"
      },
      emptyState: {
        noUsers: "Aucun utilisateur n'a accès à ce client.",
        getStarted: "Cliquez sur \"Ajouter un utilisateur\" pour commencer."
      },
      table: {
        header: {
          user: "Utilisateur",
          accessLevel: "Niveau d'accès",
          note: "Note",
          actions: "Actions"
        }
      },
      modal: {
        title: {
          edit: "Modifier l'accès utilisateur",
          add: "Ajouter un utilisateur"
        },
        close: "Fermer"
      },
      form: {
        label: {
          selectUser: "Sélectionner un utilisateur",
          accessLevel: "Niveau d'accès",
          note: "Note"
        },
        placeholder: {
          filterUsers: "Filtrer les utilisateurs...",
          addNote: "Ajoutez une note concernant cet accès..."
        },
        option: {
          selectUser: "Sélectionner un utilisateur"
        }
      }
    },
    clientCurrencies: {
      header: {
        title: "Taux de conversion"
      },
      actions: {
        add: "Ajouter"
      },
      filters: {
        searchPlaceholder: "Rechercher...",
        allYears: "Toutes les années"
      },
      table: {
        year: "Année",
        from: "De",
        to: "Vers",
        rate: "Taux",
        actions: "Actions"
      },
      messages: {
        selectClient: "Veuillez sélectionner un client pour voir ses taux de conversion.",
        loading: "Chargement des taux de conversion...",
        noRatesConfigured: "Aucun taux de conversion configuré pour ce client.",
        noFilterResults: "Aucun résultat pour votre recherche."
      },
      permissions: {
        noAddPermission: "Vous n'avez pas la permission d'ajouter des taux de conversion",
        readOnlyWarning: "Vous êtes en mode lecture seule. Vous n'avez pas les permissions nécessaires pour modifier les taux de conversion des devises.",
        noEditPermission: "Vous n'avez pas la permission de modifier les taux",
        noDeletePermission: "Vous n'avez pas la permission de supprimer les taux"
      },
      errors: {
        loadFailed: "Impossible de charger les devises du client.",
        addFailed: "Impossible d'ajouter la devise.",
        updateFailed: "Impossible de mettre à jour la devise.",
        deleteFailed: "Impossible de supprimer la devise."
      },
      confirmations: {
        delete: "Êtes-vous sûr de vouloir supprimer ce taux de conversion ?"
      },
      form: {
        addTitle: "Ajouter un taux",
        editTitle: "Modifier le taux"
      }
    },
    clientCustomCodes: {
      page: {
        prompt: "Veuillez sélectionner un client pour gérer les codes personnalisés.",
        title: "Codes personnalisés",
        searchPlaceholder: "Rechercher par shortcode, code personnalisé ou ID...",
        loading: "Chargement des codes personnalisés...",
        noCodesForClient: "Aucun code personnalisé configuré pour ce client.",
        noSearchResults: "Aucun résultat pour votre recherche."
      },
      permissions: {
        addTooltip: "Vous n'avez pas la permission d'ajouter des codes personnalisés",
        editTooltip: "Vous n'avez pas la permission de modifier les codes personnalisés",
        deleteTooltip: "Vous n'avez pas la permission de supprimer les codes personnalisés",
        readOnlyWarning: "Vous êtes en mode lecture seule. Vous n'avez pas les permissions nécessaires pour modifier les codes personnalisés."
      },
      table: {
        headerId: "ID Shortcode",
        headerCode: "Code Shortcode",
        headerName: "Nom Shortcode",
        headerCustomCode: "Code Personnalisé",
        headerActions: "Actions",
        notAvailable: "N/A",
        editAction: "Modifier",
        deleteAction: "Supprimer"
      },
      modal: {
        titleEdit: "Modifier le code personnalisé",
        titleAdd: "Ajouter un code personnalisé",
        buttonAdd: "Ajouter un code personnalisé",
        close: "Fermer",
        selectShortcode: "Sélectionner un shortcode",
        searchPlaceholder: "Rechercher par code, nom ou ID...",
        noShortcodeFound: "Aucun shortcode trouvé",
        alreadyCustomized: "(Déjà personnalisé)",
        customCodeLabel: "Code personnalisé",
        cancel: "Annuler",
        update: "Mettre à jour",
        add: "Ajouter"
      },
      messages: {
        errorLoad: "Impossible de charger les données.",
        successAdd: "Code personnalisé ajouté avec succès.",
        errorAdd: "Impossible d'ajouter le code personnalisé.",
        successUpdate: "Code personnalisé mis à jour avec succès.",
        errorUpdate: "Impossible de mettre à jour le code personnalisé.",
        confirmDelete: "Êtes-vous sûr de vouloir supprimer ce code personnalisé ?",
        successDelete: "Code personnalisé supprimé avec succès.",
        errorDelete: "Impossible de supprimer le code personnalisé."
      }
    },
    clientDimensions: {
        messages: {
          loadError: "Impossible de charger les dimensions du client.",
          updateSuccess: "Les dimensions du client ont été mises à jour avec succès.",
          updateError: "Impossible de mettre à jour les dimensions du client.",
          selectClientPrompt: "Veuillez sélectionner un client pour configurer ses dimensions.",
          loading: "Chargement des dimensions du client...",
          readOnly: "Vous êtes en mode lecture seule. Vous n'avez pas les permissions nécessaires pour modifier les dimensions."
        },
        headings: {
          title: "Dimensions personnalisées",
          campaign: "Campagne",
          tactic: "Tactique",
          placement: "Placement",
          creative: "Créatif"
        },
        form: {
          placeholderDim1: "Dimension 1",
          placeholderDim2: "Dimension 2",
          placeholderDim3: "Dimension 3"
        },
        buttons: {
          cancel: "Annuler",
          saving: "Enregistrement...",
          save: "Enregistrer"
        }
    },
    clientFees: {
      title: "Frais du client",
      placeholders: {
        selectClient: "Veuillez sélectionner un client pour voir ses frais."
      },
      actions: {
        addFee: "Ajouter un frais",
        addOption: "Ajouter une option"
      },
      tooltips: {
        noAddPermission: "Vous n'avez pas la permission d'ajouter des frais",
        noEditPermission: "Vous n'avez pas la permission de modifier les frais",
        noDeletePermission: "Vous n'avez pas la permission de supprimer les frais",
        noAddOptionPermission: "Vous n'avez pas la permission d'ajouter des options",
        moveUp: "Déplacer vers le haut",
        moveDown: "Déplacer vers le bas"
      },
      errors: {
        loadFailed: "Impossible de charger les frais du client.",
        moveFailed: "Impossible de déplacer le frais.",
        addFailed: "Impossible d'ajouter le frais.",
        updateFailed: "Impossible de mettre à jour le frais.",
        deleteFailed: "Impossible de supprimer le frais.",
        addOptionFailed: "Impossible d'ajouter l'option.",
        updateOptionFailed: "Impossible de mettre à jour l'option.",
        deleteOptionFailed: "Impossible de supprimer l'option."
      },
      success: {
        feeMovedUp: "Frais déplacé vers le haut.",
        feeMovedDown: "Frais déplacé vers le bas.",
        feeAdded: "Frais ajouté avec succès.",
        feeUpdated: "Frais mis à jour avec succès.",
        feeDeleted: "Frais supprimé avec succès.",
        optionAdded: "Option ajoutée avec succès.",
        optionUpdated: "Option mise à jour avec succès.",
        optionDeleted: "Option supprimée avec succès."
      },
      confirmations: {
        deleteFee: "Êtes-vous sûr de vouloir supprimer ce frais et toutes ses options ?",
        deleteOption: "Êtes-vous sûr de vouloir supprimer cette option ?"
      },
      notifications: {
        readOnly: "Vous êtes en mode lecture seule. Vous n'avez pas les permissions nécessaires pour modifier les frais."
      },
      states: {
        loading: "Chargement des frais...",
        noFees: "Aucun frais configuré pour ce client.",
        noOptions: "Aucune option configurée pour ce frais."
      },
      options: {
        title: "Options du frais"
      },
      table: {
        option: "Option",
        value: "Valeur",
        buffer: "Buffer",
        editable: "Éditable",
        actions: "Actions"
      },
      modals: {
        addFeeTitle: "Ajouter un frais",
        editFeeTitle: "Modifier le frais",
        addOptionTitle: "Ajouter une option",
        editOptionTitle: "Modifier l'option"
      }
    },
    clientGeneral: {
        header: {
          title: "Informations générales",
          generalFees: "Frais généraux"
        },
        messages: {
          info: {
            selectClient: "Veuillez sélectionner un client pour voir ses informations.",
            loading: "Chargement des informations du client..."
          },
          success: {
            updateSuccess: "Les informations du client ont été mises à jour avec succès."
          },
          error: {
            loadDetailsFailed: "Impossible de charger les détails du client.",
            logoUploadFailed: "Impossible de télécharger le logo. Les autres informations seront enregistrées.",
            updateFailed: "Impossible de mettre à jour les détails du client."
          },
          warning: {
            readOnly: "Vous êtes en mode lecture seule. Vous n'avez pas les permissions nécessaires pour modifier les informations du client."
          }
        },
        form: {
          labels: {
            clientLogo: "Logo du client",
            noLogo: "Aucun logo",
            clientName: "Nom du client",
            clientId: "ID Client",
            offices: "Bureaux",
            exportLanguage: "Langue d'exportation",
            agency: "Agence",
            costGuide: "Guide de coûts",
            defaultDriveFolder: "Dossier Drive par défaut",
            customFee1: "Frais personnalisé 1",
            customFee2: "Frais personnalisé 2",
            customFee3: "Frais personnalisé 3"
          },
          altText: {
            logoPreview: "Aperçu du logo",
            clientLogo: "Logo du client"
          },
          helpText: {
            clientId: "Identifiant unique du client (non modifiable)"
          },
          options: {
            french: "Français",
            english: "Anglais",
            selectAgency: "Sélectionner une agence"
          },
          costGuide: {
            noGuideSelected: "Aucun guide sélectionné",
            guideNotFound: "Guide non trouvé"
          }
        },
        buttons: {
          changeLogo: "Changer le logo",
          cancel: "Annuler",
          saving: "Enregistrement...",
          save: "Enregistrer"
        }
    },
    clientTemplates: {
      error: {
        load: "Une erreur est survenue lors du chargement des gabarits.",
        save: "Une erreur est survenue lors de la sauvegarde du gabarit.",
        delete: "Une erreur est survenue lors de la suppression du gabarit."
      },
      confirm: {
        delete: "Êtes-vous sûr de vouloir supprimer ce gabarit ?"
      },
      loading: {
        message: "Chargement des gabarits..."
      },
      header: {
        title: "Gestion des gabarits"
      },
      actions: {
        add: "Ajouter un gabarit"
      },
      permissions: {
        tooltip: {
          add: "Vous n'avez pas la permission d'ajouter des gabarits",
          edit: "Vous n'avez pas la permission de modifier les gabarits",
          delete: "Vous n'avez pas la permission de supprimer les gabarits"
        },
        readOnlyWarning: "Vous êtes en mode lecture seule. Vous n'avez pas les permissions nécessaires pour modifier les gabarits."
      },
      emptyState: {
        selectClient: "Veuillez sélectionner un client pour gérer ses gabarits.",
        noTemplates: "Aucun gabarit configuré.",
        callToAction: "Cliquez sur \"Ajouter un gabarit\" pour commencer."
      },
      table: {
        header: {
          name: "Nom",
          url: "URL",
          language: "Langue",
          duplication: "Duplication d'onglets",
          actions: "Actions"
        },
        body: {
          yes: "Oui",
          no: "Non"
        }
      }
    },
    currencyForm: {
      labels: {
        year: "Année",
        rate: "Taux",
        from: "Devise source",
        to: "Devise cible"
      },
      buttons: {
        cancel: "Annuler",
        update: "Mettre à jour",
        add: "Ajouter"
      }
    },
    feeOptionForm: {
      labels: {
        optionName: "Nom de l'option",
        value: "Valeur",
        buffer: "Buffer (%)",
        editable: "Éditable"
      },
      placeholders: {
        optionName: "Nom de l'option"
      },
      buttons: {
        cancel: "Annuler",
        update: "Mettre à jour",
        add: "Ajouter"
      }
    },
    templateForm: {
      title: {
        edit: "Modifier le gabarit",
        add: "Ajouter un gabarit"
      },
      fields: {
        name: {
          label: "Nom du gabarit",
          placeholder: "Ex: Gabarit Standard"
        },
        url: {
          label: "URL du gabarit",
          placeholder: "https://docs.google.com/spreadsheets/d/exemple"
        },
        duplicate: {
          label: "Dupliquer pour chaque onglet",
          description: "Activer cette option pour créer un onglet séparé par onglet de campagne"
        },
        language: {
          label: "Langue"
        }
      },
      errors: {
        nameRequired: "Le nom du gabarit est requis",
        urlRequired: "L'URL du gabarit est requise",
        urlInvalid: "L'URL doit être valide",
        languageRequired: "La langue est requise"
      },
      buttons: {
        cancel: "Annuler",
        update: "Mettre à jour",
        create: "Créer"
      }
    },
    loadingSpinner: {
        alt: {
          loading: "Chargement..."
        },
        error: {
          gifLoadFailed: "Impossible de charger le gif:"
        },
        message: {
          inProgress: "Chargement en cours..."
        },
        status: {
          ready: "Prêt"
        }
    },
    topLoadingIndicator: {
      messages: {
        loading: "Chargement...",
        refreshComplete: "Actualisation terminée",
        processing: "Traitement...",
        saving: "Sauvegarde...",
        errorOccurred: "Une erreur est survenue"
      }
    },
    loadingScreen: {
      alt: {
        loading: "Chargement"
      },
      title: {
        initialization: "Initialisation"
      },
      subtitle: {
        preparingData: "Préparation de vos données..."
      },
      progressBar: {
        globalProgress: "Progrès global"
      }
    },
    contactForm: {
      errors: {
        firstNameRequired: "Le prénom est requis",
        lastNameRequired: "Le nom est requis",
        emailRequired: "L'email est requis",
        emailInvalid: "Email invalide"
      },
      success: {
        message: "Contact sauvegardé avec succès!"
      },
      labels: {
        firstName: "Prénom *",
        lastName: "Nom *",
        email: "Email *",
        preferredLanguages: "Langues préférées",
        french: "Français",
        english: "Anglais",
        comment: "Commentaire"
      },
      placeholders: {
        additionalInfo: "Informations supplémentaires..."
      },
      buttons: {
        cancel: "Annuler",
        saving: "Enregistrement...",
        update: "Mettre à jour",
        add: "Ajouter"
      }
    },
    contactList: {
      emptyState: {
        message: "Aucun contact n'a été ajouté pour ce partenaire."
      },
      actions: {
        edit: "Modifier",
        delete: "Supprimer",
        confirmDelete: "Êtes-vous sûr de vouloir supprimer ce contact?"
      },
      details: {
        languages: "Langues",
        frenchAndEnglish: "Français et Anglais",
        french: "Français",
        english: "Anglais",
        notSpecified: "Non spécifié",
        createdAt: "Créé le",
        comment: "Commentaire"
      }
    },
    partnersFilter: {
      search: {
        placeholder: "Rechercher un partenaire..."
      },
      filter: {
        label: "Filtrer par type:"
      }
    },
    partnersGrid: {
      notFound: {
        title: "Aucun partenaire trouvé",
        suggestion: "Essayez de modifier vos critères de recherche"
      }
    },
    partnerDrawer: {
      header: {
        titleFallback: "Détails du partenaire",
        close: "Fermer"
      },
      tabs: {
        information: "Informations",
        contacts: "Contacts",
        specs: "Specs"
      },
      labels: {
        code: "Code",
        displayNameFr: "Nom d'affichage (FR)",
        displayNameEn: "Nom d'affichage (EN)",
        defaultUtm: "UTM par défaut",
        type: "Type",
        logoUrl: "URL du logo",
        tags: "Tags",
        technicalInfo: "Informations techniques",
        partnerId: "ID du partenaire"
      },
      placeholders: {
        addTag: "Ajouter un tag..."
      },
      buttons: {
        add: "Ajouter",
        cancel: "Annuler",
        save: "Enregistrer",
        saving: "Enregistrement...",
        edit: "Modifier",
        addContact: "Ajouter un contact",
        addSpec: "Ajouter une spec"
      },
      messages: {
        noTags: "Aucun tag",
        loadingContacts: "Chargement des contacts...",
        loadingSpecs: "Chargement des spécifications..."
      },
      sectionTitles: {
        specs: "Spécifications techniques"
      }
    },
    partnerEditForm: {
      common: {
        id: "ID",
        code: "Code",
        displayNameFR: "Nom d'affichage (FR)",
        displayNameEN: "Nom d'affichage (EN)",
        defaultUTM: "UTM par défaut",
        type: "Type",
        logoUrl: "Logo URL"
      },
      view: {
        title: "Détails du partenaire",
        editButton: "Modifier",
        logoAlt: "Logo"
      },
      edit: {
        title: "Modifier le partenaire",
        updateError: "Une erreur est survenue lors de la mise à jour du partenaire",
        logoPreviewAlt: "Aperçu du logo",
        cancelButton: "Annuler",
        saveButton: "Enregistrer",
        savingButton: "Enregistrement..."
      }
    },
    partners: {
      title: {
        main: "Partenaires"
      }
    },
    specForm: {
      notifications: {
        saveSuccess: "Spécification sauvegardée avec succès!"
      },
      labels: {
        name: "Nom de la spécification",
        format: "Format",
        ratio: "Ratio",
        fileType: "Type de fichier",
        animation: "Animation",
        maxWeight: "Poids maximal",
        weight: "Poids maximal si HTML 5",
        title: "Titre",
        text: "Texte",
        specSheetLink: "Lien vers feuille de specs",
        notes: "Notes"
      },
      placeholders: {
        format: "ex: 300x250",
        ratio: "ex: 16:9",
        fileType: "ex: JPG, PNG, GIF",
        animation: "ex: Autorisée, Non autorisée",
        maxWeight: "ex: 100 Ko",
        weight: "ex: 80 Ko",
        title: "ex: Max 50 caractères",
        text: "ex: Texte court descriptif",
        specSheetLink: "https://example.com/specs.pdf",
        notes: "Notes additionnelles"
      },
      errors: {
        nameRequired: "Le nom est requis"
      },
      buttons: {
        cancel: "Annuler",
        submitting: "Enregistrement...",
        update: "Mettre à jour",
        add: "Ajouter"
      }
    },
    specList: {
      emptyState: {
        message: "Aucune spécification n'a été ajoutée pour ce partenaire."
      },
      actions: {
        edit: "Modifier",
        delete: "Supprimer",
        confirmDelete: "Êtes-vous sûr de vouloir supprimer cette spécification?"
      },
      details: {
        format: "Format",
        ratio: "Ratio",
        fileType: "Type de fichier",
        animation: "Animation",
        maxWeight: "Poids maximal",
        weight: "Poids",
        title: "Titre",
        text: "Texte",
        specSheetLink: "Lien vers feuille de specs",
        notes: "Notes"
      },
      footer: {
        lastUpdated: "Dernière mise à jour:"
      }
    },
    creatifDrawer: {
      tabs: {
        info: "Informations",
        taxonomy: "Taxonomie",
        specs: "Specs"
      },
      title: {
        edit: "Modifier le créatif:",
        new: "Nouveau créatif"
      }
    },
    creatifFormInfo: {
      title: "Informations du créatif",
      description: "Configuration de base et sélection des taxonomies pour le créatif",
      creativeName: {
        label: "Nom du créatif *",
        tooltip: "Nom descriptif du créatif. Soyez spécifique pour faciliter l'identification lors des rapports.",
        placeholder: "Ex: Bannière 300x250 v1, Vidéo 15s A/B test, Native Ad mobile"
      },
      startDate: {
        label: "Date de début",
        tooltip: "Date de début du créatif. Hérite du placement, de la tactique ou de la campagne si non spécifiée."
      },
      endDate: {
        label: "Date de fin",
        tooltip: "Date de fin du créatif. Hérite du placement, de la tactique ou de la campagne si non spécifiée."
      },
      errors: {
        taxonomyLoad: "Erreur lors du chargement des taxonomies"
      },
      retry: "Réessayer",
      taxonomySection: {
        title: "Taxonomies créatifs (niveaux 5-6)",
        placeholder: "Sélectionner une taxonomie..."
      },
      taxonomyTags: {
        label: "Taxonomie pour les tags créatifs",
        tooltip: "Taxonomie qui sera utilisée pour générer les tags du créatif (niveaux 5-6)"
      },
      taxonomyPlatform: {
        label: "Taxonomie pour la plateforme créatifs",
        tooltip: "Taxonomie qui sera utilisée pour la configuration de la plateforme (niveaux 5-6)"
      },
      taxonomyMediaOcean: {
        label: "Taxonomie pour MediaOcean créatifs",
        tooltip: "Taxonomie qui sera utilisée pour l'export vers MediaOcean (niveaux 5-6)"
      },
      noTaxonomy: {
        message: "Aucune taxonomie configurée pour ce client.",
        action: "Vous pouvez créer des taxonomies dans la section Configuration."
      },
      loading: {
        data: "Chargement des données...",
        taxonomies: "Chargement des taxonomies..."
      }
    },
    creatifFormSpecs: {
      selection: {
        title: "Sélection automatique",
        description: "Choisissez un partenaire puis une spec pour auto-remplir les champs",
        partnerPlaceholder: "Sélectionner un partenaire...",
        partnerLabel: "Partenaire",
        partnerTooltip: "Sélectionnez d'abord un partenaire pour voir ses specs disponibles",
        specLoadingPlaceholder: "Chargement des specs...",
        specSelectPlaceholder: "Sélectionner une spec...",
        specLabel: "Spécification",
        specTooltip: "Sélectionnez une spec pour auto-remplir tous les champs ci-dessous",
        specPrefix: "Spec",
        specSuffix: "appliquée",
        resetButton: "Reset",
        noSpecs: "Ce partenaire n'a pas de spécifications pré-configurées.",
      },
      details: {
        title: "Détails de la spécification",
        description: "Modifiez les valeurs selon vos besoins",
        namePlaceholder: "Nom de la spécification",
        nameLabel: "Nom",
        nameTooltip: "Nom de la spécification technique",
        formatPlaceholder: "ex: 300x250",
        formatLabel: "Format",
        formatTooltip: "Dimensions de la créative",
        ratioPlaceholder: "ex: 16:9",
        ratioLabel: "Ratio",
        ratioTooltip: "Ratio d'aspect de la créative",
        fileTypePlaceholder: "ex: JPG, PNG, GIF",
        fileTypeLabel: "Type de fichier",
        fileTypeTooltip: "Types de fichiers acceptés",
        animationPlaceholder: "ex: Autorisée, Non autorisée",
        animationLabel: "Animation",
        animationTooltip: "Spécifications sur l'animation",
        maxWeightPlaceholder: "ex: 100 Ko",
        maxWeightLabel: "Poids maximal",
        maxWeightTooltip: "Taille maximale du fichier",
        weightPlaceholder: "ex: 80 Ko",
        weightLabel: "Poids maximal HTML5",
        weightTooltip: "Taille maximale si format HTML5",
        titlePlaceholder: "ex: Max 50 caractères",
        titleLabel: "Titre",
        titleTooltip: "Contraintes sur le titre",
        textPlaceholder: "ex: Texte court descriptif",
        textLabel: "Texte",
        textTooltip: "Contraintes sur le texte",
        specSheetLinkPlaceholder: "https://example.com/specs.pdf",
        specSheetLinkLabel: "Lien vers feuille de specs",
        specSheetLinkTooltip: "URL vers la documentation complète",
        notesPlaceholder: "Notes additionnelles sur la spécification",
        notesLabel: "Notes",
        notesTooltip: "Informations complémentaires"
      }
    },  
    creatifFormTaxonomy: {
        title: "Configuration du créatif",
        subtitle: "Variables taxonomiques et informations spécifiques au créatif",
        retry: "Réessayer",
        noTaxonomy: {
          title: "Configuration des taxonomies créatifs",
          description: "Veuillez d'abord sélectionner des taxonomies dans l'onglet \"Informations\" pour configurer les variables créatifs.",
          tip: "💡 Les créatifs utilisent les niveaux 5-6 des taxonomies."
        },
        loading: {
          data: "Chargement des données...",
          taxonomies: "Analyse des taxonomies..."
        },
        preview: {
          title: "Aperçu des taxonomies créatifs",
          subtitle: "Prévisualisation des niveaux 5-6 des taxonomies sélectionnées"
        }
    },
    clientLists: {
      noClient: {
        title: "Aucun client sélectionné",
        description: "Veuillez sélectionner un client pour gérer ses listes de shortcodes."
      },
      header: {
        title: "Configuration des listes"
      },
      readOnly: {
        message: "Vous êtes en mode lecture seule. Contactez votre administrateur pour obtenir les permissions de modification."
      },
      initialState: {
        title: "Sélectionnez une dimension",
        description: "Choisissez une dimension dans la liste de gauche pour gérer les shortcodes."
      },
      deleteModal: {
        title: "Confirmer la suppression",
        confirmationTextPart1: "Êtes-vous sûr de vouloir supprimer cette liste personnalisée ? Le système utilisera automatiquement la liste par défaut (PlusCo) à la place. Cette action est",
        confirmationTextPart2: "irréversible",
        confirmButton: "Supprimer définitivement"
      }
    },
    dimensionSidebar: {
        header: {
          title: "Dimensions",
          customPersonalized: "personnalisée",
          customPersonalized_plural: "personnalisées"
        },
        search: {
          placeholder: "Rechercher une dimension...",
          noMatch: "Aucune dimension ne correspond à"
        },
        status: {
          noDimensionsAvailable: "Aucune dimension disponible"
        },
        list: {
          selectDimension: "Sélectionner",
          customListTooltip: "liste personnalisée",
          pluscoListTooltip: "liste PlusCo",
          customListTitle: "Liste personnalisée",
          customBadge: "Custom",
          pluscoBadge: "PlusCo"
        },
        footer: {
          result: "résultat",
          results: "résultats",
          dimensionAvailable: "dimension disponible",
          dimensionsAvailable: "dimensions disponibles"
        }
    },
    listHeader: {
      listHeader: {
        customList: "Liste personnalisée",
        pluscoList: "Liste PlusCo",
        specificTo: "Spécifique à",
        commonList: "Liste commune",
        permissionRequired: "Permission requise",
        createCustomList: "Créer une liste personnalisée",
        deleteThisCustomList: "Supprimer cette liste personnalisée",
        deleteCustomList: "Supprimer la liste personnalisée"
      }
    },
    shortcodeActions: {
      browse: {
        title: "Parcourir tous les shortcodes disponibles",
        button: "Voir tous les shortcodes"
      },
      create: {
        noPermission: "Vous n'avez pas la permission de créer des shortcodes",
        title: "Créer un nouveau shortcode",
        button: "Nouveau shortcode"
      },
      search: {
        placeholder: "Rechercher dans cette liste..."
      },
      createModal: {
        title: "Créer un nouveau shortcode",
        form: {
          codeLabel: "Code",
          nameFRLabel: "Nom d'affichage FR",
          nameENLabel: "Nom d'affichage EN",
          defaultUTMLabel: "UTM par défaut"
        },
        submitButton: "Créer et assigner"
      }
    },
    shortcodeDetail: {
      modal: {
        title: "Détails du shortcode"
      },
      errors: {
        requiredFields: "Le code et le nom d'affichage FR sont obligatoires.",
        updateFailed: "Impossible de mettre à jour le shortcode.",
        deleteFailed: "Impossible de supprimer le shortcode."
      },
      form: {
        codeLabel: "Code",
        displayNameFrLabel: "Nom d'affichage FR",
        displayNameEnLabel: "Nom d'affichage EN",
        defaultUtmLabel: "UTM par défaut",
        typeLabel: "Type"
      },
      buttons: {
        saving: "Enregistrement...",
        deleting: "Suppression..."
      },
      deleteModal: {
        title: "Confirmer la suppression",
        areYouSure: "Êtes-vous sûr de vouloir supprimer le shortcode ",
        irreversible: " ? Cette action est irréversible et supprimera également ce shortcode de toutes les listes."
      }
    },
    shortcodeTable: {
      remove: {
        confirmCustom: "Êtes-vous sûr de vouloir retirer \"{name}\" de cette liste personnalisée ?",
        confirmPlusco: "Êtes-vous sûr de vouloir retirer \"{name}\" de la liste PlusCo ? Cela affectera tous les clients qui utilisent cette liste."
      },
      empty: {
        title: "Liste vide",
        description: "Cette liste ne contient aucun shortcode. Utilisez les boutons d'action ci-dessus pour en ajouter."
      },
      search: {
        noResults: "Aucun résultat",
        noMatchPart1: "Aucun shortcode ne correspond à votre recherche \"",
        noMatchPart2: "\" dans cette liste."
      },
      header: {
        listTitle: "Shortcodes de la liste",
        searchResults: "Résultats de recherche",
        code: "Code",
        nameFR: "Nom français",
        nameEN: "Nom anglais",
        defaultUTM: "UTM par défaut",
        type: "Type",
        actions: "Actions"
      },
      label: {
        shortcode: "shortcode",
        shortcodes: "shortcodes",
        totalInList: "au total dans cette liste"
      },
      cell: {
        notDefined: "Non défini"
      },
      tooltip: {
        copyId: "Copier l'ID",
        idCopied: "ID copié !",
        editShortcode: "Modifier ce shortcode",
        removing: "Suppression en cours...",
        permissionRequired: "Permission requise",
        removeFromCustom: "Retirer de cette liste",
        removeFromPlusco: "Retirer de la liste PlusCo"
      },
      footer: {
        resultsDisplayedSingular: "résultat affiché",
        resultsDisplayedPlural: "résultats affichés",
        totalSingular: "shortcode au total",
        totalPlural: "shortcodes au total",
        pluscoWarning: "Les modifications affectent tous les clients utilisant la liste PlusCo"
      }
    },
    feeForm: {
      labels: {
        name: "Nom du frais",
        calculationType: "Type de calcul",
        calculationMode: "Mode de calcul"
      },
      placeholders: {
        name: "Nom du frais"
      },
      calculationTypes: {
        volumeUnit: "Volume d'unité",
        fixedFee: "Frais fixe",
        percentageBudget: "Pourcentage budget",
        units: "Unités"
      },
      calculationModes: {
        direct: "Directement sur le budget média",
        onPrevious: "Applicable sur les frais précédents"
      }
    },
    placementFormInfo: {
      header: {
        title: "Informations du placement",
        subtitle: "Configuration de base et taxonomies pour le placement"
      },
      fields: {
        nameLabel: "Nom du placement *",
        namePlaceholder: "Ex: Bannières Desktop, Vidéo Mobile, Display Tablet",
        nameTooltip: "Nom descriptif du placement. Soyez spécifique pour faciliter l'identification.",
        startDateLabel: "Date de début",
        startDateTooltip: "Date de début du placement. Hérite de la tactique ou de la campagne si non spécifiée.",
        endDateLabel: "Date de fin",
        endDateTooltip: "Date de fin du placement. Hérite de la tactique ou de la campagne si non spécifiée."
      },
      taxonomies: {
        title: "Taxonomies placements (niveaux 3-4)",
        placeholder: "Sélectionner une taxonomie...",
        tagsLabel: "Taxonomie à utiliser pour les tags",
        tagsTooltip: "Taxonomie qui sera utilisée pour générer les tags du placement",
        platformLabel: "Taxonomie à utiliser pour la plateforme",
        platformTooltip: "Taxonomie qui sera utilisée pour la configuration de la plateforme",
        mediaOceanLabel: "Taxonomie à utiliser pour MediaOcean",
        mediaOceanTooltip: "Taxonomie qui sera utilisée pour l'export vers MediaOcean"
      },
      notifications: {
        taxonomiesError: "Erreur lors du chargement des taxonomies",
        retry: "Réessayer",
        noTaxonomiesConfigured: "Aucune taxonomie configurée pour ce client.",
        youCanCreateTaxonomies: "Vous pouvez créer des taxonomies dans la section Configuration.",
        loadingData: "Chargement des données...",
        loadingTaxonomies: "Chargement des taxonomies..."
      }
    },
    placementFormTaxonomy: {
      error: {
        retry: "Réessayer"
      },
      noTaxonomy: {
        title: "Configuration des taxonomies",
        description: "Veuillez d'abord sélectionner des taxonomies dans l'onglet \"Informations\" pour configurer les variables."
      },
      loading: {
        data: "Chargement des données...",
        taxonomyAnalysis: "Analyse des taxonomies..."
      }
    },
    taxonomyFieldRenderer: {
      select: {
        placeholder: "Sélectionner..."
      },
      input: {
        placeholder: "Saisir la valeur...",
        authorizedChar:"Caractères autorisés : lettres, chiffres et tirets uniquement"

      },
      button: {
        chooseFromList: "📋 Choisir dans la liste ({count} options)"
      },
      emptyState: {
        title: "Configuration des champs de placement",
        description: "Toutes les variables sont héritées automatiquement. Aucune configuration manuelle n'est requise."
      },
      configuredState: {
        title: "Champs à configurer"
      },
      hiddenFields: {
        message: "ont été ignorés car ils n'acceptent pas les valeurs libres et n'ont pas de liste configurée pour ce client.",
        prefix: "Les champs",

      }
    },
    donutChart: {
      noData: "Aucune donnée",
      sections: "sections"
    },
    budgetPanel: {
      displayBudgetFor: "Afficher le budget pour:",
      currentTab: "Onglet actuel",
      allTabs: "Tous les onglets",
      loadingAllTabsData: "🔄 Chargement des données de tous les onglets...",
      errorLoadingData: "Erreur lors du chargement des données",
      retry: "Réessayer",
      totals: "Totaux",
      allTabsParenthesis: "(Tous les onglets)",
      currentTabParenthesis: "(Onglet actuel)",
      totalsTab: "Totaux",
      indicatorsTab: "Indicateurs",
      header: "Budget",
      clientInfoError: "Impossible de charger les informations client",
      selectCampaign: "Sélectionnez une campagne pour voir le budget."
    },
    budgetTotals: {
      mediaBudget: "Budget média",
      tacticFees: "Frais tactiques",
      totalClientBudget: "Budget client total",
      campaignBudget: "Budget de la campagne",
      difference: "Différence"
    },
    feeDetails: {
      title: "Détail des frais",
      campaignFees: "Frais de campagne",
      tacticFeesHeader: "Frais tactiques",
      defaultFeeLabel: "Frais",
      noFeesApplied: "Aucun frais appliqué."
    },
    sectionBreakdown: {
      title: "Répartition par section",
      allTabsParenthesis: "(Tous onglets)",
      loadingData: "Chargement des données...",
      noSectionOrBudget: "Aucune section ou budget défini."
    },
    budgetIndicators: {
      title: "Indicateurs de campagne",
      header: "Indicateurs",
      description: "Les indicateurs de campagne seront bientôt disponibles. Ils vous permettront de voir le taux de média locaux, de média numérique et le niveau de complexité de votre campagne",
      underConstruction: "🚧 En construction"
    },
    tacticsFooter: {
      tabs: {
        fallbackName: "cet onglet",
        deleteConfirmation: "Êtes-vous sûr de vouloir supprimer l'onglet \"{{ongletName}}\" ? Cette action supprimera également toutes les sections et tactiques associées.",
        deleteLastError: "Impossible de supprimer le dernier onglet",
        deleteTitle: "Supprimer l'onglet",
        renameTitle: "Renommer l'onglet",
        addTitle: "Ajouter un onglet"
      },
      viewMode: {
        hierarchy: "Vue hiérarchique",
        table: "Vue tableau",
        timeline: "Vue timeline"
      }
    },
    taxonomyPreview: {
      title: "Aperçu des taxonomies",
      variableTooltip: {
        variable: "Variable",
        format: "Format",
        source: "Source",
      },
      level: {
        title: "Niveau",
        noneConfigured: "Aucune structure configurée pour cette taxonomie",
      },
      placeholder: {
        description: "L'aperçu apparaîtra une fois les taxonomies sélectionnées et analysées.",
      },
      source: {
        title: "Source de la valeur :",
        campaign: "Campagne",
        tactic: "Tactique",
        placement: "Placement",
        creative: "Créatif",
        missingValue: "Valeur manquante",
      },
      helpText: {
        hover: "💡 Survolez un champ à configurer pour le mettre en surbrillance ici.",
      },
      card: {
        tags: "Tags",
        platform: "Platform",
        mediaocean: "MediaOcean",
      },
    },
    placementFormTags: {
      section: {
        title: "Configuration des Tags",
        description: "Configurez les paramètres de trafficking pour ce placement."
      },
      dates: {
        startDateLabel: "Date de début tag",
        startDateTooltip: "Date de début pour le tagging (par défaut : date de début du placement - 30 jours)",
        endDateLabel: "Date de fin tag",
        endDateTooltip: "Date de fin pour le tagging (par défaut : date de fin du placement + 30 jours)"
      },
      tagType: {
        label: "Type de tag",
        tooltip: "Sélectionnez le type de tag approprié selon le format média",
        selectOption: "Sélectionner un type...",
        placeholder: "Sélectionner un type de tag..."
      },
      rotation: {
        label: "Type de rotation créatif",
        tooltip: "Définit comment les créatifs de ce placement seront affichés en rotation",
        placeholder: "Sélectionner un type de rotation..."
      },
      floodlight: {
        label: "Configuration Floodlight",
        tooltip: "Paramètres spécifiques pour la configuration Floodlight",
        placeholder: "Entrez le nom ET le ID du floodlight"
      },
      weightedInfo: {
        title: "Rotation pondérée activée :",
        text: "Vous pourrez définir un poids de rotation (%) pour chaque créatif de ce placement dans l'onglet Tags des créatifs."
      },
      advanced: {
        thirdPartyMeasurementLabel: "Mesure partenaire externe (ex : Double Verify)",
        thirdPartyMeasurementTooltip: "Active ou désactive la mesure par un partenaire externe.",
        vpaidLabel: "VPAID",
        vpaidTooltip: "Active ou désactive VPAID (Video Player-Ad Interface Definition)",
        selectPlaceholder: "Sélectionner..."
      }
    },
    placementDrawer: {
      tabs: {
        info: "Informations",
        taxonomy: "Taxonomie",
        tags: "Tags"
      },
      title: {
        edit: "Modifier le placement: {{label}}",
        new: "Nouveau placement"
      }
    },
    creatifFormTags: {
      title: "Configuration des Tags Créatif",
      description: "Configurez les paramètres CM360",
      validation: {
        title: "Erreurs de validation :",
        startDateBeforePlacement: "La date de début tag créatif ne peut pas être antérieure au {{date}} (date début tag placement)",
        endDateAfterPlacement: "La date de fin tag créatif ne peut pas dépasser le {{date}} (date fin tag placement)",
        startAfterEnd: "La date de début tag créatif doit être antérieure à la date de fin"
      },
      fields: {
        startDate: {
          label: "Date de début tag créatif",
          tooltip: "Date de début pour le tagging de ce créatif. Doit être comprise entre {{startDate}} et {{endDate}}"
        },
        endDate: {
          label: "Date de fin tag créatif",
          tooltip: "Date de fin pour le tagging de ce créatif. Doit être comprise entre {{startDate}} et {{endDate}}"
        },
        weight: {
          label: "Poids de rotation (%)",
          placeholder: "Ex: 25",
          tooltip: "Pourcentage de rotation pour ce créatif. Exemple : 25% signifie que ce créatif sera affiché 25% du temps. La somme des poids de tous les créatifs du placement devrait totaliser 100%."
        }
      },
      weightedRotation: {
        activated: "Rotation pondérée activée :",
        description: "Le placement parent utilise une rotation pondérée. Définissez le poids de ce créatif.",
        noteTitle: "Note :",
        noteDescription: "Assurez-vous que la somme des poids de tous les créatifs de ce placement totalise 100%."
      },
      rotationInfo: {
        title: "Type de rotation du placement :",
        evenDescription: "Rotation équitable entre tous les créatifs",
        optimizedDescription: "Rotation optimisée selon les performances",
        floodlightDescription: "Rotation basée sur la configuration Floodlight"
      }
    },
    adOps: {
      actionButtons: {
        tagUnavailable: "Tag non disponible",
        copy: "Copier",
        historyTooltip: "{label} a été modifié depuis le dernier tag - Cliquer pour voir l'historique"
      },
      itemLabels: {
        unnamedPlacement: "Placement sans nom",
        unnamedCreative: "Créatif sans nom"
      },
      labels: {
        campaign: "Campagne",
        placement: "Placement",
        ad: "Ad",
        creative: "Créatif",
        url: "URL"
      }
    },
    colorPicker: {
      title: "Choisir une couleur",
      applyColor: "Appliquer la couleur {{colorName}}",
      removeColor: "Supprimer la couleur",
      none: "Aucune",
      applyInfo: "La couleur sera appliquée à toutes les lignes sélectionnées et sauvegardée automatiquement."
    },
    adOpsDropdown: {
      title: "Publishers",
      button: {
        noPublishers: "Aucun publisher",
        selectPublishers: "Sélectionner des publishers",
        allPublishers: "Tous les publishers",
        publisherSingular: "publisher sélectionné",
        publisherPlural: "publishers sélectionnés"
      },
      search: {
        placeholder: "Rechercher un publisher...",
        resultFound: "résultat trouvé",
        resultsFound: "résultats trouvés",
        noneFound: "Aucun publisher trouvé pour \"{{searchTerm}}\""
      },
      actions: {
        select: "Sélectionner",
        deselect: "Désélectionner",
        theResults: "les résultats",
        all: "tout"
      }
    },
    adOpsProgressBar: {
      emptyState: {
        message: "Sélectionnez une campagne et une version pour voir la progression des tags CM360"
      },
      tooltip: {
        created: "tags créés",
        toModify: "tags à modifier",
        toCreate: "tags à créer"
      }
    },
    tableRow: {
      clickToCopy: "Cliquer pour copier",
      modifiedSinceLastTag: "a été modifié depuis le dernier tag",
      clickToSeeHistory: "Cliquer pour voir l'historique",
      tagCreatedInCm360: "Tag créé dans CM360",
      changesDetectedSinceLastTag: "Modifications détectées depuis le dernier tag",
      unnamedPlacement: "Placement sans nom",
      unnamedCreative: "Créatif sans nom",
      label: "Libellé",
      labelModified: "Libellé modifié",
      tagType: "Type de Tag",
      startDate: "Date Début",
      endDate: "Date Fin",
      rotationType: "Type de Rotation",
      rotationWeight: "Poids de Rotation",
      floodlight: "Floodlight",
      thirdPartyMeasurement: "Mesure Tierce Partie",
      vpaid: "VPAID"
    },
    adOpsTacticInfo: {
      metricCard: {
        historyTooltip: "{{title}} a été modifié depuis le dernier tag - Cliquer pour voir l'historique",
        copyTooltip: "Cliquer pour copier {{title}}",
        noValue: "Valeur non disponible",
        copied: "✓ Copié"
      },
      noTacticSelected: "Aucune tactique sélectionnée",
      metrics: {
        mediaBudget: "Budget Média",
        cm360Rate: "Taux CM360",
        cm360Volume: "Volume CM360"
      },
      badges: {
        currency: "Devise",
        buyType: "Type d'achat"
      },
      updateButton: {
        updating: "Mise à jour...",
        confirmChanges: "Changements effectués dans CM360"
      },
      historyModal: {
        defaultItemLabel: "Tactique"
      }
    },
    adOpsTacticList: {
      common: {
        notAvailable: "N/A"
      },
      header: {
        title: "Tactiques",
        tactic: "tactique",
        tactic_plural: "tactiques",
        deselect: "Désélectionner"
      },
      filters: {
        all: "Tous",
        complete: "Complets ✓",
        modified: "Modifiés ⚠️",
        toCreate: "À créer"
      },
      emptyState: {
        noTacticFound: "Aucune tactique trouvée",
        noTacticForFilter: "Aucune tactique",
        completeFilter: "complète (tous tags créés)",
        modifiedFilter: "avec modifications",
        noTagsFilter: "sans tags",
        changeFilter: "Changez le filtre pour voir d'autres tactiques"
      },
      tacticCard: {
        unnamedTactic: "Tactique sans nom"
      },
      tooltip: {
        allCreated: "Tous les éléments et métriques ont des tags créés, aucun changement",
        changesDetected: "Modifications détectées dans:",
        partialTags: "Tags partiels - certains éléments ou métriques n'ont pas de tags",
        noTags: "Aucun tag créé"
      },
      changesSummary: {
        placements: "placements",
        creatives: "créatifs",
        metrics: "métriques"
      },
      legend: {
        complete: "Complet (tous créés)",
        modifications: "Modifications"
      }
    },
    adOpsTacticTable: {
      colorFilter: {
        all: "Toutes"
      },
      placeholder: {
        noTacticSelected: "Aucune tactique sélectionnée",
        selectTacticPrompt: "Sélectionnez une tactique pour voir ses placements"
      },
      buttons: {
        creating: "Création...",
        deselect: "Désélectionner"
      },
      tooltips: {
        deleteAllHistory: "Supprime TOUT l'historique des tags CM360 pour les éléments sélectionnés",
        applyColor: "Appliquer la couleur",
        removeColor: "Enlever la couleur",
        filterNoColor: "Filtrer par aucune couleur",
        filterByColor: "Filtrer par"
      },
      search: {
        placeholder: "Rechercher par label ou tag..."
      },
      filters: {
        statusLabel: "Statut:",
        all: "Tous",
        tagsCreated: "Tags créés ✓",
        toModify: "À modifier ⚠️",
        toCreate: "À créer",
        colorLabel: "Couleur:"
      },
      headers: {
        actions: "Actions",
        tagType: "Tag Type",
        startDate: "Date Début",
        endDate: "Date Fin",
        rotation: "Rotation",
        floodlight: "Floodlight",
        thirdParty: "3rd Party",
        vpaid: "VPAID"
      },
      table: {
        noResultsFor: "Aucun résultat pour",
        noPlacementsFound: "Aucun placement trouvé"
      }
    },
    cm360HistoryModal: {
      header: {
        title: "Historique des modifications",
        placement: "Placement",
        creative: "Créatif",
        metrics: "Métriques"
      },
      currentValue: {
        title: "Valeur actuelle"
      },
      history: {
        title: "Historique des valeurs",
        noHistory: "Aucun historique disponible pour ce champ"
      },
      buttons: {
        copyValue: "Copier la valeur",
        copied: "Copié!"
      },
      values: {
        empty: "(vide)"
      }
    },
    adOpsPage: {
      header: {
        title: "AdOps",
        refreshTooltip: "Rafraîchir toutes les données AdOps pour voir les dernières modifications",
        refreshing: "Rafraîchissement...",
        refresh: "Rafraîchir"
      },
      placeholder: {
        selectCampaignAndVersion: "Veuillez sélectionner une campagne et une version pour commencer.",
        selectVersion: "Veuillez sélectionner une version pour continuer."
      }
    },
    tactiqueDrawer: {
      fieldLabels: {
        TC_Media_Type: "Type média",
        TC_Publisher: "Partenaire",
        TC_LOB: "Ligne d'affaires",
        TC_Budget: "Budget"
      },
      validation: {
        fieldIsRequired: "Le champ \"{{label}}\" est obligatoire."
      },
      tabs: {
        info: "Info",
        strategy: "Stratégie",
        kpi: "KPI",
        budget: "Budget",
        repartition: "Répartition",
        admin: "Admin",
        tags: "Tags"
      },
      errors: {
        loadData: "Erreur lors du chargement des données. Veuillez réessayer.",
        fillRequiredFields: "Veuillez remplir tous les champs obligatoires avant de sauvegarder.",
        saveData: "Erreur lors de l'enregistrement. Veuillez réessayer.",
        missingRequiredFields: "Champs obligatoires manquants :"
      },
      confirm: {
        unsavedChanges: "Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?"
      },
      title: {
        edit: "Modifier la tactique : {{label}}",
        new: "Nouvelle tactique"
      },
      buttons: {
        saving: "Enregistrement..."
      }
    },
    tactiqueFormInfo: {
      status: {
        planned: "Planifié",
        active: "Actif",
        completed: "Terminé",
        cancelled: "Annulé"
      },
      general: {
        title: "Informations générales",
        subtitle: "Configuration de base de la tactique"
      },
      label: {
        placeholder: "Ex: Bannières Display Google",
        label: "Étiquette *",
        tooltip: "C'est le nom de votre tactique. Assurez-vous de mettre une description claire et concise."
      },
      bucket: {
        placeholder: "Sélectionner une enveloppe...",
        label: "Enveloppe",
        tooltip: "Les enveloppes sont un outil de planification haut niveau. Elles vous permettent de regrouper des tactiques similaires et de suivre leur budget global dans l'onglet 'Stratégie'"
      },
      mpa: {
        placeholder: "Ex: MPA Digital",
        label: "MPA",
        tooltip: "Vous permet de définir sur quelle MPA cette tactique s'affichera. Si laissez vide : s'affichera sur la MPA globale"
      },
      loading: {
        data: "Chargement des données..."
      },
      noBuckets: {
        message: "Aucune enveloppe budgétaire définie pour cette campagne. Vous pouvez créer des enveloppes dans la section Stratégie."
      }
    },
    kpi: {
      form: {
        label: "KPI",
        tooltip: "Indicateur de performance clé",
        selectPlaceholder: "Sélectionner un KPI...",
        costPer: "Coût par",
        costPerTooltip: "C'est le coût pour une unité du KPI sélectionné. Par exemple, pour un KPI de type 'CPC', c'est le coût par clic.",
        volume: "Volume",
        volumeTooltip: "C'est le volume anticipé du KPI sélectionné."
      },
      section: {
        title: "KPIs et objectifs",
        subtitle: "Définition des indicateurs de performance",
        selectMediaObjectivePlaceholder: "Sélectionner un objectif média...",
        mediaObjective: "Objectif média",
        mediaObjectiveTooltip: "Objectif média principal de la tactique"
      },
      list: {
        title: "KPIs de performance",
        maxKpisInfo: "Jusqu'à 5 KPIs peuvent être définis",
        addKpi: "+ Ajouter un KPI",
        noKpiDefined: "Aucun KPI défini. Ajoutez un KPI pour commencer.",
        addFirstKpi: "+ Ajouter le premier KPI",
        maxKpisReached: "Limite maximale de 5 KPIs atteinte. Supprimez un KPI existant pour en ajouter un nouveau."
      },
      status: {
        loadingData: "Chargement des données...",
        noKpiAvailable: "Aucun KPI disponible dans les listes dynamiques. Les champs de coût et volume restent utilisables."
      }
    },
    tactiqueFormStrategie: {
      customDimension: {
        label: "Dimension personnalisée {{number}}",
        helpText: "Champs personnalisé pour votre client",
        selectPlaceholder: "Sélectionner {{labelText}}...",
        inputPlaceholder: "Saisir {{labelText}}..."
      },
      mediaStrategy: {
        title: "Stratégie média",
        description: "Configuration stratégique et ciblage"
      },
      lob: {
        placeholder: "Sélectionner une ligne d'affaire...",
        label: "Ligne d'affaire",
        helpText: "Liste personalisée pour votre client"
      },
      mediaType: {
        placeholder: "Sélectionner un type de média...",
        label: "Type média",
        helpText: "C'est la catégorisation la plus importante. Cette caractéristique affectera le comportement de la tactique à plusieurs niveaux"
      },
      buyingMethod: {
        placeholder: "Sélectionner une méthode d'achat...",
        label: "Méthode d'achat - Programmatique/SEM",
        helpText: "Indiquez quel genre d'achat programmatique ou SEM sera utilisé. Laissez vide si non applicable"
      },
      infoBox: {
        title: "💡 Partenaire vs Inventaire",
        partnerTitle: "Partenaire :",
        partnerBullet1: "• C'est l'entité qui facturera l'agence",
        partnerBullet2: "• Programmatique : c'est généralement la DSP (ex:DV360)",
        partnerBullet3: "• OOH : Si l'achat est effectué avec Billups, vous devez mettre Billups",
        partnerBullet4: "• TV/Radio : Si plusieurs stations seront utilisées, choisissez \"Stations variées\"",
        partnerBullet5: "• Chaque tactique doit obligatoirement avoir un partenaire",
        inventoryTitle: "Inventaire :",
        inventoryBullet1: "• C'est comme un sous-partenaire ou un média qu'on va activer à travers le partenaire",
        inventoryBullet2: "• Si vous achetez un deal avec Radio-Canada à travers DV360, l'inventaire sera \"Radio-Canada\"",
        inventoryBullet3: "• Lors d'un achat avec Billups, vous pouvez indiquer quel partenaire OOH sera utilisé (ex : Astral)",
        inventoryBullet4: "• Si l'inventaire n'est pas applicable, laissez-le vide"
      },
      publisher: {
        placeholder: "Sélectionner un partenaire...",
        label: "Partenaire",
        helpText: "IMPORTANT : C'est l'entité administrative qui envera la facture."
      },
      inventory: {
        placeholder: "Sélectionner un inventaire...",
        label: "Inventaire",
        helpText: "Cette valeur est facultative. Il s'agit d'un sous-partenaire ou d'une propriété du partenaire (Ex : Pelmorex > Meteomedia)"
      },
      marketDescription: {
        placeholder: "Ex: Canada, Québec, Montréal",
        label: "Description du marché"
      },
      common: {
        openFieldHelpText: "Champs ouvert. Utilisé uniquement dans le plan média. Ne sera pas utilisé dans la taxonomie"
      },
      audienceDescription: {
        placeholder: "Décrivez le ciblage de cette tactique...",
        label: "Description de l'audience"
      },
      productDescription: {
        placeholder: "Ex: iPhone 15 Pro",
        label: "Description du produit"
      },
      formatDescription: {
        placeholder: "Décrivez le format utilisé...",
        label: "Description du format"
      },
      locationDescription: {
        placeholder: "Décrivez l'emplacement",
        label: "Description de l'emplacement"
      },
      frequency: {
        placeholder: "Ex: 3 fois par semaine",
        label: "Fréquence",
        helpText: "Ex : 2x par semaine"
      },
      market: {
        placeholder: "Sélectionner un marché...",
        label: "Marché",
        helpText: "Champs fermé utilisé dans certaines taxonomies"
      },
      language: {
        placeholder: "Sélectionner une langue...",
        label: "Langue",
        helpText: "Champs ouvert pour la langue de la tactique. Utilisé uniquement dans le plan média. La langue utilisée dans la taxonomie sera déterminée au niveau du placement"
      },
      customFields: {
        title: "Champs personnalisés",
        description: "Configuration spécifique au client"
      },
      production: {
        title: "Production",
        description: "Gestion des créatifs et des livrables"
      },
      creatives: {
        placeholder: "Ex: 5 bannières + 2 vidéos",
        label: "Nombre de créatifs suggérés",
        helpText: "Facultatif - Nombre de créatifs suggéré à produire pour l'agence de création"
      },
      deliveryDate: {
        label: "Date de livraison des créatifs",
        helpText: "Facultatif - Date de livraison souhaitée pour assurer une mise en ligne à temps."
      }
    },
    repartition: {
        mediaBudget: {
          label: "Budget média :",
          notDefined: "Non défini"
        },
        section: {
          title: "Répartition temporelle",
          description: "Configurez les dates de la tactique et répartissez les valeurs selon les breakdowns de la campagne"
        },
        startDate: {
          tooltip: "Date de début de cette tactique spécifique",
          label: "Date de début *"
        },
        endDate: {
          tooltip: "Date de fin de cette tactique spécifique",
          label: "Date de fin *"
        },
        breakdown: {
          defaultBadge: "Par défaut",
          basedOnTacticDates: "• Basé sur les dates de la tactique",
          totalLabel: "Total:",
          vsBudget: "vs Budget:",
          distributeButton: "Distribuer",
          typeMonthly: "Mensuel",
          typeWeekly: "Hebdomadaire",
          typePEBs: "PEBs",
          typeCustom: "Custom"
        },
        period: {
          costGuideTitle: "Choisir du guide de coûts",
          unitCostPlaceholder: "Coût/unité",
          volumePlaceholder: "Volume",
          totalPlaceholder: "Total",
          valuePlaceholder: "Valeur"
        },
        noBreakdown: {
          message: "Aucun breakdown configuré pour cette campagne.",
          details: "Les breakdowns sont définis lors de la création ou modification de la campagne."
        },
        costGuideModal: {
          title: "Sélectionner du guide de coûts"
        }
    },
    tactiqueFormTags: {
      fields: {
        buyType: {
          label: "Type d'achat *",
          tooltip: "Sélectionnez le type d'achat pour cette tactique",
          selectPlaceholder: "Sélectionner un type"
        },
        cm360Volume: {
          label: "Volume CM360 *",
          tooltip: "Entrez le volume prévu pour cette tactique (nombre entier)"
        },
        cm360Rate: {
          label: "Taux CM360 (calculé automatiquement)",
          tooltip: "Taux calculé automatiquement : Budget Client ÷ Volume CM360 (×1000 si CPM)"
        }
      },
      validation: {
        volumePositive: "Le volume doit être supérieur à 0"
      }
    },
    tactiqueFormComponents: {
      selectionButtons: {
        clearSelection: "Effacer la sélection"
      },
      smartSelect: {
        enterValue: "Saisir une valeur..."
      }
    },
    tactiqueFormBudget: {
      currencySelector: {
        loadingRates: "Chargement des taux de change...",
        unavailableTitle: "Taux de change non disponible",
        configureMessage: "Veuillez configurer au moins un taux de change pour {tacticCurrency} → {campaignCurrency} dans la section Devises du client.",
        requiredTitle: "Conversion de devise requise",
        requiredDescription: "La devise d'achat ({tacticCurrency}) diffère de la devise de campagne ({campaignCurrency}). Veuillez sélectionner la version de taux à utiliser.",
        versionLabel: "Version du taux de change à utiliser *",
        versionTooltip: "Sélectionnez la version du taux de change à appliquer pour convertir le budget de la devise d'achat vers la devise de campagne.",
        selectPlaceholder: "Sélectionner une version de taux...",
        selectionWarning: "⚠️ Veuillez sélectionner une version de taux pour continuer",
        selectedRateLabel: "Taux sélectionné :"
      },
      form: {
        title: "Budget et frais",
        calculationErrors: "Erreurs de calcul :",
        convergenceWarning: {
          title: "Convergence imparfaite détectée",
          description: "Le système n'a pas pu trouver un budget média qui génère exactement le budget client visé.",
          gap: "Écart :"
        },
        sections: {
          currencyConversion: {
            title: "Conversion de devise",
            description: "Sélection du taux de change à appliquer"
          },
          mainBudget: {
            title: "Budget principal",
            description: "Calculs automatiques du budget, coût et volume"
          },
          bonus: {
            title: "Bonification",
            description: "Gestion de l'économie négociée"
          },
          fees: {
            title: "Frais",
            description: "Application des frais configurés pour le client"
          },
          summary: {
            title: "Récapitulatif",
            description: "Détail des coûts et conversion de devise"
          }
        },
        loadingData: "Chargement des données budgétaires..."
      },
      errors: {
        noRateConfigured: "Aucun taux de change configuré pour {fromCurrency} → {toCurrency}",
        loadingRatesError: "Erreur lors du chargement des taux de change pour {fromCurrency} → {toCurrency}",
        rateNotFoundForVersion: "Taux de change non trouvé pour la version \"{version}\"",
        applyingRateError: "Erreur lors de l'application du taux de change pour \"{version}\""
      },
      debug: {
        budgetData: "Données Budget:",
        results: "Résultats:",
        bonification: "Bonification:",
        converged: "Convergé:"
      }
    },
    tactiqueFormAdmin: {
      adminField: {
        useSameAsCampaign: "Utiliser le même que la campagne",
        inheritedValuePlaceholder: "Valeur héritée de la campagne"
      },
      main: {
        title: "Administration",
        subtitle: "Configuration administrative et facturation"
      },
      billingNumber: {
        label: "Numéro de facturation",
        tooltip: "Numéro utilisé pour la facturation de cette tactique",
        placeholder: "Numéro de facturation spécifique"
      },
      po: {
        label: "PO",
        tooltip: "Numéro de bon de commande pour cette tactique",
        placeholder: "PO spécifique"
      },
      inheritanceInfo: {
        title: "💡 À propos de l'héritage",
        enabledTitle: "Héritage activé :",
        enabledDesc: " La tactique utilisera les valeurs définies au niveau de la campagne.",
        disabledTitle: "Héritage désactivé :",
        disabledDesc: " Vous pouvez définir des valeurs spécifiques pour cette tactique.",
        updateNote: "Les valeurs héritées sont automatiquement mises à jour si la campagne change."
      },
      campaignValues: {
        title: "📋 Valeurs de la campagne",
        billingNumberLabel: "Numéro de facturation :",
        notSet: "Non défini"
      },
      loading: {
        message: "Chargement des données administratives..."
      },
      warning: {
        noCampaignValues: "Aucune valeur administrative n'est définie au niveau de la campagne. Vous devrez saisir des valeurs spécifiques pour cette tactique."
      }
    },
    distributionModal: {
      title: "Distribuer le montant",
      form: {
        startDateLabel: "Date de début",
        endDateLabel: "Date de fin",
        distributeOnLabel: "Distribuer sur",
        unitCost: "Coût / unité",
        volume: "Volume",
        totalAmountLabel: "Montant total à distribuer",
        amountPlaceholder: "Ex: 10000",
      },
      preview: {
        willBeDividedOver: "Sera divisé sur",
        period: "période",
        perPeriod: "/ période",
      },
      info: {
        distributionDates: "La distribution se fera uniquement sur les périodes qui intersectent avec les dates choisies",
        andAreActive: " et qui sont activées (cochées)",
        unitCostDistribution: "Le montant sera réparti sur le coût par unité de chaque période.",
        volumeDistribution: "Le montant sera réparti sur le volume de chaque période.",
      },
      confirmButton: "Distribuer",
    },
    costGuideModal: {
      title: "Sélectionner du guide de coûts",
      levelTitles: {
        mainCategory: "une catégorie principale",
        subCategory: "une sous-catégorie",
        specification: "une spécification",
        optionWithPrice: "une option avec prix"
      },
      breadcrumb: {
        level1: "Niveau 1"
      },
      buttons: {
        back: "← Retour"
      },
      selection: {
        choose: "Choisissez",
        option: "option"
      },
      finalSelection: {
        unit: "Unité",
        per: "par"
      },
      noOptions: {
        title: "Aucune option disponible pour cette sélection.",
        instruction: "Veuillez revenir en arrière et faire une autre sélection."
      }
    },
    budgetSummary: {
      feeApplication: {
        mediaBudget: "Budget média"
      },
      convergence: {
        approximateCalculation: "⚠️ Calcul approximatif",
        gap: "Écart:",
        totalExceedsTarget: "Le total calculé dépasse le budget visé à cause de la complexité des frais.",
        totalBelowTarget: "Le total calculé est en dessous du budget visé à cause de la complexité des frais."
      },
      currencyConversion: {
        title: "🔄 Conversion automatique vers la devise de campagne",
        helpText: {
          part1: "Conversion automatique de ",
          part2: " vers ",
          part3: " en utilisant le taux de change configuré pour le client."
        },
        exchangeRate: "Taux de change",
        automaticConversion: "💱 Conversion automatique :",
        missingRateWarning: "⚠️ Taux de change manquant"
      },
      noBudget: {
        title: "Récapitulatif budgétaire",
        message: "Le récapitulatif sera disponible une fois qu'un budget média sera défini."
      },
      costDetails: {
        title: "Détail des coûts",
        amountsIn: "Montants en",
        campaignCurrency: "(devise de campagne)",
        tacticCurrency: "Devise de la tactique :"
      },
      lines: {
        mediaBudget: "Budget média",
        mediaBudgetDesc: "Montant net pour les plateformes publicitaires",
        negotiatedBonus: "Bonification négociée",
        negotiatedBonusDesc: "Valeur ajoutée gratuite obtenue du partenaire",
        feesSubtotal: "Sous-total frais",
        totalClientBudget: "TOTAL BUDGET CLIENT",
        totalClientBudgetDesc: "Montant total facturable au client"
      },
      applicableFees: {
        title: "Frais applicables :",
        appliedOn: "Appliqué sur :",
        undefined: "Non défini"
      },
      conversionError: {
        title: "⚠️ Conversion de devise impossible",
        noRateConfiguredFor: "Aucun taux de change configuré pour :",
        pleaseConfigure: "Veuillez configurer le taux de change dans la section devises du client.",
        amountsDisplayedInTacticCurrency: "Les montants sont affichés dans la devise de la tactique"
      },
      noFees: {
        info: "💡 Aucun frais appliqué. Le budget client correspond au budget média. Vous pouvez activer des frais dans la section précédente si nécessaire."
      }
    },
    budgetMainSection: {
      dynamicLabels: {
        costPerUnit: "Coût par {unit}",
        cpmTooltip: "Coût par mille impressions. Montant payé pour 1000 impressions affichées.",
        costPerUnitTooltip: "Coût unitaire pour le type d'unité sélectionné ({unit}). Ce champ est obligatoire et doit être saisi manuellement.",
        impressionVolumeLabel: "Volume d'{unit}",
        unitVolumeLabel: "Volume de {unit}",
        impressionVolumeTooltip: "Nombre d'{unit} calculé automatiquement selon la formule : (Budget média + Bonification) ÷ CPM × 1000. Ce champ est en lecture seule et calculé par le système.",
        unitVolumeTooltip: "Nombre de {unit} calculé automatiquement selon la formule : (Budget média + Bonification) ÷ Coût par {unitSingular}. Ce champ est en lecture seule et calculé par le système."
      },
      budgetConfig: {
        clientBudgetLabel: "Budget client",
        clientBudgetTooltip: "Montant total que le client paiera, incluant le budget média et tous les frais applicables. Le budget média sera calculé en déduisant les frais de ce montant.",
        mediaBudgetLabel: "Budget média",
        mediaBudgetTooltip: "Montant net qui sera effectivement dépensé sur les plateformes publicitaires, sans les frais. Le volume d'unités sera calculé sur ce montant plus la bonification."
      },
      clientBudgetBox: {
        title: "💡 Calcul du budget média",
        clientBudgetEntered: "Budget client saisi :",
        estimatedMediaBudget: "Budget média estimé :",
        applicableFees: "Frais applicables :",
        verification: "Vérification :",
        calculationNote: "💡 Les calculs exacts sont effectués automatiquement par le système."
      },
      mediaBudgetBox: {
        title: "💰 Budget client total",
        mediaBudgetEntered: "Budget média saisi :",
        plusTotalFees: "Plus total des frais :",
        invoicedClientBudget: "Budget client facturé :"
      },
      form: {
        unit: "unité",
        units: "unités",
        calculatedLabel: "(calculé)",
        calculatedAutomatically: "Calculé automatiquement",
        requiresValidCost: "Nécessite un coût par unité valide pour le calcul"
      },
      costGuide: {
        loading: "⏳ Chargement du guide...",
        useGuide: "📋 Utiliser le guide de coût",
        notAvailable: "📋 Guide de coût non disponible",
        modalTitle: "Sélectionner un coût du guide"
      },
      incompleteWarning: {
        title: "Configuration incomplète",
        enterBudget: "• Saisir un budget ({mode})",
        enterCost: "• Saisir un {costLabel}",
        clientMode: "client",
        mediaMode: "média"
      },
      loadingMessage: "⏳ Chargement en cours... Les calculs budgétaires seront disponibles une fois les données chargées."
    },
    budgetGeneralParams: {
      currencies: {
        cad: "CAD - Dollar Canadien",
        usd: "USD - Dollar Américain",
        eur: "EUR - Euro",
        chf: "CHF - Franc Suisse"
      },
      budgetModes: {
        media: "Budget média",
        client: "Budget client"
      },
      unitType: {
        placeholder: "Sélectionner un type d'unité...",
        label: "Type d'unité",
        tooltip: "Unité d'achat. Ne pas confondre avec les KPI. C'est l'unité dans laquelle on achète cette tactique. Habituellement : Impressions"
      },
      purchaseCurrency: {
        label: "Devise d'achat",
        tooltip: "Devise dans laquelle les achats média seront effectués. Utilisée pour les calculs de budget et la conversion si différente de la campagne."
      },
      entryMode: {
        label: "Mode de saisie",
        tooltip: "Détermine comment interpréter le budget saisi. Budget client = montant total incluant frais. Budget média = montant net pour les plateformes."
      },
      infoBox: {
        title: "💡 Modes de saisie du budget",
        mediaBudgetTitle: "Budget média :",
        mediaBudgetItem1: "Montant net qui sera effectivement dépensé sur les plateformes média",
        mediaBudgetItem2: "Les frais s'ajoutent par-dessus pour calculer le budget client total",
        clientBudgetTitle: "Budget client :",
        clientBudgetItem1: "Montant total incluant le budget média + tous les frais",
        clientBudgetItem2: "Correspond au montant facturable au client"
      },
      noUnitTypeWarning: {
        label: "Type d'unité :",
        text: "Aucune liste dynamique configurée. Vous pouvez configurer les types d'unité dans la section Administration."
      },
      loading: {
        text: "⏳ Chargement en cours... Les paramètres généraux seront disponibles une fois les données chargées."
      }
    },
    budgetBonification: {
      validation: {
        mustBeGreaterOrEqual: "La valeur réelle doit être supérieure ou égale au budget média.",
        noBonusSameValue: "La valeur réelle est égale au budget média. Aucune bonification n'est calculée."
      },
      labels: {
        includeBonus: "Inclure une bonification",
        realValue: "Valeur réelle de la tactique",
        bonusCalculated: "Valeur de la bonification (calculée)"
      },
      tooltips: {
        includeBonus: "Activez cette option si la valeur négociée avec le fournisseur est supérieure au budget média que vous payez.",
        realValue: "Indiquez ici la valeur totale de l'espace média que vous obtenez, telle que négociée avec le fournisseur. Ce montant doit être égal ou supérieur à votre budget média.",
        bonusCalculated: "Ceci est le montant de la bonification, calculé comme la différence entre la valeur réelle et le budget média payé. Ce champ n'est pas modifiable."
      },
      descriptions: {
        hasBonus: "La bonification est activée. Saisissez la valeur réelle de la tactique pour calculer le gain.",
        noBonus: "Aucune bonification n'est actuellement appliquée sur cette tactique."
      },
      warnings: {
        mediaBudgetRequired: "Veuillez d'abord saisir un budget média pour cette tactique afin de calculer la bonification.",
        loadingConfiguration: "La configuration de la bonification est en cours de chargement ou désactivée par une autre option."
      },
      reference: {
        title: "Budget de référence pour le calcul",
        currentMediaBudget: "Budget média actuel",
        mustBeGreater: "La valeur réelle doit être supérieure à ce montant pour générer une bonification."
      },
      pendingInput: {
        title: "Bonification activée, en attente de la valeur",
        description: "Saisissez la valeur réelle (négociée) de l'espace média dans le champ ci-dessous pour que la bonification soit automatiquement calculée."
      },
      infos: {
        economyOf: "Soit une économie de",
        onNegotiatedValue: "sur la valeur négociée.",
        insufficientValue: "Valeur insuffisante pour calculer une économie.",
        ofMediaBudget: "du budget média",
        noBonusReasonSameValue: "La valeur réelle est identique au budget. Pas de bonification.",
        bonusWillBeCalculated: "La bonification sera calculée une fois la valeur réelle entrée."
      },
      summary: {
        title: "Résumé de la bonification",
        totalNegotiatedValue: "Valeur totale négociée",
        mediaBudgetPaid: "Budget média payé",
        bonusObtained: "Bonification obtenue",
        represents: "représentant",
        addedValue: "de valeur ajoutée."
      },
      disabled: {
        title: "Bonification désactivée.",
        description: "Cochez la case ci-dessus pour l'activer et saisir la valeur réelle."
      }
    },
    budgetFees: {
      calculationDescription: {
        percentageOnBudget: "Pourcentage appliqué sur le budget",
        fixedAmountByUnitVolume: "Montant fixe × volume d'unité",
        fixedAmountByUnitCount: "Montant fixe × nombre d'unités",
        independentFixedAmount: "Montant fixe indépendant",
        undefinedType: "Type non défini",
      },
      feeItem: {
        order: "Ordre",
        calculatedAmount: "Montant calculé",
        feeOption: "Option du frais",
        autoSelected: "Sélectionnée automatiquement",
        selectOption: "Sélectionner une option...",
        bufferInfo: " (Buffer: +{buffer}%)",
        useDifferentUnitVolume: "Utiliser un autre volume d'unité pour calculer ce frais",
        defaultVolumeInfo: "Par défaut, ce frais utilise le volume d'unité de la tactique ({unitVolume}). Cochez pour saisir un volume différent.",
        customUnitVolume: "Volume d'unité personnalisé",
        enterUnitVolume: "Saisir le volume d'unité",
        volumeCalculationHintPrefix: "Ce volume sera utilisé pour calculer le frais :",
        customValue: "Valeur personnalisée",
        finalValueWithBuffer: "Valeur finale avec buffer (+{buffer}%)",
        fixedValue: "Valeur fixe",
        nonEditableValue: "Valeur non modifiable",
        bufferIncluded: " (buffer +{buffer}% inclus)",
        numberOfUnits: "Nombre d'unités",
        finalCalculationMultiplier: "Multiplieur pour le calcul final",
        units: "unités",
      },
      feeSummary: {
        calculationBase: "Base de calcul",
        mediaBudgetInCurrency: "(budget média en {currency})",
        mediaBudgetPlusPreviousFeesInCurrency: "(budget média + frais précédents en {currency})",
        customVolume: "(volume personnalisé)",
        fixedAmountOf: "Montant fixe de",
        bufferApplied: "Buffer appliqué",
        onBaseValue: "sur la valeur de base",
      },
      main: {
        noFeesConfigured: "Aucun frais configuré pour ce client.",
        feesConfigurableInAdmin: "Les frais peuvent être configurés dans la section Administration du client.",
        displayCurrency: "Devise d'affichage",
        currencyNotice: "Les montants de frais sont calculés et affichés dans la devise de la tactique.",
        systemCalculationNotice: "Les calculs exacts sont effectués automatiquement par le système.",
        appliedFees: "Frais appliqués",
        customVolumeAbbr: "Vol. pers.",
        totalFees: "Total des frais",
        mediaBudgetWarning: "⚠️ Un budget média doit être défini pour calculer les frais.",
        loadingConfiguration: "⏳ Chargement en cours... La configuration des frais sera disponible une fois les données chargées.",
      },
    },
    breakdownPeriod: {
      months: {
        short: "JAN,FEB,MAR,AVR,MAI,JUN,JUL,AOU,SEP,OCT,NOV,DEC",
        shortTitleCase: "Jan,Fév,Mar,Avr,Mai,Jun,Jul,Aoû,Sep,Oct,Nov,Déc"
      }
    },
    dndKit: {
      common: {
        idCopied: "ID copié !",
        copyId: "Copier l'ID",
        taxonomy: {
          tags: "Tags",
          platform: "Plateforme",
          mediaOcean: "MediaOcean"
        }
      },
      creatifItem: {
        type: "créatif",
        editTitle: "Modifier le créatif"
      },
      placementItem: {
        type: "placement",
        addCreative: "Ajouter un créatif",
        editTitle: "Modifier le placement",
        noCreative: "Aucun créatif pour ce placement"
      },
      tactiqueItem: {
        type: "tactique",
        partnerLogoAlt: "Logo partenaire",
        inventoryLogoAlt: "Logo inventaire",
        addPlacement: "Ajouter un placement",
        editTitle: "Modifier la tactique",
        noPlacement: "Aucun placement dans cette tactique"
      }
    },
    tactiquesHierarchyView: {
      dragAndDrop: {
        reorganizing: "Réorganisation en cours..."
      },
      section: {
        alreadyFirst: "Déjà en première position",
        moveUp: "Monter la section",
        addTactique: "Ajouter une tactique",
        edit: "Modifier la section",
        ofBudget: "du budget"
      },
      common: {
        idCopied: "ID copié !",
        copyId: "Copier l'ID"
      },
      tactique: {
        noneInSection: "Aucune tactique dans cette section"
      }
    },
    taxonomyContextMenu: {
      header: {
        titleTags: "Tags",
        titlePlatform: "Plateforme",
        titleMediaOcean: "MediaOcean",
        autoRefresh: "• Auto-refresh",
        manualRefreshTooltip: "Actualiser manuellement"
      },
      status: {
        noTaxonomyConfigured: "Aucune taxonomie configurée pour",
        forTags: "les tags",
        forPlatform: "la plateforme",
        forMediaOcean: "MediaOcean",
        noValueConfigured: "Aucune valeur configurée",
        refreshingData: "Actualisation des données..."
      },
      actions: {
        copyTooltip: "Copier :",
        copiedSuccess: "Copié !",
        copyToClipboardTooltip: "Copier dans le presse-papier"
      }
    },
    timelineView: {
      notifications: {
        confirmBreakdownChange: "Vous êtes en mode édition. Changer de breakdown annulera vos modifications. Continuer ?"
      },
      errors: {
        noBreakdownConfigured: "Aucun breakdown configuré pour cette campagne.",
        configureInSettings: "Veuillez configurer des breakdowns dans les paramètres de campagne.",
        noTacticsAvailable: "Aucune tactique disponible pour cette campagne.",
        noBreakdownSelected: "Aucun breakdown sélectionné. Veuillez sélectionner un breakdown pour voir les répartitions."
      },
      header: {
        distributionLabel: "Répartition :",
        pebValues: "3 valeurs",
        periodsLabel: "période(s)"
      },
      buttons: {
        editMode: "Mode édition"
      },
      editModeInfo: {
        title: "Mode édition activé",
        instructions: "Vous pouvez maintenant modifier les valeurs des répartitions. Utilisez Ctrl+C/⌘+C pour copier et Ctrl+V/⌘+V pour coller.",
        defaultBreakdownTip: " Cochez/décochez les cases pour activer/désactiver les périodes."
      }
    },
    timeline: {
      table: {
        noPeriodFound: "Aucune période trouvée pour ce breakdown.",
        pendingChanges: "modification(s) en attente",
        saving: "Sauvegarde...",
        header: {
          sectionTactic: "Section / Tactique",
          totalBudget: "Total Budget",
          totalVolume: "Vol Total",
          averageCost: "Coût Moy"
        },
        unnamedSection: "Section sans nom",
        placeholder: {
          cost: "Coût",
          volume: "Vol",
          total: "Total"
        },
        footer: {
          totalVolume: "Total Volume"
        }
      },
      alerts: {
        tactic: "La tactique ",
        notFoundMaybeDeleted: " n'a pas été trouvée. Elle a peut-être été supprimée par un autre utilisateur.",
        errorSavingTactic: "Erreur lors de la sauvegarde de la tactique ",
        generalSaveError: "Une erreur générale est survenue lors de la sauvegarde."
      },
      utils: {
        months: {
          short: ['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC'],
          medium: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
        }
      }
    },
    searchableSelect: {
      placeholder: {
        default: "Sélectionner..."
      },
      search: {
        placeholder: "Rechercher..."
      },
      results: {
        none: "Aucun résultat"
      }
    },
    sectionModal: {
      title: {
        create: "Nouvelle section",
        edit: "Modifier la section"
      },
      errors: {
        nameRequired: "Le nom de la section est obligatoire"
      },
      form: {
        nameLabel: "Nom de la section",
        namePlaceholder: "Entrez le nom de la section",
        colorLabel: "Couleur de la section",
        colorTitle: "Couleur"
      }
    },
    selectedActionsPanel: {
      moveButton: {
        validating: "Validation en cours...",
        noValidationAvailable: "Aucune validation disponible",
        invalidSelection: "Sélection invalide",
        invalidForMove: "Sélection invalide pour le déplacement",
        moveAction: "Déplacer",
        total: "au total",
        to: "vers",
        readyToMove: "Prêt à déplacer",
        target: {
          tab: "un onglet",
          section: "une section",
          tactic: "une tactique",
          placement: "un placement"
        }
      },
      buttons: {
        move: "Déplacer",
        invalid: "Invalide"
      },
      moveImpossible: {
        title: "Déplacement impossible"
      },
      operationInProgress: "Opération en cours..."
    },
    model: {
      item: "élément",
      selected: "sélectionné",
      section: "section",
      sections: "sections",
      tactic: "tactique",
      tactics: "tactiques",
      placement: "placement",
      placements: "placements",
      creative: "créatif",
      creatives: "créatifs"
    },
    simpleMoveModal: {
      cascade: {
        searchPlaceholder: "Rechercher {{title}}...",
        noResultsFound: "Aucun résultat trouvé",
        noItemsAvailable: "Aucun {{title}} disponible"
      },
      destinationSummary: {
        selectedDestination: "Destination sélectionnée"
      },
      levels: {
        campaign: "Campagne",
        version: "Version",
        tab: "Onglet",
        section: "Section",
        tactic: "Tactique",
        placement: "Placement"
      },
      destination: {
        title: "Déplacer les éléments sélectionnés",
        itemCount: "{{count}} élément vers",
        itemCount_plural: "{{count}} éléments vers",
        a_tab: "un onglet",
        a_section: "une section",
        a_tactic: "une tactique",
        a_placement: "un placement",
        totalItems: "({{count}} élément au total)",
        totalItems_plural: "({{count}} éléments au total)",
        preparing: "Préparation...",
        confirmMove: "Confirmer le déplacement"
      },
      progress: {
        title: "Déplacement en cours...",
        description: "Veuillez patienter pendant que nous déplaçons vos éléments.",
        itemsToProcess: "{{count}} élément à traiter",
        itemsToProcess_plural: "{{count}} éléments à traiter"
      },
      result: {
        successTitle: "Déplacement réussi !",
        failureTitle: "Déplacement échoué",
        itemsMoved: "élément déplacé",
        itemsMoved_plural: "éléments déplacés",
        itemsSkipped: "élément ignoré",
        itemsSkipped_plural: "éléments ignorés",
        errors: "Erreurs",
        warnings: "Avertissements"
      }
    },
    loading: {
      starting: 'Démarrage...',
      campaigns: 'Chargement des campagnes...',
      versions: 'Chargement des versions...',
      tabs: 'Chargement des onglets...',
      sections: 'Chargement des sections...',
      tactics: 'Chargement des tactiques...',
      placements: 'Chargement des placements...',
      creatives: 'Chargement des créatifs...',
      error: 'Erreur de chargement'
    },
    asyncTaxonomyUpdate: {
      status: {
        updating: "Mise à jour des taxonomies en cours...",
        success: "Taxonomies mises à jour avec succès !",
        error: "❌ Erreur lors de la mise à jour des taxonomies"
      }
    },
    cacheLoading: {
      steps: {
        authVerification: "Vérification de l'authentification",
        loadingAccessibleClients: "Chargement des clients accessibles",
        loadingGlobalLists: "Chargement des listes globales",
        loadingClientOverrides: "Chargement des personnalisations client",
        finalTouch: "Petite touche finale!"
      },
      messages: {
        success: "Chargement terminé avec succès!"
      },
      errors: {
        unknown: "Erreur inconnue"
      }
    },
    useCampaignData: {
      error: {
        notFound: "Campagne non trouvée",
        loadingError: "Erreur lors du chargement de la campagne"
      }
    },
    useCampaignSelection: {
      errorLoadingCampaigns: "Erreur lors du chargement des campagnes",
      errorLoadingVersions: "Erreur lors du chargement des versions"
    },
    dataFlow: {
      loading: {
        initialData: "Chargement des données...",
        refreshing: "Actualisation..."
      },
      operations: {
        unknownError: "Erreur inconnue",
        errorDuring: "Erreur lors de"
      }
    },
    selectionValidation: {
      errors: {
        noItemSelected: "Aucun élément sélectionné",
        missingItemsPrefix: "Éléments manquants dans la hiérarchie:",
        incompleteSelectionPrefix: "Sélection incomplète : ",
        has: " a",
        unselectedItems: "élément(s) non sélectionné(s).",
        missingChildrenTotal: "enfant(s) manquant(s) au total.",
        incompatibleTypesPrefix: "Types d'éléments incompatibles : impossible de déplacer des ",
        andSeparator: " et des ",
        incompatibleTypesSuffix: " ensemble."
      },
      messages: {
        buttons: {
          invalidSelection: "Sélection invalide",
          movePrefix: "Déplacer",
          moveTo: "vers"
        },
        common: {
          totalItemsSuffix: "éléments au total"
        }
      },
      glossary: {
        items: {
          sections: "sections",
          tactics: "tactiques",
          placements: "placements",
          creatives: "créatifs"
        },
        targets: {
          tab: "un onglet",
          section: "une section",
          tactic: "une tactique",
          placement: "un placement"
        },
        states: {
          selectedSingular: "sélectionné",
          selectedPlural: "sélectionnés"
        }
      }
    },
    useShortcodes: {
      notifications: {
        loadError: "Erreur lors du chargement des shortcodes",
        createCustomListSuccess: "Liste personnalisée créée avec succès",
        createCustomListError: "Erreur lors de la création de la liste personnalisée",
        deleteCustomListSuccess: "Liste personnalisée supprimée avec succès",
        deleteCustomListError: "Erreur lors de la suppression de la liste personnalisée",
        addShortcodeSuccess: "Shortcode ajouté avec succès",
        addShortcodeError: "Erreur lors de l'ajout du shortcode",
        removeShortcodeSuccess: "Shortcode retiré avec succès",
        removeShortcodeError: "Erreur lors de la suppression du shortcode",
        createShortcodeSuccess: "Shortcode créé et ajouté avec succès",
        createShortcodeError: "Erreur lors de la création du shortcode",
        updateShortcodeSuccess: "Shortcode mis à jour avec succès",
        updateShortcodeError: "Erreur lors de la mise à jour du shortcode"
      }
    },
    useSimpleMoveModal: {
      errors: {
        loadCampaigns: "Erreur lors du chargement des campagnes",
        loadVersions: "Erreur lors du chargement des versions",
        loadTabs: "Erreur lors du chargement des onglets",
        loadSections: "Erreur lors du chargement des sections",
        loadTactics: "Erreur lors du chargement des tactiques",
        loadPlacements: "Erreur lors du chargement des placements",
        missingHierarchyContext: "Contexte hiérarchique manquant pour construire les chemins source",
        noItemsInContext: "Aucun élément trouvé dans le contexte - impossible de construire les chemins source",
        unknownError: "Erreur inconnue"
      }
    },
    useTactiquesModals: {
      errors: {
        missingContextForModals: "Contexte manquant pour l'opération sur les modals",
        errorSavingSection: "Erreur lors de la sauvegarde de la section",
        errorDeletingSection: "Erreur lors de la suppression de la section",
        missingContextForTabCreation: "Contexte manquant pour la création d'onglet",
        errorCreatingTab: "Erreur lors de la création de l'onglet",
        missingContextForTabRename: "Contexte manquant pour le renommage d'onglet",
        errorRenamingTab: "Erreur lors du renommage de l'onglet",
        missingContextForTabDeletion: "Contexte manquant pour la suppression d'onglet",
        errorDeletingTab: "Erreur lors de la suppression de l'onglet"
      },
      loading: {
        savingSection: "Sauvegarde section",
        deletingSection: "Suppression section",
        creatingTab: "Création onglet",
        renamingTab: "Renommage onglet",
        deletingTab: "Suppression onglet"
      },
      confirmations: {
        deleteSection: "Êtes-vous sûr de vouloir supprimer la section \"{{sectionName}}\" et toutes ses tactiques ?",
        deleteTab: "Êtes-vous sûr de vouloir supprimer l'onglet \"{{tabName}}\" et toutes ses données ?"
      },
      prompts: {
        newTabName: "Nom du nouvel onglet:",
        newTabNameForRename: "Nouveau nom pour l'onglet:"
      },
      alerts: {
        tabNameExists: "Un onglet avec le nom \"{{tabName}}\" existe déjà. Veuillez choisir un nom différent.",
        cannotDeleteLastTab: "Impossible de supprimer le dernier onglet"
      }
    },
    useTactiquesCrud: {
      errors: {
        missingBaseContext: "Contexte de base manquant pour les opérations d'ordre",
        missingContextCreateSection: "Contexte manquant pour créer une section",
        missingContextUpdateSection: "Contexte manquant pour modifier une section",
        missingContextDeleteSection: "Contexte manquant pour supprimer une section",
        missingContextCreateTactic: "Contexte manquant pour créer une tactique",
        missingContextUpdateTactic: "Contexte manquant pour modifier une tactique",
        missingContextDeleteTactic: "Contexte manquant pour supprimer une tactique",
        missingContextCreatePlacement: "Contexte manquant pour créer un placement",
        parentSectionNotFoundForTactic: "Section parent non trouvée pour la tactique",
        missingContextUpdatePlacement: "Contexte manquant pour modifier un placement",
        parentHierarchyNotFoundForPlacement: "Hiérarchie parent non trouvée pour le placement",
        missingContextDeletePlacement: "Contexte manquant pour supprimer un placement",
        missingContextCreateCreative: "Contexte manquant pour créer un créatif",
        parentHierarchyNotFoundForCreative: "Hiérarchie parent non trouvée pour le créatif",
        missingContextUpdateCreative: "Contexte manquant pour modifier un créatif",
        fullParentHierarchyNotFoundForCreative: "Hiérarchie parent (section, tactique, placement) non trouvée pour le créatif",
        missingContextDeleteCreative: "Contexte manquant pour supprimer un créatif",
        missingContextCreateTab: "Contexte manquant pour créer un onglet",
        missingContextRenameTab: "Contexte manquant pour renommer un onglet",
        missingContextDeleteTab: "Contexte manquant pour supprimer un onglet"
      },
      defaults: {
        newSection: "Nouvelle section",
        newTactic: "Nouvelle tactique",
        newPlacement: "Nouveau placement",
        newCreative: "Nouveau créatif",
        newTab: "Nouvel onglet"
      },
      prompts: {
        newTabName: "Nouveau nom de l'onglet:"
      }
    },
    tactiquesOperations: {
      errors: {
        incompleteContextForOperation: "Contexte incomplet pour l'opération",
        parentNotFoundForPlacement: "Section ou tactique parente non trouvée pour le placement",
        parentContextNotFoundForPlacement: "Contexte parent non trouvé pour le placement",
        parentContextNotFoundForCreative: "Contexte parent non trouvé pour le créatif",
        parentPlacementNotFoundForCreative: "Placement parent non trouvé pour le créatif",
        parentTacticNotFoundForCreativePlacement: "Tactique parent non trouvée pour le placement du créatif",
        parentSectionNotFoundForCreative: "Section parente non trouvée pour le créatif",
        incompleteContext: "Contexte incomplet"
      },
      defaults: {
        newTacticLabel: "Nouvelle tactique",
        newPlacementLabel: "Nouveau placement",
        newCreativeLabel: "Nouveau créatif"
      }
    },
    tactiquesRefresh: {
      notifications: {
        refreshError: "❌ Erreur lors de l'actualisation"
      }
    },
    useTactiquesSelection: {
      notifications: {
        deleteFunctionsNotConfigured: "Fonctions de suppression non configurées",
        errorDeleteCreative: "Erreur suppression créatif",
        errorDeletePlacement: "Erreur suppression placement",
        errorDeleteTactic: "Erreur suppression tactique",
        errorDeleteSection: "Erreur suppression section",
        deleteSuccessSingular: "élément supprimé avec succès",
        deleteSuccessPlural: "éléments supprimés avec succès",
        deleteErrorSingular: "erreur lors de la suppression",
        deleteErrorPlural: "erreurs lors de la suppression",
        criticalDeleteError: "❌ Erreur critique lors de la suppression",
        missingContextDuplication: "❌ Contexte manquant pour la duplication",
        duplicateSuccessSingular: "élément dupliqué avec succès",
        duplicateSuccessPlural: "éléments dupliqués avec succès",
        unknownDuplicationError: "Erreur inconnue lors de la duplication",
        duplicationError: "❌ Erreur duplication:",
        criticalDuplicationError: "❌ Erreur critique lors de la duplication"
      },
      deleteConfirm: {
        areYouSure: "Êtes-vous sûr de vouloir supprimer les",
        selectedItems: "éléments sélectionnés ?",
        irreversibleWarning: "⚠️ Cette action est irréversible et supprimera également tous les éléments enfants."
      }
    },
    useTaxonomyForm: {
      errors: {
        loadTaxonomies: "Erreur lors du chargement des taxonomies."
      }
    },
    updateTaxonomies: {
      updateFailed: "La mise à jour des taxonomies a échoué."
    },
    useUpdateTaxonomiesAfterMove: {
      errors: {
        fetchShortcode: "❌ Erreur récupération shortcode",
        fetchCustomCode: "❌ Erreur récupération custom code",
        missingClientId: "❌ ClientId manquant",
        missingCampaignId: "❌ CampaignId manquant",
        campaignNotFound: "❌ Campagne non trouvée",
        emptyCampaignData: "❌ Données campagne vides",
        placementError: "❌ Erreur placement",
        creativeError: "❌ Erreur créatif",
        generalError: "❌ [UpdateTaxonomiesAfterMove] Erreur:",
        regenerationFailed: "La régénération des taxonomies après déplacement a échoué."
      },
      warnings: {
        unknownSource: "Source inconnue pour variable"
      }
    },
    duplicateTemplate: {
      unauthenticatedUser: "Utilisateur non authentifié",
      tokenNotRetrieved: "Token d'accès non récupéré depuis Firebase Auth",
      insufficientPermissions: "Permissions insuffisantes pour dupliquer le fichier. Vérifiez que le template est bien partagé avec votre compte Google.",
      templateNotFound: "Template non trouvé. Vérifiez l'URL du template.",
      driveApiError: "Erreur API Drive:",
      invalidTemplateUrl: "URL de template invalide. Impossible d'extraire l'ID du fichier.",
      accessTokenError: "Impossible d'obtenir le token d'accès Google Drive",
      unknownError: "Erreur inconnue lors de la duplication"
    },
    useGenerateDoc: {
      auth: {
        notAuthenticated: "Utilisateur non authentifié",
        tokenNotRetrieved: "Token d'accès non récupéré"
      },
      error: {
        invalidSheetUrl: "URL Google Sheet invalide",
        tokenNotObtained: "Impossible d'obtenir le token d'accès",
        httpError: "Erreur HTTP",
        insufficientPermissions: "Permissions insuffisantes. Vérifiez l'accès au Google Sheet.",
        sheetOrTabNotFound: "Google Sheet ou onglet non trouvé.",
        apiError: "Erreur API:",
        unknownError: "Erreur inconnue"
      }
    },
    unlinkDoc: {
      error: {
        notAuthenticated: "Utilisateur non authentifié",
        tokenNotRetrieved: "Token d'accès non récupéré depuis Firebase Auth",
        googleAuth: "Erreur lors de l'authentification Google:",
        insufficientPermissions: "Permissions insuffisantes pour dupliquer le fichier.",
        documentNotFound: "Document non trouvé. Vérifiez l'URL du document.",
        driveApi: "Erreur API Drive:",
        fetchSheets: "Erreur lors de la récupération des feuilles:",
        deleteSheets: "Erreur lors de la suppression des feuilles:",
        convertFormulas: "Erreur lors de la conversion des formules:",
        invalidUrl: "URL de document invalide. Impossible d'extraire l'ID du fichier.",
        tokenAccessFailed: "Impossible d'obtenir le token d'accès Google",
        unknown: "Erreur inconnue lors de la dissociation",
        unlinkProcess: "Erreur dissociation document:"
      },
      common: {
        user: "Utilisateur"
      }
    },
    useCombinedDocExport: {
      error: {
        popupBlocked: "🚫 Les pop-ups sont bloquées par votre navigateur.",
        unauthorizedDomain: "Domaine non autorisé pour l'authentification Google. Contactez l'administrateur.",
        operationNotAllowed: "Connexion Google désactivée. Contactez l'administrateur.",
        networkRequestFailed: "Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.",
        sessionExpired: "Session expirée. Veuillez vous reconnecter et réessayer.",
        googleAuthGenericStart: "Erreur d'authentification Google :",
        googleAuthGenericEnd: "Veuillez réessayer ou contacter le support.",
        unauthenticated: "Utilisateur non authentifié",
        accessTokenNotRetrieved: "Token d'accès non récupéré",
        accessTokenWriteFailed: "Impossible d'obtenir le token d'accès pour l'écriture.",
        insufficientPermissions: "Permissions insuffisantes. Vérifiez l'accès au Google Sheet.",
        sheetOrTabNotFoundStart: "Google Sheet ou onglet",
        sheetOrTabNotFoundEnd: "non trouvé.",
        apiError: "Erreur API Sheets :",
        accessTokenClearFailed: "Impossible d'obtenir le token d'accès pour le nettoyage.",
        insufficientClearPermissions: "Permissions insuffisantes pour vider le Google Sheet.",
        sheetOrTabNotFoundCleaningEnd: "non trouvé lors du nettoyage.",
        apiClearError: "Erreur API Sheets lors du nettoyage :",
        tabSyncFailed: "Échec de la synchronisation des onglets",
        tabSyncError: "Erreur durant la synchronisation des onglets",
        unauthenticatedConnect: "Utilisateur non authentifié. Veuillez vous connecter.",
        invalidSheetUrl: "URL Google Sheet invalide.",
        missingDataAfterExtraction: "Données manquantes après extraction.",
        campaignShortcodeConversion: "Erreur lors de la conversion des shortcodes de campagne.",
        hierarchyShortcodeConversion: "Erreur lors de la conversion des shortcodes de hiérarchie.",
        multipleWritesFailed: "Une ou plusieurs écritures dans Google Sheets ont échoué.",
        unknownExportError: "Erreur inconnue lors de l'exportation combinée."
      }
    },
    useCreateDocument: {
      progress: {
        validationStep: "Validation",
        validatingData: "Validation des données...",
        fetchingTemplateInfo: "Récupération des informations du template...",
        fetchingCampaignInfo: "Récupération des informations de la campagne...",
        fetchingVersionInfo: "Récupération des informations de la version...",
        fetchingClientInfo: "Récupération des informations du client...",
        tabsStep: "Onglets",
        duplicatingTabs: "Duplication des onglets selon la structure de campagne...",
        injectionStep: "Injection",
        extractingCampaignData: "Extraction des données de la campagne...",
        duplicationStep: "Duplication",
        duplicatingTemplate: "Duplication du template",
        savingStep: "Sauvegarde",
        creatingDatabaseEntry: "Création de l'entrée dans la base de données...",
        injectingData: "Injection des données dans le document...",
        finishedStep: "Terminé",
        documentCreatedSuccessfully: "Document créé avec succès !"
      },
      error: {
        documentNameExistsStart: "Un document avec le nom ",
        documentNameExistsEnd: " existe déjà pour cette version.",
        templateNotFound: "Template non trouvé.",
        campaignNotFound: "Campagne non trouvée.",
        versionNotFound: "Version non trouvée.",
        cannotExtractSheetId: "Impossible d'extraire l'ID du Google Sheet pour la duplication des onglets",
        tabsDuplicationFailed: "Échec de la duplication des onglets",
        tabsDuplicationError: "Erreur durant la duplication des onglets",
        dataInjectionError: "Erreur lors de l'injection des données",
        unknownInjectionError: "Erreur inconnue lors de l'injection",
        userNotAuthenticated: "Utilisateur non authentifié",
        templateDuplicationFailed: "Échec de la duplication du template",
        unknownCreationError: "Erreur inconnue lors de la création du document"
      }
    },
    editUserModal: {
      title: "Modifier le rôle utilisateur",
      form: {
        newRoleLabel: "Nouveau rôle",
        loadingRoles: "Chargement des rôles...",
        noRolesAvailable: "Aucun rôle disponible. Veuillez créer des rôles d'abord.",
        selectRolePlaceholder: "Sélectionnez un rôle",
        currentRole: "Rôle actuel",
        noRole: "Aucun rôle"
      },
      permissions: {
        titlePrefix: "Permissions du rôle"
      },
      buttons: {
        saving: "Sauvegarde...",
        updateRole: "Modifier le rôle"
      },
      errors: {
        updateFailed: "Erreur lors de la mise à jour du rôle"
      }
    },
    invitationModal: {
      title: "Inviter un utilisateur",
      form: {
        emailLabel: "Adresse email *",
        emailPlaceholder: "utilisateur@exemple.com",
        emailHelpText: "L'utilisateur recevra un accès lors de sa première connexion",
        roleLabel: "Rôle *",
        loadingRoles: "Chargement des rôles...",
        noRolesAvailable: "Aucun rôle disponible. Veuillez créer des rôles d'abord.",
        selectRolePlaceholder: "Sélectionnez un rôle",
        roleHelpText: "Ce rôle déterminera les permissions de l'utilisateur"
      },
      info: {
        expiration: "💡 L'invitation expirera automatiquement dans 7 jours si l'utilisateur ne se connecte pas."
      },
      buttons: {
        sending: "Envoi...",
        send: "Envoyer l'invitation"
      },
      alerts: {
        emailRequired: "L'adresse email est requise",
        roleRequired: "Le rôle est requis",
        invalidEmail: "Veuillez entrer une adresse email valide",
        sendError: "Erreur lors de l'envoi de l'invitation"
      }
    },
    permissionsTab: {
      title: "Gestion des permissions",
      newRole: "Nouveau Rôle",
      table: {
        role: "Rôle",
        actions: "Actions"
      },
      permissions: {
        access: "Accès",
        clientInfo: "Infos Client",
        costGuide: "Guide de Coût",
        currency: "Devises",
        customCodes: "Codes Personnalisés",
        dimensions: "Dimensions",
        fees: "Frais",
        lists: "Listes",
        taxonomy: "Taxonomie",
        templates: "Gabarits"
      },
      actions: {
        editRole: "Modifier le rôle",
        deleteRole: "Supprimer le rôle"
      },
      notifications: {
        confirmDelete: "Êtes-vous sûr de vouloir supprimer le rôle \"{{roleName}}\" ?",
        deleteError: "Erreur lors de la suppression du rôle"
      },
      emptyState: {
        noRoles: "Aucun rôle configuré",
        createFirstRole: "Créer votre premier rôle"
      }
    },
    roleFormModal: {
      title: {
        edit: "Modifier le rôle",
        new: "Nouveau rôle"
      },
      labels: {
        roleName: "Nom du rôle *",
        permissions: "Permissions"
      },
      placeholders: {
        roleName: "Entrez le nom du rôle"
      },
      permissions: {
        access: "Accès",
        clientInfo: "Informations Client",
        costGuide: "Guide de Coût",
        currency: "Devises",
        customCodes: "Codes Personnalisés",
        dimensions: "Dimensions",
        fees: "Frais",
        lists: "Listes",
        taxonomy: "Taxonomie",
        templates: "Gabarits"
      },
      buttons: {
        saving: "Sauvegarde..."
      },
      alerts: {
        nameRequired: "Le nom du rôle est requis",
        saveError: "Erreur lors de la sauvegarde du rôle"
      }
    },
    usersTab: {
      errors: {
        cannotEditInvitation: "Impossible de modifier le rôle d'une invitation. L'utilisateur doit d'abord se connecter.",
        userNotConnected: "Utilisateur non connecté",
        userDeletionFailed: "Erreur lors de la suppression de l'utilisateur"
      },
      confirm: {
        deactivateUser: "Êtes-vous sûr de vouloir désactiver l'utilisateur",
        deleteInvitation: "Êtes-vous sûr de vouloir supprimer l'invitation pour"
      },
      status: {
        active: "Actif",
        invited: "Invité",
        expired: "Expiré"
      },
      header: {
        title: "Gestion des utilisateurs",
        subtitle: "Inviter de nouveaux utilisateurs et gérer les accès à l'application"
      },
      buttons: {
        inviteUser: "Inviter utilisateur",
        clearSearch: "Effacer la recherche",
        inviteAUser: "Inviter un utilisateur"
      },
      stats: {
        activeUsers: "Utilisateurs actifs",
        pendingInvitations: "Invitations en attente",
        expiredInvitations: "Invitations expirées",
        total: "Total"
      },
      search: {
        placeholder: "Rechercher par nom, email ou rôle...",
        resultsFound: "résultat(s) trouvé(s) pour"
      },
      table: {
        header: {
          user: "Utilisateur",
          status: "Statut",
          role: "Rôle",
          invitedOn: "Invité le",
          acceptedOn: "Accepté le",
          invitedBy: "Invité par",
          actions: "Actions"
        }
      },
      actions: {
        editRole: "Modifier le rôle",
        resendInvitation: "Renvoyer l'invitation",
        deactivateUser: "Désactiver l'utilisateur",
        deleteInvitation: "Supprimer l'invitation"
      },
      noResults: {
        title: "Aucun résultat",
        description: "Aucun utilisateur ne correspond à votre recherche"
      },
      emptyState: {
        title: "Aucun utilisateur",
        description: "Commencez par inviter votre premier utilisateur."
      },
      invitationInfo: {
        title: "À propos des invitations",
        description: "Les utilisateurs invités recevront un accès automatiquement lors de leur première connexion avec Google. Les invitations expirent après 7 jours et peuvent être renvoyées si nécessaire."
      }
    },
    table: {
      // Recherche et navigation
      search: {
        sections: "Rechercher dans les sections...",
        tactiques: "Rechercher dans les tactiques...",
        placements: "Rechercher dans les placements...",
        creatifs: "Rechercher dans les créatifs..."
      },
      
      // Barre d'outils
      toolbar: {
        hideLevels: "Masquer les niveaux inférieurs",
        clearSort: "Effacer tri"
      },
      
      // Niveaux/entités
      levels: {
        sections: "sections",
        tactiques: "tactiques", 
        placements: "placements",
        creatifs: "créatifs"
      },
      
      // Onglets de sous-catégories
      tabs: {
        tactique: {
          info: "Info",
          strategie: "Stratégie", 
          budget: "Budget",
          admin: "Admin"
        },
        placement: {
          info: "Info",
          taxonomie: "Taxonomie"
        },
        creatif: {
          info: "Info",
          taxonomie: "Taxonomie",
          specs: "Specs"
        }
      },
      
      // Aide contextuelle
      help: {
        selection: {
          title: "Sélection",
          description: "1 clic = sélectionner • Shift+Clic = sélection multiple"
        },
        editing: {
          title: "Édition", 
          description: "Double-clic pour éditer • Enter/Tab = sauver • Esc = annuler"
        },
        copy: {
          title: "Copie",
          description: "Ctrl+C pour copier • Ctrl+V pour coller"
        },
        budget: {
          title: "Budget",
          description: "Les calculs utilisent la même logique que le drawer"
        },
        columns: {
          title: "Colonnes dynamiques",
          description: "Les colonnes changent selon les taxonomies sélectionnées"
        }
      },
      
      // Pied de page
      footer: {
        rows: "lignes"
      },
      
      // Sélection
      selection: {
        cellsSelected: "cellules sélectionnées"
      },
      
      // Validation
      validation: {
        errors: "erreurs de validation",
        invalidValue: "Valeur invalide",
        invalidValueFor: "Valeur invalide pour {{field}}",
        noMatchingOption: "\"{{value}}\" ne correspond à aucune option disponible",
        invalidNumber: "\"{{value}}\" n'est pas un nombre valide",
        negativeNotAllowed: "Les nombres négatifs ne sont pas autorisés",
        invalidDate: "\"{{value}}\" n'est pas une date valide"
      },
      
      // Messages généraux
      noResults: "Aucun résultat trouvé",
      noData: "Aucune donnée à afficher",
      
      // Cellules
      cell: {
        doubleClickToEdit: "Double-clic pour modifier",
        doubleClickToEditField: "Double-cliquer pour modifier {{field}}",
        clickToEnter: "Cliquer pour saisir",
        clickToEditField: "Cliquer pour modifier {{field}}",
        enterValue: "Saisir {{field}}"
      },
      
      // Actions
      actions: {
        cancel: "Annuler",
        save: "Sauvegarder", 
        saving: "Sauvegarde...",
        copied: "Copié",
        confirmCancelChanges: "Êtes-vous sûr de vouloir annuler toutes les modifications ?"
      },
      
      // Changements en attente
      changes: {
        pending: "modifications en attente"
      },
      
      // Chargement
      loading: {
        startAdvancedTable: "Début chargement données pour TactiquesAdvancedTableView (version refactorisée)",
        clientFeesLoaded: "Frais client chargés: {{count}} frais",
        clientFeesError: "Erreur chargement frais client:",
        exchangeRatesLoaded: "Taux de change chargés: {{count}} taux", 
        exchangeRatesError: "Erreur chargement taux de change:",
        currencyLoaded: "Devise campagne chargée: {{currency}}",
        currencyError: "Erreur chargement devise campagne:",
        fieldError: "Erreur chargement {{field}}",
        bucketsError: "Erreur lors du chargement des buckets:",
        completedAdvancedTable: "Chargement terminé pour TactiquesAdvancedTableView (version refactorisée)",
        generalError: "Erreur lors du chargement des données",
        loadingData: "Chargement des données..."
      },
      
      // Budget
      budget: {
        mediaBudget: "Budget média",
        clientBudget: "Budget client",
        validatingTactic: "Validation budget pour tactique {{id}}",
        validationFailed: "Validation budget échouée pour {{id}}",
        validationSuccess: "Validation budget réussie pour {{id}}",
        updateError: "Erreur lors de la mise à jour de la tactique avec budget",
        feeNotFound: "Frais #{{number}} introuvable",
        noOption: "Aucune option",
        disable: "Désactiver",
        enable: "Activer", 
        selectOption: "Sélectionner une option",
        enableToSelect: "Activer le frais pour sélectionner",
        optionPlaceholder: "-- Option --",
        customValue: "Valeur personnalisée",
        fixedValue: "Valeur fixe",
        autoCalculatedAmount: "Montant calculé automatiquement",
        autoCalculated: "Calculé automatiquement",
        feeColumnsCreated: "colonnes de frais créées",
        standardCalculation: "Calcul standard",
        converged: "Calcul convergé",
        approximation: "Approximation (écart: {{error}}$)",
        notConverged: "Non convergé (écart: {{error}}$)"
      },
      
      // Taxonomie
      taxonomy: {
        placementUpdateError: "Erreur lors de la mise à jour du placement avec taxonomies",
        triggeringUpdates: "Déclenchement des mises à jour taxonomiques pour {{count}} entité(s)",
        updatesCompleted: "Mises à jour taxonomiques terminées"
      },
      
      // Sauvegarde
      save: {
        errorWithBudget: "Erreur lors de la sauvegarde avec budget",
        generalError: "Erreur lors de la sauvegarde:"
      },
      
      // Colonnes
      columns: {
        structure: "Structure",
        label: "Étiquette",
        bucket: "Enveloppe",
        mpa: "MPA",
        startDate: "Date de début",
        endDate: "Date de fin",
        placementName: "Nom du placement",
        creativeName: "Nom du créatif",
        taxonomyTags: "Taxonomie pour les tags",
        taxonomyPlatform: "Taxonomie pour la plateforme", 
        taxonomyMediaOcean: "Taxonomie pour MediaOcean",
        product: "Produit",
        location: "Emplacement",
        demographics: "Démographie",
        device: "Appareil",
        targeting: "Ciblage",
        specName: "Nom de la spec",
        format: "Format",
        ratio: "Ratio",
        fileType: "Type de fichier",
        maxWeight: "Poids max",
        weight: "Poids",
        animation: "Animation",
        title: "Titre",
        text: "Texte",
        specSheetLink: "Lien spec sheet",
        notes: "Notes",
        sectionName: "Nom de la section",
        lob: "Ligne d'affaire",
        mediaType: "Type média",
        partner: "Partenaire",
        inventory: "Inventaire", 
        marketDescription: "Description du marché",
        audienceDescription: "Description de l'audience",
        productDescription: "Description du produit",
        formatDescription: "Description du format",
        locationDescription: "Description de l'emplacement",
        frequency: "Fréquence",
        market: "Marché",
        language: "Langue",
        buyingMethod: "Méthode d'achat",
        customDim1: "Dimension personnalisée 1",
        customDim2: "Dimension personnalisée 2", 
        customDim3: "Dimension personnalisée 3",
        suggestedCreatives: "Nombre de créatifs suggérés",
        assetDeliveryDate: "Date de livraison des créatifs",
        inputMode: "Mode de saisie",
        inputBudget: "Budget saisi",
        currency: "Devise",
        buyCurrency: "Devise d'achat",
        unitType: "Type d'unité",
        costPerUnit: "Coût par unité",
        volume: "Volume",
        unitVolume: "Volume d'unité",
        realValue: "Valeur réelle",
        bonus: "Bonification",
        exchangeRate: "Taux de change",
        totalMedia: "Total média",
        totalClient: "Total client",
        billingNumber: "Numéro de facturation",
        po: "PO"
      },
      
      // Couleurs
      colors: {
        red: "Rouge",
        orange: "Orange", 
        yellow: "Jaune",
        green: "Vert",
        blue: "Bleu",
        indigo: "Indigo",
        violet: "Violet",
        pink: "Rose",
        gray: "Gris"
      },
      
      // Statuts
      status: {
        planned: "Planifiée",
        active: "Active",
        completed: "Terminée",
        cancelled: "Annulée"
      },
      
      // Types de média
      mediaType: {
        display: "Display",
        video: "Vidéo",
        social: "Social", 
        search: "Recherche",
        audio: "Audio",
        tv: "Télévision",
        print: "Imprimé",
        ooh: "Affichage extérieur"
      },
      
      // Méthodes d'achat
      buyingMethod: {
        programmatic: "Programmatique",
        direct: "Direct",
        guaranteed: "Garanti",
        auction: "Enchères"
      },
      
      // Langues
      language: {
        french: "Français",
        english: "Anglais",
        spanish: "Espagnol",
        bilingual: "Bilingue"
      },
      
      // Marchés
      market: {
        quebec: "Québec",
        ontario: "Ontario",
        bc: "Colombie-Britannique",
        alberta: "Alberta",
        manitoba: "Manitoba", 
        saskatchewan: "Saskatchewan",
        newBrunswick: "Nouveau-Brunswick",
        novaScotia: "Nouvelle-Écosse",
        pei: "Île-du-Prince-Édouard",
        newfoundland: "Terre-Neuve-et-Labrador",
        nwt: "Territoires du Nord-Ouest",
        nunavut: "Nunavut",
        yukon: "Yukon",
        national: "National"
      },
      
      // Copie/Collage
      copy: {
        empty: "(vide)"
      },
      
      paste: {
        result: "{{applied}} cellule(s) mise(s) à jour, {{errors}} erreur(s) de validation"
      },
      
      // Hiérarchie
      hierarchy: {
        unnamedSection: "Section sans nom",
        unnamedTactic: "Tactique sans nom",
        unnamedPlacement: "Placement sans nom", 
        unnamedCreative: "Créatif sans nom",
        unnamedElement: "Élément sans nom"
      },
      
      // Labels de niveaux
      levelLabels: {
        section: "SEC",
        tactic: "TAC",
        placement: "PLA",
        creative: "CRE",
        unknown: "UNK"
      },
      
      // Sélection
      select: {
        placeholder: "-- Sélectionner --"
      }
    },
    tactiquesPage: {
      header: {
        title: "Tactiques",
        refreshTooltip: "Actualiser les données"
      },
      notifications: {
        duplicationInProgress: "Duplication en cours...",
        deletionInProgress: "Suppression en cours...",
        loadingClientFees: "Chargement des frais du client..."
      },
      error: {
        loadingTitle: "Erreur de chargement",
        retry: "Réessayer"
      },
      loader: {
        loadingTactics: "Chargement des tactiques..."
      },
      actions: {
        newSection: "Nouvelle section"
      },
      selection: {
        selectedSingular: "sélectionné",
        selectedPlural: "sélectionnés"
      },
      emptyState: {
        noSectionsFound: "Aucune section trouvée pour cet onglet. Créez une nouvelle section pour commencer.",
        selectCampaignAndVersion: "Veuillez sélectionner une campagne et une version pour voir les tactiques."
      },
      statistics: {
        placement: "placement",
        creative: "créatif"
      }
    },
    clientTaxonomies: {
      errors: {
        loadFailed: "Erreur lors du chargement des taxonomies.",
        addFailed: "Erreur lors de l'ajout de la taxonomie.",
        updateFailed: "Erreur lors de la mise à jour de la taxonomie.",
        deleteFailed: "Erreur lors de la suppression de la taxonomie.",
        replaceFailed: "Une erreur est survenue lors du remplacement.",
        searchFailed: "Une erreur est survenue lors de la recherche."
      },
      success: {
        added: "Taxonomie ajoutée avec succès.",
        updated: "Taxonomie mise à jour avec succès.",
        deleted: "Taxonomie supprimée avec succès.",
        replacementsMade: "{count} remplacements ont été effectués."
      },
      info: {
        noneFound: "Aucun texte correspondant n'a été trouvé."
      },
      confirm: {
        delete: "Êtes-vous sûr de vouloir supprimer cette taxonomie ?"
      },
      selectClientPrompt: "Veuillez sélectionner un client pour voir ses taxonomies.",
      header: {
        title: "Taxonomies du client"
      },
      buttons: {
        searchAndReplace: "Rechercher & Remplacer",
        add: "Ajouter une taxonomie",
        replace: "Remplacer"
      },
      permissions: {
        cannotModify: "Vous n'avez pas les permissions pour modifier.",
        cannotAdd: "Vous n'avez pas les permissions pour ajouter.",
        cannotDelete: "Vous n'avez pas les permissions pour supprimer.",
        readOnly: "Vous avez un accès en lecture seule aux taxonomies."
      },
      loading: {
        taxonomies: "Chargement des taxonomies..."
      },
      emptyState: {
        noTaxonomies: "Aucune taxonomie n'a été trouvée pour ce client."
      },
      details: {
        standard: "Standard",
        custom: "Personnalisée",
        description: "Description",
        noDescription: "Aucune description fournie.",
        taxonomyLevels: "Structure de la taxonomie",
        level: "Niveau {{level}}",
        title: "Titre",
        name: "Nom"
      },
      form: {
        editTitle: "Modifier la taxonomie",
        addTitle: "Ajouter une nouvelle taxonomie"
      },
      searchModal: {
        title: "Rechercher dans les taxonomies",
        searchLabel: "Texte à rechercher",
        searchPlaceholder: "Entrez le texte à trouver...",
        searching: "Recherche en cours...",
        results: "Résultats de la recherche {{count}}",
        foundIn: "Trouvé dans",
        noResults: "Aucun résultat trouvé pour votre recherche."
      },
      searchReplaceModal: {
        searchLabel: "Rechercher ce texte",
        searchPlaceholder: "Texte à trouver",
        replaceLabel: "Remplacer par ce texte",
        replacePlaceholder: "Texte de remplacement (laisser vide pour supprimer)",
        replacing: "Remplacement en cours..."
      }
    },
    taxonomyForm: {
      generalInfo: {
        title: "Informations générales",
        displayNameLabel: "Nom d'affichage*",
        standardTaxonomyLabel: "Taxonomie standard",
        noStandardTaxonomy: "Aucune (personnalisée)",
        descriptionLabel: "Description",
      },
      help: {
        title: "Fonctions spéciales",
        baseVariables: {
          title: "Variables de base",
          copyButton: "Copier",
          copyCharactersButton: "Copier les caractères",
          description: "Insérez vos variables avec le format souhaité.",
        },
        concatenation: {
          title: "Concatenation",
          description: "Affiche les délimiteurs seulement si les variables ont des valeurs",
          example: 'Exemple : <[CR_CTA]-[CR_Offer]-[PL_Format]> → "ABC-DEF" au lieu de "ABC--DEF"',
        },
        lowercase: {
          title: "Conversion en minuscules",
          description: "Convertit tout le contenu en lettres minuscules.",
          example: "Exemple : ▶FACEBOOK◀ → facebook",
        },
        specialChars: {
          title: "Nettoyage des caractères spéciaux",
          description: "Supprime les caractères spéciaux, convertit les accents (é→e), remplace espaces et _ par des tirets.",
          example: "Exemple : 〔Café & Co_Ltd!〕 → cafe-co-ltd",
        },
        conditionalReplacement: {
          title: "Remplacement conditionnel",
          description: 'Première occurrence : affiche le contenu. Occurrences suivantes : remplace par "&".',
          example: "Exemple : www.taxo?fun.com〈?〉utm_medium... → www.taxo?fun.com&utm_medium...",
        },
      },
      levels: {
        title: "Niveaux de taxonomie",
        level: "Niveau",
        resetToDefaultTooltip: "Réinitialiser à la valeur standard",
        resetButton: "Réinitialiser",
        levelTitleLabel: "Titre",
        structureLabel: "Structure",
        addVariableButton: "Variable",
      },
      variableMenu: {
        filterPlaceholder: "Filtrer les variables...",
        noVariableFound: "Aucune variable trouvée",
        formatFor: "Format pour",
      },
      tooltips: {
        unknownVariable: "Variable inconnue",
        invalidFormat: "Format invalide pour cette variable",
        missingFormat: "Format manquant - utiliser variable:format",
        variableLabel: "Variable",
        formatLabel: "Format",
      },
    },
    



    


  

    },


  en: {
    navigation: {
      version: {
        title: "Version Information",
        current: "Current",
        previous: "Previous",
        upcoming: "Upcoming", 
        whatsNew: "What's new in this version",
        previousVersions: "Previous versions",
        upcomingFeatures: "Upcoming features",
        upcomingDisclaimer: "These features are in development and may change."
      },
      menus: {
        campaigns: "Campaigns",
        strategy: "Strategy",
        tactics: "Tactics",
        documents: "Documents",
        costGuide: "Cost Guide",
        partners: "Partners",
        clientConfig: "Client",
        admin: "Admin",
        help: "Help"
      }
      
    },
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
      searchPlaceholder: "Search by campaign name or ID...",
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
        quarter: "Period",
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
      actions: {
        deleteConfirm: "Are you sure you want to delete the campaign \"{{name}}\" ?\n\nThis action is irreversible and will also delete all associated tactics, versions, and other data.",
        deleteError: "Error deleting the campaign. Please try again.",
        duplicateSuccess: "Campaign duplicated successfully!",
        duplicateError: "Error duplicating the campaign. Please try again.",
        userNotConnected: "User not connected.",
        editTitle: "Edit campaign",
        duplicateTitle: "Duplicate campaign",
        deleteTitle: "Delete campaign"
      },
      drawer: {
        createTitle: "New campaign",
        editTitle: "Edit campaign",
        tabs: {
          info: "Information",
          dates: "Dates",
          budget: "Budget",
          breakdown: "Breakdown",
          admin: "Administration"
        },
        buttons: {
          saving: "Saving..."
        },
        closeSr: "Close",
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
      },
      formAdmin: {
        title: "Administration",
        description: "Administrative and billing information",
        extClientId: "External Client ID",
        extClientIdHelp: "Client identifier in his internal accounting system",
        extClientIdPlaceholder: "Ex: CLI-2024-001",
        poNumber: "PO Number",
        poNumberHelp: "Purchase Order number associated with this campaign",
        poNumberPlaceholder: "Ex: PO-2024-12345",
        billingId: "Billing ID (MCPE)",
        billingIdHelp: "Billing identifier for this campaign in MediaOcean",
        billingIdPlaceholder: "Ex: BILL-2024-789",
        tipTitle: "💡 Tip",
        tipText: "This administrative information is optional but recommended to facilitate tracking and billing of your campaigns. It can be defined at the client level and inherited by tactics."
      },
      formBreakdown: {
        title: "Temporal Breakdown",
        description: "Define how your campaign will be divided over time",
        datesRequiredTitle: "Dates required:",
        datesRequiredText: "Please set the campaign start and end dates in the \"Dates\" tab before configuring breakdowns.",
        loadingError: "Error loading schedules",
        maxBreakdownsError: "Maximum 3 breakdowns allowed",
        datesNotDefinedError: "Campaign dates must be set before creating a breakdown",
        defaultBreakdownModifyError: "The default \"Calendar\" breakdown cannot be modified. Its dates are automatically synchronized with the campaign dates.",
        saveError: "Error while saving",
        deleteError: "Error while deleting",
        deleteConfirm: "Are you sure you want to delete this schedule?",
        defaultDeleteError: "Cannot delete the default schedule",
        atLeastOnePeriodError: "At least one period must be defined",
        addBreakdown: "Add a breakdown",
        defaultBreakdownLabel: "(Default - Synchronized with campaign dates)",
        updatedAutomatically: "Updated automatically",
        periodsCount: " period(s)",
        notEditable: "Not editable",
        defaultBreakdownInfoTitle: "📅 Default Breakdown:",
        defaultBreakdownInfoText: "The \"Calendar\" breakdown is automatically created and synchronized with your campaign dates. It always starts on a Monday and cannot be modified manually.",
        modal: {
          newTitle: "New Breakdown",
          editTitle: "Edit Breakdown",
          nameLabel: "Name *",
          namePlaceholder: "Ex: Sprint 1, Initial Phase...",
          nameHelp: "Descriptive name for this temporal breakdown",
          typeLabel: "Type *",
          typeHelp: "Breakdown type: Weekly (starts Monday), Monthly (starts 1st of the month), or Custom (multiple periods)",
          startDateLabel: "Start Date *",
          startDateHelpWeekly: "Start date of the breakdown (must be a Monday)",
          startDateHelpMonthly: "Start date of the breakdown (must be the 1st of the month)",
          startDateHelpCustom: "Start date of the breakdown",
          endDateLabel: "End Date *",
          endDateHelp: "End date of the breakdown",
          endDateAfterStartError: "End date must be after start date",
          customPeriodsLabel: "Custom Periods *",
          customPeriodsHelp: "Define as many periods as needed (e.g., Q1, Q2, Phase 1, etc.). Only names are required.",
          addPeriod: "Add a period",
          period: "Period ",
          periodNameLabel: "Period Name *",
          periodNamePlaceholder: "Ex: Q1, Phase 1, Sprint 1...",
          saving: "Saving..."
        }
      },
      formBudget: {
        title: "Budget and Costs",
        description: "Define the main budget and additional fees",
        mainBudgetLabel: "Main Budget *",
        mainBudgetHelp: "Main budget allocated to this campaign (including all fees)",
        currencyLabel: "Currency",
        currencyHelp: "Currency used for this campaign",
        customFeesTitle: "Custom Fees",
        customFeesDescription: "Add additional fees specific to your campaign",
        customFeeHelp: "Custom additional fee",
        summaryTitle: "Budget Summary",
        summaryMainBudget: "Main budget:",
        summaryCustomFees: "Total custom fees:",
        summaryMediaBudget: "Available media budget:",
        negativeBudgetWarning: "The total of custom fees cannot exceed the main budget. Please adjust your fees.",
      },
      formDates: {
        title: "Temporal Planning",
        description: "Define the execution period of your campaign",
        startDateLabel: "Start Date *",
        startDateHelp: "Official launch date of the campaign",
        endDateLabel: "End Date *",
        endDateHelp: "Planned end date of the campaign",
        validationError: "End date must be after start date",
        sprintPeriodLabel: "Sprint Period (automatic)",
        sprintPeriodHelp: "This field is automatically generated from the start and end dates.",
        sprintPeriodGenerated: "Generated with dates",
        campaignDuration: "Campaign duration:",
        days: "days"
      },
      formInfo: {
        title: "General Information",
        description: "Basic campaign configuration",
        nameLabel: "Campaign Name *",
        nameHelp: "Main display name of the campaign.",
        namePlaceholder: "Ex: Summer Launch",
        identifierLabel: "Campaign Identifier *",
        identifierHelp: "Unique identifier used in taxonomies.",
        identifierPlaceholder: "Ex: campagne-black-friday",
        creativeFolderLabel: "Creative Folder",
        creativeFolderHelp: "Link to the folder containing the creatives for this campaign",
        creativeFolderPlaceholder: "Link to creative folder",
        divisionLabel: "Division",
        divisionHelp: "Division or business unit",
        divisionPlaceholder: "Select a division",
        quarterLabel: "Quarter *",
        quarterHelp: "Fiscal period of the campaign",
        quarterPlaceholder: "Select a quarter",
        yearLabel: "Year *",
        yearHelp: "Fiscal year of the campaign",
        yearPlaceholder: "Select a year",
        customDimHelp: "Dimension: {{name}}",
        customDimSelectPlaceholder: "Select {{name}}",
        customDimInputPlaceholder: "Enter {{name}}"
      },
      versions: {
        title: "Versions",
        newVersion: "New version",
        loading: "Loading versions...",
        createError: "Error creating the version. Please try again.",
        officialError: "Error setting the official version. Please try again.",
        deleteError: "Error deleting the version. Please try again.",
        deleteConfirmMessage: "Are you sure you want to delete the version \"{{name}}\"?\n\n⚠️ WARNING: This action is irreversible and will delete:\n• All tactics in this version\n• All associated creatives\n• All associated placements\n• All other data related to this version\n\nDo you really want to continue?",
        deleteOfficialError: "Cannot delete the official version.",
        deleteSuccess: "Version deleted successfully.",
        official: "Official",
        createdBy: "Created by {{user}} on {{date}}",
        isOfficialTitle: "Official version",
        setOfficialTitle: "Set as official version",
        deleteVersionTitle: "Delete this version",
        namePlaceholder: "Version name",
        noVersions: "No versions created for this campaign."
      }
    },
    tactics: {
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
      info: "Information",
      logout: "Logout",
      on:"of",
      all:"All",
      clearFilters:"Clear filters",
      formatted: "Formatted:",
      tab:"Tabs"

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
      unsavedChanges: "You have unsaved changes. Are you sure you want to close?",
      operationSuccess: "Operation successful",
      operationFailed: "Operation failed"
    },
    strategy: {
      title: "Strategy",
      newBucket: "New Bucket",
      description: "Budget buckets are a tool for planning teams to use MediaBox for very high-level planning. You can create as many buckets as you want and assign a portion of the campaign budget to them. The \"Assigned in MediaBox\" amount automatically reflects the total budget (including fees) of the tactics assigned to each bucket.",
      loadingError: "Error loading buckets.",
      unnamedBucket: "Unnamed Bucket",
      newBucketName: "New Bucket",
      newBucketDescription: "Bucket description",
      campaign: "Campaign:",
      version: "Version:",
      calculatingAssignedBudgets: "📊 Calculating assigned budgets...",
      creationError: "Error creating the bucket.",
      deleteError: "Error deleting the bucket.",
      updateError: "Error updating the bucket.",
      totalBudget: "Total budget:",
      allocatedBudget: "Allocated budget:",
      remainingBudget: "Remaining budget:",
      selectCampaignAndVersion: "Please select a campaign and a version to see the budget buckets.",
      selectVersion: "Please select a version to see the budget buckets.",
      noBuckets: "No budget buckets have been created for this version.",
      createBucket: "Create a bucket",
      noDescription: "No description",
      descriptionPlaceholder : "Bucket description",
    },
    budgetBucket: {
      changeColor: "Change color",
      plannedBudget: "Planned budget",
      percentageOfBudget: "% of budget",
      assignedInMediaBox: "Assigned in MediaBox",
      morePublishers: "+{count}"
    },
    cache: {
      refreshCache: "Refresh shortcodes",
      refreshing: "Refreshing...",
      refreshSuccess: "Shortcodes Refreshed",
      refreshError: "Refresh Error",
      refreshCacheTooltip: "Force refresh the data cache (shortcodes and lists)",
      refreshSuccessMessage: "Cache has been successfully refreshed",
      refreshErrorMessage: "Error while refreshing the cache"
    },
    documents: {
      title: "Documents",
      newDocument: "New document",
      newDocumentDisabled: "Select a client to create a document",
      noClientSelected: "No client selected",
      noClientMessage: "Please select a client from the navigation bar to manage their documents.",
      loadingDocuments: "Loading documents...",
      selectCampaign: "Select a campaign",
      selectCampaignMessage: "Choose a campaign and version to see associated documents.",
      selectVersion: "Select a version",
      selectVersionMessage: "Choose a version to see associated documents.",
      noDocuments: "No documents",
      noDocumentsMessage: "This version does not contain any documents yet.",
      createFirstDocument: "Create first document",
      documentCountPlural: "documents",
      documentCount: "document",
      unlinked: "Unlinked",
      syncInfo: "Sync: {{date}}{{status}}",
      syncFailed: "failed",
      errorLabel: "Error",
      status: {
        completed: "Completed",
        error: "Error",
        creating: "Creating...",
        unknown: "Unknown"
      },
      actions: {
        open: "Open",
        refreshTooltip: "Refresh document data",
        unlinkTooltip: "Unlink document (create static copy)",
        deleteTooltip: "Delete document and Google Drive file",
        deleteConfirm: "Are you sure you want to delete the document \"{{name}}\"?\n\nThis action will delete:\n- The database entry\n- The associated Google Drive file\n\nThis action is irreversible."
      },
      errors: {
        loadCampaigns: "Unable to load campaigns.",
        loadVersions: "Unable to load versions.",
        loadDocuments: "Unable to load documents.",
        missingContext: "Missing context information for unlinking.",
        unlinkUnknown: "Unknown error during unlinking",
        missingContextDelete: "Missing context information for deletion.",
        deleteUnknown: "Unknown error during deletion",
        deleteError: "Error during deletion: {{message}}",
        missingContextRefresh: "Missing context information for refresh.",
        onlyCompletedRefresh: "Only completed documents can be refreshed.",
        refreshFailed: "Data refresh failed",
        refreshUnknown: "Unknown error during refresh",
        refreshError: "Error during refresh: {{message}}"
      },
      common: {
        invalidDate: "Invalid date",
        unknownTemplate: "Unknown template",
        unknownUser: "User"
      }
    },
    createDocument: {
      title: "Create new document",
      unknownCampaign: "Unknown campaign",
      unknownVersion: "Unknown version",
      loadingError: "Loading error",
      campaignLabel: "Campaign",
      versionLabel: "Version",
      changeSelectionNote: "To change, return to the main page.",
      success: {
        title: "Document created successfully!",
        message: "The document \"{{name}}\" is now available.",
        openDocument: "Open document →"
      },
      missingSelection: {
        title: "Missing selection",
        message: "Please select a campaign and version from the main page before creating a document."
      },
      form: {
        nameLabel: "Document name *",
        namePlaceholder: "Ex: Media Plan Q1 2024",
        templateLabel: "Template *",
        templatePlaceholder: "Select a template",
        templateHelp: "Shortcodes will be converted according to the selected template language.",
        creating: "Creating...",
        createButton: "Create document"
      },
      validation: {
        nameRequired: "Please enter a name for the document.",
        templateRequired: "Please select a template.",
        noCampaign: "No campaign selected. Please select a campaign from the main page.",
        noVersion: "No version selected. Please select a version from the main page."
      },
      errors: {
        loadTemplates: "Unable to load client templates."
      }
    },
    unlinkDocument: {
      title: "Unlink document",
      defaultSuffix: "Unlinked",
      warning: {
        title: "Warning!",
        copyWithoutFormulas: "A copy will be created without any dynamic formulas",
        noAutomaticTotals: "Totals will no longer be calculated automatically",
        noLongerLinked: "The document will no longer be linked to MediaBox",
        cannotRefresh: "It will no longer be possible to refresh the document"
      },
      form: {
        nameLabel: "New document name:",
        namePlaceholder: "Unlinked document name",
        unlinking: "Unlinking...",
        unlinkButton: "Unlink"
      },
      errors: {
        generic: "Error during unlinking",
        unknown: "Unknown error"
      }
    },
    clientDropdown: {
      searchPlaceholder: "Search a client...",
      noClientAvailable: "No available client",
      noClientFound:"No client found",
      selectClient: "Select a client",
    },
    campaignSelector : {
      selectCampaign: "Select a campaign", 
      noCampaign: "No campaign", 
      searchCampaign : "Search campaign...",
      noCampaignFound: "No campaign found for",
      selectCampaignFirst : "Please select a campaign first",
      noVersion: "No version",
      selectVersion : "Select a version",
    },
    costGuideForm: {
      errors: {
        level1Required: "Level 1 information is required",
        level2Required: "Level 2 information is required",
        level3Required: "Level 3 information is required",
        level4Required: "Level 4 information is required",
        unitPriceRequired: "Unit amount is required",
        unitPriceInvalid: "The amount must be a number",
      },
      submissionError: "Error submitting the form:",
      successMessage: "Entry saved successfully!",
      editEntry: "Edit Entry",
      addEntry: "Add Entry",
      level1Label: "Level 1",
      level2Label: "Level 2",
      level3Label: "Level 3",
      level4Label: "Level 4",
      purchaseUnitLabel: "Purchase Unit",
      unitOption: "Unit",
      unitPriceLabel: "Unit cost",
      commentLabel: "Comment",
      commentPlaceholder: "Additional information...",
      cancelButton: "Cancel",
      savingButton: "Saving...",
      updateButton: "Update",
      addButton: "Add",
    },
    costGuideList: {
      deleteConfirmation: "Are you sure you want to delete this entry?",
      deleteError: "Error deleting entry:",
      duplicateError: "Error duplicating entry:",
      addEntryLevel1: "Add entry with this level 1",
      addEntryLevel1And2: "Add entry with these levels 1 and 2",
      addEntryLevel12And3: "Add entry with these levels 1, 2 and 3",
      addEntryAllLevels: "Add entry with all 4 levels",
      unit: "Unit",
      unitPrice: "Unit price",
      comment: "Comment",
      actions: "Actions",
      edit: "Edit",
      duplicate: "Duplicate",
      delete: "Delete",
    },
    costGuideTable: {
      saveError: "Error saving changes:",
      saveErrorAlert: "An error occurred while saving.",
      fillRequiredFields: "Please fill in all required fields.",
      addEntryError: "Error adding entry:",
      addEntryErrorAlert: "An error occurred while adding the entry.",
      confirmDeleteEntry: "Are you sure you want to delete this entry?",
      deleteEntryError: "Error deleting entry:",
      deleteEntryErrorAlert: "An error occurred while deleting.",
      duplicateEntryError: "Error duplicating entry:",
      duplicateEntryErrorAlert: "An error occurred while duplicating.",
      level1: "Level 1",
      level2: "Level 2",
      level3: "Level 3",
      level4: "Level 4",
      purchaseUnit: "Purchase Unit",
      unitPrice: "Unit Price",
      comment: "Comment",
      noEntriesAvailable: "No entries available.",
      addEntriesForQuickEdit: "Add entries to use quick editing.",
      editModeActive: "Edit mode active",
      activateEditMode: "Activate editing",
      exportCSV: "Export CSV",
      cancel: "Cancel",
      saving: "Saving...",
      save: "Save",
      addEntry: "Add an entry",
      quickEditModeTitle: "Quick edit mode:",
      quickEditModeDescription: "Click to select a cell. Hold Shift to select multiple cells. Double-click to edit a cell. Use Ctrl+C/⌘+C to copy and Ctrl+V/⌘+V to paste on selected cells.",
      addNewEntry: "Add new entry",
      unitPriceAmount: "Unit amount",
      additionalInfoPlaceholder: "Additional information...",
      addingInProgress: "Adding in progress...",
      add: "Add",
      actions: "Actions",
      duplicateRow: "Duplicate this row",
      deleteRow: "Delete this row",
      readOnlyModeMessage: "You are in view mode. You do not have the necessary permissions to modify this cost guide."
    },
    costGuidePage: {
      error: {
        clientGuideNotFound: "The cost guide associated with this client was not found.",
        loadClientGuide: "Error loading the cost guide.",
        loadGuides: "Error loading cost guides",
        guideNotFound: "Cost guide not found",
        loadData: "Error loading data",
        createGuide: "Error creating guide",
        deleteGuide: "Error deleting guide",
        updateGuide: "Error updating guide"
      },
      noClientGuideMessage: "No cost guide is associated with this client. Please contact an administrator to associate a cost guide.",
      title: "Cost Guide",
      subtitle: {
        admin: "Manage your cost guides to facilitate budget planning",
        client: "Consult the cost guide associated with your client"
      },
      newGuideButton: "New Guide",
      backToListButton: {
        admin: "Back to list",
        client: "Back"
      },
      loadingGuides: "Loading cost guides...",
      noGuidesFound: "No cost guides found. Create your first guide!",
      deleteButton: "Delete",
      viewButton: "View",
      loadingCostGuide: "Loading cost guide...",
      guideNamePlaceholder: "Guide name",
      descriptionOptionalPlaceholder: "Description (optional)",
      saveButton: "Save",
      cancelButton: "Cancel",
      modifyButton: "Modify",
      hierarchicalViewButton: "Hierarchical View",
      quickEditButton: "Quick Edit",
      newEntryButton: "New Entry",
      noEntriesInGuide: "No entries in this cost guide.",
      addFirstEntry: "Add your first entry!",
      readOnlyMessage: "You are in view mode. Contact an administrator if you wish to modify this guide.",
      newCostGuideModal: {
        title: "New Cost Guide",
        guideNameLabel: "Guide Name",
        guideNamePlaceholder: "Ex: Q1 2023 Cost Guide",
        descriptionLabel: "Description",
        descriptionPlaceholder: "Optional description",
        cancelButton: "Cancel",
        createButton: "Create"
      },
      confirmDelete: "Are you sure you want to delete this cost guide?"
    },
    aide: {
      header: {
        title: "How can we help you?",
        subtitle: "Ask a question or browse the categories to find answers."
      },
      search: {
        placeholder: "Search for a question..."
      },
      state: {
        loading: "Loading FAQs...",
        errorTitle: "Error!",
        loadError: "Could not load FAQs. Please check the connection or the Google Sheet URL.",
        errorInstructions: "Please ensure the Google Sheet is correctly published as a CSV and that the URL is correct."
      },
      categories: {
        campaigns: "Campaigns",
        strategy: "Strategy",
        tactics: "Tactics",
        documents: "Documents",
        costGuide: "Cost Guide",
        partners: "Partners",
        client: "Client",
        admin: "Admin"
      },
      results: {
        noneInCategory: "No questions match your search in this category.",
        emptyCategoryHint: "(The \"{{categoryName}}\" category might be empty in the Google Sheet or filtered results.)",
        allResultsFor: "All results for \"{{searchTerm}}\"",
        noneOverall: "No results found across all categories",
        noneOverallHint: "Try simplifying your keywords or checking the spelling."
      },
      contact: {
        intro: "pssttt!",
        prompt: "Can't find the answer to your questions? Email us at",
        tooltipCopy: "Copy email",
        tooltipCopied: "Copied!"
      },
      logs: {
          loadError: "Error loading FAQs:",
          csvRowSkipped: "Skipped CSV row due to missing or invalid fields:",
          copyError: "Could not copy email:",
          httpError: "HTTP Error: {{status}} {{statusText}}"
      }
    },
    clientConfig: {
      header: {
        title: "Client Configuration"
      },
      tabs: {
        general: "General",
        access: "Access",
        fees: "Fees",
        taxonomies: "Taxonomies",
        templates: "Templates",
        lists: "Lists",
        dimensions: "Dimensions",
        customCodes: "Custom Codes",
        currencies: "Currencies"
      }
    },
    clientAccess: {
      title: "Access Management",
      accessLevels: {
        editor: "Editor",
        user: "User"
      },
      errors: {
        loadData: "Could not load data.",
        addUser: "Could not add user.",
        updateUser: "Could not update user access.",
        removeUser: "Could not remove user access."
      },
      success: {
        userAdded: "User added successfully.",
        userUpdated: "User access updated successfully.",
        userRemoved: "User access removed successfully."
      },
      confirmations: {
        removeUser: "Are you sure you want to remove this user's access?"
      },
      messages: {
        selectClient: "Please select a client to manage access.",
        loading: "Loading access data...",
        readOnly: "You are in read-only mode. You do not have the necessary permissions to modify access."
      },
      tooltips: {
        noAccessPermission: "You do not have permission to manage access",
        noEditPermission: "You do not have permission to edit access",
        noDeletePermission: "You do not have permission to delete access"
      },
      buttons: {
        addUser: "Add User",
        cancel: "Cancel",
        update: "Update",
        add: "Add"
      },
      emptyState: {
        noUsers: "No users have access to this client.",
        getStarted: "Click \"Add User\" to begin."
      },
      table: {
        header: {
          user: "User",
          accessLevel: "Access Level",
          note: "Note",
          actions: "Actions"
        }
      },
      modal: {
        title: {
          edit: "Edit User Access",
          add: "Add User"
        },
        close: "Close"
      },
      form: {
        label: {
          selectUser: "Select a user",
          accessLevel: "Access Level",
          note: "Note"
        },
        placeholder: {
          filterUsers: "Filter users...",
          addNote: "Add a note regarding this access..."
        },
        option: {
          selectUser: "Select a user"
        }
      }
    },
    clientCurrencies: {
      header: {
        title: "Conversion Rates"
      },
      actions: {
        add: "Add"
      },
      filters: {
        searchPlaceholder: "Search...",
        allYears: "All years"
      },
      table: {
        year: "Year",
        from: "From",
        to: "To",
        rate: "Rate",
        actions: "Actions"
      },
      messages: {
        selectClient: "Please select a client to see their conversion rates.",
        loading: "Loading conversion rates...",
        noRatesConfigured: "No conversion rates configured for this client.",
        noFilterResults: "No results for your search."
      },
      permissions: {
        noAddPermission: "You do not have permission to add conversion rates",
        readOnlyWarning: "You are in read-only mode. You do not have the necessary permissions to modify currency conversion rates.",
        noEditPermission: "You do not have permission to edit rates",
        noDeletePermission: "You do not have permission to delete rates"
      },
      errors: {
        loadFailed: "Could not load client currencies.",
        addFailed: "Could not add the currency.",
        updateFailed: "Could not update the currency.",
        deleteFailed: "Could not delete the currency."
      },
      confirmations: {
        delete: "Are you sure you want to delete this conversion rate?"
      },
      form: {
        addTitle: "Add Rate",
        editTitle: "Edit Rate"
      }
    },
    clientCustomCodes: {
      page: {
        prompt: "Please select a client to manage custom codes.",
        title: "Custom Codes",
        searchPlaceholder: "Search by shortcode, custom code or ID...",
        loading: "Loading custom codes...",
        noCodesForClient: "No custom codes configured for this client.",
        noSearchResults: "No results for your search."
      },
      permissions: {
        addTooltip: "You do not have permission to add custom codes",
        editTooltip: "You do not have permission to edit custom codes",
        deleteTooltip: "You do not have permission to delete custom codes",
        readOnlyWarning: "You are in read-only mode. You do not have the necessary permissions to modify custom codes."
      },
      table: {
        headerId: "Shortcode ID",
        headerCode: "Shortcode Code",
        headerName: "Shortcode Name",
        headerCustomCode: "Custom Code",
        headerActions: "Actions",
        notAvailable: "N/A",
        editAction: "Edit",
        deleteAction: "Delete"
      },
      modal: {
        titleEdit: "Edit Custom Code",
        titleAdd: "Add Custom Code",
        buttonAdd: "Add a custom code",
        close: "Close",
        selectShortcode: "Select a shortcode",
        searchPlaceholder: "Search by code, name or ID...",
        noShortcodeFound: "No shortcode found",
        alreadyCustomized: "(Already customized)",
        customCodeLabel: "Custom Code",
        cancel: "Cancel",
        update: "Update",
        add: "Add"
      },
      messages: {
        errorLoad: "Could not load data.",
        successAdd: "Custom code added successfully.",
        errorAdd: "Could not add custom code.",
        successUpdate: "Custom code updated successfully.",
        errorUpdate: "Could not update custom code.",
        confirmDelete: "Are you sure you want to delete this custom code?",
        successDelete: "Custom code deleted successfully.",
        errorDelete: "Could not delete custom code."
      }
    },
    clientDimensions: {
      messages: {
        loadError: "Could not load client dimensions.",
        updateSuccess: "Client dimensions have been successfully updated.",
        updateError: "Could not update client dimensions.",
        selectClientPrompt: "Please select a client to configure their dimensions.",
        loading: "Loading client dimensions...",
        readOnly: "You are in read-only mode. You do not have the necessary permissions to modify the dimensions."
      },
      headings: {
        title: "Custom Dimensions",
        campaign: "Campaign",
        tactic: "Tactic",
        placement: "Placement",
        creative: "Creative"
      },
      form: {
        placeholderDim1: "Dimension 1",
        placeholderDim2: "Dimension 2",
        placeholderDim3: "Dimension 3"
      },
      buttons: {
        cancel: "Cancel",
        saving: "Saving...",
        save: "Save"
      }
    },
    clientFees: {
      title: "Client Fees",
      placeholders: {
        selectClient: "Please select a client to see their fees."
      },
      actions: {
        addFee: "Add Fee",
        addOption: "Add Option"
      },
      tooltips: {
        noAddPermission: "You do not have permission to add fees",
        noEditPermission: "You do not have permission to edit fees",
        noDeletePermission: "You do not have permission to delete fees",
        noAddOptionPermission: "You do not have permission to add options",
        moveUp: "Move up",
        moveDown: "Move down"
      },
      errors: {
        loadFailed: "Could not load client fees.",
        moveFailed: "Could not move the fee.",
        addFailed: "Could not add the fee.",
        updateFailed: "Could not update the fee.",
        deleteFailed: "Could not delete the fee.",
        addOptionFailed: "Could not add the option.",
        updateOptionFailed: "Could not update the option.",
        deleteOptionFailed: "Could not delete the option."
      },
      success: {
        feeMovedUp: "Fee moved up successfully.",
        feeMovedDown: "Fee moved down successfully.",
        feeAdded: "Fee added successfully.",
        feeUpdated: "Fee updated successfully.",
        feeDeleted: "Fee deleted successfully.",
        optionAdded: "Option added successfully.",
        optionUpdated: "Option updated successfully.",
        optionDeleted: "Option deleted successfully."
      },
      confirmations: {
        deleteFee: "Are you sure you want to delete this fee and all its options?",
        deleteOption: "Are you sure you want to delete this option?"
      },
      notifications: {
        readOnly: "You are in read-only mode. You do not have the necessary permissions to modify fees."
      },
      states: {
        loading: "Loading fees...",
        noFees: "No fees configured for this client.",
        noOptions: "No options configured for this fee."
      },
      options: {
        title: "Fee Options"
      },
      table: {
        option: "Option",
        value: "Value",
        buffer: "Buffer",
        editable: "Editable",
        actions: "Actions"
      },
      modals: {
        addFeeTitle: "Add Fee",
        editFeeTitle: "Edit Fee",
        addOptionTitle: "Add Option",
        editOptionTitle: "Edit Option"
      }
    },
    clientGeneral: {
      header: {
        title: "General Information",
        generalFees: "General Fees"
      },
      messages: {
        info: {
          selectClient: "Please select a client to see their information.",
          loading: "Loading client information..."
        },
        success: {
          updateSuccess: "Client information has been successfully updated."
        },
        error: {
          loadDetailsFailed: "Could not load client details.",
          logoUploadFailed: "Could not upload the logo. Other information will be saved.",
          updateFailed: "Could not update client details."
        },
        warning: {
          readOnly: "You are in read-only mode. You do not have the necessary permissions to modify client information."
        }
      },
      form: {
        labels: {
          clientLogo: "Client Logo",
          noLogo: "No logo",
          clientName: "Client Name",
          clientId: "Client ID",
          offices: "Offices",
          exportLanguage: "Export Language",
          agency: "Agency",
          costGuide: "Cost Guide",
          defaultDriveFolder: "Default Drive Folder",
          customFee1: "Custom Fee 1",
          customFee2: "Custom Fee 2",
          customFee3: "Custom Fee 3"
        },
        altText: {
          logoPreview: "Logo preview",
          clientLogo: "Client logo"
        },
        helpText: {
          clientId: "Unique client identifier (not modifiable)"
        },
        options: {
          french: "French",
          english: "English",
          selectAgency: "Select an agency"
        },
        costGuide: {
          noGuideSelected: "No guide selected",
          guideNotFound: "Guide not found"
        }
      },
      buttons: {
        changeLogo: "Change logo",
        cancel: "Cancel",
        saving: "Saving...",
        save: "Save"
      }
    },
    clientTemplates: {
      error: {
        load: "An error occurred while loading the templates.",
        save: "An error occurred while saving the template.",
        delete: "An error occurred while deleting the template."
      },
      confirm: {
        delete: "Are you sure you want to delete this template?"
      },
      loading: {
        message: "Loading templates..."
      },
      header: {
        title: "Template Management"
      },
      actions: {
        add: "Add a template"
      },
      permissions: {
        tooltip: {
          add: "You do not have permission to add templates",
          edit: "You do not have permission to edit templates",
          delete: "You do not have permission to delete templates"
        },
        readOnlyWarning: "You are in read-only mode. You do not have the necessary permissions to modify templates."
      },
      emptyState: {
        selectClient: "Please select a client to manage their templates.",
        noTemplates: "No templates configured.",
        callToAction: "Click on \"Add a template\" to get started."
      },
      table: {
        header: {
          name: "Name",
          url: "URL",
          language: "Language",
          duplication: "Tab Duplication",
          actions: "Actions"
        },
        body: {
          yes: "Yes",
          no: "No"
        }
      }
    },
    currencyForm: {
      labels: {
        year: "Year",
        rate: "Rate",
        from: "Source currency",
        to: "Target currency"
      },
      buttons: {
        cancel: "Cancel",
        update: "Update",
        add: "Add"
      }
    },
    feeOptionForm: {
      labels: {
        optionName: "Option Name",
        value: "Value",
        buffer: "Buffer (%)",
        editable: "Editable"
      },
      placeholders: {
        optionName: "Option Name"
      },
      buttons: {
        cancel: "Cancel",
        update: "Update",
        add: "Add"
      }
    },
    templateForm: {
      title: {
        edit: "Edit Template",
        add: "Add Template"
      },
      fields: {
        name: {
          label: "Template Name",
          placeholder: "Eg: Standard Template"
        },
        url: {
          label: "Template URL",
          placeholder: "https://docs.google.com/spreadsheets/d/example"
        },
        duplicate: {
          label: "Duplicate for each tab",
          description: "Enable this option to create a separate tab for each campaign tab"
        },
        language: {
          label: "Language"
        }
      },
      errors: {
        nameRequired: "The template name is required",
        urlRequired: "The template URL is required",
        urlInvalid: "The URL must be valid",
        languageRequired: "The language is required"
      },
      buttons: {
        cancel: "Cancel",
        update: "Update",
        create: "Create"
      }
    },
    loadingSpinner: {
      alt: {
        loading: "Loading..."
      },
      error: {
        gifLoadFailed: "Could not load gif:"
      },
      message: {
        inProgress: "Loading in progress..."
      },
      status: {
        ready: "Ready"
      }
    },
    topLoadingIndicator: {
      messages: {
        loading: "Loading...",
        refreshComplete: "Refresh complete",
        processing: "Processing...",
        saving: "Saving...",
        errorOccurred: "An error occurred"
      }
    },
    loadingScreen: {
      alt: {
        loading: "Loading"
      },
      title: {
        initialization: "Initialization"
      },
      subtitle: {
        preparingData: "Preparing your data..."
      },
      progressBar: {
        globalProgress: "Overall progress"
      }
    },
    contactForm: {
      errors: {
        firstNameRequired: "First name is required",
        lastNameRequired: "Last name is required",
        emailRequired: "Email is required",
        emailInvalid: "Invalid email"
      },
      success: {
        message: "Contact saved successfully!"
      },
      labels: {
        firstName: "First Name *",
        lastName: "Last Name *",
        email: "Email *",
        preferredLanguages: "Preferred Languages",
        french: "French",
        english: "English",
        comment: "Comment"
      },
      placeholders: {
        additionalInfo: "Additional information..."
      },
      buttons: {
        cancel: "Cancel",
        saving: "Saving...",
        update: "Update",
        add: "Add"
      }
    },
    contactList: {
      emptyState: {
        message: "No contacts have been added for this partner yet."
      },
      actions: {
        edit: "Edit",
        delete: "Delete",
        confirmDelete: "Are you sure you want to delete this contact?"
      },
      details: {
        languages: "Languages",
        frenchAndEnglish: "French and English",
        french: "French",
        english: "English",
        notSpecified: "Not specified",
        createdAt: "Created on",
        comment: "Comment"
      }
    },
    partnersFilter: {
      search: {
        placeholder: "Search for a partner..."
      },
      filter: {
        label: "Filter by type:"
      }
    },
    partnersGrid: {
      notFound: {
        title: "No partners found",
        suggestion: "Try changing your search criteria"
      }
    },
    partnerDrawer: {
      header: {
        titleFallback: "Partner Details",
        close: "Close"
      },
      tabs: {
        information: "Information",
        contacts: "Contacts",
        specs: "Specs"
      },
      labels: {
        code: "Code",
        displayNameFr: "Display Name (FR)",
        displayNameEn: "Display Name (EN)",
        defaultUtm: "Default UTM",
        type: "Type",
        logoUrl: "Logo URL",
        tags: "Tags",
        technicalInfo: "Technical Information",
        partnerId: "Partner ID"
      },
      placeholders: {
        addTag: "Add a tag..."
      },
      buttons: {
        add: "Add",
        cancel: "Cancel",
        save: "Save",
        saving: "Saving...",
        edit: "Edit",
        addContact: "Add contact",
        addSpec: "Add spec"
      },
      messages: {
        noTags: "No tags",
        loadingContacts: "Loading contacts...",
        loadingSpecs: "Loading specifications..."
      },
      sectionTitles: {
        specs: "Technical Specifications"
      }
    },
    partnerEditForm: {
      common: {
        id: "ID",
        code: "Code",
        displayNameFR: "Display Name (FR)",
        displayNameEN: "Display Name (EN)",
        defaultUTM: "Default UTM",
        type: "Type",
        logoUrl: "Logo URL"
      },
      view: {
        title: "Partner Details",
        editButton: "Edit",
        logoAlt: "Logo"
      },
      edit: {
        title: "Edit Partner",
        updateError: "An error occurred while updating the partner",
        logoPreviewAlt: "Logo preview",
        cancelButton: "Cancel",
        saveButton: "Save",
        savingButton: "Saving..."
      }
    },
    partners: {
      title: {
        main: "Partners"
      }
    },
    specForm: {
      notifications: {
        saveSuccess: "Specification saved successfully!"
      },
      labels: {
        name: "Specification Name",
        format: "Format",
        ratio: "Ratio",
        fileType: "File Type",
        animation: "Animation",
        maxWeight: "Maximum Weight",
        weight: "Maximum Weight if HTML 5",
        title: "Title",
        text: "Text",
        specSheetLink: "Link to spec sheet",
        notes: "Notes"
      },
      placeholders: {
        format: "e.g., 300x250",
        ratio: "e.g., 16:9",
        fileType: "e.g., JPG, PNG, GIF",
        animation: "e.g., Allowed, Not allowed",
        maxWeight: "e.g., 100 KB",
        weight: "e.g., 80 KB",
        title: "e.g., Max 50 characters",
        text: "e.g., Short descriptive text",
        specSheetLink: "https://example.com/specs.pdf",
        notes: "Additional notes"
      },
      errors: {
        nameRequired: "The name is required"
      },
      buttons: {
        cancel: "Cancel",
        submitting: "Saving...",
        update: "Update",
        add: "Add"
      }
    },
    specList: {
      emptyState: {
        message: "No specifications have been added for this partner."
      },
      actions: {
        edit: "Edit",
        delete: "Delete",
        confirmDelete: "Are you sure you want to delete this specification?"
      },
      details: {
        format: "Format",
        ratio: "Ratio",
        fileType: "File Type",
        animation: "Animation",
        maxWeight: "Max Weight",
        weight: "Weight",
        title: "Title",
        text: "Text",
        specSheetLink: "Link to spec sheet",
        notes: "Notes"
      },
      footer: {
        lastUpdated: "Last updated:"
      }
    },
    creatifDrawer: {
      tabs: {
        info: "Information",
        taxonomy: "Taxonomy",
        specs: "Specs"
      },
      title: {
        edit: "Edit creative:",
        new: "New Creative"
      }
    },
    creatifFormInfo: {
      title: "Creative Information",
      description: "Basic configuration and selection of taxonomies for the creative",
      creativeName: {
        label: "Creative Name *",
        tooltip: "Descriptive name of the creative. Be specific to facilitate identification in reports.",
        placeholder: "Ex: Banner 300x250 v1, Video 15s A/B test, Mobile Native Ad"
      },
      startDate: {
        label: "Start Date",
        tooltip: "Start date of the creative. Inherits from the placement, tactic, or campaign if not specified."
      },
      endDate: {
        label: "End Date",
        tooltip: "End date of the creative. Inherits from the placement, tactic, or campaign if not specified."
      },
      errors: {
        taxonomyLoad: "Error loading taxonomies"
      },
      retry: "Retry",
      taxonomySection: {
        title: "Creative Taxonomies (levels 5-6)",
        placeholder: "Select a taxonomy..."
      },
      taxonomyTags: {
        label: "Taxonomy for creative tags",
        tooltip: "Taxonomy that will be used to generate the creative tags (levels 5-6)"
      },
      taxonomyPlatform: {
        label: "Taxonomy for creative platform",
        tooltip: "Taxonomy that will be used for the platform configuration (levels 5-6)"
      },
      taxonomyMediaOcean: {
        label: "Taxonomy for MediaOcean creatives",
        tooltip: "Taxonomy that will be used for the MediaOcean export (levels 5-6)"
      },
      noTaxonomy: {
        message: "No taxonomy configured for this client.",
        action: "You can create taxonomies in the Configuration section."
      },
      loading: {
        data: "Loading data...",
        taxonomies: "Loading taxonomies..."
      }
    },
    creatifFormSpecs: {
      selection: {
        title: "Automatic Selection",
        description: "Choose a partner then a spec to auto-fill the fields",
        partnerPlaceholder: "Select a partner...",
        partnerLabel: "Partner",
        partnerTooltip: "First, select a partner to see their available specs",
        specLoadingPlaceholder: "Loading specs...",
        specSelectPlaceholder: "Select a spec...",
        specLabel: "Specification",
        specTooltip: "Select a spec to auto-fill all the fields below",
        specPrefix: "Spec",
        specSuffix: "applied",
        resetButton: "Reset",
        noSpecs: "This partner has no pre-configured specs.",

      },
      details: {
        title: "Specification Details",
        description: "Modify the values as needed",
        namePlaceholder: "Specification name",
        nameLabel: "Name",
        nameTooltip: "Name of the technical specification",
        formatPlaceholder: "e.g., 300x250",
        formatLabel: "Format",
        formatTooltip: "Dimensions of the creative",
        ratioPlaceholder: "e.g., 16:9",
        ratioLabel: "Ratio",
        ratioTooltip: "Aspect ratio of the creative",
        fileTypePlaceholder: "e.g., JPG, PNG, GIF",
        fileTypeLabel: "File Type",
        fileTypeTooltip: "Accepted file types",
        animationPlaceholder: "e.g., Allowed, Not allowed",
        animationLabel: "Animation",
        animationTooltip: "Specifications on animation",
        maxWeightPlaceholder: "e.g., 100 KB",
        maxWeightLabel: "Maximum Weight",
        maxWeightTooltip: "Maximum file size",
        weightPlaceholder: "e.g., 80 KB",
        weightLabel: "Maximum HTML5 Weight",
        weightTooltip: "Maximum size if HTML5 format",
        titlePlaceholder: "e.g., Max 50 characters",
        titleLabel: "Title",
        titleTooltip: "Constraints on the title",
        textPlaceholder: "e.g., Short descriptive text",
        textLabel: "Text",
        textTooltip: "Constraints on the text",
        specSheetLinkPlaceholder: "https://example.com/specs.pdf",
        specSheetLinkLabel: "Link to spec sheet",
        specSheetLinkTooltip: "URL to the complete documentation",
        notesPlaceholder: "Additional notes on the specification",
        notesLabel: "Notes",
        notesTooltip: "Additional information"
      }
    },
    creatifFormTaxonomy: {
      title: "Creative Configuration",
      subtitle: "Taxonomic variables and creative-specific information",
      retry: "Retry",
      noTaxonomy: {
        title: "Creative Taxonomy Configuration",
        description: "Please first select taxonomies in the \"Information\" tab to configure creative variables.",
        tip: "💡 Creatives use levels 5-6 of the taxonomies."
      },
      loading: {
        data: "Loading data...",
        taxonomies: "Analyzing taxonomies..."
      },
      preview: {
        title: "Creative Taxonomies Preview",
        subtitle: "Preview of levels 5-6 of the selected taxonomies"
      }
    },
    clientLists: {
      noClient: {
        title: "No client selected",
        description: "Please select a client to manage their shortcode lists."
      },
      header: {
        title: "List Configuration"
      },
      readOnly: {
        message: "You are in read-only mode. Contact your administrator to obtain modification permissions."
      },
      initialState: {
        title: "Select a dimension",
        description: "Choose a dimension from the list on the left to manage shortcodes."
      },
      deleteModal: {
        title: "Confirm deletion",
        confirmationTextPart1: "Are you sure you want to delete this custom list? The system will automatically use the default list (PlusCo) instead. This action is",
        confirmationTextPart2: "irreversible",
        confirmButton: "Delete permanently"
      }
    },
    dimensionSidebar: {
      header: {
        title: "Dimensions",
        customPersonalized: "custom",
        customPersonalized_plural: "custom"
      },
      search: {
        placeholder: "Search a dimension...",
        noMatch: "No dimension matches"
      },
      status: {
        noDimensionsAvailable: "No dimensions available"
      },
      list: {
        selectDimension: "Select",
        customListTooltip: "custom list",
        pluscoListTooltip: "PlusCo list",
        customListTitle: "Custom list",
        customBadge: "Custom",
        pluscoBadge: "PlusCo"
      },
      footer: {
        result: "result",
        results: "results",
        dimensionAvailable: "dimension available",
        dimensionsAvailable: "dimensions available"
      }
    },
    listHeader: {
      listHeader: {
        customList: "Custom list",
        pluscoList: "PlusCo List",
        specificTo: "Specific to",
        commonList: "Common list",
        permissionRequired: "Permission required",
        createCustomList: "Create a custom list",
        deleteThisCustomList: "Delete this custom list",
        deleteCustomList: "Delete the custom list"
      }
    },
    shortcodeActions: {
      browse: {
        title: "Browse all available shortcodes",
        button: "View all shortcodes"
      },
      create: {
        noPermission: "You do not have permission to create shortcodes",
        title: "Create a new shortcode",
        button: "New shortcode"
      },
      search: {
        placeholder: "Search in this list..."
      },
      createModal: {
        title: "Create a new shortcode",
        form: {
          codeLabel: "Code",
          nameFRLabel: "Display Name FR",
          nameENLabel: "Display Name EN",
          defaultUTMLabel: "Default UTM"
        },
        submitButton: "Create and assign"
      }
    },
    shortcodeDetail: {
      modal: {
        title: "Shortcode Details"
      },
      errors: {
        requiredFields: "The code and FR display name are required.",
        updateFailed: "Could not update the shortcode.",
        deleteFailed: "Could not delete the shortcode."
      },
      form: {
        codeLabel: "Code",
        displayNameFrLabel: "Display Name FR",
        displayNameEnLabel: "Display Name EN",
        defaultUtmLabel: "Default UTM",
        typeLabel: "Type"
      },
      buttons: {
        saving: "Saving...",
        deleting: "Deleting..."
      },
      deleteModal: {
        title: "Confirm Deletion",
        areYouSure: "Are you sure you want to delete the shortcode ",
        irreversible: "? This action is irreversible and will also remove this shortcode from all lists."
      }
    },
    shortcodeTable: {
      remove: {
        confirmCustom: "Are you sure you want to remove \"{name}\" from this custom list?",
        confirmPlusco: "Are you sure you want to remove \"{name}\" from the PlusCo list? This will affect all clients using this list."
      },
      empty: {
        title: "Empty List",
        description: "This list contains no shortcodes. Use the action buttons above to add some."
      },
      search: {
        noResults: "No Results",
        noMatchPart1: "No shortcode matches your search for \"",
        noMatchPart2: "\" in this list."
      },
      header: {
        listTitle: "Shortcodes in the List",
        searchResults: "Search Results",
        code: "Code",
        nameFR: "French Name",
        nameEN: "English Name",
        defaultUTM: "Default UTM",
        type: "Type",
        actions: "Actions"
      },
      label: {
        shortcode: "shortcode",
        shortcodes: "shortcodes",
        totalInList: "total in this list"
      },
      cell: {
        notDefined: "Not defined"
      },
      tooltip: {
        copyId: "Copy ID",
        idCopied: "ID copied!",
        editShortcode: "Edit this shortcode",
        removing: "Removing...",
        permissionRequired: "Permission required",
        removeFromCustom: "Remove from this list",
        removeFromPlusco: "Remove from PlusCo list"
      },
      footer: {
        resultsDisplayedSingular: "result displayed",
        resultsDisplayedPlural: "results displayed",
        totalSingular: "shortcode in total",
        totalPlural: "shortcodes in total",
        pluscoWarning: "Changes affect all clients using the PlusCo list"
      }
    },
    feeForm: {
      labels: {
        name: "Fee Name",
        calculationType: "Calculation Type",
        calculationMode: "Calculation Mode"
      },
      placeholders: {
        name: "Fee Name"
      },
      calculationTypes: {
        volumeUnit: "Volume of units",
        fixedFee: "Fixed fee",
        percentageBudget: "Budget percentage",
        units: "Units"
      },
      calculationModes: {
        direct: "Directly on media budget",
        onPrevious: "Applicable on previous fees"
      }
    },
    placementFormInfo: {
      header: {
        title: "Placement Information",
        subtitle: "Basic configuration and taxonomies for the placement"
      },
      fields: {
        nameLabel: "Placement Name *",
        namePlaceholder: "e.g., Desktop Banners, Mobile Video, Tablet Display",
        nameTooltip: "Descriptive name for the placement. Be specific to facilitate identification.",
        startDateLabel: "Start Date",
        startDateTooltip: "Start date of the placement. Inherits from the tactic or campaign if not specified.",
        endDateLabel: "End Date",
        endDateTooltip: "End date of the placement. Inherits from the tactic or campaign if not specified."
      },
      taxonomies: {
        title: "Placement Taxonomies (levels 3-4)",
        placeholder: "Select a taxonomy...",
        tagsLabel: "Taxonomy to use for tags",
        tagsTooltip: "Taxonomy that will be used to generate the placement tags",
        platformLabel: "Taxonomy to use for the platform",
        platformTooltip: "Taxonomy that will be used for the platform configuration",
        mediaOceanLabel: "Taxonomy to use for MediaOcean",
        mediaOceanTooltip: "Taxonomy that will be used for the MediaOcean export"
      },
      notifications: {
        taxonomiesError: "Error loading taxonomies",
        retry: "Retry",
        noTaxonomiesConfigured: "No taxonomies configured for this client.",
        youCanCreateTaxonomies: "You can create taxonomies in the Configuration section.",
        loadingData: "Loading data...",
        loadingTaxonomies: "Loading taxonomies..."
      }
    },
    placementFormTaxonomy: {
      error: {
        retry: "Retry"
      },
      noTaxonomy: {
        title: "Taxonomy Configuration",
        description: "Please first select taxonomies in the \"Information\" tab to configure the variables."
      },
      loading: {
        data: "Loading data...",
        taxonomyAnalysis: "Analyzing taxonomies..."
      }
    },
    taxonomyFieldRenderer: {
      select: {
        placeholder: "Select..."
      },
      input: {
        placeholder: "Enter value...",
        authorizedChar:"Permitted characters: letters, numbers, and hyphens only"
      },
      button: {
        chooseFromList: "📋 Choose from list ({count} options)"
      },
      emptyState: {
        title: "Placement Field Configuration",
        description: "All variables are inherited automatically. No manual configuration is required."
      },
      configuredState: {
        title: "Fields to Configure"
      },
      hiddenFields: {
        message: "were ignored because they do not accept free values and do not have a list configured for this client.",
        prefix:"The fields"
      }
      
    },
    donutChart: {
      noData: "No data",
      sections: "sections"
    },
    budgetPanel: {
      displayBudgetFor: "Display budget for:",
      currentTab: "Current tab",
      allTabs: "All tabs",
      loadingAllTabsData: "🔄 Loading data for all tabs...",
      errorLoadingData: "Error loading data",
      retry: "Retry",
      totals: "Totals",
      allTabsParenthesis: "(All tabs)",
      currentTabParenthesis: "(Current tab)",
      totalsTab: "Totals",
      indicatorsTab: "Indicators",
      header: "Budget",
      clientInfoError: "Could not load client information",
      selectCampaign: "Select a campaign to see the budget."
    },
    budgetTotals: {
      mediaBudget: "Media budget",
      tacticFees: "Tactic fees",
      totalClientBudget: "Total client budget",
      campaignBudget: "Campaign budget",
      difference: "Difference"
    },
    feeDetails: {
      title: "Fee Details",
      campaignFees: "Campaign Fees",
      tacticFeesHeader: "Tactic Fees",
      defaultFeeLabel: "Fee",
      noFeesApplied: "No fees applied."
    },
    sectionBreakdown: {
      title: "Breakdown by section",
      allTabsParenthesis: "(All tabs)",
      loadingData: "Loading data...",
      noSectionOrBudget: "No section or budget defined."
    },
    budgetIndicators: {
      title: "Campaign Indicators",
      header: "Indicators",
      description: "Campaign indicators will be available soon. They will allow you to see the local media rate, digital media rate, and the complexity level of your campaign.",
      underConstruction: "🚧 Under construction"
    },
    tacticsFooter: {
      tabs: {
        fallbackName: "this tab",
        deleteConfirmation: "Are you sure you want to delete the tab \"{{ongletName}}\"? This action will also delete all associated sections and tactics.",
        deleteLastError: "Cannot delete the last tab",
        deleteTitle: "Delete tab",
        renameTitle: "Rename tab",
        addTitle: "Add tab"
      },
      viewMode: {
        hierarchy: "Hierarchy view",
        table: "Table view",
        timeline: "Timeline view"
      }
    },
    taxonomyPreview: {
      title: "Taxonomy Preview",
      variableTooltip: {
        variable: "Variable",
        format: "Format",
        source: "Source",
      },
      level: {
        title: "Level",
        noneConfigured: "No structure configured for this taxonomy",
      },
      placeholder: {
        description: "The preview will appear once taxonomies are selected and analyzed.",
      },
      source: {
        title: "Value source:",
        campaign: "Campaign",
        tactic: "Tactic",
        placement: "Placement",
        creative: "Creative",
        missingValue: "Missing value",
      },
      helpText: {
        hover: "💡 Hover over a field to configure to highlight it here.",
      },
      card: {
        tags: "Tags",
        platform: "Platform",
        mediaocean: "MediaOcean",
      },
    },
    placementFormTags: {
      section: {
        title: "Tag Configuration",
        description: "Configure the trafficking settings for this placement."
      },
      dates: {
        startDateLabel: "Tag Start Date",
        startDateTooltip: "Tagging start date (default: placement start date - 30 days)",
        endDateLabel: "Tag End Date",
        endDateTooltip: "Tagging end date (default: placement end date + 30 days)"
      },
      tagType: {
        label: "Tag Type",
        tooltip: "Select the appropriate tag type for the media format",
        selectOption: "Select a type...",
        placeholder: "Select a tag type..."
      },
      rotation: {
        label: "Creative Rotation Type",
        tooltip: "Defines how creatives for this placement will be rotated",
        placeholder: "Select a rotation type..."
      },
      floodlight: {
        label: "Floodlight Configuration",
        tooltip: "Specific settings for the Floodlight configuration",
        placeholder: "Enter the Floodlight name AND ID"
      },
      weightedInfo: {
        title: "Weighted rotation enabled:",
        text: "You will be able to define a rotation weight (%) for each creative in this placement in the Creative Tags tab."
      },
      advanced: {
        thirdPartyMeasurementLabel: "Third-Party Measurement (e.g., Double Verify)",
        thirdPartyMeasurementTooltip: "Enables or disables third-party measurement.",
        vpaidLabel: "VPAID",
        vpaidTooltip: "Enables or disables VPAID (Video Player-Ad Interface Definition)",
        selectPlaceholder: "Select..."
      }
    },
    placementDrawer: {
      tabs: {
        info: "Information",
        taxonomy: "Taxonomy",
        tags: "Tags"
      },
      title: {
        edit: "Edit placement: {{label}}",
        new: "New placement"
      }
    },
    creatifFormTags: {
      title: "Creative Tags Configuration",
      description: "Configure CM360 parameters",
      validation: {
        title: "Validation errors:",
        startDateBeforePlacement: "Creative tag start date cannot be earlier than {{date}} (placement tag start date)",
        endDateAfterPlacement: "Creative tag end date cannot exceed {{date}} (placement tag end date)",
        startAfterEnd: "Creative tag start date must be before the end date"
      },
      fields: {
        startDate: {
          label: "Creative tag start date",
          tooltip: "Start date for tagging this creative. Must be between {{startDate}} and {{endDate}}"
        },
        endDate: {
          label: "Creative tag end date",
          tooltip: "End date for tagging this creative. Must be between {{startDate}} and {{endDate}}"
        },
        weight: {
          label: "Rotation weight (%)",
          placeholder: "E.g., 25",
          tooltip: "Rotation percentage for this creative. Example: 25% means this creative will be shown 25% of the time. The sum of weights for all creatives in the placement should total 100%."
        }
      },
      weightedRotation: {
        activated: "Weighted rotation activated:",
        description: "The parent placement uses weighted rotation. Define the weight for this creative.",
        noteTitle: "Note:",
        noteDescription: "Ensure the sum of weights for all creatives in this placement totals 100%."
      },
      rotationInfo: {
        title: "Placement rotation type:",
        evenDescription: "Even rotation among all creatives",
        optimizedDescription: "Rotation optimized by performance",
        floodlightDescription: "Rotation based on Floodlight configuration"
      }
    },
    adOps: {
      actionButtons: {
        tagUnavailable: "Tag not available",
        copy: "Copy",
        historyTooltip: "{label} has been modified since the last tag - Click to see history"
      },
      itemLabels: {
        unnamedPlacement: "Unnamed placement",
        unnamedCreative: "Unnamed creative"
      },
      labels: {
        campaign: "Campaign",
        placement: "Placement",
        ad: "Ad",
        creative: "Creative",
        url: "URL"
      }
    },
    colorPicker: {
      title: "Choose a color",
      applyColor: "Apply {{colorName}} color",
      removeColor: "Remove color",
      none: "None",
      applyInfo: "The color will be applied to all selected rows and saved automatically."
    },
    adOpsDropdown: {
      title: "Publishers",
      button: {
        noPublishers: "No publishers",
        selectPublishers: "Select publishers",
        allPublishers: "All publishers",
        publisherSingular: "publisher selected",
        publisherPlural: "publishers selected"
      },
      search: {
        placeholder: "Search for a publisher...",
        resultFound: "result found",
        resultsFound: "results found",
        noneFound: "No publisher found for \"{{searchTerm}}\""
      },
      actions: {
        select: "Select",
        deselect: "Deselect",
        theResults: "the results",
        all: "all"
      }
    },
    adOpsProgressBar: {
      emptyState: {
        message: "Select a campaign and a version to see the CM360 tags progress"
      },
      tooltip: {
        created: "tags created",
        toModify: "tags to modify",
        toCreate: "tags to create"
      }
    },
    tableRow: {
      clickToCopy: "Click to copy",
      modifiedSinceLastTag: "has been modified since the last tag",
      clickToSeeHistory: "Click to see history",
      tagCreatedInCm360: "Tag created in CM360",
      changesDetectedSinceLastTag: "Changes detected since the last tag",
      unnamedPlacement: "Unnamed placement",
      unnamedCreative: "Unnamed creative",
      label: "Label",
      labelModified: "Label modified",
      tagType: "Tag Type",
      startDate: "Start Date",
      endDate: "End Date",
      rotationType: "Rotation Type",
      rotationWeight: "Rotation Weight",
      floodlight: "Floodlight",
      thirdPartyMeasurement: "Third Party Measurement",
      vpaid: "VPAID"
    },
    adOpsTacticInfo: {
      metricCard: {
        historyTooltip: "{{title}} has been modified since the last tag - Click to see history",
        copyTooltip: "Click to copy {{title}}",
        noValue: "Value not available",
        copied: "✓ Copied"
      },
      noTacticSelected: "No tactic selected",
      metrics: {
        mediaBudget: "Media Budget",
        cm360Rate: "CM360 Rate",
        cm360Volume: "CM360 Volume"
      },
      badges: {
        currency: "Currency",
        buyType: "Buy Type"
      },
      updateButton: {
        updating: "Updating...",
        confirmChanges: "Confirm changes in CM360"
      },
      historyModal: {
        defaultItemLabel: "Tactic"
      }
    },
    adOpsTacticList: {
      common: {
        notAvailable: "N/A"
      },
      header: {
        title: "Tactics",
        tactic: "tactic",
        tactic_plural: "tactics",
        deselect: "Deselect"
      },
      filters: {
        all: "All",
        complete: "Complete ✓",
        modified: "To modify ⚠️",
        toCreate: "To create"
      },
      emptyState: {
        noTacticFound: "No tactics found",
        noTacticForFilter: "No tactic",
        completeFilter: "complete (all tags created)",
        modifiedFilter: "with modifications",
        noTagsFilter: "without tags",
        changeFilter: "Change the filter to see other tactics"
      },
      tacticCard: {
        unnamedTactic: "Unnamed tactic"
      },
      tooltip: {
        allCreated: "All elements and metrics have tags created, no changes",
        changesDetected: "Changes detected in:",
        partialTags: "Partial tags - some elements or metrics do not have tags",
        noTags: "No tags created"
      },
      changesSummary: {
        placements: "placements",
        creatives: "creatives",
        metrics: "metrics"
      },
      legend: {
        complete: "Complete (all created)",
        modifications: "Modifications"
      }
    },
    adOpsTacticTable: {
      colorFilter: {
        all: "All"
      },
      placeholder: {
        noTacticSelected: "No tactic selected",
        selectTacticPrompt: "Select a tactic to see its placements"
      },
      buttons: {
        creating: "Creating...",
        deselect: "Deselect"
      },
      tooltips: {
        deleteAllHistory: "Deletes ALL CM360 tag history for the selected items",
        applyColor: "Apply color",
        removeColor: "Remove color",
        filterNoColor: "Filter by no color",
        filterByColor: "Filter by"
      },
      search: {
        placeholder: "Search by label or tag..."
      },
      filters: {
        statusLabel: "Status:",
        all: "All",
        tagsCreated: "Complete ✓",
        toModify: "To modify ⚠️",
        toCreate: "To create",
        colorLabel: "Color:"
      },
      headers: {
        actions: "Actions",
        tagType: "Tag Type",
        startDate: "Start Date",
        endDate: "End Date",
        rotation: "Rotation",
        floodlight: "Floodlight",
        thirdParty: "3rd Party",
        vpaid: "VPAID"
      },
      table: {
        noResultsFor: "No results for",
        noPlacementsFound: "No placements found"
      }
    },
    cm360HistoryModal: {
      header: {
        title: "Change History",
        placement: "Placement",
        creative: "Creative",
        metrics: "Metrics"
      },
      currentValue: {
        title: "Current Value"
      },
      history: {
        title: "Value History",
        noHistory: "No history available for this field"
      },
      buttons: {
        copyValue: "Copy value",
        copied: "Copied!"
      },
      values: {
        empty: "(empty)"
      }
    },
    adOpsPage: {
      header: {
        title: "AdOps",
        refreshTooltip: "Refresh all AdOps data to see the latest changes",
        refreshing: "Refreshing...",
        refresh: "Refresh"
      },
      placeholder: {
        selectCampaignAndVersion: "Please select a campaign and version to get started.",
        selectVersion: "Please select a version to continue."
      }
    },
    tactiqueDrawer: {
      fieldLabels: {
        TC_Media_Type: "Media Type",
        TC_Publisher: "Partner",
        TC_LOB: "Line of Business",
        TC_Budget: "Budget"
      },
      validation: {
        fieldIsRequired: "The field \"{{label}}\" is required."
      },
      tabs: {
        info: "Info",
        strategy: "Strategy",
        kpi: "KPI",
        budget: "Budget",
        repartition: "Breakdown",
        admin: "Admin",
        tags: "Tags"
      },
      errors: {
        loadData: "Error loading data. Please try again.",
        fillRequiredFields: "Please fill in all required fields before saving.",
        saveData: "Error while saving. Please try again.",
        missingRequiredFields: "Missing required fields:"
      },
      confirm: {
        unsavedChanges: "You have unsaved changes. Are you sure you want to close?"
      },
      title: {
        edit: "Edit Tactic: {{label}}",
        new: "New Tactic"
      },
      buttons: {
        saving: "Saving..."
      }
    },
    tactiqueFormInfo: {
      status: {
        planned: "Planned",
        active: "Active",
        completed: "Completed",
        cancelled: "Cancelled"
      },
      general: {
        title: "General Information",
        subtitle: "Basic tactic configuration"
      },
      label: {
        placeholder: "Ex: Google Display Banners",
        label: "Label *",
        tooltip: "This is the name of your tactic. Make sure to provide a clear and concise description."
      },
      bucket: {
        placeholder: "Select a bucket...",
        label: "Bucket",
        tooltip: "Buckets are a high-level planning tool. They allow you to group similar tactics and track their overall budget in the 'Strategy' tab."
      },
      mpa: {
        placeholder: "Ex: Digital MPA",
        label: "MPA",
        tooltip: "Allows you to define on which MPA this tactic will be displayed. If left empty, it will be displayed on the global MPA."
      },
      loading: {
        data: "Loading data..."
      },
      noBuckets: {
        message: "No budget buckets defined for this campaign. You can create buckets in the Strategy section."
      }
    },
    kpi: {
      form: {
        label: "KPI",
        tooltip: "Key Performance Indicator",
        selectPlaceholder: "Select a KPI...",
        costPer: "Cost per",
        costPerTooltip: "This is the cost for one unit of the selected KPI. For example, for a 'CPC' type KPI, it's the cost per click.",
        volume: "Volume",
        volumeTooltip: "This is the anticipated volume of the selected KPI."
      },
      section: {
        title: "KPIs and Objectives",
        subtitle: "Definition of performance indicators",
        selectMediaObjectivePlaceholder: "Select a media objective...",
        mediaObjective: "Media Objective",
        mediaObjectiveTooltip: "Main media objective of the tactic"
      },
      list: {
        title: "Performance KPIs",
        maxKpisInfo: "Up to 5 KPIs can be defined",
        addKpi: "+ Add a KPI",
        noKpiDefined: "No KPI defined. Add a KPI to get started.",
        addFirstKpi: "+ Add the first KPI",
        maxKpisReached: "Maximum limit of 5 KPIs reached. Delete an existing KPI to add a new one."
      },
      status: {
        loadingData: "Loading data...",
        noKpiAvailable: "No KPIs available in the dynamic lists. The cost and volume fields can still be used."
      }
    },
    tactiqueFormStrategie: {
      customDimension: {
        label: "Custom Dimension {{number}}",
        helpText: "Custom field for your client",
        selectPlaceholder: "Select {{labelText}}...",
        inputPlaceholder: "Enter {{labelText}}..."
      },
      mediaStrategy: {
        title: "Media Strategy",
        description: "Strategic configuration and targeting"
      },
      lob: {
        placeholder: "Select a line of business...",
        label: "Line of Business",
        helpText: "Custom list for your client"
      },
      mediaType: {
        placeholder: "Select a media type...",
        label: "Media Type",
        helpText: "This is the most important categorization. This characteristic will affect the tactic's behavior on multiple levels"
      },
      buyingMethod: {
        placeholder: "Select a buying method...",
        label: "Buying Method - Programmatic/SEM",
        helpText: "Indicate which kind of programmatic or SEM purchase will be used. Leave empty if not applicable"
      },
      infoBox: {
        title: "💡 Partner vs. Inventory",
        partnerTitle: "Partner:",
        partnerBullet1: "• This is the entity that will bill the agency",
        partnerBullet2: "• Programmatic: this is generally the DSP (e.g., DV360)",
        partnerBullet3: "• OOH: If the purchase is made with Billups, you must select Billups",
        partnerBullet4: "• TV/Radio: If multiple stations will be used, choose \"Various Stations\"",
        partnerBullet5: "• Each tactic must have a partner",
        inventoryTitle: "Inventory:",
        inventoryBullet1: "• It's like a sub-partner or a medium that will be activated through the partner",
        inventoryBullet2: "• If you buy a deal with Radio-Canada through DV360, the inventory will be \"Radio-Canada\"",
        inventoryBullet3: "• When buying with Billups, you can indicate which OOH partner will be used (e.g., Astral)",
        inventoryBullet4: "• If inventory is not applicable, leave it empty"
      },
      publisher: {
        placeholder: "Select a partner...",
        label: "Partner",
        helpText: "IMPORTANT: This is the administrative entity that will send the invoice."
      },
      inventory: {
        placeholder: "Select an inventory...",
        label: "Inventory",
        helpText: "This value is optional. It is a sub-partner or a property of the partner (Ex: Pelmorex > Meteomedia)"
      },
      marketDescription: {
        placeholder: "Ex: Canada, Quebec, Montreal",
        label: "Market Description"
      },
      common: {
        openFieldHelpText: "Open field. Used only in the media plan. Will not be used in the taxonomy"
      },
      audienceDescription: {
        placeholder: "Describe the targeting for this tactic...",
        label: "Audience Description"
      },
      productDescription: {
        placeholder: "Ex: iPhone 15 Pro",
        label: "Product Description"
      },
      formatDescription: {
        placeholder: "Describe the format used...",
        label: "Format Description"
      },
      locationDescription: {
        placeholder: "Describe the location",
        label: "Location Description"
      },
      frequency: {
        placeholder: "Ex: 3 times a week",
        label: "Frequency",
        helpText: "Ex: 2x per week"
      },
      market: {
        placeholder: "Select a market...",
        label: "Market",
        helpText: "Closed field used in some taxonomies"
      },
      language: {
        placeholder: "Select a language...",
        label: "Language",
        helpText: "Open field for the tactic's language. Used only in the media plan. The language used in the taxonomy will be determined at the placement level"
      },
      customFields: {
        title: "Custom Fields",
        description: "Client-specific configuration"
      },
      production: {
        title: "Production",
        description: "Management of creatives and deliverables"
      },
      creatives: {
        placeholder: "Ex: 5 banners + 2 videos",
        label: "Suggested Number of Creatives",
        helpText: "Optional - Suggested number of creatives to be produced for the creative agency"
      },
      deliveryDate: {
        label: "Creative Delivery Date",
        helpText: "Optional - Desired delivery date to ensure a timely launch."
      }
    },
    repartition: {
        mediaBudget: {
          label: "Media budget:",
          notDefined: "Not defined"
        },
        section: {
          title: "Temporal Distribution",
          description: "Configure the tactic dates and distribute the values according to the campaign breakdowns"
        },
        startDate: {
          tooltip: "Start date of this specific tactic",
          label: "Start date *"
        },
        endDate: {
          tooltip: "End date of this specific tactic",
          label: "End date *"
        },
        breakdown: {
          defaultBadge: "Default",
          basedOnTacticDates: "• Based on tactic dates",
          totalLabel: "Total:",
          vsBudget: "vs Budget:",
          distributeButton: "Distribute",
          typeMonthly: "Monthly",
          typeWeekly: "Weekly",
          typePEBs: "PEBs",
          typeCustom: "Custom"
        },
        period: {
          costGuideTitle: "Select from cost guide",
          unitCostPlaceholder: "Cost/unit",
          volumePlaceholder: "Volume",
          totalPlaceholder: "Total",
          valuePlaceholder: "Value"
        },
        noBreakdown: {
          message: "No breakdown configured for this campaign.",
          details: "Breakdowns are defined when creating or modifying the campaign."
        },
        costGuideModal: {
          title: "Select from cost guide"
        }
    },
    tactiqueFormTags: {
      fields: {
        buyType: {
          label: "Buy Type *",
          tooltip: "Select the buy type for this tactic",
          selectPlaceholder: "Select a type"
        },
        cm360Volume: {
          label: "CM360 Volume *",
          tooltip: "Enter the planned volume for this tactic (integer)"
        },
        cm360Rate: {
          label: "CM360 Rate (calculated automatically)",
          tooltip: "Automatically calculated rate: Client Budget ÷ CM360 Volume (×1000 if CPM)"
        }
      },
      validation: {
        volumePositive: "Volume must be greater than 0"
      }
    },
    tactiqueFormComponents: {
      selectionButtons: {
        clearSelection: "Clear selection"
      },
      smartSelect: {
        enterValue: "Enter a value..."
      }
    },
    tactiqueFormBudget: {
      currencySelector: {
        loadingRates: "Loading exchange rates...",
        unavailableTitle: "Exchange Rate Unavailable",
        configureMessage: "Please configure at least one exchange rate for {tacticCurrency} → {campaignCurrency} in the client's Currencies section.",
        requiredTitle: "Currency Conversion Required",
        requiredDescription: "The purchase currency ({tacticCurrency}) is different from the campaign currency ({campaignCurrency}). Please select the rate version to use.",
        versionLabel: "Exchange rate version to use *",
        versionTooltip: "Select the exchange rate version to apply to convert the budget from the purchase currency to the campaign currency.",
        selectPlaceholder: "Select a rate version...",
        selectionWarning: "⚠️ Please select a rate version to continue",
        selectedRateLabel: "Selected rate:"
      },
      form: {
        title: "Budget and Fees",
        calculationErrors: "Calculation Errors:",
        convergenceWarning: {
          title: "Imperfect Convergence Detected",
          description: "The system could not find a media budget that generates the exact target client budget.",
          gap: "Gap:"
        },
        sections: {
          currencyConversion: {
            title: "Currency Conversion",
            description: "Selection of the exchange rate to apply"
          },
          mainBudget: {
            title: "Main Budget",
            description: "Automatic calculations of budget, cost, and volume"
          },
          bonus: {
            title: "Bonus",
            description: "Management of the negotiated savings"
          },
          fees: {
            title: "Fees",
            description: "Application of fees configured for the client"
          },
          summary: {
            title: "Summary",
            description: "Details of costs and currency conversion"
          }
        },
        loadingData: "Loading budget data..."
      },
      errors: {
        noRateConfigured: "No exchange rate configured for {fromCurrency} → {toCurrency}",
        loadingRatesError: "Error loading exchange rates for {fromCurrency} → {toCurrency}",
        rateNotFoundForVersion: "Exchange rate not found for version \"{version}\"",
        applyingRateError: "Error applying the exchange rate for \"{version}\""
      },
      debug: {
        budgetData: "Budget Data:",
        results: "Results:",
        bonification: "Bonus:",
        converged: "Converged:"
      }
    },
    tactiqueFormAdmin: {
      adminField: {
        useSameAsCampaign: "Use the same as the campaign",
        inheritedValuePlaceholder: "Value inherited from the campaign"
      },
      main: {
        title: "Administration",
        subtitle: "Administrative and billing configuration"
      },
      billingNumber: {
        label: "Billing Number",
        tooltip: "Number used for billing this tactic",
        placeholder: "Specific billing number"
      },
      po: {
        label: "PO",
        tooltip: "Purchase order number for this tactic",
        placeholder: "Specific PO"
      },
      inheritanceInfo: {
        title: "💡 About Inheritance",
        enabledTitle: "Inheritance enabled:",
        enabledDesc: " The tactic will use the values defined at the campaign level.",
        disabledTitle: "Inheritance disabled:",
        disabledDesc: " You can define specific values for this tactic.",
        updateNote: "Inherited values are automatically updated if the campaign changes."
      },
      campaignValues: {
        title: "📋 Campaign Values",
        billingNumberLabel: "Billing Number:",
        notSet: "Not set"
      },
      loading: {
        message: "Loading administrative data..."
      },
      warning: {
        noCampaignValues: "No administrative values are set at the campaign level. You will need to enter specific values for this tactic."
      }
    },
    distributionModal: {
      title: "Distribute Amount",
      form: {
        startDateLabel: "Start Date",
        endDateLabel: "End Date",
        distributeOnLabel: "Distribute On",
        unitCost: "Cost / Unit",
        volume: "Volume",
        totalAmountLabel: "Total Amount to Distribute",
        amountPlaceholder: "e.g., 10000",
      },
      preview: {
        willBeDividedOver: "Will be divided over",
        period: "period",
        perPeriod: "/ period",
      },
      info: {
        distributionDates: "The distribution will only occur on periods that intersect with the chosen dates",
        andAreActive: " and that are activated (checked)",
        unitCostDistribution: "The amount will be distributed over the cost per unit of each period.",
        volumeDistribution: "The amount will be distributed over the volume of each period.",
      },
      confirmButton: "Distribute",
    },
    costGuideModal: {
      title: "Select from Cost Guide",
      levelTitles: {
        mainCategory: "a main category",
        subCategory: "a sub-category",
        specification: "a specification",
        optionWithPrice: "an option with a price"
      },
      breadcrumb: {
        level1: "Level 1"
      },
      buttons: {
        back: "← Back"
      },
      selection: {
        choose: "Choose",
        option: "option"
      },
      finalSelection: {
        unit: "Unit",
        per: "per"
      },
      noOptions: {
        title: "No options available for this selection.",
        instruction: "Please go back and make another selection."
      }
    },
    budgetSummary: {
      feeApplication: {
        mediaBudget: "Media budget"
      },
      convergence: {
        approximateCalculation: "⚠️ Approximate calculation",
        gap: "Gap:",
        totalExceedsTarget: "The calculated total exceeds the target budget due to fee complexity.",
        totalBelowTarget: "The calculated total is below the target budget due to fee complexity."
      },
      currencyConversion: {
        title: "🔄 Automatic conversion to campaign currency",
        helpText: {
          part1: "Automatic conversion from ",
          part2: " to ",
          part3: " using the exchange rate configured for the client."
        },
        exchangeRate: "Exchange rate",
        automaticConversion: "💱 Automatic conversion:",
        missingRateWarning: "⚠️ Missing exchange rate"
      },
      noBudget: {
        title: "Budget Summary",
        message: "The summary will be available once a media budget is set."
      },
      costDetails: {
        title: "Cost Details",
        amountsIn: "Amounts in",
        campaignCurrency: "(campaign currency)",
        tacticCurrency: "Tactic currency:"
      },
      lines: {
        mediaBudget: "Media Budget",
        mediaBudgetDesc: "Net amount for advertising platforms",
        negotiatedBonus: "Negotiated Bonus",
        negotiatedBonusDesc: "Free added value obtained from the partner",
        feesSubtotal: "Fees Subtotal",
        totalClientBudget: "TOTAL CLIENT BUDGET",
        totalClientBudgetDesc: "Total amount billable to the client"
      },
      applicableFees: {
        title: "Applicable fees:",
        appliedOn: "Applied on:",
        undefined: "Undefined"
      },
      conversionError: {
        title: "⚠️ Currency conversion impossible",
        noRateConfiguredFor: "No exchange rate configured for:",
        pleaseConfigure: "Please configure the exchange rate in the client's currency section.",
        amountsDisplayedInTacticCurrency: "Amounts are displayed in the tactic's currency"
      },
      noFees: {
        info: "💡 No fees applied. The client budget equals the media budget. You can activate fees in the previous section if needed."
      }
    },
    budgetMainSection: {
      dynamicLabels: {
        costPerUnit: "Cost per {unit}",
        cpmTooltip: "Cost per mille impressions. Amount paid for 1000 displayed impressions.",
        costPerUnitTooltip: "Unit cost for the selected unit type ({unit}). This field is mandatory and must be entered manually.",
        impressionVolumeLabel: "Volume of {unit}",
        unitVolumeLabel: "Volume of {unit}",
        impressionVolumeTooltip: "Number of {unit} automatically calculated using the formula: (Media Budget + Bonus) ÷ CPM × 1000. This field is read-only and calculated by the system.",
        unitVolumeTooltip: "Number of {unit} automatically calculated using the formula: (Media Budget + Bonus) ÷ Cost per {unitSingular}. This field is read-only and calculated by the system."
      },
      budgetConfig: {
        clientBudgetLabel: "Client Budget",
        clientBudgetTooltip: "Total amount the client will pay, including the media budget and all applicable fees. The media budget will be calculated by deducting fees from this amount.",
        mediaBudgetLabel: "Media Budget",
        mediaBudgetTooltip: "Net amount that will actually be spent on advertising platforms, excluding fees. The unit volume will be calculated based on this amount plus the bonus."
      },
      clientBudgetBox: {
        title: "💡 Media Budget Calculation",
        clientBudgetEntered: "Client budget entered:",
        estimatedMediaBudget: "Estimated media budget:",
        applicableFees: "Applicable fees:",
        verification: "Verification:",
        calculationNote: "💡 Exact calculations are performed automatically by the system."
      },
      mediaBudgetBox: {
        title: "💰 Total Client Budget",
        mediaBudgetEntered: "Media budget entered:",
        plusTotalFees: "Plus total fees:",
        invoicedClientBudget: "Invoiced client budget:"
      },
      form: {
        unit: "unit",
        units: "units",
        calculatedLabel: "(calculated)",
        calculatedAutomatically: "Calculated automatically",
        requiresValidCost: "Requires a valid cost per unit for calculation"
      },
      costGuide: {
        loading: "⏳ Loading guide...",
        useGuide: "📋 Use Cost Guide",
        notAvailable: "📋 Cost Guide not available",
        modalTitle: "Select a cost from the guide"
      },
      incompleteWarning: {
        title: "Incomplete Configuration",
        enterBudget: "• Enter a budget ({mode})",
        enterCost: "• Enter a {costLabel}",
        clientMode: "client",
        mediaMode: "media"
      },
      loadingMessage: "⏳ Loading in progress... Budget calculations will be available once the data is loaded."
    },
    budgetGeneralParams: {
      currencies: {
        cad: "CAD - Canadian Dollar",
        usd: "USD - US Dollar",
        eur: "EUR - Euro",
        chf: "CHF - Swiss Franc"
      },
      budgetModes: {
        media: "Media budget",
        client: "Client budget"
      },
      unitType: {
        placeholder: "Select a unit type...",
        label: "Unit Type",
        tooltip: "Purchase unit. Not to be confused with KPIs. This is the unit in which this tactic is purchased. Usually: Impressions"
      },
      purchaseCurrency: {
        label: "Purchase Currency",
        tooltip: "Currency in which media purchases will be made. Used for budget calculations and conversion if different from the campaign."
      },
      entryMode: {
        label: "Entry Mode",
        tooltip: "Determines how to interpret the entered budget. Client budget = total amount including fees. Media budget = net amount for platforms."
      },
      infoBox: {
        title: "💡 Budget Entry Modes",
        mediaBudgetTitle: "Media Budget:",
        mediaBudgetItem1: "Net amount that will actually be spent on media platforms",
        mediaBudgetItem2: "Fees are added on top to calculate the total client budget",
        clientBudgetTitle: "Client Budget:",
        clientBudgetItem1: "Total amount including media budget + all fees",
        clientBudgetItem2: "Corresponds to the amount billable to the client"
      },
      noUnitTypeWarning: {
        label: "Unit Type:",
        text: "No dynamic list configured. You can configure unit types in the Administration section."
      },
      loading: {
        text: "⏳ Loading... General settings will be available once the data is loaded."
      }
    },
    budgetBonification: {
      validation: {
        mustBeGreaterOrEqual: "The real value must be greater than or equal to the media budget.",
        noBonusSameValue: "The real value is equal to the media budget. No bonus is calculated."
      },
      labels: {
        includeBonus: "Include a bonus",
        realValue: "Real value of the tactic",
        bonusCalculated: "Bonus value (calculated)"
      },
      tooltips: {
        includeBonus: "Activate this option if the value negotiated with the supplier is greater than the media budget you are paying.",
        realValue: "Indicate here the total value of the media space you are getting, as negotiated with the supplier. This amount must be equal to or greater than your media budget.",
        bonusCalculated: "This is the bonus amount, calculated as the difference between the real value and the media budget paid. This field is not editable."
      },
      descriptions: {
        hasBonus: "The bonus is activated. Enter the actual value of the tactic to calculate the gain.",
        noBonus: "No bonus is currently applied to this tactic."
      },
      warnings: {
        mediaBudgetRequired: "Please enter a media budget for this tactic first to calculate the bonus.",
        loadingConfiguration: "The bonus configuration is being loaded or is disabled by another option."
      },
      reference: {
        title: "Reference budget for calculation",
        currentMediaBudget: "Current media budget",
        mustBeGreater: "The real value must be greater than this amount to generate a bonus."
      },
      pendingInput: {
        title: "Bonus activated, awaiting value",
        description: "Enter the real (negotiated) value of the media space in the field below for the bonus to be automatically calculated."
      },
      infos: {
        economyOf: "That's a saving of",
        onNegotiatedValue: "on the negotiated value.",
        insufficientValue: "Insufficient value to calculate savings.",
        ofMediaBudget: "of the media budget",
        noBonusReasonSameValue: "The real value is identical to the budget. No bonus.",
        bonusWillBeCalculated: "The bonus will be calculated once the real value is entered."
      },
      summary: {
        title: "Bonus Summary",
        totalNegotiatedValue: "Total negotiated value",
        mediaBudgetPaid: "Media budget paid",
        bonusObtained: "Bonus obtained",
        represents: "representing",
        addedValue: "of added value."
      },
      disabled: {
        title: "Bonus disabled.",
        description: "Check the box above to activate it and enter the real value."
      }
    },
    budgetFees: {
      calculationDescription: {
        percentageOnBudget: "Percentage applied to budget",
        fixedAmountByUnitVolume: "Fixed amount × unit volume",
        fixedAmountByUnitCount: "Fixed amount × number of units",
        independentFixedAmount: "Independent fixed amount",
        undefinedType: "Undefined type",
      },
      feeItem: {
        order: "Order",
        calculatedAmount: "Calculated amount",
        feeOption: "Fee option",
        autoSelected: "Automatically selected",
        selectOption: "Select an option...",
        bufferInfo: " (Buffer: +{buffer}%)",
        useDifferentUnitVolume: "Use a different unit volume to calculate this fee",
        defaultVolumeInfo: "By default, this fee uses the tactic's unit volume ({unitVolume}). Check to enter a different volume.",
        customUnitVolume: "Custom unit volume",
        enterUnitVolume: "Enter unit volume",
        volumeCalculationHintPrefix: "This volume will be used to calculate the fee:",
        customValue: "Custom value",
        finalValueWithBuffer: "Final value with buffer (+{buffer}%)",
        fixedValue: "Fixed value",
        nonEditableValue: "Non-editable value",
        bufferIncluded: " (buffer +{buffer}% included)",
        numberOfUnits: "Number of units",
        finalCalculationMultiplier: "Multiplier for final calculation",
        units: "units",
      },
      feeSummary: {
        calculationBase: "Calculation base",
        mediaBudgetInCurrency: "(media budget in {currency})",
        mediaBudgetPlusPreviousFeesInCurrency: "(media budget + previous fees in {currency})",
        customVolume: "(custom volume)",
        fixedAmountOf: "Fixed amount of",
        bufferApplied: "Buffer applied",
        onBaseValue: "on the base value",
      },
      main: {
        noFeesConfigured: "No fees configured for this client.",
        feesConfigurableInAdmin: "Fees can be configured in the client's Administration section.",
        displayCurrency: "Display currency",
        currencyNotice: "Fee amounts are calculated and displayed in the tactic's currency.",
        systemCalculationNotice: "Exact calculations are performed automatically by the system.",
        appliedFees: "Applied Fees",
        customVolumeAbbr: "Cust. vol.",
        totalFees: "Total fees",
        mediaBudgetWarning: "⚠️ A media budget must be set to calculate fees.",
        loadingConfiguration: "⏳ Loading... Fee configuration will be available once the data is loaded.",
      },
    },
    breakdownPeriod: {
      months: {
        short: "JAN,FEB,MAR,APR,MAY,JUN,JUL,AUG,SEP,OCT,NOV,DEC",
        shortTitleCase: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec"
      }
    },
    dndKit: {
      common: {
        idCopied: "ID copied!",
        copyId: "Copy ID",
        taxonomy: {
          tags: "Tags",
          platform: "Platform",
          mediaOcean: "MediaOcean"
        }
      },
      creatifItem: {
        type: "creative",
        editTitle: "Edit creative"
      },
      placementItem: {
        type: "placement",
        addCreative: "Add a creative",
        editTitle: "Edit placement",
        noCreative: "No creatives for this placement"
      },
      tactiqueItem: {
        type: "tactic",
        partnerLogoAlt: "Partner logo",
        inventoryLogoAlt: "Inventory logo",
        addPlacement: "Add a placement",
        editTitle: "Edit tactic",
        noPlacement: "No placements in this tactic"
      }
    },
    tactiquesHierarchyView: {
      dragAndDrop: {
        reorganizing: "Reorganization in progress..."
      },
      section: {
        alreadyFirst: "Already in first position",
        moveUp: "Move section up",
        addTactique: "Add a tactique",
        edit: "Edit section",
        ofBudget: "of budget"
      },
      common: {
        idCopied: "ID copied!",
        copyId: "Copy ID"
      },
      tactique: {
        noneInSection: "No tactics in this section"
      }
    },
    taxonomyContextMenu: {
      header: {
        titleTags: "Tags",
        titlePlatform: "Platform",
        titleMediaOcean: "MediaOcean",
        autoRefresh: "• Auto-refresh",
        manualRefreshTooltip: "Refresh manually"
      },
      status: {
        noTaxonomyConfigured: "No taxonomy configured for",
        forTags: "tags",
        forPlatform: "the platform",
        forMediaOcean: "MediaOcean",
        noValueConfigured: "No value configured",
        refreshingData: "Refreshing data..."
      },
      actions: {
        copyTooltip: "Copy:",
        copiedSuccess: "Copied!",
        copyToClipboardTooltip: "Copy to clipboard"
      }
    },
    timelineView: {
      notifications: {
        confirmBreakdownChange: "You are in edit mode. Changing the breakdown will cancel your changes. Continue?"
      },
      errors: {
        noBreakdownConfigured: "No breakdown configured for this campaign.",
        configureInSettings: "Please configure breakdowns in the campaign settings.",
        noTacticsAvailable: "No tactics available for this campaign.",
        noBreakdownSelected: "No breakdown selected. Please select a breakdown to see the distributions."
      },
      header: {
        distributionLabel: "Distribution:",
        pebValues: "3 values",
        periodsLabel: "period(s)"
      },
      buttons: {
        editMode: "Edit mode"
      },
      editModeInfo: {
        title: "Edit mode activated",
        instructions: "You can now modify the distribution values. Use Ctrl+C/⌘+C to copy and Ctrl+V/⌘+V to paste.",
        defaultBreakdownTip: " Check/uncheck the boxes to activate/deactivate periods."
      }
    },
    timeline: {
      table: {
        noPeriodFound: "No period found for this breakdown.",
        pendingChanges: "pending change(s)",
        saving: "Saving...",
        header: {
          sectionTactic: "Section / Tactic",
          totalBudget: "Total Budget",
          totalVolume: "Total Vol",
          averageCost: "Avg Cost"
        },
        unnamedSection: "Unnamed Section",
        placeholder: {
          cost: "Cost",
          volume: "Vol",
          total: "Total"
        },
        footer: {
          totalVolume: "Total Volume"
        }
      },
      utils: {
        months: {
          short: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
          medium: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        }
      },
      alerts: {
        tactic: "The tactic ",
        notFoundMaybeDeleted: " was not found. It may have been deleted by another user.",
        errorSavingTactic: "Error saving tactic ",
        generalSaveError: "A general error occurred while saving."
      }
    },
    searchableSelect: {
      placeholder: {
        default: "Select..."
      },
      search: {
        placeholder: "Search..."
      },
      results: {
        none: "No results"
      }
    },
    sectionModal: {
      title: {
        create: "New section",
        edit: "Edit section"
      },
      errors: {
        nameRequired: "The section name is required"
      },
      form: {
        nameLabel: "Section name",
        namePlaceholder: "Enter the section name",
        colorLabel: "Section color",
        colorTitle: "Color"
      }
    },
    selectedActionsPanel: {
      moveButton: {
        validating: "Validation in progress...",
        noValidationAvailable: "No validation available",
        invalidSelection: "Invalid selection",
        invalidForMove: "Invalid selection for move",
        moveAction: "Move",
        total: "in total",
        to: "to",
        readyToMove: "Ready to move",
        target: {
          tab: "a tab",
          section: "a section",
          tactic: "a tactic",
          placement: "a placement"
        }
      },
      buttons: {
        move: "Move",
        invalid: "Invalid"
      },
      moveImpossible: {
        title: "Move impossible"
      },
      operationInProgress: "Operation in progress..."
    },
    model: {
      item: "item",
      selected: "selected",
      section: "section",
      sections: "sections",
      tactic: "tactic",
      tactics: "tactics",
      placement: "placement",
      placements: "placements",
      creative: "creative",
      creatives: "creatives"
    },
    simpleMoveModal: {
      cascade: {
        searchPlaceholder: "Search {{title}}...",
        noResultsFound: "No results found",
        noItemsAvailable: "No {{title}} available"
      },
      destinationSummary: {
        selectedDestination: "Selected Destination"
      },
      levels: {
        campaign: "Campaign",
        version: "Version",
        tab: "Tab",
        section: "Section",
        tactic: "Tactic",
        placement: "Placement"
      },
      destination: {
        title: "Move Selected Items",
        itemCount: "{{count}} item to",
        itemCount_plural: "{{count}} items to",
        a_tab: "a tab",
        a_section: "a section",
        a_tactic: "a tactic",
        a_placement: "a placement",
        totalItems: "({{count}} total item)",
        totalItems_plural: "({{count}} total items)",
        preparing: "Preparing...",
        confirmMove: "Confirm Move"
      },
      progress: {
        title: "Move in Progress...",
        description: "Please wait while we move your items.",
        itemsToProcess: "{{count}} item to process",
        itemsToProcess_plural: "{{count}} items to process"
      },
      result: {
        successTitle: "Move Successful!",
        failureTitle: "Move Failed",
        itemsMoved: "item moved",
        itemsMoved_plural: "items moved",
        itemsSkipped: "item skipped",
        itemsSkipped_plural: "items skipped",
        errors: "Errors",
        warnings: "Warnings"
      }
    },
    loading: {
      starting: 'Starting...',
      campaigns: 'Loading campaigns...',
      versions: 'Loading versions...',
      tabs: 'Loading tabs...',
      sections: 'Loading sections...',
      tactics: 'Loading tactics...',
      placements: 'Loading placements...',
      creatives: 'Loading creatives...',
      error: 'Loading error'
    },
    asyncTaxonomyUpdate: {
      status: {
        updating: "Updating taxonomies...",
        success: "Taxonomies updated successfully!",
        error: "❌ Error updating taxonomies"
      }
    },
    cacheLoading: {
      steps: {
        authVerification: "Verifying authentication",
        loadingAccessibleClients: "Loading accessible clients",
        loadingGlobalLists: "Loading global lists",
        loadingClientOverrides: "Loading client customizations",
        finalTouch: "Final touch!"
      },
      messages: {
        success: "Loading completed successfully!"
      },
      errors: {
        unknown: "Unknown error"
      }
    },
    useCampaignData: {
      error: {
        notFound: "Campaign not found",
        loadingError: "Error loading campaign"
      }
    },
    useCampaignSelection: {
      errorLoadingCampaigns: "Error loading campaigns",
      errorLoadingVersions: "Error loading versions"
    },
    dataFlow: {
      loading: {
        initialData: "Loading data...",
        refreshing: "Refreshing..."
      },
      operations: {
        unknownError: "Unknown error",
        errorDuring: "Error during"
      }
    },
    selectionValidation: {
      errors: {
        noItemSelected: "No item selected",
        missingItemsPrefix: "Missing items in hierarchy:",
        incompleteSelectionPrefix: "Incomplete selection: ",
        has: " has",
        unselectedItems: "unselected element(s).",
        missingChildrenTotal: "missing child(ren) in total.",
        incompatibleTypesPrefix: "Incompatible item types: cannot move ",
        andSeparator: " and ",
        incompatibleTypesSuffix: " together."
      },
      messages: {
        buttons: {
          invalidSelection: "Invalid Selection",
          movePrefix: "Move",
          moveTo: "to"
        },
        common: {
          totalItemsSuffix: "items in total"
        }
      },
      glossary: {
        items: {
          sections: "sections",
          tactics: "tactics",
          placements: "placements",
          creatives: "creatives"
        },
        targets: {
          tab: "a tab",
          section: "a section",
          tactic: "a tactic",
          placement: "a placement"
        },
        states: {
          selectedSingular: "selected",
          selectedPlural: "selected"
        }
      }
    },
    useShortcodes: {
      notifications: {
        loadError: "Error loading shortcodes",
        createCustomListSuccess: "Custom list created successfully",
        createCustomListError: "Error creating custom list",
        deleteCustomListSuccess: "Custom list deleted successfully",
        deleteCustomListError: "Error deleting custom list",
        addShortcodeSuccess: "Shortcode added successfully",
        addShortcodeError: "Error adding shortcode",
        removeShortcodeSuccess: "Shortcode removed successfully",
        removeShortcodeError: "Error removing shortcode",
        createShortcodeSuccess: "Shortcode created and added successfully",
        createShortcodeError: "Error creating shortcode",
        updateShortcodeSuccess: "Shortcode updated successfully",
        updateShortcodeError: "Error updating shortcode"
      }
    },
    useSimpleMoveModal: {
      errors: {
        loadCampaigns: "Error loading campaigns",
        loadVersions: "Error loading versions",
        loadTabs: "Error loading tabs",
        loadSections: "Error loading sections",
        loadTactics: "Error loading tactics",
        loadPlacements: "Error loading placements",
        missingHierarchyContext: "Missing hierarchy context to build source paths",
        noItemsInContext: "No items found in context - cannot build source paths",
        unknownError: "Unknown error"
      }
    },
    useTactiquesModals: {
      errors: {
        missingContextForModals: "Missing context for modals operation",
        errorSavingSection: "Error while saving the section",
        errorDeletingSection: "Error while deleting the section",
        missingContextForTabCreation: "Missing context for tab creation",
        errorCreatingTab: "Error while creating the tab",
        missingContextForTabRename: "Missing context for tab rename",
        errorRenamingTab: "Error while renaming the tab",
        missingContextForTabDeletion: "Missing context for tab deletion",
        errorDeletingTab: "Error while deleting the tab"
      },
      loading: {
        savingSection: "Saving section",
        deletingSection: "Deleting section",
        creatingTab: "Creating tab",
        renamingTab: "Renaming tab",
        deletingTab: "Deleting tab"
      },
      confirmations: {
        deleteSection: "Are you sure you want to delete the section \"{{sectionName}}\" and all its tactics?",
        deleteTab: "Are you sure you want to delete the tab \"{{tabName}}\" and all its data?"
      },
      prompts: {
        newTabName: "Name for the new tab:",
        newTabNameForRename: "New name for the tab:"
      },
      alerts: {
        tabNameExists: "A tab with the name \"{{tabName}}\" already exists. Please choose a different name.",
        cannotDeleteLastTab: "Cannot delete the last tab"
      }
    },
    useTactiquesCrud: {
      errors: {
        missingBaseContext: "Missing base context for order operations",
        missingContextCreateSection: "Missing context to create a section",
        missingContextUpdateSection: "Missing context to update a section",
        missingContextDeleteSection: "Missing context to delete a section",
        missingContextCreateTactic: "Missing context to create a tactic",
        missingContextUpdateTactic: "Missing context to update a tactic",
        missingContextDeleteTactic: "Missing context to delete a tactic",
        missingContextCreatePlacement: "Missing context to create a placement",
        parentSectionNotFoundForTactic: "Parent section not found for the tactic",
        missingContextUpdatePlacement: "Missing context to update a placement",
        parentHierarchyNotFoundForPlacement: "Parent hierarchy not found for the placement",
        missingContextDeletePlacement: "Missing context to delete a placement",
        missingContextCreateCreative: "Missing context to create a creative",
        parentHierarchyNotFoundForCreative: "Parent hierarchy not found for the creative",
        missingContextUpdateCreative: "Missing context to update a creative",
        fullParentHierarchyNotFoundForCreative: "Parent hierarchy (section, tactic, placement) not found for the creative",
        missingContextDeleteCreative: "Missing context to delete a creative",
        missingContextCreateTab: "Missing context to create a tab",
        missingContextRenameTab: "Missing context to rename a tab",
        missingContextDeleteTab: "Missing context to delete a tab"
      },
      defaults: {
        newSection: "New section",
        newTactic: "New tactic",
        newPlacement: "New placement",
        newCreative: "New creative",
        newTab: "New tab"
      },
      prompts: {
        newTabName: "New tab name:"
      }
    },
    tactiquesOperations: {
      errors: {
        incompleteContextForOperation: "Incomplete context for the operation",
        parentNotFoundForPlacement: "Parent section or tactic not found for the placement",
        parentContextNotFoundForPlacement: "Parent context not found for the placement",
        parentContextNotFoundForCreative: "Parent context not found for the creative",
        parentPlacementNotFoundForCreative: "Parent placement not found for the creative",
        parentTacticNotFoundForCreativePlacement: "Parent tactic not found for the creative's placement",
        parentSectionNotFoundForCreative: "Parent section not found for the creative",
        incompleteContext: "Incomplete context"
      },
      defaults: {
        newTacticLabel: "New tactic",
        newPlacementLabel: "New placement",
        newCreativeLabel: "New creative"
      }
    },
    tactiquesRefresh: {
      notifications: {
        refreshError: "❌ Error during refresh"
      }
    },
    useTactiquesSelection: {
      notifications: {
        deleteFunctionsNotConfigured: "Delete functions not configured",
        errorDeleteCreative: "Error deleting creative",
        errorDeletePlacement: "Error deleting placement",
        errorDeleteTactic: "Error deleting tactic",
        errorDeleteSection: "Error deleting section",
        deleteSuccessSingular: "item deleted successfully",
        deleteSuccessPlural: "items deleted successfully",
        deleteErrorSingular: "error during deletion",
        deleteErrorPlural: "errors during deletion",
        criticalDeleteError: "❌ Critical error during deletion",
        missingContextDuplication: "❌ Missing context for duplication",
        duplicateSuccessSingular: "item duplicated successfully",
        duplicateSuccessPlural: "items duplicated successfully",
        unknownDuplicationError: "Unknown error during duplication",
        duplicationError: "❌ Duplication error:",
        criticalDuplicationError: "❌ Critical error during duplication"
      },
      deleteConfirm: {
        areYouSure: "Are you sure you want to delete the",
        selectedItems: "selected items?",
        irreversibleWarning: "⚠️ This action is irreversible and will also delete all child elements."
      }
    },
    useTaxonomyForm: {
      errors: {
        loadTaxonomies: "Error loading taxonomies."
      }
    },
    updateTaxonomies: {
      updateFailed: "Failed to update taxonomies."
    },
    useUpdateTaxonomiesAfterMove: {
      errors: {
        fetchShortcode: "❌ Error fetching shortcode",
        fetchCustomCode: "❌ Error fetching custom code",
        missingClientId: "❌ Missing ClientId",
        missingCampaignId: "❌ Missing CampaignId",
        campaignNotFound: "❌ Campaign not found",
        emptyCampaignData: "❌ Empty campaign data",
        placementError: "❌ Placement error",
        creativeError: "❌ Creative error",
        generalError: "❌ [UpdateTaxonomiesAfterMove] Error:",
        regenerationFailed: "Taxonomy regeneration after move failed."
      },
      warnings: {
        unknownSource: "Unknown source for variable"
      }
    },
    duplicateTemplate: {
      unauthenticatedUser: "User not authenticated",
      tokenNotRetrieved: "Access token not retrieved from Firebase Auth",
      insufficientPermissions: "Insufficient permissions to duplicate the file. Check that the template is correctly shared with your Google account.",
      templateNotFound: "Template not found. Check the template URL.",
      driveApiError: "Drive API Error:",
      invalidTemplateUrl: "Invalid template URL. Could not extract file ID.",
      accessTokenError: "Could not get Google Drive access token",
      unknownError: "Unknown error during duplication"
    },
    useGenerateDoc: {
      auth: {
        notAuthenticated: "User not authenticated",
        tokenNotRetrieved: "Access token not retrieved"
      },
      error: {
        invalidSheetUrl: "Invalid Google Sheet URL",
        tokenNotObtained: "Could not get access token",
        httpError: "HTTP Error",
        insufficientPermissions: "Insufficient permissions. Check access to the Google Sheet.",
        sheetOrTabNotFound: "Google Sheet or tab not found.",
        apiError: "API Error:",
        unknownError: "Unknown error"
      }
    },
    unlinkDoc: {
      error: {
        notAuthenticated: "User not authenticated",
        tokenNotRetrieved: "Access token not retrieved from Firebase Auth",
        googleAuth: "Error during Google authentication:",
        insufficientPermissions: "Insufficient permissions to duplicate the file.",
        documentNotFound: "Document not found. Please check the document URL.",
        driveApi: "Drive API Error:",
        fetchSheets: "Error fetching sheets:",
        deleteSheets: "Error deleting sheets:",
        convertFormulas: "Error converting formulas:",
        invalidUrl: "Invalid document URL. Could not extract file ID.",
        tokenAccessFailed: "Could not get Google access token",
        unknown: "Unknown error during unlinking",
        unlinkProcess: "Document unlinking error:"
      },
      common: {
        user: "User"
      }
    },
    useCombinedDocExport: {
      error: {
        popupBlocked: "🚫 Pop-ups are blocked by your browser.",
        unauthorizedDomain: "Domain not authorized for Google authentication. Contact the administrator.",
        operationNotAllowed: "Google sign-in disabled. Contact the administrator.",
        networkRequestFailed: "Network connection problem. Check your internet connection and try again.",
        sessionExpired: "Session expired. Please log in again and retry.",
        googleAuthGenericStart: "Google authentication error:",
        googleAuthGenericEnd: "Please try again or contact support.",
        unauthenticated: "User not authenticated",
        accessTokenNotRetrieved: "Access token not retrieved",
        accessTokenWriteFailed: "Could not get access token for writing.",
        insufficientPermissions: "Insufficient permissions. Check access to the Google Sheet.",
        sheetOrTabNotFoundStart: "Google Sheet or tab",
        sheetOrTabNotFoundEnd: "not found.",
        apiError: "Sheets API Error:",
        accessTokenClearFailed: "Could not get access token for clearing.",
        insufficientClearPermissions: "Insufficient permissions to clear the Google Sheet.",
        sheetOrTabNotFoundCleaningEnd: "not found during cleanup.",
        apiClearError: "Sheets API error during cleanup:",
        tabSyncFailed: "Tab synchronization failed",
        tabSyncError: "Error during tab synchronization",
        unauthenticatedConnect: "User not authenticated. Please log in.",
        invalidSheetUrl: "Invalid Google Sheet URL.",
        missingDataAfterExtraction: "Missing data after extraction.",
        campaignShortcodeConversion: "Error converting campaign shortcodes.",
        hierarchyShortcodeConversion: "Error converting hierarchy shortcodes.",
        multipleWritesFailed: "One or more writes to Google Sheets failed.",
        unknownExportError: "Unknown error during combined export."
      }
    },
    useCreateDocument: {
      progress: {
        validationStep: "Validation",
        validatingData: "Validating data...",
        fetchingTemplateInfo: "Retrieving template information...",
        fetchingCampaignInfo: "Retrieving campaign information...",
        fetchingVersionInfo: "Retrieving version information...",
        fetchingClientInfo: "Retrieving client information...",
        tabsStep: "Tabs",
        duplicatingTabs: "Duplicating tabs according to campaign structure...",
        injectionStep: "Injection",
        extractingCampaignData: "Extracting campaign data...",
        duplicationStep: "Duplication",
        duplicatingTemplate: "Duplicating template",
        savingStep: "Saving",
        creatingDatabaseEntry: "Creating database entry...",
        injectingData: "Injecting data into the document...",
        finishedStep: "Finished",
        documentCreatedSuccessfully: "Document created successfully!"
      },
      error: {
        documentNameExistsStart: "A document with the name ",
        documentNameExistsEnd: " already exists for this version.",
        templateNotFound: "Template not found.",
        campaignNotFound: "Campaign not found.",
        versionNotFound: "Version not found.",
        cannotExtractSheetId: "Could not extract Google Sheet ID for tab duplication",
        tabsDuplicationFailed: "Tab duplication failed",
        tabsDuplicationError: "Error during tab duplication",
        dataInjectionError: "Error during data injection",
        unknownInjectionError: "Unknown error during injection",
        userNotAuthenticated: "User not authenticated",
        templateDuplicationFailed: "Template duplication failed",
        unknownCreationError: "Unknown error during document creation"
      }
    },
    editUserModal: {
      title: "Edit User Role",
      form: {
        newRoleLabel: "New role",
        loadingRoles: "Loading roles...",
        noRolesAvailable: "No roles available. Please create roles first.",
        selectRolePlaceholder: "Select a role",
        currentRole: "Current role",
        noRole: "No role"
      },
      permissions: {
        titlePrefix: "Permissions for role"
      },
      buttons: {
        saving: "Saving...",
        updateRole: "Update Role"
      },
      errors: {
        updateFailed: "Error updating role"
      }
    },
    invitationModal: {
      title: "Invite a user",
      form: {
        emailLabel: "Email address *",
        emailPlaceholder: "user@example.com",
        emailHelpText: "The user will receive access upon their first login",
        roleLabel: "Role *",
        loadingRoles: "Loading roles...",
        noRolesAvailable: "No roles available. Please create roles first.",
        selectRolePlaceholder: "Select a role",
        roleHelpText: "This role will determine the user's permissions"
      },
      info: {
        expiration: "💡 The invitation will automatically expire in 7 days if the user does not log in."
      },
      buttons: {
        sending: "Sending...",
        send: "Send invitation"
      },
      alerts: {
        emailRequired: "Email address is required",
        roleRequired: "Role is required",
        invalidEmail: "Please enter a valid email address",
        sendError: "Error sending invitation"
      }
    },
    permissionsTab: {
      title: "Permission Management",
      newRole: "New Role",
      table: {
        role: "Role",
        actions: "Actions"
      },
      permissions: {
        access: "Access",
        clientInfo: "Client Info",
        costGuide: "Cost Guide",
        currency: "Currency",
        customCodes: "Custom Codes",
        dimensions: "Dimensions",
        fees: "Fees",
        lists: "Lists",
        taxonomy: "Taxonomy",
        templates: "Templates"
      },
      actions: {
        editRole: "Edit role",
        deleteRole: "Delete role"
      },
      notifications: {
        confirmDelete: "Are you sure you want to delete the role \"{{roleName}}\"?",
        deleteError: "Error deleting role"
      },
      emptyState: {
        noRoles: "No roles configured",
        createFirstRole: "Create your first role"
      }
    },
    roleFormModal: {
      title: {
        edit: "Edit Role",
        new: "New Role"
      },
      labels: {
        roleName: "Role Name *",
        permissions: "Permissions"
      },
      placeholders: {
        roleName: "Enter the role name"
      },
      permissions: {
        access: "Access",
        clientInfo: "Client Information",
        costGuide: "Cost Guide",
        currency: "Currencies",
        customCodes: "Custom Codes",
        dimensions: "Dimensions",
        fees: "Fees",
        lists: "Lists",
        taxonomy: "Taxonomy",
        templates: "Templates"
      },
      buttons: {
        saving: "Saving..."
      },
      alerts: {
        nameRequired: "The role name is required",
        saveError: "Error while saving the role"
      }
    },
    usersTab: {
      errors: {
        cannotEditInvitation: "Cannot change the role of an invitation. The user must log in first.",
        userNotConnected: "User not logged in",
        userDeletionFailed: "Error while deleting the user"
      },
      confirm: {
        deactivateUser: "Are you sure you want to deactivate the user",
        deleteInvitation: "Are you sure you want to delete the invitation for"
      },
      status: {
        active: "Active",
        invited: "Invited",
        expired: "Expired"
      },
      header: {
        title: "User Management",
        subtitle: "Invite new users and manage application access"
      },
      buttons: {
        inviteUser: "Invite user",
        clearSearch: "Clear search",
        inviteAUser: "Invite a user"
      },
      stats: {
        activeUsers: "Active users",
        pendingInvitations: "Pending invitations",
        expiredInvitations: "Expired invitations",
        total: "Total"
      },
      search: {
        placeholder: "Search by name, email, or role...",
        resultsFound: "result(s) found for"
      },
      table: {
        header: {
          user: "User",
          status: "Status",
          role: "Role",
          invitedOn: "Invited on",
          acceptedOn: "Accepted on",
          invitedBy: "Invited by",
          actions: "Actions"
        }
      },
      actions: {
        editRole: "Edit role",
        resendInvitation: "Resend invitation",
        deactivateUser: "Deactivate user",
        deleteInvitation: "Delete invitation"
      },
      noResults: {
        title: "No results",
        description: "No user matches your search for"
      },
      emptyState: {
        title: "No users",
        description: "Start by inviting your first user."
      },
      invitationInfo: {
        title: "About invitations",
        description: "Invited users will automatically receive access upon their first login with Google. Invitations expire after 7 days and can be resent if necessary."
      }
    },
    table: {
      // Search and navigation
      search: {
        sections: "Search sections...",
        tactiques: "Search tactics...",
        placements: "Search placements...",
        creatifs: "Search creatives..."
      },
      
      // Toolbar
      toolbar: {
        hideLevels: "Hide child levels",
        clearSort: "Clear sort"
      },
      
      // Levels/entities
      levels: {
        sections: "sections",
        tactiques: "tactics", 
        placements: "placements",
        creatifs: "creatives"
      },
      
      // Contextual help
      help: {
        selection: {
          title: "Selection",
          description: "1 click = select • Shift+Click = multiple selection"
        },
        editing: {
          title: "Editing", 
          description: "Double-click to edit • Enter/Tab = save • Esc = cancel"
        },
        copy: {
          title: "Copy",
          description: "Ctrl+C to copy • Ctrl+V to paste"
        },
        budget: {
          title: "Budget",
          description: "Calculations use the same logic as the drawer"
        },
        columns: {
          title: "Dynamic columns",
          description: "Columns change based on selected taxonomies"
        }
      },
      
      // Footer
      footer: {
        rows: "rows"
      },
      
      // Selection
      selection: {
        cellsSelected: "cells selected"
      },
      
      // Validation
      validation: {
        errors: "validation errors",
        invalidValue: "Invalid value",
        invalidValueFor: "Invalid value for {{field}}",
        noMatchingOption: "\"{{value}}\" does not match any available option",
        invalidNumber: "\"{{value}}\" is not a valid number",
        negativeNotAllowed: "Negative numbers are not allowed",
        invalidDate: "\"{{value}}\" is not a valid date"
      },
      
      // General messages
      noResults: "No results found",
      noData: "No data to display",
      
      // Cells
      cell: {
        doubleClickToEdit: "Double-click to edit",
        doubleClickToEditField: "Double-click to edit {{field}}",
        clickToEnter: "Click to enter",
        clickToEditField: "Click to edit {{field}}",
        enterValue: "Enter {{field}}"
      },
      
      // Actions
      actions: {
        cancel: "Cancel",
        save: "Save", 
        saving: "Saving...",
        copied: "Copied",
        confirmCancelChanges: "Are you sure you want to cancel all changes?"
      },
      
      // Pending changes
      changes: {
        pending: "{{count}} pending changes"
      },
      
      // Loading
      loading: {
        startAdvancedTable: "Starting data loading for TactiquesAdvancedTableView (refactored version)",
        clientFeesLoaded: "Client fees loaded: {{count}} fees",
        clientFeesError: "Error loading client fees:",
        exchangeRatesLoaded: "Exchange rates loaded: {{count}} rates", 
        exchangeRatesError: "Error loading exchange rates:",
        currencyLoaded: "Campaign currency loaded: {{currency}}",
        currencyError: "Error loading campaign currency:",
        fieldError: "Error loading {{field}}",
        bucketsError: "Error loading buckets:",
        completedAdvancedTable: "Loading completed for TactiquesAdvancedTableView (refactored version)",
        generalError: "Error loading data",
        loadingData: "Loading {{type}} data"
      },
      
      // Budget
      budget: {
        mediaBudget: "Media budget",
        clientBudget: "Client budget",
        validatingTactic: "Validating budget for tactic {{id}}",
        validationFailed: "Budget validation failed for {{id}}",
        validationSuccess: "Budget validation successful for {{id}}",
        updateError: "Error updating tactic with budget",
        feeNotFound: "Fee #{{number}} not found",
        noOption: "No option",
        disable: "Disable",
        enable: "Enable", 
        selectOption: "Select an option",
        enableToSelect: "Enable fee to select",
        optionPlaceholder: "-- Option --",
        customValue: "Custom value",
        fixedValue: "Fixed value",
        autoCalculatedAmount: "Auto-calculated amount",
        autoCalculated: "Auto-calculated",
        feeColumnsCreated: "{{count}} fee columns created"
      },
      
      // Taxonomy
      taxonomy: {
        placementUpdateError: "Error updating placement with taxonomies",
        triggeringUpdates: "Triggering taxonomy updates for {{count}} entity(ies)",
        updatesCompleted: "Taxonomy updates completed"
      },
      
      // Save
      save: {
        errorWithBudget: "Error saving with budget",
        generalError: "Error saving:"
      },
      
      // Copy/Paste
      copy: {
        empty: "(empty)"
      },
      
      paste: {
        result: "{{applied}} cell(s) updated, {{errors}} validation error(s)"
      },
      
      // Hierarchy
      hierarchy: {
        unnamedSection: "Unnamed section",
        unnamedTactic: "Unnamed tactic",
        unnamedPlacement: "Unnamed placement", 
        unnamedCreative: "Unnamed creative",
        unnamedElement: "Unnamed element"
      },
      
      // Selection
      select: {
        placeholder: "-- Select --"
      }
    },
    tabs: {
      tactique: {
        info: "Info",
        strategy: "Strategy", 
        budget: "Budget",
        admin: "Admin"
      },
      placement: {
        info: "Info",
        taxonomy: "Taxonomy"
      },
      creatif: {
        info: "Info",
        taxonomy: "Taxonomy",
        specs: "Specs"
      }
    },
    columns: {
      structure: "Structure",
      
      section: {
        name: "Section name"
      },
      
      tactique: {
        label: "Label",
        bucket: "Bucket",
        mpa: "MPA",
        startDate: "Start date",
        endDate: "End date",
        lob: "Line of business",
        mediaType: "Media type",
        publisher: "Publisher",
        inventory: "Inventory", 
        marketOpen: "Market description",
        targetingOpen: "Audience description",
        productOpen: "Product description",
        formatOpen: "Format description",
        locationOpen: "Location description",
        frequency: "Frequency",
        market: "Market",
        language: "Language",
        buyingMethod: "Buying method",
        customDim1: "Custom dimension 1",
        customDim2: "Custom dimension 2", 
        customDim3: "Custom dimension 3",
        numberCreative: "Number of suggested creatives",
        assetDate: "Creative delivery date",
        budgetMode: "Input mode",
        budgetInput: "Input budget",
        buyCurrency: "Buy currency",
        unitType: "Unit type",
        unitPrice: "Cost per unit",
        unitVolume: "Unit volume",
        mediaBudget: "Media budget",
        clientBudget: "Client budget",
        mediaValue: "Real value",
        bonification: "Bonus",
        currencyRate: "Exchange rate",
        billingId: "Billing number",
        po: "PO"
      },
      
      placement: {
        label: "Placement name",
        startDate: "Start date",
        endDate: "End date",
        taxonomyTags: "Taxonomy for tags",
        taxonomyPlatform: "Taxonomy for platform", 
        taxonomyMediaOcean: "Taxonomy for MediaOcean",
        product: "Product",
        location: "Location",
        audienceDemographics: "Demographics",
        device: "Device",
        targeting: "Targeting"
      },
      
      creatif: {
        label: "Creative name",
        startDate: "Start date",
        endDate: "End date",
        taxonomyTags: "Taxonomy for tags",
        taxonomyPlatform: "Taxonomy for platform",
        taxonomyMediaOcean: "Taxonomy for MediaOcean",
        product: "Product",
        audienceDemographics: "Demographics",
        device: "Device",
        targeting: "Targeting",
        specName: "Spec name",
        specFormat: "Format",
        specRatio: "Ratio",
        specFileType: "File type",
        specMaxWeight: "Max weight",
        specWeight: "Weight",
        specAnimation: "Animation",
        specTitle: "Title",
        specText: "Text",
        specSheetLink: "Spec sheet link",
        specNotes: "Notes"
      }
    },
    options: {
      currency: {
        cad: "CAD ($)",
        usd: "USD ($)",
        eur: "EUR (€)",
        chf: "CHF"
      },
      
      budgetChoice: {
        client: "Client budget",
        media: "Media budget"
      }
    },
    fields: {
      placement: {
        audienceBehaviour: "Audience Behavior",
        audienceDemographics: "Audience Demographics", 
        audienceEngagement: "Audience Engagement",
        audienceInterest: "Audience Interest",
        audienceOther: "Audience Other",
        creativeGrouping: "Creative Grouping",
        device: "Device",
        channel: "Channel",
        format: "Format",
        language: "Language",
        marketDetails: "Market Details",
        product: "Product",
        segmentOpen: "Segment Open",
        tacticCategory: "Tactic Category",
        targeting: "Targeting",
        placementLocation: "Placement Location",
        customDim1: "Custom Dimension 1",
        customDim2: "Custom Dimension 2", 
        customDim3: "Custom Dimension 3",
        label: "Label",
        order: "Order",
        tactiqueId: "Tactic ID",
        taxonomyTags: "Taxonomy Tags",
        taxonomyPlatform: "Taxonomy Platform",
        taxonomyMediaOcean: "Taxonomy MediaOcean"
      },
      
      creatif: {
        customDim1: "Custom Dimension 1",
        customDim2: "Custom Dimension 2",
        customDim3: "Custom Dimension 3",
        cta: "Call to Action",
        formatDetails: "Format Details",
        offer: "Offer",
        platformName: "Platform Name",
        primaryProduct: "Primary Product",
        url: "URL",
        version: "Version",
        label: "Label",
        order: "Order",
        placementId: "Placement ID",
        startDate: "Start Date",
        endDate: "End Date",
        sprintDates: "Sprint Dates",
        taxonomyTags: "Taxonomy Tags",
        taxonomyPlatform: "Taxonomy Platform",
        taxonomyMediaOcean: "Taxonomy MediaOcean",
        specPartnerId: "Partner ID",
        specSelectedSpecId: "Selected Spec ID",
        specName: "Spec Name",
        specFormat: "Spec Format",
        specRatio: "Aspect Ratio",
        specFileType: "File Type",
        specMaxWeight: "Max Weight",
        specWeight: "Weight",
        specAnimation: "Animation",
        specTitle: "Title",
        specText: "Text",
        specSheetLink: "Spec Sheet Link",
        specNotes: "Notes"
      }
    },
    tactiquesPage: {
      header: {
        title: "Tactics",
        refreshTooltip: "Refresh data"
      },
      notifications: {
        duplicationInProgress: "Duplication in progress...",
        deletionInProgress: "Deletion in progress...",
        loadingClientFees: "Loading client fees..."
      },
      error: {
        loadingTitle: "Loading error",
        retry: "Retry"
      },
      loader: {
        loadingTactics: "Loading tactics..."
      },
      actions: {
        newSection: "New section"
      },
      selection: {
        selectedSingular: "selected",
        selectedPlural: "selected"
      },
      emptyState: {
        noSectionsFound: "No sections found for this tab. Create a new section to get started.",
        selectCampaignAndVersion: "Please select a campaign and a version to see the tactics."
      },
      statistics: {
        placement: "placement",
        creative: "creative"
      }
    },
    clientTaxonomies: {
      errors: {
        loadFailed: "Failed to load taxonomies.",
        addFailed: "Failed to add taxonomy.",
        updateFailed: "Failed to update taxonomy.",
        deleteFailed: "Failed to delete taxonomy.",
        replaceFailed: "An error occurred during replacement.",
        searchFailed: "An error occurred during the search."
      },
      success: {
        added: "Taxonomy added successfully.",
        updated: "Taxonomy updated successfully.",
        deleted: "Taxonomy deleted successfully.",
        replacementsMade: "{count} replacements were made."
      },
      info: {
        noneFound: "No matching text was found."
      },
      confirm: {
        delete: "Are you sure you want to delete this taxonomy?"
      },
      selectClientPrompt: "Please select a client to view their taxonomies.",
      header: {
        title: "Client Taxonomies"
      },
      buttons: {
        searchAndReplace: "Search & Replace",
        add: "Add Taxonomy",
        replace: "Replace"
      },
      permissions: {
        cannotModify: "You do not have permission to modify.",
        cannotAdd: "You do not have permission to add.",
        cannotDelete: "You do not have permission to delete.",
        readOnly: "You have read-only access to taxonomies."
      },
      loading: {
        taxonomies: "Loading taxonomies..."
      },
      emptyState: {
        noTaxonomies: "No taxonomies were found for this client."
      },
      details: {
        standard: "Standard",
        custom: "Custom",
        description: "Description",
        noDescription: "No description provided.",
        taxonomyLevels: "Taxonomy Structure",
        level: "Level {{level}}",
        title: "Title",
        name: "Name"
      },
      form: {
        editTitle: "Edit Taxonomy",
        addTitle: "Add New Taxonomy"
      },
      searchModal: {
        title: "Search in Taxonomies",
        searchLabel: "Text to search for",
        searchPlaceholder: "Enter text to find...",
        searching: "Searching...",
        results: "Search Results {{count}}",
        foundIn: "Found in",
        noResults: "No results found for your search."
      },
      searchReplaceModal: {
        searchLabel: "Find this text",
        searchPlaceholder: "Text to find",
        replaceLabel: "Replace with this text",
        replacePlaceholder: "Replacement text (leave empty to delete)",
        replacing: "Replacing..."
      }
    },
    taxonomyForm: {
      generalInfo: {
        title: "General Information",
        displayNameLabel: "Display Name*",
        standardTaxonomyLabel: "Standard Taxonomy",
        noStandardTaxonomy: "None (custom)",
        descriptionLabel: "Description",
      },
      help: {
        title: "Special Functions",
        baseVariables: {
          title: "Base Variables",
          copyButton: "Copy",
          copyCharactersButton: "Copy characters",
          description: "Insert your variables with the desired format.",
        },
        concatenation: {
          title: "Concatenation",
          description: "Displays delimiters only if the variables have values",
          example: 'Example: <[CR_CTA]-[CR_Offer]-[PL_Format]> → "ABC-DEF" instead of "ABC--DEF"',
        },
        lowercase: {
          title: "Lowercase Conversion",
          description: "Converts all content to lowercase letters.",
          example: "Example: ▶FACEBOOK◀ → facebook",
        },
        specialChars: {
          title: "Special Character Cleanup",
          description: "Removes special characters, converts accents (é→e), replaces spaces and _ with dashes.",
          example: "Example: 〔Café & Co_Ltd!〕 → cafe-co-ltd",
        },
        conditionalReplacement: {
          title: "Conditional Replacement",
          description: 'First occurrence: displays the content. Subsequent occurrences: replaces with "&".',
          example: "Example: www.taxo?fun.com〈?〉utm_medium... → www.taxo?fun.com&utm_medium...",
        },
      },
      levels: {
        title: "Taxonomy Levels",
        level: "Level",
        resetToDefaultTooltip: "Reset to standard value",
        resetButton: "Reset",
        levelTitleLabel: "Title",
        structureLabel: "Structure",
        addVariableButton: "Variable",
      },
      variableMenu: {
        filterPlaceholder: "Filter variables...",
        noVariableFound: "No variable found",
        formatFor: "Format for",
      },
      tooltips: {
        unknownVariable: "Unknown variable",
        invalidFormat: "Invalid format for this variable",
        missingFormat: "Missing format - use variable:format",
        variableLabel: "Variable",
        formatLabel: "Format",
      },
    },
  }
};