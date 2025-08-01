// app/locales/translations.ts
/**
 * Fichier de traductions pour l'application.
 * Contient toutes les traductions en français et anglais.
 */

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
        billingId: "ID Facturation (MPCPE",
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
        periodsCount: "{count} période(s)",
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
          period: "Période {number}",
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
        summaryTotalBudget: "Budget total :"
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
        days: "{count} jours"
      },
      formInfo: {
        title: "Informations générales",
        description: "Configuration de base de la campagne",
        nameLabel: "Nom de la campagne *",
        nameHelp: "Nom d'affichage principal de la campagne.",
        namePlaceholder: "Ex: Lancement estival",
        identifierLabel: "Identifiant de campagne *",
        identifierHelp: "Identifiant unique utilisé dans les taxonomies.",
        identifierPlaceholder: "Ex: BISTRO-2024-PROMOTION",
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
        periodsCount: "{count} period(s)",
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
          period: "Period {number}",
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
        summaryTotalBudget: "Total budget:"
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
        days: "{count} days"
      },
      formInfo: {
        title: "General Information",
        description: "Basic campaign configuration",
        nameLabel: "Campaign Name *",
        nameHelp: "Main display name of the campaign.",
        namePlaceholder: "Ex: Summer Launch",
        identifierLabel: "Campaign Identifier *",
        identifierHelp: "Unique identifier used in taxonomies.",
        identifierPlaceholder: "Ex: BISTRO-2024-PROMOTION",
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
    

  }
};