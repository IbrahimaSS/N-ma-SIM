import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/agent-context';

export interface AgentAction {
  type: 'none' | 'navigate' | 'click' | 'fill';
  target: string;
  value?: string;
}

const noAction: AgentAction = { type: 'none', target: '' };

// ─── Utilitaire : extraire des chiffres d'un texte parlé ──────────────────────
function extractDigits(msg: string): string {
  return msg
    .replace(/zéro|zero/gi, '0').replace(/\bun\b/gi, '1').replace(/deux/gi, '2')
    .replace(/trois/gi, '3').replace(/quatre/gi, '4').replace(/cinq/gi, '5')
    .replace(/six/gi, '6').replace(/sept/gi, '7').replace(/huit/gi, '8')
    .replace(/neuf/gi, '9').replace(/\D/g, '');
}

// ─── Utilitaire : extraire un montant GNF d'un texte parlé ───────────────────
function extractMontant(msg: string): number {
  const lower = msg.toLowerCase();
  if (/cinquante\s*mille|50\s*000|50000/.test(lower)) return 50000;
  if (/vingt\s*mille|20\s*000|20000/.test(lower))    return 20000;
  if (/dix\s*mille|10\s*000|10000/.test(lower))      return 10000;
  if (/cinq\s*mille|5\s*000|5000/.test(lower))       return 5000;
  if (/deux\s*mille|2\s*000|2000/.test(lower))       return 2000;
  if (/\bmille\b|1\s*000|1000/.test(lower))          return 1000;
  const raw = lower.replace(/gnf|francs|fg|fr|\s/gi, '').replace(/\D/g, '');
  const n = parseInt(raw);
  return isNaN(n) ? 0 : n;
}

// ─── Normaliser un message (enlever accents, mettre en minuscule) ─────────────
function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
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

    const isFr = language !== 'en';
    const msg = normalize(message);
    const hasMessage = msg.length > 0;

    console.log('[AGENT IA] Payload:', { language, profile, termsAccepted, service, currentStep, message });

    // ══════════════════════════════════════════════════════════════════
    // RÈGLES DÉTERMINISTES — 100% fiables, pas de LLM nécessaire.
    // Ces règles couvrent TOUTES les commandes vocales attendues.
    // ══════════════════════════════════════════════════════════════════
    if (hasMessage) {

      // ── PAGE ACCUEIL / CONDITIONS ─────────────────────────────────────
      if (currentStep === 'accueil-conditions' || currentStep === 'choix-langue') {

        // Sélection du profil
        if (/resident|je suis resident|je suis un resident|local/.test(msg))
          return ok(isFr ? "J'ai sélectionné le profil Résident pour vous." : "I selected the Resident profile for you.",
            { type: 'click', target: 'btn-profil-resident' });

        if (/etranger|je suis etranger|foreigner|foreign|non.resident/.test(msg))
          return ok(isFr ? "J'ai sélectionné le profil Étranger pour vous." : "I selected the Foreigner profile for you.",
            { type: 'click', target: 'btn-profil-etranger' });

        // Sélection de la langue
        if (/\bfrancais\b|\bfrancaise\b|\ben francais\b|\bfrench\b/.test(msg))
          return ok("J'ai sélectionné le Français comme langue.",
            { type: 'click', target: 'btn-lang-fr' });

        if (/\banglais\b|\ben anglais\b|\benglish\b/.test(msg))
          return ok("I selected English as the language.",
            { type: 'click', target: 'btn-lang-en' });

        // Acceptation des conditions
        if (/accepter|j.accepte|oui|d.accord|commencer|start|accept/.test(msg))
          return ok(isFr ? "Très bien ! J'accepte les conditions pour vous." : "Great! I accept the conditions for you.",
            { type: 'click', target: 'btn-accepter' });
      }

      // ── PAGE CHOIX-SERVICE ───────────────────────────────────────────
      if (currentStep === 'choix-service') {
        if (/nouvelle sim|nouvelle carte|je veux une sim|carte sim|new sim/.test(msg))
          return ok(isFr ? "Je lance votre demande de nouvelle SIM." : "Launching your new SIM request.",
            { type: 'click', target: 'btn-nouvelle-sim' });

        if (/reactivation|reactiver|retrouver mon numero|reactivate/.test(msg))
          return ok(isFr ? "Je vous guide pour la réactivation." : "Guiding you to reactivate.",
            { type: 'click', target: 'btn-reactivation' });

        if (/recharge|recharger|crediter|credit|top.?up/.test(msg))
          return ok(isFr ? "Je lance la recharge." : "Launching recharge.",
            { type: 'click', target: 'btn-recharge' });

        if (/verif|consulter|profil|check/.test(msg))
          return ok(isFr ? "Je lance la vérification de votre profil." : "Launching profile verification.",
            { type: 'click', target: 'btn-verification' });
      }

      // ── PAGE SELFIE (nouvelle-sim ou reactivation) ───────────────────
      if (currentStep === 'selfie') {
        if (/selfie|photo|prendre|scanner|visage|camera|face/.test(msg))
          return ok(isFr ? "Je déclenche la capture de votre photo." : "Triggering your photo capture.",
            { type: 'click', target: 'btn-selfie' });
      }

      // ── PAGE PAIEMENT ─────────────────────────────────────────────────
      if (currentStep === 'paiement') {
        if (/confirmer|payer|valider|pay|confirm/.test(msg))
          return ok(isFr ? "Je confirme votre paiement." : "Confirming your payment.",
            { type: 'click', target: 'btn-confirmer-paiement' });
      }

      // ── PAGE REÇU / FIN ───────────────────────────────────────────────
      if (currentStep === 'recu' || currentStep === 'felicitations') {
        if (/terminer|finir|c.est bon|done|finish|end/.test(msg))
          return ok(isFr ? "Je termine l'opération pour vous." : "Finishing the operation for you.",
            { type: 'click', target: 'btn-terminer' });
      }

      // ── PAGE RÉACTIVATION — IDENTIFICATION ───────────────────────────
      if (currentStep === 'numero-reactivation') {
        // Motifs
        if (/perte|perdu|lost/.test(msg))
          return ok(isFr ? "Motif : Perte de carte SIM." : "Reason: Lost SIM.",
            { type: 'fill', target: 'select-reactivation-motif', value: 'perte' });
        if (/inactivit|pas utilis|longue|inactiv/.test(msg))
          return ok(isFr ? "Motif : Longue inactivité." : "Reason: Long inactivity.",
            { type: 'fill', target: 'select-reactivation-motif', value: 'inactivite' });
        if (/desactiv|bloqu|disabled/.test(msg))
          return ok(isFr ? "Motif : Puce désactivée." : "Reason: Disabled SIM.",
            { type: 'fill', target: 'select-reactivation-motif', value: 'desactivee' });

        // Continuer
        if (/^(continuer|valider|suivant|ok|continue|next)$/.test(msg))
          return ok(isFr ? "Je passe à l'étape suivante." : "Moving to next step.",
            { type: 'click', target: 'btn-continuer-reactivation' });

        // Numéros fréquents
        if (/premier.*(numero|num)|freq.*1|1er/.test(msg)) {
          const d = extractDigits(msg);
          if (d.length >= 6) return ok(isFr ? "Premier numéro enregistré." : "First number saved.",
            { type: 'fill', target: 'input-reactivation-freq1', value: d });
        }
        if (/deuxi.me.*(numero|num)|freq.*2|2.me/.test(msg)) {
          const d = extractDigits(msg);
          if (d.length >= 6) return ok(isFr ? "Deuxième numéro enregistré." : "Second number saved.",
            { type: 'fill', target: 'input-reactivation-freq2', value: d });
        }

        // Numéro principal à réactiver (8+ chiffres)
        const d = extractDigits(msg);
        if (d.length >= 8)
          return ok(isFr ? `J'ai saisi ${d}. Dites continuer pour valider.` : `Entered ${d}. Say continue to confirm.`,
            { type: 'fill', target: 'input-reactivation-numero', value: d });
      }

      // ── PAGE VÉRIFICATION RÉACTIVATION ───────────────────────────────
      if (currentStep === 'verification') {
        if (/continuer|paiement|suivant|valider|continue|next/.test(msg))
          return ok(isFr ? "Je vous amène au paiement." : "Taking you to payment.",
            { type: 'click', target: 'btn-continuer-verification' });
      }

      // ── PAGE RECHARGE — NUMÉRO ───────────────────────────────────────
      if (currentStep === 'recharge-numero') {
        if (/^(continuer|valider|c.est.bon|suivant|ok|continue|next)$/.test(msg))
          return ok(isFr ? "Je passe à l'étape suivante." : "Moving to next step.",
            { type: 'click', target: 'btn-continuer-recharge' });

        const d = extractDigits(msg);
        if (d.length >= 6)
          return ok(isFr ? `J'ai saisi le numéro ${d}. Dites continuer si c'est correct.` : `Entered ${d}. Say continue if correct.`,
            { type: 'fill', target: 'input-recharge-numero', value: d });
      }

      // ── PAGE RECHARGE — MONTANT ───────────────────────────────────────
      if (currentStep === 'recharge-montant') {
        if (/^(continuer|valider|c.est.bon|suivant|payer|ok|continue|pay)$/.test(msg))
          return ok(isFr ? "Je passe au paiement." : "Proceeding to payment.",
            { type: 'click', target: 'btn-continuer-montant' });

        const montant = extractMontant(msg);
        if (montant >= 1000)
          return ok(isFr ? `J'ai sélectionné ${montant.toLocaleString('fr-FR')} GNF. Dites continuer pour valider.` : `Selected ${montant} GNF. Say continue to confirm.`,
            { type: 'fill', target: 'select-recharge-montant', value: String(montant) });
      }

      // ── PAGE CHOIX OFFRE (nouvelle-sim) ──────────────────────────────
      if (currentStep === 'choix-offre') {
        if (/sans offre|sim seule|continuer|pas d.offre|no offer|continue/.test(msg))
          return ok(isFr ? "Je continue sans offre supplémentaire." : "Continuing without extra offer.",
            { type: 'click', target: 'btn-continuer-offres' });

        if (/avec recharge|ajouter recharge|with recharge/.test(msg))
          return ok(isFr ? "J'ai sélectionné l'offre Recharge." : "Recharge offer selected.",
            { type: 'fill', target: 'select-offre', value: 'recharge' });

        const montantOffre = extractMontant(msg);
        if (montantOffre >= 1000)
          return ok(isFr ? `Montant de recharge : ${montantOffre.toLocaleString('fr-FR')} GNF.` : `Recharge amount: ${montantOffre} GNF.`,
            { type: 'fill', target: 'select-offre-montant', value: String(montantOffre) });
      }

      // ── SELFIE VÉRIFICATION ───────────────────────────────────────────
      if (currentStep === 'verification-selfie') {
        if (/selfie|photo|prendre|scanner|visage|camera/.test(msg))
          return ok(isFr ? "Je déclenche la capture." : "Triggering capture.",
            { type: 'click', target: 'btn-selfie' });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // APPEL AU LLM GROQ — seulement si pas de règle déterministe
    // Modèle : llama-3.1-70b-versatile (meilleur pour JSON strict sur Groq)
    // ══════════════════════════════════════════════════════════════════
    const groqApiKey = process.env.GROK_API_KEY;
    if (!groqApiKey) {
      console.warn('[AGENT IA] GROK_API_KEY manquante → fallback');
      return fallbackResponse(language, currentStep, isFr);
    }

    // Construire un prompt dynamique et ciblé sur l'étape actuelle
    const systemPrompt = buildSystemPrompt(language, profile, termsAccepted, service, currentStep);

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',   // ← Modèle le plus puissant disponible sur Groq
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message || (isFr ? 'Guide-moi pour cette étape.' : 'Guide me for this step.') }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,   // ← Plus bas = plus précis, moins d'hallucinations
        max_tokens: 300,    // ← Réponse courte, on n'a besoin que de 2 phrases max
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('[AGENT IA] Erreur Groq API:', errText);
      return fallbackResponse(language, currentStep, isFr);
    }

    const data = await groqRes.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    try {
      const clean = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);

      const action: AgentAction = parsed.action?.type
        ? { type: parsed.action.type, target: parsed.action.target || '', value: parsed.action.value }
        : noAction;

      console.log('[AGENT IA] Réponse Groq parsée:', parsed);

      return NextResponse.json({
        answer: parsed.answer || (isFr ? "Je suis à votre écoute." : "I'm listening."),
        action,
      });
    } catch (parseErr) {
      console.error('[AGENT IA] Erreur parsing JSON Groq:', rawContent, parseErr);
      return fallbackResponse(language, currentStep, isFr);
    }

  } catch (error) {
    console.error('[AGENT IA] Erreur générale:', error);
    return fallbackResponse('fr', 'choix-langue', true);
  }
}

// ─── Helper pour les réponses déterministes ───────────────────────────────────
function ok(answer: string, action: AgentAction = noAction) {
  return NextResponse.json({ answer, action });
}

// ─── Fallback complet — une réponse par étape, aucun LLM requis ──────────────
function fallbackResponse(lang: string | null, step: string, isFr: boolean) {
  const fallbacks: Record<string, [string, string]> = {
    'choix-langue':          ["Bienvenu sur N'ma SIM ! Veuillez sélectionner votre profil et accepter les conditions d'utilisation pour commencer.", "Welcome to N'ma SIM! Please select your profile and accept the terms of use to get started."],
    'accueil-conditions':    ["Bienvenu sur N'ma SIM ! Veuillez sélectionner votre profil et accepter les conditions d'utilisation pour commencer.", "Welcome to N'ma SIM! Please select your profile and accept the terms of use to get started."],
    'choix-service':         ["Choisissez un service : Nouvelle SIM, Réactivation, Recharge ou Vérification.", "Choose a service: New SIM, Reactivation, Recharge, or Verification."],
    'scan-piece':            ["Veuillez choisir le type de pièce et la placer sur le scanner.", "Please choose your document type and place it on the scanner."],
    'confirmation-infos':    ["Vérifiez les informations extraites et corrigez si nécessaire.", "Verify the extracted information and correct if needed."],
    'selfie':                ["Regardez la caméra et prenez votre selfie pour la vérification.", "Look at the camera and take your selfie for verification."],
    'choix-offre':           ["Choisissez une offre ou continuez avec la SIM seule.", "Choose an offer or continue with SIM only."],
    'paiement':              ["Procédez au paiement via Orange Money ou Carte Visa.", "Proceed with payment via Orange Money or Visa Card."],
    'recu':                  ["Votre opération est en cours. Récupérez votre reçu.", "Your operation is being processed. Please collect your receipt."],
    'felicitations':         ["Félicitations ! Votre opération est réussie. Merci d'avoir utilisé N'ma SIM !", "Congratulations! Your operation was successful. Thank you for using N'ma SIM!"],
    'numero-reactivation':   ["Saisissez le numéro à réactiver, le motif et vos deux numéros fréquents.", "Enter the number to reactivate, the reason, and your two frequent numbers."],
    'piece-identite':        ["Veuillez scanner votre pièce d'identité pour continuer.", "Please scan your ID document to continue."],
    'verification':          ["Nous vérifions vos informations. Dites continuer quand vous êtes prêt.", "We are verifying your information. Say continue when ready."],
    'recharge-numero':       ["Saisissez le numéro de téléphone à recharger.", "Enter the phone number you wish to recharge."],
    'recharge-montant':      ["Choisissez le montant de votre recharge.", "Choose the amount for your recharge."],
    'verification-scan-piece': ["Scannez votre pièce d'identité pour consulter votre profil.", "Scan your ID to view your profile."],
    'verification-selfie':   ["Prenez un selfie pour la vérification biométrique.", "Take a selfie for biometric verification."],
    'verification-resultat': ["Voici les informations associées à votre pièce d'identité.", "Here is the information linked to your ID document."],
  };

  const [fr, en] = fallbacks[step] ?? ["Je suis là pour vous accompagner.", "I'm here to guide you."];
  return NextResponse.json({ answer: isFr ? fr : en, action: noAction });
}
