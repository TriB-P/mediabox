'use client';

import React, { ReactNode } from 'react';
import { usePermissions, Permissions } from '../../contexts/PermissionsContext';

interface PermissionButtonProps {
  permissionRequired: keyof Permissions;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  tooltipText?: string;
  icon?: ReactNode;
}

const PermissionButton: React.FC<PermissionButtonProps> = ({
  permissionRequired,
  onClick,
  children,
  className = '',
  tooltipText = "Vous n'avez pas les permissions nécessaires pour effectuer cette action",
  icon
}) => {
  const { canPerformAction } = usePermissions();
  const hasPermission = canPerformAction(permissionRequired);

  const baseClassName = hasPermission 
    ? className
    : `${className} opacity-50 cursor-not-allowed bg-gray-300 hover:bg-gray-300 text-gray-500`;

  return (
    <div className="relative group">
      <button
        onClick={hasPermission ? onClick : undefined}
        className={baseClassName}
        disabled={!hasPermission}
        aria-disabled={!hasPermission}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
      
      {!hasPermission && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
          {tooltipText}
        </div>
      )}
    </div>
  );
};

export default PermissionButton;