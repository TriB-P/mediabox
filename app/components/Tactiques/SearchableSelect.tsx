'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassCircleIcon, XMarkIcon as XIcon } from '@heroicons/react/24/outline';

interface SearchableSelectProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ id: string; label: string }>;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

export default function SearchableSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  className = '',
  label,
  required = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Filtrer les options en fonction du terme de recherche
    if (searchTerm) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options]);

  // Fermer le menu déroulant lorsqu'on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus sur l'input de recherche quand on ouvre le dropdown
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Trouver l'option sélectionnée
  const selectedOption = options.find(option => option.id === value);

  // Trouver l'étiquette à afficher
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  // Gérer la sélection d'une option
  const handleSelect = (optionId: string) => {
    const selectEvent = {
      target: {
        name,
        value: optionId
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    
    onChange(selectEvent);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Gérer l'effacement de la sélection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const selectEvent = {
      target: {
        name,
        value: ''
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    
    onChange(selectEvent);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div
        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center px-3 py-2 justify-between">
          <div className="truncate">
            {value ? displayValue : <span className="text-gray-400">{placeholder}</span>}
          </div>
          
          <div className="flex items-center">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-500 mr-1"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
            <div className={`transition ${isOpen ? 'rotate-180' : ''}`}>
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
          {/* Search input */}
          <div className="relative border-b border-gray-200">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassCircleIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="block w-full rounded-t-md border-0 pl-10 py-2 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm('');
                }}
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Options list */}
          <ul
            className="max-h-60 overflow-auto py-1 text-sm"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-gray-500 text-center">Aucun résultat</li>
            ) : (
              filteredOptions.map(option => (
                <li
                  key={option.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                    value === option.id ? 'bg-indigo-50 text-indigo-700 font-medium' : ''
                  }`}
                  role="option"
                  aria-selected={value === option.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option.id);
                  }}
                >
                  {option.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
      
      {/* Hidden select for form submission */}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className="sr-only"
        aria-hidden="true"
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}