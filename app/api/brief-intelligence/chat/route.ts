// app/api/brief-intelligence/chat/route.ts
/**
 * API Route pour le chatbot conversationnel Brief Intelligence
 * Permet à l'utilisateur de compléter interactivement les informations du brief
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ChatRequest,
  ChatResponse,
  FieldStatus,
  CompletionStatus,
  AdCPMediaBuy,
  REQUIRED_FIELDS,
} from '../../../brief-intelligence/types';
import {
  generateChatbotSystemPrompt,
  generateChatbotPrompt,
} from '../../../brief-intelligence/utils/promptTemplates';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Initialiser Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// Configuration du modèle
const MODEL_NAME = 'gemini-1.5-flash'; // Plus rapide pour le chat
const MAX_OUTPUT_TOKENS = 2048;
const TEMPERATURE = 0.7; // Plus créatif pour le conversationnel

// ============================================================================
// HANDLER POST
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse le body
    const body: ChatRequest = await request.json();

    if (!body.message || !body.currentData || !body.conversationHistory) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Vérifier la clé API
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('GOOGLE_GEMINI_API_KEY non configurée');
      return NextResponse.json(
        { success: false, error: 'Configuration API manquante' },
        { status: 500 }
      );
    }

    // Calculer les champs manquants
    const missingFields = calculateMissingFields(body.currentData);

    // Obtenir le modèle
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: generateChatbotSystemPrompt(),
    });

    // Générer le prompt avec contexte
    const prompt = generateChatbotPrompt(
      body.message,
      body.currentData,
      body.conversationHistory,
      missingFields
    );

    // Appeler Gemini
    console.log('🤖 Appel à Gemini pour le chat...');
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
      },
    });

    const response = result.response;
    const text = response.text();

    console.log('✅ Réponse reçue de Gemini');

    // Parser la réponse JSON
    let chatResult;
    try {
      // Extraire le JSON de la réponse
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : text;
      chatResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      console.error('Réponse brute:', text);

      // Fallback: retourner le texte brut comme message
      return NextResponse.json({
        success: true,
        data: {
          message: text,
          completeness: calculateCompleteness(body.currentData),
          missingFields,
        },
      });
    }

    // Merger les données extraites avec les données actuelles
    const updatedData = chatResult.extractedData
      ? { ...body.currentData, ...chatResult.extractedData }
      : body.currentData;

    // Recalculer les champs manquants après mise à jour
    const updatedMissingFields = calculateMissingFields(updatedData);

    // Construire les statuts de champs mis à jour
    const fieldStatuses = buildFieldStatusesFromData(updatedData, updatedMissingFields);

    // Calculer la complétion
    const completeness = calculateCompleteness(updatedData);

    // Construire la réponse
    const responseData: ChatResponse = {
      success: true,
      data: {
        message: chatResult.message || 'Message reçu.',
        updatedData: chatResult.extractedData || undefined,
        fieldStatuses,
        missingFields: updatedMissingFields,
        completeness,
        suggestedQuestion: chatResult.nextQuestion || undefined,
      },
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Erreur lors du chat:', error);

    // Gérer les erreurs spécifiques de Gemini
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { success: false, error: 'Clé API invalide' },
        { status: 401 }
      );
    }

    if (error.message?.includes('quota')) {
      return NextResponse.json(
        { success: false, error: 'Quota API dépassé' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du traitement du message',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calcule les champs obligatoires manquants
 */
function calculateMissingFields(data: Partial<AdCPMediaBuy>): string[] {
  const missing: string[] = [];

  REQUIRED_FIELDS.forEach((field) => {
    const fieldStr = String(field);
    const value = getNestedValue(data, fieldStr);

    if (value === undefined || value === null || value === '') {
      missing.push(fieldStr);
    } else if (Array.isArray(value) && value.length === 0) {
      missing.push(fieldStr);
    }
  });

  return missing;
}

/**
 * Construit les statuts de champs à partir des données
 */
function buildFieldStatusesFromData(
  data: Partial<AdCPMediaBuy>,
  missingFields: string[]
): Record<string, FieldStatus> {
  const statuses: Record<string, FieldStatus> = {};

  // Pour chaque champ requis
  REQUIRED_FIELDS.forEach((field) => {
    const fieldStr = String(field);
    const value = getNestedValue(data, fieldStr);

    let status: CompletionStatus;
    if (missingFields.includes(fieldStr)) {
      status = CompletionStatus.MISSING;
    } else {
      status = CompletionStatus.COMPLETE;
    }

    statuses[fieldStr] = {
      field: fieldStr,
      status,
      value,
      confidence: 1.0,
      source: 'chat',
      lastUpdated: Date.now(),
    };
  });

  // Ajouter les champs optionnels présents
  Object.keys(data).forEach((key) => {
    if (!statuses[key]) {
      const value = getNestedValue(data, key);

      if (value !== undefined && value !== null) {
        statuses[key] = {
          field: key,
          status: CompletionStatus.COMPLETE,
          value,
          confidence: 1.0,
          source: 'chat',
          lastUpdated: Date.now(),
        };
      }
    }
  });

  return statuses;
}

/**
 * Calcule le pourcentage de complétion
 */
function calculateCompleteness(data: Partial<AdCPMediaBuy>): number {
  const totalRequired = REQUIRED_FIELDS.length;
  const missingFields = calculateMissingFields(data);
  const completed = totalRequired - missingFields.length;

  return Math.round((completed / totalRequired) * 100);
}

/**
 * Obtient une valeur imbriquée dans un objet
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value === undefined || value === null) {
      return undefined;
    }
    value = value[key];
  }

  return value;
}

/**
 * Définit une valeur imbriquée dans un objet
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

// ============================================================================
// HANDLERS POUR AUTRES MÉTHODES
// ============================================================================

export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non supportée' },
    { status: 405 }
  );
}