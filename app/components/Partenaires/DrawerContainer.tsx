/**
 * @file DrawerContainer.tsx
 * @description Ce fichier définit le composant conteneur pour le tiroir (drawer) des partenaires.
 * Son rôle est de récupérer l'état global lié aux partenaires (comme le partenaire sélectionné et l'état d'ouverture du tiroir)
 * via le hook `usePartners` et de le transmettre au composant de présentation `PartnerDrawer`.
 * Il gère également la logique de fermeture du tiroir.
 */

'use client';

import { usePartners } from '../../contexts/PartnerContext';
import PartnerDrawer from './PartnerDrawer';

/**
 * @function DrawerContainer
 * @description Un composant conteneur qui affiche le tiroir de détails d'un partenaire.
 * Il utilise le contexte `usePartners` pour déterminer si le tiroir doit être ouvert,
 * quel partenaire afficher, et pour fournir la fonction de fermeture.
 * @returns {JSX.Element} Le composant PartnerDrawer configuré avec les bonnes props.
 */
export default function DrawerContainer() {
  const { selectedPartner, isDrawerOpen, setIsDrawerOpen } = usePartners();
  
  return (
    <PartnerDrawer
      isOpen={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      partner={selectedPartner}
    />
  );
}