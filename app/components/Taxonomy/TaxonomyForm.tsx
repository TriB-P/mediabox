/**
 * Ce fichier définit le composant `TaxonomyForm`, un formulaire utilisé pour créer ou modifier une taxonomie.
 * Il permet de gérer les informations générales, la description et les niveaux de taxonomie,
 * y compris l'insertion de variables dynamiques formatées dans les structures de niveau.
 * Le formulaire interagit avec un service pour charger des taxonomies standard par défaut et soumettre les données.
 */
'use client';

import React, { useState, useEffect, useRef, KeyboardEvent, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ChevronDownIcon, ChevronRightIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Taxonomy, TaxonomyFormData } from '../../types/taxonomy';
import defaultTaxonomyService from '../../lib/defaultTaxonomyService';
import {
    TAXONOMY_VARIABLE_CONFIG,
    TAXONOMY_FORMATS,
    isKnownVariable,
    isFormatAllowed,
    TaxonomyFormat
} from '../../config/taxonomyFields';

interface TaxonomyFormProps {
  taxonomy?: Taxonomy;
  onSubmit: (data: TaxonomyFormData) => void;
  onCancel: () => void;
}

const DYNAMIC_VARIABLES = Object.keys(TAXONOMY_VARIABLE_CONFIG);

/**
 * Composant fonctionnel représentant le formulaire de création ou de modification d'une taxonomie.
 *
 * @param {TaxonomyFormProps} props - Les propriétés du composant.
 * @param {Taxonomy} [props.taxonomy] - La taxonomie existante à modifier (optionnel).
 * @param {(data: TaxonomyFormData) => void} props.onSubmit - Fonction de rappel appelée lors de la soumission du formulaire.
 * @param {() => void} props.onCancel - Fonction de rappel appelée lors de l'annulation du formulaire.
 * @returns {React.FC<TaxonomyFormProps>} Le composant React du formulaire de taxonomie.
 */
const TaxonomyForm: React.FC<TaxonomyFormProps> = ({ taxonomy, onSubmit, onCancel }) => {
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
  
  const [selectedTaxonomyData, setSelectedTaxonomyData] = useState<Taxonomy | null>(null);
  const [defaultTaxonomies, setDefaultTaxonomies] = useState<{ id: string; name: string }[]>([]);
  const [selectedDefaultTaxo, setSelectedDefaultTaxo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({
    1: true, 2: false, 3: false, 4: false, 5: false, 6: false
  });
  
  const [variableMenuOpen, setVariableMenuOpen] = useState<boolean>(false);
  const [variableMenuPosition, setVariableMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [filterText, setFilterText] = useState<string>('');
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
  const [formatMenuOpen, setFormatMenuOpen] = useState<boolean>(false);
  
  const textareaRefs = {
    NA_Name_Level_1: useRef<HTMLTextAreaElement>(null),
    NA_Name_Level_2: useRef<HTMLTextAreaElement>(null),
    NA_Name_Level_3: useRef<HTMLTextAreaElement>(null),
    NA_Name_Level_4: useRef<HTMLTextAreaElement>(null),
    NA_Name_Level_5: useRef<HTMLTextAreaElement>(null),
    NA_Name_Level_6: useRef<HTMLTextAreaElement>(null),
  };
  
  const variableMenuRef = useRef<HTMLDivElement>(null);

  /**
   * Effet de chargement initial des taxonomies standard au montage du composant.
   * Récupère la liste des taxonomies standard depuis le service et met à jour l'état.
   * Ne prend aucun paramètre.
   * Ne retourne rien.
   */
  useEffect(() => {
    const loadDefaultTaxonomies = async () => {
      try {
        console.log("FIREBASE: LECTURE - Fichier: TaxonomyForm.tsx - Fonction: loadDefaultTaxonomies - Path: defaultTaxonomies");
        const taxonomies = await defaultTaxonomyService.getDefaultTaxonomies();
        setDefaultTaxonomies(taxonomies);
      } catch (error) {
        console.error('Erreur lors du chargement des taxonomies standard:', error);
        setDefaultTaxonomies([]);
      }
    };
    
    loadDefaultTaxonomies();
  }, []);

  /**
   * Effet de mise à jour du formulaire lorsque la taxonomie passée en props ou les taxonomies par défaut changent.
   * Initialise les données du formulaire avec les valeurs de la taxonomie si elle est fournie.
   * Gère également la sélection d'une taxonomie standard si applicable.
   * @param {Taxonomy} taxonomy - La taxonomie à éditer.
   * @param {Array} defaultTaxonomies - La liste des taxonomies par défaut.
   * Ne retourne rien.
   */
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
      
      if (taxonomy.NA_Standard && defaultTaxonomies.length > 0) {
        const matchingTaxo = defaultTaxonomies.find(t => t.name === taxonomy.NA_Display_Name);
        if (matchingTaxo) {
          setSelectedDefaultTaxo(matchingTaxo.id);
          loadDefaultTaxonomyData(matchingTaxo.id);
        }
      }
    }
  }, [taxonomy, defaultTaxonomies]);

  /**
   * Effet pour gérer le clic en dehors du menu des variables et des formats.
   * Ferme les menus si un clic se produit en dehors de ceux-ci.
   * Ne prend aucun paramètre.
   * Ne retourne rien.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (variableMenuRef.current && !variableMenuRef.current.contains(event.target as Node)) {
        setVariableMenuOpen(false);
        setFormatMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Gère la soumission du formulaire.
   * Appelle la fonction `onSubmit` passée en props avec les données actuelles du formulaire.
   * @param {React.FormEvent} e - L'événement de soumission du formulaire.
   * Ne retourne rien.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  /**
   * Gère les changements des champs du formulaire.
   * Met à jour l'état `formData` en fonction du nom et de la valeur du champ modifié.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - L'événement de changement du champ.
   * Ne retourne rien.
   */
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

  /**
   * Charge les données d'une taxonomie standard spécifique à partir de son ID.
   * Met à jour l'état `selectedTaxonomyData` avec les données récupérées.
   * @param {string} taxoId - L'ID de la taxonomie standard à charger.
   * @returns {Promise<void>} Une promesse qui se résout une fois les données chargées.
   */
  const loadDefaultTaxonomyData = async (taxoId: string) => {
    try {
      console.log("FIREBASE: LECTURE - Fichier: TaxonomyForm.tsx - Fonction: loadDefaultTaxonomyData - Path: defaultTaxonomies/${taxoId}");
      const defaultTaxo = await defaultTaxonomyService.getDefaultTaxonomyById(taxoId);
      if (defaultTaxo) {
        setSelectedTaxonomyData(defaultTaxo);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de la taxonomie standard:', error);
    }
  };

  /**
   * Gère le changement de sélection d'une taxonomie standard dans le sélecteur.
   * Charge les données de la taxonomie sélectionnée et met à jour les champs du formulaire en conséquence.
   * @param {React.ChangeEvent<HTMLSelectElement>} e - L'événement de changement du sélecteur.
   * @returns {Promise<void>} Une promesse qui se résout une fois le chargement et la mise à jour terminés.
   */
  const handleDefaultTaxoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const taxoId = e.target.value;
    setSelectedDefaultTaxo(taxoId);
    
    if (taxoId) {
      setLoading(true);
      
      try {
        console.log("FIREBASE: LECTURE - Fichier: TaxonomyForm.tsx - Fonction: handleDefaultTaxoChange - Path: defaultTaxonomies/${taxoId}");
        const defaultTaxo = await defaultTaxonomyService.getDefaultTaxonomyById(taxoId);
        
        if (defaultTaxo) {
          setSelectedTaxonomyData(defaultTaxo);
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
      setSelectedTaxonomyData(null);
      setFormData({
        ...formData,
        NA_Standard: false
      });
    }
  };

  /**
   * Réinitialise les champs de structure et de titre d'un niveau donné à leurs valeurs par défaut.
   * Cette fonction utilise les données de `selectedTaxonomyData` pour la réinitialisation.
   * @param {number} level - Le niveau de taxonomie à réinitialiser (1 à 6).
   * Ne retourne rien.
   */
  const resetLevel = (level: number) => {
    if (!selectedTaxonomyData) return;
    
    setFormData({
      ...formData,
      [`NA_Name_Level_${level}`]: selectedTaxonomyData[`NA_Name_Level_${level}` as keyof Taxonomy] as string,
      [`NA_Name_Level_${level}_Title`]: selectedTaxonomyData[`NA_Name_Level_${level}_Title` as keyof Taxonomy] as string
    });
  };

  /**
   * Bascule l'état d'expansion/réduction d'un niveau de taxonomie.
   * @param {number} level - Le niveau de taxonomie dont l'état doit être basculé (1 à 6).
   * Ne retourne rien.
   */
  const toggleLevelExpand = (level: number) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  /**
   * Récupère la valeur d'une clé spécifique de `formData` en tant que chaîne de caractères.
   * @param {keyof TaxonomyFormData} key - La clé dont la valeur doit être récupérée.
   * @returns {string} La valeur de la clé, ou une chaîne vide si ce n'est pas une chaîne.
   */
  const getStringValue = (key: keyof TaxonomyFormData): string => {
    const value = formData[key];
    return typeof value === 'string' ? value : '';
  };
  
  /**
   * Ouvre le menu de sélection des variables dynamiques.
   * Positionne le menu à côté du bouton qui l'a déclenché.
   * @param {number} level - Le niveau de taxonomie pour lequel le menu est ouvert.
   * @param {HTMLButtonElement} buttonElement - L'élément bouton qui a déclenché l'ouverture du menu.
   * Ne retourne rien.
   */
  const openVariableMenu = (level: number, buttonElement: HTMLButtonElement) => {
    const buttonRect = buttonElement.getBoundingClientRect();
    const menuLeft = buttonRect.right;
    const menuTop = buttonRect.top;
    
    setVariableMenuPosition({ top: menuTop, left: menuLeft });
    setActiveLevel(level);
    setVariableMenuOpen(true);
    setFilterText('');
    setSelectedVariable(null);
    setFormatMenuOpen(false);
  };
  
  /**
   * Filtre la liste des variables dynamiques en fonction du texte de recherche.
   * @returns {string[]} Un tableau de variables filtrées.
   * Ne prend aucun paramètre.
   */
  const getFilteredVariables = () => {
    if (!filterText) return DYNAMIC_VARIABLES;
    return DYNAMIC_VARIABLES.filter(variable => 
      variable.toLowerCase().includes(filterText.toLowerCase())
    );
  };
  
  /**
   * Sélectionne une variable à partir du menu et ouvre le menu de sélection de format.
   * @param {string} variable - La variable sélectionnée.
   * Ne retourne rien.
   */
  const selectVariable = (variable: string) => {
    setSelectedVariable(variable);
    setFormatMenuOpen(true);
  };
  
  /**
   * Insère une variable formatée dans le champ de texte du niveau actif.
   * Positionne le curseur après la variable insérée.
   * @param {string} format - Le format à appliquer à la variable.
   * Ne retourne rien.
   */
  const insertFormattedVariable = (format: string) => {
    if (activeLevel === null || selectedVariable === null) return;
    
    const level = activeLevel;
    const variable = selectedVariable;
    const fieldName = `NA_Name_Level_${level}` as keyof typeof textareaRefs;
    const textarea = textareaRefs[fieldName].current;
    
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const formattedVariable = `[${variable}:${format}]`;
    const currentValue = getStringValue(`NA_Name_Level_${level}` as keyof TaxonomyFormData);
    const newValue = currentValue.substring(0, start) + formattedVariable + currentValue.substring(end);
    
    setFormData({
      ...formData,
      [`NA_Name_Level_${level}`]: newValue
    });
    
    setVariableMenuOpen(false);
    setFormatMenuOpen(false);
    
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newCursorPosition = start + formattedVariable.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };
  
  /**
   * Vérifie si une variable avec son format est valide en utilisant les fonctions de validation prédéfinies.
   * @param {string} variableWithFormat - La chaîne de caractères représentant la variable et son format (ex: "variable:format").
   * @returns {boolean} Vrai si la variable et le format sont valides, faux sinon.
   */
  const isValidVariable = (variableWithFormat: string): boolean => {
    const parts = variableWithFormat.split(':');
    if (parts.length !== 2) return false;
    
    const [variableName, format] = parts;
    
    return isKnownVariable(variableName) && isFormatAllowed(variableName, format as TaxonomyFormat);
  };
  
  /**
   * Formate le contenu d'un champ de structure en mettant en évidence les variables.
   * Valide les variables et leurs formats et affiche des titres descriptifs.
   * @param {string} content - Le contenu du champ de structure à formater.
   * @returns {JSX.Element | null} Un élément JSX affichant le contenu formaté, ou null si le contenu est vide.
   */
  const formatContent = (content: string) => {
    if (!content) return null;
    const regex = /\[(.*?)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      const fullMatch = match[1];
      const isValid = fullMatch.includes(':') && isValidVariable(fullMatch);
      let title = '';
      
      if (fullMatch.includes(':')) {
        const [variableName, format] = fullMatch.split(':');
        if (!isKnownVariable(variableName)) {
          title = 'Variable inconnue';
        } else if (!isFormatAllowed(variableName, format as TaxonomyFormat)) {
          title = 'Format invalide';
        } else {
          title = `Variable: ${variableName} | Format: ${format}`;
        }
      } else {
        title = 'Format manquant - utiliser variable:format';
      }
      
      parts.push(
        <span 
          key={`var-${match.index}`}
          className={`px-1 rounded font-medium ${isValid ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'}`}
          title={title}
        >
          {match[0]}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }
    
    return <div className="text-sm font-mono mt-2 p-2 bg-gray-50 rounded border border-gray-200">{parts}</div>;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow divide-y divide-gray-200">
        <div className="pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="NA_Display_Name" className="block text-sm font-medium text-gray-700">
                Nom d'affichage*
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
                Taxonomie standard
              </label>
              <select
                id="defaultTaxo"
                name="defaultTaxo"
                value={selectedDefaultTaxo}
                onChange={handleDefaultTaxoChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={loading}
              >
                <option value="">Aucune (personnalisée)</option>
                {defaultTaxonomies.map(taxo => (
                  <option key={taxo.id} value={taxo.id}>
                    {taxo.name}
                  </option>
                ))}
              </select>
              {loading && <div className="mt-2 text-sm text-gray-500">Chargement...</div>}
            </div>
          </div>
          
          <div className="mt-4">
            <label htmlFor="NA_Description" className="block text-sm font-medium text-gray-700">
              Description
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
        
        <div className="pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Niveaux de taxonomie</h3>
          
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <div key={level} className="mb-6 border border-gray-200 rounded-md overflow-hidden">
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
                  <h4 className="text-md font-medium text-gray-700">Niveau {level}</h4>
                </div>
                
                {selectedTaxonomyData && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); resetLevel(level); }}
                    className="text-gray-500 hover:text-indigo-600 flex items-center"
                    title="Réinitialiser à la valeur standard"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs">Réinitialiser</span>
                  </button>
                )}
              </div>
              
              {expandedLevels[level] && (
                <div className="p-4">
                  <div className="mb-4">
                    <label htmlFor={`NA_Name_Level_${level}_Title`} className="block text-sm font-medium text-gray-700">Titre</label>
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
                      <label htmlFor={`NA_Name_Level_${level}`} className="block text-sm font-medium text-gray-700">Structure</label>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); openVariableMenu(level, e.currentTarget); }}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                      >
                        <PlusIcon className="h-3 w-3 mr-1" /> Variable
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
                      {formatContent(getStringValue(`NA_Name_Level_${level}` as keyof TaxonomyFormData))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {variableMenuOpen && (
        <div ref={variableMenuRef} className="fixed z-50 flex" style={{ top: `${variableMenuPosition.top}px`, left: `${variableMenuPosition.left}px` }}>
          <div className="bg-white shadow-lg rounded-md border border-gray-200 w-48">
            <div className="px-3 py-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Filtrer..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
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
                <div className="px-4 py-2 text-sm text-gray-500">Aucune variable</div>
              )}
            </div>
          </div>
          
          {formatMenuOpen && selectedVariable && (
            <div className="bg-white shadow-lg rounded-md border border-gray-200 w-48 ml-1">
              <div className="px-3 py-2 text-xs font-semibold border-b border-gray-200">Format pour {selectedVariable}</div>
              <div className="max-h-60 overflow-y-auto py-1">
                {TAXONOMY_FORMATS.filter(format => isFormatAllowed(selectedVariable, format.id)).map((format) => (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => insertFormattedVariable(format.id)}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
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
          Annuler
        </button>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {taxonomy ? 'Mettre à jour' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
};

export default TaxonomyForm;