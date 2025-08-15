// app/components/Tactiques/FormDrawer.tsx

/**
 * Ce fichier définit un composant de tiroir latéral (ou "drawer") amélioré qui s'affiche sur le côté droit de l'écran.
 * AMÉLIORATIONS :
 * - Header sticky qui reste visible au défilement
 * - Z-index optimisé pour une superposition correcte avec les onglets
 * - Structure adaptée pour les onglets sticky
 * Il utilise les composants Dialog et Transition de Headless UI pour l'accessibilité et les animations.
 */
'use client';

import React, { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';

interface FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Composant de tiroir latéral amélioré pour afficher des formulaires ou d'autres contenus.
 * NOUVEAU : Header sticky pour éviter le chevauchement avec les onglets.
 *
 * @param {FormDrawerProps} props - Les propriétés du composant.
 * @param {boolean} props.isOpen - Indique si le tiroir est ouvert ou fermé.
 * @param {() => void} props.onClose - Fonction à appeler lorsque le tiroir doit être fermé.
 * @param {string} props.title - Le titre affiché dans l'en-tête du tiroir.
 * @param {ReactNode} props.children - Le contenu à afficher à l'intérieur du tiroir.
 * @returns {JSX.Element} Le composant FormDrawer amélioré.
 */
export default function FormDrawer({
  isOpen,
  onClose,
  title,
  children
}: FormDrawerProps) {
  const { t } = useTranslation();
  
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
               <Dialog.Panel className="pointer-events-auto w-[50vw]">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    {/* HEADER STICKY - Z-index 30 pour rester au-dessus des onglets */}
                    <div className="sticky top-0 z-30 bg-indigo-600 px-4 py-6 sm:px-6 shadow-lg">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-medium text-white">
                          {title}
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
                            onClick={onClose}
                          >
                            <span className="sr-only">{t('common.close')}</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CONTENU SCROLLABLE */}
                    <div className="flex-1 overflow-y-auto">
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}