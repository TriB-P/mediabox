// app/components/Taxonomy/TaxonomyForm.tsx

'use client';

import React, { useState, useEffect, useRef, KeyboardEvent, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ChevronDownIcon, ChevronRightIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Taxonomy, TaxonomyFormData } from '../../types/taxonomy';
import defaultTaxonomyService from '../../lib/defaultTaxonomyService';
// 🔥 MODIFICATION: Import des nouvelles configurations et fonctions
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

// 🔥 SUPPRESSION: Les listes codées en dur sont maintenant importées
// const DYNAMIC_VARIABLES = [ ... ];
// const VARIABLE_FORMATS = [ ... ];

// 🔥 NOUVEAU: Utiliser les clés de l'objet de configuration pour obtenir les variables
const DYNAMIC_VARIABLES = Object.keys(TAXONOMY_VARIABLE_CONFIG);

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

  const handleDefaultTaxoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const taxoId = e.target.value;
    setSelectedDefaultTaxo(taxoId);
    
    if (taxoId) {
      setLoading(true);
      
      try {
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

  const resetLevel = (level: number) => {
    if (!selectedTaxonomyData) return;
    
    setFormData({
      ...formData,
      [`NA_Name_Level_${level}`]: selectedTaxonomyData[`NA_Name_Level_${level}` as keyof Taxonomy] as string,
      [`NA_Name_Level_${level}_Title`]: selectedTaxonomyData[`NA_Name_Level_${level}_Title` as keyof Taxonomy] as string
    });
  };

  const toggleLevelExpand = (level: number) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const getStringValue = (key: keyof TaxonomyFormData): string => {
    const value = formData[key];
    return typeof value === 'string' ? value : '';
  };
  
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
  
  const getFilteredVariables = () => {
    if (!filterText) return DYNAMIC_VARIABLES;
    return DYNAMIC_VARIABLES.filter(variable => 
      variable.toLowerCase().includes(filterText.toLowerCase())
    );
  };
  
  const selectVariable = (variable: string) => {
    setSelectedVariable(variable);
    setFormatMenuOpen(true);
  };
  
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
  
  // 🔥 MODIFICATION: Utilise les fonctions importées
  const isValidVariable = (variableWithFormat: string): boolean => {
    const parts = variableWithFormat.split(':');
    if (parts.length !== 2) return false;
    
    const [variableName, format] = parts;
    
    return isKnownVariable(variableName) && isFormatAllowed(variableName, format as TaxonomyFormat);
  };
  
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
                {/* 🔥 MODIFICATION: Utilise la liste des formats importée */}
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