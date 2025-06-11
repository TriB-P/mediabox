// app/components/Campaigns/CampaignFormAdmin.tsx

'use client';

import React, { memo } from 'react';
import { 
  FormInput, 
  createLabelWithHelp,
  FormSection 
} from '../Tactiques/Tactiques/TactiqueFormComponents';
import { CampaignFormData } from '../../types/campaign';

// ==================== TYPES ====================

interface CampaignFormAdminProps {
  formData: CampaignFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  loading?: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

const CampaignFormAdmin = memo<CampaignFormAdminProps>(({
  formData,
  onChange,
  onTooltipChange,
  loading = false
}) => {
  const isDisabled = loading;

  return (
    <div className="p-8 space-y-6">
      <FormSection
        title="Administration"
        description="Informations administratives et de facturation"
      >
        <div className="space-y-6">
          {/* ID externe client */}
          <FormInput
            id="CA_Client_Ext_Id"
            name="CA_Client_Ext_Id"
            value={formData.CA_Client_Ext_Id || ''}
            onChange={onChange}
            type="text"
            placeholder="Ex: CLI-2024-001"
            label={createLabelWithHelp(
              'ID externe client', 
              'Identifiant du client dans vos systèmes externes (CRM, ERP, etc.)', 
              onTooltipChange
            )}
          />

          {/* Numéro de PO */}
          <FormInput
            id="CA_PO"
            name="CA_PO"
            value={formData.CA_PO || ''}
            onChange={onChange}
            type="text"
            placeholder="Ex: PO-2024-12345"
            label={createLabelWithHelp(
              'Numéro de PO', 
              'Numéro de bon de commande (Purchase Order) associé à cette campagne', 
              onTooltipChange
            )}
          />

          {/* ID Facturation */}
          <FormInput
            id="CA_Billing_ID"
            name="CA_Billing_ID"
            value={formData.CA_Billing_ID || ''}
            onChange={onChange}
            type="text"
            placeholder="Ex: BILL-2024-789"
            label={createLabelWithHelp(
              'ID Facturation', 
              'Identifiant de facturation pour cette campagne dans votre système comptable', 
              onTooltipChange
            )}
          />

          {/* Dossier créatifs */}
          <FormInput
            id="CA_Creative_Folder"
            name="CA_Creative_Folder"
            value={formData.CA_Creative_Folder || ''}
            onChange={onChange}
            type="text"
            placeholder="Ex: /assets/campaigns/2024/summer-launch"
            label={createLabelWithHelp(
              'Dossier créatifs', 
              'Chemin ou référence vers le dossier contenant les créatifs de cette campagne', 
              onTooltipChange
            )}
          />
        </div>
      </FormSection>

      {/* Section d'aide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Conseil</h4>
        <p className="text-sm text-blue-700">
          Ces informations administratives sont optionnelles mais recommandées pour faciliter 
          le suivi et la facturation de vos campagnes. Elles peuvent être définies au niveau 
          du client et héritées par les tactiques.
        </p>
      </div>
    </div>
  );
});

CampaignFormAdmin.displayName = 'CampaignFormAdmin';

export default CampaignFormAdmin;