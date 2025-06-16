// Chemin du fichier : app/aide/page.tsx
'use client';

// Importe les hooks et composants nécessaires de React
import { useState, Fragment, useEffect } from 'react';
// Importe le composant Tab de Headless UI pour gérer les onglets
import { Tab } from '@headlessui/react';
// Ajout de framer-motion pour les animations
import { motion, AnimatePresence } from 'framer-motion';

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
  Mail,
  Clipboard,
  Check,
  ArrowLeftCircle,
  ArrowRightCircle,
  Link2,
  X,
} from 'lucide-react';

// URL de votre Google Sheet publié en CSV
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQo6UwoIgRiWTCyEQuuX4vZU0TqKZn80SUzNQ8tQPFkHxc0P5LvkkAtxlFzQCD-S0ABwEbAf5NMbpP7/pub?gid=623482803&single=true&output=csv';

// --- Définition des types pour vos données FAQ ---
interface FaqStep {
  imageUrl: string;
  texte: string;
}

interface FaqItemData {
  ID: string;
  Catégorie: string;
  Question: string;
  Réponse: string;
  etapes: FaqStep[];
}

// --- Mappage des noms de catégories aux icônes ---
const categoryIcons: { [key: string]: React.ElementType } = {
  Campagnes: LayoutDashboard,
  Stratégie: LineChart,
  Tactiques: Layers,
  Documents: FileText,
  'Guide de Coûts': DollarSign,
  Partenaires: Users,
  Client: Settings,
  Admin: Shield,
};

// --- Définition STATIQUE des catégories de navigation ---
const STATIC_CATEGORIES = [
  { name: 'Campagnes', icon: LayoutDashboard },
  { name: 'Stratégie', icon: LineChart },
  { name: 'Tactiques', icon: Layers },
  { name: 'Documents', icon: FileText },
  { name: 'Guide de Coûts', icon: DollarSign },
  { name: 'Partenaires', icon: Users },
  { name: 'Client', icon: Settings },
  { name: 'Admin', icon: Shield },
];

// --- Composant pour surligner le texte ---
function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) {
    return <>{text}</>;
  }
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-black px-1 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}


// --- Composant CarouselEtapes amélioré avec animations ---
function CarouselEtapes({ etapes }: { etapes: FaqStep[] }) {
  const [etapeActuelle, setEtapeActuelle] = useState(0);
  const [direction, setDirection] = useState(0);

  const allerAPrecedente = () => {
    setDirection(-1);
    setEtapeActuelle((prev) => (prev === 0 ? etapes.length - 1 : prev - 1));
  };

  const allerASuivante = () => {
    setDirection(1);
    setEtapeActuelle((prev) => (prev === etapes.length - 1 ? 0 : prev + 1));
  };

  if (!etapes || etapes.length === 0) {
    return null;
  }
  
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="text-md font-semibold text-gray-800 mb-3">Procédure :</h4>
      <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg bg-gray-100">
        <div className="relative h-80 w-full bg-black flex items-center justify-center overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.img
              key={etapeActuelle}
              src={etapes[etapeActuelle].imageUrl}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute max-w-full max-h-full object-contain"
            />
          </AnimatePresence>
        </div>
        <div className="bg-black p-4">
          <p className="text-white text-sm font-medium text-center min-h-[40px]">
            {etapes[etapeActuelle].texte}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-center mt-3 space-x-6">
        <button
          onClick={allerAPrecedente}
          className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
          title="Étape précédente"
        >
          <ArrowLeftCircle className="h-8 w-8" />
        </button>
        
        <div className="text-sm font-medium text-gray-700">
          Étape {etapeActuelle + 1} / {etapes.length}
        </div>
        
        <button
          onClick={allerASuivante}
          className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
          title="Étape suivante"
        >
          <ArrowRightCircle className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
}

// --- Composant FaqItem amélioré avec animations et lien ---
function FaqItem({
  item,
  index,
  isOpen,
  onToggle,
  searchTerm
}: {
  item: FaqItemData;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  searchTerm: string;
}) {
  const [copiedLink, setCopiedLink] = useState(false);

  const copyLinkToQuestion = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}${window.location.pathname}#${item.ID}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <div className="border-b border-gray-200" id={item.ID}>
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-start py-4 text-left group"
      >
        <div className="flex items-start">
          <span className="mr-3 text-lg font-semibold text-indigo-600">
            {index + 1}.
          </span>
          <span className="text-md font-medium text-gray-800">
            <HighlightText text={item.Question} highlight={searchTerm} />
          </span>
        </div>
        <div className="flex items-center mt-1">
          {/* ---- MODIFICATION ICI ---- */}
          <button
            onClick={copyLinkToQuestion}
            title="Copier le lien vers cette question"
            className="p-1 rounded-full text-gray-400 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors"
          >
            {copiedLink ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
          </button>
          {/* ---- FIN DE LA MODIFICATION ---- */}
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-500 transition-transform duration-300 ml-2 flex-shrink-0 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-10 pr-6 text-gray-600">
              <p><HighlightText text={item.Réponse} highlight={searchTerm} /></p>
              {item.etapes && item.etapes.length > 0 && (
                <CarouselEtapes etapes={item.etapes} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// --- Composant Principal de la Page d'Aide ---
export default function AidePage() {
  const [allFaqs, setAllFaqs] = useState<FaqItemData[]>([]);
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      setOpenQuestionId(id);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [allFaqs]);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        const parsedData = parseCsv(csvText);
        setAllFaqs(parsedData);
      } catch (err) {
        console.error("Erreur lors du chargement des FAQs:", err);
        setError("Impossible de charger les FAQs. Veuillez vérifier la connexion ou l'URL du Google Sheet.");
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const parseCsv = (csvString: string): FaqItemData[] => {
    const lines = csvString.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(header => header.trim());
    const faqs: FaqItemData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      const values: string[] = [];
      let inQuote = false;
      let charBuffer = '';

      for (let j = 0; j < currentLine.length; j++) {
        const char = currentLine[j];
        if (char === '"' && inQuote && currentLine[j + 1] === '"') {
          charBuffer += '"';
          j++;
        } else if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          values.push(charBuffer);
          charBuffer = '';
        } else {
          charBuffer += char;
        }
      }
      values.push(charBuffer);

      const faqItem: any = { etapes: [] };
      headers.forEach((header, index) => {
        let value = (values[index] || '').trim();
        try {
          value = decodeURIComponent(value.replace(/\+/g, ' '));
        } catch (e) {
          console.warn(`Could not decode URI component for value: ${value}`, e);
        }
        
        const etapeMatch = header.match(/Etape (\d+) (Image|Texte)/);
        if (etapeMatch) {
          const numEtape = parseInt(etapeMatch[1], 10) - 1;
          const typeEtape = etapeMatch[2].toLowerCase();
          
          if (!faqItem.etapes[numEtape]) {
            faqItem.etapes[numEtape] = { imageUrl: '', texte: '' };
          }
          if (typeEtape === 'image') {
            faqItem.etapes[numEtape].imageUrl = value;
          } else {
            faqItem.etapes[numEtape].texte = value;
          }
        } else {
          faqItem[header] = value;
        }
      });
      
      faqItem.etapes = faqItem.etapes.filter((etape: FaqStep) => etape && etape.imageUrl && etape.texte);

      if (faqItem.ID && faqItem.Catégorie && faqItem.Question && faqItem.Réponse) {
        faqs.push(faqItem as FaqItemData);
      } else {
        console.warn('Ligne CSV ignorée en raison de champs manquants ou invalides:', faqItem);
      }
    }
    return faqs;
  };

  const handleToggleQuestion = (id: string) => {
    setOpenQuestionId((prevId) => (prevId === id ? null : id));
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText('mediabox@pluscompany.com').then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error("Impossible de copier l'e-mail : ", err);
      }
    );
  };

  const categorizedFaqsForDisplay = STATIC_CATEGORIES.map(staticCategory => {
    const categoryName = staticCategory.name;
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-').replace('é', 'e').replace('û', 'u');

    const filteredFaqsInThisCategory = allFaqs.filter(item =>
      item.Catégorie === categoryName &&
      (!searchTerm ||
        item.Question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Réponse.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return {
      id: categoryId,
      name: categoryName,
      icon: staticCategory.icon,
      faqs: filteredFaqsInThisCategory,
    };
  });

  const unifiedSearchResults = searchTerm.trim()
    ? allFaqs
        .filter(item =>
          item.Question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.Réponse.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(item => ({
          ...item,
          categoryName: item.Catégorie,
          categoryIcon: categoryIcons[item.Catégorie] || HelpCircle,
        }))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-xl text-gray-600">Chargement des FAQs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur !</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <p className="mt-4 text-gray-600">Veuillez vous assurer que le Google Sheet est correctement publié en CSV et que l'URL est correcte.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-12 pb-24">
      <div className="relative text-center">
        <h1 className="text-4xl font-bold text-gray-900 inline-block">
          Comment pouvons-nous vous aider ?
        </h1>
        <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
          Posez une question ou parcourez les catégories pour trouver des réponses.
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
              className="block w-full pl-12 pr-10 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full focus:outline-none"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-[#EBF5FF] p-1 overflow-x-auto">
            {STATIC_CATEGORIES.map((staticCategory) => {
              const Icon = staticCategory.icon;
              return (
                <Tab
                  key={staticCategory.name}
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2
                    ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2
                    ${
                      selected
                        ? 'bg-white text-indigo-700 shadow'
                        : 'text-blue-900 hover:bg-white/[0.50]'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{staticCategory.name}</span>
                </Tab>
              );
            })}
          </Tab.List>

          <Tab.Panels className="mt-4">
            {categorizedFaqsForDisplay.map((category) => (
              <Tab.Panel
                key={category.id}
                className="rounded-xl bg-white p-3 ring-white/60 ring-offset-2 focus:outline-none focus:ring-2"
              >
                <div className="space-y-2">
                  {category.faqs.length > 0 ? (
                    category.faqs.map((item, itemIndex) => (
                      <FaqItem
                        key={item.ID}
                        item={item}
                        index={itemIndex}
                        isOpen={openQuestionId === item.ID}
                        onToggle={() => handleToggleQuestion(item.ID)}
                        searchTerm={searchTerm}
                      />
                    ))
                  ) : (
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

      {searchTerm.trim() !== '' && (
        <div className="max-w-4xl mx-auto mt-12 border-t pt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Tous les résultats pour "{searchTerm}"
          </h2>
          {unifiedSearchResults.length > 0 ? (
            <div className="space-y-4">
              {unifiedSearchResults.map((item, index) => {
                const CategoryIcon = item.categoryIcon;
                return (
                  <div
                    key={item.ID}
                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                  >
                    <div
                      className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full text-sm font-semibold
                                bg-indigo-100 text-indigo-800 border border-indigo-200"
                    >
                      <CategoryIcon className="h-4 w-4" />
                      <span>{item.categoryName}</span>
                    </div>
                    <FaqItem
                      item={item}
                      index={index}
                      isOpen={openQuestionId === item.ID}
                      onToggle={() => handleToggleQuestion(item.ID)}
                      searchTerm={searchTerm}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
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