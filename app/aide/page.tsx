/**
 * Ce fichier définit la page d'aide de l'application.
 * Il récupère une liste de questions-réponses (FAQ) depuis un fichier Google Sheet publié au format CSV.
 * La page affiche les FAQs triées par catégories dans un système d'onglets et fournit une barre de recherche
 * pour filtrer les questions. Les utilisateurs peuvent cliquer sur une question pour afficher la réponse.
 * Un bandeau en bas de page offre un contact par e-mail avec une fonction de copie dans le presse-papiers.
 */

'use client';

import { useState, Fragment, useEffect } from 'react';
import { Tab } from '@headlessui/react';
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
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQo6UwoIgRiWTCyEQuuX4vZU0TqKZn80SUzNQ8tQPFkHxc0P5LvkkAtxlFzQCD-S0ABwEbAf5NMbpP7/pub?gid=623482803&single=true&output=csv';

interface FaqItemData {
  ID: string;
  Catégorie: string;
  Question: string;
  Réponse: string;
}

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

/**
 * Affiche un élément unique de la FAQ (une question et sa réponse).
 * Gère l'affichage et le repli de la réponse lorsqu'on clique sur la question.
 * @param {object} props - Les propriétés du composant.
 * @param {FaqItemData} props.item - L'objet contenant les données de la question (ID, Catégorie, Question, Réponse).
 * @param {number} props.index - L'index de la question dans la liste, utilisé pour la numérotation.
 * @param {boolean} props.isOpen - Indique si la réponse doit être affichée (dépliée) ou non.
 * @param {() => void} props.onToggle - La fonction à appeler lorsque l'utilisateur clique sur la question pour la déplier/replier.
 * @returns {JSX.Element} Le composant JSX représentant une question/réponse.
 */
function FaqItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: FaqItemData;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-start py-4 text-left"
      >
        <div className="flex items-start">
          <span className="mr-3 text-lg font-semibold text-indigo-600">
            {index + 1}.
          </span>
          <span className="text-md font-medium text-gray-800">
            {item.Question}
          </span>
        </div>
        <ChevronDownIcon
          className={`h-5 w-5 text-gray-500 transition-transform duration-300 mt-1 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="pb-4 pl-10 pr-6 text-gray-600">
          <p>{item.Réponse}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Composant principal de la page d'aide.
 * Ce composant gère l'état global de la page, y compris la liste des FAQs,
 * le terme de recherche, et l'état d'ouverture de chaque question.
 * Il récupère les données depuis un Google Sheet au chargement, les affiche
 * dans des onglets catégorisés et permet une recherche unifiée sur tout le contenu.
 * @returns {JSX.Element} La page d'aide complète.
 */
export default function AidePage() {
  const { t } = useTranslation();
  const [allFaqs, setAllFaqs] = useState<FaqItemData[]>([]);
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryTranslationMap: { [key: string]: string } = {
    'Campagnes': 'aide.categories.campaigns',
    'Stratégie': 'aide.categories.strategy',
    'Tactiques': 'aide.categories.tactics',
    'Documents': 'aide.categories.documents',
    'Guide de Coûts': 'aide.categories.costGuide',
    'Partenaires': 'aide.categories.partners',
    'Client': 'aide.categories.client',
    'Admin': 'aide.categories.admin',
  };

  /**
   * Effet de bord pour récupérer les données de la FAQ depuis le Google Sheet
   * au premier chargement du composant. Met à jour l'état de chargement et d'erreur.
   */
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(GOOGLE_SHEET_CSV_URL);

        if (!response.ok) {
          throw new Error(t('aide.logs.httpError', { status: response.status, statusText: response.statusText }));
        }

        const csvText = await response.text();
        const parsedData = parseCsv(csvText);
        setAllFaqs(parsedData);

      } catch (err) {
        console.error(t('aide.logs.loadError'), err);
        setError(t('aide.state.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, [t]);

  /**
   * Analyse une chaîne de caractères au format CSV et la transforme en un tableau d'objets FaqItemData.
   * Cette fonction gère correctement les champs contenant des virgules et des guillemets.
   * @param {string} csvString - La chaîne de caractères CSV brute à analyser.
   * @returns {FaqItemData[]} Un tableau d'objets représentant les FAQs.
   */
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

            if (char === '"') {
                if (inQuote && currentLine[j + 1] === '"') {
                    charBuffer += '"';
                    j++;
                } else {
                    inQuote = !inQuote;
                }
            } else if (char === ',' && !inQuote) {
                values.push(charBuffer);
                charBuffer = '';
            } else {
                charBuffer += char;
            }
        }
        values.push(charBuffer);

        const faqItem: any = {};
        headers.forEach((header, index) => {
            let value = (values[index] || '').trim();
            try {
                value = decodeURIComponent(value.replace(/\+/g, ' '));
            } catch (e) {
                console.warn(`Could not decode URI component for value: ${value}`, e);
            }
            faqItem[header] = value;
        });

        if (faqItem.ID && faqItem.Catégorie && faqItem.Question && faqItem.Réponse) {
            faqs.push(faqItem as FaqItemData);
        } else {
            console.warn(t('aide.logs.csvRowSkipped'), faqItem);
        }
    }
    return faqs;
  };

  /**
   * Gère le basculement de l'affichage d'une réponse de FAQ.
   * Si la question cliquée est déjà ouverte, elle la ferme. Sinon, elle l'ouvre.
   * @param {string} id - L'ID unique de la question à ouvrir ou fermer.
   */
  const handleToggleQuestion = (id: string) => {
    setOpenQuestionId((prevId) => (prevId === id ? null : id));
  };

  /**
   * Copie l'adresse e-mail de contact dans le presse-papiers de l'utilisateur.
   * Affiche une confirmation visuelle temporaire après la copie.
   */
  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText('mediabox@pluscompany.com').then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error(t('aide.logs.copyError'), err);
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
        <p className="ml-4 text-xl text-gray-600">{t('aide.state.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">{t('aide.state.errorTitle')}</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <p className="mt-4 text-gray-600">{t('aide.state.errorInstructions')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-12 pb-24">
      <div className="relative text-center">
        <h1 className="text-4xl font-bold text-gray-900 inline-block">
          {t('aide.header.title')}
        </h1>

        <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
          {t('aide.header.subtitle')}
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
              placeholder={t('aide.search.placeholder')}
              className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
                  <span>{t(categoryTranslationMap[staticCategory.name] || staticCategory.name)}</span>
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
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {t('aide.results.noneInCategory')}
                      {searchTerm && (
                        <p className="mt-2 text-sm">
                           {t('aide.results.emptyCategoryHint', { categoryName: t(categoryTranslationMap[category.name] || category.name) })}
                        </p>
                      )}
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
            {t('aide.results.allResultsFor', { searchTerm })}
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
                      <span>{t(categoryTranslationMap[item.categoryName] || item.categoryName)}</span>
                    </div>
                    <FaqItem
                      item={item}
                      index={index}
                      isOpen={openQuestionId === item.ID}
                      onToggle={() => handleToggleQuestion(item.ID)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-gray-600 font-semibold">
                {t('aide.results.noneOverall')}
              </p>
              <p className="text-gray-500 mt-2">
                {t('aide.results.noneOverallHint')}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-indigo-50 border-t border-indigo-200 p-4 shadow-lg text-center z-50 flex items-center justify-center">
        <p className="text-indigo-700 text-base font-medium flex items-center space-x-2">
          <span className="italic">{t('aide.contact.intro')}</span>
          <Mail className="h-5 w-5 flex-shrink-0" />
          <span>
            {t('aide.contact.prompt')}{' '}
            <span className="inline-flex items-center font-bold">
              mediabox@pluscompany.com
              <button
                onClick={copyEmailToClipboard}
                className="ml-2 p-1 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                title={copied ? t('aide.contact.tooltipCopied') : t('aide.contact.tooltipCopy')}
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