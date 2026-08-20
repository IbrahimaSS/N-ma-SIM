import { NextRequest, NextResponse } from 'next/server';
import { NMA_SIM_CONTEXT } from '@/lib/agent-context';

export interface AgentAction {
  type: 'none' | 'navigate' | 'click' | 'fill';
  target: string;
  value?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      language = null,
      profile = null,
      termsAccepted = false,
      currentStep = 'choix-langue',
      service = null,
      message = ''
    } = body;

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
Si le message est vide, guide l'utilisateur selon currentStep.
Si l'utilisateur exprime une intention d'action (cliquer, naviguer), retourne l'action appropriée.

RAPPEL FORMAT STRICT — retourne uniquement ce JSON, sans markdown :
{
  "answer": "Ta réponse vocale courte",
  "action": {
    "type": "none",
    "target": ""
  }
}
`;

    const grokApiKey = process.env.GROK_API_KEY;

    // ════════════════════════════════════════════════════════════════
    // RÈGLES DÉTERMINISTES — Ces commandes ne passent PAS par le LLM.
    // Elles sont 100% fiables et instantanées.
    // ════════════════════════════════════════════════════════════════
    if (message && message.trim().length > 0) {
      const msg = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const isFr = language !== 'en';

      // ── Page choix-service ─────────────────────────────────────────
      if (currentStep === 'choix-service') {
        if (/nouvelle sim|nouvelle carte|je veux une sim|carte sim|nouvelle/.test(msg)) {
          return NextResponse.json({ answer: isFr ? "Très bien ! Je lance votre demande de nouvelle SIM." : "Great! Launching your new SIM request.", action: { type: 'click', target: 'btn-nouvelle-sim' } });
        }
        if (/reactivation|reactivation|reactiver|reactivation|retrouver mon numero/.test(msg)) {
          return NextResponse.json({ answer: isFr ? "Je vous guide pour la réactivation de votre numéro." : "Guiding you to reactivate your number.", action: { type: 'click', target: 'btn-reactivation' } });
        }
        if (/recharge|recharger|crediter|credit|une recharge/.test(msg)) {
          return NextResponse.json({ answer: isFr ? "Je lance la recharge de votre ligne." : "Launching your line recharge.", action: { type: 'click', target: 'btn-recharge' } });
        }
      }

      // ── Page accueil-conditions ────────────────────────────────────
      if (currentStep === 'accueil-conditions') {
        if (/accepter|j'accepte|oui|d'accord|je suis d'accord/.test(msg)) {
          return NextResponse.json({ answer: isFr ? "Très bien, j'accepte les conditions pour vous." : "Great, I accept the conditions for you.", action: { type: 'click', target: 'btn-accepter' } });
        }
      }

      // ── Page selfie ────────────────────────────────────────────────
      if (currentStep === 'selfie') {
        if (/selfie|photo|prendre|scanner|visage|camera/.test(msg)) {
          return NextResponse.json({ answer: isFr ? "Je déclenche la capture de votre photo." : "Triggering your photo capture.", action: { type: 'click', target: 'btn-selfie' } });
        }
      }

      // ── Page recharge numéro ───────────────────────────────────────
      if (currentStep === 'recharge-numero') {
        const onlyContinue = /^(continuer|valider|c est bon|suivant|ok)$/.test(msg);
        if (onlyContinue) {
          return NextResponse.json({ answer: isFr ? "Je passe à l'étape suivante." : "Moving to next step.", action: { type: 'click', target: 'btn-continuer-recharge' } });
        }
        const digits = msg.replace(/\D/g, '').replace(/\s/g, '');
        if (digits.length >= 6) {
          const spoken = msg.replace(/zero|zéro/gi,'0').replace(/un/gi,'1').replace(/deux/gi,'2').replace(/trois/gi,'3').replace(/quatre/gi,'4').replace(/cinq/gi,'5').replace(/six/gi,'6').replace(/sept/gi,'7').replace(/huit/gi,'8').replace(/neuf/gi,'9');
          const spokenDigits = spoken.replace(/\D/g, '');
          const finalDigits = spokenDigits.length >= 6 ? spokenDigits : digits;
          return NextResponse.json({ answer: isFr ? `J'ai saisi le numéro. Si c'est correct, dites continuer.` : "Number entered. Say continue if correct.", action: { type: 'fill', target: 'input-recharge-numero', value: finalDigits } });
        }
      }

      // ── Page recharge montant ──────────────────────────────────────
      if (currentStep === 'recharge-montant') {
        if (/^(continuer|valider|c est bon|suivant|ok)$/.test(msg)) {
          return NextResponse.json({ answer: isFr ? "Je passe au paiement." : "Proceeding to payment.", action: { type: 'click', target: 'btn-continuer-montant' } });
        }
        let montant = 0;
        if (/mille/.test(msg)) {
          const m = msg.match(/(\d+)\s*mille/);
          if (m) montant = parseInt(m[1]) * 1000;
          else if (/deux mille|2000/.test(msg)) montant = 2000;
          else if (/cinq mille|5000/.test(msg)) montant = 5000;
          else if (/dix mille|10000|10 000/.test(msg)) montant = 10000;
        } else {
          const raw = msg.replace(/\s/g,'').replace(/gnf|francs|fg|fr/gi,'');
          montant = parseInt(raw.replace(/\D/g,''));
        }
        if (montant >= 1000) {
          return NextResponse.json({ answer: isFr ? `J'ai sélectionné ${montant.toLocaleString('fr-FR')} GNF. Dites continuer pour valider.` : `Selected ${montant} GNF. Say continue to confirm.`, action: { type: 'fill', target: 'select-recharge-montant', value: String(montant) } });
        }
      }

      // ── Page réactivation identification ──────────────────────────
      if (currentStep === 'numero-reactivation') {
        if (/^(continuer|valider|c est bon|suivant|ok)$/.test(msg)) {
          return NextResponse.json({ answer: isFr ? "Je passe à l'étape suivante." : "Moving to next step.", action: { type: 'click', target: 'btn-continuer-reactivation' } });
        }
        if (/perte|perdu|j ai perdu/.test(msg)) {
          return NextResponse.json({ answer: isFr ? "Motif sélectionné : Perte de carte SIM." : "Reason selected: Lost SIM.", action: { type: 'fill', target: 'select-reactivation-motif', value: 'perte' } });
        }
        if (/inactivit|pas utilis|longue/.test(msg)) {
          return NextResponse.json({ answer: isFr ? "Motif sélectionné : Longue période d'inactivité." : "Reason: Long inactivity.", action: { type: 'fill', target: 'select-reactivation-motif', value: 'inactivite' } });
        }
        if (/desactiv|bloqu/.test(msg)) {
          return NextResponse.json({ answer: isFr ? "Motif sélectionné : Puce désactivée." : "Reason: Disabled SIM.", action: { type: 'fill', target: 'select-reactivation-motif', value: 'desactivee' } });
        }
        if (/premier num|freq.*1|1er num/.test(msg)) {
          const digits = msg.replace(/\D/g,'');
          if (digits.length >= 6) return NextResponse.json({ answer: isFr ? "Premier numéro fréquent enregistré." : "First frequent number saved.", action: { type: 'fill', target: 'input-reactivation-freq1', value: digits } });
        }
        if (/deuxi.me num|freq.*2|2.me num/.test(msg)) {
          const digits = msg.replace(/\D/g,'');
          if (digits.length >= 6) return NextResponse.json({ answer: isFr ? "Deuxième numéro fréquent enregistré." : "Second frequent number saved.", action: { type: 'fill', target: 'input-reactivation-freq2', value: digits } });
        }
        const digits = msg.replace(/\D/g,'');
        if (digits.length >= 8) {
          return NextResponse.json({ answer: isFr ? "J'ai saisi le numéro à réactiver. Dites continuer pour valider." : "Number entered. Say continue to confirm.", action: { type: 'fill', target: 'input-reactivation-numero', value: digits } });
        }
      }

      // ── Page vérification réactivation ────────────────────────────
      if (currentStep === 'verification') {
        if (/continuer|paiement|suivant|valider/.test(msg)) {
          return NextResponse.json({ answer: isFr ? "Je vous amène à l'étape de paiement." : "Taking you to the payment step.", action: { type: 'click', target: 'btn-continuer-verification' } });
        }
      }
    }

    if (!grokApiKey) {
      console.warn("GROK_API_KEY non trouvée, utilisation du fallback.");
      return fallbackResponse(language, currentStep);
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.6-27b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message || "Guide-moi pour cette étape." }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AGENT IA] Erreur Groq API:", errText);
      return fallbackResponse(language, currentStep);
    }

    const data = await response.json();
    const resultContent = data.choices[0].message.content;

    try {
      // Nettoyage agressif du markdown (```json ... ```) au cas où le LLM l'ajoute
      const cleanContent = resultContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      
      const action: AgentAction = parsed.action && parsed.action.type
        ? { type: parsed.action.type, target: parsed.action.target || '', value: parsed.action.value }
        : { type: 'none', target: '' };

      console.log("[AGENT IA] Réponse Groq:", parsed);

      return NextResponse.json({
        answer: parsed.answer || "Je suis à votre écoute.",
        action,
        suggestions: parsed.suggestions || []
      });
    } catch (parseError) {
      console.error("[AGENT IA] Erreur parsing JSON:", resultContent, parseError);
      return fallbackResponse(language, currentStep);
    }

  } catch (error) {
    console.error('[AGENT IA] Erreur générale:', error);
    return fallbackResponse('fr', 'choix-langue');
  }
}

// Fallback complet — couvre toutes les étapes réelles du frontend
function fallbackResponse(lang: string | null, step: string) {
  const isFr = lang !== 'en';
  const noAction: AgentAction = { type: 'none', target: '' };

  const fallbacks: Record<string, string> = {
    'choix-langue': isFr
      ? "Bienvenue sur N'ma SIM ! Veuillez choisir votre langue."
      : "Welcome to N'ma SIM! Please choose your language.",
    'accueil-conditions': isFr
      ? "Bienvenue sur N'ma SIM. Veuillez accepter les conditions pour commencer."
      : "Welcome to N'ma SIM. Please accept the conditions to start.",
    'choix-service': isFr
      ? "Souhaitez-vous une nouvelle SIM, la réactivation d'une puce, ou une recharge ?"
      : "Would you like a new SIM, reactivation, or a recharge?",
    'scan-piece': isFr
      ? "Veuillez placer votre pièce d'identité sur le scanner."
      : "Please place your ID document on the scanner.",
    'confirmation-infos': isFr
      ? "Vérifiez et confirmez les informations extraites de votre pièce."
      : "Please verify and confirm the extracted information.",
    'selfie': isFr
      ? "Regardez la caméra et prenez un selfie pour la vérification."
      : "Please look at the camera and take a selfie.",
    'choix-offre': isFr
      ? "Choisissez l'offre SIM qui vous convient."
      : "Please choose the SIM offer that suits you.",
    'paiement': isFr
      ? "Veuillez procéder au paiement via Orange Money ou Carte Visa."
      : "Please proceed with payment via Orange Money or Visa Card.",
    'recu': isFr
      ? "Votre opération est terminée. Récupérez votre reçu en bas de la borne."
      : "Your operation is complete. Please collect your receipt.",
    'numero-reactivation': isFr
      ? "Veuillez saisir le numéro à réactiver, le motif de réactivation et les deux numéros que vous appelez souvent."
      : "Please enter the number to reactivate, the reason for reactivation, and the two frequently called numbers.",
    'motif-reactivation': isFr
      ? "Veuillez indiquer le motif de la réactivation."
      : "Please indicate the reason for reactivation.",
    'numeros-frequents': isFr
      ? "Saisissez deux numéros que vous appelez fréquemment."
      : "Please enter two numbers you frequently call.",
    'piece-identite': isFr
      ? "Veuillez scanner votre pièce d'identité pour continuer."
      : "Please scan your ID document to continue.",
    'verification': isFr
      ? "Nous vérifions les informations liées à votre ligne."
      : "We are verifying the information linked to your line.",
    'recharge-numero': isFr
      ? "Veuillez saisir le numéro de téléphone que vous souhaitez recharger."
      : "Please enter the phone number you wish to recharge.",
    'recharge-montant': isFr
      ? "Choisissez le montant de votre recharge."
      : "Please choose the amount for your recharge.",
    'felicitations': isFr
      ? "Félicitations ! Votre opération est réussie. Merci d'avoir utilisé N'ma SIM !"
      : "Congratulations! Your operation is successful. Thank you for using N'ma SIM!",
  };

  return NextResponse.json({
    answer: fallbacks[step] ?? (isFr
      ? "Je suis là pour vous accompagner sur la borne N'ma SIM."
      : "I am here to guide you on the N'ma SIM kiosk."),
    action: noAction,
    suggestions: []
  });
}
