// Chemin du fichier : app/aide/page.tsx
'use client';

// Importe les hooks et composants nécessaires de React
import { useState, Fragment, useEffect } from 'react';
// Importe le composant Tab de Headless UI pour gérer les onglets
import { Tab } from '@headlessui/react';
// Ajout de framer-motion pour les animations
import { motion, AnimatePresence, Variants } from 'framer-motion';
// Importe le contexte de traduction
import { useTranslation } from '../contexts/LanguageContext';

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
  X,
} from 'lucide-react';

// URL de votre Google Sheet publié en CSV
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQo6UwoIgRiWTCyEQuuX4vZU0TqKZn80SUzNQ8tQPFkHxc0P5LvkkAtxlFzQCD-S0ABwEbAf5NMbpP7/pub?output=csv';

// --- Définition des types pour la nouvelle structure de données ---
interface FaqStep {
  etape: number;
  text_FR: string;
  text_EN: string;
  image_FR: string;
  image_EN: string;
}

interface FaqItemData {
  id: string;
  category_FR: string;
  category_EN: string;
  question_FR: string;
  question_EN: string;
  etapes: FaqStep[];
}

interface CategoryData {
  name_FR: string;
  name_EN: string;
  icon: React.ElementType;
}

// --- Framer Motion Variants ---
const ease: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: ease },
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: ease },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: ease },
  },
};

// --- Mappage des noms de catégories aux icônes ---
const categoryIcons: { [key: string]: React.ElementType } = {
  Campagnes: LayoutDashboard,
  Campaigns: LayoutDashboard,
  Stratégie: LineChart,
  Strategy: LineChart,
  Tactiques: Layers,
  Tactics: Layers,
  Documents: FileText,
  'Guide de Coûts': DollarSign,
  'Cost Guide': DollarSign,
  Partenaires: Users,
  Partners: Users,
  Client: Settings,
  Admin: Shield,
};

// --- Fonction utilitaire pour obtenir le contenu dans la langue courante ---
function getLocalizedContent(item: any, field: string, language: string): string {
  const langSuffix = language === 'en' ? '_EN' : '_FR';
  return item[`${field}${langSuffix}`] || item[`${field}_FR`] || '';
}

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

// --- Composant CarouselEtapes amélioré avec animations et support multilingue ---
function CarouselEtapes({ etapes, language }: { etapes: FaqStep[]; language: string }) {
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

  const currentStep = etapes[etapeActuelle];
  const imageUrl = language === 'en' ? currentStep.image_EN : currentStep.image_FR;
  const texte = language === 'en' ? currentStep.text_EN : currentStep.text_FR;
  const hasImage = imageUrl && imageUrl.trim() !== '';
  const hasMultipleSteps = etapes.length > 1;

  return (
    <div className="mt-4 border-t pt-4">
      {hasMultipleSteps ? (
        // Affichage pour plusieurs étapes (layout horizontal avec navigation fixe)
        <>
          <div className="w-full mx-auto">
            <div className="grid grid-cols-2 gap-12 min-h-[300px]">
              {/* Colonne texte à gauche */}
              <div className="flex items-center">
                <div className="w-full">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.p
                      key={etapeActuelle}
                      custom={direction}
                      initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction < 0 ? 20 : -20 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                      className="text-sm text-gray-700 whitespace-pre-line leading-relaxed"
                    >
                      {texte}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Colonne image à droite - toujours présente pour stabilité du layout */}
              <div className="flex items-center justify-center">
                {hasImage ? (
                  <div className="relative w-full h-[300px] bg-gray-50 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
                    <AnimatePresence initial={false} custom={direction}>
                      <motion.img
                        key={etapeActuelle}
                        src={imageUrl}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                          x: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.2 }
                        }}
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </AnimatePresence>
                  </div>
                ) : (
                  // Espace vide pour maintenir le layout stable
                  <div className="w-full h-[300px]"></div>
                )}
              </div>
            </div>
          </div>
          
          {/* Navigation fixe en bas */}
          <div className="flex items-center justify-center mt-6 space-x-6">
            <motion.button
              onClick={allerAPrecedente}
              className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
              title={language === 'en' ? 'Previous step' : 'Étape précédente'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeftCircle className="h-8 w-8" />
            </motion.button>
            
            <div className="text-sm font-medium text-gray-700">
              {language === 'en' ? 'Step' : 'Étape'} {etapeActuelle + 1} / {etapes.length}
            </div>
            
            <motion.button
              onClick={allerASuivante}
              className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
              title={language === 'en' ? 'Next step' : 'Étape suivante'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowRightCircle className="h-8 w-8" />
            </motion.button>
          </div>
        </>
      ) : (
        // Affichage pour une seule étape (texte aligné à gauche, pleine largeur)
        <div className="w-full">
          <p className="text-sm text-gray-700 text-left whitespace-pre-line leading-relaxed">
            {texte}
          </p>
        </div>
      )}
    </div>
  );
}

// --- Composant FaqItem amélioré avec animations ---
function FaqItem({
  item,
  index,
  isOpen,
  onToggle,
  searchTerm,
  language
}: {
  item: FaqItemData;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  searchTerm: string;
  language: string;
}) {
  const question = getLocalizedContent(item, 'question', language);

  return (
    <motion.div className="border-b border-gray-200" id={item.id} variants={cardVariants}>
      <motion.button
        onClick={onToggle}
        className="w-full flex justify-between items-start py-4 text-left group"
        whileHover={{ scale: 1.01, originX: 0 }}
        whileTap={{ scale: 0.99, originX: 0 }}
      >
        <div className="flex items-start">
          <span className="mr-3 text-lg font-semibold text-indigo-600">
            {index + 1}.
          </span>
          <span className="text-md font-medium text-gray-800">
            <HighlightText text={question} highlight={searchTerm} />
          </span>
        </div>
        <div className="flex items-center mt-1">
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-500 transition-transform duration-300 flex-shrink-0 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </motion.button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-10 pr-6 text-gray-600">
              {item.etapes && item.etapes.length > 0 && (
                <CarouselEtapes etapes={item.etapes} language={language} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Composant Principal de la Page d'Aide ---
export default function AidePage() {
  const { language } = useTranslation();
  
  const [allFaqs, setAllFaqs] = useState<FaqItemData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
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
        const { faqs, categories: dynamicCategories } = parseCsv(csvText);
        setAllFaqs(faqs);
        setCategories(dynamicCategories);
      } catch (err) {
        console.error("Erreur lors du chargement des FAQs:", err);
        setError(language === 'en' 
          ? "Unable to load FAQs. Please check the connection or Google Sheet URL."
          : "Impossible de charger les FAQs. Veuillez vérifier la connexion ou l'URL du Google Sheet."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, [language]);

  const parseCsv = (csvString: string): { faqs: FaqItemData[], categories: CategoryData[] } => {
    const lines = csvString.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) return { faqs: [], categories: [] };

    const headers = lines[0].split(',').map(header => header.trim());
    const stepsByQuestion: { [key: string]: any } = {};
    const categoriesSet = new Set<string>();

    // Parse chaque ligne du CSV
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      const values: string[] = [];
      let inQuote = false;
      let charBuffer = '';

      // Parser CSV avec gestion des guillemets
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

      // Créer l'objet étape
      const stepData: any = {};
      headers.forEach((header, index) => {
        let value = (values[index] || '').trim();
        
        // Ne pas décoder les URLs Firebase (qui contiennent firebasestorage.googleapis.com)
        if (!value.includes('firebasestorage.googleapis.com')) {
          try {
            value = decodeURIComponent(value.replace(/\+/g, ' '));
          } catch (e) {
            console.warn(`Could not decode URI component for value: ${value}`, e);
          }
        }
        
        // Remplacer les \n littéraux par de vrais retours de ligne
        value = value.replace(/\\n/g, '\n');
        
        stepData[header] = value;
      });

      // Vérifier que les champs obligatoires sont présents
      if (!stepData.id || !stepData.category_FR || !stepData.question_FR) {
        console.warn('Ligne CSV ignorée en raison de champs manquants:', stepData);
        continue;
      }

      // Ajouter les catégories uniques
      categoriesSet.add(stepData.category_FR);
      if (stepData.category_EN) {
        categoriesSet.add(stepData.category_EN);
      }

      // Grouper par ID de question
      if (!stepsByQuestion[stepData.id]) {
        stepsByQuestion[stepData.id] = {
          id: stepData.id,
          category_FR: stepData.category_FR,
          category_EN: stepData.category_EN || stepData.category_FR,
          question_FR: stepData.question_FR,
          question_EN: stepData.question_EN || stepData.question_FR,
          etapes: []
        };
      }

      // Ajouter l'étape si elle contient du contenu
      if (stepData.text_FR || stepData.text_EN || stepData.image_FR || stepData.image_EN) {
        stepsByQuestion[stepData.id].etapes.push({
          etape: parseInt(stepData.etape_FR || stepData.etape_EN || '1', 10),
          text_FR: stepData.text_FR || '',
          text_EN: stepData.text_EN || stepData.text_FR || '',
          image_FR: stepData.image_FR || '',
          image_EN: stepData.image_EN || stepData.image_FR || ''
        });
      }
    }

    // Convertir en array et trier les étapes
    const faqs: FaqItemData[] = Object.values(stepsByQuestion).map(question => ({
      ...question,
      etapes: question.etapes.sort((a: FaqStep, b: FaqStep) => a.etape - b.etape)
    }));

    // Générer les catégories dynamiques avec correspondance FR/EN
    const categoriesMap = new Map<string, CategoryData>();
    
    faqs.forEach(faq => {
      const categoryFR = faq.category_FR;
      const categoryEN = faq.category_EN;
      
      if (!categoriesMap.has(categoryFR)) {
        categoriesMap.set(categoryFR, {
          name_FR: categoryFR,
          name_EN: categoryEN,
          icon: categoryIcons[categoryFR] || categoryIcons[categoryEN] || HelpCircle
        });
      }
    });

    const categories: CategoryData[] = Array.from(categoriesMap.values());

    return { faqs, categories };
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

  // Génération des catégories avec leurs FAQs pour l'affichage
  const categorizedFaqsForDisplay = categories.map(category => {
    const categoryName = getLocalizedContent(category, 'name', language);
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[éèê]/g, 'e').replace(/[ûù]/g, 'u');

    const filteredFaqsInThisCategory = allFaqs.filter(item => {
      const itemCategory = getLocalizedContent(item, 'category', language);
      const itemQuestion = getLocalizedContent(item, 'question', language);
      
      return itemCategory === categoryName &&
        (!searchTerm ||
          itemQuestion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.etapes.some(etape => {
            const etapeText = getLocalizedContent(etape, 'text', language);
            return etapeText.toLowerCase().includes(searchTerm.toLowerCase());
          }));
    });

    return {
      id: categoryId,
      name: categoryName,
      icon: category.icon,
      faqs: filteredFaqsInThisCategory,
    };
  });

  // Résultats de recherche unifiés
  const unifiedSearchResults = searchTerm.trim()
    ? allFaqs
        .filter(item => {
          const question = getLocalizedContent(item, 'question', language);
          return question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.etapes.some(etape => {
                   const etapeText = getLocalizedContent(etape, 'text', language);
                   return etapeText.toLowerCase().includes(searchTerm.toLowerCase());
                 });
        })
        .map(item => ({
          ...item,
          categoryName: getLocalizedContent(item, 'category', language),
          categoryIcon: categoryIcons[getLocalizedContent(item, 'category', language)] || HelpCircle,
        }))
    : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <img 
          src="/images/loading.gif" 
          alt={language === 'en' ? 'Loading...' : 'Chargement...'}
          className="w-52 h-32 mb-4"
        />
        <p className="text-xl text-gray-600">
          {language === 'en' ? 'Loading FAQs...' : 'Chargement des FAQs...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">
            {language === 'en' ? 'Error!' : 'Erreur !'}
          </strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <p className="mt-4 text-gray-600">
          {language === 'en' 
            ? 'Please make sure the Google Sheet is properly published as CSV and the URL is correct.'
            : 'Veuillez vous assurer que le Google Sheet est correctement publié en CSV et que l\'URL est correcte.'
          }
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 space-y-12 pb-24"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="relative text-center"
        variants={containerVariants}
      >
        <motion.h1 variants={itemVariants} className="text-4xl font-bold text-gray-900 inline-block">
          {language === 'en' ? 'How can we help you?' : 'Comment pouvons-nous vous aider ?'}
        </motion.h1>
        <motion.p variants={itemVariants} className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
          {language === 'en' 
            ? 'Ask a question or browse categories to find answers.'
            : 'Posez une question ou parcourez les catégories pour trouver des réponses.'
          }
        </motion.p>

        <motion.div variants={itemVariants} className="mt-8 max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'en' ? 'Search for a question...' : 'Rechercher une question...'}
              className="block w-full pl-12 pr-10 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <motion.button
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full focus:outline-none"
                  aria-label={language === 'en' ? 'Clear search' : 'Effacer la recherche'}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <motion.div className="w-full" variants={itemVariants}>
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-[#EBF5FF] p-1 overflow-x-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              const categoryName = getLocalizedContent(category, 'name', language);
              return (
                <Tab
                  key={category.name_FR}
                  as={motion.button}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
                  <span className="whitespace-nowrap">{categoryName}</span>
                </Tab>
              );
            })}
          </Tab.List>

          <Tab.Panels className="mt-4">
            {categorizedFaqsForDisplay.map((category) => (
              <Tab.Panel
                key={category.id}
                as={motion.div}
                className="rounded-xl bg-white p-3 ring-white/60 ring-offset-2 focus:outline-none focus:ring-2"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                <div className="space-y-2">
                  {category.faqs.length > 0 ? (
                    category.faqs.map((item, itemIndex) => (
                      <FaqItem
                        key={item.id}
                        item={item}
                        index={itemIndex}
                        isOpen={openQuestionId === item.id}
                        onToggle={() => handleToggleQuestion(item.id)}
                        searchTerm={searchTerm}
                        language={language}
                      />
                    ))
                  ) : (
                    <motion.div variants={itemVariants} className="text-center py-8 text-gray-500">
                      {language === 'en' 
                        ? 'No questions match your search in this category.'
                        : 'Aucune question ne correspond à votre recherche dans cette catégorie.'
                      }
                    </motion.div>
                  )}
                </div>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </motion.div>

      <AnimatePresence>
      {searchTerm.trim() !== '' && (
        <motion.div
          className="max-w-4xl mx-auto mt-12 border-t pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: ease }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {language === 'en' 
              ? `All results for "${searchTerm}"`
              : `Tous les résultats pour "${searchTerm}"`
            }
          </h2>
          {unifiedSearchResults.length > 0 ? (
            <motion.div
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {unifiedSearchResults.map((item, index) => {
                const CategoryIcon = item.categoryIcon;
                return (
                  <motion.div
                    key={item.id}
                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                    variants={cardVariants}
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
                      isOpen={openQuestionId === item.id}
                      onToggle={() => handleToggleQuestion(item.id)}
                      searchTerm={searchTerm}
                      language={language}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-gray-600 font-semibold">
                {language === 'en' 
                  ? 'No results found across all categories'
                  : 'Aucun résultat trouvé sur l\'ensemble des catégories'
                }
              </p>
              <p className="text-gray-500 mt-2">
                {language === 'en' 
                  ? 'Try simplifying your keywords or check spelling.'
                  : 'Essayez de simplifier vos mots-clés ou de vérifier l\'orthographe.'
                }
              </p>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-indigo-50 border-t border-indigo-200 p-4 shadow-lg text-center z-50 flex items-center justify-center"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ ease: "easeOut", duration: 0.5, delay: 0.8 }}
      >
        <p className="text-indigo-700 text-base font-medium flex items-center space-x-2">
          <span className="italic">pssttt!</span>
          <Mail className="h-5 w-5 flex-shrink-0" />
          <span>
            {language === 'en' 
              ? "Can't find the answer to your questions? Write to us at "
              : 'Vous ne trouvez pas la réponse à vos questions? Écrivez-nous à '
            }
            <span className="inline-flex items-center font-bold">
              mediabox@pluscompany.com
              <motion.button
                onClick={copyEmailToClipboard}
                className="ml-2 p-1 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                title={copied ? 
                  (language === 'en' ? 'Copied!' : 'Copié !') : 
                  (language === 'en' ? 'Copy email' : "Copier l'e-mail")
                }
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Check className="h-5 w-5 text-green-600" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="clipboard"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Clipboard className="h-5 w-5 text-indigo-600" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </span>
            😄
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
}