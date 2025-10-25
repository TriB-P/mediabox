// app/brief-intelligence/components/FileUploader.tsx
/**
 * Composant de téléversement de fichiers PDF avec drag & drop
 * Permet à l'utilisateur de déposer ou sélectionner un brief PDF
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface FileUploaderProps {
  onFileSelect: (file: File, base64: string) => void;
  onFileRemove: () => void;
  currentFile?: {
    name: string;
    size: number;
  } | null;
  isAnalyzing?: boolean;
  disabled?: boolean;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_FILE_TYPES = ['application/pdf'];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function FileUploader({
  onFileSelect,
  onFileRemove,
  currentFile,
  isAnalyzing = false,
  disabled = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Valide un fichier avant de l'accepter
   */
  const validateFile = useCallback((file: File): string | null => {
    // Vérifier le type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return 'Seuls les fichiers PDF sont acceptés';
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return `Le fichier est trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`;
    }

    return null;
  }, []);

  /**
   * Convertit un fichier en base64
   */
  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64 = reader.result as string;
        // Retirer le préfixe "data:application/pdf;base64,"
        const base64Clean = base64.split(',')[1];
        resolve(base64Clean);
      };
      
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };
      
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Traite un fichier sélectionné
   */
  const handleFile = useCallback(async (file: File) => {
    setError(null);
    
    // Valider
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsConverting(true);
      
      // Convertir en base64
      const base64 = await convertToBase64(file);
      
      // Notifier le parent
      onFileSelect(file, base64);
      
      setIsConverting(false);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Erreur lors du traitement du fichier');
      setIsConverting(false);
    }
  }, [validateFile, convertToBase64, onFileSelect]);

  /**
   * Gère le drop de fichier
   */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    
    if (disabled || isAnalyzing) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, isAnalyzing, handleFile]);

  /**
   * Gère le drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled && !isAnalyzing) {
      setIsDragging(true);
    }
  }, [disabled, isAnalyzing]);

  /**
   * Gère le drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  /**
   * Gère la sélection de fichier via input
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  /**
   * Ouvre le sélecteur de fichiers
   */
  const openFileSelector = useCallback(() => {
    if (!disabled && !isAnalyzing) {
      fileInputRef.current?.click();
    }
  }, [disabled, isAnalyzing]);

  /**
   * Supprime le fichier actuel
   */
  const handleRemove = useCallback(() => {
    setError(null);
    onFileRemove();
    
    // Reset l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileRemove]);

  /**
   * Formate la taille du fichier
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <div className="w-full">
      {/* Zone de drop si aucun fichier */}
      <AnimatePresence mode="wait">
        {!currentFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileSelector}
            className={`
              relative border-2 border-dashed rounded-lg p-8
              transition-all duration-200 cursor-pointer
              ${isDragging 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
              }
              ${disabled || isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleInputChange}
              className="hidden"
              disabled={disabled || isAnalyzing}
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Icône */}
              <motion.div
                animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`
                  p-4 rounded-full
                  ${isDragging ? 'bg-indigo-100' : 'bg-gray-100'}
                `}
              >
                <Upload 
                  className={`
                    h-10 w-10
                    ${isDragging ? 'text-indigo-600' : 'text-gray-400'}
                  `}
                />
              </motion.div>

              {/* Texte */}
              <div className="text-center">
                <p className="text-base font-medium text-gray-900">
                  {isConverting 
                    ? 'Traitement du fichier...'
                    : isDragging 
                      ? 'Déposez votre fichier ici'
                      : 'Déposez votre brief PDF ici'
                  }
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ou cliquez pour sélectionner un fichier
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  PDF seulement • Maximum {MAX_FILE_SIZE / 1024 / 1024} MB
                </p>
              </div>

              {/* État de conversion */}
              {isConverting && (
                <div className="flex items-center space-x-2 text-indigo-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span className="text-sm">Lecture du fichier...</span>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          // Fichier sélectionné
          <motion.div
            key="file-display"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="border border-gray-200 rounded-lg p-4 bg-white"
          >
            <div className="flex items-center justify-between">
              {/* Info fichier */}
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FileText className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(currentFile.size)}
                  </p>
                </div>

                {/* Badge statut */}
                {isAnalyzing && (
                  <div className="flex items-center space-x-2 text-indigo-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <span className="text-sm font-medium">Analyse en cours...</span>
                  </div>
                )}
              </div>

              {/* Bouton supprimer */}
              {!isAnalyzing && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRemove}
                  className="ml-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Supprimer le fichier"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message d'erreur */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Erreur</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message de succès (fichier chargé) */}
      {currentFile && !isAnalyzing && !error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2"
        >
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700">
            Fichier chargé avec succès
          </p>
        </motion.div>
      )}
    </div>
  );
}