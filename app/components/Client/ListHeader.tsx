/**
 * app/components/Client/ListHeader.tsx
 * * Version compacte et harmonisée de l'en-tête de liste.
 * Style cohérent avec le reste de l'application, plus compact.
 */
'use client';

import React from 'react';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

interface ListHeaderProps {
  selectedDimension: string;
  isCustomList: boolean;
  clientName: string;
  hasPermission: boolean;
  onCreateCustomList: () => void;
  onDeleteCustomList: () => void;
}

/**
 * Affiche l'en-tête compact d'une liste de questions.
 * Version harmonisée sans background coloré, plus compacte.
 */
const ListHeader: React.FC<ListHeaderProps> = ({
  selectedDimension,
  isCustomList,
  clientName,
  hasPermission,
  onCreateCustomList,
  onDeleteCustomList
}) => {
  const { t } = useTranslation();
  if (!selectedDimension) {
    return null;
  }


  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          {(selectedDimension)}
        </h3>
        <div className="flex items-center space-x-2 mt-1">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isCustomList 
              ? 'bg-amber-100 text-amber-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {isCustomList ? t('listHeader.listHeader.customList') : t('listHeader.listHeader.pluscoList')}
          </span>
          <span className="text-sm text-gray-500">
            {isCustomList
              ? `${t('listHeader.listHeader.specificTo')} ${clientName}`
              : t('listHeader.listHeader.commonList')
            }
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
      {!isCustomList ? (
          <button
            onClick={onCreateCustomList}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors duration-150 ${
              hasPermission
                ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                : 'text-gray-400 bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!hasPermission}
            title={!hasPermission ? t('listHeader.listHeader.permissionRequired') : t('listHeader.listHeader.createCustomList')}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('listHeader.listHeader.createCustomList')}
          </button>
        ) : (
          <button
            onClick={onDeleteCustomList}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors duration-150 ${
              hasPermission
                ? 'text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                : 'text-gray-400 bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!hasPermission}
            title={!hasPermission ? t('listHeader.listHeader.permissionRequired') : t('listHeader.listHeader.deleteThisCustomList')}
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            {t('listHeader.listHeader.deleteCustomList')}
          </button>
        )}
      </div>
    </div>
  );
};

export default ListHeader;