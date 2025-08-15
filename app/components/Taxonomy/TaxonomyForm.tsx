// app/components/Taxonomy/TaxonomyForm.tsx
'use client';

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Taxonomy, TaxonomyFormData } from '../../types/taxonomy';
import defaultTaxonomyService from '../../lib/defaultTaxonomyService';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  ArrowPathIcon, 
  PlusIcon,
  InformationCircleIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { 
  getAvailableVariables, 
  getAllowedFormatOptions, 
  isKnownVariable, 
  isFormatAllowed,
  FormatOption 
} from '../../config/taxonomyFields';
import { useTranslation } from '../../contexts/LanguageContext';

interface TaxonomyFormProps {
  taxonomy?: Taxonomy;
  onSubmit: (data: TaxonomyFormData) => void;
  onCancel: () => void;
}

const TaxonomyForm: React.FC<TaxonomyFormProps> = ({ taxonomy, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<TaxonomyFormData>({
    NA_Display_Name: '',
    NA_Description: '',
    NA_Standard: false,
    NA_Name_Level_1: '',
    NA_Name_Level_2: '',
    NA_Name_Level_3: '',
    NA_Name_Level_4: '',
    NA_Name_Level_5: '',
    NA_Name_Level_6: '',
    NA_Name_Level_1_Title: '',
    NA_Name_Level_2_Title: '',
    NA_Name_Level_3_Title: '',
    NA_Name_Level_4_Title: '',
    NA_Name_Level_5_Title: '',
    NA_Name_Level_6_Title: '',
  });
  
  // État pour stocker la taxonomie standard sélectionnée complète
  const [selectedTaxonomyData, setSelectedTaxonomyData] = useState<Taxonomy | null>(null);
  const [defaultTaxonomies, setDefaultTaxonomies] = useState<{ id: string; name: string }[]>([]);
  const [selectedDefaultTaxo, setSelectedDefaultTaxo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  // État pour les sections compressibles (par défaut, seul le niveau 1 est développé)
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false
  });

  // 🔥 NOUVEAU : État pour la section d'aide
  const [helpExpanded, setHelpExpanded] = useState<boolean>(false);
  
  // États pour le menu des variables et des formats
  const [variableMenuOpen, setVariableMenuOpen] = useState<boolean>(false);
  const [variableMenuPosition, setVariableMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [filterText, setFilterText] = useState<string>('');
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
  const [formatMenuOpen, setFormatMenuOpen] = useState<boolean>(false);
  
  // Références pour les textareas
  const textareaRefs = {
    NA_Name_Level_1: useRef<HTMLTextAreaElement>(null),
    NA_Name_Level_2: useRef<HTMLTextAreaElement>(null),
    NA_Name_Level_3: useRef<HTMLTextAreaElement>(null),
    NA_Name_Level_4: useRef<HTMLTextAreaElement>(null),
    NA_Name_Level_5: useRef<HTMLTextAreaElement>(null),
    NA_Name_Level_6: useRef<HTMLTextAreaElement>(null),
  };
  
  // Référence pour le menu des variables
  const variableMenuRef = useRef<HTMLDivElement>(null);

  // Charger les taxonomies standard
  useEffect(() => {
    const loadDefaultTaxonomies = async () => {
      try {
        const taxonomies = await defaultTaxonomyService.getDefaultTaxonomies();
        setDefaultTaxonomies(taxonomies);
      } catch (error) {
        console.error('Erreur lors du chargement des taxonomies standard:', error);
        setDefaultTaxonomies([]);
      }
    };
    
    loadDefaultTaxonomies();
  }, []);

  // Mettre à jour le formulaire avec les données de la taxonomie si elles existent
  useEffect(() => {
    if (taxonomy) {
      setFormData({
        NA_Display_Name: taxonomy.NA_Display_Name,
        NA_Description: taxonomy.NA_Description,
        NA_Standard: taxonomy.NA_Standard,
        NA_Name_Level_1: taxonomy.NA_Name_Level_1,
        NA_Name_Level_2: taxonomy.NA_Name_Level_2,
        NA_Name_Level_3: taxonomy.NA_Name_Level_3,
        NA_Name_Level_4: taxonomy.NA_Name_Level_4,
        NA_Name_Level_5: taxonomy.NA_Name_Level_5,
        NA_Name_Level_6: taxonomy.NA_Name_Level_6,
        NA_Name_Level_1_Title: taxonomy.NA_Name_Level_1_Title,
        NA_Name_Level_2_Title: taxonomy.NA_Name_Level_2_Title,
        NA_Name_Level_3_Title: taxonomy.NA_Name_Level_3_Title,
        NA_Name_Level_4_Title: taxonomy.NA_Name_Level_4_Title,
        NA_Name_Level_5_Title: taxonomy.NA_Name_Level_5_Title,
        NA_Name_Level_6_Title: taxonomy.NA_Name_Level_6_Title,
      });
      
      // Si c'est une taxonomie standard, essayer de trouver son ID dans la liste
      if (taxonomy.NA_Standard && defaultTaxonomies.length > 0) {
        const matchingTaxo = defaultTaxonomies.find(t => t.name === taxonomy.NA_Display_Name);
        if (matchingTaxo) {
          setSelectedDefaultTaxo(matchingTaxo.id);
          // Charger les données de la taxonomie standard
          loadDefaultTaxonomyData(matchingTaxo.id);
        }
      }
    }
  }, [taxonomy, defaultTaxonomies]);

  // Effet pour gérer le clic en dehors du menu des variables
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (variableMenuRef.current && !variableMenuRef.current.contains(event.target as Node)) {
        // Fermer les menus si on clique en dehors
        setVariableMenuOpen(false);
        setFormatMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Fonction pour charger les données d'une taxonomie standard
  const loadDefaultTaxonomyData = async (taxoId: string) => {
    try {
      const defaultTaxo = await defaultTaxonomyService.getDefaultTaxonomyById(taxoId);
      if (defaultTaxo) {
        setSelectedTaxonomyData(defaultTaxo);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de la taxonomie standard:', error);
    }
  };

  // Gérer le changement de la taxonomie standard sélectionnée
  const handleDefaultTaxoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const taxoId = e.target.value;
    setSelectedDefaultTaxo(taxoId);
    
    if (taxoId) {
      setLoading(true);
      
      try {
        const defaultTaxo = await defaultTaxonomyService.getDefaultTaxonomyById(taxoId);
        
        if (defaultTaxo) {
          // Stocker les données de la taxonomie standard pour pouvoir réinitialiser plus tard
          setSelectedTaxonomyData(defaultTaxo);
          
          // Mettre à jour les champs du formulaire avec les valeurs de la taxonomie standard
          setFormData({
            ...formData,
            NA_Display_Name: defaultTaxo.NA_Display_Name,
            NA_Description: defaultTaxo.NA_Description,
            NA_Standard: true,
            NA_Name_Level_1: defaultTaxo.NA_Name_Level_1,
            NA_Name_Level_2: defaultTaxo.NA_Name_Level_2,
            NA_Name_Level_3: defaultTaxo.NA_Name_Level_3,
            NA_Name_Level_4: defaultTaxo.NA_Name_Level_4,
            NA_Name_Level_5: defaultTaxo.NA_Name_Level_5,
            NA_Name_Level_6: defaultTaxo.NA_Name_Level_6,
            NA_Name_Level_1_Title: defaultTaxo.NA_Name_Level_1_Title,
            NA_Name_Level_2_Title: defaultTaxo.NA_Name_Level_2_Title,
            NA_Name_Level_3_Title: defaultTaxo.NA_Name_Level_3_Title,
            NA_Name_Level_4_Title: defaultTaxo.NA_Name_Level_4_Title,
            NA_Name_Level_5_Title: defaultTaxo.NA_Name_Level_5_Title,
            NA_Name_Level_6_Title: defaultTaxo.NA_Name_Level_6_Title,
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la taxonomie standard:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Si aucune taxonomie standard n'est sélectionnée, réinitialiser
      setSelectedTaxonomyData(null);
      setFormData({
        ...formData,
        NA_Standard: false
      });
    }
  };

  // Fonction pour réinitialiser un niveau spécifique
  const resetLevel = (level: number) => {
    if (!selectedTaxonomyData) return;
    
    setFormData({
      ...formData,
      [`NA_Name_Level_${level}`]: selectedTaxonomyData[`NA_Name_Level_${level}` as keyof Taxonomy] as string,
      [`NA_Name_Level_${level}_Title`]: selectedTaxonomyData[`NA_Name_Level_${level}_Title` as keyof Taxonomy] as string
    });
  };

  // Fonction pour basculer l'état d'expansion d'un niveau
  const toggleLevelExpand = (level: number) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  // 🔥 NOUVEAU : Fonction pour copier du texte dans le presse-papiers
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Vous pouvez ajouter une notification de succès ici si vous le souhaitez
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  // Fonction pour obtenir en toute sécurité une valeur de chaîne pour un textarea
  const getStringValue = (key: keyof TaxonomyFormData): string => {
    const value = formData[key];
    return typeof value === 'string' ? value : '';
  };
  
  // Ouvrir le menu des variables avec positionnement absolu
  const openVariableMenu = (level: number, buttonElement: HTMLButtonElement) => {
    // Obtenir la position du bouton
    const buttonRect = buttonElement.getBoundingClientRect();
    
    // Calculer la position pour le menu (à droite du bouton)
    const menuLeft = buttonRect.right;
    const menuTop = buttonRect.top;
    
    // Définir la position du menu
    setVariableMenuPosition({
      top: menuTop,
      left: menuLeft
    });
    
    // Ouvrir le menu
    setActiveLevel(level);
    setVariableMenuOpen(true);
    setFilterText('');
    setSelectedVariable(null);
    setFormatMenuOpen(false);
  };
  
  // Filtrer les variables selon le texte entré
  const getFilteredVariables = () => {
    const availableVariables = getAvailableVariables();
    
    if (!filterText) return availableVariables;
    
    return availableVariables.filter(variable => 
      variable.toLowerCase().includes(filterText.toLowerCase())
    );
  };
  
  // Sélectionner une variable et ouvrir le menu des formats
  const selectVariable = (variable: string) => {
    setSelectedVariable(variable);
    setFormatMenuOpen(true);
  };
  
  // Récupérer les formats autorisés pour la variable sélectionnée
  const getAvailableFormatsForSelectedVariable = (): FormatOption[] => {
    if (!selectedVariable) return [];
    return getAllowedFormatOptions(selectedVariable);
  };
  
  // Insérer la variable avec le format sélectionné
  const insertFormattedVariable = (format: string) => {
    if (activeLevel === null || selectedVariable === null) return;
    
    const level = activeLevel;
    const variable = selectedVariable;
    const fieldName = `NA_Name_Level_${level}` as keyof typeof textareaRefs;
    const textarea = textareaRefs[fieldName].current;
    
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Créer la chaîne formatée selon le format choisi
    const formattedVariable = `[${variable}:${format}]`;
    
    const currentValue = getStringValue(`NA_Name_Level_${level}` as keyof TaxonomyFormData);
    const newValue = currentValue.substring(0, start) + formattedVariable + currentValue.substring(end);
    
    setFormData({
      ...formData,
      [`NA_Name_Level_${level}`]: newValue
    });
    
    // Fermer les menus
    setVariableMenuOpen(false);
    setFormatMenuOpen(false);
    
    // Focus le textarea et place le curseur après la variable insérée
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newCursorPosition = start + formattedVariable.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };
  
  // Vérifier si une variable et son format sont valides
  const isValidVariable = (variableWithFormat: string): boolean => {
    // Séparer la variable et le format
    const parts = variableWithFormat.split(':');
    
    // Une variable doit avoir un format
    if (parts.length !== 2) return false;
    
    const [variableName, format] = parts;
    
    // Vérifier si la variable existe
    if (!isKnownVariable(variableName)) return false;
    
    // Vérifier si le format est valide pour cette variable
    return isFormatAllowed(variableName, format as any);
  };
  
  // 🔥 MODIFIÉ : Fonction pour formater le contenu avec breaks intelligents
  const formatContent = (content: string) => {
    if (!content) return null;
    
    // Regex pour trouver toute syntaxe ressemblant à une variable (texte entre crochets)
    const regex = /\[(.*?)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Parcourir toutes les correspondances
    while ((match = regex.exec(content)) !== null) {
      // Ajouter le texte avant la variable avec word-break intelligent
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="break-words">
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Contenu complet entre crochets
      const fullMatch = match[1];
      
      // Vérifier si la variable est au format correct et valide
      // Une variable valide doit être au format "nom:format"
      const isValid = fullMatch.includes(':') && isValidVariable(fullMatch);
      
      // Créer un titre informatif pour l'infobulle
      let title = '';
      
      if (fullMatch.includes(':')) {
        const [variableName, format] = fullMatch.split(':');
        if (!isKnownVariable(variableName)) {
          title = t('taxonomyForm.tooltips.unknownVariable');
        } else if (!isFormatAllowed(variableName, format as any)) {
          title = t('taxonomyForm.tooltips.invalidFormat');
        } else {
          title = `${t('taxonomyForm.tooltips.variableLabel')}: ${variableName} | ${t('taxonomyForm.tooltips.formatLabel')}: ${format}`;
        }
      } else {
        title = t('taxonomyForm.tooltips.missingFormat');
      }
      
      // Ajouter la variable formatée + possibilité de break après ]
      parts.push(
        <React.Fragment key={`var-${match.index}`}>
          <span 
            className={`px-1 rounded font-medium whitespace-nowrap ${isValid ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'}`}
            title={title}
          >
            {match[0]}
          </span>
          <wbr />
        </React.Fragment>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Ajouter le texte restant après la dernière variable
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="break-words">
          {content.substring(lastIndex)}
        </span>
      );
    }
    
    return (
      <div className="text-sm font-mono mt-2 p-2 bg-gray-50 rounded border border-gray-200 overflow-wrap-break-word">
        {parts}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow divide-y divide-gray-200">
        {/* Informations générales */}
        <div className="pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('taxonomyForm.generalInfo.title')}</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="NA_Display_Name" className="block text-sm font-medium text-gray-700">
                {t('taxonomyForm.generalInfo.displayNameLabel')}
              </label>
              <input
                type="text"
                id="NA_Display_Name"
                name="NA_Display_Name"
                value={formData.NA_Display_Name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="defaultTaxo" className="block text-sm font-medium text-gray-700">
                {t('taxonomyForm.generalInfo.standardTaxonomyLabel')}
              </label>
              <select
                id="defaultTaxo"
                name="defaultTaxo"
                value={selectedDefaultTaxo}
                onChange={handleDefaultTaxoChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={loading}
              >
                <option value="">{t('taxonomyForm.generalInfo.noStandardTaxonomy')}</option>
                {defaultTaxonomies.map(taxo => (
                  <option key={taxo.id} value={taxo.id}>
                    {taxo.name}
                  </option>
                ))}
              </select>
              {loading && <div className="mt-2 text-sm text-gray-500">{t('common.loading')}</div>}
            </div>
          </div>
          
          <div className="mt-4">
            <label htmlFor="NA_Description" className="block text-sm font-medium text-gray-700">
              {t('taxonomyForm.generalInfo.descriptionLabel')}
            </label>
            <textarea
              id="NA_Description"
              name="NA_Description"
              value={formData.NA_Description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* 🔥 NOUVELLE SECTION : Guide des règles de taxonomie */}
        <div className="pt-6 pb-6">
          <div className="mb-4 border border-blue-200 rounded-md overflow-hidden">
            <div 
              className="bg-blue-50 p-3 flex justify-between items-center cursor-pointer"
              onClick={() => setHelpExpanded(!helpExpanded)}
            >
              <div className="flex items-center">
                {helpExpanded ? (
                  <ChevronDownIcon className="h-5 w-5 text-blue-500 mr-2" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-blue-500 mr-2" />
                )}
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
                <h4 className="text-md font-medium text-blue-700">{t('taxonomyForm.help.title')}</h4>
              </div>
            </div>
            
            {helpExpanded && (
              <div className="p-4 bg-white">
                <div className="space-y-4 text-sm">
        

                  {/* Variables de base */}
                  <div className="border-l-4 border-gray-300 pl-3">
                    <h5 className="font-medium text-gray-800 mb-2">{t('taxonomyForm.help.baseVariables.title')}</h5>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded mb-2">
                      <code className="text-sm">[variable:format]</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('[variable:format]')}
                        className="text-gray-500 hover:text-gray-700"
                        title={t('taxonomyForm.help.baseVariables.copyButton')}
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-xs">{t('taxonomyForm.help.baseVariables.description')}</p>
                  </div>

                  {/* Groupes conditionnels */}
                  <div className="border-l-4 border-green-300 pl-3">
                    <h5 className="font-medium text-green-800 mb-2">{t('taxonomyForm.help.concatenation.title')}</h5>
                    <div className="flex items-center justify-between bg-green-50 p-2 rounded mb-2">
                      <code className="text-sm">&lt;contenu&gt;</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('<>')}
                        className="text-gray-500 hover:text-gray-700"
                        title={t('taxonomyForm.help.baseVariables.copyCharactersButton')}
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-xs">{t('taxonomyForm.help.concatenation.description')}</p>
                    <p className="text-xs text-green-600 mt-1">
                      {t('taxonomyForm.help.concatenation.example')}
                    </p>
                  </div>

                  {/* Conversion minuscules */}
                  <div className="border-l-4 border-blue-300 pl-3">
                    <h5 className="font-medium text-blue-800 mb-2">{t('taxonomyForm.help.lowercase.title')}</h5>
                    <div className="flex items-center justify-between bg-blue-50 p-2 rounded mb-2">
                      <code className="text-sm">▶contenu◀</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('▶◀')}
                        className="text-gray-500 hover:text-gray-700"
                        title={t('taxonomyForm.help.baseVariables.copyCharactersButton')}
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-xs">{t('taxonomyForm.help.lowercase.description')}</p>
                    <p className="text-xs text-blue-600 mt-1">{t('taxonomyForm.help.lowercase.example')}</p>
                  </div>

                  {/* Nettoyage caractères spéciaux */}
                  <div className="border-l-4 border-purple-300 pl-3">
                    <h5 className="font-medium text-purple-800 mb-2">{t('taxonomyForm.help.specialChars.title')}</h5>
                    <div className="flex items-center justify-between bg-purple-50 p-2 rounded mb-2">
                      <code className="text-sm">〔contenu〕</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('〔〕')}
                        className="text-gray-500 hover:text-gray-700"
                        title={t('taxonomyForm.help.baseVariables.copyCharactersButton')}
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-xs">
                      {t('taxonomyForm.help.specialChars.description')}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">{t('taxonomyForm.help.specialChars.example')}</p>
                  </div>

                  {/* Remplacement conditionnel */}
                  <div className="border-l-4 border-orange-300 pl-3">
                    <h5 className="font-medium text-orange-800 mb-2">{t('taxonomyForm.help.conditionalReplacement.title')}</h5>
                    <div className="flex items-center justify-between bg-orange-50 p-2 rounded mb-2">
                      <code className="text-sm">〈contenu〉</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('〈〉')}
                        className="text-gray-500 hover:text-gray-700"
                        title={t('taxonomyForm.help.baseVariables.copyCharactersButton')}
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-xs">
                      {t('taxonomyForm.help.conditionalReplacement.description')}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">{t('taxonomyForm.help.conditionalReplacement.example')}</p>
                  </div>

                  
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Niveaux de taxonomie */}
        <div className="pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('taxonomyForm.levels.title')}</h3>
          
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <div key={level} className="mb-6 border border-gray-200 rounded-md overflow-hidden">
              {/* En-tête du niveau avec bouton d'expansion */}
              <div 
                className="bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleLevelExpand(level)}
              >
                <div className="flex items-center">
                  {expandedLevels[level] ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
                  )}
                  <h4 className="text-md font-medium text-gray-700">{t('taxonomyForm.levels.level')} {level}</h4>
                </div>
                
                {/* Bouton de réinitialisation (visible uniquement si une taxonomie standard est sélectionnée) */}
                {selectedTaxonomyData && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetLevel(level);
                    }}
                    className="text-gray-500 hover:text-indigo-600 flex items-center"
                    title={t('taxonomyForm.levels.resetToDefaultTooltip')}
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs">{t('taxonomyForm.levels.resetButton')}</span>
                  </button>
                )}
              </div>
              
              {/* Contenu du niveau (visible uniquement si développé) */}
              {expandedLevels[level] && (
                <div className="p-4">
                  <div className="mb-4">
                    <label 
                      htmlFor={`NA_Name_Level_${level}_Title`} 
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t('taxonomyForm.levels.levelTitleLabel')}
                    </label>
                    <input
                      type="text"
                      id={`NA_Name_Level_${level}_Title`}
                      name={`NA_Name_Level_${level}_Title`}
                      value={getStringValue(`NA_Name_Level_${level}_Title` as keyof TaxonomyFormData)}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <label 
                        htmlFor={`NA_Name_Level_${level}`} 
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t('taxonomyForm.levels.structureLabel')}
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          // Passer l'élément du bouton pour calculer sa position
                          openVariableMenu(level, e.currentTarget);
                        }}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                      >
                        <PlusIcon className="h-3 w-3 mr-1" />
                        {t('taxonomyForm.levels.addVariableButton')}
                      </button>
                    </div>
                    <div className="relative">
                      <textarea
                        ref={textareaRefs[`NA_Name_Level_${level}` as keyof typeof textareaRefs]}
                        id={`NA_Name_Level_${level}`}
                        name={`NA_Name_Level_${level}`}
                        value={getStringValue(`NA_Name_Level_${level}` as keyof TaxonomyFormData)}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                      />
                      
                      {/* Aperçu avec mise en forme des variables et word-break */}
                      {formatContent(getStringValue(`NA_Name_Level_${level}` as keyof TaxonomyFormData))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Menu flottant des variables (positionné en absolu dans le viewport) */}
      {variableMenuOpen && (
        <div 
          ref={variableMenuRef}
          className="fixed z-50 flex"
          style={{
            top: `${variableMenuPosition.top}px`,
            left: `${variableMenuPosition.left}px`,
          }}
        >
          <div className="bg-white shadow-lg rounded-md border border-gray-200 w-48">
            <div className="px-3 py-2 border-b border-gray-200">
              <input
                type="text"
                placeholder={t('taxonomyForm.variableMenu.filterPlaceholder')}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md"
                autoFocus
              />
            </div>
            <div className="max-h-[90vh] overflow-y-auto py-1">
              {getFilteredVariables().length > 0 ? (
                getFilteredVariables().map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => selectVariable(variable)}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    {variable}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500">
                  {t('taxonomyForm.variableMenu.noVariableFound')}
                </div>
              )}
            </div>
          </div>
          
          {/* Menu de sélection du format de variable */}
          {formatMenuOpen && selectedVariable && (
            <div className="bg-white shadow-lg rounded-md border border-gray-200 w-48 ml-1">
              <div className="px-3 py-2 text-xs font-semibold border-b border-gray-200">
                {t('taxonomyForm.variableMenu.formatFor')} {selectedVariable}
              </div>
              <div className="max-h-[90vh] overflow-y-auto py-1">
                {getAvailableFormatsForSelectedVariable().map((format) => (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => insertFormattedVariable(format.id)}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    title={format.description}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {taxonomy ? t('common.update') : t('common.create')}
        </button>
      </div>
    </form>
  );
};

export default TaxonomyForm;