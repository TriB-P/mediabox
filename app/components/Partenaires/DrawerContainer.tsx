// app/components/Partenaires/DrawerContainer.tsx

/**
 * @file DrawerContainer.tsx
 * @description Ce fichier définit le composant conteneur pour le tiroir (drawer) des partenaires.
 * Reçoit les props nécessaires du composant parent via props drilling.
 */

'use client';

import PartnerDrawer from './PartnerDrawer';

interface Partner {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
  SH_Display_Name_EN?: string;
  SH_Default_UTM?: string;
  SH_Logo?: string;
  SH_Type?: string;
  SH_Tags?: string[];
}

interface DrawerContainerProps {
  selectedPartner: Partner | null;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  onUpdatePartner?: (partnerId: string, updatedData: Partial<Partner>) => Promise<void>;
}

/**
 * @function DrawerContainer
 * @description Un composant conteneur qui affiche le tiroir de détails d'un partenaire.
 * @param {DrawerContainerProps} props - Les propriétés reçues du parent
 * @returns {JSX.Element} Le composant PartnerDrawer configuré avec les bonnes props.
 */
export default function DrawerContainer({
  selectedPartner,
  isDrawerOpen,
  onCloseDrawer,
  onUpdatePartner
}: DrawerContainerProps) {
  return (
    <PartnerDrawer
      isOpen={isDrawerOpen}
      onClose={onCloseDrawer}
      partner={selectedPartner}
    />
  );
}