"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bot, Mic, MicOff, VolumeX, Volume2 } from "lucide-react";
import { jouerSoussou } from "@/lib/soussou-audio";

interface AgentIAProps {
  language?: "fr" | "en" | "sus" | null;
  profile?: "resident" | "etranger" | null;
  termsAccepted?: boolean;
  service?: "nouvelle-sim" | "reactivation" | null;
  step?: string;
}

interface AgentAction {
  type: "none" | "navigate" | "click" | "fill";
  target: string;
  value?: string;
}

// Déclaration globale SpeechRecognition (API native navigateur)
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function AgentIA({
  language = null,
  profile = null,
  termsAccepted = false,
  step = "accueil",
  service = null,
}: AgentIAProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Lecture SYNCHRONE du sessionStorage — pas de useState async qui arrive trop tard
  // typeof window !== 'undefined' : garde pour le rendu SSR de Next.js
  const sessionLang    = typeof window !== 'undefined' ? sessionStorage.getItem("kiosk_lang")    : null;
  const sessionProfile = typeof window !== 'undefined' ? sessionStorage.getItem("kiosk_profile") : null;

  // Bulle de dialogue
  const [bubble, setBubble] = useState<{ user?: string; ai?: string } | null>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Déduire l'étape et le service d'après l'URL
  let currentStep = step;
  let currentService = service;
  let currentLang = language;
  let currentProfile = profile;
  let currentTerms = termsAccepted;

  if (pathname) {
    if (pathname === "/borne" || pathname === "/borne/")         currentStep = "choix-langue";
    else if (pathname.includes("/borne/accueil"))               currentStep = "accueil-conditions";
    else if (pathname.includes("/borne/services"))              { currentStep = "choix-service"; currentTerms = true; }
    // Nouvelle SIM
    else if (pathname.includes("/nouvelle-sim/scan-piece"))     { currentStep = "scan-piece"; currentService = "nouvelle-sim"; }
    else if (pathname.includes("/nouvelle-sim/confirmation"))   { currentStep = "confirmation-infos"; currentService = "nouvelle-sim"; }
    else if (pathname.includes("/nouvelle-sim/selfie"))         { currentStep = "selfie"; currentService = "nouvelle-sim"; }
    else if (pathname.includes("/nouvelle-sim/offres"))         { currentStep = "choix-offre"; currentService = "nouvelle-sim"; }
    else if (pathname.includes("/nouvelle-sim/paiement"))       { currentStep = "paiement"; currentService = "nouvelle-sim"; }
    else if (pathname.includes("/nouvelle-sim/recu"))           { currentStep = isSuccess ? "felicitations" : "recu"; currentService = "nouvelle-sim"; }
    // Réactivation
    else if (pathname.includes("/reactivation/identification")) { currentStep = "numero-reactivation"; currentService = "reactivation"; }
    else if (pathname.includes("/reactivation/motif"))          { currentStep = "motif-reactivation"; currentService = "reactivation"; }
    else if (pathname.includes("/reactivation/numeros-frequents")) { currentStep = "numeros-frequents"; currentService = "reactivation"; }
    else if (pathname.includes("/reactivation/piece-identite")) { currentStep = "piece-identite"; currentService = "reactivation"; }
    else if (pathname.includes("/reactivation/selfie"))         { currentStep = "selfie"; currentService = "reactivation"; }
    else if (pathname.includes("/reactivation/verification"))   { currentStep = "verification"; currentService = "reactivation"; }
    else if (pathname.includes("/reactivation/paiement"))       { currentStep = "paiement"; currentService = "reactivation"; }
    else if (pathname.includes("/reactivation/recu"))           { currentStep = isSuccess ? "felicitations" : "recu"; currentService = "reactivation"; }
    // Recharge
    else if (pathname.includes("/recharge/numero"))             { currentStep = "recharge-numero"; currentService = null; }
    else if (pathname.includes("/recharge/montant"))            { currentStep = "recharge-montant"; currentService = null; }
    else if (pathname.includes("/recharge/paiement"))           { currentStep = "paiement"; currentService = null; }
    // Vérification de profil
    else if (pathname.includes("/verification/resultat"))       { currentStep = "verification-resultat"; currentService = null; }
    else if (pathname.includes("/verification/selfie"))         { currentStep = "verification-selfie"; currentService = null; }
    else if (pathname.includes("/verification/scan-piece"))     { currentStep = "verification-scan-piece"; currentService = null; }

    currentLang = (sessionLang as "fr" | "en" | "sus" | null) || currentLang || "fr";
    currentProfile = (sessionProfile as "resident" | "etranger" | null) || currentProfile || "resident";

    const postTermsSteps = ["choix-service", "scan-piece", "confirmation-infos", "selfie",
      "choix-offre", "paiement", "recu", "numero-reactivation", "motif-reactivation",
      "numeros-frequents", "piece-identite", "verification", "recharge-numero", "recharge-montant"];
    if (postTermsSteps.includes(currentStep)) {
      currentTerms = true;
      currentProfile = currentProfile || "resident";
    }
  }

  // Références pour suivre les changements
  const prevStepRef = useRef(currentStep);
  const hasTriggeredInitial = useRef(false);
  const recognitionRef = useRef<any>(null);
  const keepListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);

  // ─── Affichage de la bulle de dialogue ─────────────────────────────────────
  const showBubble = useCallback((data: { user?: string; ai?: string }) => {
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    setBubble(data);
    bubbleTimerRef.current = setTimeout(() => setBubble(null), 6000);
  }, []);

  // ─── Synthèse vocale + Audio Soussou ────────────────────────────────────────────
  const speak = useCallback((text: string, lang: string) => {
    if (isMuted) return;

    // ═ Soussou : jouer le fichier WAV correspondant à l'étape ═
    if (lang === 'sus') {
      jouerSoussou(currentStep, currentService);
      return;
    }

    // ═ Français / Anglais : synthèse vocale navigateur ═
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "en" ? "en-US" : "fr-FR";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => { isSpeakingRef.current = true; };
      utterance.onend = () => { isSpeakingRef.current = false; };
      utterance.onerror = () => { isSpeakingRef.current = false; };

      window.speechSynthesis.speak(utterance);
    }, 50);
  }, [isMuted, currentStep, currentService]);

  // ─── Exécuter une action retournée par Groq ────────────────────────────────────
  const executeAction = useCallback((action: AgentAction) => {
    if (!action || action.type === "none") return;

    if (action.type === "navigate" && action.target) {
      setTimeout(() => router.push(action.target), 1200);
    }

    if (action.type === "click" && action.target) {
      setTimeout(() => {
        const el = document.querySelector(`[data-ai-action="${action.target}"]`) as HTMLElement | null;
        if (el) el.click();
      }, 1200);
    }

    if (action.type === "fill" && action.target && action.value !== undefined) {
      setTimeout(() => {
        // Dispatcher un événement personnalisé 'ai-fill' que la page peut écouter
        const event = new CustomEvent('ai-fill', {
          detail: { target: action.target, value: action.value },
          bubbles: true
        });
        document.dispatchEvent(event);
      }, 800);
    }
  }, [router]);

  // ─── Envoi du message au backend Groq ──────────────────────────────────────
  const sendMessage = useCallback(async (userText: string, isInitial = false) => {

    // ══ SOUSSOU : pas de Groq, pas de bulle — juste le WAV ══
    if (currentLang === 'sus') {
      jouerSoussou(currentStep, currentService);
      return;
    }

    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${baseUrl}/api/agent-ia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: currentLang,
          profile: currentProfile,
          termsAccepted: currentTerms,
          service: currentService,
          currentStep,
          message: userText,
        }),
      });

      const data = await res.json();

      if (data.answer) {
        speak(data.answer, currentLang || "fr");
        if (!isInitial) {
          showBubble({ user: userText, ai: data.answer });
        } else {
          showBubble({ ai: data.answer });
        }
      }

      if (data.action) {
        executeAction(data.action);
      }
    } catch (err) {
      console.error("Erreur appel Agent IA", err);
      const fallback = currentLang === "en"
        ? "Sorry, I am currently experiencing technical difficulties."
        : "Désolé, je rencontre des difficultés techniques actuellement.";
      speak(fallback, currentLang || "fr");
    } finally {
      setIsLoading(false);
    }
  }, [currentLang, currentProfile, currentTerms, currentService, currentStep, speak, showBubble, executeAction]);

  // ─── Déclenchement automatique au changement d'étape ───────────────────────
  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      prevStepRef.current = currentStep;
      sendMessage("", true);
    }
  }, [currentStep, sendMessage]);

  // ─── Message de bienvenue initial ──────────────────────────────────────────
  useEffect(() => {
    if (!hasTriggeredInitial.current) {
      hasTriggeredInitial.current = true;
      sendMessage("", true);
    }
  }, [sendMessage]);
  // ─── Reconnaissance vocale (SpeechRecognition) ─────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome ou Safari.");
      return;
    }

    keepListeningRef.current = true;
    window.speechSynthesis.cancel(); // Arrêter l'IA qui parle (optionnel maintenant)
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.lang = currentLang === "en" ? "en-US" : "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      if (isSpeakingRef.current) return; // Ne pas s'écouter parler !
      const transcript = event.results[0][0].transcript;
      sendMessage(transcript, false);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        keepListeningRef.current = false;
        setIsListening(false);
      }
    };
    
    recognition.onend = () => {
      if (keepListeningRef.current) {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          // Ignorer si déjà démarré
        }
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
    } catch(e) {}
  }, [currentLang, sendMessage]);

  const stopListening = useCallback(() => {
    keepListeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleToggleMute = () => {
    if (!isMuted) window.speechSynthesis?.cancel();
    setIsMuted(!isMuted);
  };

  // ─── Couleur et animation de l'orbe selon l'état ───────────────────────────
  const orbColor = isListening
    ? "linear-gradient(135deg, #DC2626, #EF4444, #FF6B6B)"
    : isMuted
    ? "#E5E7EB"
    : "linear-gradient(135deg, #1F0270, #3B0CB8, #FFBA08)";

  const orbAnimation = isListening
    ? "pulseRed 1s ease-in-out infinite"
    : isMuted
    ? "none"
    : isLoading
    ? "pulseOrb 1.5s ease-in-out infinite"
    : "floatOrb 4s ease-in-out infinite";

  const orbLabel = isListening
    ? "🎤 Écoute..."
    : isLoading
    ? "Réflexion..."
    : isMuted
    ? "IA en sourdine"
    : "IA Active";

  return (
    <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>

      {/* ─── Bulle de dialogue ─────────────────────────────────────────── */}
      {bubble && (
        <div style={{
          background: "white",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(31,2,112,0.15)",
          padding: "14px 18px",
          maxWidth: 280,
          border: "1px solid #E5E7EB",
          animation: "fadeInUp 0.3s ease-out",
        }}>
          {bubble.user && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>VOUS</span>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151", fontStyle: "italic" }}>
                &ldquo;{bubble.user}&rdquo;
              </p>
            </div>
          )}
          {bubble.ai && (
            <div>
              <span style={{ fontSize: 10, color: "#1F0270", fontWeight: 700 }}>N&apos;MA IA</span>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#1F0270", fontWeight: 500, lineHeight: 1.5 }}>
                {bubble.ai}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Contrôles (Micro + Muet) ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

        {/* Bouton Micro */}
        <button
          onClick={isListening ? stopListening : startListening}
          title={isListening ? "Arrêter l'écoute" : "Parler à l'IA"}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: isListening ? "#DC2626" : "#F3F4F6",
            border: isListening ? "2px solid #EF4444" : "2px solid #E5E7EB",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isListening ? "0 0 20px rgba(220,38,38,0.4)" : "none",
            transition: "all 0.2s ease",
            animation: isListening ? "pulseRed 1s ease-in-out infinite" : "none",
          }}
        >
          {isListening
            ? <MicOff size={20} color="white" />
            : <Mic size={20} color="#374151" />
          }
        </button>

        {/* Bouton Muet */}
        <button
          onClick={handleToggleMute}
          title={isMuted ? "Activer la voix" : "Désactiver la voix"}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: isMuted ? "#F3F4F6" : "#EEF2FF",
            border: isMuted ? "2px solid #E5E7EB" : "2px solid #C7D2FE",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease",
          }}
        >
          {isMuted ? <VolumeX size={20} color="#9CA3AF" /> : <Volume2 size={20} color="#4F46E5" />}
        </button>

        {/* Orbe principale IA */}
        <button
          onClick={() => sendMessage("", true)}
          title="Répéter le guide IA"
          style={{
            width: 72, height: 72, borderRadius: "50%",
            backgroundImage: typeof orbColor === 'string' && orbColor.startsWith('linear') ? orbColor : 'none',
            backgroundColor: typeof orbColor === 'string' && !orbColor.startsWith('linear') ? orbColor : 'transparent',
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isMuted ? "none" : "0 8px 32px rgba(31,2,112,0.35)",
            animation: orbAnimation,
            transition: "all 0.3s ease",
          }}
        >
          <div style={{
            width: "85%", height: "85%", borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bot size={28} color={isMuted ? "#9CA3AF" : "white"} />
          </div>
        </button>
      </div>

      {/* Label état */}
      <span style={{
        fontSize: 11, fontWeight: 700, textAlign: "center",
        color: isListening ? "#DC2626" : "#1F0270",
        opacity: 0.8,
        background: "rgba(255,255,255,0.85)",
        padding: "2px 10px", borderRadius: 12,
        backdropFilter: "blur(4px)",
      }}>
        {orbLabel}
      </span>

      {/* Styles CSS */}
      <style>{`
        @keyframes pulseOrb {
          0% { transform: scale(0.95); box-shadow: 0 0 20px rgba(255,186,8,0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(255,186,8,0.8); }
          100% { transform: scale(0.95); box-shadow: 0 0 20px rgba(255,186,8,0.4); }
        }
        @keyframes pulseRed {
          0% { transform: scale(0.97); box-shadow: 0 0 10px rgba(220,38,38,0.3); }
          50% { transform: scale(1.03); box-shadow: 0 0 25px rgba(220,38,38,0.7); }
          100% { transform: scale(0.97); box-shadow: 0 0 10px rgba(220,38,38,0.3); }
        }
        @keyframes floatOrb {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
