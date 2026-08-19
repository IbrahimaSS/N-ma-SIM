"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Bot, Volume2, VolumeX, RefreshCw, Send, X } from "lucide-react";

interface AgentIAProps {
  language?: "fr" | "en" | null;
  profile?: "resident" | "etranger" | null;
  termsAccepted?: boolean;
  service?: "nouvelle-sim" | "reactivation" | null;
  step?: string;
}

export function AgentIA({ language = null, profile = null, termsAccepted = false, step = "accueil", service = null }: AgentIAProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionLang, setSessionLang] = useState<string | null>(null);
  const [sessionProfile, setSessionProfile] = useState<string | null>(null);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  // Mettre à jour la session globale à chaque changement de page
  useEffect(() => {
    setSessionLang(sessionStorage.getItem("kiosk_lang"));
    setSessionProfile(sessionStorage.getItem("kiosk_profile"));
  }, [pathname]);

  // Déduire l'étape automatiquement d'après l'URL
  let currentStep = step;
  let currentService = service;
  let currentLang = language;
  let currentProfile = profile;
  let currentTerms = termsAccepted;
  
  if (pathname) {
    // === ÉTAPES COMMUNES ===
    if (pathname === '/borne' || pathname === '/borne/') {
      currentStep = 'choix-langue';
    }
    else if (pathname.includes('/borne/accueil')) {
      currentStep = 'accueil-conditions';
      currentTerms = false;
    }
    else if (pathname.includes('/borne/services')) {
      currentStep = 'choix-service';
      currentTerms = true;
      currentProfile = currentProfile || 'resident';
    }
    // === NOUVELLE SIM ===
    else if (pathname.includes('/nouvelle-sim/scan-piece')) {
      currentStep = 'scan-piece';
      currentService = 'nouvelle-sim';
    }
    else if (pathname.includes('/nouvelle-sim/confirmation-infos')) {
      currentStep = 'confirmation-infos';
      currentService = 'nouvelle-sim';
    }
    else if (pathname.includes('/nouvelle-sim/selfie')) {
      currentStep = 'selfie';
      currentService = 'nouvelle-sim';
    }
    else if (pathname.includes('/nouvelle-sim/offres')) {
      currentStep = 'choix-offre';
      currentService = 'nouvelle-sim';
    }
    else if (pathname.includes('/nouvelle-sim/paiement')) {
      currentStep = 'paiement';
      currentService = 'nouvelle-sim';
    }
    else if (pathname.includes('/nouvelle-sim/recu')) {
      currentStep = isSuccess ? 'felicitations' : 'recu';
      currentService = 'nouvelle-sim';
    }
    // === RÉACTIVATION ===
    else if (pathname.includes('/reactivation/identification')) {
      currentStep = 'numero-reactivation';
      currentService = 'reactivation';
    }
    else if (pathname.includes('/reactivation/motif')) {
      currentStep = 'motif-reactivation';
      currentService = 'reactivation';
    }
    else if (pathname.includes('/reactivation/numeros-frequents')) {
      currentStep = 'numeros-frequents';
      currentService = 'reactivation';
    }
    else if (pathname.includes('/reactivation/piece-identite')) {
      currentStep = 'piece-identite';
      currentService = 'reactivation';
    }
    else if (pathname.includes('/reactivation/selfie')) {
      currentStep = 'selfie';
      currentService = 'reactivation';
    }
    else if (pathname.includes('/reactivation/verification')) {
      currentStep = 'verification';
      currentService = 'reactivation';
    }
    else if (pathname.includes('/reactivation/paiement')) {
      currentStep = 'paiement';
      currentService = 'reactivation';
    }
    else if (pathname.includes('/reactivation/recu')) {
      currentStep = isSuccess ? 'felicitations' : 'recu';
      currentService = 'reactivation';
    }

    // Auto-déductions à partir de la mémoire de la session
    currentLang = (sessionLang as "fr" | "en" | null) || currentLang || 'fr';
    currentProfile = (sessionProfile as "resident" | "etranger" | null) || currentProfile || 'resident';

    // Si on est dans un service, les conditions sont forcément acceptées
    const postTermsSteps = ['choix-service', 'scan-piece', 'confirmation-infos', 'selfie',
      'choix-offre', 'paiement', 'recu', 'numero-reactivation', 'motif-reactivation',
      'numeros-frequents', 'piece-identite', 'verification'];
    if (postTermsSteps.includes(currentStep)) {
      currentTerms = true;
      currentProfile = currentProfile || 'resident';
    }
  }

  // Référence pour suivre les changements d'étape
  const prevStepRef = useRef(currentStep);
  const hasTriggeredInitial = useRef(false);

  // Déclencher l'IA automatiquement quand l'utilisateur avance dans le formulaire (change de page)
  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      prevStepRef.current = currentStep;
      sendMessage("", true);
    }
  }, [currentStep]);

  // Message de bienvenue automatique au chargement initial
  useEffect(() => {
    if (!hasTriggeredInitial.current) {
      hasTriggeredInitial.current = true;
      sendMessage("", true); // Le vide déclenche l'accueil backend
    }
  }, []);

  // Fonction vocale native du navigateur
  const speak = (text: string) => {
    if (isMuted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === "en" ? "en-US" : "fr-FR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const sendMessage = async (userText: string, isInitial = false) => {
    setIsLoading(true);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/api/agent-ia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: currentLang,
          profile: currentProfile,
          termsAccepted: currentTerms,
          service: currentService,
          currentStep: currentStep,
          message: userText
        })
      });
      
      const data = await res.json();
      
      if (data.answer) {
        speak(data.answer);
      }
    } catch (err) {
      console.error("Erreur appel Agent IA", err);
      const fallback = currentLang === 'en' 
        ? "Sorry, I am currently experiencing technical difficulties."
        : "Désolé, je rencontre des difficultés techniques actuellement.";
      speak(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMute = () => {
    if (!isMuted) stopSpeaking();
    setIsMuted(!isMuted);
  };

  // Rendu de la Sphère Animée (Orbe IA)
  return (
    <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <button 
        onClick={handleToggleMute}
        style={{
          width: 80, height: 80, borderRadius: "50%",
          background: isMuted ? "#E5E7EB" : "linear-gradient(135deg, #1F0270, #3B0CB8, #FFBA08)",
          backgroundSize: "200% 200%",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: isMuted ? "none" : (isLoading ? "0 0 30px rgba(255,186,8,0.6)" : "0 8px 32px rgba(31,2,112,0.4)"),
          animation: isMuted ? "none" : (isLoading ? "spinGradient 2s linear infinite, pulseOrb 1.5s ease-in-out infinite" : "floatOrb 4s ease-in-out infinite"),
          transition: "all 0.3s ease"
        }}
        title={isMuted ? "Activer la voix de l'IA" : "Désactiver la voix"}
      >
        <div style={{
          width: "85%", height: "85%", borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0))",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white"
        }}>
           {isMuted ? <VolumeX size={28} color="#9CA3AF" /> : <Bot size={32} color="white" />}
        </div>
      </button>

      {!isMuted && (
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1F0270", opacity: 0.7, background: "rgba(255,255,255,0.8)", padding: "2px 8px", borderRadius: 12 }}>
          {isLoading ? "L'IA réfléchit..." : "IA Active"}
        </span>
      )}
      
      <style>{`
        @keyframes spinGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseOrb {
          0% { transform: scale(0.95); box-shadow: 0 0 20px rgba(255,186,8,0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(255,186,8,0.8); }
          100% { transform: scale(0.95); box-shadow: 0 0 20px rgba(255,186,8,0.4); }
        }
        @keyframes floatOrb {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
