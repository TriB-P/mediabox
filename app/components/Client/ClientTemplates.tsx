// app/components/Client/ClientTemplates.tsx

'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Template } from '../../types/template';
import TemplateForm from './TemplateForm';
import { useClient } from '../../contexts/ClientContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { 
  getTemplatesByClient,
  createTemplate,
  updateTemplate, 
  deleteTemplate 
} from '../../lib/templateService';
 
export default function ClientTemplates() {
  const { selectedClient } = useClient();
  const { canPerformAction } = usePermissions();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  
  // Vérifier si l'utilisateur a la permission de gérer les templates
  const hasTemplatePermission = canPerformAction('Templates');
  
  // Charger les données depuis Firestore
  useEffect(() => {
    fetchTemplates();
  }, [selectedClient]);

  const fetchTemplates = async () => {
    if (!selectedClient) {
      setTemplates([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const fetchedTemplates = await getTemplatesByClient(selectedClient.clientId);
      setTemplates(fetchedTemplates);
    } catch (err) {
      console.error('Erreur lors du chargement des gabarits:', err);
      setError('Une erreur est survenue lors du chargement des gabarits.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForm = (template: Template | null = null) => {
    setCurrentTemplate(template);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setCurrentTemplate(null);
    setIsFormOpen(false);
  };

  const handleSaveTemplate = async (templateData: Template) => {
    if (!selectedClient || !hasTemplatePermission) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (currentTemplate) {
        // Mise à jour d'un gabarit existant
        await updateTemplate(selectedClient.clientId, currentTemplate.id, {
          TE_Name: templateData.TE_Name,
          TE_URL: templateData.TE_URL,
          TE_Duplicate: templateData.TE_Duplicate,
          TE_Language: templateData.TE_Language
        });
      } else {
        // Création d'un nouveau gabarit
        await createTemplate(selectedClient.clientId, {
          TE_Name: templateData.TE_Name,
          TE_URL: templateData.TE_URL,
          TE_Duplicate: templateData.TE_Duplicate,
          TE_Language: templateData.TE_Language
        });
      }
      
      // Rafraîchir la liste des gabarits
      await fetchTemplates();
      handleCloseForm();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du gabarit:', err);
      setError('Une erreur est survenue lors de la sauvegarde du gabarit.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!selectedClient || !hasTemplatePermission) return;
    
    try {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce gabarit ?')) {
        setIsLoading(true);
        setError(null);
        await deleteTemplate(selectedClient.clientId, id);
        await fetchTemplates();
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du gabarit:', err);
      setError('Une erreur est survenue lors de la suppression du gabarit.');
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
          className={`inline-flex items-center px-4 py-2 ${
            hasTemplatePermission
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } rounded-md`}
          disabled={!hasTemplatePermission || !selectedClient}
          title={!hasTemplatePermission ? "Vous n'avez pas la permission d'ajouter des gabarits" : ""}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un gabarit
        </button>
      </div>

      {!hasTemplatePermission && (
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700">
            Vous êtes en mode lecture seule. Vous n'avez pas les permissions nécessaires pour modifier les gabarits.
          </div>
        )}

      {!selectedClient ? (
        <div className="text-center py-8 text-gray-500">
          Veuillez sélectionner un client pour gérer ses gabarits.
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun gabarit configuré. {hasTemplatePermission ? 'Cliquez sur "Ajouter un gabarit" pour commencer.' : ''}
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
                      className={`${
                        hasTemplatePermission
                          ? 'text-indigo-600 hover:text-indigo-900'
                          : 'text-gray-400 cursor-not-allowed'
                      } mr-3`}
                      disabled={!hasTemplatePermission}
                      title={!hasTemplatePermission ? "Vous n'avez pas la permission de modifier les gabarits" : ""}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className={`${
                        hasTemplatePermission
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!hasTemplatePermission}
                      title={!hasTemplatePermission ? "Vous n'avez pas la permission de supprimer les gabarits" : ""}
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
      
      {isFormOpen && selectedClient && hasTemplatePermission && (
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