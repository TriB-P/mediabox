// Chemin du fichier : app/aide/page.tsx
'use client';

// Importe les hooks et composants nécessaires de React
import { useState, Fragment } from 'react';
// Importe le composant Tab de Headless UI pour gérer les onglets
import { Tab } from '@headlessui/react';
// Importe diverses icônes de la bibliothèque Lucide React
import {
  HelpCircle,
  ChevronDownIcon,
  Search,
  Globe,
  CalendarCheck,
  DollarSign,
  Layers,
  FileText,
  Users,
  Settings,
  Shield,
  LayoutDashboard,
  LineChart,
  Mail, // Icône pour l'e-mail
  Clipboard, // Icône pour copier
  Check, // Icône pour indiquer que quelque chose est copié
} from 'lucide-react';

// --- Les données sur les FAQ (Foire Aux Questions) ---
// C'est un tableau d'objets, où chaque objet représente une catégorie de FAQ.
const faqData = [
  {
    id: 'campagnes', // Identifiant unique pour la catégorie
    name: 'Campagnes', // Nom affiché de la catégorie
    icon: LayoutDashboard, // Icône associée à la catégorie
    faqs: [
      // Tableau des questions/réponses pour cette catégorie
      {
        id: 'c-q1',
        question: `Comment les gnous organisent-ils leur "campagne" de migration ?`,
        answer: `La grande migration des gnous est l'une des plus spectaculaires au monde. Ce n'est pas une campagne planifiée par un chef, mais un mouvement instinctif collectif dicté par les pluies. Ils suivent les orages à la recherche d'herbe fraîche, parcourant plus de 1 000 km en boucle chaque année entre la Tanzanie et le Kenya.`,
      },
      {
        id: 'c-q2',
        question: `Quelle est la "campagne" de chasse du lion ?`,
        answer: `Les lionnes mènent la majorité des campagnes de chasse, souvent en groupe. Elles utilisent des stratégies coordonnées, certaines rabattant la proie vers d'autres cachées en embuscade. Cette coopération augmente considérablement leurs chances de succès.`,
      },
    ],
  },
  {
    id: 'strategie',
    name: 'Stratégie',
    icon: LineChart,
    faqs: [
      {
        id: 's-q1',
        question: `Quelle est la stratégie de chasse des orques ?`,
        answer: `Les orques (ou épaulards) sont des stratèges incroyablement intelligents. Une de leurs techniques est le 'lavage de vagues' : elles nagent en formation pour créer une grande vague qui fait tomber les phoques d'un morceau de banquise, les rendant vulnérables.`,
      },
      {
        id: 's-q2',
        question: `Comment la stratégie du caméléon fonctionne-t-elle ?`,
        answer: `La stratégie principale du caméléon est le camouflage. Contrairement à la croyance populaire, il ne change pas de couleur pour se fondre dans le décor, mais plutôt pour communiquer, réguler sa température ou en réponse à ses émotions. Son camouflage est sa couleur de base au repos.`,
      },
    ],
  },
  {
    id: 'tactiques',
    name: 'Tactiques',
    icon: Layers,
    faqs: [
      {
        id: 't-q1',
        question: `Quelle est la tactique de chasse unique du poisson archer ?`,
        answer: `Le poisson archer a une tactique de chasse remarquable : il crache un jet d'eau puissant et précis sur les insectes se trouvant sur des feuilles au-dessus de l'eau. Le jet fait tomber l'insecte dans l'eau, où le poisson peut le dévorer.`,
      },
    ],
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: FileText,
    faqs: [
      {
        id: 'd-q1',
        question: `Les éléphants ont-ils vraiment une mémoire exceptionnelle ?`,
        answer: `Oui, la mémoire des éléphants est légendaire et scientifiquement prouvée. Elle est cruciale pour leur survie. La matriarche du troupeau utilise sa mémoire pour se souvenir de l'emplacement des points d'eau et des zones de nourriture, guidant sa famille sur de longues distances, surtout pendant les sécheresses.`,
      },
    ],
  },
  {
    id: 'guide-de-couts',
    name: 'Guide de Coûts',
    icon: DollarSign,
    faqs: [
      {
        id: 'g-q1',
        question: `Quel est le "coût énergétique" du vol du colibri ?`,
        answer: `Le colibri a l'un des métabolismes les plus rapides du règne animal. Pour maintenir leur vol stationnaire et battre des ailes jusqu'à 80 fois par seconde, ils doivent consommer l'équivalent de la moitié de leur poids en nectar chaque jour. Le coût énergétique est si élevé qu'ils sont constamment au bord de la famine.`,
      },
    ],
  },
  {
    id: 'partenaires',
    name: 'Partenaires',
    icon: Users,
    faqs: [
      {
        id: 'p-q1',
        question: `Quel est le partenariat entre le poisson-clown et l'anémone de mer ?`,
        answer: `C'est un exemple classique de symbiose. L'anémone, avec ses tentacules urticants, protège le poisson-clown des prédateurs. En retour, le poisson-clown nettoie l'anémone, la défend contre ses propres prédateurs (comme les poissons-papillons) et peut même lui apporter de la nourriture.`,
      },
    ],
  },
  {
    id: 'client',
    name: 'Client',
    icon: Settings,
    faqs: [
      {
        id: 'cl-q1',
        question: `Pourquoi les chiens sont-ils considérés comme les "meilleurs amis" de l'homme ?`,
        answer: `La relation entre les chiens et les humains est le fruit de milliers d'années de domestication. Les chiens ont évolué pour comprendre nos gestes et nos émotions. En retour, nous leur fournissons nourriture, abri et sécurité. Ce partenariat unique a permis aux deux espèces de prospérer.`,
      },
    ],
  },
  {
    id: 'admin',
    name: 'Admin',
    icon: Shield,
    faqs: [
      {
        id: 'a-q1',
        question: `Comment la hiérarchie est-elle administrée dans une meute de loups ?`,
        answer: `Une meute de loups est généralement une famille administrée par un couple reproducteur, appelé le couple alpha. Ils dirigent les chasses, choisissent le territoire et sont généralement les seuls à se reproduire. Les autres membres de la meute ont des rôles définis qui contribuent à la survie du groupe.`,
      },
    ],
  },
];

// --- Composant FaqItem : Affiche une seule question/réponse de FAQ ---
// Il reçoit les props suivantes :
// - item: L'objet question/réponse
// - index: L'index de la question dans sa liste (pour l'affichage du numéro)
// - isOpen: Un booléen qui indique si la réponse est ouverte ou fermée
// - onToggle: Une fonction à appeler lorsque le bouton de la question est cliqué
function FaqItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: any;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200">
      {/* Bouton pour ouvrir/fermer la réponse */}
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-start py-4 text-left"
      >
        <div className="flex items-start">
          {/* Numéro de la question */}
          <span className="mr-3 text-lg font-semibold text-indigo-600">
            {index + 1}.
          </span>
          {/* Texte de la question */}
          <span className="text-md font-medium text-gray-800">
            {item.question}
          </span>
        </div>
        {/* Icône de flèche qui tourne quand la réponse est ouverte */}
        <ChevronDownIcon
          className={`h-5 w-5 text-gray-500 transition-transform duration-300 mt-1 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>
      {/* Conteneur de la réponse, visible ou masqué selon `isOpen` */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96' : 'max-h-0' // max-h-96 est une valeur arbitraire pour permettre l'animation
        }`}
      >
        <div className="pb-4 pl-10 pr-6 text-gray-600">
          <p>{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

// --- Composant Principal de la Page d'Aide ---
export default function AidePage() {
  // État pour savoir quelle question est ouverte (null si aucune)
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  // État pour le terme de recherche dans la barre de recherche
  const [searchTerm, setSearchTerm] = useState('');
  // État pour l'icône de copie (indique si l'e-mail a été copié)
  const [copied, setCopied] = useState(false);

  // Fonction pour basculer l'état d'ouverture d'une question
  const handleToggleQuestion = (id: string) => {
    setOpenQuestionId((prevId) => (prevId === id ? null : id));
  };

  // Fonction pour copier l'e-mail dans le presse-papiers
  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText('mediabox@pluscompany.com').then(
      () => {
        setCopied(true); // Active l'état "copié"
        setTimeout(() => setCopied(false), 2000); // Le réinitialise après 2 secondes
      },
      (err) => {
        console.error("Impossible de copier l'e-mail : ", err); // Gère les erreurs de copie
      }
    );
  };

  // --- Logique de filtrage ---

  // 1. Données filtrées pour les onglets :
  // Chaque catégorie contient uniquement les FAQ qui correspondent au terme de recherche.
  // Si searchTerm est vide, toutes les FAQ sont incluses.
  const filteredDataForTabs = faqData.map((category) => ({
    ...category,
    faqs: category.faqs.filter(
      (item) =>
        !searchTerm || // Si pas de recherche, on garde toutes les FAQ
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) || // Recherche dans la question
        item.answer.toLowerCase().includes(searchTerm.toLowerCase()) // Recherche dans la réponse
    ),
  }));

  // 2. Données pour la liste unifiée de résultats de recherche :
  // Cette liste est créée SEULEMENT si un terme de recherche est actif.
  // Elle "aplatit" toutes les FAQ de toutes les catégories qui correspondent à la recherche,
  // et ajoute le nom et l'icône de la catégorie à chaque élément pour l'affichage.
  const unifiedSearchResults = searchTerm.trim()
    ? faqData.flatMap((category) =>
        category.faqs
          .filter(
            (item) =>
              item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.answer.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((item) => ({
            ...item,
            categoryName: category.name, // Ajoute le nom de la catégorie
            categoryIcon: category.icon, // Ajoute l'icône de la catégorie
          }))
      )
    : []; // Si pas de recherche, cette liste est vide

  return (
    <div className="p-6 space-y-12 pb-24"> {/* Ajoute un padding-bottom pour laisser de la place à l'encadré fixe */}
      {/* SECTION DU HAUT AVEC TITRE ET RECHERCHE */}
      <div className="relative text-center">
        {/* Titre principal de la page */}
        <h1 className="text-4xl font-bold text-gray-900 inline-block">
          Comment pouvons-nous vous aider ?
        </h1>

        {/* Description et barre de recherche */}
        <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
          Posez une question ou parcourez les catégories pour trouver des
          réponses.
        </p>

        <div className="mt-8 max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une question..."
              className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* --- Le système d'onglets est TOUJOURS visible --- */}
      <div className="w-full">
        {/* Composant Tab.Group de Headless UI pour gérer les onglets */}
        <Tab.Group>
          {/* Liste des onglets */}
          <Tab.List className="flex space-x-1 rounded-xl bg-[#EBF5FF] p-1 overflow-x-auto">
            {faqData.map((category) => {
              const Icon = category.icon; // Récupère l'icône de la catégorie
              return (
                <Tab
                  key={category.name}
                  // Applique des styles différents selon que l'onglet est sélectionné ou non
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2
                    ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2
                    ${
                      selected
                        ? 'bg-white text-indigo-700 shadow' // Style si sélectionné
                        : 'text-blue-900 hover:bg-white/[0.50]' // Style si non sélectionné
                    }`
                  }
                >
                  <Icon className="h-5 w-5" /> {/* Affiche l'icône */}
                  {category.name} {/* Affiche le nom de la catégorie */}
                </Tab>
              );
            })}
          </Tab.List>

          {/* Panneaux de contenu des onglets */}
          <Tab.Panels className="mt-4">
            {/* On utilise les données filtrées POUR les onglets ici */}
            {filteredDataForTabs.map((category, idx) => (
              <Tab.Panel
                key={idx}
                className="rounded-xl bg-white p-3 ring-white/60 ring-offset-2 focus:outline-none focus:ring-2"
              >
                <div className="space-y-2">
                  {category.faqs.length > 0 ? ( // Vérifie s'il y a des FAQ dans la catégorie filtrée
                    category.faqs.map((item, itemIndex) => (
                      <FaqItem
                        key={item.id}
                        item={item}
                        index={itemIndex}
                        isOpen={openQuestionId === item.id}
                        onToggle={() => handleToggleQuestion(item.id)}
                      />
                    ))
                  ) : (
                    // Message si aucune question ne correspond dans cette catégorie
                    <div className="text-center py-8 text-gray-500">
                      Aucune question ne correspond à votre recherche dans cette
                      catégorie.
                    </div>
                  )}
                </div>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* --- La section des résultats unifiés apparaît en dessous --- */}
      {/* Cette section n'est affichée que si le terme de recherche n'est PAS vide */}
      {searchTerm.trim() !== '' && (
        <div className="max-w-4xl mx-auto mt-12 border-t pt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Tous les résultats pour "{searchTerm}"
          </h2>
          {unifiedSearchResults.length > 0 ? ( // Vérifie s'il y a des résultats unifiés
            <div className="space-y-4">
              {unifiedSearchResults.map((item, index) => {
                const CategoryIcon = item.categoryIcon; // Récupère l'icône de la catégorie pour l'afficher
                return (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                  >
                    {/* Affiche la catégorie de la FAQ trouvée */}
                    <div
                      className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full text-sm font-semibold
                                bg-indigo-100 text-indigo-800 border border-indigo-200"
                    >
                      <CategoryIcon className="h-4 w-4" /> {/* Icône de la catégorie */}
                      <span>{item.categoryName}</span> {/* Nom de la catégorie */}
                    </div>
                    {/* Affiche la question/réponse trouvée */}
                    <FaqItem
                      item={item}
                      index={index}
                      isOpen={openQuestionId === item.id}
                      onToggle={() => handleToggleQuestion(item.id)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // Message si aucun résultat n'est trouvé dans la recherche unifiée
            <div className="text-center py-16">
              <p className="text-lg text-gray-600 font-semibold">
                Aucun résultat trouvé sur l'ensemble des catégories
              </p>
              <p className="text-gray-500 mt-2">
                Essayez de simplifier vos mots-clés ou de vérifier l'orthographe.
              </p>
            </div>
          )}
        </div>
      )}

      {/* --- NOUVEL ENCADRÉ FIXE EN BAS DE L'ÉCRAN --- */}
      {/*
        Ce bloc crée l'encadré d'information fixe en bas de l'écran.
        - `fixed`: Rend l'élément positionné de manière fixe par rapport à la fenêtre du navigateur.
        - `bottom-0`: Le positionne en bas de l'écran.
        - `left-0`: Le positionne à gauche de l'écran.
        - `right-0`: L'étend sur toute la largeur de l'écran.
        - `bg-indigo-50`: Couleur de fond très claire.
        - `border-t border-indigo-200`: Ajoute une bordure supérieure pour le séparer du contenu.
        - `p-4`: Rembourrage interne.
        - `shadow-lg`: Une ombre plus prononcée pour le faire ressortir.
        - `text-center`: Centre le texte à l'intérieur.
        - `z-50`: S'assure qu'il est au-dessus de tous les autres éléments de la page.
        - `flex items-center justify-center`: Utilise flexbox pour centrer le contenu horizontalement et verticalement.
      */}
      <div className="fixed bottom-0 left-0 right-0 bg-indigo-50 border-t border-indigo-200 p-4 shadow-lg text-center z-50 flex items-center justify-center">
        <p className="text-indigo-700 text-base font-medium flex items-center space-x-2">
          <span className="italic">pssttt!</span>
          <Mail className="h-5 w-5 flex-shrink-0" />
          <span>
            Vous ne trouvez pas la réponse à vos questions? Écrivez-nous à{' '}
            <span className="inline-flex items-center font-bold">
              mediabox@pluscompany.com
              <button
                onClick={copyEmailToClipboard}
                className="ml-2 p-1 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                title={copied ? 'Copié !' : "Copier l'e-mail"}
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Clipboard className="h-5 w-5 text-indigo-600" />
                )}
              </button>
            </span>
            😄
          </span>
        </p>
      </div>
    </div>
  );
}