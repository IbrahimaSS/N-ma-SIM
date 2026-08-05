import { NextRequest, NextResponse } from 'next/server';
import { NMA_SIM_CONTEXT } from '@/lib/agent-context';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { language = null, profile = null, termsAccepted = false, currentStep = 'choix-langue', service = null, message = '' } = body;

    // Ajout d'un log pour débogage et vérification de la bonne transmission
    console.log("Agent IA payload reçu:", { language, profile, termsAccepted, service, currentStep, message });

    const systemPrompt = `
${NMA_SIM_CONTEXT}

ÉTAT ACTUEL DU CLIENT (Vérifie cela AVANT toute décision) :
- language : ${language || 'null'}
- profile : ${profile || 'null'}
- termsAccepted : ${termsAccepted ? 'true' : 'false'}
- service : ${service || 'null'}
- currentStep : ${currentStep}

TÂCHE :
En te basant STRICTEMENT sur cet ÉTAT ACTUEL, réponds au message de l'utilisateur.
Si la langue n'est pas choisie, ne demande que la langue. Si le profil n'est pas choisi, ne demande que le profil, etc.
Tu DOIS retourner un objet JSON STRICTEMENT avec cette structure, sans aucun texte autour (pas de markdown) :
{
  "answer": "Ta réponse vocale courte",
  "suggestions": ["Suggestion 1 courte", "Suggestion 2 courte"]
}
`;

    const grokApiKey = process.env.GROK_API_KEY;

    if (!grokApiKey) {
      console.warn("GROK_API_KEY non trouvée dans le .env, utilisation du fallback.");
      return fallbackResponse(language, currentStep);
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Modèle API Groq à jour (l'ancien Llama3 a été retiré par Groq)
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message || "Bonjour" }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AGENT IA] Erreur Grok API:", errText);
      return fallbackResponse(language, currentStep);
    }

    const data = await response.json();
    const resultContent = data.choices[0].message.content;
    
    // Parse de sécurité
    try {
      const parsed = JSON.parse(resultContent);
      return NextResponse.json({
        answer: parsed.answer || "Je suis à votre écoute.",
        suggestions: parsed.suggestions || []
      });
    } catch (parseError) {
      console.error("[AGENT IA] Erreur parsing JSON:", resultContent);
      return fallbackResponse(language, currentStep);
    }

  } catch (error) {
    console.error('[AGENT IA] Erreur générale:', error);
    return fallbackResponse('fr', 'choix-langue'); // Default fallback
  }
}

// Fonction de fallback complète — couvre toutes les étapes réelles du frontend
function fallbackResponse(lang: string | null, step: string) {
  const isFr = lang !== 'en'; // Par défaut français si null

  const fallbacks: Record<string, string> = {
    'accueil-conditions': isFr
      ? "Bonjour, bienvenue sur N'ma SIM. Veuillez choisir votre langue pour commencer."
      : "Hello, welcome to N'ma SIM. Please choose your language to start.",
    'choix-service': isFr
      ? "Souhaitez-vous demander une nouvelle SIM ou réactiver une puce existante ?"
      : "Would you like a new SIM or reactivate an existing one?",
    // Nouvelle SIM
    'scan-piece': isFr
      ? "Veuillez placer votre pièce d'identité sur le scanner."
      : "Please place your ID document on the scanner.",
    'confirmation-infos': isFr
      ? "Veuillez vérifier et confirmer les informations extraites de votre pièce."
      : "Please verify and confirm the information extracted from your document.",
    'selfie': isFr
      ? "Veuillez regarder la caméra et prendre un selfie pour la vérification."
      : "Please look at the camera and take a selfie for verification.",
    'choix-offre': isFr
      ? "Veuillez choisir l'offre SIM qui vous convient parmi celles affichées."
      : "Please choose the SIM offer that suits you.",
    'paiement': isFr
      ? "Veuillez procéder au paiement via Orange Money ou Carte Visa."
      : "Please proceed with payment via Orange Money or Visa Card.",
    'recu': isFr
      ? "Votre opération est terminée. Récupérez votre reçu en bas de la borne."
      : "Your operation is complete. Please collect your receipt at the bottom of the kiosk.",
    // Réactivation
    'numero-reactivation': isFr
      ? "Veuillez saisir le numéro que vous souhaitez réactiver."
      : "Please enter the number you wish to reactivate.",
    'motif-reactivation': isFr
      ? "Veuillez indiquer le motif de la réactivation."
      : "Please indicate the reason for reactivation.",
    'numeros-frequents': isFr
      ? "Veuillez saisir deux numéros que vous appelez fréquemment."
      : "Please enter two numbers you frequently call.",
    'piece-identite': isFr
      ? "Veuillez scanner votre pièce d'identité pour continuer."
      : "Please scan your ID document to continue.",
    'verification': isFr
      ? "Nous vérifions les informations liées à votre ligne."
      : "We are verifying the information linked to your line.",
  };

  return NextResponse.json({
    answer: fallbacks[step] ?? (isFr
      ? "Je suis là pour vous accompagner sur la borne N'ma SIM."
      : "I am here to guide you on the N'ma SIM kiosk."),
    suggestions: []
  });
}
