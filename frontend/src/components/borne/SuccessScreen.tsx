"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SuccessScreenProps {
  type?: "nouvelle-sim" | "reactivation";
  ticketRef?: string;
}

export function SuccessScreen({ type = "nouvelle-sim", ticketRef = "NMA-2026-0001" }: SuccessScreenProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [lang, setLang] = useState("fr");

  useEffect(() => { setLang(sessionStorage.getItem("kiosk_lang") || "fr"); }, []);

  // Compte à rebours puis redirection automatique
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/borne/accueil");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  const isReactivation = type === "reactivation";

  return (
    <div
      className="animate-in zoom-in-95 duration-700"
      style={{
        width: "100%", height: "100%", minHeight: "60vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}
    >
      {/* Contenu central (effet carte de verre) */}
      <div style={{
        background: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        boxShadow: "0 24px 60px rgba(31, 2, 112, 0.08)",
        borderRadius: 32,
        display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center",
        padding: "48px 64px", maxWidth: 600, width: "100%",
      }}>

        {/* Icône SIM Card SVG custom */}
        <div style={{
          width: 120, height: 120, marginBottom: 32,
          background: "linear-gradient(135deg, #FFBA08, #FFD55A)",
          borderRadius: 28, display: "flex", alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 0 16px rgba(255,186,8,0.12), 0 0 0 32px rgba(255,186,8,0.06)",
          animation: "bounce 1.2s ease-in-out 0.5s 1",
        }}>
          {/* SVG Carte SIM */}
          <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Corps de la carte SIM */}
            <rect x="12" y="4" width="44" height="60" rx="6" fill="#1F0270" />
            {/* Encoche SIM (coin coupé) */}
            <polygon points="12,4 28,4 12,18" fill="#FFBA08" />
            {/* Puce dorée */}
            <rect x="22" y="22" width="24" height="20" rx="4" fill="#FFBA08" />
            {/* Lignes de la puce */}
            <line x1="22" y1="29" x2="46" y2="29" stroke="#1F0270" strokeWidth="1.5" />
            <line x1="22" y1="34" x2="46" y2="34" stroke="#1F0270" strokeWidth="1.5" />
            <line x1="28" y1="22" x2="28" y2="42" stroke="#1F0270" strokeWidth="1.5" />
            <line x1="34" y1="22" x2="34" y2="42" stroke="#1F0270" strokeWidth="1.5" />
            <line x1="40" y1="22" x2="40" y2="42" stroke="#1F0270" strokeWidth="1.5" />
            {/* Check mark en dessous */}
            <circle cx="34" cy="54" r="6" fill="#22C55E" />
            <path d="M31 54 L33 56.5 L37 51.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Titre */}
        <h1 style={{
          fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 900,
          color: "#1F0270", margin: "0 0 12px 0",
          letterSpacing: "-1px",
        }}>
          {lang === "en" ? "Congratulations!" : "Félicitations !"}
        </h1>

        {/* Sous-titre */}
        <p style={{
          fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 700,
          color: "#374151", margin: "0 0 8px 0",
        }}>
          {isReactivation
            ? (lang === "en" ? "Your SIM has been reactivated successfully." : "Votre puce a été réactivée avec succès.")
            : (lang === "en" ? "Your SIM Card is ready!" : "Votre Carte SIM est prête !")}
        </p>

        {/* Message principal */}
        <p style={{
          fontSize: "clamp(14px, 1.4vw, 17px)",
          color: "#6B7280", margin: "0 0 32px 0", lineHeight: 1.6,
        }}>
          {isReactivation
            ? (lang === "en" ? "Your network will be active in a few minutes. You can collect your receipt at the bottom of the kiosk." : "Votre réseau sera actif dans quelques minutes. Vous pouvez récupérer votre reçu en bas de la borne.")
            : (lang === "en" ? "Please collect your SIM Card and your receipt at the bottom of the kiosk." : "Veuillez récupérer votre Carte SIM et votre reçu en bas de la borne.")}
        </p>

        {/* Référence ticket */}
        <div style={{
          background: "white", border: "1px solid #E5E7EB", 
          borderRadius: 16, padding: "14px 32px", marginBottom: 36,
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
        }}>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600 }}>
            {lang === "en" ? "Reference" : "Référence"}
          </p>
          <p style={{ fontSize: 24, fontWeight: 900, color: "#1F0270", margin: 0, letterSpacing: 3 }}>
            {ticketRef}
          </p>
        </div>

        {/* Barre de progression du countdown */}
        <div style={{
          width: "100%", maxWidth: 300, height: 6,
          background: "#E5E7EB", borderRadius: 6, overflow: "hidden",
          marginBottom: 12,
        }}>
          <div style={{
            height: "100%", background: "#1F0270", borderRadius: 6,
            width: `${(countdown / 10) * 100}%`,
            transition: "width 1s linear",
          }} />
        </div>

        <p style={{ fontSize: 13, color: "#6B7280", margin: 0, fontWeight: 500 }}>
          {lang === "en" 
            ? `Back to home in ${countdown} second${countdown > 1 ? "s" : ""}...`
            : `Retour à l'accueil dans ${countdown} seconde${countdown > 1 ? "s" : ""}...`}
        </p>
      </div>

      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50% { transform: scale(1.15) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}
