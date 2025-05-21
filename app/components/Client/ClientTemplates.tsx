'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Template } from '../../types/template';
import TemplateForm from './TemplateForm';
 
export default function ClientTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  
  // Simuler le chargement des données (à remplacer par une vraie requête API)
  useEffect(() => {
    // Simulation d'un appel API
    setTimeout(() => {
      // Données de test
      setTemplates([
        {
          id: '1',
          TE_Name: 'Gabarit Standard',
          TE_URL: 'https://docs.google.com/spreadsheets/d/example1',
          TE_Duplicate: true,
          TE_Language: 'Français',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          TE_Name: 'Gabarit Media Social',
          TE_URL: 'https://docs.google.com/spreadsheets/d/example2',
          TE_Duplicate: false,
          TE_Language: 'Anglais',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleOpenForm = (template: Template | null = null) => {
    setCurrentTemplate(template);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setCurrentTemplate(null);
    setIsFormOpen(false);
  };

  const handleSaveTemplate = async (templateData: Template) => {
    // Simulation de sauvegarde (à remplacer par un vrai appel API)
    try {
      setIsLoading(true);
      
      if (currentTemplate) {
        // Mise à jour d'un gabarit existant
        const updatedTemplates = templates.map(t => 
          t.id === currentTemplate.id ? { ...templateData, updatedAt: new Date().toISOString() } : t
        );
        setTemplates(updatedTemplates);
      } else {
        // Création d'un nouveau gabarit
        const newTemplate = {
          ...templateData,
          id: Math.random().toString(36).substr(2, 9), // ID temporaire pour simulation
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setTemplates([...templates, newTemplate]);
      }
      
      handleCloseForm();
    } catch (err) {
      setError('Une erreur est survenue lors de la sauvegarde du gabarit.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    // Simulation de suppression (à remplacer par un vrai appel API)
    try {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce gabarit ?')) {
        setIsLoading(true);
        setTemplates(templates.filter(t => t.id !== id));
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la suppression du gabarit.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && templates.length === 0) {
    return <div className="flex justify-center py-8">Chargement des gabarits...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestion des gabarits</h2>
        <button
          onClick={() => handleOpenForm()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un gabarit
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun gabarit configuré. Cliquez sur "Ajouter un gabarit" pour commencer.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Langue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duplication</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.TE_Name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a href={template.TE_URL} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 truncate max-w-xs inline-block">
                      {template.TE_URL}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.TE_Language}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {template.TE_Duplicate ? 'Oui' : 'Non'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleOpenForm(template)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {isFormOpen && (
        <TemplateForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSave={handleSaveTemplate}
          template={currentTemplate}
        />
      )}
    </div>
  );
}