// app/components/Tactiques/TactiquesFooter.tsx

/**
 * Ce fichier gère le pied de page de l'application des tactiques.
 * Il permet de naviguer entre les différents onglets de tactiques, d'en ajouter de nouveaux,
 * de renommer les onglets existants et de les supprimer.
 * Il inclut également des boutons pour changer le mode d'affichage des tactiques (hiérarchie, tableau, timeline, taxonomy).
 * MODIFIÉ : Ajout du mode 'taxonomy' avec icône de tag
 * AMÉLIORÉ : Animations staggerées - onglets slide from bottom, boutons pop
 * CORRIGÉ : Retrait du onDoubleClick pour améliorer la réactivité du clic simple
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  ListBulletIcon, 
  TableCellsIcon, 
  ViewColumnsIcon,
  BookOpenIcon,
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { Onglet } from '../../types/tactiques';
import { useTranslation } from '../../contexts/LanguageContext';

interface TactiquesFooterProps {
  viewMode: 'hierarchy' | 'table' | 'timeline' | 'taxonomy';
  setViewMode: (mode: 'hierarchy' | 'table' | 'timeline' | 'taxonomy') => void;
  onglets: Onglet[];
  selectedOnglet: Onglet | null;
  onSelectOnglet: (onglet: Onglet) => void;
  onAddOnglet: () => Promise<void>;
  onRenameOnglet: (ongletId: string, newName: string) => Promise<void>;
  onDeleteOnglet: (ongletId: string) => Promise<void>;
}

const subtleEase: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

// Variants pour les onglets avec slide from bottom staggeré
const tabContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 1.2 // Délai d'1 sec + 0.2
    }
  }
};

const tabVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 50,
    scale: 0.9
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.4, 
      ease: subtleEase,
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  exit: { 
    opacity: 0, 
    y: 50,
    scale: 0.9,
    transition: { 
      duration: 0.2, 
      ease: subtleEase 
    }
  }
};

// Variants simplifiés pour les boutons de mode
const viewModeContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 1.8 // Après les onglets
    }
  }
};

const viewModeItemVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.2
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: subtleEase
    }
  }
};

// Variants pour les interactions
const buttonVariants: Variants = {
  hover: { 
    scale: 1.05, 
    transition: { duration: 0.2, ease: subtleEase } 
  },
  tap: { scale: 0.95 }
};

const iconButtonVariants: Variants = {
  hover: { 
    scale: 1.1, 
    transition: { duration: 0.2, ease: subtleEase } 
  },
  tap: { scale: 0.9 }
};

const viewModeActiveVariants: Variants = {
  active: {
    scale: 1,
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
    transition: { duration: 0.2, ease: subtleEase }
  },
  inactive: {
    scale: 1,
    backgroundColor: 'transparent',
    color: '#6b7280',
    transition: { duration: 0.2, ease: subtleEase }
  },
  hover: {
    scale: 1.05,
    backgroundColor: '#f3f4f6',
    transition: { duration: 0.15, ease: subtleEase }
  }
};

/**
 * Composant de pied de page pour la gestion des onglets et des modes de vue des tactiques.
 * AMÉLIORÉ : Avec animations staggerées - slide from bottom pour onglets, pop pour boutons
 * CORRIGÉ : Réactivité améliorée du clic simple sur les onglets
 */
export default function TactiquesFooter({
  viewMode,
  setViewMode,
  onglets,
  selectedOnglet,
  onSelectOnglet,
  onAddOnglet,
  onRenameOnglet,
  onDeleteOnglet
}: TactiquesFooterProps) {
  const { t } = useTranslation();
  const [editingOnglet, setEditingOnglet] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showMenuForOnglet, setShowMenuForOnglet] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  /**
   * Effet de bord pour fermer le menu contextuel de l'onglet si un clic est détecté en dehors de celui-ci.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenuForOnglet && !(event.target as HTMLElement).closest('.onglet-menu')) {
        setShowMenuForOnglet(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenuForOnglet]);
  
  /**
   * Effet de bord pour mettre le focus sur l'input de renommage lorsqu'un onglet est en mode édition.
   */
  useEffect(() => {
    if (editingOnglet && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingOnglet]);
  
  /**
   * Gère le début de l'édition d'un onglet
   */
  const handleStartEdit = (onglet: Onglet, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOnglet(onglet.id);
    setEditName(onglet.ONGLET_Name);
  };
  
  /**
   * Gère la sauvegarde du nom modifié de l'onglet
   */
  const handleSaveEdit = async () => {
    if (editingOnglet && editName.trim()) {
      await onRenameOnglet(editingOnglet, editName.trim());
      setEditingOnglet(null);
    }
  };
  
  /**
   * Gère les événements clavier pour l'input de renommage
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingOnglet(null);
    }
  };
  
  /**
   * Gère la suppression d'un onglet après confirmation
   */
  const handleDeleteOnglet = async (id: string) => {
    if (onglets.length > 1) {
      const ongletToDelete = onglets.find(o => o.id === id);
      const ongletName = ongletToDelete ? ongletToDelete.ONGLET_Name : t('tacticsFooter.tabs.fallbackName');
      
      if (confirm(t('tacticsFooter.tabs.deleteConfirmation', { ongletName }))) {
        setShowMenuForOnglet(null);
        console.log("FIREBASE: ÉCRITURE - Fichier: TactiquesFooter.tsx - Fonction: handleDeleteOnglet - Path: onglets/${id}");
        await onDeleteOnglet(id);
      }
    } else {
      alert(t('tacticsFooter.tabs.deleteLastError'));
    }
  };

  const viewModeButtons = [
    { mode: 'hierarchy' as const, icon: ListBulletIcon, title: t('tacticsFooter.viewMode.hierarchy') },
    { mode: 'table' as const, icon: TableCellsIcon, title: t('tacticsFooter.viewMode.table') },
    { mode: 'timeline' as const, icon: ViewColumnsIcon, title: t('tacticsFooter.viewMode.timeline') },
    { mode: 'taxonomy' as const, icon: BookOpenIcon, title: t('tacticsFooter.viewMode.taxonomy') }
  ];
  
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
      <div className="max-w-screen-xl mx-auto px-4 w-full">
        <div className="flex items-center py-1 md:pr-0">
          
          {/* Section des onglets avec scroll horizontal */}
          <div className="flex-1 flex items-center overflow-x-auto">
            <motion.div 
              className="flex items-center"
              variants={tabContainerVariants}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence mode="popLayout">
                {onglets.map((onglet) => (
                  <motion.div
                    key={onglet.id}
                    variants={tabVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layout
                    className={`
                      flex items-center px-4 py-2 border-r border-gray-200
                      whitespace-nowrap relative group transition-all duration-200
                      ${selectedOnglet?.id === onglet.id 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <AnimatePresence mode="wait">
                        {editingOnglet === onglet.id ? (
                          <motion.input
                            key="input"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            ref={inputRef}
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={handleKeyDown}
                            className="bg-white border border-gray-300 px-1 py-0 text-sm rounded w-32 transition-all"
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <motion.button
                            key="button"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOnglet(onglet);
                            }}
                            className="text-sm font-medium hover:underline focus:outline-none focus:underline"
                          >
                            {onglet.ONGLET_Name}
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Boutons d'action avec animations */}
                    <div className="flex items-center ml-2">
                      <AnimatePresence>
                        {onglets.length > 1 && (
                          <motion.button
                            variants={iconButtonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded-full transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOnglet(onglet.id);
                            }}
                            title={t('tacticsFooter.tabs.deleteTitle')}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                      
                      <motion.button
                        variants={iconButtonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 rounded-full transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(onglet, e);
                        }}
                        title={t('tacticsFooter.tabs.renameTitle')}
                      >
                        <PencilIcon className="h-3 w-3" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            
            {/* Bouton d'ajout d'onglet */}
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                transition: { delay: 2.0, duration: 0.3, ease: subtleEase } // Délai ajusté
              }}
              onClick={onAddOnglet}
              className="px-3 py-2 text-gray-600 hover:bg-gray-200 transition-colors duration-200 rounded-md mx-1"
              title={t('tacticsFooter.tabs.addTitle')}
            >
              <PlusIcon className="h-5 w-5" />
            </motion.button>
          </div>
          
          {/* Section des modes de vue avec animation pop staggerée */}
          <motion.div 
            className="flex space-x-1 ml-4"
            variants={viewModeContainerVariants}
            initial="initial"
            animate="animate"
          >
            {viewModeButtons.map(({ mode, icon: Icon, title }) => (
              <motion.button
                key={mode}
                variants={viewModeItemVariants}
                initial="initial"
                animate="animate"
                onClick={() => setViewMode(mode)}
                className={`
                  p-2 rounded-full transition-all duration-200
                  ${viewMode === mode 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-500 hover:bg-gray-100'
                  }
                `}
                title={title}
                whileHover={viewMode !== mode ? { scale: 1.05 } : undefined}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-5 w-5" />
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </footer>
  );
}