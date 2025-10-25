// app/brief-intelligence/components/JsonPreview.tsx
/**
 * Composant de prévisualisation et téléchargement du JSON AdCP
 * Affiche l'objet JSON formaté avec coloration syntaxique et permet le téléchargement
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Code,
  FileJson,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AdCPMediaBuy } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface JsonPreviewProps {
  data: Partial<AdCPMediaBuy>;
  isComplete: boolean;
  completeness: number;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function JsonPreview({
  data,
  isComplete,
  completeness,
}: JsonPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showPretty, setShowPretty] = useState(true);

  /**
   * Copie le JSON dans le presse-papier
   */
  const handleCopy = async () => {
    try {
      const jsonString = JSON.stringify(data, null, showPretty ? 2 : 0);
      await navigator.clipboard.writeText(jsonString);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  /**
   * Télécharge le JSON comme fichier
   */
  const handleDownload = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adcp-media-buy-${data.campaign_name || 'brief'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Compte le nombre de propriétés définies
   */
  const countDefinedProperties = (obj: any): number => {
    let count = 0;
    
    const traverse = (o: any) => {
      if (o === null || o === undefined) return;
      
      if (Array.isArray(o)) {
        o.forEach(item => traverse(item));
      } else if (typeof o === 'object') {
        Object.keys(o).forEach(key => {
          count++;
          traverse(o[key]);
        });
      } else {
        count++;
      }
    };
    
    traverse(obj);
    return count;
  };

  const propertyCount = countDefinedProperties(data);
  const jsonString = JSON.stringify(data, null, showPretty ? 2 : 0);
  const sizeInKB = (new Blob([jsonString]).size / 1024).toFixed(2);

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* En-tête */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-100' : 'bg-indigo-100'}`}>
              <FileJson className={`h-5 w-5 ${isComplete ? 'text-green-600' : 'text-indigo-600'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Objet JSON AdCP
              </h3>
              <p className="text-xs text-gray-500">
                {propertyCount} propriété{propertyCount > 1 ? 's' : ''} • {sizeInKB} KB
              </p>
            </div>
          </div>

          {/* Badge statut */}
          {isComplete ? (
            <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 rounded-full">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Complet</span>
            </div>
          ) : (
            <div className="px-3 py-1 bg-orange-100 rounded-full">
              <span className="text-sm font-medium text-orange-700">
                {completeness}% complété
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 mt-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
          >
            {isExpanded ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Masquer</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Afficher</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Copié!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copier</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPretty(!showPretty)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            title={showPretty ? 'Compresser' : 'Formater'}
          >
            <Code className="h-4 w-4" />
            <span>{showPretty ? 'Compact' : 'Pretty'}</span>
          </motion.button>
        </div>
      </div>

      {/* Prévisualisation JSON */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-900">
              <pre className="text-xs text-gray-100 overflow-x-auto">
                <code>
                  <SyntaxHighlightedJson data={data} pretty={showPretty} />
                </code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Résumé des champs principaux (toujours visible) */}
      {!isExpanded && (
        <div className="p-4 space-y-2 bg-gray-50">
          <p className="text-xs font-medium text-gray-500 uppercase">Résumé</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {data.campaign_name && (
              <div>
                <span className="text-gray-500">Campagne:</span>{' '}
                <span className="font-medium text-gray-900">{data.campaign_name}</span>
              </div>
            )}
            {data.total_budget && data.currency && (
              <div>
                <span className="text-gray-500">Budget:</span>{' '}
                <span className="font-medium text-gray-900">
                  {new Intl.NumberFormat('fr-CA', {
                    style: 'currency',
                    currency: data.currency,
                  }).format(data.total_budget)}
                </span>
              </div>
            )}
            {data.flight_start_date && data.flight_end_date && (
              <div className="col-span-2">
                <span className="text-gray-500">Période:</span>{' '}
                <span className="font-medium text-gray-900">
                  {data.flight_start_date} au {data.flight_end_date}
                </span>
              </div>
            )}
            {data.packages && data.packages.length > 0 && (
              <div>
                <span className="text-gray-500">Packages:</span>{' '}
                <span className="font-medium text-gray-900">{data.packages.length}</span>
              </div>
            )}
            {data.product_ids && data.product_ids.length > 0 && (
              <div>
                <span className="text-gray-500">Produits:</span>{' '}
                <span className="font-medium text-gray-900">{data.product_ids.length}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message si incomplet */}
      {!isComplete && isExpanded && (
        <div className="p-4 bg-orange-50 border-t border-orange-200">
          <p className="text-sm text-orange-700">
            ⚠️ Certaines informations obligatoires sont manquantes. Complétez le brief pour générer un JSON AdCP valide.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPOSANT DE COLORATION SYNTAXIQUE
// ============================================================================

interface SyntaxHighlightedJsonProps {
  data: any;
  pretty: boolean;
}

function SyntaxHighlightedJson({ data, pretty }: SyntaxHighlightedJsonProps) {
  const jsonString = JSON.stringify(data, null, pretty ? 2 : 0);

  // Coloration syntaxique basique
  const highlighted = jsonString
    .replace(/"([^"]+)":/g, '<span class="text-blue-400">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="text-green-400">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="text-yellow-400">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="text-purple-400">$1</span>')
    .replace(/\[/g, '<span class="text-gray-400">[</span>')
    .replace(/\]/g, '<span class="text-gray-400">]</span>')
    .replace(/{/g, '<span class="text-gray-400">{</span>')
    .replace(/}/g, '<span class="text-gray-400">}</span>');

  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
}