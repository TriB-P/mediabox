/**
 * Ce fichier définit un composant de tiroir latéral (ou "drawer") qui s'affiche sur le côté droit de l'écran.
 * Il est utilisé pour afficher des formulaires ou d'autres contenus interactifs de manière superposée,
 * permettant à l'utilisateur de rester sur la page principale tout en interagissant avec le contenu du tiroir.
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
 * Composant de tiroir latéral pour afficher des formulaires ou d'autres contenus.
 *
 * @param {FormDrawerProps} props - Les propriétés du composant.
 * @param {boolean} props.isOpen - Indique si le tiroir est ouvert ou fermé.
 * @param {() => void} props.onClose - Fonction à appeler lorsque le tiroir doit être fermé.
 * @param {string} props.title - Le titre affiché dans l'en-tête du tiroir.
 * @param {ReactNode} props.children - Le contenu à afficher à l'intérieur du tiroir.
 * @returns {JSX.Element} Le composant FormDrawer.
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
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="sticky top-0 z-10 bg-indigo-600 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-medium text-white">
                          {title}
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
                            onClick={onClose}
                          >
                            <span className="sr-only">{t('common.close')}</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
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