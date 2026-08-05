"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Globe, Briefcase, User as UserIcon,
  HelpCircle, ArrowRight, Check, Hand,
} from "lucide-react";

export default function Accueil() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [lang, setLang] = useState<"fr" | "en" | null>("fr");
  const [profile, setProfile] = useState<"resident" | "etranger" | null>(null);

  // Sauvegarde globale de la session pour l'Agent IA et les autres pages
  useEffect(() => {
    if (lang) sessionStorage.setItem("kiosk_lang", lang);
    if (profile) sessionStorage.setItem("kiosk_profile", profile);
  }, [lang, profile]);

  // Le bouton est actif si tout est sélectionné
  const canStart = accepted && lang !== null && profile !== null;

  return (
    <div
      className="relative z-10 flex flex-col items-center"
      style={{ width: "100%", paddingTop: "16px", paddingBottom: "60px" }}
    >

      {/* =============================================
          1. LOGO — image réelle, centrée en haut
      ============================================= */}
      <div 
        className="w-[260px] h-[80px] lg:w-[360px] lg:h-[120px]"
        style={{
          background: "white",
          borderRadius: "0 0 24px 24px",
          boxShadow: "0 4px 24px rgba(31,2,112,0.10)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 10,
        }}
      >
        <img
          src="/logo-transparent.png"
          alt="N'ma SIM Logo"
          className="w-[95%] scale-[1.15] lg:w-[100%] lg:scale-[1.2]"
          style={{ display: "block" }}
        />
      </div>

      {/* =============================================
          2. SLOGAN
      ============================================= */}
      <p style={{ marginTop: 24, marginBottom: 20, fontSize: "clamp(16px, 1.4vw, 20px)", fontWeight: 700, textAlign: "center" }}>
        <span style={{ color: "#1F0270" }}>{lang === "en" ? "Your SIM, " : "Votre SIM, "}</span>
        <span style={{ color: "#FFBA08" }}>{lang === "en" ? "simply." : "en toute simplicité."}</span>
      </p>

      {/* =============================================
          3. CARTE CENTRALE
      ============================================= */}
      <div style={{
        width: 660,
        maxWidth: "92vw",
        background: "white",
        borderRadius: 24,
        padding: "clamp(24px, 3vh, 40px) clamp(28px, 4vw, 48px)",
        boxShadow: "0 8px 48px rgba(31,2,112,0.09)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}>

        {/* Icône */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#EEEEF8",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <UserIcon size={36} color="#1F0270" strokeWidth={1.5} />
          </div>
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            background: "white", borderRadius: "50%",
            padding: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}>
            <Hand size={18} color="#FFBA08" />
          </div>
        </div>

        <h1 style={{ fontSize: "clamp(26px, 2.8vw, 36px)", fontWeight: 900, color: "#1F0270", margin: "0 0 10px 0" }}>
          {lang === "en" ? "Welcome!" : "Bienvenue !"}
        </h1>

        <p style={{ fontSize: "clamp(13px, 1.2vw, 16px)", color: "#6B7280", marginBottom: 24, maxWidth: 420, lineHeight: 1.6 }}>
          {lang === "en" 
            ? "Get your SIM, manage your services quickly and securely." 
            : "Obtenez votre SIM, gérez vos services rapidement et en toute sécurité."}
        </p>

        {/* =============================================
            SÉLECTEURS LANGUE ET PROFIL
        ============================================= */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          {/* Langue */}
          <div style={{
            width: "100%", background: "#F9FAFB", borderRadius: 16,
            display: "flex", overflow: "hidden", border: "1px solid #E5E7EB"
          }}>
            {(["fr", "en"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{
                flex: 1, height: 50,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontWeight: 700, fontSize: 14,
                color: lang === l ? "#1F0270" : "#9CA3AF",
                background: lang === l ? "rgba(31,2,112,0.05)" : "transparent", 
                border: "none",
                borderBottom: lang === l ? "3px solid #1F0270" : "3px solid transparent",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                <Globe size={16} color={lang === l ? "#1F0270" : "#9CA3AF"} />
                {l === "fr" ? "Français" : "English"}
              </button>
            ))}
          </div>

          {/* Profil */}
          <div style={{
            width: "100%", background: "#F9FAFB", borderRadius: 16,
            display: "flex", overflow: "hidden", border: "1px solid #E5E7EB"
          }}>
            {([
              { key: "resident", label_fr: "Résident", label_en: "Resident", icon: <UserIcon size={16} /> },
              { key: "etranger", label_fr: "Étranger", label_en: "Foreigner", icon: <Briefcase size={16} /> },
            ] as const).map((p) => (
              <button key={p.key} onClick={() => setProfile(p.key)} style={{
                flex: 1, height: 50,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontWeight: 700, fontSize: 14,
                color: profile === p.key ? "#1F0270" : "#9CA3AF",
                background: profile === p.key ? "rgba(31,2,112,0.05)" : "transparent",
                border: "none",
                borderBottom: profile === p.key ? "3px solid #1F0270" : "3px solid transparent",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                {p.icon}
                {lang === "en" ? p.label_en : p.label_fr}
              </button>
            ))}
          </div>
        </div>

        {/* Checkbox conditions */}
        <div
          onClick={() => setAccepted(!accepted)}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px",
            border: `1.5px solid ${accepted ? "#1F0270" : "#E5E7EB"}`,
            borderRadius: 12,
            cursor: "pointer",
            marginBottom: 20,
            background: accepted ? "rgba(31,2,112,0.02)" : "#FAFAFA",
            transition: "all 0.2s",
          }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: 6, flexShrink: 0,
            background: accepted ? "#1F0270" : "transparent",
            border: `2px solid ${accepted ? "#1F0270" : "#D1D5DB"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}>
            {accepted && <Check size={14} color="white" strokeWidth={3} />}
          </div>
          <p style={{ fontSize: 13, color: "#1F0270", textAlign: "left", margin: 0, lineHeight: 1.5, userSelect: "none" }}>
            {lang === "en" ? (
              <>I accept the <strong>Terms of Use</strong> and <strong>Privacy Policy</strong></>
            ) : (
              <>J'accepte les <strong>conditions d'utilisation</strong> et la <strong>politique de confidentialité</strong></>
            )}
          </p>
        </div>

        {/* Bouton principal */}
        <button
          onClick={() => canStart && router.push("/borne/services")}
          style={{
            width: "100%", height: 58,
            background: canStart ? "#FFBA08" : "#F3F4F6",
            color: canStart ? "#1F0270" : "#9CA3AF",
            fontWeight: 800, fontSize: "clamp(16px, 1.4vw, 20px)",
            borderRadius: 14, border: "none",
            cursor: canStart ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
            boxShadow: canStart ? "0 4px 24px rgba(255,186,8,0.40)" : "none",
            transition: "all 0.2s",
          }}
        >
          {lang === "en" ? "I accept and start" : "J'accepte et je commence"}
          <div style={{
            position: "absolute", right: 14,
            width: 42, height: 42, borderRadius: "50%",
            border: `2px solid ${canStart ? "#1F0270" : "#D1D5DB"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ArrowRight size={20} color={canStart ? "#1F0270" : "#9CA3AF"} strokeWidth={2.5} />
          </div>
        </button>
      </div>

    </div>
  );
}
