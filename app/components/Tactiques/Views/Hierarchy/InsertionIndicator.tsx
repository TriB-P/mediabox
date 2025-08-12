// app/components/Tactiques/Views/Hierarchy/InsertionIndicator.tsx
/**
 * Composant d'indicateur d'insertion visuel pour le drag & drop
 * Affiche une ligne bleue animée indiquant où l'élément sera inséré
 */
'use client';

import React from 'react';

interface InsertionIndicatorProps {
  isVisible: boolean;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  targetType: 'tactique' | 'placement' | 'creatif' | null;
  insertionMode: 'before' | 'after' | 'inside' | null;
}

export const InsertionIndicator: React.FC<InsertionIndicatorProps> = ({
  isVisible,
  position,
  targetType,
  insertionMode
}) => {
  if (!isVisible || !position) {
    return null;
  }

  // Couleurs selon le type d'élément
  const getIndicatorColor = () => {
    switch (targetType) {
      case 'tactique':
        return 'bg-blue-500';
      case 'placement':
        return 'bg-indigo-500';
      case 'creatif':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Style selon le mode d'insertion
  const getIndicatorStyle = () => {
    const baseStyle = {
      position: 'fixed' as const,
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${position.width}px`,
      height: `${position.height}px`,
      zIndex: 1000,
      pointerEvents: 'none' as const,
      transition: 'all 0.15s ease-out',
    };

    if (insertionMode === 'inside') {
      return {
        ...baseStyle,
        height: '2px',
        opacity: 0.8,
      };
    }

    return {
      ...baseStyle,
      height: '2px',
      opacity: 0.9,
    };
  };

  // Icône de direction selon le mode
  const getDirectionIcon = () => {
    if (insertionMode === 'before') {
      return (
        <div className="absolute -left-2 -top-1">
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent border-b-current"></div>
          </div>
        </div>
      );
    } else if (insertionMode === 'after') {
      return (
        <div className="absolute -left-2 -bottom-1">
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-current"></div>
          </div>
        </div>
      );
    } else if (insertionMode === 'inside') {
      return (
        <div className="absolute -left-3 -top-2">
          <div className="w-6 h-6 flex items-center justify-center">
            <div className="w-0 h-0 border-t-2 border-b-2 border-r-4 border-transparent border-r-current"></div>
          </div>
        </div>
      );
    }
    return null;
  };

  const colorClass = getIndicatorColor();

  return (
    <div
      style={getIndicatorStyle()}
      className={`${colorClass} rounded-full shadow-lg`}
    >
      {/* Ligne principale */}
      <div className="w-full h-full relative">
        
        {/* Effet de lueur */}
        <div 
          className={`absolute inset-0 ${colorClass} rounded-full blur-sm opacity-60`}
        />
        
        {/* Icône de direction */}
        <div className={`absolute text-current ${colorClass.replace('bg-', 'text-')}`}>
          {getDirectionIcon()}
        </div>
        
        {/* Points d'extrémité pour un effet plus élégant */}
        <div className={`absolute -left-1 -top-0.5 w-2 h-3 ${colorClass} rounded-full`} />
        <div className={`absolute -right-1 -top-0.5 w-2 h-3 ${colorClass} rounded-full`} />
      </div>
      
      {/* Animation de pulsation pour attirer l'attention */}
      <div 
        className={`absolute inset-0 ${colorClass} rounded-full animate-pulse opacity-40`}
      />
    </div>
  );
};

/**
 * Hook pour utiliser l'indicateur avec un portail (optionnel)
 * Permet d'afficher l'indicateur au-dessus de tous les autres éléments
 */
export const useIndicatorPortal = () => {
  React.useEffect(() => {
    // Créer un conteneur pour les indicateurs s'il n'existe pas
    let portalContainer = document.getElementById('insertion-indicator-portal');
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'insertion-indicator-portal';
      portalContainer.style.position = 'fixed';
      portalContainer.style.top = '0';
      portalContainer.style.left = '0';
      portalContainer.style.width = '100%';
      portalContainer.style.height = '100%';
      portalContainer.style.pointerEvents = 'none';
      portalContainer.style.zIndex = '1000';
      document.body.appendChild(portalContainer);
    }

    return () => {
      // Nettoyage optionnel si nécessaire
      const container = document.getElementById('insertion-indicator-portal');
      if (container && container.children.length === 0) {
        document.body.removeChild(container);
      }
    };
  }, []);
};

/**
 * Wrapper pour l'indicateur avec portail
 */
export const PortalInsertionIndicator: React.FC<InsertionIndicatorProps> = (props) => {
  useIndicatorPortal();
  
  if (!props.isVisible || !props.position) {
    return null;
  }

  // Utiliser un portail pour afficher au-dessus de tout
  const portalContainer = document.getElementById('insertion-indicator-portal');
  
  if (!portalContainer) {
    return <InsertionIndicator {...props} />;
  }

  return (
    <>
      {/* Le portail est géré par React portal si nécessaire, 
          sinon on utilise le composant normal */}
      <InsertionIndicator {...props} />
    </>
  );
};