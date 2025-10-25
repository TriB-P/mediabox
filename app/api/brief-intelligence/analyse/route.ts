// app/api/brief-intelligence/analyze/route.ts
/**
 * API Route pour analyser un PDF de brief avec Gemini AI
 * Extrait les informations structurées pour créer un objet AdCP Media Buy
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  AnalyzePDFRequest, 
  AnalyzePDFResponse,
  FieldStatus,
  CompletionStatus,
  AdCPMediaBuy,
  REQUIRED_FIELDS,
} from '../../../brief-intelligence/types';
import { generatePdfAnalysisPrompt } from '../../../brief-intelligence/utils/promptTemplates';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Initialiser Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// Configuration du modèle
const MODEL_NAME = 'gemini-1.5-pro'; // Supporte les PDFs
const MAX_OUTPUT_TOKENS = 8192;
const TEMPERATURE = 0.2; // Plus bas = plus déterministe

// ============================================================================
// HANDLER POST
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse le body
    const body: AnalyzePDFRequest = await request.json();
    
    if (!body.pdfBase64) {
      return NextResponse.json(
        { success: false, error: 'PDF manquant' },
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

    // Obtenir le modèle
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
    });

    // Générer le prompt
    const prompt = generatePdfAnalysisPrompt(body.existingData);

    // Préparer les parts pour Gemini (texte + PDF)
    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: body.pdfBase64,
        },
      },
    ];

    // Appeler Gemini
    console.log('🤖 Appel à Gemini pour analyser le PDF...');
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
      },
    });

    const response = result.response;
    const text = response.text();

    console.log('✅ Réponse reçue de Gemini');

    // Parser la réponse JSON
    let analysisResult;
    try {
      // Extraire le JSON de la réponse (enlever les balises markdown si présentes)
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : text;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      console.error('Réponse brute:', text);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors du parsing de la réponse AI' 
        },
        { status: 500 }
      );
    }

    // Valider la structure de la réponse
    if (!analysisResult.extractedData || !analysisResult.fieldConfidence) {
      console.error('Structure de réponse invalide:', analysisResult);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Structure de réponse AI invalide' 
        },
        { status: 500 }
      );
    }

    // Construire les statuts de champs
    const fieldStatuses = buildFieldStatuses(
      analysisResult.extractedData,
      analysisResult.fieldConfidence,
      analysisResult.missingFields || []
    );

    // Calculer la complétion
    const completeness = calculateCompleteness(fieldStatuses);

    // Construire la réponse
    const responseData: AnalyzePDFResponse = {
      success: true,
      data: {
        extractedData: analysisResult.extractedData,
        fieldStatuses,
        missingFields: analysisResult.missingFields || [],
        completeness,
        summary: analysisResult.summary || 'PDF analysé avec succès',
      },
    };

    // Ajouter les questions suggérées si présentes
    if (analysisResult.suggestedQuestions) {
      (responseData.data as any).suggestedQuestions = analysisResult.suggestedQuestions;
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Erreur lors de l\'analyse PDF:', error);
    
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
        error: 'Erreur lors de l\'analyse du PDF',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Construit les statuts de champs à partir des données extraites
 */
function buildFieldStatuses(
  extractedData: Partial<AdCPMediaBuy>,
  confidence: Record<string, number>,
  missingFields: string[]
): Record<string, FieldStatus> {
  const statuses: Record<string, FieldStatus> = {};

  // Pour chaque champ requis
  REQUIRED_FIELDS.forEach((field) => {
    const fieldStr = String(field);
    const value = getNestedValue(extractedData, fieldStr);
    const conf = confidence[fieldStr] || 0;

    let status: CompletionStatus;
    if (missingFields.includes(fieldStr) || value === undefined || value === null) {
      status = CompletionStatus.MISSING;
    } else if (conf >= 0.8) {
      status = CompletionStatus.COMPLETE;
    } else if (conf >= 0.5) {
      status = CompletionStatus.PARTIAL;
    } else {
      status = CompletionStatus.INVALID;
    }

    statuses[fieldStr] = {
      field: fieldStr,
      status,
      value,
      confidence: conf,
      source: 'pdf',
      lastUpdated: Date.now(),
    };
  });

  // Ajouter les champs optionnels présents
  Object.keys(extractedData).forEach((key) => {
    if (!statuses[key]) {
      const value = getNestedValue(extractedData, key);
      const conf = confidence[key] || 1.0;

      statuses[key] = {
        field: key,
        status: CompletionStatus.COMPLETE,
        value,
        confidence: conf,
        source: 'pdf',
        lastUpdated: Date.now(),
      };
    }
  });

  return statuses;
}

/**
 * Calcule le pourcentage de complétion
 */
function calculateCompleteness(fieldStatuses: Record<string, FieldStatus>): number {
  const requiredStatuses = REQUIRED_FIELDS.map((f) => fieldStatuses[String(f)]).filter(Boolean);
  
  if (requiredStatuses.length === 0) {
    return 0;
  }

  const completeCount = requiredStatuses.filter(
    (s) => s.status === CompletionStatus.COMPLETE
  ).length;

  return Math.round((completeCount / requiredStatuses.length) * 100);
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

// ============================================================================
// HANDLERS POUR AUTRES MÉTHODES
// ============================================================================

export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non supportée' },
    { status: 405 }
  );
}