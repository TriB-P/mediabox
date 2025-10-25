// app/brief-intelligence/components/ChatInterface.tsx
/**
 * Interface de chat conversationnel pour compléter le brief
 * Permet à l'utilisateur d'interagir avec l'IA pour fournir des informations manquantes
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage, MessageRole } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = 'Posez vos questions ou fournissez des informations...',
  suggestions = [],
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Scroll automatique vers le bas quand de nouveaux messages arrivent
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Focus sur l'input au chargement
   */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Gère l'envoi d'un message
   */
  const handleSend = async () => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput || isLoading || disabled) {
      return;
    }

    setInput('');
    setError(null);

    try {
      await onSendMessage(trimmedInput);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Erreur lors de l\'envoi du message. Veuillez réessayer.');
    }
  };

  /**
   * Gère la touche Enter (avec Shift+Enter pour nouvelle ligne)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Gère le clic sur une suggestion
   */
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  /**
   * Formate le timestamp
   */
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* En-tête */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Assistant Brief AI</h3>
            <p className="text-xs text-gray-500">
              {isLoading ? 'En train d\'écrire...' : 'Disponible'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          // Message de bienvenue
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
            <div className="p-4 bg-indigo-100 rounded-full">
              <Bot className="h-12 w-12 text-indigo-600" />
            </div>
            <div className="max-w-md">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Bienvenue! 👋
              </h4>
              <p className="text-sm text-gray-600">
                Je suis là pour vous aider à compléter votre brief média.
                Vous pouvez me donner des informations sur votre campagne,
                et je vous poserai des questions pour obtenir tous les détails nécessaires.
              </p>
            </div>
            
            {/* Suggestions initiales */}
            {suggestions.length > 0 && (
              <div className="w-full max-w-md mt-4">
                <p className="text-xs text-gray-500 mb-2">Suggestions:</p>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Liste des messages
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                formatTime={formatTime}
              />
            ))}
            
            {/* Message de chargement */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-2"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg px-4 py-3 inline-block">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                      <span className="text-sm text-gray-600">En train de réfléchir...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message d'erreur */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-red-50 border-t border-red-200"
          >
            <div className="flex items-center space-x-2 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone d'input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-end space-x-2">
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              rows={1}
              className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                minHeight: '44px',
                maxHeight: '120px',
              }}
            />
            
            {/* Compteur de caractères */}
            {input.length > 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {input.length}
              </div>
            )}
          </div>

          {/* Bouton d'envoi */}
          <motion.button
            whileHover={!disabled && !isLoading ? { scale: 1.05 } : {}}
            whileTap={!disabled && !isLoading ? { scale: 0.95 } : {}}
            onClick={handleSend}
            disabled={!input.trim() || disabled || isLoading}
            className={`
              flex-shrink-0 p-3 rounded-lg transition-all
              ${!input.trim() || disabled || isLoading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow'
              }
            `}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Send className="h-5 w-5 text-white" />
            )}
          </motion.button>
        </div>

        {/* Aide */}
        <p className="text-xs text-gray-500 mt-2">
          Appuyez sur <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> pour envoyer,{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Shift+Enter</kbd> pour une nouvelle ligne
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT MESSAGE BUBBLE
// ============================================================================

interface MessageBubbleProps {
  message: ChatMessage;
  formatTime: (timestamp: number) => string;
}

function MessageBubble({ message, formatTime }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Message système (centré)
  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex justify-center"
      >
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700 max-w-md text-center">
          {message.content}
        </div>
      </motion.div>
    );
  }

  // Message utilisateur ou assistant
  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-indigo-600' : 'bg-indigo-100'
        }`}>
          {isUser ? (
            <User className="h-5 w-5 text-white" />
          ) : (
            <Bot className="h-5 w-5 text-indigo-600" />
          )}
        </div>
      </div>

      {/* Contenu du message */}
      <div className={`flex-1 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`rounded-lg px-4 py-3 max-w-[80%] ${
            isUser
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        
        {/* Timestamp et métadonnées */}
        <div className={`flex items-center space-x-2 mt-1 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <span className="text-xs text-gray-400">
            {formatTime(message.timestamp)}
          </span>
          
          {/* Afficher si un champ a été mis à jour */}
          {message.metadata?.fieldUpdated && (
            <span className="text-xs text-green-600 font-medium">
              ✓ {message.metadata.fieldUpdated}
            </span>
          )}
          
          {/* Niveau de confiance si présent */}
          {message.metadata?.confidence && (
            <span className="text-xs text-gray-500">
              ({Math.round(message.metadata.confidence * 100)}% confiance)
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}